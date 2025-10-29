# 安装

## 环境要求

在开始之前，请确保你的开发环境满足以下要求：

- **Node.js**: >= 18.0.0
- **包管理器**: pnpm >= 8.0.0（推荐）或 npm >= 8.0.0
- **TypeScript**: >= 5.0.0（可选，但强烈推荐）

## 安装 Engine

### 使用 pnpm（推荐）

```bash
pnpm add @ldesign/engine
```

### 使用 npm

```bash
npm install @ldesign/engine
```

### 使用 yarn

```bash
yarn add @ldesign/engine
```

## 安装框架依赖

根据你使用的框架，还需要安装对应的 peer dependencies：

### Vue 3

```bash
pnpm add vue@^3.3.0
```

### React

```bash
pnpm add react@^18.0.0 react-dom@^18.0.0
```

### Angular

```bash
pnpm add @angular/core@^16.0.0 @angular/common@^16.0.0
```

### Solid.js

```bash
pnpm add solid-js@^1.7.0
```

### Svelte

```bash
pnpm add svelte@^4.0.0
# 或
pnpm add svelte@^5.0.0
```

### 核心功能（无框架依赖）

如果只使用核心功能，不需要安装任何框架：

```bash
pnpm add @ldesign/engine
```

## 开发工具配置

### TypeScript 配置

在你的 `tsconfig.json` 中添加：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "types": ["@ldesign/engine"]
  }
}
```

### ESLint 配置

推荐使用 `@antfu/eslint-config`：

```bash
pnpm add -D @antfu/eslint-config eslint
```

```javascript
// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: true, // 或 react, solid, svelte
})
```

### Vite 配置（推荐）

如果使用 Vite，推荐配置：

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    include: ['@ldesign/engine']
  }
})
```

## 验证安装

创建一个简单的测试文件验证安装：

```typescript
import { createCoreEngine } from '@ldesign/engine/core'

const engine = createCoreEngine({
  name: 'Test App',
  debug: true
})

await engine.init()

console.log('✅ Engine initialized successfully!')
console.log('📊 Status:', engine.getStatus())
```

运行此文件，如果看到成功消息，说明安装成功！

## CDN 使用

如果你想通过 CDN 使用（不推荐生产环境）：

```html
<!-- UMD 版本 -->
<script src="https://unpkg.com/@ldesign/engine"></script>

<script>
  const { createCoreEngine } = LDesignEngine
  
  const engine = createCoreEngine({
    name: 'CDN App'
  })
</script>
```

## 故障排查

### 问题：安装失败

**错误信息**:
```
ERR_PNPM_PEER_DEP_ISSUES
```

**解决方案**:
确保安装了对应框架的 peer dependencies。

### 问题：类型定义找不到

**错误信息**:
```
Could not find a declaration file for module '@ldesign/engine'
```

**解决方案**:
1. 确保安装了最新版本
2. 重启 TypeScript 服务器
3. 检查 `tsconfig.json` 配置

### 问题：构建错误

**解决方案**:
1. 清理缓存：`rm -rf node_modules pnpm-lock.yaml`
2. 重新安装：`pnpm install`

## 下一步

安装完成后，查看：

- [快速开始](./getting-started) - 5 分钟快速体验
- [核心概念](./core-concepts) - 深入理解引擎
- [API 参考](/api/) - 查看完整 API

