/**
 * ErrorBoundary 组件
 *
 * 捕获子组件中的错误并提供降级 UI 和重试能力
 *
 * @module components/ErrorBoundary
 */

import {
  defineComponent,
  ref,
  h,
  onErrorCaptured,
  type PropType,
  type VNode,
} from 'vue'

/**
 * ErrorBoundary 属性
 */
export interface ErrorBoundaryProps {
  /** 错误处理回调 */
  onError?: (error: Error, info: string) => void
  /** 是否阻止错误向上传播（默认 true） */
  stopPropagation?: boolean
}

/**
 * ErrorBoundary 组件
 *
 * 捕获子组件树中的错误，提供 fallback 插槽显示降级 UI
 *
 * @example
 * ```vue
 * <template>
 *   <ErrorBoundary @error="handleError">
 *     <template #default>
 *       <RiskyComponent />
 *     </template>
 *     <template #fallback="{ error, reset }">
 *       <div class="error-fallback">
 *         <p>出错了: {{ error.message }}</p>
 *         <button @click="reset">重试</button>
 *       </div>
 *     </template>
 *   </ErrorBoundary>
 * </template>
 * ```
 */
export const ErrorBoundary = defineComponent({
  name: 'ErrorBoundary',
  props: {
    onError: {
      type: Function as PropType<(error: Error, info: string) => void>,
      default: undefined,
    },
    stopPropagation: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['error'],
  setup(props, { slots, emit }) {
    const error = ref<Error | null>(null)
    const hasError = ref(false)
    const errorInfo = ref('')

    /**
     * 重置错误状态，重新渲染子组件
     */
    const reset = () => {
      error.value = null
      hasError.value = false
      errorInfo.value = ''
    }

    /**
     * 捕获子组件错误
     */
    onErrorCaptured((err: Error, _instance, info) => {
      error.value = err
      hasError.value = true
      errorInfo.value = info

      // 触发 error 事件
      emit('error', err, info)

      // 调用 onError 回调
      props.onError?.(err, info)

      // 是否阻止错误向上传播
      return !props.stopPropagation
    })

    return () => {
      // 有错误时渲染 fallback 插槽
      if (hasError.value && error.value) {
        if (slots.fallback) {
          return slots.fallback({
            error: error.value,
            info: errorInfo.value,
            reset,
          })
        }

        // 默认降级 UI
        return h('div', {
          style: {
            padding: '16px',
            border: '1px solid #f56c6c',
            borderRadius: '4px',
            backgroundColor: '#fef0f0',
            color: '#f56c6c',
          },
        }, [
          h('p', { style: { margin: '0 0 8px 0', fontWeight: 'bold' } }, 'Something went wrong'),
          h('p', { style: { margin: '0 0 12px 0', fontSize: '14px' } }, error.value.message),
          h('button', {
            onClick: reset,
            style: {
              padding: '6px 16px',
              border: '1px solid #f56c6c',
              borderRadius: '4px',
              backgroundColor: '#fff',
              color: '#f56c6c',
              cursor: 'pointer',
            },
          }, 'Retry'),
        ])
      }

      // 正常渲染子组件
      return slots.default?.()
    }
  },
})
