/**
 * 异步状态管理 Composable
 * 
 * 简化异步操作的状态管理，自动处理加载、错误和数据状态
 * 
 * @module composables/use-async-state
 */

import { ref, Ref, shallowRef, onUnmounted, computed } from 'vue'

/**
 * 异步状态接口
 */
export interface AsyncState<T> {
  /** 数据 */
  data: Ref<T | undefined>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 错误信息 */
  error: Ref<Error | null>
  /** 是否准备就绪 */
  isReady: Ref<boolean>
  /** 执行异步操作 */
  execute: (...args: any[]) => Promise<T | undefined>
  /** 重置状态 */
  reset: () => void
  /** 重新加载 */
  reload: () => Promise<T | undefined>
}

/**
 * 异步状态选项
 */
export interface UseAsyncStateOptions<T> {
  /** 初始数据 */
  initialData?: T
  /** 是否立即执行 */
  immediate?: boolean
  /** 重置时是否保留数据 */
  resetOnExecute?: boolean
  /** 错误处理器 */
  onError?: (error: Error) => void
  /** 成功处理器 */
  onSuccess?: (data: T) => void
  /** 使用浅层响应式 */
  shallow?: boolean
  /** 延迟时间（毫秒） */
  delay?: number
}

/**
 * 使用异步状态
 * 
 * 自动管理异步操作的加载、错误和数据状态
 * 
 * @param fetcher - 异步函数
 * @param options - 选项
 * @returns 异步状态对象
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useAsyncState } from '@ldesign/engine-vue3'
 * 
 * const { data, loading, error, execute } = useAsyncState(
 *   async (id) => {
 *     const response = await fetch(`/api/users/${id}`)
 *     return response.json()
 *   },
 *   { immediate: false }
 * )
 * 
 * // 手动执行
 * const loadUser = (id) => execute(id)
 * </script>
 * 
 * <template>
 *   <div v-if="loading">加载中...</div>
 *   <div v-else-if="error">错误: {{ error.message }}</div>
 *   <div v-else-if="data">{{ data }}</div>
 * </template>
 * ```
 */
export function useAsyncState<T>(
  fetcher: (...args: any[]) => Promise<T>,
  options: UseAsyncStateOptions<T> = {}
): AsyncState<T> {
  const {
    initialData,
    immediate = false,
    resetOnExecute = true,
    onError,
    onSuccess,
    shallow = false,
    delay = 0
  } = options

  // 使用 ref 或 shallowRef
  const data = (shallow ? shallowRef : ref)<T | undefined>(initialData)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const isReady = computed(() => !loading.value && data.value !== undefined)

  // 保存最后的参数用于 reload
  let lastArgs: any[] = []
  
  // 中止控制器
  let abortController: AbortController | null = null

  /**
   * 执行异步操作
   */
  const execute = async (...args: any[]): Promise<T | undefined> => {
    // 保存参数
    lastArgs = args

    // 重置状态
    if (resetOnExecute) {
      error.value = null
    }

    // 中止之前的请求
    if (abortController) {
      abortController.abort()
    }
    abortController = new AbortController()

    loading.value = true

    try {
      // 延迟执行
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      const result = await fetcher(...args)
      
      // 检查是否已中止
      if (abortController.signal.aborted) {
        return undefined
      }

      data.value = result
      error.value = null

      // 成功回调
      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (e) {
      const err = e as Error
      
      // 检查是否已中止
      if (abortController.signal.aborted) {
        return undefined
      }

      error.value = err

      // 错误回调
      if (onError) {
        onError(err)
      }

      return undefined
    } finally {
      loading.value = false
      abortController = null
    }
  }

  /**
   * 重置状态
   */
  const reset = () => {
    data.value = initialData
    loading.value = false
    error.value = null
    
    // 中止当前请求
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  /**
   * 重新加载（使用上次的参数）
   */
  const reload = () => execute(...lastArgs)

  // 立即执行
  if (immediate) {
    execute()
  }

  // 组件卸载时中止请求
  onUnmounted(() => {
    if (abortController) {
      abortController.abort()
    }
  })

  return {
    data,
    loading,
    error,
    isReady,
    execute,
    reset,
    reload
  }
}

/**
 * 使用异步数据（useAsyncState 的简化版本）
 * 
 * @param fetcher - 异步函数
 * @param initialData - 初始数据
 * @returns 数据、加载状态和错误
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useAsyncData } from '@ldesign/engine-vue3'
 * 
 * const { data, loading, error } = useAsyncData(
 *   () => fetch('/api/users').then(r => r.json())
 * )
 * </script>
 * ```
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  initialData?: T
) {
  return useAsyncState(fetcher, {
    initialData,
    immediate: true
  })
}