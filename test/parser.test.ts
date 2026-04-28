import { describe, expect, it } from "vitest";
import { DEFAULT_COLORS } from "@/colors";
import { classifyEmoji, findAllHighlights, findHighlightAt } from "@/parser";

const palette = DEFAULT_COLORS;

describe("findHighlightAt", () => {
  it("finds a green highlight under the cursor", () => {
    const line = "before ==🟢 hello== after";
    const m = findHighlightAt(line, 10, palette);
    expect(m).not.toBeNull();
    expect(m!.start).toBe(7);
    expect(m!.end).toBe(line.indexOf(" after"));
    expect(m!.emoji).toBe("🟢");
    expect(line.slice(m!.textStart, m!.end - 2)).toBe("hello");
  });

  it("returns null when cursor is outside any highlight", () => {
    const line = "before ==🟢 hello== after";
    expect(findHighlightAt(line, 0, palette)).toBeNull();
    expect(findHighlightAt(line, 6, palette)).toBeNull();
    expect(findHighlightAt(line, line.length, palette)).toBeNull();
  });

  it("includes boundary positions (start and end inclusive)", () => {
    const line = "==🟢 a==";
    const start = 0;
    const end = line.length;
    expect(findHighlightAt(line, start, palette)).not.toBeNull();
    expect(findHighlightAt(line, end, palette)).not.toBeNull();
  });

  it("picks the highlight under the cursor when multiple exist", () => {
    const line = "==🟢 a== and ==🔴 b==";
    const first = findHighlightAt(line, 3, palette);
    const second = findHighlightAt(line, line.indexOf("🔴") - 2 + 3, palette);
    expect(first?.emoji).toBe("🟢");
    expect(second?.emoji).toBe("🔴");
  });

  it("treats a highlight without a leading emoji as default (emoji null)", () => {
    const line = "==plain text==";
    const m = findHighlightAt(line, 5, palette);
    expect(m).not.toBeNull();
    expect(m!.emoji).toBeNull();
    expect(m!.textStart).toBe(2);
    expect(line.slice(m!.textStart, m!.end - 2)).toBe("plain text");
  });

  it("handles bold inside the highlight", () => {
    const line = "==🟢 **bold** text==";
    const m = findHighlightAt(line, 5, palette);
    expect(m).not.toBeNull();
    expect(m!.emoji).toBe("🟢");
    expect(line.slice(m!.textStart, m!.end - 2)).toBe("**bold** text");
  });

  it("treats a non-palette emoji as default text", () => {
    const line = "==🐸 frog==";
    const m = findHighlightAt(line, 4, palette);
    expect(m).not.toBeNull();
    expect(m!.emoji).toBeNull();
    expect(m!.textStart).toBe(2);
  });

  it("does not require a space after the emoji", () => {
    const line = "==🟢hi==";
    const m = findHighlightAt(line, 4, palette);
    expect(m).not.toBeNull();
    expect(m!.emoji).toBe("🟢");
    expect(line.slice(m!.textStart, m!.end - 2)).toBe("hi");
  });

  it("handles an empty highlight with emoji and trailing space", () => {
    const line = "==🟢 ==";
    const m = findHighlightAt(line, 4, palette);
    expect(m).not.toBeNull();
    expect(m!.emoji).toBe("🟢");
    expect(line.slice(m!.textStart, m!.end - 2)).toBe("");
  });

  it("uses non-greedy matching for adjacent highlights", () => {
    const line = "==🟢 a==xx==🔴 b==";
    const first = findHighlightAt(line, 3, palette);
    expect(first?.emoji).toBe("🟢");
    expect(line.slice(first!.start, first!.end)).toBe("==🟢 a==");
  });
});

describe("findAllHighlights", () => {
  it("returns every highlight on the line", () => {
    const line = "==🟢 a== mid ==🔴 b== end";
    const all = findAllHighlights(line, palette);
    expect(all).toHaveLength(2);
    expect(all[0].emoji).toBe("🟢");
    expect(all[1].emoji).toBe("🔴");
  });

  it("returns an empty array when no highlights are present", () => {
    expect(findAllHighlights("plain line", palette)).toEqual([]);
  });
});

describe("classifyEmoji", () => {
  it("returns the ColorDef for a known emoji", () => {
    const c = classifyEmoji("🟢", palette);
    expect(c?.id).toBe("green");
  });

  it("returns the default color for null emoji", () => {
    const c = classifyEmoji(null, palette);
    expect(c?.id).toBe("default");
  });

  it("returns null for an unknown emoji", () => {
    expect(classifyEmoji("🐸", palette)).toBeNull();
  });
});
