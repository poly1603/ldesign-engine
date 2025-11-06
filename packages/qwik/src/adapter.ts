/**
 * Qwik 框架适配器
 * 
 * 支持 Qwik 1.0+
 */

import type {
  FrameworkAdapter,
  FrameworkInfo,
  StateAdapter,
  EventAdapter,
  LifecycleHookMap,
  CoreEngine,
  ReactiveState,
  Unsubscribe,
} from '@ldesign/engine-core'

/**
 * Qwik 框架信息
 */
const QWIK_INFO: FrameworkInfo = {
  name: 'qwik',
  version: '1.0+',
  features: {
    reactivity: true,
    components: true,
    routing: false,
    stateManagement: true,
  },
}

/**
 * Qwik 状态适配器
 */
class QwikStateAdapter implements StateAdapter {
  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    // Qwik 使用 signal，但这里我们使用简单的响应式对象
    let value = initialValue
    const listeners = new Set<(value: T) => void>()

    return {
      get value() {
        return value
      },
      set value(newValue: T) {
        value = newValue
        listeners.forEach(listener => listener(newValue))
      },
      subscribe(callback: (value: T) => void): Unsubscribe {
        listeners.add(callback)
        return () => listeners.delete(callback)
      },
    }
  }

  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe {
    let oldValue: T | undefined
    const check = () => {
      const newValue = getter()
      if (newValue !== oldValue) {
        callback(newValue, oldValue)
        oldValue = newValue
      }
    }

    // 使用 requestAnimationFrame 实现简单的 watch
    let rafId: number | null = null
    const loop = () => {
      check()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }

  batchUpdate(fn: () => void): void {
    fn()
  }
}

/**
 * Qwik 事件适配器
 */
class QwikEventAdapter implements EventAdapter {
  private handlers = new Map<string, Set<(...args: any[]) => void>>()

  on(target: any, event: string, handler: (...args: any[]) => void): Unsubscribe {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    return () => {
      this.handlers.get(event)?.delete(handler)
    }
  }

  off(target: any, event: string, handler?: (...args: any[]) => void): void {
    if (handler) {
      this.handlers.get(event)?.delete(handler)
    } else {
      this.handlers.delete(event)
    }
  }

  emit(target: any, event: string, ...args: any[]): void {
    this.handlers.get(event)?.forEach(handler => handler(...args))
  }
}

/**
 * Qwik 框架适配器
 */
export class QwikAdapter implements FrameworkAdapter {
  readonly info = QWIK_INFO
  private stateAdapter = new QwikStateAdapter()
  private eventAdapter = new QwikEventAdapter()
  private engineMap = new WeakMap<any, CoreEngine>()
  public renderedApp: any = null

  /**
   * 创建状态适配器
   */
  createStateAdapter(): StateAdapter {
    return this.stateAdapter
  }

  /**
   * 创建事件适配器
   */
  createEventAdapter(): EventAdapter {
    return this.eventAdapter
  }

  /**
   * 映射生命周期钩子
   */
  mapLifecycleHooks(): LifecycleHookMap {
    return {
      beforeMount: 'beforeMount',
      mounted: 'mounted',
      beforeUnmount: 'beforeUnmount',
      unmounted: 'unmounted',
    }
  }

  /**
   * 创建应用
   */
  createApp(rootComponent: any, options: Record<string, unknown> = {}): any {
    return {
      component: rootComponent,
      options,
    }
  }

  /**
   * 挂载应用
   */
  async mount(app: any, mountElement: string | Element): Promise<void> {
    const target = typeof mountElement === 'string'
      ? document.querySelector(mountElement)
      : mountElement

    if (!target) {
      throw new Error(`Mount element not found: ${mountElement}`)
    }

    const { component } = app

    if (!component) {
      throw new Error('Component is required')
    }

    // 使用 Qwik 官方 render 方法挂载组件
    // Qwik 的 render 函数需要在 .tsx 文件中使用 JSX 语法
    // 由于我们在 .ts 文件中，我们需要动态导入并执行渲染
    const { render } = await import('@builder.io/qwik')

    // Qwik 组件需要作为 JSX 元素传递
    // 在运行时，我们需要创建一个新的 tsx 文件或者使用其他方式
    // 最简单的方法是：让 main.tsx 中直接调用 render，而不是通过 adapter
    
    // 临时方案：将组件注册到全局，让 main.tsx 可以访问
    ;(window as any).__qwikComponentToRender = component
    ;(window as any).__qwikRenderTarget = target
    ;(window as any).__qwikRender = render

    // 触发自定义事件，通知 main.tsx 执行渲染
    window.dispatchEvent(new CustomEvent('qwik:mount', {
      detail: { component, target, render }
    }))
  }

  /**
   * 卸载应用
   */
  async unmount(app: any, mountElement: string | Element): Promise<void> {
    const target = typeof mountElement === 'string'
      ? document.querySelector(mountElement)
      : mountElement

    if (target && this.renderedApp) {
      // Qwik 没有明确的卸载方法，清空内容即可
      target.innerHTML = ''
      this.renderedApp = null
    }
  }

  /**
   * 注册引擎
   */
  registerEngine(app: any, engine: CoreEngine): void {
    this.engineMap.set(app, engine)
    // 将引擎保存到全局，供组件使用
    ;(window as any).__ldesignEngine = engine
  }
}

/**
 * 创建 Qwik 适配器实例
 */
export function createQwikAdapter(): QwikAdapter {
  return new QwikAdapter()
}
