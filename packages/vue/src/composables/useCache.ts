/**
 * Vue3 组合式 API - useCache
 */

import { ref, onUnmounted, type Ref } from 'vue'
import type { CacheManager } from '@ldesign/engine-core'
import { useEngine } from './useEngine'

/**
 * 使用缓存管理器
 */
export function useCache(): CacheManager {
  return useEngine().cache
}

/**
 * 使用引擎缓存
 * 
 * 提供带自动加载、错误处理和重新获取功能的缓存数据访问
 *
 * @param key - 缓存键
 * @param fetcher - 数据获取函数
 * @param options - 缓存选项
 * @returns 包含数据、加载状态、错误和重新获取函数的对象
 *
 * @example
 * ```vue
 * <script setup>
 * const { data: user, loading, error, refetch } = useEngineCache(
 *   'user:123',
 *   async () => {
 *     const res = await fetch('/api/user/123')
 *     return res.json()
 *   },
 *   { ttl: 60000 }
 * )
 * </script>
 *
 * <template>
 *   <div v-if="loading">Loading...</div>
 *   <div v-else-if="error">Error: {{ error.message }}</div>
 *   <div v-else>
 *     <p>Name: {{ user?.name }}</p>
 *     <button @click="refetch">Refresh</button>
 *   </div>
 * </template>
 * ```
 */
export function useEngineCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): {
  data: Ref<T | undefined>
  loading: Ref<boolean>
  error: Ref<Error | null>
  refetch: () => Promise<void>
} {
  const engine = useEngine()
  const data = ref<T | undefined>(engine.cache.get<T>(key))
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const fetch = async () => {
    // 检查缓存
    const cached = engine.cache.get<T>(key)
    if (cached !== undefined) {
      data.value = cached
      return
    }

    // 获取数据
    loading.value = true
    error.value = null
    try {
      const result = await fetcher()
      engine.cache.set(key, result, options?.ttl)
      data.value = result
    } catch (err) {
      error.value = err as Error
      console.error(`[useEngineCache] 获取数据失败:`, err)
    } finally {
      loading.value = false
    }
  }

  // 初始加载
  fetch()

  // 组件卸载时清理 (可选)
  onUnmounted(() => {
    // 缓存数据保留,不清理
  })

  return {
    data,
    loading,
    error,
    refetch: fetch,
  }
}

/**
 * 使用引擎缓存值 (简化版 - 只返回数据)
 * 
 * @param key - 缓存键
 * @param fetcher - 数据获取函数
 * @param options - 缓存选项
 * @returns 缓存的数据
 *
 * @example
 * ```vue
 * <script setup>
 * const user = useEngineCacheValue('user:123', async () => {
 *   const res = await fetch('/api/user/123')
 *   return res.json()
 * })
 * </script>
 *
 * <template>
 *   <div>{{ user?.name }}</div>
 * </template>
 * ```
 */
export function useEngineCacheValue<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): Ref<T | undefined> {
  const { data } = useEngineCache<T>(key, fetcher, options)
  return data
}

