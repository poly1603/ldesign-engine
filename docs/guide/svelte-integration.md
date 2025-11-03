# Svelte 集成指南

完整的 @ldesign/engine 与 Svelte 集成指南。

## 安装

```bash
pnpm add @ldesign/engine-core @ldesign/engine-svelte
```

## 基础集成

### 1. 创建引擎实例

在应用入口创建引擎实例：

```typescript
// main.ts
import App from './App.svelte'
import { createEngine } from '@ldesign/engine-core'
import { setEngine } from '@ldesign/engine-svelte'
import { createI18nPlugin } from '@ldesign/engine-core/plugins/i18n'
import { createThemePlugin } from '@ldesign/engine-core/plugins/theme'

// 创建引擎
const engine = createEngine({
  name: 'my-svelte-app',
  version: '1.0.0',
  logger: {
    level: 'info'
  }
})

// 注册插件
engine.use(createI18nPlugin({
  locale: 'en',
  messages: {
    en: { welcome: 'Welcome' },
    zh: { welcome: '欢迎' }
  }
}))

engine.use(createThemePlugin({
  defaultTheme: 'light'
}))

// 初始化引擎
await engine.initialize()

// 设置引擎供 Svelte 组件使用
setEngine(engine)

// 创建 Svelte 应用
const app = new App({
  target: document.getElementById('app')!
})

export default app
```

### 2. 在组件中使用

使用 Stores：

```svelte
<script lang="ts">
import { engineStore, pluginStore } from '@ldesign/engine-svelte'

// 访问引擎实例
$: engine = $engineStore

// 访问特定插件
const i18nPlugin = pluginStore('i18n')

function switchLanguage() {
  $i18nPlugin?.api.setLocale('zh')
}
</script>

<div>
  <h1>{$engine?.config.get('name')}</h1>
  <button on:click={switchLanguage}>切换语言</button>
</div>
```

## Stores

Svelte 适配器提供了一系列响应式 Stores：

### engineStore

获取引擎实例：

```svelte
<script lang="ts">
import { engineStore } from '@ldesign/engine-svelte'

$: appName = $engineStore?.config.get('name')

function handleAction() {
  $engineStore?.logger.info('Button clicked')
  $engineStore?.events.emit('action:click')
}
</script>

<div>
  <h1>{appName}</h1>
  <button on:click={handleAction}>Action</button>
</div>
```

### pluginStore

获取特定插件的响应式 Store：

```svelte
<script lang="ts">
import { pluginStore } from '@ldesign/engine-svelte'

const i18nPlugin = pluginStore('i18n')
const themePlugin = pluginStore('theme')

function changeTheme() {
  $themePlugin?.api.setTheme('dark')
}

function changeLanguage() {
  $i18nPlugin?.api.setLocale('zh')
}
</script>

<div>
  {#if $i18nPlugin && $themePlugin}
    <button on:click={changeTheme}>Change Theme</button>
    <button on:click={changeLanguage}>Change Language</button>
  {:else}
    <div>Loading...</div>
  {/if}
</div>
```

### stateStore

响应式状态管理：

```svelte
<script lang="ts">
import { stateStore } from '@ldesign/engine-svelte'

const userState = stateStore('user', { name: '', email: '' })

function updateUser() {
  $userState = {
    name: 'John',
    email: 'john@example.com'
  }
}
</script>

<div>
  <p>Name: {$userState.name}</p>
  <p>Email: {$userState.email}</p>
  <button on:click={updateUser}>Update</button>
</div>
```

### configStore

访问配置：

```svelte
<script lang="ts">
import { configStore } from '@ldesign/engine-svelte'

const appName = configStore('name', 'My App')
const debug = configStore('debug', false)
</script>

<header>
  <h1>{$appName}</h1>
  {#if $debug}
    <span>Debug Mode</span>
  {/if}
</header>
```

### eventStore

监听事件：

```svelte
<script lang="ts">
import { eventStore } from '@ldesign/engine-svelte'
import { onMount } from 'svelte'

let notifications = []

const notificationEvent = eventStore('notification:show')

$: if ($notificationEvent) {
  notifications = [...notifications, $notificationEvent.payload.message]
}
</script>

<ul>
  {#each notifications as msg}
    <li>{msg}</li>
  {/each}
</ul>
```

## 高级用法

### 自定义 Store

创建自定义 Store 封装引擎功能：

```typescript
// stores/translation.ts
import { derived } from 'svelte/store'
import { pluginStore } from '@ldesign/engine-svelte'

export const translationStore = derived(
  pluginStore('i18n'),
  ($i18nPlugin) => {
    if (!$i18nPlugin?.api) return null
    
    return {
      locale: $i18nPlugin.api.getLocale(),
      t: (key: string) => $i18nPlugin.api.t(key),
      setLocale: (locale: string) => $i18nPlugin.api.setLocale(locale)
    }
  }
)
```

