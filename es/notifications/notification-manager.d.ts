import type { EngineNotification, Logger, NotificationAction, NotificationManager, NotificationOptions, NotificationPosition, NotificationProgress, NotificationTheme, NotificationType } from '../types';
export declare class NotificationManagerImpl implements NotificationManager {
    private notifications;
    private containers;
    private maxNotifications;
    private defaultDuration;
    private defaultPosition;
    private defaultTheme;
    private idCounter;
    private styleManager;
    private logger?;
    private cleanupInterval?;
    private themeUnsubscribe?;
    private defaultOptions;
    constructor(logger?: Logger);
    /**
     * 初始化所有位置的容器
     */
    private initializeContainers;
    /**
     * 创建指定位置的容器
     */
    private createContainer;
    /**
     * 设置主题监听器
     */
    private setupThemeWatcher;
    /**
     * 更新所有通知的样式
     */
    private updateAllNotificationStyles;
    show(options: NotificationOptions): string;
    hide(id: string): Promise<void>;
    hideAll(): Promise<void>;
    getAll(): EngineNotification[];
    destroy(): void;
    setPosition(position: NotificationPosition): void;
    getPosition(): NotificationPosition;
    setTheme(theme: NotificationTheme): void;
    getTheme(): NotificationTheme;
    setMaxNotifications(max: number): void;
    getMaxNotifications(): number;
    setDefaultDuration(duration: number): void;
    getDefaultDuration(): number;
    getStats(): {
        total: number;
        visible: number;
        byType: Record<NotificationType, number>;
        byPosition: Record<NotificationPosition, number>;
    };
    private generateId;
    private enforceMaxNotifications;
    private renderNotification;
    private createNotificationElement;
    /**
     * 创建图标元素
     */
    private createIconElement;
    /**
     * 创建进度条元素
     */
    private createProgressElement;
    /**
     * 创建操作按钮容器
     */
    private createActionsElement;
    /**
     * 创建关闭按钮
     */
    private createCloseButton;
    /**
     * 更新通知样式
     */
    private updateNotificationStyles;
    /**
     * 注入CSS样式
     */
    private injectStyles;
    /**
     * 移除通知元素（带动画）
     */
    private removeNotificationElement;
    /**
     * 获取元素的总高度（包括margin）
     */
    private getElementTotalHeight;
    /**
     * 获取需要移动的元素
     */
    private getElementsToMove;
    /**
     * 立即开始其他元素的移动动画
     */
    private startOtherElementsAnimation;
    /**
     * 根据类型返回颜色
     */
    private getTypeColor;
    /**
     * 根据类型返回SVG图标
     */
    private getTypeIcon;
    /**
     * 设置主题（内部方法）
     */
    private setThemeInternal;
    /**
     * 内部获取主题方法
     */
    private getThemeInternal;
    /**
     * 内部方法：设置最大通知数量
     */
    private setMaxNotificationsInternal;
    /**
     * 内部统计方法
     */
    private getStatsInternal;
    /**
     * 内部销毁方法
     */
    private destroyInternal;
    update(id: string, options: Partial<NotificationOptions>): void;
    get(id: string): EngineNotification | undefined;
    clear(): void;
    /**
     * 启动定期清理
     */
    private startCleanup;
    /**
     * 清理过期通知
     */
    private cleanupExpiredNotifications;
    /**
     * 清理元素的事件监听器
     */
    private cleanupElement;
    /**
     * 清理主题监听器
     */
    private cleanupThemeWatcher;
    setDefaultOptions(options: Partial<NotificationOptions>): void;
    getDefaultOptions(): Partial<NotificationOptions>;
}
export declare function createNotificationManager(logger?: Logger): NotificationManager;
export declare const notificationTypes: {
    success: (message: string, title?: string, options?: Partial<NotificationOptions>) => {
        type: NotificationType;
        title: string;
        content?: string;
        message: string;
        position?: NotificationPosition;
        duration?: number;
        animation?: import("../types").NotificationAnimation;
        theme?: NotificationTheme;
        icon?: string;
        actions?: NotificationAction[];
        closable?: boolean;
        showClose?: boolean;
        persistent?: boolean;
        group?: string;
        priority?: number;
        metadata?: Record<string, unknown>;
        progress?: NotificationProgress;
        allowHTML?: boolean;
        onClick?: () => void;
        onShow?: () => void;
        onClose?: () => void;
        style?: Record<string, string>;
        className?: string;
        maxWidth?: number;
        zIndex?: number;
    };
    error: (message: string, title?: string, options?: Partial<NotificationOptions>) => {
        type: NotificationType;
        title: string;
        content?: string;
        message: string;
        position?: NotificationPosition;
        duration: number;
        animation?: import("../types").NotificationAnimation;
        theme?: NotificationTheme;
        icon?: string;
        actions?: NotificationAction[];
        closable?: boolean;
        showClose?: boolean;
        persistent?: boolean;
        group?: string;
        priority?: number;
        metadata?: Record<string, unknown>;
        progress?: NotificationProgress;
        allowHTML?: boolean;
        onClick?: () => void;
        onShow?: () => void;
        onClose?: () => void;
        style?: Record<string, string>;
        className?: string;
        maxWidth?: number;
        zIndex?: number;
    };
    warning: (message: string, title?: string, options?: Partial<NotificationOptions>) => {
        type: NotificationType;
        title: string;
        content?: string;
        message: string;
        position?: NotificationPosition;
        duration?: number;
        animation?: import("../types").NotificationAnimation;
        theme?: NotificationTheme;
        icon?: string;
        actions?: NotificationAction[];
        closable?: boolean;
        showClose?: boolean;
        persistent?: boolean;
        group?: string;
        priority?: number;
        metadata?: Record<string, unknown>;
        progress?: NotificationProgress;
        allowHTML?: boolean;
        onClick?: () => void;
        onShow?: () => void;
        onClose?: () => void;
        style?: Record<string, string>;
        className?: string;
        maxWidth?: number;
        zIndex?: number;
    };
    info: (message: string, title?: string, options?: Partial<NotificationOptions>) => {
        type: NotificationType;
        title: string;
        content?: string;
        message: string;
        position?: NotificationPosition;
        duration?: number;
        animation?: import("../types").NotificationAnimation;
        theme?: NotificationTheme;
        icon?: string;
        actions?: NotificationAction[];
        closable?: boolean;
        showClose?: boolean;
        persistent?: boolean;
        group?: string;
        priority?: number;
        metadata?: Record<string, unknown>;
        progress?: NotificationProgress;
        allowHTML?: boolean;
        onClick?: () => void;
        onShow?: () => void;
        onClose?: () => void;
        style?: Record<string, string>;
        className?: string;
        maxWidth?: number;
        zIndex?: number;
    };
};
export declare function createNotificationHelpers(manager: NotificationManager): {
    success: (message: string, title?: string, options?: Partial<NotificationOptions>) => string;
    error: (message: string, title?: string, options?: Partial<NotificationOptions>) => string;
    warning: (message: string, title?: string, options?: Partial<NotificationOptions>) => string;
    info: (message: string, title?: string, options?: Partial<NotificationOptions>) => string;
    batch: (notifications: NotificationOptions[]) => string[];
    progress: (message: string, initialValue?: number, options?: Partial<NotificationOptions>) => {
        id: string;
        update: (_value: number, _newMessage?: string) => void;
        complete: (successMessage?: string) => void;
        error: (errorMessage?: string) => void;
    };
    confirm: (message: string, title?: string, options?: Partial<NotificationOptions>) => Promise<boolean>;
    loading: (message: string, options?: Partial<NotificationOptions>) => {
        id: string;
        update: (_newMessage: string) => void;
        success: (successMessage: string) => void;
        error: (errorMessage: string) => void;
        hide: () => void;
    };
    group: (groupId: string, notifications: NotificationOptions[]) => string[];
    clearGroup: (groupId: string) => void;
};
