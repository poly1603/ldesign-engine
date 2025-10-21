/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:09 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
'use strict';

class WorkerPool {
  constructor(config = {}, logger) {
    this.logger = logger;
    this.workers = /* @__PURE__ */ new Map();
    this.taskQueue = [];
    this.pendingTasks = /* @__PURE__ */ new Map();
    this.isTerminated = false;
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageTime: 0,
      peakWorkers: 0,
      currentQueueSize: 0
    };
    this.config = {
      minWorkers: config.minWorkers || 2,
      maxWorkers: config.maxWorkers || navigator.hardwareConcurrency || 4,
      workerScript: config.workerScript || this.createDefaultWorker,
      taskTimeout: config.taskTimeout || 3e4,
      idleTimeout: config.idleTimeout || 6e4,
      maxRetries: config.maxRetries || 3,
      enableSharedArrayBuffer: config.enableSharedArrayBuffer || false,
      enablePreheating: config.enablePreheating ?? true,
      // 默认启用预热
      preheatTasks: config.preheatTasks || [],
      enableSmartScheduling: config.enableSmartScheduling ?? true,
      // 默认启用智能调度
      onError: config.onError || (() => {
      }),
      onSuccess: config.onSuccess || (() => {
      })
    };
    this.initialize();
    if (this.config.enablePreheating) {
      this.preheatWorkers();
    }
  }
  /**
   * 初始化 Worker 池
   */
  initialize() {
    for (let i = 0; i < this.config.minWorkers; i++) {
      this.createWorker();
    }
    this.idleCheckInterval = setInterval(() => {
      this.checkIdleWorkers();
    }, 1e4);
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 5e3);
    this.logger?.info("Worker pool initialized", {
      minWorkers: this.config.minWorkers,
      maxWorkers: this.config.maxWorkers
    });
  }
  /**
   * 预热Workers - 提前让Workers准备好执行任务
   */
  async preheatWorkers() {
    const preheatTasks = this.config.preheatTasks || [];
    if (preheatTasks.length === 0) {
      preheatTasks.push({
        id: "preheat-default",
        type: "compute",
        data: { iterations: 1e3 }
      });
    }
    this.logger?.debug("Preheating workers", { tasks: preheatTasks.length });
    const preheatPromises = Array.from(this.workers.values()).map(async (workerState) => {
      for (const task of preheatTasks) {
        try {
          workerState.worker.postMessage({
            ...task,
            id: `preheat-${workerState.id}-${task.id}`
          });
        } catch (error) {
          this.logger?.warn(`Failed to preheat worker ${workerState.id}`, error);
        }
      }
    });
    await Promise.allSettled(preheatPromises);
    this.logger?.debug("Worker preheating completed");
  }
  /**
   * 创建新的 Worker
   */
  createWorker() {
    if (this.workers.size >= this.config.maxWorkers) {
      return null;
    }
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let worker;
    if (typeof this.config.workerScript === "function") {
      worker = this.config.workerScript();
    } else if (typeof this.config.workerScript === "string" || this.config.workerScript instanceof URL) {
      worker = new Worker(this.config.workerScript);
    } else {
      worker = this.createDefaultWorker();
    }
    const state = {
      id: workerId,
      worker,
      busy: false,
      tasksCompleted: 0,
      errors: 0,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      averageTaskTime: 0,
      taskTypeStats: /* @__PURE__ */ new Map(),
      load: 0
    };
    worker.onmessage = (event) => {
      this.handleWorkerMessage(workerId, event.data);
    };
    worker.onerror = (error) => {
      this.handleWorkerError(workerId, error);
    };
    this.workers.set(workerId, state);
    if (this.workers.size > this.metrics.peakWorkers) {
      this.metrics.peakWorkers = this.workers.size;
    }
    this.logger?.debug(`Worker ${workerId} created`);
    return state;
  }
  /**
   * 创建默认 Worker 脚本
   */
  createDefaultWorker() {
    if (this.__workerBlobUrl) {
      URL.revokeObjectURL(this.__workerBlobUrl);
      delete this.__workerBlobUrl;
    }
    const workerScript = `
      self.onmessage = async function(e) {
        const { id, type, data } = e.data;
        
        try {
          let result;
          
          // \u6839\u636E\u4EFB\u52A1\u7C7B\u578B\u6267\u884C\u4E0D\u540C\u64CD\u4F5C
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
              // \u9ED8\u8BA4\u5904\u7406\uFF1A\u6267\u884C\u4F20\u5165\u7684\u51FD\u6570\u5B57\u7B26\u4E32
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
      
      // \u793A\u4F8B\u8BA1\u7B97\u51FD\u6570
      async function performComputation(data) {
        // \u6A21\u62DF\u8017\u65F6\u8BA1\u7B97
        let result = 0;
        for (let i = 0; i < data.iterations || 1000000; i++) {
          result += Math.sqrt(i);
        }
        return result;
      }
      
      async function transformData(data) {
        // \u6570\u636E\u8F6C\u6362\u903B\u8F91
        return JSON.parse(JSON.stringify(data));
      }
      
      async function analyzeData(data) {
        // \u6570\u636E\u5206\u6790\u903B\u8F91
        return {
          size: JSON.stringify(data).length,
          type: typeof data,
          timestamp: Date.now()
        };
      }
    `;
    const blob = new Blob([workerScript], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    this.__workerBlobUrl = url;
    return new Worker(url);
  }
  /**
   * 执行任务
   */
  async execute(task) {
    if (this.isTerminated) {
      throw new Error("Worker pool has been terminated");
    }
    this.metrics.totalTasks++;
    return new Promise((resolve, reject) => {
      const taskId = task.id || this.generateTaskId();
      const queuedTask = {
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
      };
      if (!this.tryExecuteTask(queuedTask)) {
        this.enqueueTask(queuedTask);
      }
    });
  }
  /**
   * 批量执行任务
   */
  async executeBatch(tasks) {
    return Promise.all(tasks.map((task) => this.execute(task)));
  }
  /**
   * 并行执行任务并合并结果
   */
  async parallel(data, mapper, reducer) {
    const tasks = data.map((item, index) => mapper(item, index));
    const results = await this.executeBatch(tasks);
    const successResults = results.filter((r) => r.success).map((r) => r.data);
    if (reducer) {
      return reducer(successResults);
    }
    return successResults;
  }
  /**
   * 尝试执行任务
   */
  tryExecuteTask(queuedTask) {
    let worker = this.findIdleWorker(queuedTask.task);
    if (!worker && this.workers.size < this.config.maxWorkers) {
      const newWorker = this.createWorker();
      if (newWorker) {
        worker = newWorker;
      }
    }
    if (!worker) {
      return false;
    }
    worker.busy = true;
    worker.currentTask = queuedTask.task;
    worker.lastUsedAt = Date.now();
    queuedTask.attempts++;
    const timeoutId = setTimeout(() => {
      this.handleTaskTimeout(worker.id, queuedTask);
    }, queuedTask.task.timeout);
    this.pendingTasks.set(queuedTask.task.id, {
      ...queuedTask,
      resolve: (result) => {
        clearTimeout(timeoutId);
        queuedTask.resolve(result);
      },
      reject: (error) => {
        clearTimeout(timeoutId);
        queuedTask.reject(error);
      }
    });
    try {
      if (queuedTask.task.transferable) {
        worker.worker.postMessage(queuedTask.task, queuedTask.task.transferable);
      } else {
        worker.worker.postMessage(queuedTask.task);
      }
      this.logger?.debug(`Task ${queuedTask.task.id} assigned to worker ${worker.id}`);
      return true;
    } catch (error) {
      this.handleWorkerError(worker.id, error);
      return false;
    }
  }
  /**
   * 将任务加入队列
   */
  enqueueTask(task) {
    const insertIndex = this.taskQueue.findIndex((t) => (t.task.priority || 0) < (task.task.priority || 0));
    if (insertIndex === -1) {
      this.taskQueue.push(task);
    } else {
      this.taskQueue.splice(insertIndex, 0, task);
    }
    this.metrics.currentQueueSize = this.taskQueue.length;
    this.logger?.debug(`Task ${task.task.id} queued`, {
      queueSize: this.taskQueue.length,
      priority: task.task.priority
    });
  }
  /**
   * 处理 Worker 消息
   */
  handleWorkerMessage(workerId, message) {
    const worker = this.workers.get(workerId);
    if (!worker)
      return;
    const task = this.pendingTasks.get(message.id);
    if (!task)
      return;
    this.pendingTasks.delete(message.id);
    worker.busy = false;
    worker.currentTask = void 0;
    worker.tasksCompleted++;
    const duration = Date.now() - task.addedAt;
    const result = {
      id: message.id,
      success: message.success,
      data: message.data,
      error: message.error,
      duration
    };
    if (message.success && this.config.enableSmartScheduling) {
      const totalTime = worker.averageTaskTime * (worker.tasksCompleted - 1) + duration;
      worker.averageTaskTime = totalTime / worker.tasksCompleted;
      const taskType = task.task.type;
      const typeStats = worker.taskTypeStats.get(taskType) || { count: 0, totalTime: 0 };
      typeStats.count++;
      typeStats.totalTime += duration;
      worker.taskTypeStats.set(taskType, typeStats);
      worker.load = Math.min(duration / 1e3 / 10, 1);
    }
    if (message.success) {
      this.metrics.completedTasks++;
      this.config.onSuccess(result);
      task.resolve(result);
      this.logger?.debug(`Task ${message.id} completed`, { duration });
    } else {
      if (task.attempts < (task.task.retries || 0)) {
        this.logger?.debug(`Retrying task ${message.id}`, {
          attempt: task.attempts,
          maxRetries: task.task.retries
        });
        if (!this.tryExecuteTask(task)) {
          this.enqueueTask(task);
        }
      } else {
        this.metrics.failedTasks++;
        const error = new Error(message.error || "Task failed");
        this.config.onError(error, task.task);
        task.reject(error);
        this.logger?.error(`Task ${message.id} failed`, { error: message.error });
      }
    }
    this.processQueue();
  }
  /**
   * 处理 Worker 错误
   */
  handleWorkerError(workerId, error) {
    const worker = this.workers.get(workerId);
    if (!worker)
      return;
    worker.errors++;
    this.logger?.error(`Worker ${workerId} error`, error);
    if (worker.errors > 3) {
      this.terminateWorker(workerId);
      this.createWorker();
    }
    if (worker.currentTask) {
      const task = this.pendingTasks.get(worker.currentTask.id);
      if (task) {
        this.pendingTasks.delete(worker.currentTask.id);
        if (!this.tryExecuteTask(task)) {
          this.enqueueTask(task);
        }
      }
    }
  }
  /**
   * 处理任务超时
   */
  handleTaskTimeout(workerId, task) {
    this.logger?.warn(`Task ${task.task.id} timeout on worker ${workerId}`);
    this.pendingTasks.delete(task.task.id);
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.busy = false;
      worker.currentTask = void 0;
      worker.errors++;
      if (worker.errors > 3) {
        this.terminateWorker(workerId);
        this.createWorker();
      }
    }
    if (task.attempts < (task.task.retries || 0)) {
      if (!this.tryExecuteTask(task)) {
        this.enqueueTask(task);
      }
    } else {
      task.reject(new Error("Task timeout"));
    }
  }
  /**
   * 处理队列中的任务
   */
  processQueue() {
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue[0];
      if (this.tryExecuteTask(task)) {
        this.taskQueue.shift();
        this.metrics.currentQueueSize = this.taskQueue.length;
      } else {
        break;
      }
    }
  }
  /**
   * 查找空闲的 Worker（智能调度版本）
   * 根据任务类型和worker性能选择最合适的worker
   */
  findIdleWorker(task) {
    const idleWorkers = Array.from(this.workers.values()).filter((w) => !w.busy);
    if (idleWorkers.length === 0) {
      return void 0;
    }
    if (!this.config.enableSmartScheduling || !task) {
      return idleWorkers[0];
    }
    const taskType = task.type;
    const scoredWorkers = idleWorkers.map((worker) => {
      let score = 0;
      const taskStats = worker.taskTypeStats.get(taskType);
      if (taskStats && taskStats.count > 0) {
        const avgTime = taskStats.totalTime / taskStats.count;
        score += 100 - Math.min(avgTime / 10, 100);
      } else {
        score += 30;
      }
      if (worker.tasksCompleted > 0 && worker.averageTaskTime > 0) {
        score += 100 - Math.min(worker.averageTaskTime / 10, 100);
      } else {
        score += 50;
      }
      score += (1 - worker.load) * 50;
      if (worker.tasksCompleted > 0) {
        const errorRate = worker.errors / worker.tasksCompleted;
        score -= errorRate * 100;
      }
      return { worker, score };
    });
    scoredWorkers.sort((a, b) => b.score - a.score);
    const selected = scoredWorkers[0].worker;
    this.logger?.debug(`Smart scheduling selected worker ${selected.id}`, {
      taskType,
      score: scoredWorkers[0].score.toFixed(2)
    });
    return selected;
  }
  /**
   * 检查并清理空闲 Worker
   */
  checkIdleWorkers() {
    const now = Date.now();
    const toTerminate = [];
    for (const [id, worker] of this.workers) {
      if (!worker.busy && this.workers.size > this.config.minWorkers && now - worker.lastUsedAt > this.config.idleTimeout) {
        toTerminate.push(id);
      }
    }
    toTerminate.forEach((id) => this.terminateWorker(id));
  }
  /**
   * 终止指定 Worker
   */
  terminateWorker(workerId) {
    const worker = this.workers.get(workerId);
    if (!worker)
      return;
    if (worker.currentTask) {
      const pendingTask = this.pendingTasks.get(worker.currentTask.id);
      if (pendingTask) {
        this.pendingTasks.delete(worker.currentTask.id);
        pendingTask.reject(new Error("Worker terminated"));
      }
    }
    worker.worker.onmessage = null;
    worker.worker.onerror = null;
    worker.worker.terminate();
    this.workers.delete(workerId);
    this.logger?.debug(`Worker ${workerId} terminated`);
  }
  /**
   * 更新性能指标
   */
  updateMetrics() {
    const times = [];
    for (const worker of this.workers.values()) {
      if (worker.tasksCompleted > 0) {
        const avgTime = (Date.now() - worker.createdAt) / worker.tasksCompleted;
        times.push(avgTime);
      }
    }
    if (times.length > 0) {
      this.metrics.averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    }
    this.logger?.debug("Worker pool metrics", this.metrics);
  }
  /**
   * 生成任务 ID
   */
  generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * 获取池状态
   */
  getStatus() {
    let busyWorkers = 0;
    for (const worker of this.workers.values()) {
      if (worker.busy)
        busyWorkers++;
    }
    return {
      workers: this.workers.size,
      busyWorkers,
      queueSize: this.taskQueue.length,
      metrics: { ...this.metrics }
    };
  }
  /**
   * 调整池大小
   */
  resize(minWorkers, maxWorkers) {
    if (minWorkers !== void 0) {
      this.config.minWorkers = minWorkers;
    }
    if (maxWorkers !== void 0) {
      this.config.maxWorkers = maxWorkers;
    }
    while (this.workers.size < this.config.minWorkers) {
      this.createWorker();
    }
    if (this.workers.size > this.config.maxWorkers) {
      const toTerminate = [];
      for (const [id, worker] of this.workers) {
        if (!worker.busy && this.workers.size - toTerminate.length > this.config.maxWorkers) {
          toTerminate.push(id);
        }
      }
      toTerminate.forEach((id) => this.terminateWorker(id));
    }
    this.logger?.info("Worker pool resized", {
      minWorkers: this.config.minWorkers,
      maxWorkers: this.config.maxWorkers,
      currentWorkers: this.workers.size
    });
  }
  /**
   * 初始化统计数据
   */
  initStats() {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageTime: 0,
      peakWorkers: 0,
      currentQueueSize: 0
    };
  }
  /**
   * 终止所有 Workers 和清理资源
   */
  terminate() {
    this.isTerminated = true;
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = void 0;
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = void 0;
    }
    for (const worker of this.workers.values()) {
      worker.worker.onmessage = null;
      worker.worker.onerror = null;
      worker.worker.terminate();
    }
    this.workers.clear();
    for (const task of this.pendingTasks.values()) {
      task.reject(new Error("Worker pool terminated"));
    }
    for (const task of this.taskQueue) {
      task.reject(new Error("Worker pool terminated"));
    }
    this.pendingTasks.clear();
    this.taskQueue.length = 0;
    if (this.__workerBlobUrl) {
      URL.revokeObjectURL(this.__workerBlobUrl);
      delete this.__workerBlobUrl;
    }
    this.metrics = this.initStats();
    this.logger?.info("Worker pool terminated");
  }
  /**
   * 别名方法 - 用于统一接口
   */
  destroy() {
    this.terminate();
  }
}
function createWorkerPool(config, logger) {
  return new WorkerPool(config, logger);
}
function InWorker(poolConfig) {
  return function(target, propertyName, descriptor) {
    const originalMethod = descriptor.value;
    const pool = createWorkerPool(poolConfig);
    descriptor.value = async function(...args) {
      const task = {
        id: `${propertyName}-${Date.now()}`,
        type: "function",
        data: {
          fn: originalMethod.toString(),
          args
        }
      };
      const result = await pool.execute(task);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    };
    return descriptor;
  };
}

exports.InWorker = InWorker;
exports.WorkerPool = WorkerPool;
exports.createWorkerPool = createWorkerPool;
//# sourceMappingURL=worker-pool.cjs.map
