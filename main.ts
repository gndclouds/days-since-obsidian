import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface MyPluginSettings {
  selectedDateFormat: string;
}

const DATE_FORMATS: { [key: string]: RegExp } = {
  "YYYY-MM-DD": /\b\d{4}-\d{2}-\d{2}\b/,
  "DD-MM-YYYY": /\b\d{2}-\d{2}-\d{4}\b/,
  // Add other formats as needed
};

const DEFAULT_SETTINGS: MyPluginSettings = {
  selectedDateFormat: "YYYY-MM-DD", // Default format
};

export default class MyPlugin extends Plugin {
  private tooltip: HTMLElement;
  settings: MyPluginSettings;

  private handleSelection(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = this.stripMarkdown(selection.toString().trim());
    const selectedRegex = DATE_FORMATS[this.settings.selectedDateFormat];
    const matches = selectedText.match(selectedRegex);

    if (
      matches &&
      matches.length === 1 &&
      this.isExactDateSelection(selectedText, matches[0])
    ) {
      this.showTooltip(
        matches[0],
        selection.getRangeAt(0).getBoundingClientRect()
      );
    } else {
      this.tooltip.style.display = "none"; // Hide tooltip if no single date is found
    }
  }

  private handleHover(event: MouseEvent): void {
    const hoveredElement = event.target as HTMLElement;

    // Ensure the hover event is in the file viewer by checking for a parent with a specific class or ID
    if (!hoveredElement.closest(".file-viewer-class")) {
      this.tooltip.style.display = "none"; // Hide tooltip if not in file viewer
      return;
    }

    const fileName = hoveredElement.textContent?.trim();
    if (!fileName) return;

    const selectedRegex = DATE_FORMATS[this.settings.selectedDateFormat];
    const matches = fileName.match(selectedRegex);

    if (matches && matches.length === 1) {
      this.showTooltip(matches[0], hoveredElement.getBoundingClientRect());
    } else {
      this.tooltip.style.display = "none"; // Hide tooltip if no single date is found
    }
  }

  private showTooltip(dateString: string, rect: DOMRect): void {
    try {
      const hoveredDate = new Date(dateString);
      const today = new Date();
      const timeDifference = today.getTime() - hoveredDate.getTime();
      const daysSince = Math.floor(timeDifference / (1000 * 3600 * 24));

      this.tooltip.textContent = `${daysSince} days since`;
      this.tooltip.style.left = `${Math.min(
        rect.left,
        window.innerWidth - this.tooltip.offsetWidth - 10
      )}px`;
      this.tooltip.style.top = `${Math.min(
        rect.bottom + 20,
        window.innerHeight - this.tooltip.offsetHeight - 10
      )}px`;
      this.tooltip.style.display = "block";
    } catch (error) {
      console.error("Error parsing date:", error);
      this.tooltip.style.display = "none"; // Hide tooltip on error
    }
  }

  private stripMarkdown(text: string): string {
    return text.replace(/(\*\*|__|\*|_)/g, "");
  }

  private isExactDateSelection(
    selectedText: string,
    matchedDate: string
  ): boolean {
    return (
      selectedText === matchedDate ||
      selectedText === ` ${matchedDate} ` ||
      selectedText === ` ${matchedDate}` ||
      selectedText === `${matchedDate} `
    );
  }

  async onload() {
    await this.loadSettings();
    console.log("Selected date format:", this.settings.selectedDateFormat);

    // Inject CSS styles
    this.injectStyles();

    // Create the tooltip element and apply the CSS class
    this.tooltip = document.createElement("div");
    this.tooltip.classList.add("plugin-tooltip");
    this.tooltip.style.display = "none";
    document.body.appendChild(this.tooltip);

    document.addEventListener("selectionchange", () => {
      this.handleSelection();
    });

    document.addEventListener("mouseover", (event: MouseEvent) => {
      this.handleHover(event);
    });

    document.addEventListener("mouseout", () => {
      this.tooltip.style.display = "none";
    });

    this.addSettingTab(new MyPluginSettingTab(this.app, this));
  }

  private injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .plugin-tooltip {
        position: absolute;
        background-color: var(--background-primary);
        color: var(--text-normal);
        padding: 5px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        border: 1px solid var(--background-modifier-border);
        font-family: var(--font-family);
        z-index: 1000;
      }
    `;
    document.head.appendChild(style);
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
