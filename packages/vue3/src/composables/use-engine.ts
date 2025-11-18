/**
 * Vue3 引擎组合式 API
 *
 * 提供在组件中使用引擎功能的 Composition API
 *
 * @module composables/use-engine
 */

import { inject, InjectionKey, Ref, ref, computed, onUnmounted } from 'vue'
import type { VueEngine } from '../engine/vue-engine'
import type { ServiceContainer, ConfigManager } from '@ldesign/engine-core'

/**
 * 引擎注入键
 */
export const ENGINE_KEY: InjectionKey<VueEngine> = Symbol('engine')

/**
 * 容器注入键
 */
export const CONTAINER_KEY: InjectionKey<ServiceContainer> = Symbol('container')

/**
 * 配置注入键
 */
export const CONFIG_KEY: InjectionKey<ConfigManager> = Symbol('config')

/**
 * 使用引擎
 * 
 * @returns 引擎实例
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useEngine } from '@ldesign/engine-vue3'
 * 
 * const engine = useEngine()
 * 
 * // 使用引擎功能
 * engine.events.emit('app:ready')
 * </script>
 * ```
 */
export function useEngine(): VueEngine {
  const engine = inject<VueEngine>(ENGINE_KEY)

  if (!engine) {
    throw new Error('Engine not found. Make sure the app is created with VueEngine.')
  }

  return engine
}

/**
 * 使用服务容器
 * 
 * @returns 服务容器实例
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useContainer } from '@ldesign/engine-vue3'
 * 
 * const container = useContainer()
 * 
 * // 解析服务
 * const userService = container.resolve('userService')
 * </script>
 * ```
 */
export function useContainer(): ServiceContainer {
  const container = inject<ServiceContainer>(CONTAINER_KEY)

  if (!container) {
    throw new Error('Container not found. Make sure the app is created with VueEngine.')
  }

  return container
}

/**
 * 使用服务
 * 
 * @param identifier - 服务标识
 * @returns 服务实例
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useService } from '@ldesign/engine-vue3'
 * 
 * const api = useService('api')
 * const logger = useService('logger')
 * 
 * // 使用服务
 * const data = await api.fetchData()
 * logger.info('Data fetched', data)
 * </script>
 * ```
 */
export function useService<T = any>(identifier: string | symbol): T {
  const container = useContainer()
  return container.resolve<T>(identifier)
}

/**
 * 使用配置管理器
 * 
 * @returns 配置管理器实例
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useConfig } from '@ldesign/engine-vue3'
 * 
 * const config = useConfig()
 * 
 * // 获取配置
 * const apiUrl = config.get('api.url')
 * </script>
 * ```
 */
export function useConfig(): ConfigManager {
  const config = inject<ConfigManager>(CONFIG_KEY)

  if (!config) {
    throw new Error('Config manager not found. Make sure the app is created with VueEngine.')
  }

  return config
}

/**
 * 使用配置值
 *
 * @param key - 配置键
 * @param defaultValue - 默认值
 * @returns 响应式配置值
 *
 * @example
 * ```vue
 * <script setup>
 * import { useConfigValue } from '@ldesign/engine-vue3'
 *
 * // 获取响应式配置值
 * const theme = useConfigValue('app.theme', 'light')
 *
 * // 配置变化时自动更新
 * watch(theme, (newTheme) => {
 *   document.body.className = newTheme
 * })
 * </script>
 * ```
 */
export function useConfigValue<T = any>(key: string, defaultValue?: T): Ref<T> {
  const config = useConfig()
  const value = ref<T>(config.get(key, defaultValue))

  // 监听配置变化
  const unwatch = config.watch(key, (newValue) => {
    value.value = newValue
  })

  // 组件卸载时取消监听，确保资源正确释放
  onUnmounted(() => {
    unwatch()
  })

  return value
}

