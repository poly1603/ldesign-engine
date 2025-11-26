/**
 * Vue3 Devtools 适配器
 * 
 * 将 LDesign Engine 集成到 Vue Devtools 中，提供状态检查、事件追踪和时间旅行功能
 * 
 * @module devtools/vue-devtools-adapter
 */

import type { App } from 'vue'
import type { StateManager, EventManager } from '@ldesign/engine-core'

/**
 * Devtools Hook 接口
 */
interface DevtoolsHook {
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void
  emit(event: string, ...args: any[]): void
}

/**
 * 全局 Devtools Hook
 */
declare global {
  interface Window {
    __VUE_DEVTOOLS_GLOBAL_HOOK__?: DevtoolsHook
  }
}

/**
 * Devtools 配置选项
 */
export interface DevtoolsOptions {
  /** 是否启用状态检查器 */
  enableStateInspector?: boolean
  /** 是否启用事件追踪 */
  enableEventTracker?: boolean
  /** 是否启用时间旅行 */
  enableTimeTravel?: boolean
  /** 应用名称 */
  appName?: string
  /** 最大事件历史记录数 */
  maxEventHistory?: number
}

/**
 * 事件记录
 */
interface EventRecord {
  type: string
  payload: any
  timestamp: number
  source: string
}

/**
 * 状态快照
 */
interface StateSnapshot {
  state: Record<string, any>
  timestamp: number
}

/**
 * Vue Devtools 适配器
 */
export class VueDevtoolsAdapter {
  private app: App
  private stateManager: StateManager
  private eventManager: EventManager
  private devtoolsHook?: DevtoolsHook
  private options: Required<DevtoolsOptions>
  private eventHistory: EventRecord[] = []
  private stateSnapshots: StateSnapshot[] = []
  private isEnabled = false

  constructor(
    app: App,
    stateManager: StateManager,
    eventManager: EventManager,
    options: DevtoolsOptions = {}
  ) {
    this.app = app
    this.stateManager = stateManager
    this.eventManager = eventManager
    this.options = {
      enableStateInspector: options.enableStateInspector ?? true,
      enableEventTracker: options.enableEventTracker ?? true,
      enableTimeTravel: options.enableTimeTravel ?? true,
      appName: options.appName ?? 'LDesign Engine',
      maxEventHistory: options.maxEventHistory ?? 100
    }

    this.init()
  }

