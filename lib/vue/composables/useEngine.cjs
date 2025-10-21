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

var vue = require('vue');

function useEngine() {
  const injectedEngine = vue.inject("engine");
  if (injectedEngine) {
    return injectedEngine;
  }
  const instance = vue.getCurrentInstance();
  if (instance?.appContext.app.config.globalProperties.$engine) {
    return instance.appContext.app.config.globalProperties.$engine;
  }
  if (typeof window !== "undefined" && window.__LDESIGN_ENGINE__) {
    return window.__LDESIGN_ENGINE__;
  }
  throw new Error("Engine instance not found. Make sure the engine is properly initialized and the Vue app is using the engine plugin.");
}
function useEngineAvailable() {
  return vue.computed(() => {
    try {
      useEngine();
      return true;
    } catch {
      return false;
    }
  });
}
function useEngineConfig() {
  const engine = useEngine();
  return engine.config;
}
function useEnginePlugins() {
  const engine = useEngine();
  return engine.plugins;
}
function useEngineMiddleware() {
  const engine = useEngine();
  return engine.middleware;
}
function useEngineEvents() {
  const engine = useEngine();
  return engine.events;
}
function useEngineState() {
  const engine = useEngine();
  return engine.state;
}
function useEngineLogger() {
  const engine = useEngine();
  return engine.logger;
}
function useEngineNotifications() {
  const engine = useEngine();
  return engine.notifications;
}
function useEngineErrors() {
  const engine = useEngine();
  return engine.errors;
}

exports.useEngine = useEngine;
exports.useEngineAvailable = useEngineAvailable;
exports.useEngineConfig = useEngineConfig;
exports.useEngineErrors = useEngineErrors;
exports.useEngineEvents = useEngineEvents;
exports.useEngineLogger = useEngineLogger;
exports.useEngineMiddleware = useEngineMiddleware;
exports.useEngineNotifications = useEngineNotifications;
exports.useEnginePlugins = useEnginePlugins;
exports.useEngineState = useEngineState;
//# sourceMappingURL=useEngine.cjs.map
