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

class ClickOutsideDirective extends DirectiveBase {
  constructor() {
    super({
      name: "click-outside",
      description: "\u70B9\u51FB\u5143\u7D20\u5916\u90E8\u65F6\u89E6\u53D1\u56DE\u8C03",
      version: "1.0.0",
      category: "interaction",
      tags: ["click", "outside", "interaction"]
    });
    this.documentHandler = null;
  }
  mounted(el, binding) {
    const config = this.parseConfig(binding);
    if (!config.handler || typeof config.handler !== "function") {
      this.warn("click-outside directive requires a handler function");
      return;
    }
    const handler = (event) => {
      if (config.disabled) {
        return;
      }
      const target = event.target;
      if (el.contains(target)) {
        return;
      }
      if (config.exclude && config.exclude.length > 0) {
        const isExcluded = config.exclude.some((item) => {
          if (typeof item === "string") {
            const excludeEl = document.querySelector(item);
            return excludeEl && excludeEl.contains(target);
          } else if (item instanceof HTMLElement) {
            return item.contains(target);
          }
          return false;
        });
        if (isExcluded) {
          return;
        }
      }
      if (config.handler) {
        config.handler(event);
      }
    };
    this.documentHandler = handler;
    directiveUtils.storeData(el, "click-outside-handler", handler);
    document.addEventListener("click", handler, config.capture ?? true);
    this.log(`Directive mounted on element`, el);
  }
  updated(el, binding) {
    const oldHandler = directiveUtils.getData(el, "click-outside-handler");
    if (oldHandler) {
      document.removeEventListener("click", oldHandler, true);
      document.removeEventListener("click", oldHandler, false);
    }
    this.mounted(el, binding);
    this.log(`Directive updated on element`, el);
  }
  unmounted(el) {
    const handler = directiveUtils.getData(el, "click-outside-handler");
    if (handler) {
      document.removeEventListener("click", handler, true);
      document.removeEventListener("click", handler, false);
      directiveUtils.removeData(el, "click-outside-handler");
    }
    this.documentHandler = null;
    this.log(`Directive unmounted from element`, el);
  }
  parseConfig(binding) {
    const value = binding.value;
    if (typeof value === "function") {
      return { handler: value };
    }
    if (typeof value === "object" && value !== null) {
      const v = value;
      return {
        handler: v.handler,
        exclude: v.exclude,
        capture: v.capture,
        disabled: v.disabled
      };
    }
    return {};
  }
  getExample() {
    return `
<!-- Basic usage -->
<div v-click-outside="handleClickOutside">
  Click outside me
</div>

<!-- With options -->
<div v-click-outside="{
  handler: handleClickOutside,
  exclude: ['.modal', '#dropdown'],
  capture: true,
  disabled: false
}">
  Advanced click outside
</div>

<script setup>
const handleClickOutside = (event) => {
  
  // Close dropdown, modal, etc.
}
<\/script>
    `;
  }
}
const vClickOutside = defineDirective(new ClickOutsideDirective());

export { ClickOutsideDirective, vClickOutside as default, vClickOutside };
//# sourceMappingURL=click-outside.js.map
