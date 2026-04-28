import { type EditorState, type Range, StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";
import { ColorDotWidget, type DotClickHandler } from "./color-dot-widget";
import { DEFAULT_COLORS } from "./colors";
import { findAllHighlights } from "./parser";

export const markrRefreshEffect = StateEffect.define<null>();

export function createMarkrField(onDotClick: DotClickHandler) {
  return StateField.define<DecorationSet>({
    create(state) {
      return build(state, onDotClick);
    },
    update(decos, tr) {
      const refresh = tr.effects.some((e) => e.is(markrRefreshEffect));
      const selectionChanged = !tr.startState.selection.eq(tr.state.selection);
      if (tr.docChanged || selectionChanged || refresh) {
        return build(tr.state, onDotClick);
      }
      return decos.map(tr.changes);
    },
    provide: (f) => EditorView.decorations.from(f),
  });
}

export function build(
  source: EditorState | EditorView,
  onDotClick: DotClickHandler,
): DecorationSet {
  const state = "state" in source ? source.state : source;
  if (!state.field(editorLivePreviewField, false)) {
    return Decoration.none;
  }

  const cursor = state.selection.main.head;
  const ranges: Range<Decoration>[] = [];
  const text = state.doc.toString();
  const matches = findAllHighlights(text, DEFAULT_COLORS);

  for (const match of matches) {
    const colorId = classifyId(match.emoji);
    const cursorInside = cursor > match.start && cursor < match.end;

    ranges.push(Decoration.mark({ class: `markr-${colorId}` }).range(match.start, match.end));
    ranges.push(
      cursorInside
        ? Decoration.replace({
            widget: new ColorDotWidget(emojiFor(colorId), match.textStart, onDotClick),
          }).range(match.start, match.textStart)
        : Decoration.replace({}).range(match.start, match.textStart),
    );
    ranges.push(Decoration.replace({}).range(match.end - 2, match.end));
  }

  return Decoration.set(ranges, true);
}

function classifyId(emoji: string | null): string {
  const m = DEFAULT_COLORS.find((c) => c.emoji === emoji);
  return m ? m.id : "default";
}

function emojiFor(colorId: string): string {
  const c = DEFAULT_COLORS.find((c) => c.id === colorId);
  return c?.emoji ?? "⚪";
}
