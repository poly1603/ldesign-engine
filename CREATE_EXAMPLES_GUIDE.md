# 创建 Engine 示例项目指南

本文档提供了为所有框架创建示例项目的完整指南和模板。

## 已完成的示例

✅ **Vue** - `packages/engine/packages/vue/example`
✅ **React** - `packages/engine/packages/react/example`

## 待创建的示例

以下框架的示例项目需要按照相同的模式创建：

- [ ] Svelte
- [ ] Solid  
- [ ] Preact
- [ ] Angular
- [ ] Qwik
- [ ] Lit
- [ ] AlpineJS
- [ ] NextJS
- [ ] NuxtJS
- [ ] Remix
- [ ] SvelteKit
- [ ] Astro

## 示例项目结构模板

每个示例项目应包含以下文件：

```
example/
├── src/
│   ├── App.{vue|tsx|jsx|svelte|...}  # 主应用组件
│   ├── App.css                        # 组件样式
│   ├── main.{ts|tsx|js}               # 入口文件
│   └── style.css                      # 全局样式
├── index.html                         # HTML 模板
├── launcher.config.ts                 # Launcher 配置
├── package.json                       # 项目配置
├── tsconfig.json                      # TypeScript 配置
├── tsconfig.node.json                 # Node TypeScript 配置
└── README.md                          # 说明文档
```

## package.json 模板

