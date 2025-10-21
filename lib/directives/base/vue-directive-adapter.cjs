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

var logger$1 = require('../../logger/logger.cjs');

const logger = logger$1.getLogger("vue-directive-adapter");
function createCompatibleBinding(binding) {
  return {
    value: binding.value,
    oldValue: binding.oldValue,
    arg: binding.arg,
    modifiers: binding.modifiers,
    instance: binding.instance,
    dir: binding.dir
  };
}
function safeCallDirectiveMethod(method, el, binding, methodName) {
  if (typeof method === "function") {
    try {
      if (method.length === 0) {
        method();
      } else {
        method(el, binding);
      }
    } catch (error) {
      logger.error(`Error in directive method ${methodName}:`, error);
    }
  }
}
function safeCallLifecycleMethod(method, el, binding, methodName) {
  if (method) {
    safeCallDirectiveMethod(method, el, binding, methodName);
  }
}
function createVueDirective(directive) {
  return {
    created(el, binding) {
      try {
        directive.lifecycle.beforeCreate?.();
        const compatibleBinding = createCompatibleBinding(binding);
        if (!el._engineDirectives) {
          el._engineDirectives = /* @__PURE__ */ new Map();
        }
        el._engineDirectives.set(directive.name, directive);
        safeCallLifecycleMethod(directive.lifecycle.created, el, compatibleBinding, "lifecycle.created");
        safeCallLifecycleMethod(directive.created, el, compatibleBinding, "created");
      } catch (error) {
        directive.lifecycle.error?.(error);
      }
    },
    beforeMount(el, binding) {
      try {
        const compatibleBinding = createCompatibleBinding(binding);
        safeCallLifecycleMethod(directive.lifecycle.beforeMount, el, compatibleBinding, "lifecycle.beforeMount");
        safeCallLifecycleMethod(directive.beforeMount, el, compatibleBinding, "beforeMount");
      } catch (error) {
        directive.lifecycle.error?.(error);
      }
    },
    mounted(el, binding) {
      try {
        const compatibleBinding = createCompatibleBinding(binding);
        safeCallLifecycleMethod(directive.lifecycle.mounted, el, compatibleBinding, "lifecycle.mounted");
        safeCallLifecycleMethod(directive.mounted, el, compatibleBinding, "mounted");
      } catch (error) {
        directive.lifecycle.error?.(error);
      }
    },
    beforeUpdate(el, binding) {
      try {
        const compatibleBinding = createCompatibleBinding(binding);
        safeCallLifecycleMethod(directive.lifecycle.beforeUpdate, el, compatibleBinding, "lifecycle.beforeUpdate");
        safeCallLifecycleMethod(directive.beforeUpdate, el, compatibleBinding, "beforeUpdate");
      } catch (error) {
        directive.lifecycle.error?.(error);
      }
    },
    updated(el, binding) {
      try {
        const compatibleBinding = createCompatibleBinding(binding);
        safeCallLifecycleMethod(directive.lifecycle.updated, el, compatibleBinding, "lifecycle.updated");
        safeCallLifecycleMethod(directive.updated, el, compatibleBinding, "updated");
      } catch (error) {
        directive.lifecycle.error?.(error);
      }
    },
    beforeUnmount(el, binding) {
      try {
        const compatibleBinding = createCompatibleBinding(binding);
        safeCallLifecycleMethod(directive.lifecycle.beforeUnmount, el, compatibleBinding, "lifecycle.beforeUnmount");
        safeCallLifecycleMethod(directive.beforeUnmount, el, compatibleBinding, "beforeUnmount");
      } catch (error) {
        directive.lifecycle.error?.(error);
      }
    },
    unmounted(el, binding) {
      try {
        const compatibleBinding = createCompatibleBinding(binding);
        safeCallLifecycleMethod(directive.unmounted, el, compatibleBinding, "unmounted");
        if (el._engineDirectives) {
          el._engineDirectives.delete(directive.name);
        }
        safeCallLifecycleMethod(directive.lifecycle.unmounted, el, compatibleBinding, "lifecycle.unmounted");
      } catch (error) {
        directive.lifecycle.error?.(error);
      }
    }
  };
}
function defineDirective(directiveOrName, hooks) {
  if (typeof directiveOrName !== "string") {
    return createVueDirective(directiveOrName);
  }
  if (!hooks) {
    throw new Error("Hooks are required when name is provided");
  }
  return {
    created(el, binding) {
      hooks.created?.(el, createCompatibleBinding(binding));
    },
    beforeMount(el, binding) {
      hooks.beforeMount?.(el, createCompatibleBinding(binding));
    },
    mounted(el, binding) {
      hooks.mounted?.(el, createCompatibleBinding(binding));
    },
    beforeUpdate(el, binding) {
      hooks.beforeUpdate?.(el, createCompatibleBinding(binding));
    },
    updated(el, binding) {
      hooks.updated?.(el, createCompatibleBinding(binding));
    },
    beforeUnmount(el, binding) {
      hooks.beforeUnmount?.(el, createCompatibleBinding(binding));
    },
    unmounted(el, binding) {
      hooks.unmounted?.(el, createCompatibleBinding(binding));
    }
  };
}
const directiveUtils = {
  /**
   * 获取绑定值
   */
  getValue(binding, defaultValue) {
    return binding.value !== void 0 ? binding.value : defaultValue;
  },
  /**
   * 获取修饰符
   */
  getModifiers(binding) {
    return binding.modifiers || {};
  },
  /**
   * 检查修饰符
   */
  hasModifier(binding, modifier) {
    return Boolean(binding.modifiers?.[modifier]);
  },
  /**
   * 获取参数
   */
  getArg(binding) {
    return binding.arg;
  },
  /**
   * 获取旧值
   */
  getOldValue(binding) {
    return binding.oldValue;
  },
  /**
   * 检查值是否改变
   */
  isValueChanged(binding) {
    return binding.value !== binding.oldValue;
  },
  /**
   * 解析配置对象
   */
  parseConfig(binding) {
    const value = binding.value;
    if (typeof value === "object" && value !== null) {
      return { ...value };
    }
    return { value };
  },
  /**
   * 创建事件处理器
   */
  createHandler(callback, options) {
    let handler = callback;
    if (options?.debounce) {
      handler = debounce(handler, options.debounce);
    } else if (options?.throttle) {
      handler = throttle(handler, options.throttle);
    }
    if (options?.once) {
      const originalHandler = handler;
      handler = function(evt) {
        originalHandler.call(this, evt);
      };
    }
    return handler;
  },
  /**
   * 存储数据到元素
   */
  storeData(el, key, value) {
    if (!el._directiveData) {
      el._directiveData = /* @__PURE__ */ new Map();
    }
    el._directiveData.set(key, value);
  },
  /**
   * 从元素获取数据
   */
  getData(el, key) {
    return el._directiveData?.get(key);
  },
  /**
   * 从元素删除数据
   */
  removeData(el, key) {
    el._directiveData?.delete(key);
  },
  /**
   * 清空元素数据
   */
  clearData(el) {
    el._directiveData?.clear();
  }
};
function debounce(func, wait) {
  let timeout;
  return function(evt) {
    const later = () => {
      timeout = void 0;
      func.call(this, evt);
    };
    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
}
function throttle(func, wait) {
  let lastTime = 0;
  return function(evt) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      func.call(this, evt);
    }
  };
}

exports.createVueDirective = createVueDirective;
exports.defineDirective = defineDirective;
exports.directiveUtils = directiveUtils;
//# sourceMappingURL=vue-directive-adapter.cjs.map
