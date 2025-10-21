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

class ResizeDirective extends DirectiveBase {
  constructor() {
    super({
      name: "resize",
      description: "\u76D1\u542C\u5143\u7D20\u5C3A\u5BF8\u53D8\u5316",
      version: "1.0.0",
      category: "interaction",
      tags: ["resize", "observer", "dimension"]
    });
  }
  mounted(el, binding) {
    const config = this.parseConfig(binding);
    if (config.disabled) {
      return;
    }
    const observer = this.createObserver(el, config);
    directiveUtils.storeData(el, "resize-observer", observer);
    directiveUtils.storeData(el, "resize-config", config);
    observer.observe(el);
    this.log("Resize observer attached", el);
  }
  updated(el, binding) {
    const newConfig = this.parseConfig(binding);
    const oldConfig = directiveUtils.getData(el, "resize-config");
    if (JSON.stringify(newConfig) === JSON.stringify(oldConfig)) {
      return;
    }
    this.unmounted(el);
    if (!newConfig.disabled) {
      this.mounted(el, binding);
    }
  }
  unmounted(el) {
    const observer = directiveUtils.getData(el, "resize-observer");
    const timer = directiveUtils.getData(el, "resize-timer");
    if (timer) {
      clearTimeout(timer);
      directiveUtils.removeData(el, "resize-timer");
    }
    if (observer) {
      observer.unobserve(el);
      observer.disconnect();
      directiveUtils.removeData(el, "resize-observer");
    }
    directiveUtils.removeData(el, "resize-config");
    if (el && typeof el === "object") {
      el.__resizeObserver = null;
    }
    this.log("Resize observer detached", el);
  }
  createObserver(el, config) {
    let isFirstCall = true;
    const callback = (entries) => {
      if (!config.immediate && isFirstCall) {
        isFirstCall = false;
        return;
      }
      isFirstCall = false;
      for (const entry of entries) {
        if (config.debounce && config.debounce > 0) {
          const timer = directiveUtils.getData(el, "resize-timer");
          if (timer) {
            clearTimeout(timer);
          }
          const newTimer = window.setTimeout(() => {
            config.callback?.(entry);
            this.emitEvent(el, "resize", {
              width: entry.contentRect.width,
              height: entry.contentRect.height,
              entry
            });
          }, config.debounce);
          directiveUtils.storeData(el, "resize-timer", newTimer);
        } else {
          config.callback?.(entry);
          this.emitEvent(el, "resize", {
            width: entry.contentRect.width,
            height: entry.contentRect.height,
            entry
          });
        }
      }
    };
    return new ResizeObserver(callback);
  }
  parseConfig(binding) {
    const value = binding.value;
    if (typeof value === "function") {
      return { callback: value };
    }
    if (typeof value === "object" && value !== null) {
      return value;
    }
    return {};
  }
  emitEvent(el, eventName, detail) {
    el.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true
    }));
  }
  getExample() {
    return `
<!-- Basic resize detection -->
<div v-resize="onResize" class="resizable">
  Resize me!
</div>

<!-- With debounce -->
<div v-resize="{
  callback: onResize,
  debounce: 300
}" class="chart-container">
  Chart will re-render after resize
</div>

<!-- Immediate callback -->
<div v-resize="{
  callback: handleResize,
  immediate: true
}">
  Gets initial size immediately
</div>

<!-- Conditional monitoring -->
<div v-resize="{
  callback: onResize,
  disabled: !isMonitoring
}">
  Conditionally monitored element
</div>

<!-- Listen via event -->
<div 
  v-resize="{}"
  @resize="onResizeEvent"
>
  Listen to resize events
</div>

<script setup>
import { ref } from 'vue'

const isMonitoring = ref(true)

const onResize = (entry) => {
  
}

const handleResize = (entry) => {
  const { width, height } = entry.contentRect
  
}

const onResizeEvent = (event) => {
  
}
<\/script>

<style>
.resizable {
  resize: both;
  overflow: auto;
  border: 1px solid #ccc;
  padding: 20px;
  min-width: 200px;
  min-height: 100px;
}

.chart-container {
  width: 100%;
  height: 400px;
}
</style>
    `;
  }
}
const vResize = defineDirective(new ResizeDirective());

export { ResizeDirective, vResize as default, vResize };
//# sourceMappingURL=resize.js.map
