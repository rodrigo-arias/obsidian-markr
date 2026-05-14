import { type Editor, Menu } from "obsidian";
import { DEFAULT_COLORS } from "./colors";
import { applyColor } from "./editor-ops";
import type { ColorDef } from "./types";

/**
 * Show the palette as an Obsidian native `Menu`. Anchors at `evt` when given
 * (right-click / touch); otherwise at the editor caret.
 *
 * Items use emoji-in-title rather than `setIcon()` because macOS's native menu
 * doesn't render icons — emoji as text is the only way to show a color hint
 * there.
 */
export function openColorPicker(editor: Editor, evt?: MouseEvent): void {
  const menu = new Menu();
  for (const color of DEFAULT_COLORS) {
    menu.addItem((item) => {
      item.setTitle(menuTitle(color));
      item.onClick(() => applyColor(editor, color, DEFAULT_COLORS));
    });
    if (color.id === "default") menu.addSeparator();
  }

  if (evt) {
    menu.showAtMouseEvent(evt);
    return;
  }

  const coords = cursorCoords(editor);
  menu.showAtPosition(coords ?? { x: 0, y: 0 });
}

function menuTitle(color: ColorDef): string {
  return `${color.emoji ?? "⚪"} ${color.name}`;
}

interface EditorWithCm {
  cm?: {
    coordsAtPos?: (
      pos: number,
    ) => { left: number; top: number; bottom: number; right: number } | null;
    state?: { selection: { main: { head: number } } };
  };
}

function cursorCoords(editor: Editor): { x: number; y: number } | null {
  const cm = (editor as unknown as EditorWithCm).cm;
  if (!cm?.coordsAtPos || !cm.state) return null;
  const head = cm.state.selection.main.head;
  const c = cm.coordsAtPos(head);
  if (!c) return null;
  return { x: c.left, y: c.bottom };
}
