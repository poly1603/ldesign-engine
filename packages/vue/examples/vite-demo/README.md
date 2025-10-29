# Vue Engine 演示项目

## 📖 简介

这是一个完整的 Vue 3 应用演示，展示了 `@ldesign/engine-vue` 的所有核心功能。

## ✨ 演示功能

### 1. 计数器示例
- 展示基础的状态管理
- 使用 `useEngine` 组合式 API

### 2. 事件系统示例
- 展示事件的发布和订阅
- 优先级和命名空间
- 事件监听器管理

### 3. 缓存管理器演示
- 设置和获取缓存
- 查看缓存统计信息
- LRU 淘汰策略
- 内存占用监控

### 4. 状态管理器演示
- 嵌套路径访问
- 状态监听
- 批量更新
- 状态快照和恢复

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
# 在项目根目录
cd d:\WorkBench\ldesign
pnpm install

# 或在演示项目目录
cd packages/engine/packages/vue/examples/vite-demo
pnpm install
```

### 运行开发服务器

```bash
pnpm dev
```

访问 `http://localhost:5173` 查看演示。

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

## 📁 项目结构

```
vite-demo/
├── src/
│   ├── main.ts              # 入口文件
│   ├── App.vue              # 根组件
│   ├── components/          # 演示组件
│   │   ├── Counter.vue      # 计数器示例
│   │   ├── EventDemo.vue    # 事件系统示例
│   │   ├── CacheDemo.vue    # 缓存管理器示例
│   │   └── StateDemo.vue    # 状态管理器示例
│   └── vite-env.d.ts        # Vite 类型定义
├── index.html               # HTML 模板
├── package.json             # 项目配置
├── tsconfig.json            # TypeScript 配置
└── vite.config.ts           # Vite 配置
```

## 🔧 技术栈

- **Vue 3.5** - 渐进式 JavaScript 框架
- **TypeScript 5.7** - 类型安全
- **Vite 5** - 下一代前端构建工具
- **@ldesign/engine-vue** - Engine Vue 适配器
- **@ldesign/engine-core** - Engine 核心引擎

## 📚 学习资源

### 代码示例

查看 `src/components/` 目录下的组件，了解如何使用各种功能。

### API 文档

- [Engine 核心文档](../../README.md)
- [Vue 适配器文档](../../../docs/api/vue.md)

## 💡 使用技巧

### 1. 访问引擎实例

```vue
<script setup>
import { useEngine } from '@ldesign/engine-vue'

const engine = useEngine()

// 访问各个管理器
const cache = engine.cache
const events = engine.events
const state = engine.state
</script>
```

### 2. 状态管理

```typescript
// 设置状态
engine.state.set('user.profile', {
  name: 'Alice',
  age: 30
})

// 监听变化
engine.state.watch('user.profile', (newValue, oldValue) => {
  console.log('Profile updated:', newValue)
})
```

### 3. 缓存使用

```typescript
// 设置缓存（1分钟过期）
engine.cache.set('api:users', usersData, 60000)

// 获取缓存
const users = engine.cache.get('api:users')

// 批量预热
await engine.cache.warmup([
  { key: 'config', loader: () => fetchConfig() }
])
```

### 4. 事件系统

```typescript
// 监听事件
const unsubscribe = engine.events.on('user:login', (user) => {
  console.log('User logged in:', user)
}, { priority: 10 })

// 触发事件
await engine.events.emit('user:login', userData)

// 取消监听
unsubscribe()
```

## 🐛 故障排查

### 问题：引擎未初始化

**错误信息**：
```
Error: Engine not initialized
```

**解决方案**：
确保在使用引擎之前调用了 `createEngineApp`：

```typescript
const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app'
})
```

### 问题：组件中无法获取引擎实例

**错误信息**：
```
Error: Engine not provided
```

**解决方案**：
确保在应用创建时正确提供了引擎实例。`createEngineApp` 会自动处理。

### 问题：类型错误

**解决方案**：
确保安装了正确的类型定义：

```bash
pnpm add -D @types/node
```

## 📝 许可证

MIT © LDesign

---

**开始探索**: 运行 `pnpm dev` 启动演示！🚀

