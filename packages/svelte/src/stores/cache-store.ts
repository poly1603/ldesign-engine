/**
 * Svelte Cache Stores
 * 
 * 提供与 React/Vue 一致的缓存管理 API
 * 
 * @module stores/cache-store
 */

import { writable, type Writable } from 'svelte/store'
import { onDestroy } from 'svelte'
import type { CacheManager } from '@ldesign/engine-core'
import { useEngine } from './engine-store'

/**
 * 获取缓存管理器
 * 
 * 与 React/Vue 的 useCache() 一致
 * 
 * @returns 缓存管理器
 * 
 * @example
 * ```svelte
 * <script>
 * import { useCache } from '@ldesign/engine-svelte'
 * 
 * const cache = useCache()
 * cache.set('key', 'value', 60000)
 * </script>
 * ```
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
 * ```svelte
 * <script>
 * import { useEngineCache } from '@ldesign/engine-svelte'
 * 
 * const { data, loading, error, refetch } = useEngineCache(
 *   'user:123',
 *   async () => {
 *     const res = await fetch('/api/user/123')
 *     return res.json()
 *   },
 *   { ttl: 60000 }
 * )
 * </script>
 * 
 * {#if $loading}
 *   <div>Loading...</div>
 * {:else if $error}
 *   <div>Error: {$error.message}</div>
 * {:else}
 *   <p>Name: {$data?.name}</p>
 *   <button on:click={refetch}>Refresh</button>
 * {/if}
 * ```
 */
export function useEngineCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): {
  data: Writable<T | undefined>
  loading: Writable<boolean>
  error: Writable<Error | null>
  refetch: () => Promise<void>
} {
  const engine = useEngine()
  const data = writable<T | undefined>(engine.cache.get<T>(key))
  const loading = writable(false)
  const error = writable<Error | null>(null)

  const fetch = async () => {
    // 检查缓存
    const cached = engine.cache.get<T>(key)
    if (cached !== undefined) {
      data.set(cached)
      return
    }

    // 获取数据
    loading.set(true)
    error.set(null)
    try {
      const result = await fetcher()
      engine.cache.set(key, result, options?.ttl)
      data.set(result)
    } catch (err) {
      error.set(err as Error)
      console.error(`[useEngineCache] 获取数据失败:`, err)
    } finally {
      loading.set(false)
    }
  }

  // 初始加载
  fetch()

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
 * @returns 缓存的数据 Store
 * 
 * @example
 * ```svelte
 * <script>
 * import { useEngineCacheValue } from '@ldesign/engine-svelte'
 * 
 * const user = useEngineCacheValue('user:123', async () => {
 *   const res = await fetch('/api/user/123')
 *   return res.json()
 * })
 * </script>
 * 
 * <div>{$user?.name}</div>
 * ```
 */
export function useEngineCacheValue<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): Writable<T | undefined> {
  const { data } = useEngineCache<T>(key, fetcher, options)
  return data
}

