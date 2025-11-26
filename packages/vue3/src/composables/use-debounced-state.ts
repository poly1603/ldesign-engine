/**
 * 防抖状态 Composable
 *
 * 提供防抖功能的状态管理，减少频繁更新
 *
 * @module composables/use-debounced-state
 */

import { ref, Ref, customRef, watch, onUnmounted } from 'vue'
import { useEngine } from './use-engine'

/**
 * 使用防抖状态（引擎状态）
 * 
 * 将引擎状态值防抖处理，减少频繁更新
 * 
 * @param key - 状态键
 * @param delay - 防抖延迟（毫秒）
 * @param defaultValue - 默认值
 * @returns 防抖后的状态值和设置函数
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useDebouncedEngineState } from '@ldesign/engine-vue3'
 * 
 * // 输入框值变化后500ms才更新到引擎状态
 * const [searchQuery, setSearchQuery] = useDebouncedEngineState('searchQuery', 500)
 * </script>
 * 
 * <template>
 *   <input v-model="searchQuery" placeholder="搜索..." />
 * </template>
 * ```
 */
export function useDebouncedEngineState<T = any>(
  key: string,
  delay = 300,
  defaultValue?: T
): [Ref<T>, (value: T) => void] {
  const engine = useEngine()
  
  const state = ref<T>(engine.state.get(key) ?? defaultValue) as Ref<T>
  let timeoutId: NodeJS.Timeout | null = null

  // 设置函数（防抖）
  const setState = (value: T) => {
    state.value = value
    
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      engine.state.set(key, value)
      timeoutId = null
    }, delay)
  }

  // 监听引擎状态变化
  const unwatch = engine.state.watch(key, (newValue) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    state.value = newValue
  })

  // 组件卸载时清理
  onUnmounted(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    unwatch()
  })

  return [state, setState]
}

/**
 * 创建防抖 Ref
 * 
 * @param value - 初始值
 * @param delay - 防抖延迟（毫秒）
 * @returns 防抖后的 Ref
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useDebouncedRef } from '@ldesign/engine-vue3'
 * 
 * const searchText = useDebouncedRef('', 500)
 * 
 * watch(searchText, (newValue) => {
 *   // 这里的 newValue 是防抖后的值，500ms 内多次改变只会触发一次
 *   console.log('Searching for:', newValue)
 * })
 * </script>
 * ```
 */
export function useDebouncedRef<T>(value: T, delay = 300): Ref<T> {
  let timeoutId: NodeJS.Timeout | null = null

  return customRef<T>((track, trigger) => {
    return {
      get() {
        track()
        return value
      },
      set(newValue: T) {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        timeoutId = setTimeout(() => {
          value = newValue
          trigger()
          timeoutId = null
        }, delay)
      }
    }
  })
}

/**
 * 使用节流状态（引擎状态）
 * 
 * 将引擎状态值节流处理，限制更新频率
 * 
 * @param key - 状态键
 * @param delay - 节流间隔（毫秒）
 * @param defaultValue - 默认值
 * @returns 节流后的状态值和设置函数
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useThrottledEngineState } from '@ldesign/engine-vue3'
 * 
 * // 滚动位置最多每200ms更新一次
 * const [scrollPosition, setScrollPosition] = useThrottledEngineState('scrollPosition', 200)
 * 
 * const handleScroll = (e) => {
 *   setScrollPosition(e.target.scrollTop)
 * }
 * </script>
 * ```
 */
export function useThrottledEngineState<T = any>(
  key: string,
  delay = 300,
  defaultValue?: T
): [Ref<T>, (value: T) => void] {
  const engine = useEngine()
  
  const state = ref<T>(engine.state.get(key) ?? defaultValue) as Ref<T>
  let lastTime = 0
  let pendingValue: T | null = null
  let timeoutId: NodeJS.Timeout | null = null

  // 设置函数（节流）
  const setState = (value: T) => {
    state.value = value
    pendingValue = value
    
    const now = Date.now()
    const timeSinceLastUpdate = now - lastTime

    if (timeSinceLastUpdate >= delay) {
      // 可以立即更新
      engine.state.set(key, value)
      lastTime = now
      pendingValue = null
    } else {
      // 需要等待
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        if (pendingValue !== null) {
          engine.state.set(key, pendingValue)
          lastTime = Date.now()
          pendingValue = null
        }
        timeoutId = null
      }, delay - timeSinceLastUpdate)
    }
  }

  // 监听引擎状态变化
  const unwatch = engine.state.watch(key, (newValue) => {
    state.value = newValue
    pendingValue = null
  })

  // 组件卸载时清理
  onUnmounted(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    unwatch()
  })

  return [state, setState]
}

/**
 * 创建节流 Ref
 * 
 * @param value - 初始值
 * @param delay - 节流间隔（毫秒）
 * @returns 节流后的 Ref
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useThrottledRef } from '@ldesign/engine-vue3'
 * 
 * const mousePosition = useThrottledRef({ x: 0, y: 0 }, 100)
 * 
 * const handleMouseMove = (e) => {
 *   // 最多每100ms更新一次
 *   mousePosition.value = { x: e.clientX, y: e.clientY }
 * }
 * </script>
 * ```
 */
export function useThrottledRef<T>(value: T, delay = 300): Ref<T> {
  let lastTime = 0
  let pendingValue: T | null = null
  let timeoutId: NodeJS.Timeout | null = null

  return customRef<T>((track, trigger) => {
    return {
      get() {
        track()
        return value
      },
      set(newValue: T) {
        const now = Date.now()
        const timeSinceLastUpdate = now - lastTime
        
        if (timeSinceLastUpdate >= delay) {
          value = newValue
          lastTime = now
          trigger()
        } else {
          pendingValue = newValue
          
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          
          timeoutId = setTimeout(() => {
            if (pendingValue !== null) {
              value = pendingValue
              lastTime = Date.now()
              pendingValue = null
              trigger()
            }
            timeoutId = null
          }, delay - timeSinceLastUpdate)
        }
      }
    }
  })
}