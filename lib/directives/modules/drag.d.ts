/**
 * 拖拽指令
 * 使元素可拖拽移动
 */
import type { VueDirectiveBinding } from '../base/vue-directive-adapter';
import { DirectiveBase } from '../base/directive-base';
export interface DragOptions {
    disabled?: boolean;
    axis?: 'x' | 'y' | 'both';
    handle?: string | HTMLElement;
    constraint?: DragConstraint;
    onStart?: (event: DragEvent) => void;
    onMove?: (event: DragEvent) => void;
    onEnd?: (event: DragEvent) => void;
    cursor?: string;
    preventDefault?: boolean;
    stopPropagation?: boolean;
}
export interface DragConstraint {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    parent?: boolean;
    selector?: string;
}
export interface DragState {
    isDragging: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    offsetX: number;
    offsetY: number;
}
export interface DragEvent {
    el: HTMLElement;
    state: DragState;
    originalEvent: MouseEvent | TouchEvent;
}
export declare class DragDirective extends DirectiveBase {
    constructor();
    mounted(el: HTMLElement, binding: VueDirectiveBinding): void;
    updated(el: HTMLElement, binding: VueDirectiveBinding): void;
    unmounted(el: HTMLElement): void;
    private cleanup;
    private getHandle;
    private getEventPoint;
    private getConstraintBounds;
    private parseConfig;
    getExample(): string;
}
export declare const vDrag: import("vue").Directive;
export default vDrag;
