/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import process from 'node:process';
import { getLogger } from '../logger/logger.js';

class DevToolsIntegration {
  constructor(options = {}) {
    this.logger = getLogger("DevToolsIntegration");
    this.timelineEvents = [];
    this.devtoolsApi = null;
    this.options = {
      enabled: typeof process !== "undefined" && process.env?.NODE_ENV !== "production" || false,
      maxTimelineEvents: 1e3,
      trackPerformance: true,
      trackStateChanges: true,
      trackErrors: true,
      ...options
    };
  }
  /**
   * 初始化 DevTools 集成
   */
  init(app, engine) {
    if (!this.options.enabled) {
      return;
    }
    this.app = app;
    this.engine = engine;
    if (typeof window !== "undefined") {
      this.setupDevTools();
    }
  }
  /**
   * 设置 DevTools
   */
  setupDevTools() {
    const target = typeof window !== "undefined" ? window : globalThis;
    const devtoolsHook = target.__VUE_DEVTOOLS_GLOBAL_HOOK__;
    if (!devtoolsHook) {
      this.logger.warn("[Engine DevTools] Vue DevTools not detected");
      return;
    }
    this.devtoolsApi = devtoolsHook;
    this.registerInspector();
    this.registerTimeline();
    this.setupEventListeners();
  }
  /**
   * 注册自定义检查器
   */
  registerInspector() {
    if (!this.devtoolsApi || !this.app) {
      return;
    }
    try {
      this.devtoolsApi.on.setupDevtoolsPlugin?.((api) => {
        api.addInspector({
          id: "ldesign-engine",
          label: "LDesign Engine",
          icon: "settings",
          treeFilterPlaceholder: "Search engine state..."
        });
        api.on.getInspectorTree((payload) => {
          if (payload.inspectorId === "ldesign-engine") {
            payload.rootNodes = this.getInspectorTree();
          }
        });
        api.on.getInspectorState((payload) => {
          if (payload.inspectorId === "ldesign-engine") {
            payload.state = this.getInspectorState(payload.nodeId);
          }
        });
        api.on.editInspectorState((payload) => {
          if (payload.inspectorId === "ldesign-engine") {
            this.editInspectorState(payload);
          }
        });
      });
    } catch (error) {
      this.logger.error("[Engine DevTools] Failed to register inspector:", error);
    }
  }
  /**
   * 注册时间线层
   */
  registerTimeline() {
    if (!this.devtoolsApi) {
      return;
    }
    try {
      this.devtoolsApi.on.setupDevtoolsPlugin?.((api) => {
        if (this.options.trackPerformance) {
          api.addTimelineLayer({
            id: "ldesign-performance",
            label: "Performance",
            color: 4307075
          });
        }
        if (this.options.trackStateChanges) {
          api.addTimelineLayer({
            id: "ldesign-state",
            label: "State Changes",
            color: 4372867
          });
        }
        if (this.options.trackErrors) {
          api.addTimelineLayer({
            id: "ldesign-errors",
            label: "Errors",
            color: 16732754
          });
        }
      });
    } catch (error) {
      this.logger.error("[Engine DevTools] Failed to register timeline:", error);
    }
  }
  /**
   * 设置事件监听
   */
  setupEventListeners() {
    if (!this.engine) {
      return;
    }
    if (this.options.trackPerformance) ;
    if (this.options.trackStateChanges) ;
    if (this.options.trackErrors) ;
  }
  /**
   * 获取检查器树
   */
  getInspectorTree() {
    if (!this.engine) {
      return [];
    }
    return [
      {
        id: "config",
        label: "Configuration",
        children: []
      },
      {
        id: "state",
        label: "State",
        children: []
      },
      {
        id: "performance",
        label: "Performance",
        children: []
      },
      {
        id: "errors",
        label: "Errors",
        children: []
      }
    ];
  }
  /**
   * 获取检查器状态
   */
  getInspectorState(nodeId) {
    if (!this.engine) {
      return {};
    }
    const state = {};
    switch (nodeId) {
      case "config":
        state.Configuration = this.getConfigState();
        break;
      case "state":
        state.State = this.getStateState();
        break;
      case "performance":
        state.Performance = this.getPerformanceState();
        break;
      case "errors":
        state.Errors = this.getErrorsState();
        break;
    }
    return state;
  }
  /**
   * 获取配置状态
   */
  getConfigState() {
    return [];
  }
  /**
   * 获取状态状态
   */
  getStateState() {
    return [];
  }
  /**
   * 获取性能状态
   */
  getPerformanceState() {
    return [];
  }
  /**
   * 获取错误状态
   */
  getErrorsState() {
    return [];
  }
  /**
   * 编辑检查器状态
   */
  editInspectorState() {
  }
  /**
   * 添加时间线事件
   */
  addTimelineEvent(layerId, event) {
    if (!this.options.enabled || !this.devtoolsApi) {
      return;
    }
    this.timelineEvents.push(event);
    if (this.timelineEvents.length > this.options.maxTimelineEvents) {
      this.timelineEvents.shift();
    }
    try {
      this.devtoolsApi.on.setupDevtoolsPlugin?.((api) => {
        api.addTimelineEvent({
          layerId,
          event: {
            time: event.time,
            data: event.data,
            title: event.title,
            subtitle: event.subtitle,
            groupId: event.groupId,
            logType: event.logType || "default"
          }
        });
      });
    } catch (error) {
      this.logger.error("[Engine DevTools] Failed to add timeline event:", error);
    }
  }
  /**
   * 销毁 DevTools 集成
   */
  destroy() {
    this.app = void 0;
    this.engine = void 0;
    this.timelineEvents = [];
    this.devtoolsApi = null;
  }
}
function createDevToolsIntegration(options) {
  return new DevToolsIntegration(options);
}

export { DevToolsIntegration, createDevToolsIntegration };
//# sourceMappingURL=devtools-integration.js.map
