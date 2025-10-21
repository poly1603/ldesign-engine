/**
 * 统一通知系统
 * 整合了Dialog、Message和Notification的功能
 */
import type { Engine } from '../types/engine';
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type NotificationPosition = 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right' | 'center';
export type NotificationStyle = 'dialog' | 'message' | 'toast' | 'notification';
export interface NotificationOptions {
    id?: string;
    type?: NotificationType;
    style?: NotificationStyle;
    title?: string;
    content: string;
    html?: boolean;
    duration?: number;
    position?: NotificationPosition;
    closable?: boolean;
    persistent?: boolean;
    modal?: boolean;
    maskClosable?: boolean;
    customClass?: string;
    zIndex?: number;
    actions?: NotificationAction[];
    onShow?: () => void;
    onClose?: (result?: unknown) => void;
    beforeClose?: (result?: unknown) => boolean | Promise<boolean>;
    icon?: string | boolean;
    progress?: NotificationProgress;
    sound?: boolean;
    vibrate?: boolean;
}
export interface NotificationAction {
    text: string;
    type?: 'primary' | 'secondary' | 'danger';
    handler?: (instance: NotificationInstance) => void | Promise<void>;
}
export interface NotificationProgress {
    value: number;
    max?: number;
    indeterminate?: boolean;
}
export interface NotificationInstance {
    id: string;
    options: NotificationOptions;
    element: HTMLElement;
    visible: boolean;
    close: (result?: unknown) => Promise<void>;
    update: (options: Partial<NotificationOptions>) => void;
    setProgress: (value: number) => void;
}
export declare class NotificationSystem {
    private instances;
    private containers;
    private idCounter;
    private zIndexBase;
    private logger?;
    private engine?;
    private styleElement?;
    private keydownHandler?;
    private autoCloseTimers;
    constructor(engine?: Engine);
    private initialize;
    /**
     * 显示通知
     */
    show(options: NotificationOptions): NotificationInstance;
    /**
     * 显示对话框
     */
    dialog(options: Partial<NotificationOptions>): Promise<unknown>;
    /**
     * 显示确认对话框
     */
    confirm(content: string, options?: Partial<NotificationOptions>): Promise<boolean>;
    /**
     * 显示输入对话框
     */
    prompt(content: string, defaultValue?: string, options?: Partial<NotificationOptions>): Promise<string | null>;
    /**
     * 快捷方法
     */
    success(content: string, options?: Partial<NotificationOptions>): NotificationInstance;
    error(content: string, options?: Partial<NotificationOptions>): NotificationInstance;
    warning(content: string, options?: Partial<NotificationOptions>): NotificationInstance;
    info(content: string, options?: Partial<NotificationOptions>): NotificationInstance;
    loading(content: string, options?: Partial<NotificationOptions>): NotificationInstance;
    /**
     * 关闭通知
     */
    close(id: string, result?: unknown): Promise<void>;
    /**
     * 关闭所有通知
     */
    closeAll(): Promise<void>;
    private inferStyle;
    private generateId;
    private createInstance;
    private createElement;
    private createDialogStructure;
    private createNotificationStructure;
    private createMessageStructure;
    private getIcon;
    private renderNotification;
    private hideInstance;
    private updateElement;
    private updateProgress;
    private setupAutoClose;
    private getContainer;
    private setupContainers;
    private bindGlobalEvents;
    private adjustPositions;
    private injectStyles;
    /**
     * 销毁系统
     */
    destroy(): Promise<void>;
}
export declare function createNotificationSystem(engine: Engine): NotificationSystem;
export declare function createUnifiedNotificationSystem(engine: Engine): NotificationSystem;
export { NotificationSystem as UnifiedNotificationSystem };
