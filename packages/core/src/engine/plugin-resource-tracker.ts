/**
 * 插件资源追踪器
 * 用于追踪和管理插件注册的所有资源，确保插件卸载时能够完整清理
 */

/**
 * AggregateError polyfill for environments that don't support it
 */
class AggregateErrorPolyfill extends Error {
  errors: Error[];

  constructor(errors: Error[], message?: string) {
    super(message);
    this.name = 'AggregateError';
    this.errors = errors;
  }
}

// Use native AggregateError if available, otherwise use polyfill
const AggregateErrorImpl = (typeof globalThis !== 'undefined' &&
  'AggregateError' in globalThis)
  ? (globalThis as unknown as { AggregateError: typeof AggregateErrorPolyfill }).AggregateError
  : AggregateErrorPolyfill;

export interface PluginResources {
  /** 事件监听器 */
  eventListeners: Array<{
    event: string;
    handler: Function;
  }>;

  /** 定时器 */
  timers: Array<{
    id: number;
    type: 'timeout' | 'interval';
  }>;

  /** DOM 事件监听器 */
  domListeners: Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
    options?: AddEventListenerOptions;
  }>;

  /** 其他资源（如 WebSocket、Worker 等） */
  customResources: Array<{
    name: string;
    cleanup: () => void | Promise<void>;
  }>;

  /** 注册的钩子 */
  hooks: Array<{
    lifecycle: string;
    handler: Function;
  }>;
}

export class PluginResourceTracker {
  private resources = new Map<string, PluginResources>();

  /**
   * 初始化插件资源追踪
   */
  initPlugin(pluginName: string): void {
    if (this.resources.has(pluginName)) {
      console.warn(`Plugin ${pluginName} already initialized`);
      return;
    }

    this.resources.set(pluginName, {
      eventListeners: [],
      timers: [],
      domListeners: [],
      customResources: [],
      hooks: []
    });
  }

  /**
   * 追踪事件监听器
   */
  trackEventListener(pluginName: string, event: string, handler: Function): void {
    const resources = this.resources.get(pluginName);
    if (!resources) {
      throw new Error(`Plugin ${pluginName} not initialized`);
    }

    resources.eventListeners.push({ event, handler });
  }

  /**
   * 追踪定时器
   */
  trackTimer(pluginName: string, timerId: number, type: 'timeout' | 'interval'): void {
    const resources = this.resources.get(pluginName);
    if (!resources) {
      throw new Error(`Plugin ${pluginName} not initialized`);
    }

    resources.timers.push({ id: timerId, type });
  }

  /**
   * 追踪 DOM 事件监听器
   */
  trackDomListener(
    pluginName: string,
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    const resources = this.resources.get(pluginName);
    if (!resources) {
      throw new Error(`Plugin ${pluginName} not initialized`);
    }

    resources.domListeners.push({ element, event, handler, options });
  }

  /**
   * 追踪自定义资源
   */
  trackCustomResource(pluginName: string, name: string, cleanup: () => void | Promise<void>): void {
    const resources = this.resources.get(pluginName);
    if (!resources) {
      throw new Error(`Plugin ${pluginName} not initialized`);
    }

    resources.customResources.push({ name, cleanup });
  }

  /**
   * 追踪钩子
   */
  trackHook(pluginName: string, lifecycle: string, handler: Function): void {
    const resources = this.resources.get(pluginName);
    if (!resources) {
      throw new Error(`Plugin ${pluginName} not initialized`);
    }

    resources.hooks.push({ lifecycle, handler });
  }

  /**
   * 获取插件资源
   */
  getResources(pluginName: string): PluginResources | undefined {
    return this.resources.get(pluginName);
  }