```svelte
<script lang="ts">
import { translationStore } from './stores/translation'

$: translation = $translationStore

function switchLanguage() {
  translation?.setLocale('zh')
}
</script>

<div>
  <h1>{translation?.t('welcome')}</h1>
  <button on:click={switchLanguage}>Switch</button>
</div>
```

### 与 SvelteKit 集成

```typescript
// hooks.server.ts
import type { Handle } from '@sveltejs/kit'
import { createEngine } from '@ldesign/engine-core'
import { setEngine } from '@ldesign/engine-svelte'

export const handle: Handle = async ({ event, resolve }) => {
  // 为每个请求创建引擎实例
  const engine = createEngine({
    name: 'sveltekit-app',
    version: '1.0.0'
  })
  
  await engine.initialize()
  
  // 将引擎添加到 locals
  event.locals.engine = engine
  
  const response = await resolve(event)
  return response
}
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
import { page } from '$app/stores'
import { setEngine } from '@ldesign/engine-svelte'
import { onMount } from 'svelte'

onMount(() => {
  // 从 server 获取引擎
  if ($page.data.engine) {
    setEngine($page.data.engine)
  }
})
</script>
```

### 响应式主题

```svelte
<script lang="ts">
import { pluginStore } from '@ldesign/engine-svelte'
import { onMount } from 'svelte'

const themePlugin = pluginStore('theme')

$: currentTheme = $themePlugin?.api.getTheme() || 'light'

$: if (currentTheme) {
  applyTheme()
}

function applyTheme() {
  const theme = $themePlugin?.api.getCurrentTheme()
  if (theme) {
    document.documentElement.style.setProperty(
      '--primary',
      theme.colors.primary
    )
    document.documentElement.style.setProperty(
      '--background',
      theme.colors.background
    )
  }
}

function toggleTheme() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light'
  $themePlugin?.api.setTheme(newTheme)
}
</script>

<div class="theme-{currentTheme}">
  <button on:click={toggleTheme}>
    Toggle Theme ({currentTheme})
  </button>
</div>

<style>
  .theme-light {
    background: var(--background);
    color: var(--text);
  }
  
  .theme-dark {
    background: var(--background);
    color: var(--text);
  }
</style>
```

## 完整示例

### 多语言应用

```svelte
<script lang="ts">
import { pluginStore } from '@ldesign/engine-svelte'

const i18nPlugin = pluginStore('i18n')

$: locale = $i18nPlugin?.api.getLocale() || 'en'
$: translations = $i18nPlugin?.api.messages[locale] || {}

function switchLanguage() {
  const newLocale = locale === 'en' ? 'zh' : 'en'
  $i18nPlugin?.api.setLocale(newLocale)
}

function t(key: string): string {
  const keys = key.split('.')
  let value = translations
  for (const k of keys) {
    value = value?.[k]
  }
  return value || key
}
</script>

<div class="app">
  <header>
    <h1>{t('app.title')}</h1>
    <button on:click={switchLanguage}>
      {locale === 'en' ? '中文' : 'English'}
    </button>
  </header>
  <main>
    <p>{t('app.welcome')}</p>
  </main>
</div>
```

### 状态管理示例

```svelte
<script lang="ts">
import { stateStore } from '@ldesign/engine-svelte'

const todos = stateStore('todos', [])
let newTodo = ''

function addTodo() {
  if (newTodo.trim()) {
    $todos = [...$todos, {
      id: Date.now(),
      text: newTodo,
      completed: false
    }]
    newTodo = ''
  }
}

function toggleTodo(id: number) {
  $todos = $todos.map(todo =>
    todo.id === id
      ? { ...todo, completed: !todo.completed }
      : todo
  )
}

function removeTodo(id: number) {
  $todos = $todos.filter(todo => todo.id !== id)
}
</script>

<div>
  <input
    bind:value={newTodo}
    on:keydown={(e) => e.key === 'Enter' && addTodo()}
    placeholder="Add todo..."
  />
  <button on:click={addTodo}>Add</button>
  
  <ul>
    {#each $todos as todo}
      <li class:completed={todo.completed}>
        <input
          type="checkbox"
          checked={todo.completed}
          on:change={() => toggleTodo(todo.id)}
        />
        <span>{todo.text}</span>
        <button on:click={() => removeTodo(todo.id)}>Delete</button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .completed span {
    text-decoration: line-through;
    opacity: 0.6;
  }
</style>
```

### 事件系统示例

