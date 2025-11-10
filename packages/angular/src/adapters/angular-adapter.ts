/**
 * Angular 框架适配器
 * 
 * 支持 Angular 17+
 */

import { BehaviorSubject, Subject } from 'rxjs'
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
 * Angular 框架信息
 */
const ANGULAR_INFO: FrameworkInfo = {
  name: 'angular',
  version: '17+',
  features: {
    reactive: true,
    components: true,
    directives: true,
    slots: false,
  },
}

/**
 * Angular 状态适配器
 * 
 * 使用 RxJS BehaviorSubject 实现响应式状态管理
 */
class AngularStateAdapter implements StateAdapter {
  /**
   * 创建响应式状态
   * 
   * @param initialValue - 初始值
   * @returns 响应式状态对象
   */
  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    const subject = new BehaviorSubject(initialValue)
    const initial = JSON.parse(JSON.stringify(initialValue))

    return {
      get value() {
        return subject.value
      },
      set value(newValue: T) {
        subject.next(newValue)
      },
      readonly() {
        return subject.value
      },
      update(updater: (prev: T) => T) {
        subject.next(updater(subject.value))
      },
      reset() {
        subject.next(JSON.parse(JSON.stringify(initial)))
      },
      // 暴露 RxJS Subject 以便在 Angular 中使用
      subject,
    } as ReactiveState<T> & { subject: BehaviorSubject<T> }
  }

  /**
   * 监听状态变化
   * 
   * @param getter - 获取状态的函数
   * @param callback - 状态变化时的回调函数
   * @returns 取消监听的函数
   */
  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe {
    let oldValue: T | undefined
    let isFirst = true

    const interval = setInterval(() => {
      const value = getter()
      if (!isFirst && value !== oldValue) {
        callback(value, oldValue)
      }
      oldValue = value
      isFirst = false
    }, 16) // 约 60fps

    return () => clearInterval(interval)
  }

  /**
   * 批量更新状态
   * 
   * @param fn - 批量更新函数
   */
  batch(fn: () => void): void {
    fn()
  }

  /**
   * 创建计算属性
   * 
   * @param getter - 计算函数
   * @returns 只读的响应式状态
   */
  computed<T>(getter: () => T): ReactiveState<T> {
    const subject = new BehaviorSubject(getter())

    // 定期更新计算值
    const interval = setInterval(() => {
      subject.next(getter())
    }, 16)

    const state = {
      get value() {
        return subject.value
      },
      set value(_newValue: T) {
        console.warn('Cannot set computed property')
      },
      readonly() {
        return subject.value
      },
      update(_updater: (prev: T) => T) {
        console.warn('Cannot update computed property')
      },
      subject,
      dispose() {
        clearInterval(interval)
      },
    } as ReactiveState<T> & { subject: BehaviorSubject<T>; dispose: () => void }

    return state
  }
}

/**
 * Angular 事件适配器
 * 
 * 使用 RxJS Subject 实现事件系统
 */
class AngularEventAdapter implements EventAdapter {
  private subjects = new Map<string, Subject<any>>()

  /**
   * 获取或创建事件 Subject
   */
  private getSubject(event: string): Subject<any> {
    if (!this.subjects.has(event)) {
      this.subjects.set(event, new Subject())
    }
    return this.subjects.get(event)!
  }

  /**
   * 触发事件
   * 
   * @param event - 事件名称
   * @param payload - 事件数据
   */
  emit(event: string, payload?: any): void {
    this.getSubject(event).next(payload)
  }

  /**
   * 监听事件
   * 
   * @param event - 事件名称
   * @param handler - 事件处理函数
   * @returns 取消监听的函数
   */
  on(event: string, handler: (payload: any) => void): Unsubscribe {
    const subscription = this.getSubject(event).subscribe(handler)
    return () => subscription.unsubscribe()
  }

