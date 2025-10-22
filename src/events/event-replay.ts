/**
 * 事件重放（Event Replay）
 * 记录、回放和调试事件流
 */

import type { EventManager } from '../types'

export interface RecordedEvent<T = unknown> {
  name: string
  data: T
  timestamp: number
  id: string
}

export interface ReplayOptions {
  speed?: number           // 回放速度倍率（1.0 = 原速）
  loop?: boolean          // 是否循环回放
  startFrom?: number      // 从哪个事件开始
  endAt?: number          // 到哪个事件结束
  filter?: (event: RecordedEvent) => boolean
}

/**
 * 事件重放器 - 记录和回放事件流
 */
export class EventReplay {
  private events: RecordedEvent[] = []
  private isRecording = false
  private isReplaying = false
  private replayTimer?: number
  private eventIdCounter = 0
  private maxEvents = 1000 // 最大记录事件数

  private stats = {
    recorded: 0,
    replayed: 0,
    filtered: 0
  }

  constructor(private eventManager: EventManager) { }

  /**
   * 开始记录事件
   */
  startRecording(eventPatterns: string[] = ['*']): void {
    if (this.isRecording) {
      return
    }

    this.isRecording = true
    this.events = []

    // 监听所有匹配的事件
    for (const pattern of eventPatterns) {
      if (pattern === '*') {
        // 监听所有事件
        const allEvents = this.eventManager.eventNames()
        for (const eventName of allEvents) {
          this.recordEvent(eventName)
        }
      } else {
        this.recordEvent(pattern)
      }
    }
  }

  /**
   * 记录单个事件
   */
  private recordEvent(eventName: string): void {
    this.eventManager.on(eventName, (data) => {
      if (!this.isRecording) {
        return
      }

      const recorded: RecordedEvent = {
        name: eventName,
        data,
        timestamp: Date.now(),
        id: `event-${++this.eventIdCounter}`
      }

      this.events.push(recorded)
      this.stats.recorded++

      // 限制事件数量
      if (this.events.length > this.maxEvents) {
        this.events.shift()
      }
    })
  }

  /**
   * 停止记录
   */
  stopRecording(): RecordedEvent[] {
    this.isRecording = false
    return [...this.events]
  }

  /**
   * 回放事件
   */
  async replay(options: ReplayOptions = {}): Promise<void> {
    if (this.isReplaying) {
      throw new Error('Already replaying')
    }

    const {
      speed = 1.0,
      loop = false,
      startFrom = 0,
      endAt = this.events.length,
      filter
    } = options

    this.isReplaying = true

    const eventsToReplay = this.events
      .slice(startFrom, endAt)
      .filter(e => !filter || filter(e))

    this.stats.filtered = this.events.length - eventsToReplay.length

    do {
      for (let i = 0; i < eventsToReplay.length; i++) {
        if (!this.isReplaying) {
          return
        }

        const event = eventsToReplay[i]
        const nextEvent = eventsToReplay[i + 1]

        // 发送事件
        this.eventManager.emit(event.name, event.data)
        this.stats.replayed++

        // 等待适当的时间间隔
        if (nextEvent) {
          const delay = (nextEvent.timestamp - event.timestamp) / speed
          await new Promise(resolve => {
            this.replayTimer = window.setTimeout(resolve, delay)
          })
        }
      }
    } while (loop && this.isReplaying)

    this.isReplaying = false
  }

  /**
   * 停止回放
   */
  stopReplay(): void {
    this.isReplaying = false
    if (this.replayTimer) {
      clearTimeout(this.replayTimer)
      this.replayTimer = undefined
    }
  }

  /**
   * 导出事件记录
   */
  export(): string {
    return JSON.stringify({
      events: this.events,
      stats: this.stats,
      exportedAt: Date.now()
    })
  }

  /**
   * 导入事件记录
   */
  import(data: string): void {
    try {
      const parsed = JSON.parse(data)
      this.events = parsed.events || []
      this.stats = parsed.stats || this.stats
    } catch (error) {
      throw new Error(`Failed to import events: ${error}`)
    }
  }

  /**
   * 清除所有记录
   */
  clear(): void {
    this.events = []
    this.stats = {
      recorded: 0,
      replayed: 0,
      filtered: 0
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): typeof EventReplay.prototype.stats & {
    totalEvents: number
    isRecording: boolean
    isReplaying: boolean
  } {
    return {
      ...this.stats,
      totalEvents: this.events.length,
      isRecording: this.isRecording,
      isReplaying: this.isReplaying
    }
  }

  /**
   * 销毁重放器
   */
  destroy(): void {
    this.stopRecording()
    this.stopReplay()
    this.clear()
  }
}

/**
 * 创建事件重放器
 */
export function createEventReplay(eventManager: EventManager): EventReplay {
  return new EventReplay(eventManager)
}



