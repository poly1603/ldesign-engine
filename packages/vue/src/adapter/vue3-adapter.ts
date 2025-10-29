/**
 * Vue3 框架适配器实现
 * 
 * 将引擎核心功能适配到 Vue3 生态系统
 * 
 * @module adapter/vue3-adapter
 */

import type { App, Component } from 'vue'
import { createApp } from 'vue'
import type {
  FrameworkAdapter,
  FrameworkInfo,
  LifecycleHookMap,
  StateAdapter,
  EventAdapter,
  CoreEngine,
} from '@ldesign/engine-core'
import { Vue3StateAdapter } from './vue3-state-adapter'
import { Vue3EventAdapter } from './vue3-event-adapter'

/**
 * Vue3 框架适配器
 * 
 * 实现 FrameworkAdapter 接口,提供 Vue3 特定的集成功能
 */
export class Vue3FrameworkAdapter implements FrameworkAdapter<App, Component, Element> {
  readonly info: FrameworkInfo = {
    name: 'vue',
    version: '3.3.0',
    features: {
      reactive: true,
      components: true,
      directives: true,
      slots: true,
    },
  }

  /**
   * 创建 Vue3 应用
   * 
   * @param rootComponent - 根组件
   * @param options - 创建选项
   * @returns App 实例
   */
  createApp(rootComponent: Component, options?: any): App {
    return createApp(rootComponent, options)
  }

  /**
   * 挂载应用
   * 
   * @param app - App 实例
   * @param mountElement - 挂载元素
   */
  async mount(app: App, mountElement: string | Element): Promise<void> {
    app.mount(mountElement)
  }

  /**
   * 卸载应用
   * 
   * @param app - App 实例
   */
  async unmount(app: App): Promise<void> {
    app.unmount()
  }

  /**
   * 注册引擎到应用
   * 
   * 使用 Vue3 的 provide/inject 系统
   * 
   * @param app - App 实例
   * @param engine - 引擎实例
   */
  registerEngine(app: App, engine: CoreEngine): void {
    // 使用 provide 注入引擎实例
    app.provide('engine', engine)
    
    // 注册全局属性
    app.config.globalProperties.$engine = engine
  }

  /**
   * 创建状态适配器
   * 
   * @returns Vue3 状态适配器
   */
  createStateAdapter(): StateAdapter {
    return new Vue3StateAdapter()
  }

  /**
   * 创建事件适配器
   * 
   * @returns Vue3 事件适配器
   */
  createEventAdapter(): EventAdapter {
    return new Vue3EventAdapter()
  }

  /**
   * 映射生命周期钩子
   * 
   * @returns 生命周期钩子映射
   */
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

  /**
   * 获取应用实例
   * 
   * @param app - App 实例
   * @returns App 实例本身
   */
  getAppInstance(app: App): App {
    return app
  }

  /**
   * 注册全局组件
   * 
   * @param app - App 实例
   * @param name - 组件名称
   * @param component - 组件
   */
  registerComponent(app: App, name: string, component: Component): void {
    app.component(name, component)
  }

  /**
   * 注册全局指令
   * 
   * @param app - App 实例
   * @param name - 指令名称
   * @param directive - 指令
   */
  registerDirective(app: App, name: string, directive: any): void {
    app.directive(name, directive)
  }

  /**
   * 提供全局属性
   * 
   * @param app - App 实例
   * @param key - 属性键
   * @param value - 属性值
   */
  provideGlobalProperty(app: App, key: string, value: any): void {
    app.config.globalProperties[`$${key}`] = value
  }
}

/**
 * 创建 Vue3 框架适配器
 * 
 * @returns Vue3 适配器实例
 */
export function createVue3Adapter(): Vue3FrameworkAdapter {
  return new Vue3FrameworkAdapter()
}

