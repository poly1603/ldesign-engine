/**
 * Vue 3 框架适配器
 */

import { createApp, reactive, watch, computed, nextTick, type App, type Component } from 'vue'
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
 * Vue 3 框架信息
 */
const VUE3_INFO: FrameworkInfo = {
  name: 'vue',
  version: '3.x',
  features: {
    reactive: true,
    components: true,
    directives: true,
    slots: true,
  },
}

/**
 * Vue 3 状态适配器
 */
class Vue3StateAdapter implements StateAdapter {
  createReactiveState<T>(initialValue: T): ReactiveState<T> {
    const state = reactive({ value: initialValue })
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
    const stop = watch(getter, callback, { immediate: false })
    return stop
  }

  batch(fn: () => void): void {
    fn()
    nextTick()
  }

  computed<T>(getter: () => T): ReactiveState<T> {
    const computedValue = computed(getter)

    return {
      get value() {
        return computedValue.value
      },
      set value(_newValue: T) {
        console.warn('Cannot set computed property')
      },
      readonly() {
        return computedValue.value
      },
      update(_updater: (prev: T) => T) {
        console.warn('Cannot update computed property')
      },
    }
  }
}

/**
 * Vue 3 事件适配器
 */
class Vue3EventAdapter implements EventAdapter {
  private handlers = new Map<string, Set<(payload: any) => void>>()

  emit(event: string, payload?: any): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(payload))
    }
  }

  on(event: string, handler: (payload: any) => void): Unsubscribe {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    return () => this.off(event, handler)
  }

  once(event: string, handler: (payload: any) => void): Unsubscribe {
    const wrappedHandler = (payload: any) => {
      handler(payload)
      this.off(event, wrappedHandler)
    }
    return this.on(event, wrappedHandler)
  }

  off(event: string, handler?: (payload: any) => void): void {
    if (handler) {
      this.handlers.get(event)?.delete(handler)
    } else {
      this.handlers.delete(event)
    }
  }
}

/**
 * Vue 3 框架适配器
 */
export class Vue3Adapter implements FrameworkAdapter<App, Component> {
  readonly info = VUE3_INFO

  createApp(rootComponent: Component, options?: any): App {
    return createApp(rootComponent, options)
  }

  async mount(app: App, mountElement: string | Element): Promise<void> {
    app.mount(mountElement)
  }

  async unmount(app: App): Promise<void> {
    app.unmount()
  }

  registerEngine(app: App, engine: CoreEngine): void {
    // 使用 provide 注入引擎
    app.provide('engine', engine)

    // 注册为全局属性
    app.config.globalProperties.$engine = engine
  }

  createStateAdapter(): StateAdapter {
    return new Vue3StateAdapter()
  }

  createEventAdapter(): EventAdapter {
    return new Vue3EventAdapter()
  }

  mapLifecycleHooks(): LifecycleHookMap {
    return {
      beforeMount: 'onBeforeMount',
      mounted: 'onMounted',
      beforeUpdate: 'onBeforeUpdate',
      updated: 'onUpdated',
      beforeUnmount: 'onBeforeUnmount',
      unmounted: 'onUnmounted',
    }
  }

  registerComponent(app: App, name: string, component: any): void {
    app.component(name, component)
  }

  registerDirective(app: App, name: string, directive: any): void {
    app.directive(name, directive)
  }

  provideGlobalProperty(app: App, key: string, value: any): void {
    app.config.globalProperties[key] = value
  }
}

/**
 * 创建 Vue 3 适配器
 */
export function createVue3Adapter(): Vue3Adapter {
  return new Vue3Adapter()
}

