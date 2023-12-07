import {
  App,
  Editor,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
  selectedDateFormat: string;
}
const DATE_FORMATS = {
  "YYYY-MM-DD": /\b\d{4}-\d{2}-\d{2}\b/g,
  "DD-MM-YYYY": /\b\d{2}-\d{2}-\d{4}\b/g,
  // Add other formats as needed
};

const DEFAULT_SETTINGS: MyPluginSettings = {
  selectedDateFormat: "YYYY-MM-DD", // Default format
};

export default class MyPlugin extends Plugin {
  private handleHover(event: MouseEvent): void {
    const hoveredElement = event.target as HTMLElement;
    const hoveredText = hoveredElement.textContent || "";
    const selectedRegex = DATE_FORMATS[this.settings.selectedDateFormat];

    // Use match to find the date in the text
    const match = hoveredText.match(selectedRegex);
    if (match && match.length > 0) {
      // Use the first matched date
      const hoveredDate = new Date(match[0]);
      const today = new Date();
      const timeDifference = today.getTime() - hoveredDate.getTime();
      const daysSince = Math.floor(timeDifference / (1000 * 3600 * 24));

      // Display the result in the tooltip
      this.tooltip.textContent = `${daysSince} days since`;
      this.tooltip.style.left = `${event.clientX}px`;
      this.tooltip.style.top = `${event.clientY + 20}px`; // 20 pixels below the cursor
      this.tooltip.style.display = "block";
    }
  }

  async onload() {
    await this.loadSettings();
    console.log("Selected date format:", this.settings.selectedDateFormat);
    this.registerDomEvent(document, "mouseover", (event: MouseEvent) => {
      this.handleHover(event);
    });
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new MyPluginSettingTab(this.app, this));

    this.registerDomEvent(document, "mouseout", (event: MouseEvent) => {
      this.tooltip.style.display = "none";
    });

    this.tooltip = document.createElement("div");
    this.tooltip.setAttribute("id", "my-plugin-tooltip");
    this.tooltip.style.position = "absolute";
    this.tooltip.style.zIndex = "1000";
    this.tooltip.style.display = "none";
    // Add more styling as needed...
    document.body.appendChild(this.tooltip);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    this.tooltip.remove();
  }
}

class SampleModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.setText("Woah!");
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class MyPluginSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Date Format")
      .setDesc("Choose your preferred date format")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            "YYYY-MM-DD": "YYYY-MM-DD",
            "DD-MM-YYYY": "DD-MM-YYYY",
            // Add other formats as options
          })
          .setValue(this.plugin.settings.selectedDateFormat)
          .onChange(async (value) => {
            this.plugin.settings.selectedDateFormat = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