  /**
   * 监听事件一次
   * 
   * @param event - 事件名称
   * @param handler - 事件处理函数
   * @returns 取消监听的函数
   */
  once(event: string, handler: (payload: any) => void): Unsubscribe {
    const wrapper = (payload: any) => {
      handler(payload)
      this.off(event, wrapper)
    }
    return this.on(event, wrapper)
  }

  /**
   * 取消监听事件
   * 
   * @param event - 事件名称
   * @param handler - 事件处理函数(可选)
   */
  off(event: string, handler?: (payload: any) => void): void {
    if (!handler) {
      const subject = this.subjects.get(event)
      if (subject) {
        subject.complete()
        this.subjects.delete(event)
      }
    }
  }
}

/**
 * Angular 框架适配器
 */
export class AngularAdapter implements FrameworkAdapter<any, any> {
  readonly info = ANGULAR_INFO
  private engineSubject = new BehaviorSubject<CoreEngine | null>(null)

  /**
   * 创建 Angular 应用
   * 
   * @param rootComponent - 根组件
   * @param options - 应用选项
   * @returns Angular 应用实例
   */
  createApp(rootComponent: any, options?: any): any {
    return {
      component: rootComponent,
      options: options || {},
    }
  }

  /**
   * 挂载应用
   * 
   * Angular 应用通常通过 bootstrapApplication 或 platformBrowserDynamic 启动
   * 这里只是占位实现
   * 
   * @param app - Angular 应用实例
   * @param mountElement - 挂载元素
   */
  async mount(app: any, mountElement: string | Element): Promise<void> {
    console.log('Angular app mount:', mountElement)
  }

  /**
   * 卸载应用
   * 
   * @param app - Angular 应用实例
   */
  async unmount(app: any): Promise<void> {
    console.log('Angular app unmounted')
  }

  /**
   * 注册引擎到 Angular
   * 
   * @param app - Angular 应用实例
   * @param engine - 核心引擎实例
   */
  registerEngine(app: any, engine: CoreEngine): void {
    this.engineSubject.next(engine)
    if (!app.options.providers) {
      app.options.providers = []
    }
  }

  /**
   * 获取引擎 Subject
   * 
   * @returns 引擎 Subject
   */
  getEngineSubject() {
    return this.engineSubject
  }

  /**
   * 创建状态适配器
   * 
   * @returns 状态适配器实例
   */
  createStateAdapter(): StateAdapter {
    return new AngularStateAdapter()
  }

  /**
   * 创建事件适配器
   * 
   * @returns 事件适配器实例
   */
  createEventAdapter(): EventAdapter {
    return new AngularEventAdapter()
  }

  /**
   * 映射生命周期钩子
   * 
   * @returns 生命周期钩子映射
   */
  mapLifecycleHooks(): LifecycleHookMap {
    return {
      beforeMount: 'beforeMount',
      mounted: 'ngOnInit',
      beforeUpdate: 'ngDoCheck',
      updated: 'ngAfterViewChecked',
      beforeUnmount: 'ngOnDestroy',
      unmounted: 'ngOnDestroy',
    }
  }

  /**
   * 注册组件
   * 
   * @param app - Angular 应用实例
   * @param name - 组件名称
   * @param component - 组件
   */
  registerComponent(app: any, name: string, component: any): void {
    console.log(`Angular component registered: ${name}`)
  }

  /**
   * 注册指令
   * 
   * @param app - Angular 应用实例
   * @param name - 指令名称
   * @param directive - 指令
   */
  registerDirective(app: any, name: string, directive: any): void {
    console.log(`Angular directive registered: ${name}`)
  }

  /**
   * 提供全局属性
   * 
   * @param app - Angular 应用实例
   * @param key - 属性键
   * @param value - 属性值
   */
  provideGlobalProperty(app: any, key: string, value: any): void {
    if (!app.options.globals) {
      app.options.globals = {}
    }
    app.options.globals[key] = value
  }
}

/**
 * 创建 Angular 适配器
 * 
 * @returns Angular 适配器实例
 */
export function createAngularAdapter(): AngularAdapter {
  return new AngularAdapter()
}

