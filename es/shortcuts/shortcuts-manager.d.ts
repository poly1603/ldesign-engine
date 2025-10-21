/**
 * 快捷键管理器
 * 统一管理应用中的所有快捷键
 */
export type ShortcutKey = string;
export type ShortcutHandler = (event: KeyboardEvent) => void | boolean;
export type ShortcutScope = string;
export interface ShortcutOptions {
    /** 快捷键描述 */
    description?: string;
    /** 作用域，默认为 'global' */
    scope?: ShortcutScope;
    /** 是否阻止默认行为 */
    preventDefault?: boolean;
    /** 是否阻止事件冒泡 */
    stopPropagation?: boolean;
    /** 是否在输入框中也触发 */
    allowInInput?: boolean;
    /** 是否启用 */
    enabled?: boolean;
    /** 优先级，数字越大优先级越高 */
    priority?: number;
}
export interface Shortcut {
    key: ShortcutKey;
    handler: ShortcutHandler;
    options: Required<ShortcutOptions>;
}
export interface ShortcutGroup {
    name: string;
    description?: string;
    shortcuts: Map<ShortcutKey, Shortcut>;
}
export declare class ShortcutsManager {
    private shortcuts;
    private scopes;
    private activeScopes;
    private enabled;
    private listener?;
    private conflictMode;
    constructor();
    /**
     * 初始化
     */
    private init;
    /**
     * 注册快捷键
     */
    register(key: ShortcutKey, handler: ShortcutHandler, options?: ShortcutOptions): void;
    /**
     * 批量注册快捷键
     */
    registerBatch(shortcuts: Record<ShortcutKey, ShortcutHandler | [ShortcutHandler, ShortcutOptions]>): void;
    /**
     * 注册作用域快捷键
     */
    registerScope(scopeName: ShortcutScope, shortcuts: Record<ShortcutKey, ShortcutHandler>): void;
    /**
     * 注销快捷键
     */
    unregister(key: ShortcutKey, scope?: ShortcutScope): boolean;
    /**
     * 清空作用域的所有快捷键
     */
    clearScope(scope: ShortcutScope): void;
    /**
     * 启用/禁用快捷键
     */
    setEnabled(key: ShortcutKey, enabled: boolean, scope?: ShortcutScope): void;
    /**
     * 激活作用域
     */
    activateScope(scope: ShortcutScope): void;
    /**
     * 停用作用域
     */
    deactivateScope(scope: ShortcutScope): void;
    /**
     * 设置独占作用域（只有该作用域生效）
     */
    setExclusiveScope(scope: ShortcutScope): void;
    /**
     * 重置作用域
     */
    resetScopes(): void;
    /**
     * 检查快捷键冲突
     */
    checkConflict(key: ShortcutKey, scope?: ShortcutScope): boolean;
    /**
     * 获取所有冲突的快捷键
     */
    getConflicts(): Map<ShortcutKey, ShortcutScope[]>;
    /**
     * 处理按键事件
     */
    private handleKeyPress;
    /**
     * 设置冲突处理模式
     */
    setConflictMode(mode: 'error' | 'warn' | 'override'): void;
    /**
     * 启用/禁用管理器
     */
    setManagerEnabled(enabled: boolean): void;
    /**
     * 获取快捷键列表
     */
    getShortcuts(scope?: ShortcutScope): Shortcut[];
    /**
     * 获取快捷键描述（用于显示帮助）
     */
    getShortcutHelp(): Map<ShortcutScope, Array<{
        key: string;
        description: string;
    }>>;
    /**
     * 导出配置
     */
    export(): {
        shortcuts: Array<{
            key: string;
            scope: string;
            description: string;
            enabled: boolean;
        }>;
        activeScopes: string[];
    };
    /**
     * 销毁
     */
    destroy(): void;
}
