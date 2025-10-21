/**
 * 动态模块加载器
 * 支持按需加载、代码分割和Tree-Shaking优化
 */
import type { Logger } from '../types';
export interface ModuleMetadata {
    name: string;
    version?: string;
    dependencies: string[];
    exports: string[];
    size?: number;
    loaded: boolean;
    loadTime?: number;
}
export interface ModuleLoadOptions {
    preload?: boolean;
    priority?: 'high' | 'normal' | 'low';
    timeout?: number;
    retry?: number;
}
export interface ModuleLoaderConfig {
    baseUrl?: string;
    enableCache?: boolean;
    cacheMaxAge?: number;
    enablePrefetch?: boolean;
    maxConcurrentLoads?: number;
    onModuleLoad?: (module: ModuleMetadata) => void;
    onModuleError?: (error: Error, moduleName: string) => void;
}
/**
 * 模块加载器类
 * 提供智能的模块加载和依赖管理
 */
export declare class ModuleLoader {
    private logger?;
    private modules;
    private loadingPromises;
    private config;
    private moduleCache;
    private loadQueue;
    private currentLoads;
    constructor(config?: ModuleLoaderConfig, logger?: Logger | undefined);
    /**
     * 动态加载模块
     */
    load<T = any>(moduleName: string, options?: ModuleLoadOptions): Promise<T>;
    /**
     * 批量加载模块
     */
    loadBatch<T = any>(moduleNames: string[], options?: ModuleLoadOptions): Promise<T[]>;
    /**
     * 预加载模块（低优先级）
     */
    prefetch(moduleNames: string[]): Promise<void>;
    /**
     * 注册模块元数据
     */
    register(metadata: Omit<ModuleMetadata, 'loaded' | 'loadTime'>): void;
    /**
     * 获取模块元数据
     */
    getMetadata(moduleName: string): ModuleMetadata | undefined;
    /**
     * 获取所有已注册模块
     */
    getAllModules(): ModuleMetadata[];
    /**
     * 获取加载统计
     */
    getStats(): {
        registered: number;
        loaded: number;
        cached: number;
        loading: number;
        averageLoadTime: number;
    };
    /**
     * 生成依赖图
     */
    generateDependencyGraph(): string;
    /**
     * 分析未使用的模块
     */
    findUnusedModules(): string[];
    /**
     * 清除缓存
     */
    clearCache(): void;
    /**
     * 销毁加载器
     */
    destroy(): void;
    /**
     * 实际加载模块的私有方法
     */
    private loadModule;
    /**
     * 动态导入实现
     */
    private dynamicImport;
}
/**
 * 创建模块加载器实例
 */
export declare function createModuleLoader(config?: ModuleLoaderConfig, logger?: Logger): ModuleLoader;
/**
 * 按需加载装饰器
 * 装饰的方法第一次调用时会动态加载指定模块
 */
export declare function LazyModule(moduleName: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function getGlobalModuleLoader(): ModuleLoader;
export declare function setGlobalModuleLoader(loader: ModuleLoader): void;
