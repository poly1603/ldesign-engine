/**
 * 事件持久化（Event Persistence）
 * 将事件持久化到存储中，支持恢复和回溯
 */

import type { EventManager } from '../types'
import type { RecordedEvent } from './event-replay'

export interface PersistenceConfig {
  storage?: 'localStorage' | 'sessionStorage' | 'indexedDB'
  keyPrefix?: string
  maxEvents?: number
  autoSave?: boolean
  saveInterval?: number
}

/**
 * 事件持久化管理器
 */
export class EventPersistence {
  private config: Required<PersistenceConfig>
  private events: RecordedEvent[] = []
  private saveTimer?: number
  private eventIdCounter = 0

  constructor(
    private eventManager: EventManager,
    config: PersistenceConfig = {}
  ) {
    this.config = {
      storage: config.storage || 'localStorage',
      keyPrefix: config.keyPrefix || 'event-persistence',
      maxEvents: config.maxEvents || 1000,
      autoSave: config.autoSave ?? true,
      saveInterval: config.saveInterval || 5000
    }

    // 加载已保存的事件
    this.load()

    // 启动自动保存
    if (this.config.autoSave) {
      this.startAutoSave()
    }
  }

  /**
   * 持久化事件
   */
  persist(eventName: string, data: unknown): void {
    const event: RecordedEvent = {
      name: eventName,
      data,
      timestamp: Date.now(),
      id: `event-${++this.eventIdCounter}`
    }

    this.events.push(event)

    // 限制事件数量
    if (this.events.length > this.config.maxEvents) {
      this.events.shift()
    }

    // 立即保存（如果未启用自动保存）
    if (!this.config.autoSave) {
      this.save()
    }
  }

  /**
   * 开始监听并持久化事件
   */
  startPersisting(eventPatterns: string[]): void {
    for (const pattern of eventPatterns) {
      this.eventManager.on(pattern, (data) => {
        this.persist(pattern, data)
      })
    }
  }

  /**
   * 保存到存储
   */
  save(): void {
    const data = JSON.stringify({
      events: this.events,
      savedAt: Date.now()
    })

    try {
      switch (this.config.storage) {
        case 'localStorage':
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.config.keyPrefix, data)
          }
          break
        case 'sessionStorage':
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(this.config.keyPrefix, data)
          }
          break
        case 'indexedDB':
          // IndexedDB 实现（异步）
          this.saveToIndexedDB(data)
          break
      }
    } catch (error) {
      console.error('Failed to save events:', error)
    }
  }

  /**
   * 从存储加载
   */
  load(): void {
    try {
      let data: string | null = null

      switch (this.config.storage) {
        case 'localStorage':
          if (typeof localStorage !== 'undefined') {
            data = localStorage.getItem(this.config.keyPrefix)
          }
          break
        case 'sessionStorage':
          if (typeof sessionStorage !== 'undefined') {
            data = sessionStorage.getItem(this.config.keyPrefix)
          }
          break
        case 'indexedDB':
          // IndexedDB 加载（异步，在构造函数后调用）
          this.loadFromIndexedDB()
          return
      }

      if (data) {
        const parsed = JSON.parse(data)
        this.events = parsed.events || []
      }
    } catch (error) {
      console.error('Failed to load events:', error)
    }
  }

  /**
   * 保存到 IndexedDB
   */
  private async saveToIndexedDB(data: string): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      return
    }

    const dbName = `${this.config.keyPrefix}-db`
    const request = indexedDB.open(dbName, 1)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('events')) {
        db.createObjectStore('events')
      }
    }

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    const transaction = db.transaction(['events'], 'readwrite')
    const store = transaction.objectStore('events')
    store.put(data, 'events')

    db.close()
  }

  /**
   * 从 IndexedDB 加载
   */
  private async loadFromIndexedDB(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      return
    }

    try {
      const dbName = `${this.config.keyPrefix}-db`
      const request = indexedDB.open(dbName, 1)

      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          if (!db.objectStoreNames.contains('events')) {
            db.createObjectStore('events')
          }
        }
      })

      const transaction = db.transaction(['events'], 'readonly')
      const store = transaction.objectStore('events')
      const getRequest = store.get('events')

      const data = await new Promise<string | undefined>((resolve) => {
        getRequest.onsuccess = () => resolve(getRequest.result)
        getRequest.onerror = () => resolve(undefined)
      })

      if (data) {
        const parsed = JSON.parse(data)
        this.events = parsed.events || []
      }

      db.close()
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error)
    }
  }

  /**
   * 启动自动保存
   */
  private startAutoSave(): void {
    this.saveTimer = window.setInterval(() => {
      this.save()
    }, this.config.saveInterval)
  }

  /**
   * 停止自动保存
   */
  private stopAutoSave(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer)
      this.saveTimer = undefined
    }
  }

  /**
   * 获取所有事件
   */
  getEvents(): RecordedEvent[] {
    return [...this.events]
  }

  /**
   * 获取事件数量
   */
  size(): number {
    return this.events.length
  }

  /**
   * 清除所有事件
   */
  clear(): void {
    this.events = []
    this.save()
  }

  /**
   * 销毁持久化管理器
   */
  destroy(): void {
    this.stopAutoSave()
    this.save() // 最后保存一次
    this.events = []
  }
}

/**
 * 创建事件持久化管理器
 */
export function createEventPersistence(
  eventManager: EventManager,
  config?: PersistenceConfig
): EventPersistence {
  return new EventPersistence(eventManager, config)
}



