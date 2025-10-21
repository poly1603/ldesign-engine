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

class MiddlewareManagerImpl {
  constructor(logger) {
    this.middleware = [];
    this.MAX_MIDDLEWARE = 50;
    this.middlewareMap = /* @__PURE__ */ new Map();
    this.needsSort = false;
    this.logger = logger;
  }
  use(middleware) {
    const existing = this.middlewareMap.get(middleware.name);
    if (existing) {
      const index = this.middleware.indexOf(existing);
      if (index > -1) {
        this.middleware[index] = middleware;
        this.middlewareMap.set(middleware.name, middleware);
      }
    } else {
      if (this.middleware.length >= this.MAX_MIDDLEWARE) {
        this.logger?.warn(`Maximum middleware limit (${this.MAX_MIDDLEWARE}) reached, removing lowest priority`);
        let lowestPriority = -Infinity;
        let lowestMiddleware = null;
        for (const m of this.middleware) {
          const priority = m.priority ?? 100;
          if (priority > lowestPriority) {
            lowestPriority = priority;
            lowestMiddleware = m;
          }
        }
        if (lowestMiddleware) {
          this.remove(lowestMiddleware.name);
        }
      }
      this.middleware.push(middleware);
      this.middlewareMap.set(middleware.name, middleware);
    }
    this.needsSort = true;
  }
  remove(name) {
    const middleware = this.middlewareMap.get(name);
    if (middleware) {
      const index = this.middleware.indexOf(middleware);
      if (index > -1) {
        this.middleware.splice(index, 1);
      }
      this.middlewareMap.delete(name);
    }
  }
  /**
   * 确保中间件已排序 - 懒排序优化
   */
  ensureSorted() {
    if (this.needsSort) {
      this.middleware.sort((a, b) => {
        const priorityA = a.priority ?? 100;
        const priorityB = b.priority ?? 100;
        return priorityA - priorityB;
      });
      this.needsSort = false;
    }
  }
  async execute(contextOrName, context) {
    if (typeof contextOrName === "string") {
      const name = contextOrName;
      if (!context) {
        throw new Error("Context is required when executing middleware by name");
      }
      const ctx = context;
      const middleware = this.middlewareMap.get(name);
      if (!middleware) {
        throw new Error(`Middleware "${name}" not found`);
      }
      const result = { processed: false };
      const next = async () => {
        result.processed = true;
      };
      await middleware.handler(ctx, next);
      return result;
    } else {
      this.ensureSorted();
      const ctx = contextOrName;
      let index = 0;
      const middlewareList = this.middleware;
      const next = async () => {
        if (index >= middlewareList.length) {
          return;
        }
        const middleware = middlewareList[index++];
        try {
          await middleware.handler(ctx, next);
        } catch (error) {
          ctx.error = error;
          throw error;
        }
      };
      await next();
    }
  }
  // 获取所有中间件
  getAll() {
    return [...this.middleware];
  }
  // 获取指定名称的中间件 - 使用 Map 优化
  get(name) {
    return this.middlewareMap.get(name);
  }
  // 检查中间件是否存在 - 使用 Map 优化
  has(name) {
    return this.middlewareMap.has(name);
  }
  // 清空所有中间件
  clear() {
    this.middleware.length = 0;
    this.middlewareMap.clear();
    this.needsSort = false;
  }
  // 获取中间件数量
  size() {
    return this.middleware.length;
  }
  // 获取中间件执行顺序
  getExecutionOrder() {
    return this.middleware.map((m) => m.name);
  }
  // 销毁方法
  destroy() {
    this.clear();
    this.logger = void 0;
  }
  // 获取性能统计
  getStats() {
    const stats = {};
    for (const middleware of this.middleware) {
      const priority = middleware.priority ?? 100;
      stats[priority] = (stats[priority] || 0) + 1;
    }
    return {
      total: this.middleware.length,
      byPriority: stats
    };
  }
}
function createMiddlewareManager(logger) {
  return new MiddlewareManagerImpl(logger);
}
function createRequestMiddleware(name, handler, priority = 50) {
  return {
    name,
    handler,
    priority
  };
}
function createResponseMiddleware(name, handler, priority = 50) {
  return {
    name,
    handler,
    priority
  };
}
function createErrorMiddleware(name, handler, priority = 90) {
  return {
    name,
    handler,
    priority
  };
}
const commonMiddleware = {
  // 日志中间件
  logger: (logger) => createRequestMiddleware("logger", async (context, next) => {
    const start = Date.now();
    logger.info("Middleware execution started", { context });
    await next();
    const duration = Date.now() - start;
    logger.info("Middleware execution completed", { duration, context });
  }, 10),
  // 错误处理中间件
  errorHandler: (errorManager) => createErrorMiddleware("errorHandler", async (context, next) => {
    try {
      await next();
    } catch (error) {
      errorManager.captureError(error);
      context.error = error;
    }
  }, 100),
  // 性能监控中间件
  performance: (logger) => createRequestMiddleware("performance", async (context, next) => {
    const start = performance.now();
    await next();
    const duration = performance.now() - start;
    if (duration > 100) {
      logger.warn("Slow middleware execution detected", {
        duration,
        context
      });
    }
  }, 20),
  // 安全中间件
  security: (logger) => createRequestMiddleware("security", async (context, next) => {
    logger.debug("Security middleware executed", { context });
    await next();
  }, 30)
};

exports.MiddlewareManagerImpl = MiddlewareManagerImpl;
exports.commonMiddleware = commonMiddleware;
exports.createErrorMiddleware = createErrorMiddleware;
exports.createMiddlewareManager = createMiddlewareManager;
exports.createRequestMiddleware = createRequestMiddleware;
exports.createResponseMiddleware = createResponseMiddleware;
//# sourceMappingURL=middleware-manager.cjs.map
