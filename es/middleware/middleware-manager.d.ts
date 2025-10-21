import type { Logger, Middleware, MiddlewareContext, MiddlewareManager, MiddlewareNext } from '../types';
export declare class MiddlewareManagerImpl implements MiddlewareManager {
    private middleware;
    private readonly MAX_MIDDLEWARE;
    private logger?;
    private middlewareMap;
    private needsSort;
    constructor(logger?: Logger);
    use(middleware: Middleware): void;
    remove(name: string): void;
    /**
     * 确保中间件已排序 - 懒排序优化
     */
    private ensureSorted;
    execute(context: MiddlewareContext): Promise<void>;
    execute(name: string, context: MiddlewareContext): Promise<unknown>;
    getAll(): Middleware[];
    get(name: string): Middleware | undefined;
    has(name: string): boolean;
    clear(): void;
    size(): number;
    getExecutionOrder(): string[];
    destroy(): void;
    getStats(): {
        total: number;
        byPriority: Record<number, number>;
    };
}
export declare function createMiddlewareManager(logger?: Logger): MiddlewareManager;
export declare function createRequestMiddleware(name: string, handler: (context: MiddlewareContext, next: MiddlewareNext) => Promise<void> | void, priority?: number): Middleware;
export declare function createResponseMiddleware(name: string, handler: (context: MiddlewareContext, next: MiddlewareNext) => Promise<void> | void, priority?: number): Middleware;
export declare function createErrorMiddleware(name: string, handler: (context: MiddlewareContext, next: MiddlewareNext) => Promise<void> | void, priority?: number): Middleware;
export declare const commonMiddleware: {
    logger: (logger: {
        info: (msg: string, data?: unknown) => void;
        warn: (msg: string, data?: unknown) => void;
        debug: (msg: string, data?: unknown) => void;
    }) => Middleware;
    errorHandler: (errorManager: {
        captureError: (error: Error) => void;
    }) => Middleware;
    performance: (logger: {
        warn: (msg: string, data?: unknown) => void;
    }) => Middleware;
    security: (logger: {
        debug: (msg: string, data?: unknown) => void;
    }) => Middleware;
};
