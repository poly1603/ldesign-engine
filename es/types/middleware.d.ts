/**
 * 中间件类型定义
 * 包含中间件、中间件管理器等相关类型
 */
export interface MiddlewareRequest {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
    params?: Record<string, string>;
    query?: Record<string, string>;
    [key: string]: unknown;
}
export interface MiddlewareResponse {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: unknown;
    [key: string]: unknown;
}
export interface MiddlewareContext {
    request?: MiddlewareRequest;
    response?: MiddlewareResponse;
    error?: Error;
    [key: string]: unknown;
}
export type MiddlewareNext = () => Promise<void> | void;
export type MiddlewareFunction = (context: MiddlewareContext, next: MiddlewareNext) => Promise<void> | void;
export interface Middleware {
    name: string;
    handler: MiddlewareFunction;
    priority?: number;
}
export interface MiddlewareManager {
    use: (middleware: Middleware) => void;
    remove: (name: string) => void;
    get: (name: string) => Middleware | undefined;
    getAll: () => Middleware[];
    execute(context: MiddlewareContext): Promise<void>;
    execute(name: string, context: MiddlewareContext): Promise<unknown>;
}
export interface MiddlewarePipeline {
    add: (middleware: Middleware) => void;
    remove: (name: string) => void;
    execute: (context: MiddlewareContext) => Promise<void>;
    clear: () => void;
    getMiddleware: () => Middleware[];
}
export interface MiddlewareErrorHandler {
    onError: (error: Error, context: MiddlewareContext) => void;
    setErrorHandler: (handler: (error: Error, context: MiddlewareContext) => void) => void;
    getErrorHandler: () => ((error: Error, context: MiddlewareContext) => void) | undefined;
}
export interface MiddlewarePerformanceMonitor {
    startMeasure: (middlewareName: string) => void;
    endMeasure: (middlewareName: string) => number;
    getMetrics: () => Record<string, number>;
    getReport: () => Record<string, unknown>;
    clearMetrics: () => void;
}
export interface MiddlewareValidator {
    validate: (middleware: Middleware) => {
        valid: boolean;
        errors: string[];
    };
    validatePipeline: (middleware: Middleware[]) => {
        valid: boolean;
        errors: string[];
    };
    getValidationRules: () => Record<string, unknown>;
    setValidationRules: (rules: Record<string, unknown>) => void;
}
export interface MiddlewareHotReload {
    enable: () => void;
    disable: () => void;
    isEnabled: () => boolean;
    reload: (middlewareName: string) => Promise<void>;
    watch: (middlewarePath: string) => void;
    unwatch: (middlewarePath: string) => void;
    onReload: (callback: (middlewareName: string) => void) => () => void;
}
export interface MiddlewareStats {
    total: number;
    executed: number;
    errors: number;
    averageExecutionTime: number;
    lastExecuted: number;
    byPriority: Record<number, number>;
    byName: Record<string, {
        executions: number;
        errors: number;
        avgTime: number;
    }>;
}
