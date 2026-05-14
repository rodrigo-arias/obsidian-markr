import { type App, PluginSettingTab, Setting } from "obsidian";
import type MarkrPlugin from "../main";

export type Palette = "subtle" | "neutral" | "bold";

export interface MarkrSettings {
  palette: Palette;
}

export const DEFAULT_SETTINGS: MarkrSettings = {
  palette: "neutral",
};

export class MarkrSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: MarkrPlugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Palette")
      .setDesc(
        "Highlight intensity. Subtle suits light themes, Bold suits dark or OLED themes, Neutral works on both.",
      )
      .addDropdown((dd) =>
        dd
          .addOption("subtle", "Subtle")
          .addOption("neutral", "Neutral")
          .addOption("bold", "Bold")
          .setValue(this.plugin.settings.palette)
          .onChange(async (value) => {
            this.plugin.settings.palette = value as Palette;
            await this.plugin.saveSettings();
          }),
      );
  }
}
