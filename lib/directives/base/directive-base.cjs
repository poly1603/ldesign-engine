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

class DirectiveBase {
  constructor(options) {
    this.name = options.name;
    this.description = options.description;
    this.version = options.version || "1.0.0";
    this.author = options.author;
    this.category = options.category || "utility";
    this.tags = options.tags || [];
    this.dependencies = options.dependencies || [];
    this.metadata = {};
    this.config = {
      enabled: true,
      priority: 0,
      scope: "global",
      autoRegister: true,
      hotReload: false,
      validation: true,
      logging: false,
      ...options.config
    };
    this.lifecycle = {
      beforeCreate: this.beforeCreate.bind(this),
      created: this.created.bind(this),
      beforeMount: this.beforeMount.bind(this),
      mounted: this.mounted.bind(this),
      beforeUpdate: this.beforeUpdate.bind(this),
      updated: this.updated.bind(this),
      beforeUnmount: this.beforeUnmount.bind(this),
      unmounted: this.unmounted.bind(this),
      error: this.error.bind(this)
    };
  }
  // 生命周期钩子方法（子类可重写）
  beforeCreate() {
  }
  created(_el, _binding) {
  }
  beforeMount(_el, _binding) {
  }
  mounted(_el, _binding) {
  }
  beforeUpdate(_el, _binding) {
  }
  updated(_el, _binding) {
  }
  beforeUnmount(_el, _binding) {
  }
  unmounted(_el) {
  }
  error(error) {
    console.error(`Directive ${this.name} error:`, error);
  }
  // 工具方法
  log(_message, ..._args) {
  }
  warn(_message, ..._args) {
  }
  error_log(_message, ..._args) {
  }
  // 验证方法
  validateElement(el) {
    return el instanceof HTMLElement;
  }
  validateBinding(binding) {
    return binding !== null && binding !== void 0;
  }
  // 事件处理工具
  addEventListener(el, event, handler, options) {
    el.addEventListener(event, handler, options);
    if (!el._directiveHandlers) {
      el._directiveHandlers = /* @__PURE__ */ new Map();
    }
    const key = `${this.name}_${event}`;
    if (el._directiveHandlers.has(key)) {
      const handler2 = el._directiveHandlers.get(key);
      if (handler2) {
        el.removeEventListener(event, handler2);
      }
    }
    el._directiveHandlers.set(key, handler);
  }
  removeEventListener(el, event) {
    if (el._directiveHandlers) {
      const key = `${this.name}_${event}`;
      const handler = el._directiveHandlers.get(key);
      if (handler) {
        el.removeEventListener(event, handler);
        el._directiveHandlers.delete(key);
      }
    }
  }
  removeAllEventListeners(el) {
    if (el._directiveHandlers) {
      for (const [key, handler] of el._directiveHandlers.entries()) {
        if (key.startsWith(`${this.name}_`)) {
          const event = key.replace(`${this.name}_`, "");
          el.removeEventListener(event, handler);
          el._directiveHandlers.delete(key);
        }
      }
    }
  }
  // 样式工具
  addClass(el, className) {
    el.classList.add(className);
  }
  removeClass(el, className) {
    el.classList.remove(className);
  }
  toggleClass(el, className) {
    el.classList.toggle(className);
  }
  hasClass(el, className) {
    return el.classList.contains(className);
  }
  // 属性工具
  setAttribute(el, name, value) {
    el.setAttribute(name, value);
  }
  removeAttribute(el, name) {
    el.removeAttribute(name);
  }
  getAttribute(el, name) {
    return el.getAttribute(name);
  }
  hasAttribute(el, name) {
    return el.hasAttribute(name);
  }
}

exports.DirectiveBase = DirectiveBase;
//# sourceMappingURL=directive-base.cjs.map
