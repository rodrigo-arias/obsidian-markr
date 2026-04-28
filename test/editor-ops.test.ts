import { describe, expect, it } from "vitest";
import { DEFAULT_COLORS } from "@/colors";
import { applyColor, type EditorLike, type EditorPos, removeHighlight } from "@/editor-ops";
import type { ColorDef } from "@/types";

const palette = DEFAULT_COLORS;
const green = palette.find((c) => c.id === "green")!;
const red = palette.find((c) => c.id === "red")!;
const def = palette.find((c) => c.id === "default")!;

class FakeEditor implements EditorLike {
  private lines: string[];
  private from: EditorPos;
  private to: EditorPos;

  constructor(text: string, from: EditorPos, to?: EditorPos) {
    this.lines = text.split("\n");
    this.from = { ...from };
    this.to = to ? { ...to } : { ...from };
  }

  static cursor(text: string, line: number, ch: number) {
    return new FakeEditor(text, { line, ch });
  }

  static selection(text: string, fromCh: number, toCh: number, line = 0) {
    return new FakeEditor(text, { line, ch: fromCh }, { line, ch: toCh });
  }

  getLine(line: number): string {
    return this.lines[line];
  }

  getCursor(which?: "from" | "to" | "head" | "anchor"): EditorPos {
    if (which === "to" || which === "head") return { ...this.to };
    return { ...this.from };
  }

  somethingSelected(): boolean {
    return this.from.line !== this.to.line || this.from.ch !== this.to.ch;
  }

  replaceRange(replacement: string, from: EditorPos, to?: EditorPos): void {
    const end = to ?? from;
    if (from.line !== end.line) throw new Error("multi-line not supported");
    const line = this.lines[from.line];
    this.lines[from.line] = line.slice(0, from.ch) + replacement + line.slice(end.ch);
  }

  setCursor(pos: EditorPos): void {
    this.from = { ...pos };
    this.to = { ...pos };
  }

  setSelection(anchor: EditorPos, head?: EditorPos): void {
    this.from = { ...anchor };
    this.to = head ? { ...head } : { ...anchor };
  }

  text(): string {
    return this.lines.join("\n");
  }

  cursor(): EditorPos {
    return this.from;
  }
}

function run(
  text: string,
  selection: { from: number; to?: number; line?: number },
  color: ColorDef,
) {
  const ed = new FakeEditor(
    text,
    { line: selection.line ?? 0, ch: selection.from },
    { line: selection.line ?? 0, ch: selection.to ?? selection.from },
  );
  applyColor(ed, color, palette);
  return ed;
}

describe("applyColor — case 1: plain selection wraps", () => {
  it("wraps plain selected text with the color emoji", () => {
    const ed = run("hello world", { from: 0, to: 5 }, green);
    expect(ed.text()).toBe("==🟢 hello== world");
  });

  it("wraps with no emoji for the default color", () => {
    const ed = run("hello world", { from: 0, to: 5 }, def);
    expect(ed.text()).toBe("==hello== world");
  });
});

describe("applyColor — case 2: same color toggles off", () => {
  it("unwraps when applied to its own color", () => {
    const ed = run("==🟢 hello== world", { from: 4 }, green);
    expect(ed.text()).toBe("hello world");
  });

  it("unwraps default highlight when default color is applied", () => {
    const ed = run("==hello== world", { from: 4 }, def);
    expect(ed.text()).toBe("hello world");
  });
});

describe("applyColor — case 3: different color swaps emoji", () => {
  it("swaps green to red without nesting", () => {
    const ed = run("==🟢 hello==", { from: 5 }, red);
    expect(ed.text()).toBe("==🔴 hello==");
  });

  it("swaps default to green by inserting emoji", () => {
    const ed = run("==hello==", { from: 4 }, green);
    expect(ed.text()).toBe("==🟢 hello==");
  });

  it("swaps green to default by stripping emoji", () => {
    const ed = run("==🟢 hello==", { from: 5 }, def);
    expect(ed.text()).toBe("==hello==");
  });
});

describe("applyColor — case 5: cursor inside highlight operates on whole span", () => {
  it("operates on the enclosing span when no selection", () => {
    const ed = run("a ==🟢 hello== b", { from: 7 }, red);
    expect(ed.text()).toBe("a ==🔴 hello== b");
  });

  it("targets only the span under the cursor with multiple highlights", () => {
    const ed = run("==🟢 a== ==🔴 b==", { from: 12 }, green);
    expect(ed.text()).toBe("==🟢 a== ==🟢 b==");
  });
});

describe("applyColor — case 6: cursor on plain text inserts empty highlight", () => {
  it("inserts ==🟢 == and places the cursor before the closing markers", () => {
    const ed = run("plain", { from: 5 }, green);
    expect(ed.text()).toBe("plain==🟢 ==");
    expect(ed.cursor()).toEqual({ line: 0, ch: 5 + "==🟢 ".length });
  });

  it("inserts ==== for the default color and places the cursor between", () => {
    const ed = run("plain", { from: 5 }, def);
    expect(ed.text()).toBe("plain====");
    expect(ed.cursor()).toEqual({ line: 0, ch: 7 });
  });
});

describe("applyColor — boundary-crossing selection", () => {
  it("extends the wrap when the selection crosses a highlight boundary", () => {
    const ed = run("==🟢 abc== def", { from: 6, to: 12 }, red);
    expect(ed.text()).toBe("==🔴 abc d==ef");
  });

  it("strips an inner highlight when the selection covers it entirely", () => {
    const line = "foo ==🟢 abc== bar";
    const ed = run(line, { from: 0, to: line.length }, red);
    expect(ed.text()).toBe("==🔴 foo abc bar==");
  });
});

describe("applyColor — defaults preserved", () => {
  it("preserves nested bold formatting inside the highlight", () => {
    const ed = run("==🟢 **bold** rest==", { from: 8 }, red);
    expect(ed.text()).toBe("==🔴 **bold** rest==");
  });
});

describe("removeHighlight", () => {
  it("removes the enclosing highlight under the cursor", () => {
    const ed = new FakeEditor("a ==🟢 hello== b", { line: 0, ch: 7 });
    removeHighlight(ed, palette);
    expect(ed.text()).toBe("a hello b");
  });

  it("strips emojis from a stretch of multiple highlights selected", () => {
    const ed = new FakeEditor(
      "==🟢 a== mid ==🔴 b==",
      { line: 0, ch: 0 },
      { line: 0, ch: "==🟢 a== mid ==🔴 b==".length },
    );
    removeHighlight(ed, palette);
    expect(ed.text()).toBe("a mid b");
  });

  it("is a no-op when the cursor is outside any highlight", () => {
    const ed = new FakeEditor("plain text", { line: 0, ch: 3 });
    removeHighlight(ed, palette);
    expect(ed.text()).toBe("plain text");
  });
});
