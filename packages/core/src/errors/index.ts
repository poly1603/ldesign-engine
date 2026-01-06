/**
 * LDesign 统一错误处理系统
 * 提供统一的错误码、错误类型和错误处理机制
 */

/**
 * 错误码定义
 * 1xxx - Engine 引擎相关
 * 2xxx - Router 路由相关
 * 3xxx - I18n 国际化相关
 * 4xxx - Color 颜色相关
 * 5xxx - Size 尺寸相关
 * 6xxx - HTTP 网络相关
 */
export enum ErrorCode {
  // Engine 引擎错误 (1xxx)
  ENGINE_INIT_FAILED = 1001,
  ENGINE_PLUGIN_LOAD_FAILED = 1002,
  ENGINE_PLUGIN_NOT_FOUND = 1003,
  ENGINE_PLUGIN_ALREADY_LOADED = 1004,
  ENGINE_LIFECYCLE_ERROR = 1005,
  ENGINE_EVENT_ERROR = 1006,
  ENGINE_MIDDLEWARE_ERROR = 1007,
  ENGINE_RESOURCE_LEAK = 1008,
  ENGINE_INVALID_CONFIG = 1009,

  // Router 路由错误 (2xxx)
  ROUTER_INIT_FAILED = 2001,
  ROUTER_INVALID_PATH = 2002,
  ROUTER_NOT_FOUND = 2003,
  ROUTER_NAVIGATION_CANCELLED = 2004,
  ROUTER_NAVIGATION_DUPLICATED = 2005,
  ROUTER_GUARD_REJECTED = 2006,
  ROUTER_GUARD_TIMEOUT = 2007,
  ROUTER_INVALID_ROUTE = 2008,
  ROUTER_CIRCULAR_REDIRECT = 2009,

  // I18n 国际化错误 (3xxx)
  I18N_INIT_FAILED = 3001,
  I18N_LOCALE_NOT_FOUND = 3002,
  I18N_MESSAGE_NOT_FOUND = 3003,
  I18N_INVALID_LOCALE = 3004,
  I18N_LOAD_FAILED = 3005,
  I18N_INVALID_PLURAL_RULE = 3006,
  I18N_INTERPOLATION_ERROR = 3007,

  // Color 颜色错误 (4xxx)
  COLOR_INVALID_FORMAT = 4001,
  COLOR_CONVERSION_ERROR = 4002,
  COLOR_OUT_OF_RANGE = 4003,
  COLOR_PARSE_ERROR = 4004,

  // Size 尺寸错误 (5xxx)
  SIZE_INVALID_VALUE = 5001,
  SIZE_INVALID_UNIT = 5002,
  SIZE_CONVERSION_ERROR = 5003,
  SIZE_BREAKPOINT_ERROR = 5004,

  // HTTP 网络错误 (6xxx)
  HTTP_REQUEST_FAILED = 6001,
  HTTP_TIMEOUT = 6002,
  HTTP_NETWORK_ERROR = 6003,
  HTTP_INVALID_URL = 6004,
  HTTP_INVALID_METHOD = 6005,
  HTTP_RESPONSE_ERROR = 6006,
  HTTP_ABORT = 6007,
  HTTP_INTERCEPTOR_ERROR = 6008,

  // 通用错误 (9xxx)
  UNKNOWN_ERROR = 9999
}

/**
 * 错误严重级别
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 错误上下文
 */
export interface ErrorContext {
  /** 错误发生的模块 */
  module?: string;
  /** 错误发生的操作 */
  operation?: string;
  /** 相关数据 */
  data?: unknown;
  /** 堆栈信息 */
  stack?: string;
  /** 时间戳 */
  timestamp?: number;
  /** 用户信息 */
  user?: unknown;
  /** 环境信息 */
  env?: unknown;
}

/**
 * LDesign 基础错误类
 */
