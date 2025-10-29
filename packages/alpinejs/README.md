# @ldesign/engine-alpinejs

Alpine.js adapter for LDesign Engine - 轻量级 JavaScript 框架适配器。

## 特性

- ✅ **轻量级**: 极简实现,零依赖
- ✅ **Magic Properties**: 3 个魔法属性
- ✅ **x-data 集成**: 无缝集成 Alpine.js
- ✅ **自动注册**: 自动注册到 Alpine
- ✅ **TypeScript**: 完整类型定义

## 安装

```bash
pnpm add @ldesign/engine-alpinejs @ldesign/engine-core alpinejs
```

## 快速开始

```html
<!DOCTYPE html>
<html>
<head>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script type="module">
    import { createEngine } from '@ldesign/engine-core'
    import { createAlpineJSAdapter } from '@ldesign/engine-alpinejs'
    
    const engine = createEngine({
      adapter: createAlpineJSAdapter({ autoInit: true })
    })
    
    await engine.init()
  </script>
</head>
<body>
  <div x-data="{ count: 0 }">
    <button @click="count++; $engineEmit('count:changed', count)">
      Count: <span x-text="count"></span>
    </button>
    <div x-text="$engineState('user.name')"></div>
  </div>
</body>
</html>
```

## Magic Properties

### $engine

访问引擎实例:

```html
<div x-data="{ engine: $engine }">
  <span x-text="engine.name"></span>
</div>
```

### $engineState

获取引擎状态:

```html
<div x-data>
  <div x-text="$engineState('user.name')"></div>
  <div x-text="$engineState('counter')"></div>
</div>
```

### $engineEmit

触发引擎事件:

```html
<button @click="$engineEmit('button:clicked', { id: 1 })">
  Click Me
</button>
```

## 与 x-data 集成

```html
<div x-data="{
  count: 0,
  increment() {
    this.count++
    $engineEmit('count:changed', this.count)
  },
  get engineCount() {
    return $engineState('counter')
  }
}">
  <button @click="increment">Local: <span x-text="count"></span></button>
  <div>Engine: <span x-text="engineCount"></span></div>
</div>
```

## 事件监听

```javascript
import { createEngine } from '@ldesign/engine-core'
import { createAlpineJSAdapter } from '@ldesign/engine-alpinejs'

const engine = createEngine({
  adapter: createAlpineJSAdapter()
})

await engine.init()

// 监听 Alpine 触发的事件
engine.events.on('button:clicked', (data) => {
  console.log('Button clicked:', data)
})
```

## 配置

```typescript
interface AlpineJSAdapterConfig {
  debug?: boolean      // 调试模式
  autoInit?: boolean   // 自动初始化
}
```

## 最佳实践

### 1. 状态同步

```html
<div x-data="{
  init() {
    // 监听引擎状态变化
    $engine.events.on('state:changed', (data) => {
      this.updateFromEngine(data)
    })
  },
  updateFromEngine(data) {
    // 更新本地状态
  }
}">
  <!-- 内容 -->
</div>
```

### 2. 组件通信

```html
<!-- 组件 A -->
<div x-data>
  <button @click="$engineEmit('message', 'Hello')">Send</button>
</div>

<!-- 组件 B -->
<div x-data="{
  message: '',
  init() {
    $engine.events.on('message', (msg) => {
      this.message = msg
    })
  }
}">
  <div x-text="message"></div>
</div>
```

### 3. 全局状态

```html
<div x-data="{
  get user() {
    return $engineState('user')
  },
  get isLoggedIn() {
    return !!this.user
  }
}">
  <template x-if="isLoggedIn">
    <div x-text="user.name"></div>
  </template>
</div>
```

## License

MIT © LDesign Team

