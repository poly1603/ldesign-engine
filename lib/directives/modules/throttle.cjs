/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:09 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var directiveBase = require('../base/directive-base.cjs');
var vueDirectiveAdapter = require('../base/vue-directive-adapter.cjs');

class ThrottleDirective extends directiveBase.DirectiveBase {
  constructor() {
    super({
      name: "throttle",
      description: "\u8282\u6D41\u5904\u7406\uFF0C\u9650\u5236\u89E6\u53D1\u9891\u7387",
      version: "1.0.0",
      category: "performance",
      tags: ["throttle", "performance", "event"]
    });
  }
  mounted(el, binding) {
    const config = this.parseConfig(binding);
    if (!config.handler || typeof config.handler !== "function") {
      this.warn("Throttle directive requires a handler function");
      return;
    }
    const delay = config.delay ?? 200;
    const event = config.event ?? "click";
    const leading = config.leading ?? true;
    const trailing = config.trailing ?? true;
    let lastTime = 0;
    let timeoutId = null;
    let lastArgs = [];
    const throttledHandler = (...args) => {
      if (config.disabled)
        return;
      const now = Date.now();
      const remaining = delay - (now - lastTime);
      lastArgs = args;
      const execute = () => {
        if (config.handler) {
          config.handler(...lastArgs);
        }
        lastTime = Date.now();
        timeoutId = null;
      };
      if (remaining <= 0 || remaining > delay) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (leading) {
          execute();
        } else {
          lastTime = now;
        }
        if (trailing && !timeoutId) {
          timeoutId = setTimeout(() => {
            execute();
          }, delay);
        }
      } else if (!timeoutId && trailing) {
        timeoutId = setTimeout(() => {
          execute();
        }, remaining);
      }
    };
    vueDirectiveAdapter.directiveUtils.storeData(el, "throttle-handler", throttledHandler);
    vueDirectiveAdapter.directiveUtils.storeData(el, "throttle-event", event);
    vueDirectiveAdapter.directiveUtils.storeData(el, "throttle-timeout", timeoutId);
    el.addEventListener(event, throttledHandler);
    this.log(`Throttle directive mounted on element with ${delay}ms delay`, el);
  }
  updated(el, binding) {
    const oldHandler = vueDirectiveAdapter.directiveUtils.getData(el, "throttle-handler");
    const oldEvent = vueDirectiveAdapter.directiveUtils.getData(el, "throttle-event");
    const oldTimeout = vueDirectiveAdapter.directiveUtils.getData(el, "throttle-timeout");
    if (oldHandler && oldEvent) {
      el.removeEventListener(oldEvent, oldHandler);
    }
    if (oldTimeout) {
      clearTimeout(oldTimeout);
    }
    this.mounted(el, binding);
    this.log(`Throttle directive updated on element`, el);
  }
  unmounted(el) {
    const handler = vueDirectiveAdapter.directiveUtils.getData(el, "throttle-handler");
    const event = vueDirectiveAdapter.directiveUtils.getData(el, "throttle-event");
    const timeout = vueDirectiveAdapter.directiveUtils.getData(el, "throttle-timeout");
    if (handler && event) {
      el.removeEventListener(event, handler);
    }
    if (timeout) {
      clearTimeout(timeout);
    }
    vueDirectiveAdapter.directiveUtils.removeData(el, "throttle-handler");
    vueDirectiveAdapter.directiveUtils.removeData(el, "throttle-event");
    vueDirectiveAdapter.directiveUtils.removeData(el, "throttle-timeout");
    this.log(`Throttle directive unmounted from element`, el);
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
<!-- Basic throttle with default 200ms delay -->
<button v-throttle="handleClick">
  Throttled Click
</button>

<!-- Custom delay -->
<div v-throttle="{
  handler: handleScroll,
  event: 'scroll',
  delay: 500
}" class="scrollable">
  Scroll me (throttled)
</div>

<!-- Leading and trailing options -->
<button v-throttle="{
  handler: handleInput,
  delay: 300,
  leading: false,
  trailing: true
}">
  Trailing only
</button>

<!-- Different event -->
<input v-throttle="{
  handler: handleKeyPress,
  event: 'keydown',
  delay: 100
}" placeholder="Type here (throttled)">

<!-- Conditional throttle -->
<button v-throttle="{
  handler: saveProgress,
  delay: 1000,
  disabled: isSaving
}">
  Auto-save
</button>

<script setup>
const handleClick = () => {
  ')
}

const handleScroll = (event) => {
  
}

const handleInput = () => {
  ')
}

const handleKeyPress = (event) => {
  
}

const saveProgress = () => {
  
}
<\/script>
    `;
  }
}
const vThrottle = vueDirectiveAdapter.defineDirective(new ThrottleDirective());

exports.ThrottleDirective = ThrottleDirective;
exports.default = vThrottle;
exports.vThrottle = vThrottle;
//# sourceMappingURL=throttle.cjs.map
