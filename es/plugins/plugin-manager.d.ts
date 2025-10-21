import type { Engine, Plugin, PluginInfo, PluginManager, PluginStatus } from '../types';
/**
 * 插件管理器实现
 *
 * 负责插件的注册、卸载、依赖验证、查询与统计等能力。
 * - 维护插件注册表与加载顺序
 * - 为每个插件提供上下文（engine/logger/config/events）
 * - 提供依赖图与依赖校验缓存，避免重复计算
 */
export declare class PluginManagerImpl implements PluginManager {
    readonly name = "PluginManager";
    readonly version = "1.0.0";
    private plugins;
    private loadOrder;
    private engine?;
    private readonly MAX_PLUGINS;
    private dependencyCache;
    private dependencyGraphCache?;
    private dependentsCache;
    private cacheInvalidated;
    constructor(engine?: Engine);
    /**
     * 使缓存失效
     */
    private invalidateCache;
    /**
     * 注册并安装插件。
     *
     * 会校验依赖、写入注册表、清理缓存并调用插件的 install。
     * @throws 当插件已注册或依赖缺失时抛出错误
     */
    register(plugin: Plugin): Promise<void>;
    /**
     * 卸载并注销插件。
     *
     * 会检查是否存在依赖该插件的其他插件，若存在则拒绝卸载。
     * @throws 当插件未注册或存在依赖者时抛出错误
     */
    unregister(name: string): Promise<void>;
    get(name: string): Plugin | undefined;
    getAll(): Plugin[];
    isRegistered(name: string): boolean;
    has(name: string): boolean;
    /**
     * 检查插件依赖满足情况（不修改状态）。
     */
    checkDependencies(plugin: Plugin): {
        satisfied: boolean;
        missing: string[];
        conflicts: string[];
    };
    /**
     * 获取依赖指定插件的插件列表 - 使用缓存优化
     */
    private getDependents;
    /**
     * 获取插件按注册顺序的名称列表。
     */
    getLoadOrder(): string[];
    /**
     * 获取当前插件依赖图 - 使用缓存优化
     */
    getDependencyGraph(): Record<string, string[]>;
    /**
     * 验证所有已注册插件的依赖是否完整。
     */
    validateDependencies(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * 获取插件统计信息快照。
     */
    getStats(): {
        total: number;
        loaded: string[];
        dependencies: Record<string, string[]>;
        installed: number;
        pending: number;
        errors: number;
        averageInstallTime: number;
        timestamp: number;
    };
    /**
     * 获取单个插件的元信息摘要。
     */
    getInfo(name: string): PluginInfo<Engine> | undefined;
    /**
     * 获取所有已注册插件的元信息摘要列表。
     */
    getAllInfo(): PluginInfo<Engine>[];
    /**
     * 获取插件状态（当前实现为简化版）。
     */
    getStatus(name: string): PluginStatus | undefined;
    /**
     * 解析插件依赖并按合适顺序返回（当前实现简化为原序）。
     */
    resolveDependencies(plugins: Plugin[]): Plugin[];
    /**
     * 按关键字搜索插件（基于名称与描述）- 优化版
     */
    findByKeyword(keyword: string): Plugin[];
    /**
     * 按作者筛选插件（依赖插件公开 author 字段）。
     */
    findByAuthor(author: string): Plugin[];
    /**
     * 查找依赖了指定插件名称的插件。
     */
    findByDependency(dependency: string): Plugin[];
    destroy(): void;
    private clearCaches;
    getInstalledPlugins(): Plugin[];
    isInstalled(name: string): boolean;
    getPlugin(name: string): Plugin | undefined;
    getPluginStatus(name: string): PluginStatus | undefined;
    initializeAll(): Promise<void>;
    /**
     * 抽取创建上下文的逻辑
     */
    private createPluginContext;
    /**
     * 记录插件错误
     */
    private logPluginError;
}
export declare function createPluginManager(engine?: Engine): PluginManager;
