# 安装

本章将详细介绍如何安装和配置 @ldesign/engine。

## 系统要求

在开始之前，请确保您的系统满足以下要求：

- **Node.js**: >= 16.0.0
- **npm**: >= 7.0.0 或 **yarn**: >= 1.22.0 或 **pnpm**: >= 6.0.0
- **TypeScript**: >= 4.5.0 (可选，但推荐)

## 包管理器安装

### 使用 npm

```bash
# 安装最新版本
npm install @ldesign/engine

# 安装指定版本
npm install @ldesign/engine@1.0.0

# 安装为开发依赖
npm install --save-dev @ldesign/engine
```

### 使用 yarn

```bash
# 安装最新版本
yarn add @ldesign/engine

# 安装指定版本
yarn add @ldesign/engine@1.0.0

# 安装为开发依赖
yarn add --dev @ldesign/engine
```

### 使用 pnpm

```bash
# 安装最新版本
pnpm add @ldesign/engine

# 安装指定版本
pnpm add @ldesign/engine@1.0.0

# 安装为开发依赖
pnpm add -D @ldesign/engine
```

## CDN 引入

如果您不使用构建工具，可以通过 CDN 直接引入：

### 通过 unpkg

```html
<!-- 引入最新版本 -->
<script src="https://unpkg.com/@ldesign/engine/dist/index.umd.js"></script>

<!-- 引入指定版本 -->
<script src="https://unpkg.com/@ldesign/engine@1.0.0/dist/index.umd.js"></script>
```

### 通过 jsDelivr

```html
<!-- 引入最新版本 -->
<script src="https://cdn.jsdelivr.net/npm/@ldesign/engine/dist/index.umd.js"></script>

<!-- 引入指定版本 -->
<script src="https://cdn.jsdelivr.net/npm/@ldesign/engine@1.0.0/dist/index.umd.js"></script>
```

### ES 模块

```html
<script type="module">
  import { Engine } from 'https://unpkg.com/@ldesign/engine/dist/index.esm.js'

  const engine = new Engine({
    name: 'my-app',
    version: '1.0.0'
  })

  engine.start()
</script>
```

## TypeScript 支持

@ldesign/engine 完全使用 TypeScript 编写，提供完整的类型定义。

### 安装类型定义

如果您使用的是较旧版本的 TypeScript 或需要额外的类型支持：

```bash
npm install --save-dev @types/node
```

### TypeScript 配置

在您的 `tsconfig.json` 中添加以下配置：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

## 验证安装

创建一个简单的测试文件来验证安装是否成功：

```typescript
// test-installation.ts
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'test-app',
  version: '1.0.0',
  debug: true
})

engine.on('engine:started', () => {
  console.log('✅ @ldesign/engine 安装成功！')
})

engine.start()
```

运行测试：

```bash
# 如果使用 TypeScript
npx ts-node test-installation.ts

# 如果使用 JavaScript (需要先编译)
npx tsc test-installation.ts
node test-installation.js
```

## 开发环境设置

### 推荐的项目结构

```
my-app/
├── src/
│   ├── plugins/          # 自定义插件
│   │   ├── auth.ts
│   │   └── ui.ts
│   ├── middleware/       # 中间件
│   │   ├── logger.ts
│   │   └── validator.ts
│   ├── types/           # 类型定义
│   │   └── index.ts
│   ├── config/          # 配置文件
│   │   └── engine.ts
│   └── main.ts          # 入口文件
├── tests/               # 测试文件
├── docs/                # 文档
├── package.json
├── tsconfig.json
└── README.md
```

### 开发依赖

推荐安装以下开发依赖：

```bash
npm install --save-dev \
  typescript \
  @types/node \
  ts-node \
  nodemon \
  jest \
  @types/jest \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  prettier
```

### package.json 脚本

在 `package.json` 中添加有用的脚本：

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts"
  }
}
```

## 构建配置

### Webpack 配置

如果您使用 Webpack，可以添加以下配置：

```javascript
// webpack.config.js
const path = require('node:path')

module.exports = {
  entry: './src/main.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
}
```

### Vite 配置

如果您使用 Vite，可以添加以下配置：

```typescript
// vite.config.ts
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'MyApp',
      fileName: 'my-app',
    },
  },
})
```

### Rollup 配置

如果您使用 Rollup，可以添加以下配置：

```javascript
// rollup.config.js
import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default {
  input: 'src/main.ts',
  output: [
    {
      file: 'dist/bundle.cjs.js',
      format: 'cjs',
    },
    {
      file: 'dist/bundle.esm.js',
      format: 'es',
    },
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript(),
  ],
}
```

## 环境变量

您可以通过环境变量配置引擎的行为：

```bash
# 开启调试模式
DEBUG=true

# 设置日志级别
LOG_LEVEL=debug

# 设置最大监听器数量
MAX_LISTENERS=100
```

在代码中使用：

```typescript
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  debug: process.env.DEBUG === 'true',
  maxListeners: Number.parseInt(process.env.MAX_LISTENERS || '10'),
})
```

## 故障排除

### 常见问题

#### 1. 模块解析错误

```
Error: Cannot resolve module '@ldesign/engine'
```

**解决方案：**
- 确保已正确安装包：`npm list @ldesign/engine`
- 检查 `node_modules` 目录是否存在
- 尝试删除 `node_modules` 和 `package-lock.json`，然后重新安装

#### 2. TypeScript 类型错误

```
Error: Could not find declaration file for module '@ldesign/engine'
```

**解决方案：**
- 确保使用的是最新版本
- 检查 `tsconfig.json` 配置
- 尝试重启 TypeScript 服务

#### 3. 版本兼容性问题

```
Error: Engine requires Node.js >= 16.0.0
```

**解决方案：**
- 升级 Node.js 到支持的版本
- 使用 nvm 管理 Node.js 版本

### 获取帮助

如果您遇到其他问题：

1. 查看 [FAQ](/faq) 页面
2. 搜索 [GitHub Issues](https://github.com/ldesign/engine/issues)
3. 在 [GitHub Discussions](https://github.com/ldesign/engine/discussions) 提问
4. 查看 [故障排除指南](/guide/troubleshooting)

## 下一步

安装完成后，您可以：

- 阅读 [快速开始](/guide/getting-started) 创建您的第一个应用
- 了解 [基本概念](/guide/concepts) 掌握核心理念
- 查看 [配置选项](/guide/configuration) 自定义引擎行为
- 浏览 [示例](/examples/) 学习最佳实践
