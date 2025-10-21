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

class ResourceManager {
  constructor() {
    this.timers = /* @__PURE__ */ new Set();
    this.intervals = /* @__PURE__ */ new Set();
    this.observers = /* @__PURE__ */ new Set();
    this.listeners = /* @__PURE__ */ new Map();
    this.animationFrames = /* @__PURE__ */ new Set();
    this.weakRefs = /* @__PURE__ */ new Set();
    this.cleanupFunctions = /* @__PURE__ */ new Set();
    this.destroyed = false;
  }
  /**
   * 注册定时器
   * @returns 定时器 ID
   */
  registerTimeout(id) {
    this.checkDestroyed();
    this.timers.add(id);
    return id;
  }
  /**
   * 注销定时器
   */
  unregisterTimeout(id) {
    clearTimeout(id);
    this.timers.delete(id);
  }
  /**
   * 注册间隔器
   * @returns 间隔器 ID
   */
  registerInterval(id) {
    this.checkDestroyed();
    this.intervals.add(id);
    return id;
  }
  /**
   * 注销间隔器
   */
  unregisterInterval(id) {
    clearInterval(id);
    this.intervals.delete(id);
  }
  /**
   * 注册观察器
   * @returns 观察器实例
   */
  registerObserver(observer) {
    this.checkDestroyed();
    this.observers.add(observer);
    return observer;
  }
  /**
   * 注销观察器
   */
  unregisterObserver(observer) {
    observer.disconnect();
    this.observers.delete(observer);
  }
  /**
   * 注册事件监听器
   */
  registerListener(target, event, listener, options) {
    this.checkDestroyed();
    if (!this.listeners.has(target)) {
      this.listeners.set(target, /* @__PURE__ */ new Map());
    }
    const eventMap = this.listeners.get(target);
    if (!eventMap.has(event)) {
      eventMap.set(event, /* @__PURE__ */ new Set());
    }
    eventMap.get(event).add(listener);
    target.addEventListener(event, listener, options);
  }
  /**
   * 注销事件监听器
   */
  unregisterListener(target, event, listener, options) {
    const eventMap = this.listeners.get(target);
    if (!eventMap)
      return;
    const listeners = eventMap.get(event);
    if (!listeners)
      return;
    listeners.delete(listener);
    target.removeEventListener(event, listener, options);
    if (listeners.size === 0) {
      eventMap.delete(event);
    }
    if (eventMap.size === 0) {
      this.listeners.delete(target);
    }
  }
  /**
   * 注册动画帧
   * @returns 动画帧 ID
   */
  registerAnimationFrame(id) {
    this.checkDestroyed();
    this.animationFrames.add(id);
    return id;
  }
  /**
   * 注销动画帧
   */
  unregisterAnimationFrame(id) {
    cancelAnimationFrame(id);
    this.animationFrames.delete(id);
  }
  /**
   * 注册弱引用
   * 用于追踪对象，但不阻止垃圾回收
   */
  registerWeakRef(ref) {
    this.checkDestroyed();
    this.weakRefs.add(ref);
    return ref;
  }
  /**
   * 注册自定义清理函数
   */
  registerCleanup(fn) {
    this.checkDestroyed();
    this.cleanupFunctions.add(fn);
  }
  /**
   * 注销自定义清理函数
   */
  unregisterCleanup(fn) {
    this.cleanupFunctions.delete(fn);
  }
  /**
   * 检查是否已销毁
   */
  checkDestroyed() {
    if (this.destroyed) {
      throw new Error("ResourceManager has been destroyed");
    }
  }
  /**
   * 获取资源统计信息
   */
  getStats() {
    return {
      timers: this.timers.size,
      intervals: this.intervals.size,
      observers: this.observers.size,
      listenerTargets: this.listeners.size,
      totalListeners: Array.from(this.listeners.values()).reduce((sum, map) => sum + Array.from(map.values()).reduce((s, set) => s + set.size, 0), 0),
      animationFrames: this.animationFrames.size,
      weakRefs: this.weakRefs.size,
      cleanupFunctions: this.cleanupFunctions.size,
      destroyed: this.destroyed
    };
  }
  /**
   * 清理所有资源
   * 应在不再需要时调用
   */
  destroy() {
    if (this.destroyed) {
      return;
    }
    this.timers.forEach((id) => clearTimeout(id));
    this.timers.clear();
    this.intervals.forEach((id) => clearInterval(id));
    this.intervals.clear();
    this.observers.forEach((observer) => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn("Failed to disconnect observer:", error);
      }
    });
    this.observers.clear();
    this.listeners.forEach((eventMap, target) => {
      eventMap.forEach((listeners, event) => {
        listeners.forEach((listener) => {
          try {
            target.removeEventListener(event, listener);
          } catch (error) {
            console.warn("Failed to remove event listener:", error);
          }
        });
      });
    });
    this.listeners.clear();
    this.animationFrames.forEach((id) => {
      try {
        cancelAnimationFrame(id);
      } catch (error) {
        console.warn("Failed to cancel animation frame:", error);
      }
    });
    this.animationFrames.clear();
    this.cleanupFunctions.forEach((fn) => {
      try {
        fn();
      } catch (error) {
        console.warn("Failed to execute cleanup function:", error);
      }
    });
    this.cleanupFunctions.clear();
    this.weakRefs.clear();
    this.destroyed = true;
  }
  /**
   * 检查是否已销毁
   */
  isDestroyed() {
    return this.destroyed;
  }
}
function createResourceManager() {
  return new ResourceManager();
}

exports.ResourceManager = ResourceManager;
exports.createResourceManager = createResourceManager;
//# sourceMappingURL=resource-manager.cjs.map
