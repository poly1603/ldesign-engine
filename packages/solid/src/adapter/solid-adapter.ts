/**
 * Solid.js 框架适配器实现
 * 
 * 将引擎核心功能适配到 Solid.js 生态系统
 * 
 * @module adapter/solid-adapter
 */

import { render } from 'solid-js/web'
import type { JSX } from 'solid-js'
import type {
  FrameworkAdapter,
  FrameworkInfo,
  LifecycleHookMap,
  StateAdapter,
  EventAdapter,
  CoreEngine,
} from '@ldesign/engine-core'
import { SolidStateAdapter } from './solid-state-adapter'
import { SolidEventAdapter } from './solid-event-adapter'

/**
 * Solid 应用类型
 */
export interface SolidApp {
  /** 挂载应用 */
  mount(target: Element | string): void
  /** 卸载应用 */
  unmount(): void
  /** 引擎实例 */
  engine?: CoreEngine
}

/**
 * Solid 组件类型
 */
export type SolidComponent = () => JSX.Element

/**
 * Solid 框架适配器
 * 
 * 实现 FrameworkAdapter 接口,提供 Solid.js 特定的集成功能
 */
export class SolidFrameworkAdapter implements FrameworkAdapter<SolidApp, SolidComponent, Element> {
  readonly info: FrameworkInfo = {
    name: 'solid',
    version: '1.8.0',
    features: {
      reactive: true,
      components: true,
      directives: true,
      slots: true,
    },
  }

  /**
   * 创建 Solid 应用
   * 
   * @param rootComponent - 根组件
   * @param options - 创建选项
   * @returns SolidApp 实例
   */
  createApp(rootComponent: SolidComponent, options?: any): SolidApp {
    let dispose: (() => void) | null = null
    let engine: CoreEngine | undefined = undefined

    const app: SolidApp = {
      mount(target: Element | string) {
        const element = typeof target === 'string' 
          ? document.querySelector(target)
          : target

        if (!element) {
          throw new Error(`Mount target not found: ${target}`)
        }

        // 使用 Solid 的 render 函数
        dispose = render(rootComponent, element)
      },

      unmount() {
        if (dispose) {
          dispose()
          dispose = null
        }
      },

      get engine() {
        return engine
      },

      set engine(value: CoreEngine | undefined) {
        engine = value
      },
    }

    return app
  }

  /**
   * 挂载应用
   * 
   * @param app - SolidApp 实例
   * @param mountElement - 挂载元素
   */
  async mount(app: SolidApp, mountElement: string | Element): Promise<void> {
    app.mount(mountElement)
  }

  /**
   * 卸载应用
   * 
   * @param app - SolidApp 实例
   */
  async unmount(app: SolidApp): Promise<void> {
    app.unmount()
  }

  /**
   * 注册引擎到应用
   * 
   * 使用 Solid 的 context API
   * 
   * @param app - SolidApp 实例
   * @param engine - 引擎实例
   */
  registerEngine(app: SolidApp, engine: CoreEngine): void {
    app.engine = engine
  }

  /**
   * 创建状态适配器
   * 
   * @returns Solid 状态适配器
   */
  createStateAdapter(): StateAdapter {
    return new SolidStateAdapter()
  }

  /**
   * 创建事件适配器
   * 
   * @returns Solid 事件适配器
   */
  createEventAdapter(): EventAdapter {
    return new SolidEventAdapter()
  }

  /**
   * 映射生命周期钩子
   * 
   * @returns 生命周期钩子映射
   */
  mapLifecycleHooks(): LifecycleHookMap {
    return {
      beforeMount: 'onMount',
      mounted: 'onMount',
      beforeUpdate: null, // Solid 没有 beforeUpdate
      updated: null, // Solid 没有 updated
      beforeUnmount: 'onCleanup',
      unmounted: 'onCleanup',
    }
  }

  /**
   * 获取应用实例
   * 
   * @param app - SolidApp 实例
   * @returns SolidApp 实例本身
   */
  getAppInstance(app: SolidApp): SolidApp {
    return app
  }
}

/**
 * 创建 Solid 框架适配器
 * 
 * @returns Solid 适配器实例
 */
export function createSolidAdapter(): SolidFrameworkAdapter {
  return new SolidFrameworkAdapter()
}

