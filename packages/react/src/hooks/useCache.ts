/**
 * React Hook - useCache
 */

import { useState, useEffect, useCallback } from 'react'
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
 * ```tsx
 * function UserProfile() {
 *   const { data: user, loading, error, refetch } = useEngineCache(
 *     'user:123',
 *     async () => {
 *       const res = await fetch('/api/user/123')
 *       return res.json()
 *     },
 *     { ttl: 60000 }
 *   )
 *
 *   if (loading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error.message}</div>
 *
 *   return (
 *     <div>
 *       <p>Name: {user?.name}</p>
 *       <button onClick={refetch}>Refresh</button>
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
  data: T | undefined
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
} {
  const engine = useEngine()
  const [data, setData] = useState<T | undefined>(() => engine.cache.get<T>(key))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    // 检查缓存
    const cached = engine.cache.get<T>(key)
    if (cached !== undefined) {
      setData(cached)
      return
    }

    // 获取数据
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      engine.cache.set(key, result, options?.ttl)
      setData(result)
    } catch (err) {
      setError(err as Error)
      console.error(`[useEngineCache] 获取数据失败:`, err)
    } finally {
      setLoading(false)
    }
  }, [engine, key, fetcher, options?.ttl])

  // 初始加载
  useEffect(() => {
    fetch()
  }, [fetch])

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
 * ```tsx
 * function UserName() {
 *   const user = useEngineCacheValue('user:123', async () => {
 *     const res = await fetch('/api/user/123')
 *     return res.json()
 *   })
 *
 *   return <div>{user?.name}</div>
 * }
 * ```
 */
export function useEngineCacheValue<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number }
): T | undefined {
  const { data } = useEngineCache<T>(key, fetcher, options)
  return data
}