```svelte
<script lang="ts">
import { engineStore } from '@ldesign/engine-svelte'
import { onMount, onDestroy } from 'svelte'

let eventLog = []

let unsubscribe: (() => void) | null = null

onMount(() => {
  if ($engineStore) {
    // 监听所有事件
    unsubscribe = $engineStore.events.on('*', (event) => {
      eventLog = [
        { type: event.type, payload: event.payload },
        ...eventLog.slice(0, 9)
      ]
    })
  }
})

onDestroy(() => {
  unsubscribe?.()
})

function triggerEvent() {
  $engineStore?.events.emit('custom:event', {
    timestamp: Date.now(),
    message: 'Custom event triggered'
  })
}
</script>

<div>
  <button on:click={triggerEvent}>Trigger Event</button>
  
  <div class="event-log">
    {#each eventLog as event}
      <div class="event-item">
        <strong>{event.type}</strong>
        <pre>{JSON.stringify(event.payload, null, 2)}</pre>
      </div>
    {/each}
  </div>
</div>

<style>
  .event-log {
    max-height: 400px;
    overflow-y: auto;
    margin-top: 1rem;
  }
  
  .event-item {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  pre {
    font-size: 0.875rem;
    margin: 0.5rem 0 0 0;
  }
</style>
```

## TypeScript 支持

### 类型定义

```typescript
// types/engine.d.ts
import type { CoreEngine } from '@ldesign/engine-core'

declare global {
  interface Window {
    __ENGINE__: CoreEngine
  }
}

// 扩展插件类型
declare module '@ldesign/engine-core' {
  interface PluginRegistry {
    'my-plugin': MyPlugin
  }
}
```

### 类型安全的 Store

```typescript
// stores/typed.ts
import { derived, type Readable } from 'svelte/store'
import { pluginStore } from '@ldesign/engine-svelte'
import type { MyPluginAPI } from './types'

export const myPluginStore: Readable<MyPluginAPI | null> = derived(
  pluginStore('my-plugin'),
  ($plugin) => $plugin?.api || null
)
```

## 性能优化

### 1. 派生 Store

使用 `derived` 避免重复计算：

```typescript
import { derived } from 'svelte/store'
import { stateStore } from '@ldesign/engine-svelte'

const todos = stateStore('todos', [])

// 派生 store 自动计算
export const activeTodos = derived(
  todos,
  $todos => $todos.filter(t => !t.completed)
)

export const completedTodos = derived(
  todos,
  $todos => $todos.filter(t => t.completed)
)
```

### 2. 懒加载插件

```svelte
<script lang="ts">
import { engineStore } from '@ldesign/engine-svelte'
import { onMount } from 'svelte'

let featureEnabled = false

async function enableFeature() {
  const { createFeaturePlugin } = await import('@my/feature-plugin')
  await $engineStore?.use(createFeaturePlugin())
  featureEnabled = true
}
</script>

<div>
  {#if featureEnabled}
    <FeatureComponent />
  {:else}
    <button on:click={enableFeature}>Enable Feature</button>
  {/if}
</div>
```

### 3. 条件订阅

只在需要时订阅：

```svelte
<script lang="ts">
import { pluginStore } from '@ldesign/engine-svelte'

export let showAdvanced = false

// 只在需要时创建 store
$: advancedPlugin = showAdvanced ? pluginStore('advanced') : null
</script>

<div>
  <button on:click={() => showAdvanced = !showAdvanced}>
    Toggle Advanced
  </button>
  
  {#if showAdvanced && $advancedPlugin}
    <div>Advanced features...</div>
  {/if}
</div>
```

## 常见问题

### Q: 如何在多个组件间共享引擎？

A: 使用 `setEngine` 在应用入口设置一次：

```typescript
// main.ts
const engine = createEngine({ /* ... */ })
await engine.initialize()
setEngine(engine)

// 所有组件都可以使用
import { engineStore } from '@ldesign/engine-svelte'
```

### Q: 如何处理异步插件初始化？

A: 在设置引擎前完成初始化：

```typescript
const engine = createEngine({ /* ... */ })
engine.use(createAsyncPlugin())

await engine.initialize()

setEngine(engine)
```

### Q: 如何在 SvelteKit 中使用？

A: 在 hooks 中为每个请求创建引擎：

```typescript
// hooks.server.ts
export const handle: Handle = async ({ event, resolve }) => {
  const engine = createEngine({ /* ... */ })
  await engine.initialize()
  event.locals.engine = engine
  return resolve(event)
}
```

### Q: Store 的性能如何？

A: Svelte 的 Store 非常高效，只在值真正变化时才触发更新。使用 `derived` store 可以进一步优化。

## 最佳实践

1. **集中管理引擎** - 在应用入口设置引擎
2. **使用响应式语法** - 充分利用 Svelte 的 `$` 语法
3. **派生 Store** - 使用 `derived` 创建计算属性
4. **清理订阅** - 在 `onDestroy` 中清理手动订阅
5. **类型安全** - 使用 TypeScript 类型定义

## 下一步

- [查看完整示例](/examples/svelte)
- [学习插件开发](/guide/plugin-development)
- [了解核心概念](/guide/core-concepts)
- [Svelte Store API](https://svelte.dev/docs#run-time-svelte-store)
