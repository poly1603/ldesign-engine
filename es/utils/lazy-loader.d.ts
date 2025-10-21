/**
 * 懒加载工具 - 支持代码分割和按需加载
 *
 * 提供模块懒加载、预加载和缓存功能
 */
/**
 * 懒加载模块
 * @param importFn 动态导入函数
 * @param cacheKey 缓存键（可选）
 * @returns Promise<模块>
 */
export declare function lazyLoad<T = any>(importFn: () => Promise<T>, cacheKey?: string): Promise<T>;
/**
 * 预加载模块（在空闲时加载）
 * @param importFn 动态导入函数
 * @param cacheKey 缓存键（可选）
 */
export declare function preload<T = any>(importFn: () => Promise<T>, cacheKey?: string): void;
/**
 * 批量预加载
 * @param loaders 加载器数组
 */
export declare function preloadBatch(loaders: Array<{
    importFn: () => Promise<any>;
    cacheKey?: string;
}>): void;
/**
 * 清除模块缓存
 * @param cacheKey 缓存键（可选，不提供则清除所有）
 */
export declare function clearCache(cacheKey?: string): void;
/**
 * 获取缓存统计
 */
export declare function getCacheStats(): {
    size: number;
    keys: string[];
};
/**
 * 懒加载组件装饰器（用于 Vue 组件）
 * @param importFn 组件导入函数
 * @returns Vue 异步组件
 */
export declare function lazyComponent<T = any>(importFn: () => Promise<T>): () => Promise<T>;
/**
 * 智能预加载 - 基于用户行为预测
 */
export declare class SmartPreloader {
    private patterns;
    private threshold;
    /**
     * 记录访问
     * @param key 访问键
     */
    record(key: string): void;
    /**
     * 检查是否应该预加载
     * @param key 检查键
     * @returns 是否应该预加载
     */
    shouldPreload(key: string): boolean;
    /**
     * 重置统计
     */
    reset(): void;
    /**
     * 获取热门项
     * @param limit 限制数量
     * @returns 热门项列表
     */
    getTopPatterns(limit?: number): Array<[string, number]>;
}
export declare const smartPreloader: SmartPreloader;
