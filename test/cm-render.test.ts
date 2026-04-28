// @vitest-environment happy-dom
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { editorLivePreviewField } from "obsidian";
import { describe, expect, it } from "vitest";
import { createMarkrField } from "@/cm-extension";

function mount(doc: string, cursorPos: number) {
  const anchor = Math.min(cursorPos, doc.length);
  const state = EditorState.create({
    doc,
    selection: { anchor },
    extensions: [editorLivePreviewField, createMarkrField(() => {})],
  });
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  const view = new EditorView({ state, parent });
  return { view, parent };
}

describe("CM6 actual DOM rendering", () => {
  it("renders the color emoji when cursor is inside a colored highlight", () => {
    const { parent, view } = mount("==🟢 hello==", 5);
    const dot = parent.querySelector(".markr-dot");
    expect(dot).toBeTruthy();
    expect(dot!.textContent).toBe("🟢");
    view.destroy();
    parent.remove();
  });

  it("renders the default emoji for highlights without a color", () => {
    const { parent, view } = mount("==hello==", 5);
    const dot = parent.querySelector(".markr-dot");
    expect(dot).toBeTruthy();
    expect(dot!.textContent).toBe("⚪");
    view.destroy();
    parent.remove();
  });

  it("does NOT render the dot when cursor is outside the highlight", () => {
    const { parent, view } = mount("==🟢 hello== plain text", 20);
    expect(parent.querySelector(".markr-dot")).toBeNull();
    view.destroy();
    parent.remove();
  });
});
