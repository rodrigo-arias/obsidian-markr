import type { MarkdownPostProcessor } from "obsidian";
import { DEFAULT_COLORS } from "./colors";
import type { ColorDef } from "./types";

/**
 * Reading-view post-processor: finds every `<mark>` Obsidian rendered from
 * `==...==`, adds the matching `markr-{color}` class, and strips the leading
 * color emoji from the visible text. Source-of-truth Markdown is untouched.
 */
export function createPostProcessor(): MarkdownPostProcessor {
  return (el) => {
    el.querySelectorAll("mark").forEach((mark) => {
      decorateMark(mark as HTMLElement);
    });
  };
}

/**
 * Idempotent via the `markrDecorated` dataset flag — the post-processor can be
 * invoked multiple times on the same DOM (e.g. on partial re-renders) and we
 * must not strip the same emoji twice.
 */
function decorateMark(mark: HTMLElement): void {
  if (mark.dataset.markrDecorated) return;
  mark.dataset.markrDecorated = "true";

  const textNode = findFirstTextNode(mark);
  const text = textNode?.nodeValue ?? "";
  const cp = firstCodePoint(text);
  const matched: ColorDef | null = cp ? (DEFAULT_COLORS.find((c) => c.emoji === cp) ?? null) : null;

  const colorId = matched ? matched.id : "default";
  mark.classList.add(`markr-${colorId}`);

  if (matched && textNode) {
    stripEmojiPrefix(textNode, cp!.length);
  }
}

function findFirstTextNode(node: Node): Text | null {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = child as Text;
      if ((t.nodeValue ?? "").length > 0) return t;
    }
    const nested = findFirstTextNode(child);
    if (nested) return nested;
  }
  return null;
}

function firstCodePoint(text: string): string | null {
  if (text.length === 0) return null;
  const cp = text.codePointAt(0);
  if (cp === undefined) return null;
  return String.fromCodePoint(cp);
}

function stripEmojiPrefix(node: Text, emojiLen: number): void {
  const value = node.nodeValue ?? "";
  const stripLen = value.charAt(emojiLen) === " " ? emojiLen + 1 : emojiLen;
  node.nodeValue = value.slice(stripLen);
}
