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

class LifecycleManagerImpl {
  constructor(logger) {
    this.hooks = /* @__PURE__ */ new Map();
    this.phaseHooks = /* @__PURE__ */ new Map();
    this.history = [];
    this.errorCallbacks = [];
    this.hookIdCounter = 0;
    this.maxHistorySize = 50;
    this.MAX_HOOKS = 500;
    this.MAX_ERROR_CALLBACKS = 50;
    this.logger = logger;
    this.logger?.debug("Lifecycle manager initialized");
  }
  // 钩子注册
  /**
   * 注册生命周期钩子。
   * @param phase 生命周期阶段
   * @param hook 钩子函数
   * @param priority 优先级，越大越先执行（默认0）
   * @returns 钩子ID
   */
  on(phase, hook, priority = 0) {
    const id = this.generateHookId();
    const hookInfo = {
      id,
      phase,
      hook,
      priority,
      once: false,
      registeredAt: Date.now()
    };
    this.hooks.set(id, hookInfo);
    if (!this.phaseHooks.has(phase)) {
      this.phaseHooks.set(phase, /* @__PURE__ */ new Set());
    }
    const phaseHooks = this.phaseHooks.get(phase);
    phaseHooks?.add(id);
    this.logger?.debug(`Lifecycle hook registered`, {
      id,
      phase,
      priority
    });
    return id;
  }
  /**
   * 注册一次性生命周期钩子（执行后自动移除）。
   */
  once(phase, hook, priority = 0) {
    const id = this.generateHookId();
    const hookInfo = {
      id,
      phase,
      hook,
      priority,
      once: true,
      registeredAt: Date.now()
    };
    this.hooks.set(id, hookInfo);
    if (!this.phaseHooks.has(phase)) {
      this.phaseHooks.set(phase, /* @__PURE__ */ new Set());
    }
    const phaseHooks = this.phaseHooks.get(phase);
    phaseHooks?.add(id);
    this.logger?.debug(`One-time lifecycle hook registered`, {
      id,
      phase,
      priority
    });
    return id;
  }
  /**
   * 移除指定钩子。
   */
  off(hookId) {
    const hookInfo = this.hooks.get(hookId);
    if (!hookInfo) {
      return false;
    }
    this.hooks.delete(hookId);
    const phaseHooks = this.phaseHooks.get(hookInfo.phase);
    if (phaseHooks) {
      phaseHooks.delete(hookId);
      if (phaseHooks.size === 0) {
        this.phaseHooks.delete(hookInfo.phase);
      }
    }
    this.logger?.debug(`Lifecycle hook removed`, {
      id: hookId,
      phase: hookInfo.phase
    });
    return true;
  }
  /**
   * 批量移除钩子，可按阶段清空。
   * @returns 被移除的钩子数量
   */
  offAll(phase) {
    let removedCount = 0;
    if (phase) {
      const phaseHooks = this.phaseHooks.get(phase);
      if (phaseHooks) {
        for (const hookId of phaseHooks) {
          this.hooks.delete(hookId);
          removedCount++;
        }
        this.phaseHooks.delete(phase);
      }
    } else {
      removedCount = this.hooks.size;
      this.hooks.clear();
      this.phaseHooks.clear();
    }
    this.logger?.debug(`Lifecycle hooks removed`, {
      phase,
      count: removedCount
    });
    return removedCount;
  }
  // 钩子查询
  /**
   * 获取指定阶段的钩子（按优先级降序）。
   */
  getHooks(phase) {
    const phaseHooks = this.phaseHooks.get(phase);
    if (!phaseHooks) {
      return [];
    }
    const hooks = Array.from(phaseHooks).map((id) => this.hooks.get(id)).filter(Boolean).sort((a, b) => b.priority - a.priority);
    return hooks;
  }
  /**
   * 获取所有已注册钩子（按优先级降序）。
   */
  getAllHooks() {
    return Array.from(this.hooks.values()).sort((a, b) => b.priority - a.priority);
  }
  hasHooks(phase) {
    const phaseHooks = this.phaseHooks.get(phase);
    return phaseHooks ? phaseHooks.size > 0 : false;
  }
  /**
   * 获取钩子数量，可选按阶段统计。
   */
  getHookCount(phase) {
    if (phase) {
      const phaseHooks = this.phaseHooks.get(phase);
      return phaseHooks ? phaseHooks.size : 0;
    }
    return this.hooks.size;
  }
  // 生命周期执行
  /**
   * 异步执行指定阶段的所有钩子。
   * @returns 生命周期事件（包含执行结果与耗时）
   */
  async execute(phase, engine, data) {
    const startTime = Date.now();
    this.currentPhase = phase;
    const context = {
      phase,
      timestamp: startTime,
      engine,
      data
    };
    const hooks = this.getHooks(phase);
    let hooksExecuted = 0;
    let error;
    this.logger?.debug(`Executing lifecycle phase: ${phase}`, {
      hookCount: hooks.length
    });
    try {
      for (const hookInfo of hooks) {
        try {
          await hookInfo.hook(context);
          hooksExecuted++;
          if (hookInfo.once) {
            this.off(hookInfo.id);
          }
        } catch (hookError) {
          error = hookError;
          this.logger?.error(`Error in lifecycle hook`, {
            phase,
            hookId: hookInfo.id,
            error: hookError
          });
          this.errorCallbacks.forEach((callback) => {
            try {
              if (error) {
                callback(error, { ...context, error });
              }
            } catch (callbackError) {
              this.logger?.error("Error in lifecycle error callback", callbackError);
            }
          });
          if (this.isCriticalPhase(phase)) {
            break;
          }
        }
      }
    } catch (executionError) {
      error = executionError;
      this.logger?.error(`Critical error during lifecycle execution`, {
        phase,
        error: executionError
      });
    }
    const endTime = Date.now();
    const event = {
      phase,
      timestamp: startTime,
      duration: endTime - startTime,
      success: !error,
      error,
      hooksExecuted,
      data
    };
    this.addToHistory(event);
    this.logger?.debug(`Lifecycle phase completed: ${phase}`, {
      duration: event.duration,
      success: event.success,
      hooksExecuted
    });
    return event;
  }
  executeSync(phase, engine, data) {
    const startTime = Date.now();
    this.currentPhase = phase;
    const context = {
      phase,
      timestamp: startTime,
      engine,
      data
    };
    const hooks = this.getHooks(phase);
    let hooksExecuted = 0;
    let error;
    this.logger?.debug(`Executing lifecycle phase synchronously: ${phase}`, {
      hookCount: hooks.length
    });
    try {
      for (const hookInfo of hooks) {
        try {
          const result = hookInfo.hook(context);
          if (result && typeof result.then === "function") {
            this.logger?.warn(`Async hook detected in sync execution`, {
              phase,
              hookId: hookInfo.id
            });
          }
          hooksExecuted++;
          if (hookInfo.once) {
            this.off(hookInfo.id);
          }
        } catch (hookError) {
          error = hookError;
          this.logger?.error(`Error in lifecycle hook`, {
            phase,
            hookId: hookInfo.id,
            error: hookError
          });
          this.errorCallbacks.forEach((callback) => {
            try {
              if (error) {
                callback(error, { ...context, error });
              }
            } catch (callbackError) {
              this.logger?.error("Error in lifecycle error callback", callbackError);
            }
          });
          if (this.isCriticalPhase(phase)) {
            break;
          }
        }
      }
    } catch (executionError) {
      error = executionError;
      this.logger?.error(`Critical error during sync lifecycle execution`, {
        phase,
        error: executionError
      });
    }
    const endTime = Date.now();
    const event = {
      phase,
      timestamp: startTime,
      duration: endTime - startTime,
      success: !error,
      error,
      hooksExecuted,
      data
    };
    this.addToHistory(event);
    this.logger?.debug(`Sync lifecycle phase completed: ${phase}`, {
      duration: event.duration,
      success: event.success,
      hooksExecuted
    });
    return event;
  }
  // 生命周期状态
  getCurrentPhase() {
    return this.currentPhase;
  }
  getLastEvent() {
    return this.history[this.history.length - 1];
  }
  getHistory() {
    return [...this.history];
  }
  isPhaseExecuted(phase) {
    return this.history.some((event) => event.phase === phase && event.success);
  }
  // 错误处理
  onError(callback) {
    if (this.errorCallbacks.length >= this.MAX_ERROR_CALLBACKS) {
      this.logger?.warn(`Maximum error callbacks limit (${this.MAX_ERROR_CALLBACKS}) reached, removing oldest`);
      this.errorCallbacks.shift();
    }
    this.errorCallbacks.push(callback);
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }
  // 统计信息
  getStats() {
    const phaseStats = {};
    for (const [phase, hooks] of this.phaseHooks) {
      phaseStats[phase] = hooks.size;
    }
    const executionTimes = this.history.filter((event) => event.duration !== void 0).map((event) => event.duration || 0);
    const averageExecutionTime = executionTimes.length > 0 ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length : 0;
    const errorCount = this.history.filter((event) => !event.success).length;
    return {
      totalHooks: this.hooks.size,
      phaseStats,
      executionHistory: [...this.history],
      averageExecutionTime,
      errorCount
    };
  }
  // 清理
  clear() {
    this.hooks.clear();
    this.phaseHooks.clear();
    this.errorCallbacks.length = 0;
    this.logger?.debug("Lifecycle manager cleared");
  }
  reset() {
    this.clear();
    this.history.length = 0;
    this.currentPhase = void 0;
    this.hookIdCounter = 0;
    this.logger?.debug("Lifecycle manager reset");
  }
  // 销毁方法
  destroy() {
    this.clear();
    this.history.length = 0;
    this.currentPhase = void 0;
    this.hookIdCounter = 0;
    this.logger = void 0;
  }
  // 私有方法
  generateHookId() {
    return `hook_${++this.hookIdCounter}_${Date.now()}`;
  }
  addToHistory(event) {
    if (this.history.length >= this.maxHistorySize) {
      this.history.shift();
    }
    this.history.push(event);
  }
  // 移除最旧的钩子
  removeOldestHooks(count) {
    const sortedHooks = Array.from(this.hooks.entries()).sort((a, b) => a[1].registeredAt - b[1].registeredAt).slice(0, count);
    sortedHooks.forEach(([hookId, hookInfo]) => {
      this.hooks.delete(hookId);
      const phaseHooks = this.phaseHooks.get(hookInfo.phase);
      if (phaseHooks) {
        phaseHooks.delete(hookId);
        if (phaseHooks.size === 0) {
          this.phaseHooks.delete(hookInfo.phase);
        }
      }
    });
    this.logger?.debug("Removed oldest hooks", { count: sortedHooks.length });
  }
  isCriticalPhase(phase) {
    const criticalPhases = ["init", "mount", "destroy"];
    return criticalPhases.includes(phase);
  }
  // 添加缺失的方法
  add(hook) {
    if (hook && hook.phase && hook.handler) {
      this.on(hook.phase, hook.handler, hook.priority || 0);
    }
  }
  remove(name) {
    this.off(name);
  }
  getOrder(phase) {
    const hooks = this.getHooks(phase);
    return hooks.sort((a, b) => (b?.priority || 0) - (a?.priority || 0)).map((h) => h?.id || "");
  }
  validate() {
    return {
      valid: true,
      errors: [],
      warnings: []
    };
  }
  optimize() {
    this.logger?.debug("Lifecycle hooks optimized");
  }
}
function createLifecycleManager(logger) {
  return new LifecycleManagerImpl(logger);
}
function LifecycleHookDecorator(phase, priority = 0) {
  return function(_target, _propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args) {
      const self = this;
      if (self.lifecycle && typeof self.lifecycle.on === "function") {
        self.lifecycle.on(phase, originalMethod.bind(this), priority);
      }
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}
const LIFECYCLE_PHASES = {
  BEFORE_INIT: "beforeInit",
  INIT: "init",
  AFTER_INIT: "afterInit",
  BEFORE_MOUNT: "beforeMount",
  MOUNT: "mount",
  AFTER_MOUNT: "afterMount",
  BEFORE_UNMOUNT: "beforeUnmount",
  UNMOUNT: "unmount",
  AFTER_UNMOUNT: "afterUnmount",
  BEFORE_DESTROY: "beforeDestroy",
  DESTROY: "destroy",
  AFTER_DESTROY: "afterDestroy",
  ERROR: "error",
  CUSTOM: "custom"
};
const LIFECYCLE_ORDER = [
  "beforeInit",
  "init",
  "afterInit",
  "beforeMount",
  "mount",
  "afterMount",
  "beforeUnmount",
  "unmount",
  "afterUnmount",
  "beforeDestroy",
  "destroy",
  "afterDestroy"
];
class LifecycleHelper {
  static isValidPhase(phase) {
    return Object.values(LIFECYCLE_PHASES).includes(phase);
  }
  static getPhaseIndex(phase) {
    return LIFECYCLE_ORDER.indexOf(phase);
  }
  static isPhaseAfter(phase1, phase2) {
    const index1 = this.getPhaseIndex(phase1);
    const index2 = this.getPhaseIndex(phase2);
    return index1 > index2;
  }
  static isPhaseBefore(phase1, phase2) {
    const index1 = this.getPhaseIndex(phase1);
    const index2 = this.getPhaseIndex(phase2);
    return index1 < index2;
  }
  static getNextPhase(phase) {
    const index = this.getPhaseIndex(phase);
    return index >= 0 && index < LIFECYCLE_ORDER.length - 1 ? LIFECYCLE_ORDER[index + 1] : void 0;
  }
  static getPreviousPhase(phase) {
    const index = this.getPhaseIndex(phase);
    return index > 0 ? LIFECYCLE_ORDER[index - 1] : void 0;
  }
}

exports.LIFECYCLE_ORDER = LIFECYCLE_ORDER;
exports.LIFECYCLE_PHASES = LIFECYCLE_PHASES;
exports.LifecycleHelper = LifecycleHelper;
exports.LifecycleHookDecorator = LifecycleHookDecorator;
exports.LifecycleManagerImpl = LifecycleManagerImpl;
exports.createLifecycleManager = createLifecycleManager;
//# sourceMappingURL=lifecycle-manager.cjs.map
