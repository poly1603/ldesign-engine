/**
 * Vue指令适配器
 * 将引擎指令转换为Vue指令格式
 */
import type { Directive } from 'vue';
import type { DirectiveBase } from './directive-base';
export interface VueDirectiveBinding {
    value: unknown;
    oldValue: unknown;
    arg?: string;
    modifiers: Record<string, boolean>;
    instance: unknown;
    dir: Directive;
}
export interface VueDirectiveHooks {
    created?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    beforeMount?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    mounted?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    beforeUpdate?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    updated?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    beforeUnmount?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    unmounted?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
}
/**
 * 将引擎指令转换为Vue指令
 */
export declare function createVueDirective(directive: DirectiveBase): Directive;
/**
 * 指令工厂函数 - 支持两种使用方式
 * 1. defineDirective(directiveBase) - 传入 DirectiveBase 实例
 * 2. defineDirective(name, hooks) - 传入名称和钩子对象
 */
export declare function defineDirective(directiveOrName: DirectiveBase | string, hooks?: VueDirectiveHooks & {
    created?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    beforeMount?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    mounted?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    beforeUpdate?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    updated?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    beforeUnmount?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
    unmounted?: (el: HTMLElement, binding: VueDirectiveBinding) => void;
}): Directive;
/**
 * 指令工具函数
 */
export declare const directiveUtils: {
    /**
     * 获取绑定值
     */
    getValue(binding: VueDirectiveBinding, defaultValue?: unknown): unknown;
    /**
     * 获取修饰符
     */
    getModifiers(binding: VueDirectiveBinding): Record<string, boolean>;
    /**
     * 检查修饰符
     */
    hasModifier(binding: VueDirectiveBinding, modifier: string): boolean;
    /**
     * 获取参数
     */
    getArg(binding: VueDirectiveBinding): string | undefined;
    /**
     * 获取旧值
     */
    getOldValue(binding: VueDirectiveBinding): unknown;
    /**
     * 检查值是否改变
     */
    isValueChanged(binding: VueDirectiveBinding): boolean;
    /**
     * 解析配置对象
     */
    parseConfig(binding: VueDirectiveBinding): Record<string, unknown>;
    /**
     * 创建事件处理器
     */
    createHandler(callback: EventListener, options?: {
        debounce?: number;
        throttle?: number;
        once?: boolean;
    }): EventListener;
    /**
     * 存储数据到元素
     */
    storeData(el: HTMLElement, key: string, value: unknown): void;
    /**
     * 从元素获取数据
     */
    getData(el: HTMLElement, key: string): unknown;
    /**
     * 从元素删除数据
     */
    removeData(el: HTMLElement, key: string): void;
    /**
     * 清空元素数据
     */
    clearData(el: HTMLElement): void;
};
declare global {
    interface HTMLElement {
        _engineDirectives?: Map<string, DirectiveBase>;
        _directiveData?: Map<string, unknown>;
    }
}
