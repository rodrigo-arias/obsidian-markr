import type { EditorView } from "@codemirror/view";
import { type Editor, MarkdownView, Plugin } from "obsidian";
import { createMarkrField, markrRefreshEffect } from "@/cm-extension";
import { openColorPicker } from "@/color-picker";
import { DEFAULT_COLORS } from "@/colors";
import { removeHighlight } from "@/editor-ops";
import { createPostProcessor } from "@/post-processor";
import { DEFAULT_SETTINGS, type MarkrSettings, MarkrSettingTab } from "@/settings";

export default class MarkrPlugin extends Plugin {
  settings!: MarkrSettings;

  async onload() {
    console.log(`[Markr] loaded v${this.manifest.version}`);

    await this.loadSettings();
    this.applyPalette();

    this.registerMarkdownPostProcessor(createPostProcessor());

    this.registerEditorExtension(createMarkrField((view, pos) => this.openPickerAt(view, pos)));

    this.addCommand({
      id: "open-color-picker",
      name: "Open color picker",
      editorCallback: (editor: Editor) => openColorPicker(editor),
    });

    this.addCommand({
      id: "remove-highlight",
      name: "Remove highlight",
      editorCallback: (editor: Editor) => removeHighlight(editor, DEFAULT_COLORS),
    });

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        menu.addItem((item) =>
          item
            .setTitle("Highlight")
            .setIcon("paintbrush")
            .onClick(() => openColorPicker(editor)),
        );
      }),
    );

    this.addSettingTab(new MarkrSettingTab(this.app, this));
  }

  onunload() {
    delete document.body.dataset.markrPalette;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.applyPalette();
  }

  applyPalette() {
    document.body.dataset.markrPalette = this.settings.palette;
  }

  private openPickerAt(view: EditorView, pos: number) {
    const editor = this.app.workspace.activeEditor?.editor;
    if (!editor) return;
    const lineInfo = view.state.doc.lineAt(pos);
    editor.setCursor({ line: lineInfo.number - 1, ch: pos - lineInfo.from });
    openColorPicker(editor);
  }

  refreshAllViews() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) return;
      const cm = (view.editor as unknown as { cm?: { dispatch: (spec: unknown) => void } }).cm;
      cm?.dispatch({ effects: markrRefreshEffect.of(null) });
      view.previewMode?.rerender(true);
    });
  }
}
