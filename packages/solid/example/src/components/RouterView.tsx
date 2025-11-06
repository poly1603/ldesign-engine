import { createSignal, createEffect, onCleanup, Component, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { useEngine } from '@ldesign/engine-solid'

export default function RouterView() {
  const engine = useEngine()
  const [currentComponent, setCurrentComponent] = createSignal<Component | null>(null)

  createEffect(() => {
    if (!engine.router) {
      return
    }

    const updateComponent = () => {
      const route = engine.router!.getCurrentRoute()
      if (route.value?.component) {
        const comp = route.value.component as Component
        // 使用函数包装来设置组件，因为组件本身就是函数
        setCurrentComponent(() => comp)
      }
    }

    // 初始化
    updateComponent()

    // 监听路由变化
    const unsubscribe = engine.events.on('router:navigated', (data: any) => {
      updateComponent()
    })

    onCleanup(() => {
      if (unsubscribe) unsubscribe()
    })
  })

  return (
    <div class="router-view">
      <Show when={currentComponent()} fallback={<div>Loading...</div>}>
        <Dynamic component={currentComponent()!} />
      </Show>
    </div>
  )
}