```json
{
  "name": "@ldesign/engine-{framework}-example",
  "version": "0.2.0",
  "type": "module",
  "private": true,
  "description": "{Framework} Engine 示例项目 - 演示 createEngineApp 的使用",
  "scripts": {
    "dev": "launcher dev",
    "build": "launcher build",
    "preview": "launcher preview"
  },
  "dependencies": {
    "{framework}": "^x.x.x",
    "@ldesign/engine-core": "workspace:*",
    "@ldesign/engine-{framework}": "workspace:*"
  },
  "devDependencies": {
    "@ldesign/launcher": "workspace:*",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

## launcher.config.ts 模板

```typescript
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: '{framework}',
    options: {
      // 框架特定选项
    }
  },
  
  server: {
    host: '0.0.0.0',
    port: 51XX,  // 每个框架使用不同端口
    open: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

## main.ts 模板

```typescript
/**
 * {Framework} Engine 示例 - 演示 createEngineApp 的使用
 */

import { createEngineApp } from '@ldesign/engine-{framework}'
import type { Plugin, Middleware } from '@ldesign/engine-core'
import App from './App'
import './style.css'

// 示例插件
const loggingPlugin: Plugin = {
  name: 'logging-plugin',
  version: '1.0.0',
  install(engine) {
    console.log('[Plugin] Logging plugin installed')
    engine.events.on('state:changed', (data) => {
      console.log('[Plugin] State changed:', data)
    })
  }
}

// 示例中间件
const authMiddleware: Middleware = {
  name: 'auth-middleware',
  async execute(context, next) {
    console.log('[Middleware] Auth middleware executing')
    await next()
    console.log('[Middleware] Auth middleware completed')
  }
}

// 创建引擎应用
async function bootstrap() {
  try {
    const engine = await createEngineApp({
      rootComponent: App,  // 组件式框架需要
      mountElement: '#app', // 或 '#root'
      config: {
        debug: true,
      },
      plugins: [loggingPlugin],
      middleware: [authMiddleware],
      onReady: async (engine) => {
        console.log('✅ Engine ready!')
        engine.state.set('appName', '{Framework} Engine Example')
        engine.state.set('version', '0.2.0')
      },
      onMounted: async (engine) => {
        console.log('✅ App mounted!')
        engine.events.emit('app:mounted', { timestamp: Date.now() })
      },
      onError: (error, context) => {
        console.error(`❌ Error in ${context}:`, error)
      }
    })

    ;(window as any).__ENGINE__ = engine
    console.log('🚀 {Framework} Engine App started successfully!')
  } catch (error) {
    console.error('Failed to start app:', error)
  }
}

bootstrap()
```

## 端口分配

为避免端口冲突，每个框架使用不同的端口：

- Vue: 5100
- React: 5101
- Svelte: 5102
- Solid: 5103
- Preact: 5104
- Angular: 5105
- Qwik: 5106
- Lit: 5107
- AlpineJS: 5108
- NextJS: 5109
- NuxtJS: 5110
- Remix: 5111
- SvelteKit: 5112
- Astro: 5113

## 框架特定注意事项

### 组件式框架 (需要 rootComponent)
- Vue, React, Svelte, Solid, Preact
- 需要在 `createEngineApp` 中传入 `rootComponent`

### 声明式框架 (不需要 rootComponent)
- Qwik, Lit, AlpineJS
- 不需要 `rootComponent`，应用通过声明式方式挂载

### SSR 框架 (支持服务端渲染)
- NextJS, NuxtJS, Remix, SvelteKit, Astro
- 需要额外的 SSR 配置
- 支持 `serializeState` 和 `deserializeState`

### Angular (依赖注入)
- 可以使用 `createEngineApp` 或 `EngineService`
- 需要特殊的模块配置

## 创建步骤

对于每个框架：

1. **创建目录结构**
   ```bash
   mkdir -p packages/engine/packages/{framework}/example/src
   ```

2. **复制并修改 package.json**
   - 更新框架名称
   - 更新依赖版本
   - 添加框架特定的 devDependencies

3. **创建 launcher.config.ts**
   - 设置正确的框架类型
   - 分配唯一端口
   - 添加框架特定选项

4. **创建 main.ts**
   - 导入正确的框架包
   - 根据框架类型调整 createEngineApp 参数

5. **创建 App 组件**
   - 使用框架的组件语法
   - 实现相同的功能演示

6. **创建配置文件**
   - tsconfig.json
   - tsconfig.node.json
   - index.html

7. **创建 README.md**
   - 更新框架名称
   - 更新端口号
   - 添加框架特定说明

8. **测试示例**
   ```bash
   cd packages/engine/packages/{framework}/example
   pnpm install
   pnpm dev
   ```

9. **在浏览器中验证**
   - 访问 http://localhost:51XX
   - 测试所有功能按钮
   - 检查控制台日志

10. **构建测试**
    ```bash
    pnpm build
    pnpm preview
    ```

## 批量创建脚本

可以创建一个脚本来自动化这个过程：

```bash
#!/bin/bash

FRAMEWORKS=("svelte" "solid" "preact" "angular" "qwik" "lit" "alpinejs" "nextjs" "nuxtjs" "remix" "sveltekit" "astro")
BASE_PORT=5102

for i in "${!FRAMEWORKS[@]}"; do
  FRAMEWORK="${FRAMEWORKS[$i]}"
  PORT=$((BASE_PORT + i))
  
  echo "Creating example for $FRAMEWORK on port $PORT..."
  
  # 创建目录
  mkdir -p "packages/engine/packages/$FRAMEWORK/example/src"
  
  # 复制模板文件并替换占位符
  # ... (具体实现)
  
  echo "✅ $FRAMEWORK example created"
done
```

## 验证清单

对于每个示例项目，确保：

- [ ] 能够成功安装依赖 (`pnpm install`)
- [ ] 能够启动开发服务器 (`pnpm dev`)
- [ ] 能够在浏览器中访问
- [ ] 所有功能按钮正常工作
- [ ] 控制台没有错误
- [ ] 能够成功构建 (`pnpm build`)
- [ ] 能够预览构建结果 (`pnpm preview`)
- [ ] README 文档完整准确

## 下一步

完成所有示例项目后：

1. 在根目录创建一个总的示例索引文档
2. 添加一个脚本来测试所有示例
3. 更新主 README 添加示例链接
4. 考虑添加 E2E 测试
5. 添加 CI/CD 流程来自动测试所有示例

## 参考

- Vue 示例: `packages/engine/packages/vue/example`
- React 示例: `packages/engine/packages/react/example`
- 统一 API 文档: `packages/engine/UNIFIED_API.md`

