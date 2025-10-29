/**
 * Vue3 指令适配器
 * 将引擎指令适配为 Vue3 指令
 */

import type { Directive, DirectiveBinding } from 'vue'

/**
 * 引擎指令接口（简化版）
 */
export interface EngineDirective {
  name: string
  mounted?: (el: HTMLElement, binding: DirectiveBinding) => void
  updated?: (el: HTMLElement, binding: DirectiveBinding) => void
  unmounted?: (el: HTMLElement, binding: DirectiveBinding) => void
}

/**
 * 将引擎指令转换为 Vue3 指令
 */
export function convertToVue3Directive(directive: EngineDirective): Directive {
  return {
    mounted(el, binding) {
      if (directive.mounted) {
        directive.mounted(el, binding)
      }
    },
    updated(el, binding) {
      if (directive.updated) {
        directive.updated(el, binding)
      }
    },
    unmounted(el, binding) {
      if (directive.unmounted) {
        directive.unmounted(el, binding)
      }
    },
  }
}

/**
 * 批量注册指令到 Vue 应用
 */
export function registerDirectives(
  app: any,
  directives: Record<string, EngineDirective | Directive>
): void {
  Object.entries(directives).forEach(([name, directive]) => {
    if ('name' in directive) {
      // 引擎指令，需要转换
      app.directive(name, convertToVue3Directive(directive as EngineDirective))
    } else {
      // 已经是 Vue3 指令
      app.directive(name, directive)
    }
  })
}

