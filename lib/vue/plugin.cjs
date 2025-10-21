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

var createEngineApp = require('../core/create-engine-app.cjs');

function isDevelopment() {
  try {
    if (typeof globalThis === "undefined")
      return false;
    const global = globalThis;
    const processKey = "process";
    const envKey = "env";
    const nodeEnvKey = "NODE_ENV";
    const processEnv = global[processKey]?.[envKey]?.[nodeEnvKey];
    return processEnv === "development";
  } catch {
    return false;
  }
}
function createVueEnginePlugin(options = {}) {
  const { debug = isDevelopment(), registerComponents = true, globalPropertyName = "$engine", injectKey = "engine", exposeGlobal = isDevelopment(), config = {}, plugins = [] } = options;
  return {
    async install(app) {
      const engine = await createEngineApp.createEngineApp({
        config: {
          debug,
          ...config
        },
        plugins
      });
      engine.install(app);
      if (globalPropertyName !== "$engine") {
        app.config.globalProperties[globalPropertyName] = engine;
      }
      if (injectKey !== "engine") {
        app.provide(injectKey, engine);
      }
      if (exposeGlobal && typeof window !== "undefined") {
        window.__LDESIGN_ENGINE__ = engine;
      }
      if (debug && typeof window !== "undefined") {
        const devtools = window.__VUE_DEVTOOLS_GLOBAL_HOOK__;
        if (devtools) {
          devtools.emit("app:init", app, engine);
        }
      }
      app.config.globalProperties.$engine = engine;
    }
  };
}
async function installEngine(app, options = {}) {
  const plugin = createVueEnginePlugin(options);
  app.use(plugin);
  const engine = app.config.globalProperties.$engine;
  if (options.plugins && options.plugins.length > 0) {
    await Promise.all(options.plugins.map((plugin2) => engine.use(plugin2)));
  }
  return engine;
}
async function createAndMountApp(rootComponent, selector, options = {}) {
  const { createApp } = await import('vue');
  const app = createApp(rootComponent);
  const engine = await installEngine(app, options);
  app.mount(selector);
  return engine;
}
function defineEngineModel(key, defaultValue) {
  return {
    get: () => defaultValue,
    set: (_value) => {
      console.warn("defineEngineModel needs build-time support");
    }
  };
}
function engineComponent(options = {}) {
  return function(component) {
    const { performance = false, errorBoundary = false, memoryManagement = false } = options;
    const enhancedComponent = { ...component };
    if (performance) {
      const originalSetup = enhancedComponent.setup;
      enhancedComponent.setup = function(props, ctx) {
        const result = originalSetup?.(props, ctx);
        return result;
      };
    }
    if (errorBoundary) {
      enhancedComponent.errorCaptured = function(error, instance, info) {
        console.error("Component error:", error, info);
        return false;
      };
    }
    if (memoryManagement) {
      const originalUnmounted = enhancedComponent.unmounted;
      enhancedComponent.unmounted = function() {
        originalUnmounted?.();
      };
    }
    return enhancedComponent;
  };
}
function setupDevtools(engine) {
  if (!isDevelopment() || typeof window === "undefined") {
    return;
  }
  const devtools = window.__VUE_DEVTOOLS_GLOBAL_HOOK__;
  if (!devtools) {
    return;
  }
  devtools.emit("engine:init", {
    engine,
    version: "0.1.0",
    config: {},
    plugins: [],
    state: {}
  });
  engine.events.on("state:changed", (data) => {
    devtools.emit("engine:state-changed", data);
  });
  engine.events.on("config:changed", (data) => {
    devtools.emit("engine:config-changed", data);
  });
}

exports.createAndMountApp = createAndMountApp;
exports.createVueEnginePlugin = createVueEnginePlugin;
exports.defineEngineModel = defineEngineModel;
exports.engineComponent = engineComponent;
exports.installEngine = installEngine;
exports.setupDevtools = setupDevtools;
//# sourceMappingURL=plugin.cjs.map
