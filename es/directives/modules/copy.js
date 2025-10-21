/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { DirectiveBase } from '../base/directive-base.js';
import { defineDirective, directiveUtils } from '../base/vue-directive-adapter.js';

class CopyDirective extends DirectiveBase {
  constructor() {
    super({
      name: "copy",
      description: "\u70B9\u51FB\u590D\u5236\u5185\u5BB9\u5230\u526A\u8D34\u677F",
      version: "1.0.0",
      category: "interaction",
      tags: ["copy", "clipboard", "interaction"]
    });
  }
  mounted(el, binding) {
    const config = this.parseConfig(binding);
    const handleClick = async () => {
      if (config.disabled) {
        return;
      }
      try {
        const textToCopy = this.getText(config, el);
        await this.copyToClipboard(textToCopy);
        if (config.onSuccess) {
          config.onSuccess(textToCopy);
        }
        this.log(`Copied to clipboard: ${textToCopy}`);
      } catch (error) {
        const err = error;
        if (config.onError) {
          config.onError(err);
        }
        this.warn(`Failed to copy: ${err.message}`);
      }
    };
    directiveUtils.storeData(el, "copy-handler", handleClick);
    el.addEventListener("click", handleClick);
    el.style.cursor = "pointer";
    if (config.immediate) {
      handleClick();
    }
    this.log(`Copy directive mounted on element`, el);
  }
  updated(el, binding) {
    const oldHandler = directiveUtils.getData(el, "copy-handler");
    if (oldHandler) {
      el.removeEventListener("click", oldHandler);
    }
    this.mounted(el, binding);
    this.log(`Copy directive updated on element`, el);
  }
  unmounted(el) {
    const handler = directiveUtils.getData(el, "copy-handler");
    if (handler) {
      el.removeEventListener("click", handler);
      directiveUtils.removeData(el, "copy-handler");
    }
    el.style.cursor = "";
    this.log(`Copy directive unmounted from element`, el);
  }
  getText(config, el) {
    if (config.text) {
      return typeof config.text === "function" ? config.text() : config.text;
    }
    const input = el;
    if (input.value !== void 0) {
      return input.value;
    }
    return el.textContent || "";
  }
  async copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.left = "-999999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const successful = document.execCommand("copy");
      if (!successful) {
        throw new Error("Copy command failed");
      }
    } finally {
      document.body.removeChild(textarea);
    }
  }
  parseConfig(binding) {
    const value = binding.value;
    if (typeof value === "string") {
      return { text: value };
    }
    if (typeof value === "function") {
      return { text: value };
    }
    if (typeof value === "object" && value !== null) {
      return value;
    }
    return {};
  }
  getExample() {
    return `
<!-- Copy static text -->
<button v-copy="'Hello, World!'">
  Copy Text
</button>

<!-- Copy from element content -->
<div v-copy>
  This content will be copied
</div>

<!-- Copy from input value -->
<input v-copy value="Copy this value" />

<!-- With options -->
<button v-copy="{
  text: 'Custom text to copy',
  onSuccess: (text) => ,
  onError: (error) => console.error('Failed:', error),
  disabled: false
}">
  Copy with Options
</button>

<!-- Dynamic text -->
<button v-copy="{
  text: () => new Date().toISOString(),
  onSuccess: () => showToast('Copied!')
}">
  Copy Current Time
</button>
    `;
  }
}
const vCopy = defineDirective(new CopyDirective());

export { CopyDirective, vCopy as default, vCopy };
//# sourceMappingURL=copy.js.map
