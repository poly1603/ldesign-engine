/**
 * Vue 2 框架适配器
 */

import Vue from 'vue'
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

// Vue 2 组件类型定义
// Vue 2 中组件可以是组件选项对象或构造函数
type Component = any

// Vue 2.6+ 使用 Vue.observable，Vue 2.7+ 也支持
// 获取 observable 函数
const getObservable = (Vue as any).observable || ((obj: any) => {
  // 如果 Vue.observable 不存在，使用 Vue 实例的 data 作为变通方案
  const vm = new Vue({ data: () => obj })
  return vm.$data
})

/**
 * Vue 2 框架信息
 */
const VUE2_INFO: FrameworkInfo = {
  name: 'vue',
  version: '2.x',
  features: {
    reactive: true,
    components: true,
    directives: true,
    slots: true,
  },
}

/**
 * Vue 2 状态适配器
 */
class Vue2StateAdapter implements StateAdapter {
  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    // Vue 2.6+ 使用 Vue.observable，Vue 2.7+ 可能使用 reactive
    // 使用兼容性包装函数
    const state = getObservable({ value: initialValue })
    const initial = JSON.parse(JSON.stringify(initialValue))

    return {
      get value() {
        return state.value
      },
      set value(newValue: T) {
        state.value = newValue
      },
      readonly() {
        return state.value
      },
      update(updater: (prev: T) => T) {
        state.value = updater(state.value)
      },
      reset() {
        state.value = JSON.parse(JSON.stringify(initial))
      },
    }
  }

  watch<T>(getter: () => T, callback: (value: T, oldValue?: T) => void): Unsubscribe {
    const vm = new Vue({
      computed: {
        watchedValue() {
          return getter()
        },
      },
    })

    const unwatch = vm.$watch('watchedValue', callback, { immediate: false })

    return () => {
      unwatch()
      vm.$destroy()
    }
  }

  batch(fn: () => void): void {
    // Vue 2 自动批量更新
    fn()
    Vue.nextTick()
  }

  computed<T>(getter: () => T): ReactiveState<T> {
    const vm = new Vue({
      computed: {
        computedValue() {
          return getter()
        },
      },
    })

    return {
      get value() {
        return (vm as any).computedValue
      },
      set value(_newValue: T) {
        console.warn('Cannot set computed property')
      },
      readonly() {
        return (vm as any).computedValue
      },
      update(_updater: (prev: T) => T) {
        console.warn('Cannot update computed property')
      },
    }
  }
}

/**
 * Vue 2 事件适配器
 */
class Vue2EventAdapter implements EventAdapter {
  private eventBus = new Vue()

  emit(event: string, payload?: any): void {
    this.eventBus.$emit(event, payload)
  }

  on(event: string, handler: (payload: any) => void): Unsubscribe {
    this.eventBus.$on(event, handler)
    return () => this.eventBus.$off(event, handler)
  }

  once(event: string, handler: (payload: any) => void): Unsubscribe {
    this.eventBus.$once(event, handler)
    return () => this.eventBus.$off(event, handler)
  }

  off(event: string, handler?: (payload: any) => void): void {
    if (handler) {
      this.eventBus.$off(event, handler)
    } else {
      this.eventBus.$off(event)
    }
  }
}

/**
 * Vue 2 框架适配器
 */
export class Vue2Adapter implements FrameworkAdapter<any, Component> {
  readonly info = VUE2_INFO

  createApp(rootComponent: Component, options?: any): any {
    // Vue 2 需要返回一个对象，包含组件和选项
    return {
      component: rootComponent,
      options: options || {},
    }
  }

  async mount(app: any, mountElement: string | Element): Promise<void> {
    const el = typeof mountElement === 'string' 
      ? document.querySelector(mountElement) 
      : mountElement

    if (!el) {
      throw new Error(`Mount element not found: ${mountElement}`)
    }

    // Vue 2 创建实例并挂载
    const { component, options } = app
    
    // Vue.extend 可以接受组件选项对象或已经是构造函数的组件
    // 它会自动处理两种情况，所以我们直接使用即可
    // 如果有额外选项，合并到组件选项中
    const componentOptions = options && Object.keys(options).length > 0
      ? { ...component, ...options }
      : component
    
    const ComponentConstructor = Vue.extend(componentOptions as any)
    
    // 创建 Vue 实例并挂载
    const vm = new ComponentConstructor()
    vm.$mount(el)
    
    // 保存实例引用
    app.instance = vm
  }

  async unmount(app: any): Promise<void> {
    // Vue 2 通过实例来销毁
    if (app.instance) {
      app.instance.$destroy()
      app.instance.$el.remove()
      app.instance = null
    }
  }

  registerEngine(app: any, engine: CoreEngine): void {
    // 注册为全局属性
    Vue.prototype.$engine = engine

    // 保存引擎引用到 app 对象
    app.engine = engine
  }

  createStateAdapter(): StateAdapter {
    return new Vue2StateAdapter()
  }

  createEventAdapter(): EventAdapter {
    return new Vue2EventAdapter()
  }

  mapLifecycleHooks(): LifecycleHookMap {
    return {
      beforeMount: 'beforeMount',
      mounted: 'mounted',
      beforeUpdate: 'beforeUpdate',
      updated: 'updated',
      beforeUnmount: 'beforeDestroy',
      unmounted: 'destroyed',
    }
  }

  registerComponent(app: any, name: string, component: any): void {
    Vue.component(name, component)
  }

  registerDirective(app: any, name: string, directive: any): void {
    Vue.directive(name, directive)
  }

  provideGlobalProperty(app: any, key: string, value: any): void {
    Vue.prototype[key] = value
  }
}

/**
 * 创建 Vue 2 适配器
 */
export function createVue2Adapter(): Vue2Adapter {
  return new Vue2Adapter()
}

