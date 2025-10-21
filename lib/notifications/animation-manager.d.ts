import type { NotificationAnimation, NotificationPosition } from '../types';
export interface AnimationConfig {
    duration: number;
    easing: string;
    delay?: number;
}
export interface AnimationKeyframes {
    enter: Keyframe[];
    exit: Keyframe[];
}
export declare class NotificationAnimationManager {
    private defaultConfig;
    private animations;
    /**
     * 获取位置相关的动画变量
     */
    private getPositionVariables;
    /**
     * 应用位置变量到元素
     */
    private applyPositionVariables;
    /**
     * 执行进入动画
     */
    animateIn(element: HTMLElement, animation?: NotificationAnimation, position?: NotificationPosition, config?: Partial<AnimationConfig>): Promise<void>;
    /**
     * 执行退出动画
     */
    animateOut(element: HTMLElement, animation?: NotificationAnimation, position?: NotificationPosition, config?: Partial<AnimationConfig>): Promise<void>;
    /**
     * 设置默认动画配置
     */
    setDefaultConfig(config: Partial<AnimationConfig>): void;
    /**
     * 获取默认动画配置
     */
    getDefaultConfig(): AnimationConfig;
    /**
     * 注册自定义动画
     */
    registerAnimation(name: NotificationAnimation, keyframes: AnimationKeyframes): void;
    /**
     * 获取所有可用的动画名称
     */
    getAvailableAnimations(): string[];
}
export declare function createAnimationManager(): NotificationAnimationManager;