/**
 * 使用引擎状态
 *
 * @param key - 状态键
 * @param defaultValue - 默认值
 * @returns 响应式状态值和更新函数
 *
 * @example
 * ```vue
 * <script setup>
 * import { useEngineState } from '@ldesign/engine-vue3'
 *
 * const [count, setCount] = useEngineState('count', 0)
 *
 * // 更新状态
 * const increment = () => {
 *   setCount(count.value + 1)
 * }
 * </script>
 * ```
 */
export function useEngineState<T = any>(
  key: string,
  defaultValue?: T
): [Ref<T>, (value: T) => void] {
  const engine = useEngine()
  const state = ref<T>(engine.state.get(key) ?? defaultValue)

  // 监听状态变化
  const unwatch = engine.state.watch(key, (newValue) => {
    state.value = newValue
  })

  // 设置状态函数
  const setState = (value: T) => {
    engine.state.set(key, value)
  }

  // 组件卸载时取消监听，避免内存泄漏
  onUnmounted(() => {
    unwatch()
  })

  return [state, setState]
}

/**
 * 使用引擎事件
 *
 * @param event - 事件名称
 * @param handler - 事件处理器
 *
 * @example
 * ```vue
 * <script setup>
 * import { useEngineEvent } from '@ldesign/engine-vue3'
 *
 * // 监听事件
 * useEngineEvent('user:login', (user) => {
 *   console.log('User logged in:', user)
 * })
 *
 * // 组件卸载时自动取消监听
 * </script>
 * ```
 */
export function useEngineEvent<T = any>(
  event: string,
  handler: (payload?: T) => void
): void {
  const engine = useEngine()

  // 监听事件
  const unsubscribe = engine.events.on(event, handler)

  // 组件卸载时取消监听，防止内存泄漏
  onUnmounted(() => {
    unsubscribe()
  })
}

/**
 * 生命周期钩子处理器类型
 * 支持同步和异步处理器
 */
export type LifecycleHandler = (...args: unknown[]) => void | Promise<void>

/**
 * 使用引擎生命周期
 *
 * @param hook - 生命周期钩子
 * @param handler - 处理器
 *
 * @example
 * ```vue
 * <script setup>
 * import { useEngineLifecycle } from '@ldesign/engine-vue3'
 *
 * // 监听引擎生命周期
 * useEngineLifecycle('mounted', () => {
 *   console.log('Engine mounted')
 * })
 * </script>
 * ```
 */
export function useEngineLifecycle(
  hook: string,
  handler: LifecycleHandler
): void {
  const engine = useEngine()

  // 注册生命周期钩子
  engine.lifecycle.on(hook as any, handler)

  // 组件卸载时移除钩子，确保不会造成内存泄漏
  onUnmounted(() => {
    engine.lifecycle.off(hook as any, handler)
  })
}

/**
 * 使用插件
 * 
 * @param name - 插件名称
 * @returns 插件实例
 * 
 * @example
 * ```vue
 * <script setup>
 * import { usePlugin } from '@ldesign/engine-vue3'
 * 
 * const router = usePlugin('router')
 * const i18n = usePlugin('i18n')
 * </script>
 * ```
 */
export function usePlugin<T = any>(name: string): T | undefined {
  const engine = useEngine()
  return engine.plugins.get(name) as T | undefined
}

/**
 * 中间件上下文类型
 * 包含中间件执行所需的上下文信息
 */
export interface MiddlewareContext {
  /** 上下文类型 */
  type: string
  /** 上下文数据 */
  data?: unknown
  /** 额外的上下文属性 */
  [key: string]: unknown
}

/**
 * 使用中间件
 *
 * @returns 中间件执行函数
 *
 * @example
 * ```vue
 * <script setup>
 * import { useMiddleware } from '@ldesign/engine-vue3'
 *
 * const executeMiddleware = useMiddleware()
 *
 * // 执行中间件链
 * await executeMiddleware({
 *   data: { action: 'save' }
 * })
 * </script>
 * ```
 */
export function useMiddleware() {
  const engine = useEngine()

  return async (context: MiddlewareContext) => {
    return await engine.middleware.execute(context)
  }
}