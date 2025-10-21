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

class LazyDirective extends DirectiveBase {
  constructor() {
    super({
      name: "lazy",
      description: "\u61D2\u52A0\u8F7D\u5143\u7D20\uFF0C\u5F53\u8FDB\u5165\u89C6\u53E3\u65F6\u624D\u52A0\u8F7D",
      version: "1.0.0",
      category: "performance",
      tags: ["lazy", "load", "performance", "image"]
    });
    this.observers = /* @__PURE__ */ new Map();
    this.defaultPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3C/svg%3E';
    this.defaultError = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ff0000"/%3E%3C/svg%3E';
  }
  mounted(el, binding) {
    const config = this.parseConfig(binding);
    this.setupElement(el, config);
    const observerOptions = {
      threshold: config.threshold ?? 0,
      rootMargin: config.rootMargin ?? "0px",
      root: config.root ?? null
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadElement(el, config, entry);
          if (config.once !== false) {
            observer.unobserve(el);
            this.observers.delete(el);
          }
        }
      });
    }, observerOptions);
    observer.observe(el);
    this.observers.set(el, observer);
    this.log(`Lazy loading directive mounted on element`, el);
  }
  updated(el, binding) {
    const oldObserver = this.observers.get(el);
    if (oldObserver) {
      oldObserver.disconnect();
      this.observers.delete(el);
    }
    this.mounted(el, binding);
    this.log(`Lazy loading directive updated on element`, el);
  }
  unmounted(el) {
    const observer = this.observers.get(el);
    if (observer) {
      observer.disconnect();
      this.observers.delete(el);
    }
    directiveUtils.removeData(el, "lazy-loaded");
    directiveUtils.removeData(el, "lazy-loading");
    directiveUtils.removeData(el, "lazy-error");
    this.log(`Lazy loading directive unmounted from element`, el);
  }
  setupElement(el, config) {
    const isImage = el.tagName === "IMG";
    if (isImage && config.placeholder) {
      el.src = config.placeholder;
    } else if (isImage && config.loading) {
      el.src = config.loading;
    } else if (isImage) {
      el.src = this.defaultPlaceholder;
    }
    if (config.loadingClass) {
      el.classList.add(config.loadingClass);
    }
    directiveUtils.storeData(el, "lazy-loading", true);
  }
  loadElement(el, config, entry) {
    const isLoaded = directiveUtils.getData(el, "lazy-loaded");
    if (isLoaded)
      return;
    if (config.onEnter) {
      config.onEnter(el, entry);
    }
    if (config.callback) {
      config.callback(el, entry);
      directiveUtils.storeData(el, "lazy-loaded", true);
      this.updateClasses(el, config, "loaded");
      return;
    }
    if (el.tagName === "IMG" && config.src) {
      this.loadImage(el, config);
    } else {
      directiveUtils.storeData(el, "lazy-loaded", true);
      this.updateClasses(el, config, "loaded");
      if (config.onLoad) {
        config.onLoad(el);
      }
    }
  }
  loadImage(img, config) {
    if (!config.src)
      return;
    const tempImg = new Image();
    tempImg.onload = () => {
      if (config.src) {
        img.src = config.src;
      }
      directiveUtils.storeData(img, "lazy-loaded", true);
      directiveUtils.removeData(img, "lazy-loading");
      this.updateClasses(img, config, "loaded");
      if (config.onLoad) {
        config.onLoad(img);
      }
      this.log(`Image loaded successfully: ${config.src}`);
    };
    tempImg.onerror = (_event) => {
      const error = new Error(`Failed to load image: ${config.src}`);
      if (config.error) {
        img.src = config.error;
      } else {
        img.src = this.defaultError;
      }
      directiveUtils.storeData(img, "lazy-error", true);
      directiveUtils.removeData(img, "lazy-loading");
      this.updateClasses(img, config, "error");
      if (config.onError) {
        config.onError(img, error);
      }
      this.warn(`Failed to load image: ${config.src}`);
    };
    if (config.src) {
      tempImg.src = config.src;
    }
  }
  updateClasses(el, config, state) {
    if (config.loadingClass)
      el.classList.remove(config.loadingClass);
    if (config.loadedClass)
      el.classList.remove(config.loadedClass);
    if (config.errorClass)
      el.classList.remove(config.errorClass);
    switch (state) {
      case "loading":
        if (config.loadingClass)
          el.classList.add(config.loadingClass);
        break;
      case "loaded":
        if (config.loadedClass)
          el.classList.add(config.loadedClass);
        break;
      case "error":
        if (config.errorClass)
          el.classList.add(config.errorClass);
        break;
    }
  }
  parseConfig(binding) {
    const value = binding.value;
    if (typeof value === "string") {
      return { src: value };
    }
    if (typeof value === "object" && value !== null) {
      return value;
    }
    if (typeof value === "function") {
      return { callback: value };
    }
    return {};
  }
  getExample() {
    return `
<!-- Basic image lazy loading -->
<img v-lazy="'/path/to/image.jpg'" alt="Lazy loaded image">

<!-- With placeholder and error image -->
<img v-lazy="{
  src: '/path/to/image.jpg',
  placeholder: '/path/to/placeholder.jpg',
  error: '/path/to/error.jpg',
  threshold: 0.5,
  rootMargin: '50px'
}" alt="Lazy image with options">

<!-- With callbacks -->
<img v-lazy="{
  src: '/path/to/image.jpg',
  onLoad: (el) => ,
  onError: (el, error) => console.error('Failed!', error),
  loadingClass: 'loading',
  loadedClass: 'loaded',
  errorClass: 'error'
}" alt="Lazy image with callbacks">

<!-- Custom element with callback -->
<div v-lazy="{
  callback: (el, entry) => {
    // Custom lazy loading logic
    el.innerHTML = 'Content loaded!'
  },
  threshold: 1.0,
  once: true
}">
  Loading...
</div>

<style>
.loading { opacity: 0.5; }
.loaded { animation: fadeIn 0.3s; }
.error { border: 2px solid red; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
    `;
  }
}
const vLazy = defineDirective(new LazyDirective());

export { LazyDirective, vLazy as default, vLazy };
//# sourceMappingURL=lazy.js.map
