/**
 * 生命周期日志组合式 API
 *
 * 提供对引擎生命周期事件的响应式追踪
 *
 * @module composables/use-lifecycle-log
 */

import { ref, onUnmounted, type Ref } from 'vue'
import { useEngine } from './use-engine'

/**
 * 生命周期日志条目
 */
export interface LifecycleLogEntry {
  /** 钩子名称 */
  hook: string
  /** 时间戳 */
  timestamp: number
  /** 格式化时间 */
  time: string
}

/**
 * 使用生命周期日志
 *
 * 监听引擎所有生命周期钩子并记录日志
 *
 * @param maxEntries - 最大日志条目数
 * @returns 响应式的日志列表和清除方法
 *
 * @example
 * ```vue
 * <script setup>
 * import { useLifecycleLog } from '@ldesign/engine-vue3'
 *
 * const { logs, clear } = useLifecycleLog()
 * </script>
 *
 * <template>
 *   <div v-for="log in logs" :key="log.timestamp">
 *     {{ log.time }} - {{ log.hook }}
 *   </div>
 * </template>
 * ```
 */
export function useLifecycleLog(maxEntries = 50): {
  logs: Ref<LifecycleLogEntry[]>
  clear: () => void
} {
  const engine = useEngine()
  const logs = ref<LifecycleLogEntry[]>([])

  const hooks = [
    'beforeInit', 'init', 'afterInit',
    'beforeMount', 'mounted',
    'beforeUnmount', 'unmounted',
    'beforeDestroy', 'destroyed',
  ]

  const handlers: Array<{ hook: string; handler: () => void }> = []

  for (const hook of hooks) {
    const handler = () => {
      const entry: LifecycleLogEntry = {
        hook,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString(),
      }
      logs.value = [entry, ...logs.value].slice(0, maxEntries)
    }
    engine.lifecycle.on(hook as any, handler)
    handlers.push({ hook, handler })
  }

  const clear = () => {
    logs.value = []
  }

  onUnmounted(() => {
    for (const { hook, handler } of handlers) {
      engine.lifecycle.off(hook as any, handler)
    }
  })

  return { logs, clear }
}
