/**
 * 热模块替换(HMR)管理器
 * 🔥 提供开发环境的热更新支持，提升开发体验
 */
import type { Engine } from '../types/engine';
declare global {
    interface ImportMeta {
        hot?: {
            accept: (deps?: string | string[] | ((mod: any) => void), callback?: (newModule: any) => void) => void;
            on: (event: string, callback: (...args: any[]) => void) => void;
            dispose: (callback: (data: any) => void) => void;
            data: any;
        };
    }
}
export interface HMROptions {
    /** 是否启用HMR */
    enabled?: boolean;
    /** HMR服务器地址 */
    host?: string;
    /** HMR服务器端口 */
    port?: number;
    /** 是否启用自动重连 */
    autoReconnect?: boolean;
    /** 重连间隔(ms) */
    reconnectInterval?: number;
    /** 最大重连次数 */
    maxReconnectAttempts?: number;
    /** 是否保留应用状态 */
    preserveState?: boolean;
    /** 自定义更新策略 */
    updateStrategy?: 'reload' | 'patch' | 'preserve';
}
export interface HMRModule {
    /** 模块ID */
    id: string;
    /** 模块类型 */
    type: 'component' | 'plugin' | 'store' | 'route' | 'style';
    /** 模块内容 */
    content: unknown;
    /** 时间戳 */
    timestamp: number;
    /** 依赖模块 */
    dependencies?: string[];
    /** 热更新处理器 */
    hot?: {
        accept?: (callback: (module: HMRModule) => void) => void;
        dispose?: (callback: (data?: unknown) => void) => void;
        data?: Record<string, unknown>;
    };
}
export interface HMRUpdateEvent {
    /** 更新类型 */
    type: 'added' | 'modified' | 'removed';
    /** 更新的模块 */
    modules: HMRModule[];
    /** 更新时间戳 */
    timestamp: number;
}
/**
 * HMR管理器实现
 */
export declare class HMRManager {
    private engine;
    private options;
    private ws?;
    private modules;
    private updateQueue;
    private isProcessing;
    private reconnectAttempts;
    private reconnectTimer?;
    private stateSnapshot?;
    private readonly maxModules;
    private readonly maxQueueSize;
    private moduleAccessOrder;
    private accessCounter;
    /** HMR事件监听器 */
    private listeners;
    constructor(engine: Engine, options?: HMROptions);
    /**
     * 初始化HMR
     */
    private initialize;
    /**
     * 连接到HMR服务器
     */
    private connect;
    /**
     * 处理HMR消息
     */
    private handleMessage;
    /**
     * 处理模块更新
     */
    private handleUpdate;
    /**
     * 应用单个更新
     */
    private applyUpdate;
    /**
     * 更新组件
     */
    private updateComponent;
    /**
     * 更新插件
     */
    private updatePlugin;
    /**
     * 更新存储
     */
    private updateStore;
    /**
     * 更新路由
     */
    private updateRoute;
    /**
     * 更新样式
     */
    private updateStyle;
    /**
     * 处理完全重载
     */
    private handleFullReload;
    /**
     * 处理错误
     */
    private handleError;
    /**
     * 显示错误覆盖层
     */
    private showErrorOverlay;
    /**
     * 安排重连
     */
    private scheduleReconnect;
    /**
     * 保存当前状态
     */
    private saveState;
    /**
     * 恢复状态
     */
    private restoreState;
    /**
     * 设置全局处理器
     */
    private setupGlobalHandlers;
    /**
     * 检查是否为开发环境
     */
    private isDevelopment;
    /**
     * 注册HMR监听器
     */
    on(event: string, listener: (event: HMRUpdateEvent) => void): void;
    /**
     * 移除HMR监听器
     */
    off(event: string, listener: (event: HMRUpdateEvent) => void): void;
    /**
     * 通知监听器
     */
    private notifyListeners;
    /**
     * 手动触发模块更新
     */
    updateModule(moduleId: string, content: unknown): Promise<void>;
    /**
     * 获取模块
     */
    getModule(moduleId: string): HMRModule | undefined;
    /**
     * 检查是否已连接
     */
    isConnected(): boolean;
    /**
     * 设置模块并进行LRU驱逐
     */
    private setModuleWithEviction;
    /**
     * 销毁HMR管理器
     */
    destroy(): void;
}
/**
 * 创建HMR管理器
 */
export declare function createHMRManager(engine: Engine, options?: HMROptions): HMRManager;
