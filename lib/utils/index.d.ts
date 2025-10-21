/**
 * @ldesign/engine/utils 工具函数
 *
 * 提供各种实用工具函数
 */
/**
 * 数组分块
 */
export declare function chunk<T>(array: T[], size: number): T[][];
/**
 * 防抖函数
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * 节流函数
 */
export declare function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * 延迟函数
 */
export declare function delay(ms: number): Promise<void>;
/**
 * 深拷贝
 */
export declare function deepClone<T>(obj: T): T;
/**
 * 生成唯一ID
 */
export declare function generateId(): string;
/**
 * 格式化文件大小
 */
export declare function formatFileSize(bytes: number): string;
/**
 * 格式化时间
 */
export declare function formatTime(ms: number): string;
/**
 * 获取嵌套值
 */
export declare function getNestedValue(obj: any, path: string): any;
/**
 * 设置嵌套值
 */
export declare function setNestedValue(obj: any, path: string, value: any): void;
/**
 * 分组
 */
export declare function groupBy<T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]>;
/**
 * 去重
 */
export declare function unique<T>(array: T[]): T[];
/**
 * 检查是否为空
 */
export declare function isEmpty(value: any): boolean;
/**
 * 检查是否为函数
 */
export declare function isFunction(value: any): value is (...args: any[]) => unknown;
/**
 * 检查是否为对象
 */
export declare function isObject(value: any): value is object;
/**
 * 检查是否为 Promise
 */
export declare function isPromise(value: any): value is Promise<any>;
/**
 * 安全的 JSON parse
 */
export declare function safeJsonParse(json: string, fallback?: any): any;
/**
 * 安全的 JSON stringify
 */
export declare function safeJsonStringify(obj: any, fallback?: string): string;
/**
 * 重试函数
 */
export declare function retry<T>(fn: () => Promise<T>, options?: {
    maxRetries?: number;
    delay?: number;
    backoff?: number;
}): Promise<T>;
export { createManagedContext, destroyGlobalContext, getGlobalContext } from './memory-management';
export { createMemoryMonitor, MemoryMonitor } from './memory-monitor';
export type { MemoryError, MemoryMonitorConfig, MemoryStats, MemoryWarning } from './memory-monitor';
export { createResourceManager, ResourceManager } from './resource-manager';
export { createLRUCache, LRUCache } from './lru-cache';
export type { LRUCacheOptions } from './lru-cache';
