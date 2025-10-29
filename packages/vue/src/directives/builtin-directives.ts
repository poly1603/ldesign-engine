/**
 * Vue3 内置指令
 */

import type { Directive } from 'vue'

/**
 * 防抖指令
 * v-debounce:input="handler"
 * v-debounce:click.300="handler"
 */
export const vDebounce: Directive = {
  mounted(el, binding) {
    const { value, arg = 'input', modifiers } = binding
    const delay = Object.keys(modifiers)[0] ? Number(Object.keys(modifiers)[0]) : 300

    let timeoutId: NodeJS.Timeout | null = null

    const handler = (event: Event) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        value(event)
      }, delay)
    }

    el._debounceHandler = handler
    el.addEventListener(arg, handler)
  },
  unmounted(el, binding) {
    const { arg = 'input' } = binding
    if (el._debounceHandler) {
      el.removeEventListener(arg, el._debounceHandler)
      delete el._debounceHandler
    }
  },
}

/**
 * 节流指令
 * v-throttle:click="handler"
 * v-throttle:scroll.500="handler"
 */
export const vThrottle: Directive = {
  mounted(el, binding) {
    const { value, arg = 'click', modifiers } = binding
    const delay = Object.keys(modifiers)[0] ? Number(Object.keys(modifiers)[0]) : 300

    let lastTime = 0

    const handler = (event: Event) => {
      const now = Date.now()
      if (now - lastTime >= delay) {
        lastTime = now
        value(event)
      }
    }

    el._throttleHandler = handler
    el.addEventListener(arg, handler)
  },
  unmounted(el, binding) {
    const { arg = 'click' } = binding
    if (el._throttleHandler) {
      el.removeEventListener(arg, el._throttleHandler)
      delete el._throttleHandler
    }
  },
}

/**
 * 点击外部指令
 * v-click-outside="handler"
 */
export const vClickOutside: Directive = {
  mounted(el, binding) {
    const handler = (event: MouseEvent) => {
      if (!el.contains(event.target as Node)) {
        binding.value(event)
      }
    }

    el._clickOutsideHandler = handler
    document.addEventListener('click', handler)
  },
  unmounted(el) {
    if (el._clickOutsideHandler) {
      document.removeEventListener('click', el._clickOutsideHandler)
      delete el._clickOutsideHandler
    }
  },
}

/**
 * 自动聚焦指令
 * v-focus
 * v-focus="shouldFocus"
 */
export const vFocus: Directive = {
  mounted(el, binding) {
    if (binding.value === undefined || binding.value) {
      el.focus()
    }
  },
  updated(el, binding) {
    if (binding.value) {
      el.focus()
    }
  },
}

/**
 * 懒加载指令
 * v-lazy="imageUrl"
 */
export const vLazy: Directive = {
  mounted(el, binding) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = binding.value
          observer.unobserve(img)
        }
      })
    })

    el._lazyObserver = observer
    observer.observe(el)
  },
  updated(el, binding) {
    if (el._lazyObserver && binding.value !== binding.oldValue) {
      el._lazyObserver.unobserve(el)
      el._lazyObserver.observe(el)
    }
  },
  unmounted(el) {
    if (el._lazyObserver) {
      el._lazyObserver.disconnect()
      delete el._lazyObserver
    }
  },
}

/**
 * 所有内置指令
 */
export const builtinDirectives = {
  debounce: vDebounce,
  throttle: vThrottle,
  clickOutside: vClickOutside,
  focus: vFocus,
  lazy: vLazy,
}

