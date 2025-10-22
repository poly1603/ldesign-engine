/**
 * WebWorker Pool Manager
 * 
 * 提供高效的 WebWorker 池管理，支持：
 * - 动态 Worker 池大小调整
 * - 任务队列和优先级
 * - 自动负载均衡
 * - 错误恢复和重试
 * - 内存监控和自动清理
 */

import type { Logger } from '../types'

// Worker 任务类型
export interface WorkerTask<T = unknown> {
  id: string
  type: string
  data: T
  priority?: number
  timeout?: number
  retries?: number
  transferable?: Transferable[]
}

// Worker 任务结果
export interface WorkerResult<R = unknown> {
  id: string
  success: boolean
  data?: R
  error?: string
  duration: number
}

// Worker 配置
export interface WorkerPoolConfig {
  minWorkers?: number
  maxWorkers?: number
  workerScript?: string | URL | (() => Worker)
  taskTimeout?: number
  idleTimeout?: number
  maxRetries?: number
  enableSharedArrayBuffer?: boolean
  enablePreheating?: boolean // 启用预热
  preheatTasks?: Array<WorkerTask> // 预热任务
  enableSmartScheduling?: boolean // 启用智能调度
  onError?: (error: Error, task: WorkerTask) => void
  onSuccess?: (result: WorkerResult) => void
}

// Worker 状态
export interface WorkerState {
  id: string
  worker: Worker
  busy: boolean
  currentTask?: WorkerTask
  tasksCompleted: number
  errors: number
  createdAt: number
  lastUsedAt: number
  // 智能调度相关
  averageTaskTime: number // 平均任务时间
  taskTypeStats: Map<string, { count: number; totalTime: number }> // 按任务类型统计
  load: number // 当前负载（0-1）
}

// 任务队列项
interface QueuedTask<T = unknown, R = unknown> {
  task: WorkerTask<T>
  resolve: (result: WorkerResult<R>) => void
  reject: (error: Error) => void
  addedAt: number
  attempts: number
}

/**
 * WebWorker 池管理器
 */
export class WorkerPool<T = unknown, R = unknown> {
  private workers: Map<string, WorkerState> = new Map()
  private taskQueue: QueuedTask<T, R>[] = []
  private pendingTasks: Map<string, QueuedTask<T, R>> = new Map()
  private config: Required<WorkerPoolConfig>
  private idleCheckInterval?: NodeJS.Timeout
  private metricsInterval?: NodeJS.Timeout
  private isTerminated = false

