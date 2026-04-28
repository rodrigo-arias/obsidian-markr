import { classifyEmoji, findHighlightAt, type HighlightMatch } from "./parser";
import type { ColorDef } from "./types";

export interface EditorPos {
  line: number;
  ch: number;
}

export interface EditorLike {
  getLine(line: number): string;
  getCursor(which?: "from" | "to" | "head" | "anchor"): EditorPos;
  somethingSelected(): boolean;
  replaceRange(replacement: string, from: EditorPos, to?: EditorPos): void;
  setCursor(pos: EditorPos): void;
  setSelection(anchor: EditorPos, head?: EditorPos): void;
}

export function applyColor(editor: EditorLike, color: ColorDef, palette: ColorDef[]): void {
  const from = editor.getCursor("from");
  const to = editor.getCursor("to");

  if (!editor.somethingSelected()) {
    handleCursorOnly(editor, from, color, palette);
    return;
  }

  if (from.line !== to.line) {
    return;
  }

  handleSelection(editor, from, to, color, palette);
}

export function removeHighlight(editor: EditorLike, palette: ColorDef[]): void {
  const from = editor.getCursor("from");
  const to = editor.getCursor("to");

  if (!editor.somethingSelected()) {
    const line = editor.getLine(from.line);
    const match = findHighlightAt(line, from.ch, palette);
    if (!match) return;
    const text = innerText(match);
    editor.replaceRange(
      text,
      { line: from.line, ch: match.start },
      { line: from.line, ch: match.end },
    );
    editor.setCursor({ line: from.line, ch: match.start + text.length });
    return;
  }

  if (from.line !== to.line) return;

  const line = editor.getLine(from.line);
  const matchFrom = findHighlightAt(line, from.ch, palette);
  const matchTo = findHighlightAt(line, to.ch, palette);
  let expStart = from.ch;
  let expEnd = to.ch;
  if (matchFrom) expStart = Math.min(expStart, matchFrom.start);
  if (matchTo) expEnd = Math.max(expEnd, matchTo.end);
  const slice = line.slice(expStart, expEnd);
  const stripped = stripAllHighlightMarkers(slice, palette);
  editor.replaceRange(stripped, { line: from.line, ch: expStart }, { line: from.line, ch: expEnd });
  editor.setCursor({ line: from.line, ch: expStart + stripped.length });
}

function handleCursorOnly(
  editor: EditorLike,
  cursor: EditorPos,
  color: ColorDef,
  palette: ColorDef[],
): void {
  const line = editor.getLine(cursor.line);
  const match = findHighlightAt(line, cursor.ch, palette);
  if (match) {
    applyToSpan(editor, cursor.line, match, color, palette);
    return;
  }
  insertEmpty(editor, cursor, color);
}

function handleSelection(
  editor: EditorLike,
  from: EditorPos,
  to: EditorPos,
  color: ColorDef,
  palette: ColorDef[],
): void {
  const line = editor.getLine(from.line);
  const matchFrom = findHighlightAt(line, from.ch, palette);
  const matchTo = findHighlightAt(line, to.ch, palette);

  if (matchFrom && matchTo && matchFrom.start === matchTo.start && matchFrom.end === matchTo.end) {
    applyToSpan(editor, from.line, matchFrom, color, palette);
    return;
  }

  let expStart = from.ch;
  let expEnd = to.ch;
  if (matchFrom) expStart = Math.min(expStart, matchFrom.start);
  if (matchTo) expEnd = Math.max(expEnd, matchTo.end);

  const slice = line.slice(expStart, expEnd);
  const stripped = stripAllHighlightMarkers(slice, palette).trim();
  const wrapped = wrap(stripped, color);

  editor.replaceRange(wrapped, { line: from.line, ch: expStart }, { line: from.line, ch: expEnd });
  editor.setSelection(
    { line: from.line, ch: expStart },
    { line: from.line, ch: expStart + wrapped.length },
  );
}

function applyToSpan(
  editor: EditorLike,
  lineNum: number,
  match: HighlightMatch,
  newColor: ColorDef,
  palette: ColorDef[],
): void {
  const current = classifyEmoji(match.emoji, palette);
  const text = innerText(match);

  if (current && current.id === newColor.id) {
    editor.replaceRange(text, { line: lineNum, ch: match.start }, { line: lineNum, ch: match.end });
    editor.setCursor({ line: lineNum, ch: match.start + text.length });
    return;
  }

  const wrapped = wrap(text, newColor);
  editor.replaceRange(
    wrapped,
    { line: lineNum, ch: match.start },
    { line: lineNum, ch: match.end },
  );
  editor.setCursor({ line: lineNum, ch: match.start + wrapped.length });
}

function insertEmpty(editor: EditorLike, cursor: EditorPos, color: ColorDef): void {
  if (color.emoji) {
    const ins = `==${color.emoji} ==`;
    editor.replaceRange(ins, cursor, cursor);
    editor.setCursor({ line: cursor.line, ch: cursor.ch + ins.length - 2 });
    return;
  }
  const ins = "====";
  editor.replaceRange(ins, cursor, cursor);
  editor.setCursor({ line: cursor.line, ch: cursor.ch + 2 });
}

function wrap(text: string, color: ColorDef): string {
  if (color.emoji) {
    return text.length === 0 ? `==${color.emoji} ==` : `==${color.emoji} ${text}==`;
  }
  return `==${text}==`;
}

function innerText(match: HighlightMatch): string {
  return match.inner.slice(match.textStart - match.innerStart);
}

export function stripAllHighlightMarkers(text: string, palette: ColorDef[]): string {
  const re = /==(.+?)==/g;
  let result = "";
  let lastIndex = 0;
  for (const m of text.matchAll(re)) {
    result += text.slice(lastIndex, m.index);
    const inner = m[1];
    const codePoint = inner.codePointAt(0);
    const cp = codePoint !== undefined ? String.fromCodePoint(codePoint) : "";
    if (cp && palette.some((c) => c.emoji === cp)) {
      let offset = cp.length;
      if (inner.charAt(offset) === " ") offset += 1;
      result += inner.slice(offset);
    } else {
      result += inner;
    }
    lastIndex = m.index + m[0].length;
  }
  result += text.slice(lastIndex);
  return result;
}