  /**
   * 清理插件所有资源
   */
  async cleanupPlugin(
    pluginName: string,
    context: {
      off: (event: string, handler: Function) => void;
      removeHook: (lifecycle: string, handler: Function) => void;
    }
  ): Promise<void> {
    const resources = this.resources.get(pluginName);
    if (!resources) {
      return;
    }

    const errors: Error[] = [];

    try {
      // 清理事件监听器
      for (const { event, handler } of resources.eventListeners) {
        try {
          context.off(event, handler);
        } catch (error) {
          errors.push(new Error(`Failed to remove event listener: ${error}`));
        }
      }

      // 清理定时器
      for (const { id, type } of resources.timers) {
        try {
          if (type === 'timeout') {
            clearTimeout(id);
          } else {
            clearInterval(id);
          }
        } catch (error) {
          errors.push(new Error(`Failed to clear timer: ${error}`));
        }
      }

      // 清理 DOM 事件监听器
      for (const { element, event, handler, options } of resources.domListeners) {
        try {
          element.removeEventListener(event, handler, options);
        } catch (error) {
          errors.push(new Error(`Failed to remove DOM listener: ${error}`));
        }
      }

      // 清理钩子
      for (const { lifecycle, handler } of resources.hooks) {
        try {
          context.removeHook(lifecycle, handler);
        } catch (error) {
          errors.push(new Error(`Failed to remove hook: ${error}`));
        }
      }

      // 清理自定义资源
      for (const { name, cleanup } of resources.customResources) {
        try {
          await cleanup();
        } catch (error) {
          errors.push(new Error(`Failed to cleanup custom resource ${name}: ${error}`));
        }
      }

      // 从追踪器中移除
      this.resources.delete(pluginName);

      // 如果有错误，抛出聚合错误
      if (errors.length > 0) {
        throw new AggregateErrorImpl(errors, `Failed to cleanup plugin ${pluginName}`);
      }
    } catch (error) {
      // 即使清理失败，也要删除资源记录
      this.resources.delete(pluginName);
      throw error;
    }
  }

  /**
   * 获取所有插件的资源统计
   */
  getResourceStats(): Record<string, {
    eventListeners: number;
    timers: number;
    domListeners: number;
    customResources: number;
    hooks: number;
    total: number;
  }> {
    const stats: Record<string, { eventListeners: number; timers: number; domListeners: number; customResources: number; hooks: number; total: number }> = {};

    for (const [pluginName, resources] of this.resources) {
      const stat = {
        eventListeners: resources.eventListeners.length,
        timers: resources.timers.length,
        domListeners: resources.domListeners.length,
        customResources: resources.customResources.length,
        hooks: resources.hooks.length,
        total: 0
      };

      stat.total = stat.eventListeners + stat.timers + stat.domListeners +
        stat.customResources + stat.hooks;

      stats[pluginName] = stat;
    }

    return stats;
  }

  /**
   * 清理所有插件资源
   */
  async cleanupAll(context: {
    off: (event: string, handler: Function) => void;
    removeHook: (lifecycle: string, handler: Function) => void;
  }): Promise<void> {
    const pluginNames = Array.from(this.resources.keys());
    const errors: Error[] = [];

    for (const pluginName of pluginNames) {
      try {
        await this.cleanupPlugin(pluginName, context);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    if (errors.length > 0) {
      throw new AggregateErrorImpl(errors, 'Failed to cleanup all plugins');
    }
  }
}

/**
 * 创建带资源追踪的插件上下文 Proxy
 */
export function createTrackedPluginContext<T extends object>(
  pluginName: string,
  tracker: PluginResourceTracker,
  originalContext: T
): T {
  tracker.initPlugin(pluginName);

  return new Proxy(originalContext, {
    get(target, prop) {
      const value = target[prop];

      // 拦截事件监听方法
      if (prop === 'on' && typeof value === 'function') {
        return (event: string, handler: Function) => {
          tracker.trackEventListener(pluginName, event, handler);
          return value.call(target, event, handler);
        };
      }

      // 拦截钩子注册方法
      if (prop === 'hook' && typeof value === 'function') {
        return (lifecycle: string, handler: Function) => {
          tracker.trackHook(pluginName, lifecycle, handler);
          return value.call(target, lifecycle, handler);
        };
      }

      // 拦截定时器方法
      if (prop === 'setTimeout') {
        return (callback: Function, delay: number, ...args: unknown[]) => {
          const timerId = setTimeout(callback, delay, ...args);
          tracker.trackTimer(pluginName, timerId, 'timeout');
          return timerId;
        };
      }

      if (prop === 'setInterval') {
        return (callback: Function, delay: number, ...args: unknown[]) => {
          const timerId = setInterval(callback, delay, ...args);
          tracker.trackTimer(pluginName, timerId, 'interval');
          return timerId;
        };
      }

      // 拦截 DOM 事件监听方法
      if (prop === 'addEventListener') {
        return (element: EventTarget, event: string, handler: EventListener, options?: AddEventListenerOptions) => {
          tracker.trackDomListener(pluginName, element, event, handler, options);
          element.addEventListener(event, handler, options);
        };
      }

      // 拦截自定义资源注册
      if (prop === 'registerResource') {
        return (name: string, cleanup: () => void | Promise<void>) => {
          tracker.trackCustomResource(pluginName, name, cleanup);
        };
      }

      return value;
    }
  });
}