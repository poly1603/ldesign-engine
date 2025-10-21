import type { NotificationPosition, NotificationTheme, NotificationType } from '../types';
export interface ThemeColors {
    background: string;
    text: string;
    border: string;
    shadow: string;
    success: string;
    error: string;
    warning: string;
    info: string;
}
export interface NotificationStyles {
    container: Partial<CSSStyleDeclaration>;
    notification: Partial<CSSStyleDeclaration>;
    icon: Partial<CSSStyleDeclaration>;
    content: Partial<CSSStyleDeclaration>;
    title: Partial<CSSStyleDeclaration>;
    message: Partial<CSSStyleDeclaration>;
    closeButton: Partial<CSSStyleDeclaration>;
    actions: Partial<CSSStyleDeclaration>;
    progress: Partial<CSSStyleDeclaration>;
}
export declare class NotificationStyleManager {
    private themes;
    private currentTheme;
    /**
     * 获取容器位置样式
     */
    getContainerStyles(position: NotificationPosition): Partial<CSSStyleDeclaration>;
    /**
     * 获取通知样式
     */
    getNotificationStyles(type?: NotificationType, theme?: NotificationTheme): NotificationStyles;
    /**
     * 获取操作按钮样式
     */
    getActionButtonStyles(style?: 'primary' | 'secondary' | 'danger', theme?: NotificationTheme): Partial<CSSStyleDeclaration>;
    /**
     * 获取进度条样式
     */
    getProgressBarStyles(value: number, color?: string, theme?: NotificationTheme): Partial<CSSStyleDeclaration>;
    /**
     * 应用样式到元素
     */
    applyStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void;
    /**
     * 设置主题
     */
    setTheme(theme: NotificationTheme): void;
    /**
     * 获取当前主题
     */
    getTheme(): NotificationTheme;
    /**
     * 注册自定义主题
     */
    registerTheme(name: NotificationTheme | string, colors: ThemeColors): void;
    /**
     * 获取主题颜色
     */
    getThemeColors(theme?: NotificationTheme): ThemeColors;
    /**
     * 检测系统主题偏好
     */
    detectSystemTheme(): 'light' | 'dark';
    /**
     * 监听系统主题变化
     */
    watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void;
}
export declare function createStyleManager(): NotificationStyleManager;
