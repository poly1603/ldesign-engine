/**
 * Vue Composables for @ldesign/engine
 */

import { inject, ref, computed, watch, onUnmounted, InjectionKey } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { CoreEngine, Plugin } from '@ldesign/engine-core'

/**
 * Engine injection key
 */
export const ENGINE_INJECTION_KEY: InjectionKey<CoreEngine> = Symbol('engine')

/**
 * 获取引擎实例
 * 
 * @returns 引擎实例
 * @throws 如果在 provide 之外使用
 * 
 * @example
 * ```vue
 * <script setup>
 * const engine = useEngine()
 * 
 * const switchTheme = () => {
 *   engine.setTheme('dark')
 * }
 * </script>
 * ```
 */
export function useEngine(): CoreEngine {
  const engine = inject(ENGINE_INJECTION_KEY)
  
  if (!engine) {
    throw new Error('[useEngine] Must be used with provide(ENGINE_INJECTION_KEY, engine)')
  }
  
  return engine
}

/**
 * 获取特定插件
 * 
 * @param pluginName - 插件名称
 * @returns 插件实例的响应式引用
 * 
 * @example
 * ```vue
 * <script setup>
 * const i18nPlugin = usePlugin('i18n')
 * 
 * watch(i18nPlugin, (plugin) => {
 *   if (plugin) {
 *     console.log('Plugin loaded:', plugin.name)
 *   }
 * })
 * </script>
 * ```
 */
export function usePlugin(pluginName: string): Ref<Plugin | undefined> {
  const engine = useEngine()
  const plugin = ref<Plugin | undefined>(engine.plugins.get(pluginName))
  
  // 监听插件注册事件
  const unsubscribe = engine.events.on('plugin:registered', (data: any) => {
    if (data.name === pluginName) {
      plugin.value = engine.plugins.get(pluginName)
    }
  })
  
  onUnmounted(() => {
    unsubscribe()
  })
  
  return plugin
}

/**
 * 监听引擎事件
 * 
 * @param event - 事件名称
 * @param handler - 事件处理器
 * 
 * @example
 * ```vue
 * <script setup>
 * useEngineEvent('theme:changed', (data) => {
 *   console.log('Theme changed:', data.to)
 * })
 * </script>
 * ```
 */
export function useEngineEvent(
  event: string,
  handler: (data: any) => void
): void {
  const engine = useEngine()
  
  const unsubscribe = engine.events.on(event, handler)
  
  onUnmounted(() => {
    unsubscribe()
  })
}

/**
 * 获取和设置引擎状态
 * 
 * @param path - 状态路径
 * @param initialValue - 初始值
 * @returns 状态的响应式引用和设置函数
 * 
 * @example
 * ```vue
 * <script setup>
 * const [count, setCount] = useEngineState<number>('counter', 0)
 * 
 * const increment = () => setCount(count.value + 1)
 * </script>
 * 
 * <template>
 *   <div>
 *     <p>Count: {{ count }}</p>
 *     <button @click="increment">+1</button>
 *   </div>
 * </template>
 * ```
 */
export function useEngineState<T>(
  path: string,
  initialValue?: T
): [Ref<T>, (value: T) => void] {
  const engine = useEngine()
  
  const state = ref<T>(
    engine.state.getState(path) ?? initialValue
  ) as Ref<T>
  
  // 监听状态变化
  const unwatch = engine.state.watch(path, (newValue) => {
    state.value = newValue as T
  })
  
  // 设置状态
  const setState = (value: T) => {
    engine.state.setState(path, value)
  }
  
  onUnmounted(() => {
    unwatch()
  })
  
  return [state, setState]
}

/**
 * 获取引擎配置
 * 
 * @param key - 配置键
 * @param defaultValue - 默认值
 * @returns 配置值的计算属性
 * 
 * @example
 * ```vue
 * <script setup>
 * const apiUrl = useEngineConfig('apiUrl', 'https://api.example.com')
 * </script>
 * 
 * <template>
 *   <div>API: {{ apiUrl }}</div>
 * </template>
 * ```
 */
export function useEngineConfig<T>(
  key: string,
  defaultValue?: T
): ComputedRef<T> {
  const engine = useEngine()
  const value = ref<T>(engine.config.get(key, defaultValue))
  
  const unwatch = engine.config.watch(key, (newValue) => {
    value.value = newValue as T
  })
  
  onUnmounted(() => {
    unwatch()
  })
  
  return computed(() => value.value)
}

/**
 * 获取引擎日志器
 * 
 * @returns 日志器实例
 * 
 * @example
 * ```vue
 * <script setup>
 * import { onMounted, onUnmounted } from 'vue'
 * 
 * const logger = useEngineLogger()
 * 
 * onMounted(() => {
 *   logger.info('Component mounted')
 * })
 * 
 * onUnmounted(() => {
 *   logger.info('Component unmounted')
 * })
 * </script>
 * ```
 */
export function useEngineLogger() {
  const engine = useEngine()
  return engine.logger
}

/**
 * 获取引擎状态
 * 
 * @returns 引擎状态的响应式引用
 * 
 * @example
 * ```vue
 * <script setup>
 * const status = useEngineStatus()
 * </script>
 * 
 * <template>
 *   <div>
 *     <p>Initialized: {{ status.initialized ? 'Yes' : 'No' }}</p>
 *     <p>Plugins: {{ status.pluginCount }}</p>
 *   </div>
 * </template>
 * ```
 */
export function useEngineStatus() {
  const engine = useEngine()
  const status = ref(engine.getStatus())
  
  // 定期更新状态
  const interval = setInterval(() => {
    status.value = engine.getStatus()
  }, 1000)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
  
  return status
}
