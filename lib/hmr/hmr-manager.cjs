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

class HMRManager {
  constructor(engine, options = {}) {
    this.modules = /* @__PURE__ */ new Map();
    this.updateQueue = [];
    this.isProcessing = false;
    this.reconnectAttempts = 0;
    this.maxModules = 100;
    this.maxQueueSize = 50;
    this.moduleAccessOrder = /* @__PURE__ */ new Map();
    this.accessCounter = 0;
    this.listeners = /* @__PURE__ */ new Map();
    this.engine = engine;
    this.options = {
      enabled: options.enabled ?? true,
      host: options.host ?? "localhost",
      port: options.port ?? 3e3,
      autoReconnect: options.autoReconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? 2e3,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      preserveState: options.preserveState ?? true,
      updateStrategy: options.updateStrategy ?? "patch"
    };
    if (this.options.enabled && this.isDevelopment()) {
      this.initialize();
    }
  }
  /**
   * 初始化HMR
   */
  initialize() {
    this.connect();
    this.setupGlobalHandlers();
    this.engine.logger.info("HMR Manager initialized", {
      host: this.options.host,
      port: this.options.port,
      strategy: this.options.updateStrategy
    });
  }
  /**
   * 连接到HMR服务器
   */
  connect() {
    const wsUrl = `ws://${this.options.host}:${this.options.port}/hmr`;
    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.engine.logger.info("HMR connected to server");
        this.engine.events.emit("hmr:connected", { url: wsUrl });
      };
      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
      this.ws.onerror = (error) => {
        this.engine.logger.error("HMR connection error", error);
      };
      this.ws.onclose = () => {
        this.engine.logger.warn("HMR connection closed");
        this.engine.events.emit("hmr:disconnected");
        if (this.options.autoReconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      this.engine.logger.error("Failed to create HMR connection", error);
    }
  }
  /**
   * 处理HMR消息
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      switch (message.type) {
        case "update":
          this.handleUpdate(message.payload);
          break;
        case "full-reload":
          this.handleFullReload();
          break;
        case "error":
          this.handleError(message.payload);
          break;
        case "heartbeat":
          break;
        default:
          this.engine.logger.warn("Unknown HMR message type", message.type);
      }
    } catch (error) {
      this.engine.logger.error("Failed to parse HMR message", error);
    }
  }
  /**
   * 处理模块更新
   */
  async handleUpdate(payload) {
    if (this.updateQueue.length >= this.maxQueueSize) {
      this.engine.logger.warn("HMR update queue full, removing oldest updates");
      this.updateQueue = this.updateQueue.slice(-Math.floor(this.maxQueueSize / 2));
    }
    this.updateQueue.push(payload);
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    try {
      if (this.options.preserveState) {
        this.saveState();
      }
      while (this.updateQueue.length > 0) {
        const update = this.updateQueue.shift();
        if (!update)
          break;
        await this.applyUpdate(update);
      }
      if (this.options.preserveState) {
        this.restoreState();
      }
      this.engine.logger.info("HMR updates applied successfully");
      this.engine.events.emit("hmr:updated", payload);
    } catch (error) {
      this.engine.logger.error("Failed to apply HMR updates", error);
      this.handleFullReload();
    } finally {
      this.isProcessing = false;
    }
  }
  /**
   * 应用单个更新
   */
  async applyUpdate(update) {
    for (const module2 of update.modules) {
      switch (module2.type) {
        case "component":
          await this.updateComponent(module2);
          break;
        case "plugin":
          await this.updatePlugin(module2);
          break;
        case "store":
          await this.updateStore(module2);
          break;
        case "route":
          await this.updateRoute(module2);
          break;
        case "style":
          await this.updateStyle(module2);
          break;
        default:
          this.engine.logger.warn("Unknown module type", module2.type);
      }
      this.setModuleWithEviction(module2.id, module2);
      if (module2.hot?.accept) {
        module2.hot.accept(() => {
          this.engine.logger.debug("Module hot reload callback", module2.id);
        });
      }
    }
    this.notifyListeners(update);
  }
  /**
   * 更新组件
   */
  async updateComponent(module2) {
    if (undefined && typeof undefined.accept === "function") {
      undefined.accept(module2.id, (newModule) => {
        this.engine.logger.debug("Component hot updated", { moduleId: module2.id, newModule });
      });
    }
  }
  /**
   * 更新插件
   */
  async updatePlugin(module2) {
    const plugin = module2.content;
    if (module2.hot?.dispose) {
      module2.hot.dispose((_data) => {
        this.engine.logger.debug("Plugin disposed", module2.id);
      });
    }
    await this.engine.use(plugin);
    this.engine.logger.debug("Plugin hot updated", module2.id);
  }
  /**
   * 更新存储
   */
  async updateStore(module2) {
    const currentState = this.engine.state.getState();
    if (this.options.preserveState) {
      this.engine.state.setState({
        ...currentState,
        ...module2.content
      });
    }
    this.engine.logger.debug("Store hot updated", module2.id);
  }
  /**
   * 更新路由
   */
  async updateRoute(module2) {
    if (!this.engine.router) {
      return;
    }
    this.engine.logger.debug("Route hot updated", module2.id);
  }
  /**
   * 更新样式
   */
  async updateStyle(module2) {
    const styleId = `hmr-style-${module2.id}`;
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = module2.content;
    this.engine.logger.debug("Style hot updated", module2.id);
  }
  /**
   * 处理完全重载
   */
  handleFullReload() {
    this.engine.logger.info("Full reload required");
    window.location.reload();
  }
  /**
   * 处理错误
   */
  handleError(error) {
    this.engine.logger.error("HMR error", error);
    this.showErrorOverlay(error);
  }
  /**
   * 显示错误覆盖层
   */
  showErrorOverlay(error) {
    const existingOverlay = document.getElementById("hmr-error-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }
    const overlay = document.createElement("div");
    overlay.id = "hmr-error-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      color: #e74c3c;
      font-family: monospace;
      padding: 20px;
      z-index: 999999;
      overflow: auto;
    `;
    const errorText = error instanceof Error ? `${error.message}

${error.stack}` : String(error);
    overlay.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">\u26A0\uFE0F HMR Error</h2>
        <pre style="white-space: pre-wrap; word-wrap: break-word;">${errorText}</pre>
        <button onclick="document.getElementById('hmr-error-overlay').remove()" 
                style="margin-top: 20px; padding: 10px 20px; background: #e74c3c; color: white; border: none; cursor: pointer;">
          Dismiss
        </button>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => {
      if (document.getElementById("hmr-error-overlay") === overlay) {
        overlay.remove();
      }
    }, 3e4);
  }
  /**
   * 安排重连
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.engine.logger.error("Max reconnection attempts reached");
      return;
    }
    this.reconnectAttempts++;
    this.reconnectTimer = window.setTimeout(() => {
      this.engine.logger.info("Attempting to reconnect HMR...", {
        attempt: this.reconnectAttempts
      });
      this.connect();
    }, this.options.reconnectInterval);
  }
  /**
   * 保存当前状态
   */
  saveState() {
    this.stateSnapshot = {
      store: this.engine.state.getState(),
      router: this.engine.router?.getCurrentRoute?.()
      // 可以添加更多需要保存的状态
    };
  }
  /**
   * 恢复状态
   */
  restoreState() {
    if (!this.stateSnapshot) {
      return;
    }
    if (this.stateSnapshot.store) {
      this.engine.state.setState(this.stateSnapshot.store);
    }
    if (this.stateSnapshot.router && this.engine.router?.navigate) {
      this.engine.router.navigate(this.stateSnapshot.router);
    }
    this.stateSnapshot = void 0;
  }
  /**
   * 设置全局处理器
   */
  setupGlobalHandlers() {
    if (undefined) {
      undefined.on("vite:beforeUpdate", () => {
        this.engine.logger.debug("Vite HMR update detected");
      });
      undefined.on("vite:error", (error) => {
        this.handleError(error);
      });
    }
    if (module.hot) {
      module.hot.addStatusHandler((status) => {
        this.engine.logger.debug("Webpack HMR status", status);
      });
    }
  }
  /**
   * 检查是否为开发环境
   */
  isDevelopment() {
    return this.engine.config.get("debug", false) || typeof window !== "undefined" && window.location?.hostname === "localhost";
  }
  /**
   * 注册HMR监听器
   */
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    const listeners = this.listeners.get(event);
    listeners?.add(listener);
  }
  /**
   * 移除HMR监听器
   */
  off(event, listener) {
    this.listeners.get(event)?.delete(listener);
  }
  /**
   * 通知监听器
   */
  notifyListeners(event) {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((listener) => listener(event));
    }
  }
  /**
   * 手动触发模块更新
   */
  async updateModule(moduleId, content) {
    const module2 = {
      id: moduleId,
      type: "component",
      // 默认类型
      content,
      timestamp: Date.now()
    };
    await this.applyUpdate({
      type: "modified",
      modules: [module2],
      timestamp: Date.now()
    });
  }
  /**
   * 获取模块
   */
  getModule(moduleId) {
    return this.modules.get(moduleId);
  }
  /**
   * 检查是否已连接
   */
  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
  /**
   * 设置模块并进行LRU驱逐
   */
  setModuleWithEviction(id, module2) {
    this.moduleAccessOrder.set(id, ++this.accessCounter);
    if (this.modules.size >= this.maxModules && !this.modules.has(id)) {
      let lruId = null;
      let minAccess = Infinity;
      for (const [moduleId] of this.modules) {
        const access = this.moduleAccessOrder.get(moduleId) || 0;
        if (access < minAccess) {
          minAccess = access;
          lruId = moduleId;
        }
      }
      if (lruId) {
        const oldModule = this.modules.get(lruId);
        if (oldModule?.hot?.dispose) {
          oldModule.hot.dispose(() => {
          });
        }
        this.modules.delete(lruId);
        this.moduleAccessOrder.delete(lruId);
      }
    }
    this.modules.set(id, module2);
  }
  /**
   * 销毁HMR管理器
   */
  destroy() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = void 0;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = void 0;
    }
    for (const [, module2] of this.modules) {
      if (module2.hot?.dispose) {
        module2.hot.dispose(() => {
        });
      }
    }
    const overlay = document.getElementById("hmr-error-overlay");
    if (overlay) {
      overlay.remove();
    }
    this.modules.clear();
    this.moduleAccessOrder.clear();
    this.updateQueue.length = 0;
    this.listeners.clear();
    this.stateSnapshot = void 0;
    this.engine.logger.info("HMR Manager destroyed");
  }
}
function createHMRManager(engine, options) {
  return new HMRManager(engine, options);
}

exports.HMRManager = HMRManager;
exports.createHMRManager = createHMRManager;
//# sourceMappingURL=hmr-manager.cjs.map
