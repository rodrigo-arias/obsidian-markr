import { type App, type Plugin, PluginSettingTab } from "obsidian";

export class MarkrSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: Plugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Markr" });
    containerEl.createEl("p", {
      text: "Multi-color highlights using standard Markdown ==text== syntax.",
      cls: "setting-item-description",
    });

    containerEl.createEl("p", {
      text: `Version ${this.plugin.manifest.version}.`,
      cls: "setting-item-description",
    });
  }
}
