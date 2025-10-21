/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class MicroFrontendManager {
  constructor(engine) {
    this.apps = /* @__PURE__ */ new Map();
    this.routerMode = "history";
    this.globalState = /* @__PURE__ */ new Map();
    this.eventBus = /* @__PURE__ */ new Map();
    this.prefetchQueue = /* @__PURE__ */ new Set();
    this.moduleFederations = /* @__PURE__ */ new Map();
    this.engine = engine;
    this.logger = engine?.logger;
    this.initialize();
  }
  // ==================== 公共 API ====================
  /**
   * 注册微应用
   */
  registerApp(app) {
    const id = this.generateAppId(app.name);
    const loadedApp = {
      ...app,
      id,
      status: "loading"
    };
    this.apps.set(app.name, loadedApp);
    this.logger?.debug(`Micro app registered: ${app.name}`);
    if (app.prefetch) {
      this.prefetchApp(loadedApp);
    }
  }
  /**
   * 批量注册微应用
   */
  registerApps(apps) {
    apps.forEach((app) => this.registerApp(app));
  }
  /**
   * 启动微前端系统
   */
  async start() {
    this.logger?.info("Starting micro frontend system");
    this.setupRouteListener();
    await this.checkCurrentRoute();
  }
  /**
   * 手动加载应用
   */
  async loadApp(name) {
    const app = this.apps.get(name);
    if (!app) {
      throw new Error(`Micro app not found: ${name}`);
    }
    if (app.status === "loaded" || app.status === "mounted") {
      return app;
    }
    try {
      app.status = "loading";
      app.loader?.(true);
      const { scripts, styles } = await this.fetchAppResources(app);
      if (app.sandbox !== false) {
        app.sandboxInstance = this.createSandbox(app);
      }
      const instance = await this.executeScripts(scripts, app);
      app.instance = instance;
      this.applyStyles(styles, app);
      app.status = "loaded";
      app.loader?.(false);
      this.logger?.info(`Micro app loaded: ${name}`);
      return app;
    } catch (error) {
      app.status = "error";
      app.error = error;
      app.loader?.(false);
      this.logger?.error(`Failed to load micro app: ${name}`, error);
      throw error;
    }
  }
  /**
   * 挂载应用
   */
  async mountApp(name, props) {
    const app = await this.loadApp(name);
    if (app.status === "mounted") {
      return;
    }
    if (app.singular && this.currentApp && this.currentApp !== app) {
      await this.unmountApp(this.currentApp.name);
    }
    try {
      app.status = "mounting";
      if (app.sandboxInstance) {
        app.sandboxInstance.mount();
      }
      await app.instance?.mount({
        ...app.props,
        ...props,
        container: this.getContainer(app.container),
        globalState: this.globalState,
        onGlobalStateChange: this.onGlobalStateChange.bind(this),
        setGlobalState: this.setGlobalState.bind(this),
        emit: this.emit.bind(this),
        on: this.on.bind(this),
        off: this.off.bind(this)
      });
      app.status = "mounted";
      this.currentApp = app;
      this.logger?.info(`Micro app mounted: ${name}`);
    } catch (error) {
      app.status = "error";
      app.error = error;
      this.logger?.error(`Failed to mount micro app: ${name}`, error);
      throw error;
    }
  }
  /**
   * 卸载应用
   */
  async unmountApp(name) {
    const app = this.apps.get(name);
    if (!app || app.status !== "mounted") {
      return;
    }
    try {
      app.status = "unmounting";
      await app.instance?.unmount();
      if (app.sandboxInstance) {
        app.sandboxInstance.unmount();
      }
      app.status = "loaded";
      if (this.currentApp === app) {
        this.currentApp = void 0;
      }
      this.logger?.info(`Micro app unmounted: ${name}`);
    } catch (error) {
      app.error = error;
      this.logger?.error(`Failed to unmount micro app: ${name}`, error);
      throw error;
    }
  }
  /**
   * 更新应用
   */
  async updateApp(name, props) {
    const app = this.apps.get(name);
    if (!app || app.status !== "mounted") {
      return;
    }
    if (app.instance?.update) {
      await app.instance.update(props);
    }
  }
  /**
   * 设置全局状态
   */
  setGlobalState(state) {
    Object.entries(state).forEach(([key, value]) => {
      const oldValue = this.globalState.get(key);
      this.globalState.set(key, value);
      this.emit(`globalState:${key}`, { oldValue, newValue: value });
    });
    this.emit("globalStateChange", state);
  }
  /**
   * 监听全局状态变化
   */
  onGlobalStateChange(callback) {
    const handler = (_data) => {
      callback(this.globalState, new Map(this.globalState));
    };
    this.on("globalStateChange", handler);
    return () => this.off("globalStateChange", handler);
  }
  /**
   * 配置模块联邦
   */
  configureModuleFederation(config) {
    this.moduleFederations.set(config.name, config);
    this.setupModuleFederation(config);
  }
  /**
   * 加载联邦模块
   */
  async loadFederatedModule(scope, module) {
    try {
      await __webpack_init_sharing__("default");
      const container = window[scope];
      await container.init(__webpack_share_scopes__.default);
      const factory = await container.get(module);
      const Module = factory();
      return Module;
    } catch (error) {
      this.logger?.error(`Failed to load federated module: ${scope}/${module}`, error);
      throw error;
    }
  }
  // ==================== 私有方法 ====================
  initialize() {
    this.setupErrorHandler();
    this.setupPerformanceMonitor();
  }
  generateAppId(name) {
    return `micro-app-${name}-${Date.now()}`;
  }
  setupRouteListener() {
    const handleRouteChange = async () => {
      await this.checkCurrentRoute();
    };
    window.addEventListener("popstate", handleRouteChange);
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    window.history.pushState = (...args) => {
      originalPushState.apply(window.history, args);
      handleRouteChange();
    };
    window.history.replaceState = (...args) => {
      originalReplaceState.apply(window.history, args);
      handleRouteChange();
    };
  }
  async checkCurrentRoute() {
    const location = window.location;
    for (const app of this.apps.values()) {
      const isActive = this.isAppActive(app, location);
      if (isActive && app.status !== "mounted") {
        await this.mountApp(app.name);
      } else if (!isActive && app.status === "mounted") {
        await this.unmountApp(app.name);
      }
    }
  }
  isAppActive(app, location) {
    const { activeRule } = app;
    if (typeof activeRule === "string") {
      return location.pathname.startsWith(activeRule);
    } else if (activeRule instanceof RegExp) {
      return activeRule.test(location.pathname);
    } else if (typeof activeRule === "function") {
      return activeRule(location);
    }
    return false;
  }
  async fetchAppResources(app) {
    const entry = app.entry;
    if (typeof entry === "string") {
      const html = await fetch(entry).then((res) => res.text());
      const { scripts, styles } = this.extractResources(html, entry);
      return { scripts, styles, html };
    } else {
      return {
        scripts: entry.scripts || [],
        styles: entry.styles || [],
        html: entry.html || ""
      };
    }
  }
  extractResources(html, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const scripts = Array.from(doc.querySelectorAll("script[src]")).map((script) => this.resolveUrl(script.getAttribute("src"), baseUrl));
    const styles = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map((link) => this.resolveUrl(link.getAttribute("href"), baseUrl));
    return { scripts, styles };
  }
  resolveUrl(url, baseUrl) {
    if (url.startsWith("http") || url.startsWith("//")) {
      return url;
    }
    const base = new URL(baseUrl);
    return new URL(url, base.origin + base.pathname).href;
  }
  async executeScripts(scripts, app) {
    const sandbox = app.sandboxInstance;
    const context = sandbox?.proxy || window;
    for (const script of scripts) {
      const code = await fetch(script).then((res) => res.text());
      if (sandbox) {
        const scriptEl = document.createElement("script");
        scriptEl.textContent = `
          (function(window, self, globalThis) {
            ${code}
          }).call(this, window, window, window);
        `;
        scriptEl.dataset.microApp = app.name;
        document.head.appendChild(scriptEl);
        document.head.removeChild(scriptEl);
      } else {
        const scriptEl = document.createElement("script");
        scriptEl.textContent = code;
        scriptEl.dataset.microApp = app.name;
        document.head.appendChild(scriptEl);
        document.head.removeChild(scriptEl);
      }
    }
    const exports = context[app.name];
    if (!exports) {
      throw new Error(`Micro app ${app.name} did not export lifecycle methods`);
    }
    return exports;
  }
  applyStyles(styles, app) {
    const container = this.getContainer(app.container);
    styles.forEach((href) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.microApp = app.name;
      if (app.sandbox && app.sandbox.strictStyleIsolation) {
        container.appendChild(link);
      } else {
        document.head.appendChild(link);
      }
    });
  }
  createSandbox(_app) {
    const fakeWindow = {};
    const proxy = new Proxy(fakeWindow, {
      get(target, prop) {
        if (prop in target) {
          return target[prop];
        }
        return window[prop];
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      },
      has(target, prop) {
        return prop in target || prop in window;
      }
    });
    return {
      proxy,
      active: false,
      mount() {
        this.active = true;
      },
      unmount() {
        this.active = false;
      },
      clear() {
        Object.keys(fakeWindow).forEach((key) => {
          delete fakeWindow[key];
        });
      }
    };
  }
  getContainer(container) {
    if (typeof container === "string") {
      const element = document.querySelector(container);
      if (!element) {
        throw new Error(`Container not found: ${container}`);
      }
      return element;
    }
    return container;
  }
  prefetchApp(app) {
    if (this.prefetchQueue.has(app.name)) {
      return;
    }
    this.prefetchQueue.add(app.name);
    const prefetch = () => {
      this.loadApp(app.name).catch((error) => {
        this.logger?.warn(`Failed to prefetch app: ${app.name}`, error);
      }).finally(() => {
        this.prefetchQueue.delete(app.name);
      });
    };
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(prefetch);
    } else {
      setTimeout(prefetch, 1e3);
    }
  }
  setupModuleFederation(config) {
    this.logger?.info(`Module federation configured: ${config.name}`);
  }
  setupErrorHandler() {
    window.addEventListener("error", (event) => {
      const app = this.findAppByError(event.error);
      if (app) {
        this.logger?.error(`Error in micro app ${app.name}:`, event.error);
        app.error = event.error;
      }
    });
  }
  setupPerformanceMonitor() {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === "navigation") {
            this.logger?.debug("Navigation performance:", entry);
          }
        });
      });
      observer.observe({ entryTypes: ["navigation"] });
    }
  }
  findAppByError(error) {
    const stack = error.stack || "";
    for (const app of this.apps.values()) {
      if (stack.includes(app.name)) {
        return app;
      }
    }
    return void 0;
  }
  // ==================== 事件系统 ====================
  emit(event, data) {
    const handlers = this.eventBus.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }
  on(event, handler) {
    if (!this.eventBus.has(event)) {
      this.eventBus.set(event, /* @__PURE__ */ new Set());
    }
    this.eventBus.get(event).add(handler);
  }
  off(event, handler) {
    this.eventBus.get(event)?.delete(handler);
  }
  /**
   * 销毁管理器
   */
  async destroy() {
    for (const app of this.apps.values()) {
      if (app.status === "mounted") {
        await this.unmountApp(app.name);
      }
    }
    this.apps.clear();
    this.globalState.clear();
    this.eventBus.clear();
    this.prefetchQueue.clear();
    this.moduleFederations.clear();
  }
}
function createMicroFrontendManager(engine) {
  return new MicroFrontendManager(engine);
}

export { MicroFrontendManager, createMicroFrontendManager };
//# sourceMappingURL=micro-frontend-manager.js.map
