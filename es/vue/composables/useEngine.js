/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { inject, getCurrentInstance, computed } from 'vue';

function useEngine() {
  const injectedEngine = inject("engine");
  if (injectedEngine) {
    return injectedEngine;
  }
  const instance = getCurrentInstance();
  if (instance?.appContext.app.config.globalProperties.$engine) {
    return instance.appContext.app.config.globalProperties.$engine;
  }
  if (typeof window !== "undefined" && window.__LDESIGN_ENGINE__) {
    return window.__LDESIGN_ENGINE__;
  }
  throw new Error("Engine instance not found. Make sure the engine is properly initialized and the Vue app is using the engine plugin.");
}
function useEngineAvailable() {
  return computed(() => {
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

export { useEngine, useEngineAvailable, useEngineConfig, useEngineErrors, useEngineEvents, useEngineLogger, useEngineMiddleware, useEngineNotifications, useEnginePlugins, useEngineState };
//# sourceMappingURL=useEngine.js.map
