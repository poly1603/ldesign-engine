/**
 * 错误边界组合式 API
 *
 * 提供在组件中捕获和处理异步错误的能力
 *
 * @module composables/use-error-boundary
 */

import { ref, onErrorCaptured, type Ref } from 'vue'
import { useEngine } from './use-engine'

/**
 * 错误边界状态
 */
export interface ErrorBoundaryState {
  /** 当前错误 */
  error: Ref<Error | null>
  /** 是否有错误 */
  hasError: Ref<boolean>
  /** 重置错误状态 */
  reset: () => void
  /** 手动捕获错误 */
  captureError: (error: Error) => void
}

/**
 * 错误边界选项
 */
export interface UseErrorBoundaryOptions {
  /** 错误处理回调 */
  onError?: (error: Error, info: string) => void
  /** 是否阻止错误向上传播（默认 true） */
  stopPropagation?: boolean
  /** 是否将错误报告到引擎事件系统（默认 true） */
  reportToEngine?: boolean
}

/**
 * 使用错误边界
 *
 * 捕获子组件中抛出的错误，提供错误状态和重置能力
 *
 * @param options - 错误边界选项
 * @returns 错误边界状态
 *
 * @example
 * ```vue
 * <script setup>
 * import { useErrorBoundary } from '@ldesign/engine-vue3'
 *
 * const { error, hasError, reset } = useErrorBoundary({
 *   onError: (err) => console.error('Caught:', err)
 * })
 * </script>
 *
 * <template>
 *   <div v-if="hasError">
 *     <p>出错了: {{ error?.message }}</p>
 *     <button @click="reset">重试</button>
 *   </div>
 *   <slot v-else />
 * </template>
 * ```
 */
export function useErrorBoundary(
  options: UseErrorBoundaryOptions = {}
): ErrorBoundaryState {
  const {
    onError,
    stopPropagation = true,
    reportToEngine = true,
  } = options

  const error = ref<Error | null>(null)
  const hasError = ref(false)

  // 获取引擎实例（可选，不强制依赖）
  let engine: ReturnType<typeof useEngine> | null = null
  try {
    engine = useEngine()
  } catch {
    // 引擎不可用时静默忽略
  }

  /**
   * 捕获 Vue 子组件错误
   */
  onErrorCaptured((err: Error, _instance, info) => {
    error.value = err
    hasError.value = true

    // 调用自定义错误处理器
    onError?.(err, info)

    // 报告到引擎事件系统
    if (reportToEngine && engine) {
      engine.events.emit('error:captured', {
        error: err,
        info,
        timestamp: Date.now(),
      })
    }

    // 是否阻止错误向上传播
    return !stopPropagation
  })

  /**
   * 重置错误状态
   */
  const reset = () => {
    error.value = null
    hasError.value = false
  }

  /**
   * 手动捕获错误
   */
  const captureError = (err: Error) => {
    error.value = err
    hasError.value = true

    onError?.(err, 'manual')

    if (reportToEngine && engine) {
      engine.events.emit('error:captured', {
        error: err,
        info: 'manual',
        timestamp: Date.now(),
      })
    }
  }

  return {
    error,
    hasError,
    reset,
    captureError,
  }
}

/**
 * 使用安全异步执行
 *
 * 包装异步函数，自动捕获错误
 *
 * @param fn - 异步函数
 * @param options - 错误边界选项
 * @returns 安全执行函数和错误状态
 *
 * @example
 * ```vue
 * <script setup>
 * import { useSafeAsync } from '@ldesign/engine-vue3'
 *
 * const { execute, error, loading } = useSafeAsync(
 *   async (id: string) => {
 *     const res = await fetch(`/api/users/${id}`)
 *     return res.json()
 *   }
 * )
 *
 * // 调用不会抛出错误
 * const user = await execute('123')
 * </script>
 * ```
 */
export function useSafeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: UseErrorBoundaryOptions = {}
) {
  const error = ref<Error | null>(null)
  const loading = ref(false)

  const { onError, reportToEngine = true } = options

  let engine: ReturnType<typeof useEngine> | null = null
  try {
    engine = useEngine()
  } catch {
    // 引擎不可用时静默忽略
  }

  const execute = async (
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>> | undefined> => {
    error.value = null
    loading.value = true

    try {
      const result = await fn(...args)
      return result
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      error.value = e

      onError?.(e, 'async')

      if (reportToEngine && engine) {
        engine.events.emit('error:captured', {
          error: e,
          info: 'async',
          timestamp: Date.now(),
        })
      }

      return undefined
    } finally {
      loading.value = false
    }
  }

  return {
    execute: execute as (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | undefined>,
    error,
    loading,
  }
}