  // 性能指标
  private metrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageTime: 0,
    peakWorkers: 0,
    currentQueueSize: 0
  }

  // 🚀 新增：统一管理所有 Blob URLs，防止内存泄漏
  private workerBlobUrls = new Set<string>()

  // 🚀 新增：资源跟踪
  private resourceTracker = {
    createdWorkers: 0,
    terminatedWorkers: 0,
    activeBlobUrls: 0,
    peakMemoryUsage: 0
  }

  constructor(
    config: WorkerPoolConfig = {},
    private logger?: Logger
  ) {
    this.config = {
      minWorkers: config.minWorkers || 2,
      maxWorkers: config.maxWorkers || navigator.hardwareConcurrency || 4,
      workerScript: config.workerScript || this.createDefaultWorker,
      taskTimeout: config.taskTimeout || 30000,
      idleTimeout: config.idleTimeout || 60000,
      maxRetries: config.maxRetries || 3,
      enableSharedArrayBuffer: config.enableSharedArrayBuffer || false,
      enablePreheating: config.enablePreheating ?? true, // 默认启用预热
      preheatTasks: config.preheatTasks || [],
      enableSmartScheduling: config.enableSmartScheduling ?? true, // 默认启用智能调度
      onError: config.onError || (() => { }),
      onSuccess: config.onSuccess || (() => { })
    }

    this.initialize()

    // 预热Workers
    if (this.config.enablePreheating) {
      this.preheatWorkers()
    }
  }

  /**
   * 初始化 Worker 池
   */
  private initialize(): void {
    // 创建最小数量的 workers
    for (let i = 0; i < this.config.minWorkers; i++) {
      this.createWorker()
    }

    // 启动空闲检查
    this.idleCheckInterval = setInterval(() => {
      this.checkIdleWorkers()
    }, 10000)

    // 启动指标收集
    this.metricsInterval = setInterval(() => {
      this.updateMetrics()
    }, 5000)

    this.logger?.info('Worker pool initialized', {
      minWorkers: this.config.minWorkers,
      maxWorkers: this.config.maxWorkers
    })
  }

  /**
   * 预热Workers - 提前让Workers准备好执行任务
   */
  private async preheatWorkers(): Promise<void> {
    const preheatTasks = this.config.preheatTasks || []

    // 如果没有预定义的预热任务，创建一个简单的预热任务
    if (preheatTasks.length === 0) {
      preheatTasks.push({
        id: 'preheat-default',
        type: 'compute',
        data: { iterations: 1000 } as any
      })
    }

    this.logger?.debug('Preheating workers', { tasks: preheatTasks.length })

    // 并行预热所有workers
    const preheatPromises = Array.from(this.workers.values()).map(async (workerState) => {
      for (const task of preheatTasks) {
        try {
          // 发送预热任务但不等待结果
          workerState.worker.postMessage({
            ...task,
            id: `preheat-${workerState.id}-${task.id}`
          })
        } catch (error) {
          this.logger?.warn(`Failed to preheat worker ${workerState.id}`, error)
        }
      }
    })

    await Promise.allSettled(preheatPromises)
    this.logger?.debug('Worker preheating completed')
  }

  /**
   * 创建新的 Worker
   */
  private createWorker(): WorkerState | null {
    if (this.workers.size >= this.config.maxWorkers) {
      return null
    }

    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    let worker: Worker
    if (typeof this.config.workerScript === 'function') {
      worker = this.config.workerScript()
    } else if (typeof this.config.workerScript === 'string' || this.config.workerScript instanceof URL) {
      worker = new Worker(this.config.workerScript)
    } else {
      worker = this.createDefaultWorker()
    }

    const state: WorkerState = {
      id: workerId,
      worker,
      busy: false,
      tasksCompleted: 0,
      errors: 0,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      averageTaskTime: 0,
      taskTypeStats: new Map(),
      load: 0
    }

    // 设置 Worker 消息处理
    worker.onmessage = (event) => {
      this.handleWorkerMessage(workerId, event.data)
    }

    worker.onerror = (error) => {
      this.handleWorkerError(workerId, error)
    }

    this.workers.set(workerId, state)

    // 🚀 更新资源跟踪
    this.resourceTracker.createdWorkers++

    // 更新峰值
    if (this.workers.size > this.metrics.peakWorkers) {
      this.metrics.peakWorkers = this.workers.size
    }

    this.logger?.debug(`Worker ${workerId} created`, {
      totalCreated: this.resourceTracker.createdWorkers,
      activeWorkers: this.workers.size
    })

    return state
  }

  /**
   * 创建默认 Worker 脚本 - 🚀 优化版：统一管理 Blob URLs
   */
  private createDefaultWorker(): Worker {
    const workerScript = `
      self.onmessage = async function(e) {
        const { id, type, data } = e.data;
        
        try {
          let result;
          
          // 根据任务类型执行不同操作
          switch (type) {
            case 'compute':
              result = await performComputation(data);
              break;
            case 'transform':
              result = await transformData(data);
              break;
            case 'analyze':
              result = await analyzeData(data);
              break;
            default:
              // 默认处理：执行传入的函数字符串
              if (typeof data === 'string' && data.startsWith('function')) {
                const fn = new Function('return ' + data)();
                result = await fn();
              } else {
                result = data;
              }
          }
          
          self.postMessage({ id, success: true, data: result });
        } catch (error) {
          self.postMessage({ id, success: false, error: error.message });
        }
      };
      
      // 示例计算函数
      async function performComputation(data) {
        // 模拟耗时计算
        let result = 0;
        for (let i = 0; i < data.iterations || 1000000; i++) {
          result += Math.sqrt(i);
        }
        return result;
      }
      
      async function transformData(data) {
        // 数据转换逻辑
        return JSON.parse(JSON.stringify(data));
      }
      
      async function analyzeData(data) {
        // 数据分析逻辑
        return {
          size: JSON.stringify(data).length,
          type: typeof data,
          timestamp: Date.now()
        };
      }
    `

    const blob = new Blob([workerScript], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)

    // 🚀 将URL添加到集中管理的Set中
    this.workerBlobUrls.add(url)
    this.resourceTracker.activeBlobUrls = this.workerBlobUrls.size

    return new Worker(url)
  }

  /**
   * 执行任务
   */
  async execute(task: WorkerTask<T>): Promise<WorkerResult<R>> {
    if (this.isTerminated) {
      throw new Error('Worker pool has been terminated')
    }

    this.metrics.totalTasks++

    return new Promise((resolve, reject) => {
      const taskId = task.id || this.generateTaskId()
      const queuedTask: QueuedTask<T, R> = {
        task: {
          ...task,
          id: taskId,
          priority: task.priority ?? 0,
          timeout: task.timeout ?? this.config.taskTimeout,
          retries: task.retries ?? this.config.maxRetries
        },
        resolve,
        reject,
        addedAt: Date.now(),
        attempts: 0
      }

      // 尝试立即执行或加入队列
      if (!this.tryExecuteTask(queuedTask)) {
        this.enqueueTask(queuedTask)
      }
    })
  }

  /**
   * 批量执行任务
   */
  async executeBatch(tasks: WorkerTask<T>[]): Promise<WorkerResult<R>[]> {
    return Promise.all(tasks.map(task => this.execute(task)))
  }

  /**
   * 并行执行任务并合并结果
   */
  async parallel<TR = R>(
    data: T[],
    mapper: (item: T, index: number) => WorkerTask<T>,
    reducer?: (results: TR[]) => R
  ): Promise<R> {
    const tasks = data.map((item, index) => mapper(item, index))
    const results = await this.executeBatch(tasks)

    const successResults = results
      .filter(r => r.success)
      .map(r => r.data as TR)

    if (reducer) {
      return reducer(successResults) as R
    }

    return successResults as unknown as R
  }

  /**
   * 尝试执行任务
   */
  private tryExecuteTask(queuedTask: QueuedTask<T, R>): boolean {
    // 查找空闲的 worker（传入任务以支持智能调度）
    let worker = this.findIdleWorker(queuedTask.task)

    // 如果没有空闲 worker，尝试创建新的
    if (!worker && this.workers.size < this.config.maxWorkers) {
      const newWorker = this.createWorker()
      if (newWorker) {
        worker = newWorker
      }
    }

    if (!worker) {
      return false
    }

    // 标记为忙碌并执行任务
    worker.busy = true
    worker.currentTask = queuedTask.task
    worker.lastUsedAt = Date.now()
    queuedTask.attempts++

    // 设置超时
    const timeoutId = setTimeout(() => {
      this.handleTaskTimeout(worker.id, queuedTask)
    }, queuedTask.task.timeout!)

    // 存储待处理任务
    this.pendingTasks.set(queuedTask.task.id, {
      ...queuedTask,
      resolve: (result) => {
        clearTimeout(timeoutId)
        queuedTask.resolve(result)
      },
      reject: (error) => {
        clearTimeout(timeoutId)
        queuedTask.reject(error)
      }
    })

    // 发送任务到 worker
    try {
      if (queuedTask.task.transferable) {
        worker.worker.postMessage(queuedTask.task, queuedTask.task.transferable)
      } else {
        worker.worker.postMessage(queuedTask.task)
      }

      this.logger?.debug(`Task ${queuedTask.task.id} assigned to worker ${worker.id}`)
      return true
    } catch (error) {
      this.handleWorkerError(worker.id, error as Error)
      return false
    }
  }

  /**
   * 将任务加入队列
   */
  private enqueueTask(task: QueuedTask<T, R>): void {
    // 按优先级插入队列
    const insertIndex = this.taskQueue.findIndex(
      t => (t.task.priority || 0) < (task.task.priority || 0)
    )

    if (insertIndex === -1) {
      this.taskQueue.push(task)
    } else {
      this.taskQueue.splice(insertIndex, 0, task)
    }

    this.metrics.currentQueueSize = this.taskQueue.length

    this.logger?.debug(`Task ${task.task.id} queued`, {
      queueSize: this.taskQueue.length,
      priority: task.task.priority
    })
  }

  /**
   * 处理 Worker 消息
   */
  private handleWorkerMessage(workerId: string, message: WorkerResult): void {
    const worker = this.workers.get(workerId)
    if (!worker) return

    const task = this.pendingTasks.get(message.id)
    if (!task) return

    // 清理待处理任务
    this.pendingTasks.delete(message.id)

    // 更新 worker 状态
    worker.busy = false
    worker.currentTask = undefined
    worker.tasksCompleted++

    // 处理结果
    const duration = Date.now() - task.addedAt
    const result: WorkerResult<R> = {
      id: message.id,
      success: message.success,
      data: message.data as R | undefined,
      error: message.error,
      duration
    }

    // 更新worker统计信息（用于智能调度）
    if (message.success && this.config.enableSmartScheduling) {
      // 更新平均任务时间
      const totalTime = worker.averageTaskTime * (worker.tasksCompleted - 1) + duration
      worker.averageTaskTime = totalTime / worker.tasksCompleted

      // 更新任务类型统计
      const taskType = task.task.type
      const typeStats = worker.taskTypeStats.get(taskType) || { count: 0, totalTime: 0 }
      typeStats.count++
      typeStats.totalTime += duration
      worker.taskTypeStats.set(taskType, typeStats)

      // 更新负载（简单实现：基于任务完成速度）
      worker.load = Math.min(duration / 1000 / 10, 1) // 归一化到0-1
    }

    if (message.success) {
      this.metrics.completedTasks++
      this.config.onSuccess(result)
      task.resolve(result)

      this.logger?.debug(`Task ${message.id} completed`, { duration })
    } else {
      // 重试逻辑
      if (task.attempts < (task.task.retries || 0)) {
        this.logger?.debug(`Retrying task ${message.id}`, {
          attempt: task.attempts,
          maxRetries: task.task.retries
        })

        if (!this.tryExecuteTask(task)) {
          this.enqueueTask(task)
        }
      } else {
        this.metrics.failedTasks++
        const error = new Error(message.error || 'Task failed')
        this.config.onError(error, task.task)
        task.reject(error)

        this.logger?.error(`Task ${message.id} failed`, { error: message.error })
      }
    }

    // 处理队列中的下一个任务
    this.processQueue()
  }

  /**
   * 处理 Worker 错误
   */
  private handleWorkerError(workerId: string, error: Error | ErrorEvent): void {
    const worker = this.workers.get(workerId)
    if (!worker) return

    worker.errors++

    this.logger?.error(`Worker ${workerId} error`, error)

    // 如果错误太多，终止并重建 worker
    if (worker.errors > 3) {
      this.terminateWorker(workerId)
      this.createWorker()
    }

    // 重新分配当前任务
    if (worker.currentTask) {
      const task = this.pendingTasks.get(worker.currentTask.id)
      if (task) {
        this.pendingTasks.delete(worker.currentTask.id)
        if (!this.tryExecuteTask(task)) {
          this.enqueueTask(task)
        }
      }
    }
  }

  /**
   * 处理任务超时
   */
  private handleTaskTimeout(workerId: string, task: QueuedTask<T, R>): void {
    this.logger?.warn(`Task ${task.task.id} timeout on worker ${workerId}`)

    // 清理待处理任务
    this.pendingTasks.delete(task.task.id)

    // 重置 worker 状态而不是终止（避免频繁创建/销毁）
    const worker = this.workers.get(workerId)
    if (worker) {
      worker.busy = false
      worker.currentTask = undefined
      worker.errors++

      // 只有在错误过多时才终止
      if (worker.errors > 3) {
        this.terminateWorker(workerId)
        this.createWorker()
      }
    }

    // 重试任务
    if (task.attempts < (task.task.retries || 0)) {
      if (!this.tryExecuteTask(task)) {
        this.enqueueTask(task)
      }
    } else {
      task.reject(new Error('Task timeout'))
    }
  }

  /**
   * 处理队列中的任务
   */
  private processQueue(): void {
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue[0]

      if (this.tryExecuteTask(task)) {
        this.taskQueue.shift()
        this.metrics.currentQueueSize = this.taskQueue.length
      } else {
        break
      }
    }
  }

  /**
   * 查找空闲的 Worker（智能调度版本）
   * 根据任务类型和worker性能选择最合适的worker
   */
  private findIdleWorker(task?: WorkerTask): WorkerState | undefined {
    const idleWorkers = Array.from(this.workers.values()).filter(w => !w.busy)

    if (idleWorkers.length === 0) {
      return undefined
    }

    // 如果未启用智能调度或没有任务信息，返回第一个空闲worker
    if (!this.config.enableSmartScheduling || !task) {
      return idleWorkers[0]
    }

    // 智能调度：根据任务类型和worker历史性能选择最佳worker
    const taskType = task.type

    // 为每个空闲worker计算得分
    const scoredWorkers = idleWorkers.map(worker => {
      let score = 0

      // 1. 任务类型匹配度（如果worker之前执行过此类型任务）
      const taskStats = worker.taskTypeStats.get(taskType)
      if (taskStats && taskStats.count > 0) {
        // 执行过该类型任务的worker优先级更高
        const avgTime = taskStats.totalTime / taskStats.count
        // 平均时间越短，得分越高
        score += 100 - Math.min(avgTime / 10, 100)
      } else {
        // 没有执行过的worker得分较低
        score += 30
      }

      // 2. 整体性能（平均任务时间）
      if (worker.tasksCompleted > 0 && worker.averageTaskTime > 0) {
        score += 100 - Math.min(worker.averageTaskTime / 10, 100)
      } else {
        score += 50 // 新worker给中等得分
      }

      // 3. 负载均衡（倾向选择负载较轻的worker）
      score += (1 - worker.load) * 50

      // 4. 错误率（错误少的worker得分高）
      if (worker.tasksCompleted > 0) {
        const errorRate = worker.errors / worker.tasksCompleted
        score -= errorRate * 100
      }

      return { worker, score }
    })

    // 选择得分最高的worker
    scoredWorkers.sort((a, b) => b.score - a.score)
    const selected = scoredWorkers[0].worker

    this.logger?.debug(`Smart scheduling selected worker ${selected.id}`, {
      taskType,
      score: scoredWorkers[0].score.toFixed(2)
    })

    return selected
  }

  /**
   * 检查并清理空闲 Worker
   */
  private checkIdleWorkers(): void {
    const now = Date.now()
    const toTerminate: string[] = []

    for (const [id, worker] of this.workers) {
      if (!worker.busy &&
        this.workers.size > this.config.minWorkers &&
        now - worker.lastUsedAt > this.config.idleTimeout) {
        toTerminate.push(id)
      }
    }

    toTerminate.forEach(id => this.terminateWorker(id))
  }

  /**
   * 终止指定 Worker - 🚀 优化版：清理资源
   */
  private terminateWorker(workerId: string): void {
    const worker = this.workers.get(workerId)
    if (!worker) return

    // 清理当前任务的待处理项
    if (worker.currentTask) {
      const pendingTask = this.pendingTasks.get(worker.currentTask.id)
      if (pendingTask) {
        this.pendingTasks.delete(worker.currentTask.id)
        pendingTask.reject(new Error('Worker terminated'))
      }
    }

    // 清理事件监听器
    worker.worker.onmessage = null
    worker.worker.onerror = null

    worker.worker.terminate()
    this.workers.delete(workerId)

    // 🚀 更新资源跟踪
    this.resourceTracker.terminatedWorkers++

    this.logger?.debug(`Worker ${workerId} terminated`, {
      totalTerminated: this.resourceTracker.terminatedWorkers,
      activeWorkers: this.workers.size
    })
  }

  /**
   * 更新性能指标
   */
  private updateMetrics(): void {
    const times: number[] = []

    for (const worker of this.workers.values()) {
      if (worker.tasksCompleted > 0) {
        const avgTime = (Date.now() - worker.createdAt) / worker.tasksCompleted
        times.push(avgTime)
      }
    }

    if (times.length > 0) {
      this.metrics.averageTime = times.reduce((a, b) => a + b, 0) / times.length
    }

    this.logger?.debug('Worker pool metrics', this.metrics)
  }

  /**
   * 生成任务 ID
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取池状态
   */
  getStatus(): {
    workers: number
    busyWorkers: number
    queueSize: number
    metrics: typeof WorkerPool.prototype.metrics
  } {
    let busyWorkers = 0
    for (const worker of this.workers.values()) {
      if (worker.busy) busyWorkers++
    }

    return {
      workers: this.workers.size,
      busyWorkers,
      queueSize: this.taskQueue.length,
      metrics: { ...this.metrics }
    }
  }

  /**
   * 调整池大小
   */
  resize(minWorkers?: number, maxWorkers?: number): void {
    if (minWorkers !== undefined) {
      this.config.minWorkers = minWorkers
    }

    if (maxWorkers !== undefined) {
      this.config.maxWorkers = maxWorkers
    }

    // 确保最小数量的 workers
    while (this.workers.size < this.config.minWorkers) {
      this.createWorker()
    }

    // 如果超过最大数量，终止多余的空闲 workers
    if (this.workers.size > this.config.maxWorkers) {
      const toTerminate: string[] = []

      for (const [id, worker] of this.workers) {
        if (!worker.busy && this.workers.size - toTerminate.length > this.config.maxWorkers) {
          toTerminate.push(id)
        }
      }

      toTerminate.forEach(id => this.terminateWorker(id))
    }

    this.logger?.info('Worker pool resized', {
      minWorkers: this.config.minWorkers,
      maxWorkers: this.config.maxWorkers,
      currentWorkers: this.workers.size
    })
  }

  /**
   * 🚀 新增：收缩 Worker 池 - 响应内存压力
   * @param targetSize 目标 Worker 数量（默认为最小值）
   */
  shrink(targetSize?: number): number {
    const target = targetSize ?? this.config.minWorkers
    if (this.workers.size <= target) {
      return 0
    }

    let terminated = 0
    const toTerminate: string[] = []

    // 按使用情况排序，优先终止最少使用的
    const workerList = Array.from(this.workers.entries())
      .filter(([_, worker]) => !worker.busy)
      .sort(([_, a], [__, b]) => a.tasksCompleted - b.tasksCompleted)

    for (const [id] of workerList) {
      if (this.workers.size - terminated <= target) {
        break
      }
      toTerminate.push(id)
      terminated++
    }

    toTerminate.forEach(id => this.terminateWorker(id))

    this.logger?.info(`Worker pool shrunk`, {
      from: this.workers.size + terminated,
      to: this.workers.size,
      terminated
    })

    return terminated
  }

  /**
   * 🚀 新增：获取资源使用统计
   */
  getResourceStats(): typeof WorkerPool.prototype.resourceTracker {
    return { ...this.resourceTracker }
  }

  /**
   * 初始化统计数据
   */
  private initStats() {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageTime: 0,
      peakWorkers: 0,
      currentQueueSize: 0
    }
  }

  /**
   * 终止所有 Workers 和清理资源 - 🚀 优化版：彻底清理 Blob URLs
   */
  terminate(): void {
    this.isTerminated = true

    // 清理定时器
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval)
      this.idleCheckInterval = undefined
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = undefined
    }

    // 终止所有 workers
    for (const worker of this.workers.values()) {
      // 清理事件监听器
      worker.worker.onmessage = null
      worker.worker.onerror = null
      worker.worker.terminate()
    }

    this.workers.clear()

    // 拒绝所有待处理任务
    for (const task of this.pendingTasks.values()) {
      task.reject(new Error('Worker pool terminated'))
    }

    for (const task of this.taskQueue) {
      task.reject(new Error('Worker pool terminated'))
    }

    this.pendingTasks.clear()
    this.taskQueue.length = 0 // 更高效的清空数组

    // 🚀 彻底清理所有 Blob URLs
    for (const url of this.workerBlobUrls) {
      URL.revokeObjectURL(url)
    }
    this.workerBlobUrls.clear()
    this.resourceTracker.activeBlobUrls = 0

    // 清理所有统计数据
    this.metrics = this.initStats()

    this.logger?.info('Worker pool terminated', {
      totalCreated: this.resourceTracker.createdWorkers,
      totalTerminated: this.resourceTracker.terminatedWorkers,
      blobUrlsReleased: this.resourceTracker.activeBlobUrls
    })
  }

  /**
   * 别名方法 - 用于统一接口
   */
  destroy(): void {
    this.terminate()
  }
}

/**
 * 创建 Worker 池实例
 */
export function createWorkerPool<T = unknown, R = unknown>(
  config?: WorkerPoolConfig,
  logger?: Logger
): WorkerPool<T, R> {
  return new WorkerPool<T, R>(config, logger)
}

/**
 * 装饰器：在 Worker 中执行方法
 */
export function InWorker<T = unknown, R = unknown>(poolConfig?: WorkerPoolConfig) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const pool = createWorkerPool<T, R>(poolConfig)

    descriptor.value = async function (...args: any[]) {
      const task: WorkerTask<T> = {
        id: `${propertyName}-${Date.now()}`,
        type: 'function',
        data: {
          fn: originalMethod.toString(),
          args
        } as T
      }

      const result = await pool.execute(task)

      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error)
      }
    }

    return descriptor
  }
}