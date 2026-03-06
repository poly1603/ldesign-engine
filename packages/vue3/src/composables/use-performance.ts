/**
 * 性能监控组合式 API
 *
 * 提供在组件中访问引擎性能数据的能力
 *
 * @module composables/use-performance
 */

import { ref, computed, onUnmounted, type Ref, type ComputedRef } from 'vue'
import { useEngine } from './use-engine'

/**
 * 性能统计摘要
 */
export interface VuePerformanceStats {
  /** 引擎统计 */
  engine: {
    plugins: number
    middleware: number
    events: number
    states: number
    hooks: number
    apis: number
  }
  /** 健康检查 */
  health: {
    healthy: boolean
    initialized: boolean
    issues: string[]
  }
}

/**
 * 使用引擎性能监控
 *
 * 提供对引擎性能数据和统计信息的响应式访问
 *
 * @param refreshInterval - 自动刷新间隔（毫秒，0 表示不自动刷新）
 * @returns 性能监控状态和方法
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePerformance } from '@ldesign/engine-vue3'
 *
 * const { stats, health, refresh } = usePerformance(5000)
 * </script>
 *
 * <template>
 *   <div>
 *     <p>插件数: {{ stats.engine.plugins }}</p>
 *     <p>状态数: {{ stats.engine.states }}</p>
 *     <p>健康: {{ health.healthy ? '正常' : '异常' }}</p>
 *     <ul v-if="health.issues.length">
 *       <li v-for="issue in health.issues">{{ issue }}</li>
 *     </ul>
 *   </div>
 * </template>
 * ```
 */
export function usePerformance(refreshInterval = 0) {
  const engine = useEngine()

  const stats = ref<VuePerformanceStats>({
    engine: engine.getStats(),
    health: engine.healthCheck(),
  })

  /**
   * 刷新性能统计
   */
  const refresh = () => {
    stats.value = {
      engine: engine.getStats(),
      health: engine.healthCheck(),
    }
  }

  // 自动刷新
  let timer: ReturnType<typeof setInterval> | null = null

  if (refreshInterval > 0) {
    timer = setInterval(refresh, refreshInterval)
  }

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer)
    }
  })

  return {
    stats,
    health: computed(() => stats.value.health),
    refresh,
  }
}

/**
 * 使用性能测量
 *
 * 提供便捷的操作性能测量功能
 *
 * @returns 测量方法
 *
 * @example
 * ```vue
 * <script setup>
 * import { useMeasure } from '@ldesign/engine-vue3'
 *
 * const { measure, measureSync } = useMeasure()
 *
 * const data = await measure('fetchData', async () => {
 *   return await fetch('/api/data').then(r => r.json())
 * })
 * </script>
 * ```
 */
export function useMeasure() {
  const engine = useEngine()

  return {
    /**
     * 测量异步操作性能
     */
    measure: <T>(name: string, fn: () => Promise<T>): Promise<T> => {
      return engine.measure(name, fn)
    },

    /**
     * 测量同步操作性能
     */
    measureSync: <T>(name: string, fn: () => T): T => {
      return engine.measureSync(name, fn)
    },
  }
}
