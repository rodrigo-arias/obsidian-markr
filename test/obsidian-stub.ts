import { StateField } from "@codemirror/state";

export const editorLivePreviewField = StateField.define<boolean>({
  create: () => true,
  update: (v) => v,
});

export class MarkdownPostProcessor {}
export class Plugin {}
export class PluginSettingTab {}
export class Setting {}
export class Notice {}
export class Menu {}
export class MarkdownView {}
export type Editor = unknown;
export type App = unknown;
