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

class LoadingDirective extends DirectiveBase {
  constructor() {
    super({
      name: "loading",
      description: "\u663E\u793A\u52A0\u8F7D\u72B6\u6001",
      version: "1.0.0",
      category: "feedback",
      tags: ["loading", "spinner", "progress"]
    });
  }
  mounted(el, binding) {
    const config = this.parseConfig(binding);
    this.toggleLoading(el, config);
    this.log("Loading directive mounted", el);
  }
  updated(el, binding) {
    const config = this.parseConfig(binding);
    this.toggleLoading(el, config);
    this.log("Loading directive updated", el);
  }
  unmounted(el) {
    this.removeLoading(el);
    this.log("Loading directive unmounted", el);
  }
  toggleLoading(el, config) {
    if (config.loading) {
      this.addLoading(el, config);
    } else {
      this.removeLoading(el);
    }
  }
  addLoading(el, config) {
    this.removeLoading(el);
    const overlay = this.createOverlay(config);
    if (config.fullscreen) {
      document.body.appendChild(overlay);
      if (config.lock) {
        document.body.style.overflow = "hidden";
      }
    } else {
      if (getComputedStyle(el).position === "static") {
        el.style.position = "relative";
      }
      el.appendChild(overlay);
    }
    directiveUtils.storeData(el, "loading-overlay", overlay);
  }
  removeLoading(el) {
    const overlay = directiveUtils.getData(el, "loading-overlay");
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    document.body.style.overflow = "";
    directiveUtils.removeData(el, "loading-overlay");
  }
  createOverlay(config) {
    const overlay = document.createElement("div");
    overlay.className = "v-loading-overlay";
    overlay.style.position = config.fullscreen ? "fixed" : "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = config.background || "rgba(255, 255, 255, 0.9)";
    overlay.style.zIndex = "9999";
    const spinner = document.createElement("div");
    spinner.className = "v-loading-spinner";
    spinner.innerHTML = config.spinner || this.getDefaultSpinner();
    overlay.appendChild(spinner);
    if (config.text) {
      const text = document.createElement("div");
      text.className = "v-loading-text";
      text.textContent = config.text;
      text.style.marginTop = "12px";
      text.style.color = "#666";
      text.style.fontSize = "14px";
      overlay.appendChild(text);
    }
    return overlay;
  }
  getDefaultSpinner() {
    const svg = '<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">';
    const circle = '<circle cx="20" cy="20" r="18" stroke="#3498db" stroke-width="3" fill="none" stroke-dasharray="90" stroke-dashoffset="15">';
    const animate = '<animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="1s" repeatCount="indefinite"/>';
    return `${svg + circle + animate}</circle></svg>`;
  }
  parseConfig(binding) {
    const value = binding.value;
    if (typeof value === "boolean") {
      return { loading: value };
    }
    if (typeof value === "object" && value !== null) {
      return value;
    }
    return { loading: false };
  }
  getExample() {
    return `
<!-- Basic loading -->
<div v-loading="isLoading">
  Content here
</div>

<!-- With text -->
<div v-loading="{
  loading: isLoading,
  text: 'Loading data...'
}">
  Content here
</div>

<!-- Fullscreen loading -->
<button @click="showFullscreenLoading" v-loading="{
  loading: fullscreenLoading,
  fullscreen: true,
  lock: true,
  text: 'Please wait...'
}">
  Show Fullscreen Loading
</button>

<!-- Custom background -->
<div v-loading="{
  loading: true,
  background: 'rgba(0, 0, 0, 0.8)'
}">
  Dark loading overlay
</div>

<script setup>
import { ref } from 'vue'

const isLoading = ref(false)
const fullscreenLoading = ref(false)

const showFullscreenLoading = () => {
  fullscreenLoading.value = true
  setTimeout(() => {
    fullscreenLoading.value = false
  }, 3000)
}
<\/script>
    `;
  }
}
const vLoading = defineDirective(new LoadingDirective());

export { LoadingDirective, vLoading as default, vLoading };
//# sourceMappingURL=loading.js.map
