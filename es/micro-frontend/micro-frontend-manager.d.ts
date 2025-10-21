/**
 * 微前端管理器
 * 支持模块联邦、动态加载和应用隔离
 */
import type { Engine } from '../types/engine';
export interface MicroApp {
    name: string;
    entry: string | MicroAppEntry;
    container: string | HTMLElement;
    activeRule: string | RegExp | ((location: Location) => boolean);
    props?: Record<string, unknown>;
    sandbox?: boolean | SandboxConfig;
    prefetch?: boolean | 'all';
    singular?: boolean;
    loader?: (loading: boolean) => void;
}
export interface MicroAppEntry {
    scripts?: string[];
    styles?: string[];
    html?: string;
}
export interface SandboxConfig {
    strictStyleIsolation?: boolean;
    experimentalStyleIsolation?: boolean;
    patchers?: SandboxPatcher[];
}
export interface SandboxPatcher {
    mount?: (app: LoadedMicroApp) => void;
    unmount?: (app: LoadedMicroApp) => void;
}
export interface LoadedMicroApp extends MicroApp {
    id: string;
    status: 'loading' | 'loaded' | 'mounting' | 'mounted' | 'unmounting' | 'error';
    instance?: MicroAppInstance;
    error?: Error;
    sandboxInstance?: Sandbox;
}
export interface MicroAppInstance {
    mount: (props?: Record<string, unknown>) => Promise<void>;
    unmount: () => Promise<void>;
    update?: (props: Record<string, unknown>) => Promise<void>;
    getStatus?: () => string;
}
export interface Sandbox {
    proxy: WindowProxy;
    active: boolean;
    mount: () => void;
    unmount: () => void;
    clear: () => void;
}
export interface ModuleFederationConfig {
    name: string;
    filename?: string;
    exposes?: Record<string, string>;
    remotes?: Record<string, string>;
    shared?: Record<string, SharedConfig>;
}
export interface SharedConfig {
    singleton?: boolean;
    strictVersion?: boolean;
    requiredVersion?: string;
    eager?: boolean;
}
export declare class MicroFrontendManager {
    private apps;
    private currentApp?;
    private engine?;
    private logger?;
    private routerMode;
    private globalState;
    private eventBus;
    private prefetchQueue;
    private moduleFederations;
    constructor(engine?: Engine);
    /**
     * 注册微应用
     */
    registerApp(app: MicroApp): void;
    /**
     * 批量注册微应用
     */
    registerApps(apps: MicroApp[]): void;
    /**
     * 启动微前端系统
     */
    start(): Promise<void>;
    /**
     * 手动加载应用
     */
    loadApp(name: string): Promise<LoadedMicroApp>;
    /**
     * 挂载应用
     */
    mountApp(name: string, props?: Record<string, unknown>): Promise<void>;
    /**
     * 卸载应用
     */
    unmountApp(name: string): Promise<void>;
    /**
     * 更新应用
     */
    updateApp(name: string, props: Record<string, unknown>): Promise<void>;
    /**
     * 设置全局状态
     */
    setGlobalState(state: Record<string, unknown>): void;
    /**
     * 监听全局状态变化
     */
    onGlobalStateChange(callback: (state: Map<string, unknown>, prev: Map<string, unknown>) => void): () => void;
    /**
     * 配置模块联邦
     */
    configureModuleFederation(config: ModuleFederationConfig): void;
    /**
     * 加载联邦模块
     */
    loadFederatedModule<T = any>(scope: string, module: string): Promise<T>;
    private initialize;
    private generateAppId;
    private setupRouteListener;
    private checkCurrentRoute;
    private isAppActive;
    private fetchAppResources;
    private extractResources;
    private resolveUrl;
    private executeScripts;
    private applyStyles;
    private createSandbox;
    private getContainer;
    private prefetchApp;
    private setupModuleFederation;
    private setupErrorHandler;
    private setupPerformanceMonitor;
    private findAppByError;
    private emit;
    private on;
    private off;
    /**
     * 销毁管理器
     */
    destroy(): Promise<void>;
}
export declare function createMicroFrontendManager(engine?: Engine): MicroFrontendManager;
