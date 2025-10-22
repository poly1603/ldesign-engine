/**
 * 事件调试器（Event Debugger）
 * 提供事件流的可视化调试和分析
 */

import type { EventManager } from '../types'

export interface EventTrace {
  event: string
  data: unknown
  timestamp: number
  callStack?: string
  duration?: number
  children: EventTrace[]
}

export interface EventDebuggerConfig {
  maxTraces?: number
  captureStack?: boolean
  enableTimings?: boolean
  filterEvents?: string[]
}

/**
 * 事件调试器
 */
export class EventDebugger {
  private traces: EventTrace[] = []
  private traceStack: EventTrace[] = []
  private config: Required<EventDebuggerConfig>
  private isEnabled = false

  private stats = {
    totalEvents: 0,
    capturedTraces: 0,
    maxDepth: 0,
    averageDuration: 0
  }

  constructor(
    private eventManager: EventManager,
    config: EventDebuggerConfig = {}
  ) {
    this.config = {
      maxTraces: config.maxTraces || 100,
      captureStack: config.captureStack ?? true,
      enableTimings: config.enableTimings ?? true,
      filterEvents: config.filterEvents || []
    }
  }

  /**
   * 启用调试
   */
  enable(): void {
    if (this.isEnabled) {
      return
    }

    this.isEnabled = true
    this.setupEventListeners()
  }

  /**
   * 禁用调试
   */
  disable(): void {
    this.isEnabled = false
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    const allEvents = this.eventManager.eventNames()

    for (const eventName of allEvents) {
      // 应用过滤器
      if (this.config.filterEvents.length > 0 &&
        !this.config.filterEvents.includes(eventName)) {
        continue
      }

      this.eventManager.on(eventName, (data) => {
        if (!this.isEnabled) {
          return
        }

        this.captureEvent(eventName, data)
      })
    }
  }

  /**
   * 捕获事件
   */
  private captureEvent(event: string, data: unknown): void {
    this.stats.totalEvents++

    const trace: EventTrace = {
      event,
      data,
      timestamp: Date.now(),
      callStack: this.config.captureStack ? new Error().stack : undefined,
      children: []
    }

    // 如果有父级trace，添加为子节点
    if (this.traceStack.length > 0) {
      const parent = this.traceStack[this.traceStack.length - 1]
      parent.children.push(trace)
    } else {
      // 否则作为根trace
      this.traces.push(trace)
      this.stats.capturedTraces++

      // 限制trace数量
      if (this.traces.length > this.config.maxTraces) {
        this.traces.shift()
      }
    }

    // 更新最大深度
    if (this.traceStack.length > this.stats.maxDepth) {
      this.stats.maxDepth = this.traceStack.length
    }

    // 如果启用了计时，将trace压入栈
    if (this.config.enableTimings) {
      this.traceStack.push(trace)

      // 稍后弹出（异步）
      Promise.resolve().then(() => {
        const popped = this.traceStack.pop()
        if (popped) {
          popped.duration = Date.now() - popped.timestamp
        }
      })
    }
  }

  /**
   * 获取所有traces
   */
  getTraces(): EventTrace[] {
    return [...this.traces]
  }

  /**
   * 分析事件流
   */
  analyze(): {
    eventCounts: Record<string, number>
    averageDurations: Record<string, number>
    eventChains: string[][]
    hotspots: Array<{ event: string; count: number; avgDuration: number }>
  } {
    const eventCounts: Record<string, number> = {}
    const eventDurations: Record<string, number[]> = {}
    const eventChains: string[][] = []

    // 遍历所有traces
    const processTrace = (trace: EventTrace, chain: string[] = []) => {
      const currentChain = [...chain, trace.event]

      // 统计事件数量
      eventCounts[trace.event] = (eventCounts[trace.event] || 0) + 1

      // 统计事件时长
      if (trace.duration !== undefined) {
        if (!eventDurations[trace.event]) {
          eventDurations[trace.event] = []
        }
        eventDurations[trace.event].push(trace.duration)
      }

      // 记录事件链
      if (currentChain.length > 1) {
        eventChains.push(currentChain)
      }

      // 递归处理子事件
      for (const child of trace.children) {
        processTrace(child, currentChain)
      }
    }

    for (const trace of this.traces) {
      processTrace(trace)
    }

    // 计算平均时长
    const averageDurations: Record<string, number> = {}
    for (const [event, durations] of Object.entries(eventDurations)) {
      averageDurations[event] = durations.reduce((a, b) => a + b, 0) / durations.length
    }

    // 找出热点（高频且耗时的事件）
    const hotspots = Object.entries(eventCounts)
      .map(([event, count]) => ({
        event,
        count,
        avgDuration: averageDurations[event] || 0
      }))
      .sort((a, b) => b.count * b.avgDuration - a.count * a.avgDuration)
      .slice(0, 10)

    return {
      eventCounts,
      averageDurations,
      eventChains,
      hotspots
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): typeof EventDebugger.prototype.stats {
    return { ...this.stats }
  }

  /**
   * 清除所有traces
   */
  clear(): void {
    this.traces = []
  }

  /**
   * 销毁调试器
   */
  destroy(): void {
    this.disable()
    this.clear()
  }
}

/**
 * 创建事件调试器
 */
export function createEventDebugger(
  eventManager: EventManager,
  config?: EventDebuggerConfig
): EventDebugger {
  return new EventDebugger(eventManager, config)
}


