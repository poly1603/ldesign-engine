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

function checkDirectiveType(directive) {
  if (!directive)
    return "engine";
  const obj = typeof directive === "object" && directive !== null ? directive : void 0;
  const hasVueHooks = ["created", "beforeMount", "mounted", "beforeUpdate", "updated", "beforeUnmount", "unmounted"].some((hook) => !!obj && typeof obj[hook] === "function" && obj[hook].length >= 2);
  const hasEngineHooks = ["beforeCreate", "created", "beforeMount", "mounted", "beforeUpdate", "updated", "beforeUnmount", "unmounted"].some((hook) => !!obj && typeof obj[hook] === "function" && obj[hook].length === 0);
  if (hasVueHooks && hasEngineHooks)
    return "hybrid";
  if (hasVueHooks)
    return "vue";
  return "engine";
}
function isVueDirective(directive) {
  return checkDirectiveType(directive) === "vue";
}
function isEngineDirective(directive) {
  return checkDirectiveType(directive) === "engine";
}
function isHybridDirective(directive) {
  return checkDirectiveType(directive) === "hybrid";
}
function convertVueToEngineDirective(vueDirective) {
  const engineDirective = {
    name: "converted-vue-directive",
    description: "Converted from Vue directive",
    version: "1.0.0"
  };
  if (typeof vueDirective === "object" && vueDirective !== null) {
    const d = vueDirective;
    if (typeof d.created === "function") {
      engineDirective.created = d.created;
    }
    if (typeof d.beforeMount === "function") {
      engineDirective.beforeMount = d.beforeMount;
    }
    if (typeof d.mounted === "function") {
      engineDirective.mounted = d.mounted;
    }
    if (typeof d.beforeUpdate === "function") {
      engineDirective.beforeUpdate = d.beforeUpdate;
    }
    if (typeof d.updated === "function") {
      engineDirective.updated = d.updated;
    }
    if (typeof d.beforeUnmount === "function") {
      engineDirective.beforeUnmount = d.beforeUnmount;
    }
    if (typeof d.unmounted === "function") {
      engineDirective.unmounted = d.unmounted;
    }
  } else if (typeof vueDirective === "function") {
    engineDirective.mounted = (el, binding) => {
      vueDirective(el, binding);
    };
  }
  return engineDirective;
}
function convertEngineToVueDirective(engineDirective) {
  const vueDirective = {};
  if (engineDirective.created) {
    if (typeof engineDirective.created === "function") {
      if (engineDirective.created.length === 0) {
        vueDirective.created = (_el, _binding) => {
          engineDirective.created();
        };
      } else {
        vueDirective.created = engineDirective.created;
      }
    }
  }
  if (engineDirective.beforeMount) {
    if (typeof engineDirective.beforeMount === "function") {
      if (engineDirective.beforeMount.length === 0) {
        vueDirective.beforeMount = (_el, _binding) => {
          engineDirective.beforeMount();
        };
      } else {
        vueDirective.beforeMount = engineDirective.beforeMount;
      }
    }
  }
  if (engineDirective.mounted) {
    if (typeof engineDirective.mounted === "function") {
      if (engineDirective.mounted.length === 0) {
        vueDirective.mounted = (_el, _binding) => {
          engineDirective.mounted();
        };
      } else {
        vueDirective.mounted = engineDirective.mounted;
      }
    }
  }
  if (engineDirective.beforeUpdate) {
    if (typeof engineDirective.beforeUpdate === "function") {
      if (engineDirective.beforeUpdate.length === 0) {
        vueDirective.beforeUpdate = (_el, _binding) => {
          engineDirective.beforeUpdate();
        };
      } else {
        vueDirective.beforeUpdate = engineDirective.beforeUpdate;
      }
    }
  }
  if (engineDirective.updated) {
    if (typeof engineDirective.updated === "function") {
      if (engineDirective.updated.length === 0) {
        vueDirective.updated = (_el, _binding) => {
          engineDirective.updated();
        };
      } else {
        vueDirective.updated = engineDirective.updated;
      }
    }
  }
  if (engineDirective.beforeUnmount) {
    if (typeof engineDirective.beforeUnmount === "function") {
      if (engineDirective.beforeUnmount.length === 0) {
        vueDirective.beforeUnmount = (_el, _binding) => {
          engineDirective.beforeUnmount();
        };
      } else {
        vueDirective.beforeUnmount = engineDirective.beforeUnmount;
      }
    }
  }
  if (engineDirective.unmounted) {
    if (typeof engineDirective.unmounted === "function") {
      if (engineDirective.unmounted.length === 0) {
        vueDirective.unmounted = (_el, _binding) => {
          engineDirective.unmounted();
        };
      } else {
        vueDirective.unmounted = engineDirective.unmounted;
      }
    }
  }
  return vueDirective;
}
function createHybridDirectiveAdapter(directive) {
  const type = checkDirectiveType(directive);
  switch (type) {
    case "vue":
      return convertVueToEngineDirective(directive);
    case "engine":
      return directive;
    case "hybrid":
      return directive;
    default:
      return directive;
  }
}
const directiveCompatibilityChecker = {
  checkType: checkDirectiveType,
  isVueDirective,
  isEngineDirective,
  isHybridDirective,
  convertToEngineDirective: convertVueToEngineDirective,
  convertToVueDirective: convertEngineToVueDirective
};
const directiveAdapterFactory = {
  createVueAdapter: convertEngineToVueDirective,
  createEngineAdapter: convertVueToEngineDirective,
  createHybridAdapter: createHybridDirectiveAdapter
};
function safeDirectiveCall(fn, args, context) {
  if (typeof fn === "function") {
    try {
      fn(...args);
    } catch (error) {
      console.error(`Error in directive ${context || "unknown"}:`, error);
    }
  }
}
function getMethodSignature(fn) {
  if (typeof fn !== "function")
    return "unknown";
  if (fn.length >= 2)
    return "vue";
  if (fn.length === 0)
    return "engine";
  return "unknown";
}

exports.checkDirectiveType = checkDirectiveType;
exports.convertEngineToVueDirective = convertEngineToVueDirective;
exports.convertVueToEngineDirective = convertVueToEngineDirective;
exports.createHybridDirectiveAdapter = createHybridDirectiveAdapter;
exports.directiveAdapterFactory = directiveAdapterFactory;
exports.directiveCompatibilityChecker = directiveCompatibilityChecker;
exports.getMethodSignature = getMethodSignature;
exports.isEngineDirective = isEngineDirective;
exports.isHybridDirective = isHybridDirective;
exports.isVueDirective = isVueDirective;
exports.safeDirectiveCall = safeDirectiveCall;
//# sourceMappingURL=directive-compatibility.cjs.map