  /**
   * 初始化 Devtools 适配器
   */
  private init(): void {
    if (typeof window === 'undefined') {
      return
    }

    // 检查 Vue Devtools 是否可用
    if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      this.devtoolsHook = window.__VUE_DEVTOOLS_GLOBAL_HOOK__
      this.isEnabled = true
      this.setupDevtools()
    } else {
      // 监听 Devtools 加载
      this.waitForDevtools()
    }
  }

  /**
   * 等待 Devtools 加载
   */
  private waitForDevtools(): void {
    const checkInterval = setInterval(() => {
      if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
        clearInterval(checkInterval)
        this.devtoolsHook = window.__VUE_DEVTOOLS_GLOBAL_HOOK__
        this.isEnabled = true
        this.setupDevtools()
      }
    }, 1000)

    // 10 秒后停止检查
    setTimeout(() => clearInterval(checkInterval), 10000)
  }

  /**
   * 设置 Devtools 功能
   */
  private setupDevtools(): void {
    if (!this.devtoolsHook || !this.isEnabled) {
      return
    }

    // 注册自定义面板
    this.registerCustomInspector()

    if (this.options.enableStateInspector) {
      this.setupStateInspector()
    }

    if (this.options.enableEventTracker) {
      this.setupEventTracker()
    }

    if (this.options.enableTimeTravel) {
      this.setupTimeTravel()
    }
  }

  /**
   * 注册自定义检查器
   */
  private registerCustomInspector(): void {
    if (!this.devtoolsHook) return

    try {
      this.devtoolsHook.emit('app:init', this.app, {
        id: 'ldesign-engine',
        label: this.options.appName,
        logo: '🎨',
        packageName: '@ldesign/engine'
      })
    } catch (error) {
      console.warn('Failed to register custom inspector:', error)
    }
  }

  /**
   * 设置状态检查器
   */
  private setupStateInspector(): void {
    if (!this.devtoolsHook) return

    // 监听 Devtools 请求状态
    this.devtoolsHook.on('ldesign:inspect-state', () => {
      this.sendStateToDevtools()
    })

    // 监听所有状态变化
    const keys = this.stateManager.keys()
    keys.forEach(key => {
      this.stateManager.watch(key, () => {
        this.sendStateToDevtools()
        this.captureStateSnapshot()
      })
    })
  }

  /**
   * 发送状态到 Devtools
   */
  private sendStateToDevtools(): void {
    if (!this.devtoolsHook || !this.isEnabled) return

    try {
      const state = this.stateManager.getAll()
      this.devtoolsHook.emit('ldesign:state-updated', {
        type: 'state',
        payload: {
          state,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      console.warn('Failed to send state to devtools:', error)
    }
  }

  /**
   * 捕获状态快照
   */
  private captureStateSnapshot(): void {
    const snapshot: StateSnapshot = {
      state: { ...this.stateManager.getAll() },
      timestamp: Date.now()
    }

    this.stateSnapshots.push(snapshot)

    // 限制快照数量
    if (this.stateSnapshots.length > 50) {
      this.stateSnapshots.shift()
    }
  }

  /**
   * 设置事件追踪器
   */
  private setupEventTracker(): void {
    if (!this.devtoolsHook) return

    // 监听所有事件 - 使用通配符
    this.eventManager.on('*', (payload) => {
      this.trackEvent(payload)
    })

    // 监听 Devtools 请求事件历史
    this.devtoolsHook.on('ldesign:get-events', () => {
      this.sendEventsToDevtools()
    })
  }

  /**
   * 追踪事件
   */
  private trackEvent(event: any): void {
    const record: EventRecord = {
      type: event.type || 'unknown',
      payload: event.payload,
      timestamp: Date.now(),
      source: 'engine'
    }

    this.eventHistory.push(record)

    // 限制历史记录数量
    if (this.eventHistory.length > this.options.maxEventHistory) {
      this.eventHistory.shift()
    }

    // 发送到 Devtools
    if (this.devtoolsHook && this.isEnabled) {
      this.devtoolsHook.emit('ldesign:event-tracked', record)
    }
  }

  /**
   * 发送事件到 Devtools
   */
  private sendEventsToDevtools(): void {
    if (!this.devtoolsHook || !this.isEnabled) return

    try {
      this.devtoolsHook.emit('ldesign:events-list', {
        events: this.eventHistory,
        total: this.eventHistory.length
      })
    } catch (error) {
      console.warn('Failed to send events to devtools:', error)
    }
  }

  /**
   * 设置时间旅行功能
   */
  private setupTimeTravel(): void {
    if (!this.devtoolsHook) return

    // 监听时间旅行请求
    this.devtoolsHook.on('ldesign:travel-to-state', (data: { index: number }) => {
      this.travelToState(data.index)
    })

    // 监听快照列表请求
    this.devtoolsHook.on('ldesign:get-snapshots', () => {
      this.sendSnapshotsToDevtools()
    })
  }

  /**
   * 时间旅行到指定状态
   */
  private travelToState(index: number): void {
    if (index < 0 || index >= this.stateSnapshots.length) {
      console.warn('Invalid snapshot index:', index)
      return
    }

    const snapshot = this.stateSnapshots[index]
    if (snapshot) {
      try {
        // 恢复状态 - 使用 setAll 批量设置
        this.stateManager.setAll(snapshot.state)

        // 通知 Devtools
        if (this.devtoolsHook && this.isEnabled) {
          this.devtoolsHook.emit('ldesign:state-restored', {
            index,
            timestamp: snapshot.timestamp
          })
        }
      } catch (error) {
        console.error('Failed to restore state:', error)
      }
    }
  }

  /**
   * 发送快照列表到 Devtools
   */
  private sendSnapshotsToDevtools(): void {
    if (!this.devtoolsHook || !this.isEnabled) return

    try {
      this.devtoolsHook.emit('ldesign:snapshots-list', {
        snapshots: this.stateSnapshots.map((snapshot, index) => ({
          index,
          timestamp: snapshot.timestamp,
          stateKeys: Object.keys(snapshot.state)
        })),
        total: this.stateSnapshots.length
      })
    } catch (error) {
      console.warn('Failed to send snapshots to devtools:', error)
    }
  }

  /**
   * 获取事件历史
   */
  getEventHistory(): EventRecord[] {
    return [...this.eventHistory]
  }

  /**
   * 清空事件历史
   */
  clearEventHistory(): void {
    this.eventHistory = []
    if (this.devtoolsHook && this.isEnabled) {
      this.devtoolsHook.emit('ldesign:events-cleared')
    }
  }

  /**
   * 获取状态快照
   */
  getStateSnapshots(): StateSnapshot[] {
    return [...this.stateSnapshots]
  }

  /**
   * 清空状态快照
   */
  clearStateSnapshots(): void {
    this.stateSnapshots = []
    if (this.devtoolsHook && this.isEnabled) {
      this.devtoolsHook.emit('ldesign:snapshots-cleared')
    }
  }

  /**
   * 检查 Devtools 是否已启用
   */
  isDevtoolsEnabled(): boolean {
    return this.isEnabled
  }

  /**
   * 销毁适配器
   */
  destroy(): void {
    this.eventHistory = []
    this.stateSnapshots = []
    this.isEnabled = false
  }
}

/**
 * 创建 Vue Devtools 适配器
 */
export function createVueDevtoolsAdapter(
  app: App,
  stateManager: StateManager,
  eventManager: EventManager,
  options?: DevtoolsOptions
): VueDevtoolsAdapter {
  return new VueDevtoolsAdapter(app, stateManager, eventManager, options)
}