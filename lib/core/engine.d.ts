import type { CacheManager } from '../cache/cache-manager';
import type { EnvironmentManager } from '../environment/environment-manager';
import type { LifecycleManager } from '../lifecycle/lifecycle-manager';
import type { NotificationSystem } from '../notifications/notification-system';
import type { PerformanceManager } from '../performance/performance-manager';
import type { SecurityManager } from '../security/security-manager';
import type { ConfigManager, DirectiveManager, EngineConfig, ErrorManager, EventManager, I18nAdapter, Logger, MiddlewareManager, Plugin, PluginManager, RouterAdapter, StateAdapter, StateManager, ThemeAdapter } from '../types';
import type { Engine } from '../types/engine';
import { type App, type Component } from 'vue';
/**
 * 引擎核心实现类
 *
 * 这个类是整个引擎系统的核心，负责：
 * - 管理所有子管理器的生命周期
 * - 提供统一的插件系统
 * - 集成Vue应用
 * - 协调各个模块之间的通信
 *
 * @example
 * ```typescript
 * const engine = createEngine({
 *   debug: true,
 *   performance: { enabled: true }
 * })
 *
 * await engine.mount('#app')
 * ```
 */
export declare class EngineImpl implements Engine {
    /** Vue应用实例 */
    private _app?;
    /** 引擎是否已挂载 */
    private _mounted;
    /** 引擎是否已准备就绪 */
    private _isReady;
    /** 挂载目标元素 */
    private _mountTarget?;
    /** 配置管理器 - 负责管理所有配置项 */
    readonly config: ConfigManager;
    /** 插件管理器 - 负责插件的加载、卸载和生命周期管理（懒加载） */
    private _plugins?;
    /** 中间件管理器 - 提供请求/响应处理管道（懒加载） */
    private _middleware?;
    /** 事件管理器 - 负责事件的发布订阅机制（懒加载） */
    private _events?;
    /** 状态管理器 - 管理应用的全局状态（懒加载） */
    private _state?;
    /** 环境管理器 - 检测和管理运行环境信息 */
    readonly environment: EnvironmentManager;
    /** 生命周期管理器 - 管理组件和应用的生命周期钩子 */
    readonly lifecycle: LifecycleManager;
    /** 指令管理器 - 管理Vue自定义指令（懒加载） */
    private _directives?;
    /** 错误管理器 - 统一的错误处理和报告（懒加载） */
    private _errors?;
    /** 日志记录器 - 提供分级日志记录功能 */
    readonly logger: Logger;
    /** 通知管理器 - 管理用户通知和提示（懒加载） */
    private _notifications?;
    /** 缓存管理器实例 - 懒加载，提供多级缓存策略 */
    private _cache?;
    /** 性能管理器实例 - 懒加载，监控和优化应用性能 */
    private _performance?;
    /** 安全管理器实例 - 懒加载，提供安全防护机制 */
    private _security?;
    /** 管理器注册表 - 管理所有管理器的依赖关系和初始化顺序 */
    private readonly managerRegistry;
    /** 路由适配器 - 可选的路由集成接口 */
    router?: RouterAdapter;
    /** 状态适配器 - 可选的状态管理集成接口 */
    store?: StateAdapter;
    /** 国际化适配器 - 可选的多语言支持接口 */
    i18n?: I18nAdapter;
    /** 主题适配器 - 可选的主题切换接口 */
    theme?: ThemeAdapter;
    /**
     * 懒加载事件管理器访问器
     */
    get events(): EventManager;
    /**
     * 懒加载状态管理器访问器
     */
    get state(): StateManager;
    /**
     * 懒加载错误管理器访问器
     */
    get errors(): ErrorManager;
    /**
     * 懒加载指令管理器访问器
     */
    get directives(): DirectiveManager;
    /**
     * 懒加载通知管理器访问器
     */
    get notifications(): NotificationSystem;
    /**
     * 懒加载中间件管理器访问器
     */
    get middleware(): MiddlewareManager;
    /**
     * 懒加载插件管理器访问器
     */
    get plugins(): PluginManager;
    /**
     * 懒加载缓存管理器访问器
     *
     * 使用懒加载模式来优化应用启动性能，只有在实际需要缓存功能时才初始化
     * 缓存管理器。这种方式可以显著减少应用的初始化时间。
     *
     * @returns {CacheManager} 缓存管理器实例
     *
     * @example
     * ```typescript
     * // 第一次访问时会自动初始化
     * const cache = engine.cache
     * cache.set('key', 'value')
     * ```
     */
    get cache(): CacheManager;
    /**
     * 懒加载性能管理器访问器
     *
     * 性能管理器用于监控和优化应用性能，包括：
     * - 应用加载时间监控
     * - 组件渲染性能监控
     * - 内存使用情况监控
     * - 网络请求性能监控
     *
     * @returns {PerformanceManager} 性能管理器实例
     */
    get performance(): PerformanceManager;
    /**
     * 懒加载安全管理器访问器
     *
     * 安全管理器提供应用安全防护功能，包括：
     * - XSS 攻击防护
     * - CSRF 攻击防护
     * - 内容安全策略 (CSP)
     * - 输入验证和清理
     * - 敏感操作权限检查
     *
     * @returns {SecurityManager} 安全管理器实例
     */
    get security(): SecurityManager;
    /**
     * 构造函数 - 按照依赖顺序初始化所有管理器
     *
     * 初始化顺序非常重要：
     * 1. 配置管理器 - 其他组件需要读取配置
     * 2. 日志器 - 所有组件都需要记录日志
     * 3. 管理器注册表 - 管理组件依赖关系
     * 4. 环境管理器 - 提供运行环境信息
     * 5. 生命周期管理器 - 管理组件生命周期
     * 6. 其他核心管理器 - 按依赖关系顺序初始化
     *
     * @param config 引擎配置对象
     */
    constructor(config?: EngineConfig);
    /**
     * 确保错误处理已设置（延迟初始化）
     * @private
     */
    private ensureErrorHandling;
    /**
     * 设置配置变化监听器
     *
     * @private
     */
    private setupConfigWatchers;
    /** 存储配置监听器的防抖函数，用于清理 */
    private configWatchers?;
    /**
     * 防抖函数 - 优化性能和内存
     * @private
     * @template T 函数类型
     * @param func 要防抖的函数
     * @param wait 等待时间（毫秒）
     * @returns 防抖后的函数
     */
    private debounce;
    init(): Promise<void>;
    isReady(): boolean;
    createApp(rootComponent: Component): App;
    install(app: App): void;
    use(plugin: Plugin): Promise<void>;
    mount(selector: string | Element): Promise<void>;
    unmount(): Promise<void>;
    setRouter(router: RouterAdapter): void;
    setStore(store: StateAdapter): void;
    setI18n(i18n: I18nAdapter): void;
    setTheme(theme: ThemeAdapter): void;
    getApp(): App | undefined;
    isMounted(): boolean;
    getMountTarget(): string | Element | undefined;
    /**
     * 销毁引擎 - 完全清理所有资源和内存
     *
     * 按照依赖关系的反向顺序清理资源，确保没有内存泄漏
     * @returns Promise<void>
     */
    destroy(): Promise<void>;
    updateConfig(config: Partial<Record<string, unknown>>): void;
    getConfig<T = unknown>(path: string, defaultValue?: T): T;
    setConfig(path: string, value: unknown): void;
    getManagerStats(): Record<string, unknown>;
    validateManagers(): {
        valid: boolean;
        errors: string[];
    };
    private registerManagers;
    /**
     * 清理所有管理器 - 优化版（支持懒加载的管理器）
     * @private
     */
    private cleanupManagers;
    /**
     * 紧急清理 - 在发生严重错误时使用
     * @private
     */
    private emergencyCleanup;
}
