// @vitest-environment happy-dom
import { EditorState } from "@codemirror/state";
import type { Decoration } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";
import { describe, expect, it } from "vitest";
import { build } from "@/cm-extension";

interface RangeSummary {
  from: number;
  to: number;
  type: "mark" | "replace";
  className?: string;
  hasWidget: boolean;
}

function makeState(doc: string, cursorPos: number): EditorState {
  const anchor = Math.min(cursorPos, doc.length);
  return EditorState.create({
    doc,
    selection: { anchor },
    extensions: [editorLivePreviewField],
  });
}

function summarize(set: ReturnType<typeof Decoration.set>): RangeSummary[] {
  const out: RangeSummary[] = [];
  set.between(0, 1_000_000, (from, to, value) => {
    const spec = (value as unknown as { spec?: { class?: string; widget?: unknown } }).spec ?? {};
    out.push({
      from,
      to,
      type: spec.class ? "mark" : "replace",
      className: spec.class,
      hasWidget: !!spec.widget,
    });
  });
  return out;
}

const noopClick = () => {};

function run(doc: string, cursorPos: number) {
  const state = makeState(doc, cursorPos);
  return summarize(build(state, noopClick));
}

describe("cmExtension build — color mark", () => {
  it("marks the highlight range with the color class regardless of cursor", () => {
    const ranges = run("==🟢 hello==", 100);
    const mark = ranges.find((r) => r.type === "mark");
    expect(mark).toBeDefined();
    expect(mark!.className).toBe("markr-green");
    expect(mark!.from).toBe(0);
    expect(mark!.to).toBe("==🟢 hello==".length);
  });
});

describe("cmExtension build — opening prefix", () => {
  it("hides the opening ==[emoji ] with an empty replace when cursor is outside", () => {
    const ranges = run("==🟢 hello==", 100);
    const opening = ranges.find((r) => r.from === 0 && r.type === "replace");
    expect(opening).toBeDefined();
    expect(opening!.hasWidget).toBe(false);
    expect(opening!.to).toBe(2 + "🟢 ".length);
  });
});

describe("cmExtension build — dot widget", () => {
  it("replaces the opening ==[emoji ] with a widget when cursor is inside", () => {
    const doc = "==🟢 hello==";
    const ranges = run(doc, 5);
    const dot = ranges.find((r) => r.hasWidget);
    expect(dot).toBeDefined();
    expect(dot!.from).toBe(0);
    expect(dot!.to).toBe(2 + "🟢 ".length);
  });

  it("does not emit the widget when cursor is outside", () => {
    const ranges = run("==🟢 hello== plain", 15);
    expect(ranges.find((r) => r.hasWidget)).toBeUndefined();
  });

  it("emits a widget for default highlights too", () => {
    const ranges = run("==hello==", 5);
    const dot = ranges.find((r) => r.hasWidget);
    expect(dot).toBeDefined();
    expect(dot!.from).toBe(0);
    expect(dot!.to).toBe(2);
  });
});

describe("cmExtension build — closing markers", () => {
  it("hides the closing == always", () => {
    const doc = "==🟢 hello==";
    for (const pos of [100, 5, 0, doc.length]) {
      const ranges = run(doc, pos);
      const closing = ranges.find(
        (r) => r.to === doc.length && r.type === "replace" && !r.hasWidget && r.from > 0,
      );
      expect(closing, `cursor=${pos}`).toBeDefined();
      expect(closing!.from).toBe(doc.length - 2);
    }
  });
});
