/**
 * 通知管理类型定义
 * 包含通知管理器、通知类型等相关类型
 */
import type { NotificationAnimation, NotificationPosition, NotificationTheme, NotificationType } from './base';
export interface NotificationManager {
    show: (notification: NotificationOptions) => string;
    hide: (id: string) => void;
    hideAll: () => void;
    update: (id: string, options: Partial<NotificationOptions>) => void;
    get: (id: string) => EngineNotification | undefined;
    getAll: () => EngineNotification[];
    clear: () => void;
    setDefaultOptions: (options: Partial<NotificationOptions>) => void;
    getDefaultOptions: () => Partial<NotificationOptions>;
    destroy: () => void;
    setPosition: (position: NotificationPosition) => void;
    getPosition: () => NotificationPosition;
    setTheme: (theme: NotificationTheme) => void;
    getTheme: () => NotificationTheme;
    setMaxNotifications: (max: number) => void;
    getMaxNotifications: () => number;
    setDefaultDuration: (duration: number) => void;
    getDefaultDuration: () => number;
    getStats: () => Record<string, unknown>;
}
export interface NotificationProgress {
    value: number;
    max: number;
    label?: string;
    showText?: boolean;
    color?: string;
}
export interface NotificationOptions {
    type?: NotificationType;
    title?: string;
    content?: string;
    message?: string;
    position?: NotificationPosition;
    duration?: number;
    animation?: NotificationAnimation;
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
}
export interface EngineNotification {
    id: string;
    title: string;
    message?: string;
    type: NotificationType;
    position: NotificationPosition;
    duration: number;
    animation: NotificationAnimation;
    theme: NotificationTheme;
    icon?: string;
    actions: NotificationAction[];
    closable: boolean;
    persistent: boolean;
    group?: string;
    priority: number;
    metadata?: Record<string, unknown>;
    timestamp: number;
    isVisible: boolean;
    isAnimating: boolean;
    showProgress?: boolean;
    progress?: NotificationProgress;
    createdAt?: number;
    visible?: boolean;
    element?: HTMLElement;
    timeoutId?: number;
}
export interface NotificationAction {
    label: string;
    action: () => void;
    handler?: () => void;
    type?: 'primary' | 'secondary' | 'danger';
    style?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    loading?: boolean;
}
export interface NotificationGroup {
    id: string;
    name: string;
    notifications: EngineNotification[];
    maxCount: number;
    position: NotificationPosition;
    theme: NotificationTheme;
    autoCollapse: boolean;
    showCount: boolean;
}
export interface NotificationTemplate {
    id: string;
    name: string;
    options: Partial<NotificationOptions>;
    variables: string[];
    description?: string;
    category?: string;
}
export interface NotificationHistory {
    notifications: EngineNotification[];
    maxSize: number;
    autoCleanup: boolean;
    cleanupInterval: number;
    export: () => NotificationHistoryExport;
    clear: () => void;
    search: (query: string) => EngineNotification[];
    filter: (criteria: NotificationFilterCriteria) => EngineNotification[];
}
export interface NotificationHistoryExport {
    notifications: EngineNotification[];
    exportTime: number;
    totalCount: number;
    format: 'json' | 'csv' | 'html';
}
export interface NotificationFilterCriteria {
    type?: NotificationType;
    position?: NotificationPosition;
    theme?: NotificationTheme;
    group?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
    priority?: number;
    hasActions?: boolean;
    isPersistent?: boolean;
}
export interface NotificationStats {
    total: number;
    byType: Record<NotificationType, number>;
    byPosition: Record<NotificationPosition, number>;
    byTheme: Record<NotificationTheme, number>;
    byGroup: Record<string, number>;
    averageDuration: number;
    clickRate: number;
    dismissRate: number;
}
export interface NotificationAnalyzer {
    analyze: (notifications: EngineNotification[]) => NotificationAnalysis;
    getStats: () => NotificationStats;
    identifyTrends: () => NotificationTrend[];
    suggestImprovements: () => string[];
    compare: (period1: EngineNotification[], period2: EngineNotification[]) => NotificationComparison;
}
export interface NotificationAnalysis {
    stats: NotificationStats;
    trends: NotificationTrend[];
    patterns: NotificationPattern[];
    recommendations: string[];
    userBehavior: NotificationUserBehavior;
}
export interface NotificationTrend {
    metric: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    change: number;
    period: string;
    significance: number;
}
export interface NotificationPattern {
    name: string;
    description: string;
    frequency: number;
    impact: 'positive' | 'negative' | 'neutral';
    suggestions: string[];
}
export interface NotificationUserBehavior {
    averageReadTime: number;
    actionRate: number;
    dismissRate: number;
    favoriteTypes: NotificationType[];
    preferredPositions: NotificationPosition[];
    activeHours: number[];
}
export interface NotificationComparison {
    improved: string[];
    degraded: string[];
    unchanged: string[];
    overallChange: number;
    insights: string[];
}
export interface NotificationConfig {
    enabled: boolean;
    defaultDuration: number;
    maxNotifications: number;
    maxGroups: number;
    autoHide: boolean;
    sound: boolean;
    vibration: boolean;
    desktop: boolean;
    mobile: boolean;
    accessibility: boolean;
}
