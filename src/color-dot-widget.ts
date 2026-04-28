import { type EditorView, WidgetType } from "@codemirror/view";

export type DotClickHandler = (view: EditorView, pos: number) => void;

export class ColorDotWidget extends WidgetType {
  constructor(
    private readonly emoji: string,
    private readonly pos: number,
    private readonly onClick: DotClickHandler,
  ) {
    super();
  }

  eq(other: ColorDotWidget): boolean {
    return other.emoji === this.emoji && other.pos === this.pos;
  }

  toDOM(view: EditorView): HTMLElement {
    const el = document.createElement("span");
    el.className = "markr-dot";
    el.textContent = this.emoji;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "Change highlight color");
    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onClick(view, this.pos);
    });
    return el;
  }

  ignoreEvent(): boolean {
    return false;
  }
}
