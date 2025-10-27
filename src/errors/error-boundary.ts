/**
 * 错误边界和恢复机制
 * 
 * 提供组件级错误边界、错误恢复策略、降级处理等功能
 */

import { defineComponent, h, ref, onErrorCaptured } from 'vue'
import type { Component, VNode } from 'vue'

/**
 * 错误信息
 */
export interface ErrorInfo {
  /** 错误对象 */
  error: Error
  /** 组件实例 */
  component?: any
  /** 错误信息 */
  info?: string
  /** 时间戳 */
  timestamp: number
  /** 错误次数 */
  count: number
}

/**
 * 错误恢复策略
 */
export type RecoveryStrategy = 
  | 'retry'          // 重试
  | 'fallback'       // 降级
  | 'ignore'         // 忽略
  | 'propagate'      // 传播

/**
 * 错误边界配置
 */
export interface ErrorBoundaryConfig {
  /** 错误恢复策略 */
  strategy?: RecoveryStrategy
  /** 最大重试次数 */
  maxRetries?: number
  /** 降级组件 */
  fallbackComponent?: Component
  /** 错误处理器 */
  onError?: (error: ErrorInfo) => void
  /** 恢复前钩子 */
  onRecover?: () => void
  /** 重置前钩子 */
  onReset?: () => void
}

/**
 * 创建错误边界组件
 * 
 * @example
 * ```vue
 * <template>
 *   <ErrorBoundary
 *     :strategy="'fallback'"
 *     :fallback-component="ErrorFallback"
 *     @error="handleError"
 *   >
 *     <MyComponent />
 *   </ErrorBoundary>
 * </template>
 * ```
 */
export function createErrorBoundary(config: ErrorBoundaryConfig = {}) {
  return defineComponent({
    name: 'ErrorBoundary',
    
    props: {
      strategy: {
        type: String as () => RecoveryStrategy,
        default: config.strategy || 'fallback'
      },
      maxRetries: {
        type: Number,
        default: config.maxRetries || 3
      },
      fallbackComponent: {
        type: Object as () => Component,
        default: config.fallbackComponent
      }
    },

    emits: ['error', 'recover', 'reset'],

    setup(props, { slots, emit }) {
      const hasError = ref(false)
      const errorInfo = ref<ErrorInfo | null>(null)
      const retryCount = ref(0)

      // 捕获子组件错误
      onErrorCaptured((error: Error, component, info) => {
        const currentError: ErrorInfo = {
          error,
          component,
          info,
          timestamp: Date.now(),
          count: retryCount.value + 1
        }

        errorInfo.value = currentError
        hasError.value = true
        retryCount.value++

        // 触发错误事件
        emit('error', currentError)
        config.onError?.(currentError)

        // 根据策略处理
        switch (props.strategy) {
          case 'retry':
            if (retryCount.value < props.maxRetries) {
              setTimeout(() => {
                reset()
              }, 1000 * retryCount.value) // 指数退避
            }
            break

          case 'fallback':
            // 使用降级组件
            break

          case 'ignore':
            hasError.value = false
            break

          case 'propagate':
            return true // 继续传播错误
        }

        return false // 阻止错误传播
      })

      /**
       * 重置错误状态
       */
      function reset() {
        hasError.value = false
        errorInfo.value = null
        retryCount.value = 0
        emit('reset')
        config.onReset?.()
      }

      /**
       * 恢复
       */
      function recover() {
        emit('recover')
        config.onRecover?.()
        reset()
      }

      return () => {
        if (hasError.value) {
          // 显示降级组件
          if (props.fallbackComponent) {
            return h(props.fallbackComponent as any, {
              error: errorInfo.value,
              onRecover: recover,
              onReset: reset
            })
          }

          // 默认错误UI
          return h('div', {
            class: 'error-boundary',
            style: {
              padding: '20px',
              margin: '20px',
              border: '1px solid #ff4444',
              borderRadius: '4px',
              backgroundColor: '#fff5f5'
            }
          }, [
            h('h3', {
              style: { color: '#ff4444', margin: '0 0 10px 0' }
            }, '出错了'),
            h('p', {
              style: { margin: '0 0 10px 0', color: '#666' }
            }, errorInfo.value?.error.message || '未知错误'),
            h('button', {
              onClick: reset,
              style: {
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }
            }, '重试')
          ])
        }

        // 渲染子组件
        return slots.default?.()
      }
    }
  })
}

/**
 * 错误恢复管理器
 * 
 * 管理全局错误恢复策略
 */
export class ErrorRecoveryManager {
  private strategies = new Map<string, RecoveryStrategy>()
  private retryCounters = new Map<string, number>()
  private maxGlobalRetries = 5

  /**
   * 设置错误类型的恢复策略
   */
  setStrategy(errorType: string, strategy: RecoveryStrategy): void {
    this.strategies.set(errorType, strategy)
  }

  /**
   * 获取恢复策略
   */
  getStrategy(errorType: string): RecoveryStrategy {
    return this.strategies.get(errorType) || 'fallback'
  }

  /**
   * 记录重试
   */
  recordRetry(errorType: string): boolean {
    const count = (this.retryCounters.get(errorType) || 0) + 1
    this.retryCounters.set(errorType, count)
    return count <= this.maxGlobalRetries
  }

  /**
   * 重置重试计数
   */
  resetRetry(errorType: string): void {
    this.retryCounters.delete(errorType)
  }

  /**
   * 获取重试次数
   */
  getRetryCount(errorType: string): number {
    return this.retryCounters.get(errorType) || 0
  }

  /**
   * 清空所有策略
   */
  clear(): void {
    this.strategies.clear()
    this.retryCounters.clear()
  }
}

/**
 * 创建错误恢复管理器
 */
export function createErrorRecoveryManager(): ErrorRecoveryManager {
  return new ErrorRecoveryManager()
}

/**
 * 降级处理器
 * 
 * 当功能不可用时，提供降级方案
 */
export class DegradationHandler {
  private degradations = new Map<string, () => any>()

  /**
   * 注册降级方案
   */
  register(feature: string, fallback: () => any): void {
    this.degradations.set(feature, fallback)
  }

  /**
   * 执行降级方案
   */
  execute(feature: string): any {
    const fallback = this.degradations.get(feature)
    if (!fallback) {
      throw new Error(`未找到功能 "${feature}" 的降级方案`)
    }
    return fallback()
  }

  /**
   * 检查是否有降级方案
   */
  has(feature: string): boolean {
    return this.degradations.has(feature)
  }

  /**
   * 尝试执行（如果失败则降级）
   */
  async tryOrFallback<T>(
    feature: string,
    primary: () => Promise<T>
  ): Promise<T> {
    try {
      return await primary()
    } catch (error) {
      console.warn(`功能 "${feature}" 失败，使用降级方案`, error)
      return this.execute(feature)
    }
  }
}

/**
 * 创建降级处理器
 */
export function createDegradationHandler(): DegradationHandler {
  return new DegradationHandler()
}


