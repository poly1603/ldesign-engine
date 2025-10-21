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

var directiveCompatibility = require('./utils/directive-compatibility.cjs');

class DirectiveManagerImpl {
  constructor(logger) {
    this.directives = /* @__PURE__ */ new Map();
    this.logger = logger;
  }
  register(name, directive) {
    if (this.directives.has(name)) {
      this.logger?.warn(`Directive "${name}" is already registered. It will be replaced.`);
    }
    const engineDirective = directiveCompatibility.createHybridDirectiveAdapter(directive);
    this.directives.set(name, engineDirective);
    this.logger?.debug(`Directive "${name}" registered`);
  }
  unregister(name) {
    this.directives.delete(name);
  }
  get(name) {
    return this.directives.get(name);
  }
  getAll() {
    return Array.from(this.directives.values());
  }
  // 检查指令是否存在
  has(name) {
    return this.directives.has(name);
  }
  // 获取所有指令名称
  getNames() {
    return Array.from(this.directives.keys());
  }
  // 获取指令数量
  size() {
    return this.directives.size;
  }
  // 清空所有指令
  clear() {
    this.directives.clear();
  }
  // 销毁指令管理器，清理资源
  destroy() {
    this.clear();
    this.logger = void 0;
  }
  // 批量注册指令
  registerBatch(directives) {
    for (const [name, directive] of Object.entries(directives)) {
      this.register(name, directive);
    }
  }
  // 批量卸载指令
  unregisterBatch(names) {
    for (const name of names) {
      this.unregister(name);
    }
  }
  // 按分类获取指令
  getByCategory(category) {
    return Array.from(this.directives.values()).filter((directive) => directive.category === category);
  }
  // 按标签获取指令
  getByTag(tag) {
    return Array.from(this.directives.values()).filter((directive) => directive.tags?.includes(tag));
  }
  // 启用指令
  enable(name) {
    const directive = this.directives.get(name);
    if (directive) {
      this.logger?.debug(`Directive "${name}" enabled`);
    }
  }
  // 禁用指令
  disable(name) {
    const directive = this.directives.get(name);
    if (directive) {
      this.logger?.debug(`Directive "${name}" disabled`);
    }
  }
  // 重新加载指令
  reload(name) {
    const directive = this.directives.get(name);
    if (directive) {
      this.logger?.debug(`Directive "${name}" reloaded`);
    }
  }
  // 验证指令
  validate(_directive) {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };
  }
}
function createDirectiveManager(logger) {
  return new DirectiveManagerImpl(logger);
}
const commonDirectives = {
  // 点击外部区域指令
  clickOutside: {
    mounted(el, binding) {
      const elWith = el;
      elWith._clickOutsideHandler = (event) => {
        if (!(el === event.target || el.contains(event.target))) {
          const handler = binding.value;
          if (typeof handler === "function")
            handler(event);
        }
      };
      document.addEventListener("click", elWith._clickOutsideHandler);
    },
    unmounted(el) {
      const elWith = el;
      if (elWith._clickOutsideHandler) {
        document.removeEventListener("click", elWith._clickOutsideHandler);
        delete elWith._clickOutsideHandler;
      }
    }
  },
  // 复制到剪贴板指令
  copy: {
    mounted(el, binding) {
      const elWith = el;
      elWith._copyHandler = async () => {
        try {
          const val = binding.value;
          const text = typeof val === "string" ? val : val?.text ?? el.textContent ?? "";
          await navigator.clipboard.writeText(text);
          const cb = typeof val === "object" && val && typeof val.callback === "function" ? val.callback : void 0;
          if (binding.arg === "success" && cb) {
            cb(text);
          }
          el.classList.add("copy-success");
          setTimeout(() => {
            el.classList.remove("copy-success");
          }, 1e3);
        } catch (error) {
          console.error("Failed to copy text:", error);
          const val = binding.value;
          const cb = val && typeof val.callback === "function" ? val.callback : void 0;
          if (binding.arg === "error" && cb) {
            cb(error);
          }
        }
      };
      el.addEventListener("click", elWith._copyHandler);
      el.style.cursor = "pointer";
    },
    unmounted(el) {
      const elWith = el;
      if (elWith._copyHandler) {
        el.removeEventListener("click", elWith._copyHandler);
        delete elWith._copyHandler;
      }
    }
  },
  // 懒加载指令
  lazy: {
    mounted(el, binding) {
      const val = binding.value;
      const options = {
        threshold: 0.1,
        rootMargin: "50px",
        ...typeof val === "object" && val ? val.options ?? {} : {}
      };
      const elWith = el;
      elWith._lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (typeof val === "function") {
              val(el);
            } else if (typeof val?.callback === "function") {
              val.callback(el);
            }
            el._lazyObserver?.unobserve(el);
          }
        });
      }, options);
      elWith._lazyObserver.observe(el);
    },
    unmounted(el) {
      if (el._lazyObserver) {
        el._lazyObserver.disconnect();
        delete el._lazyObserver;
      }
    }
  },
  // 防抖指令
  debounce: {
    mounted(el, binding) {
      const val = binding.value;
      const delay = (typeof val === "object" && val ? val.delay : void 0) ?? 300;
      const event = binding.arg || (typeof val === "object" && val ? val.event : void 0) || "click";
      el._debounceHandler = (...args) => {
        clearTimeout(el._debounceTimer);
        el._debounceTimer = window.setTimeout(() => {
          if (typeof val === "function") {
            val(...args);
          } else if (typeof val?.callback === "function") {
            val.callback(...args);
          }
        }, delay);
      };
      el.addEventListener(event, el._debounceHandler);
    },
    updated(el, binding) {
      const val = binding.value;
      const delay = val?.delay ?? 300;
      el._debounceDelay = delay;
    },
    unmounted(el) {
      if (el._debounceTimer) {
        clearTimeout(el._debounceTimer);
      }
      if (el._debounceHandler) {
        const event = "click";
        el.removeEventListener(event, el._debounceHandler);
        delete el._debounceHandler;
      }
    }
  },
  // 节流指令
  throttle: {
    mounted(el, binding) {
      const val = binding.value;
      const delay = (typeof val === "object" && val ? val.delay : void 0) ?? 300;
      const event = binding.arg || (typeof val === "object" && val ? val.event : void 0) || "click";
      let lastTime = 0;
      el._throttleHandler = (...args) => {
        const now = Date.now();
        if (now - lastTime >= delay) {
          lastTime = now;
          if (typeof val === "function") {
            val(...args);
          } else if (typeof val?.callback === "function") {
            val.callback(...args);
          }
        }
      };
      el.addEventListener(event, el._throttleHandler);
    },
    unmounted(el) {
      if (el._throttleHandler) {
        const event = "click";
        el.removeEventListener(event, el._throttleHandler);
        delete el._throttleHandler;
      }
    }
  },
  // 权限控制指令
  permission: {
    mounted(el, binding) {
      const val = binding.value;
      const permissions = Array.isArray(val) ? val : [val].filter((v) => typeof v === "string");
      const hasPermission = permissions.some((permission) => {
        return checkPermission();
      });
      if (!hasPermission) {
        if (binding.modifiers.hide) {
          el.style.display = "none";
        } else if (binding.modifiers.disable) {
          el.setAttribute("disabled", "true");
          el.style.opacity = "0.5";
          el.style.pointerEvents = "none";
        } else {
          el.remove();
        }
      }
    }
  },
  // 焦点指令
  focus: {
    mounted(el, binding) {
      if (binding.value !== false) {
        el.focus();
      }
    },
    updated(el, binding) {
      if (binding.value && !binding.oldValue) {
        el.focus();
      }
    }
  }
};
function checkPermission(_permission) {
  return true;
}

exports.DirectiveManagerImpl = DirectiveManagerImpl;
exports.commonDirectives = commonDirectives;
exports.createDirectiveManager = createDirectiveManager;
//# sourceMappingURL=directive-manager.cjs.map