export class LDesignError extends Error {
  /** 错误码 */
  public readonly code: ErrorCode;
  /** 严重级别 */
  public readonly severity: ErrorSeverity;
  /** 错误上下文 */
  public readonly context: ErrorContext;
  /** 原始错误 */
  public readonly originalError?: Error;
  /** 是否可恢复 */
  public readonly recoverable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options: {
      severity?: ErrorSeverity;
      context?: ErrorContext;
      originalError?: Error;
      recoverable?: boolean;
    } = {}
  ) {
    super(message);

    this.name = 'LDesignError';
    this.code = code;
    this.severity = options.severity || this.inferSeverity(code);
    this.context = {
      ...options.context,
      timestamp: Date.now(),
      stack: this.stack
    };
    this.originalError = options.originalError;
    this.recoverable = options.recoverable ?? true;

    // 保持原型链
    Object.setPrototypeOf(this, LDesignError.prototype);
  }

  /**
   * 推断错误严重级别
   */
  private inferSeverity(code: ErrorCode): ErrorSeverity {
    const codeNum = Number(code);

    // 1xxx - Engine 错误通常是高优先级
    if (codeNum >= 1000 && codeNum < 2000) {
      return codeNum === ErrorCode.ENGINE_RESOURCE_LEAK
        ? ErrorSeverity.CRITICAL
        : ErrorSeverity.HIGH;
    }

    // 2xxx - Router 错误通常是中等优先级
    if (codeNum >= 2000 && codeNum < 3000) {
      return codeNum === ErrorCode.ROUTER_NOT_FOUND
        ? ErrorSeverity.LOW
        : ErrorSeverity.MEDIUM;
    }

    // 3xxx - I18n 错误通常是低优先级
    if (codeNum >= 3000 && codeNum < 4000) {
      return ErrorSeverity.LOW;
    }

    // 4xxx, 5xxx - Color/Size 错误通常是低优先级
    if (codeNum >= 4000 && codeNum < 6000) {
      return ErrorSeverity.LOW;
    }

    // 6xxx - HTTP 错误根据类型判断
    if (codeNum >= 6000 && codeNum < 7000) {
      return codeNum === ErrorCode.HTTP_NETWORK_ERROR
        ? ErrorSeverity.HIGH
        : ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.MEDIUM;
  }

  /**
   * 转换为 JSON
   */
  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      context: this.context,
      recoverable: this.recoverable,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    };
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return `[${this.severity.toUpperCase()}] ${this.name} (${this.code}): ${this.message}`;
  }
}

/**
 * Engine 错误
 */
export class EngineError extends LDesignError {
  constructor(
    code: ErrorCode,
    message: string,
    options: Omit<ConstructorParameters<typeof LDesignError>[2], 'context'> & {
      context?: Omit<ErrorContext, 'module'>;
    } = {}
  ) {
    super(code, message, {
      ...options,
      context: {
        ...options.context,
        module: 'engine'
      }
    });
    this.name = 'EngineError';
    Object.setPrototypeOf(this, EngineError.prototype);
  }
}

/**
 * Router 错误
 */
export class RouterError extends LDesignError {
  constructor(
    code: ErrorCode,
    message: string,
    options: Omit<ConstructorParameters<typeof LDesignError>[2], 'context'> & {
      context?: Omit<ErrorContext, 'module'>;
    } = {}
  ) {
    super(code, message, {
      ...options,
      context: {
        ...options.context,
        module: 'router'
      }
    });
    this.name = 'RouterError';
    Object.setPrototypeOf(this, RouterError.prototype);
  }
}

/**
 * I18n 错误
 */
export class I18nError extends LDesignError {
  constructor(
    code: ErrorCode,
    message: string,
    options: Omit<ConstructorParameters<typeof LDesignError>[2], 'context'> & {
      context?: Omit<ErrorContext, 'module'>;
    } = {}
  ) {
    super(code, message, {
      ...options,
      context: {
        ...options.context,
        module: 'i18n'
      }
    });
    this.name = 'I18nError';
    Object.setPrototypeOf(this, I18nError.prototype);
  }
}

/**
 * Color 错误
 */
export class ColorError extends LDesignError {
  constructor(
    code: ErrorCode,
    message: string,
    options: Omit<ConstructorParameters<typeof LDesignError>[2], 'context'> & {
      context?: Omit<ErrorContext, 'module'>;
    } = {}
  ) {
    super(code, message, {
      ...options,
      context: {
        ...options.context,
        module: 'color'
      }
    });
    this.name = 'ColorError';
    Object.setPrototypeOf(this, ColorError.prototype);
  }
}

/**
 * Size 错误
 */
export class SizeError extends LDesignError {
  constructor(
    code: ErrorCode,
    message: string,
    options: Omit<ConstructorParameters<typeof LDesignError>[2], 'context'> & {
      context?: Omit<ErrorContext, 'module'>;
    } = {}
  ) {
    super(code, message, {
      ...options,
      context: {
        ...options.context,
        module: 'size'
      }
    });
    this.name = 'SizeError';
    Object.setPrototypeOf(this, SizeError.prototype);
  }
}

/**
 * HTTP 错误
 */
export class HttpError extends LDesignError {
  /** HTTP 状态码 */
  public readonly statusCode?: number;
  /** 响应数据 */
  public readonly response?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    options: Omit<ConstructorParameters<typeof LDesignError>[2], 'context'> & {
      context?: Omit<ErrorContext, 'module'>;
      statusCode?: number;
      response?: unknown;
    } = {}
  ) {
    super(code, message, {
      ...options,
      context: {
        ...options.context,
        module: 'http'
      }
    });
    this.name = 'HttpError';
    this.statusCode = options.statusCode;
    this.response = options.response;
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      response: this.response
    };
  }
}

