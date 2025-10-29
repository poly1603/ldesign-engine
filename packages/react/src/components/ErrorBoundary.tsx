/**
 * Error Boundary Component
 */

import { Component, type ReactNode } from 'react'
import type { ReactEngine } from '../types'

export interface ErrorBoundaryProps {
  engine?: ReactEngine
  fallback?: ReactNode | ((error: Error, errorInfo: any) => ReactNode)
  onError?: (error: Error, errorInfo: any) => void
  children: ReactNode
}

export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

/**
 * Error Boundary Component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: any): void {
    const { engine, onError } = this.props

    // 记录错误到引擎
    if (engine) {
      engine.logger.error('React Error Boundary caught error:', error)
      engine.events.emit('error', { error, errorInfo })
    }

    // 调用自定义错误处理
    if (onError) {
      onError(error, errorInfo)
    }

    // 更新状态
    this.setState({
      error,
      errorInfo,
    })
  }

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state
    const { fallback, children } = this.props

    if (hasError) {
      // 如果提供了自定义 fallback
      if (fallback) {
        return typeof fallback === 'function' ? fallback(error!, errorInfo) : fallback
      }

      // 默认错误 UI
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error Details</summary>
            {error && error.toString()}
            <br />
            {errorInfo && errorInfo.componentStack}
          </details>
        </div>
      )
    }

    return children
  }
}

