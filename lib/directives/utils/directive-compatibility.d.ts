/**
 * 指令兼容性工具
 * 处理 Vue 指令和引擎指令之间的类型转换和兼容性检查
 */
import type { ObjectDirective } from 'vue';
import type { DirectiveAdapterFactory, DirectiveCompatibilityChecker, DirectiveType, EngineDirective } from '../../types/directive';
/**
 * 检查指令类型
 */
export declare function checkDirectiveType(directive: unknown): DirectiveType;
/**
 * 检查是否是 Vue 指令
 */
export declare function isVueDirective(directive: unknown): boolean;
/**
 * 检查是否是引擎指令
 */
export declare function isEngineDirective(directive: unknown): boolean;
/**
 * 检查是否是混合指令
 */
export declare function isHybridDirective(directive: unknown): boolean;
/**
 * 将 Vue 指令转换为引擎指令
 */
export declare function convertVueToEngineDirective(vueDirective: unknown): EngineDirective;
/**
 * 将引擎指令转换为 Vue 指令
 */
export declare function convertEngineToVueDirective(engineDirective: EngineDirective): ObjectDirective;
/**
 * 创建混合指令适配器
 */
export declare function createHybridDirectiveAdapter(directive: unknown): EngineDirective;
/**
 * 指令兼容性检查器实现
 */
export declare const directiveCompatibilityChecker: DirectiveCompatibilityChecker;
/**
 * 指令适配器工厂实现
 */
export declare const directiveAdapterFactory: DirectiveAdapterFactory;
/**
 * 安全的指令调用包装器
 */
export declare function safeDirectiveCall<T extends unknown[]>(fn: ((...args: T) => void) | undefined, args: T, context?: string): void;
/**
 * 指令方法签名检查器
 */
export declare function getMethodSignature(fn: unknown): 'vue' | 'engine' | 'unknown';
