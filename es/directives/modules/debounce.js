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

class DebounceDirective extends DirectiveBase {
  constructor() {
    super({
      name: "debounce",
      description: "\u9632\u6296\u5904\u7406\uFF0C\u907F\u514D\u9891\u7E41\u89E6\u53D1",
      version: "1.0.0",
      category: "performance",
      tags: ["debounce", "throttle", "performance", "event"]
    });
  }
  mounted(el, binding) {
    const config = this.parseConfig(binding);
    if (!config.handler || typeof config.handler !== "function") {
      this.warn("Debounce directive requires a handler function");
      return;
    }
    const delay = config.delay ?? 300;
    const event = config.event ?? "click";
    const immediate = config.immediate ?? false;
    let timeoutId = null;
    const debouncedHandler = (...args) => {
      if (config.disabled) {
        return;
      }
      const later = () => {
        timeoutId = null;
        if (!immediate && config.handler) {
          config.handler(...args);
          this.log(`Debounced event triggered after ${delay}ms`);
        }
      };
      const callNow = immediate && !timeoutId;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(later, delay);
      if (callNow && config.handler) {
        config.handler(...args);
        this.log(`Immediate debounced event triggered`);
      }
    };
    directiveUtils.storeData(el, "debounce-handler", debouncedHandler);
    directiveUtils.storeData(el, "debounce-event", event);
    directiveUtils.storeData(el, "debounce-timeout", timeoutId);
    el.addEventListener(event, debouncedHandler);
    this.log(`Debounce directive mounted on element with ${delay}ms delay`, el);
  }
  updated(el, binding) {
    const oldHandler = directiveUtils.getData(el, "debounce-handler");
    const oldEvent = directiveUtils.getData(el, "debounce-event");
    const oldTimeout = directiveUtils.getData(el, "debounce-timeout");
    if (oldHandler && oldEvent) {
      el.removeEventListener(oldEvent, oldHandler);
    }
    if (oldTimeout) {
      clearTimeout(oldTimeout);
    }
    this.mounted(el, binding);
    this.log(`Debounce directive updated on element`, el);
  }
  unmounted(el) {
    const handler = directiveUtils.getData(el, "debounce-handler");
    const event = directiveUtils.getData(el, "debounce-event");
    const timeout = directiveUtils.getData(el, "debounce-timeout");
    if (handler && event) {
      el.removeEventListener(event, handler);
    }
    if (timeout) {
      clearTimeout(timeout);
    }
    directiveUtils.removeData(el, "debounce-handler");
    directiveUtils.removeData(el, "debounce-event");
    directiveUtils.removeData(el, "debounce-timeout");
    this.log(`Debounce directive unmounted from element`, el);
  }
  parseConfig(binding) {
    const value = binding.value;
    if (typeof value === "function") {
      return { handler: value };
    }
    if (typeof value === "object" && value !== null) {
      return value;
    }
    return {};
  }
  getExample() {
    return `
<!-- Basic debounce with default 300ms delay -->
<input v-debounce="handleSearch" placeholder="Search...">

<!-- Custom delay -->
<button v-debounce="{
  handler: handleClick,
  delay: 500
}">
  Debounced Click (500ms)
</button>

<!-- Different event -->
<input v-debounce="{
  handler: handleInput,
  event: 'input',
  delay: 300
}" placeholder="Type something...">

<!-- Immediate mode (triggers on leading edge) -->
<button v-debounce="{
  handler: saveData,
  delay: 1000,
  immediate: true
}">
  Save (immediate)
</button>

<!-- Conditional debounce -->
<button v-debounce="{
  handler: submitForm,
  delay: 500,
  disabled: isSubmitting
}">
  Submit
</button>

<script setup>
const handleSearch = (event) => {
  
}

const handleClick = () => {
  
}

const handleInput = (event) => {
  
}

const saveData = () => {
  
}

const submitForm = () => {
  
}
<\/script>
    `;
  }
}
const vDebounce = defineDirective(new DebounceDirective());

export { DebounceDirective, vDebounce as default, vDebounce };
//# sourceMappingURL=debounce.js.map
