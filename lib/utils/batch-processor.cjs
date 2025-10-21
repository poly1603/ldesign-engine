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

class BatchProcessor {
  /**
   * 批量处理数组 - 优化内存使用
   */
  static async processInBatches(items, processor, options = {}) {
    const {
      batchSize = Math.min(100, Math.max(10, Math.floor(items.length / 10))),
      // 动态调整批次大小
      delay = 0,
      onProgress
    } = options;
    const results = [];
    const totalBatches = Math.ceil(items.length / batchSize);
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, items.length);
      const batch = items.slice(start, end);
      try {
        const batchResults = await processor(batch);
        results.push(...batchResults);
        if (onProgress) {
          onProgress(end, items.length);
        }
        if (delay > 0 && i < totalBatches - 1) {
          await this.sleep(delay);
        }
      } catch (error) {
        throw new Error(`Batch processing failed at batch ${i + 1}: ${error}`);
      }
    }
    return results;
  }
  /**
   * 并发处理数组
   */
  static async processConcurrently(items, processor, options = {}) {
    const { concurrency = 5, onProgress, onError } = options;
    const results = Array.from({ length: items.length });
    let completed = 0;
    let currentIndex = 0;
    const workers = [];
    const worker = async () => {
      while (currentIndex < items.length) {
        const index = currentIndex++;
        const item = items[index];
        try {
          results[index] = await processor(item, index);
        } catch (error) {
          if (onError) {
            onError(error, item, index);
          } else {
            throw error;
          }
        }
        completed++;
        if (onProgress) {
          onProgress(completed, items.length);
        }
      }
    };
    for (let i = 0; i < Math.min(concurrency, items.length); i++) {
      workers.push(worker());
    }
    await Promise.all(workers);
    return results;
  }
  /**
   * 分块处理大数组
   */
  static async *chunk(items, chunkSize) {
    for (let i = 0; i < items.length; i += chunkSize) {
      yield items.slice(i, i + chunkSize);
    }
  }
  /**
   * 延迟执行
   */
  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
class TaskQueue {
  constructor(options = {}) {
    this.queue = [];
    this.running = 0;
    this.paused = false;
    this.options = {
      concurrency: options.concurrency ?? 3,
      timeout: options.timeout ?? 3e4,
      retries: options.retries ?? 3,
      retryDelay: options.retryDelay ?? 1e3
    };
  }
  /**
   * 添加任务到队列
   */
  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task,
        resolve,
        reject
      });
      if (!this.paused) {
        this.processNext();
      }
    });
  }
  /**
   * 批量添加任务
   */
  addAll(tasks) {
    const promises = tasks.map((task) => this.add(task));
    return Promise.all(promises);
  }
  /**
   * 暂停队列
   */
  pause() {
    this.paused = true;
  }
  /**
   * 恢复队列
   */
  resume() {
    this.paused = false;
    this.processNext();
  }
  /**
   * 清空队列
   */
  clear() {
    this.queue = [];
  }
  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      pending: this.queue.length,
      running: this.running,
      paused: this.paused
    };
  }
  async processNext() {
    if (this.paused || this.running >= this.options.concurrency || this.queue.length === 0) {
      return;
    }
    const item = this.queue.shift();
    if (!item)
      return;
    this.running++;
    try {
      const result = await this.executeWithRetry(item.task);
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.running--;
      this.processNext();
    }
  }
  async executeWithRetry(task) {
    let lastError;
    for (let i = 0; i < this.options.retries; i++) {
      try {
        return await this.executeWithTimeout(task);
      } catch (error) {
        lastError = error;
        if (i < this.options.retries - 1) {
          await this.sleep(this.options.retryDelay);
        }
      }
    }
    throw lastError || new Error("Task failed");
  }
  executeWithTimeout(task) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Task timeout")), this.options.timeout);
      task().then((result) => {
        clearTimeout(timer);
        resolve(result);
      }).catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
class RateLimiter {
  constructor(maxTokens, refillRate) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.queue = [];
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.startRefillTimer();
  }
  /**
   * 获取令牌
   */
  async acquire(count = 1) {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.tokens -= count;
        resolve();
      });
    });
  }
  /**
   * 尝试获取令牌（非阻塞）
   */
  tryAcquire(count = 1) {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1e3;
    const tokensToAdd = Math.floor(elapsed * this.refillRate);
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
      this.processQueue();
    }
  }
  processQueue() {
    while (this.queue.length > 0 && this.tokens > 0) {
      const task = this.queue.shift();
      if (task)
        task();
    }
  }
  startRefillTimer() {
    setInterval(() => {
      this.refill();
    }, 1e3 / this.refillRate);
  }
}
class StreamProcessor {
  constructor(processor, options = {}) {
    this.processor = processor;
    this.options = options;
    this.buffer = [];
    this.processing = false;
    const { flushInterval = 1e3 } = options;
    setInterval(() => {
      this.flush();
    }, flushInterval);
  }
  /**
   * 添加数据到流
   */
  async add(item) {
    this.buffer.push(item);
    const bufferSize = this.options.bufferSize ?? 100;
    if (this.buffer.length >= bufferSize) {
      await this.flush();
    }
  }
  /**
   * 批量添加数据
   */
  async addBatch(items) {
    this.buffer.push(...items);
    const bufferSize = this.options.bufferSize ?? 100;
    if (this.buffer.length >= bufferSize) {
      await this.flush();
    }
  }
  /**
   * 刷新缓冲区
   */
  async flush() {
    if (this.processing || this.buffer.length === 0) {
      return;
    }
    this.processing = true;
    const items = this.buffer.splice(0, this.buffer.length);
    try {
      const results = await this.processor(items);
      if (this.options.onFlush) {
        this.options.onFlush(results);
      }
    } finally {
      this.processing = false;
    }
  }
  /**
   * 获取缓冲区状态
   */
  getStatus() {
    return {
      bufferSize: this.buffer.length,
      processing: this.processing
    };
  }
}
function Concurrent(limit = 1) {
  const queue = new TaskQueue({ concurrency: limit });
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function(...args) {
      return queue.add(() => originalMethod.apply(this, args));
    };
    return descriptor;
  };
}
function RateLimit(maxCalls, perSeconds) {
  const limiter = new RateLimiter(maxCalls, maxCalls / perSeconds);
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function(...args) {
      await limiter.acquire();
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}

exports.BatchProcessor = BatchProcessor;
exports.Concurrent = Concurrent;
exports.RateLimit = RateLimit;
exports.RateLimiter = RateLimiter;
exports.StreamProcessor = StreamProcessor;
exports.TaskQueue = TaskQueue;
//# sourceMappingURL=batch-processor.cjs.map