/**
 * 错误处理器接口
 */
export interface ErrorHandler {
  (error: LDesignError): void | Promise<void>;
}

/**
 * 全局错误管理器
 */
export class ErrorManager {
  private static instance: ErrorManager;
  private handlers: Map<ErrorSeverity, Set<ErrorHandler>> = new Map();
  private globalHandlers: Set<ErrorHandler> = new Set();
  private errorLog: LDesignError[] = [];
  private maxLogSize = 100;

  private constructor() {
    // 初始化各级别处理器集合
    Object.values(ErrorSeverity).forEach(severity => {
      this.handlers.set(severity as ErrorSeverity, new Set());
    });
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  /**
   * 注册错误处理器
   */
  register(handler: ErrorHandler, severity?: ErrorSeverity): void {
    if (severity) {
      this.handlers.get(severity)?.add(handler);
    } else {
      this.globalHandlers.add(handler);
    }
  }

  /**
   * 移除错误处理器
   */
  unregister(handler: ErrorHandler, severity?: ErrorSeverity): void {
    if (severity) {
      this.handlers.get(severity)?.delete(handler);
    } else {
      this.globalHandlers.delete(handler);
    }
  }

  /**
   * 处理错误
   */
  async handle(error: LDesignError): Promise<void> {
    // 记录错误
    this.logError(error);

    // 执行全局处理器
    for (const handler of this.globalHandlers) {
      try {
        await handler(error);
      } catch (e) {
        console.error('Error in global error handler:', e);
      }
    }

    // 执行对应严重级别的处理器
    const severityHandlers = this.handlers.get(error.severity);
    if (severityHandlers) {
      for (const handler of severityHandlers) {
        try {
          await handler(error);
        } catch (e) {
          console.error(`Error in ${error.severity} error handler:`, e);
        }
      }
    }
  }

  /**
   * 记录错误
   */
  private logError(error: LDesignError): void {
    this.errorLog.push(error);

    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }

  /**
   * 获取错误日志
   */
  getErrorLog(): LDesignError[] {
    return [...this.errorLog];
  }

  /**
   * 清空错误日志
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * 设置最大日志大小
   */
  setMaxLogSize(size: number): void {
    this.maxLogSize = size;

    // 如果当前日志超过新的限制，裁剪
    while (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
  }

  /**
   * 获取错误统计
   */
  getStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byModule: Record<string, number>;
    byCode: Record<ErrorCode, number>;
  } {
    const stats = {
      total: this.errorLog.length,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byModule: {} as Record<string, number>,
      byCode: {} as Record<ErrorCode, number>
    };

    // 初始化计数
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity as ErrorSeverity] = 0;
    });

    // 统计
    for (const error of this.errorLog) {
      stats.bySeverity[error.severity]++;

      const module = error.context.module || 'unknown';
      stats.byModule[module] = (stats.byModule[module] || 0) + 1;

      stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
    }

    return stats;
  }
}

/**
 * 便捷函数：抛出 Engine 错误
 */
export function throwEngineError(
  code: ErrorCode,
  message: string,
  options?: Omit<ConstructorParameters<typeof LDesignError>[2], 'context'> & {
    context?: Omit<ErrorContext, 'module'>;
  }
): never {
  throw new EngineError(code, message, options);
}

/**
 * 便捷函数：抛出 Router 错误
 */
export function throwRouterError(
  code: ErrorCode,
  message: string,
  options?: Omit<ConstructorParameters<typeof LDesignError>[2], 'context'> & {
    context?: Omit<ErrorContext, 'module'>;
  }
): never {
  throw new RouterError(code, message, options);
}

/**
 * 便捷函数：抛出 I18n 错误
 */
export function throwI18nError(
  code: ErrorCode,
  message: string,
  options?: Omit<ConstructorParameters<typeof LDesignError>[2], 'context'> & {
    context?: Omit<ErrorContext, 'module'>;
  }
): never {
  throw new I18nError(code, message, options);
}

/**
 * 获取全局错误管理器
 */
export function getErrorManager(): ErrorManager {
  return ErrorManager.getInstance();
}

// Re-export from engine-error
export * from './engine-error'

// Export recovery module
export {
  recoverableOperation,
  PluginRecoveryManager,
  safeInstallPlugin,
  batchOperationWithRecovery,
  CircuitBreaker,
  type RecoveryOptions as EnhancedRecoveryOptions,
  type RecoveryResult
} from './recovery'
