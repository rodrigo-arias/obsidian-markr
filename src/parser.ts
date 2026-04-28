import type { ColorDef } from "./types";

export interface HighlightMatch {
  start: number;
  end: number;
  inner: string;
  innerStart: number;
  emoji: string | null;
  textStart: number;
}

const HIGHLIGHT_RE = /==(.+?)==/g;

export function findHighlightAt(
  line: string,
  ch: number,
  palette: ColorDef[],
): HighlightMatch | null {
  for (const m of line.matchAll(HIGHLIGHT_RE)) {
    const start = m.index;
    const end = start + m[0].length;
    if (ch >= start && ch <= end) {
      return buildMatch(start, end, m[1], palette);
    }
  }
  return null;
}

export function findAllHighlights(line: string, palette: ColorDef[]): HighlightMatch[] {
  const out: HighlightMatch[] = [];
  for (const m of line.matchAll(HIGHLIGHT_RE)) {
    const start = m.index;
    const end = start + m[0].length;
    out.push(buildMatch(start, end, m[1], palette));
  }
  return out;
}

function buildMatch(
  start: number,
  end: number,
  inner: string,
  palette: ColorDef[],
): HighlightMatch {
  const innerStart = start + 2;
  const { emoji, offsetAfter } = parseEmojiPrefix(inner, palette);
  return {
    start,
    end,
    inner,
    innerStart,
    emoji,
    textStart: innerStart + offsetAfter,
  };
}

function parseEmojiPrefix(
  inner: string,
  palette: ColorDef[],
): { emoji: string | null; offsetAfter: number } {
  if (inner.length === 0) return { emoji: null, offsetAfter: 0 };
  const codePoint = inner.codePointAt(0);
  if (codePoint === undefined) return { emoji: null, offsetAfter: 0 };
  const cp = String.fromCodePoint(codePoint);
  if (!palette.some((c) => c.emoji === cp)) {
    return { emoji: null, offsetAfter: 0 };
  }
  let offset = cp.length;
  if (inner.charAt(offset) === " ") offset += 1;
  return { emoji: cp, offsetAfter: offset };
}

export function classifyEmoji(emoji: string | null, palette: ColorDef[]): ColorDef | null {
  return palette.find((c) => c.emoji === emoji) ?? null;
}

export function emojiByteLength(emoji: string): number {
  return emoji.length;
}
