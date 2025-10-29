/**
 * Solid Engine Cache Hooks
 * 
 * 提供与 React/Vue 一致的缓存管理 API
 * 
 * @module hooks/useCache
 */

import { createSignal, createEffect, onCleanup, type Accessor } from 'solid-js'
import type { CacheManager } from '@ldesign/engine-core'
import { useEngine } from './useEngine'

/**
 * 获取缓存管理器
 * 
 * 与 React/Vue 的 useCache() 完全一致
 * 
 * @returns 缓存管理器
 * 
 * @example
 * ```tsx
 * import { useCache } from '@ldesign/engine-solid'
 * 
 * function MyComponent() {
 *   const cache = useCache()
 *   cache.set('key', 'value', 60000)
 * 
 *   return <div>Cache ready</div>
 * }
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
 * ```tsx
 * import { useEngineCache } from '@ldesign/engine-solid'
 * 
 * function UserProfile() {
 *   const { data, loading, error, refetch } = useEngineCache(
 *     'user:123',
 *     async () => {
 *       const res = await fetch('/api/user/123')
 *       return res.json()
 *     },
 *     { ttl: 60000 }
 *   )
 * 
 *   return (
 *     <div>
 *       <Show when={!loading()} fallback={<div>Loading...</div>}>
 *         <Show when={!error()} fallback={<div>Error: {error()?.message}</div>}>
 *           <p>Name: {data()?.name}</p>
 *           <button onClick={refetch}>Refresh</button>
 *         </Show>
 *       </Show>
 *     </div>
 *   )
 * }
 * ```
 */
export function useEngineCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): {
  data: Accessor<T | undefined>
  loading: Accessor<boolean>
  error: Accessor<Error | null>
  refetch: () => Promise<void>
} {
  const engine = useEngine()
  const [data, setData] = createSignal<T | undefined>(engine.cache.get<T>(key))
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)

  const fetch = async () => {
    // 检查缓存
    const cached = engine.cache.get<T>(key)
    if (cached !== undefined) {
      setData(() => cached)
      return
    }

    // 获取数据
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      engine.cache.set(key, result, options?.ttl)
      setData(() => result)
    } catch (err) {
      setError(err as Error)
      console.error(`[useEngineCache] 获取数据失败:`, err)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  createEffect(() => {
    fetch()
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
 * @returns 缓存的数据 Signal
 * 
 * @example
 * ```tsx
 * import { useEngineCacheValue } from '@ldesign/engine-solid'
 * 
 * function UserName() {
 *   const user = useEngineCacheValue('user:123', async () => {
 *     const res = await fetch('/api/user/123')
 *     return res.json()
 *   })
 * 
 *   return <div>{user()?.name}</div>
 * }
 * ```
 */
export function useEngineCacheValue<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): Accessor<T | undefined> {
  const { data } = useEngineCache<T>(key, fetcher, options)
  return data
}

