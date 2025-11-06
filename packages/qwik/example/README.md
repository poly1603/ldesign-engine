# Qwik Engine Example

这是一个使用 `@ldesign/engine-qwik` 构建的示例项目，展示了如何在 Qwik 应用中使用 LDesign Engine。

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

应用将在 http://localhost:5180 启动

### 生产构建

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

## 📁 项目结构

```
example/
├── src/
│   ├── App.tsx              # 主应用组件
│   ├── App.css              # 应用样式
│   ├── main.tsx             # 入口文件
│   └── global.css           # 全局样式
├── index.html               # HTML 模板
├── package.json             # 项目配置
└── tsconfig.json            # TypeScript 配置
```

## 🔧 技术栈

- **Qwik** - 可恢复性 UI 框架
- **@ldesign/engine-core** - 核心引擎
- **@ldesign/engine-qwik** - Qwik 适配器
- **@ldesign/launcher** - 开发工具(基于 Vite)
- **TypeScript** - 类型安全

## 📚 相关文档

- [Qwik 文档](https://qwik.builder.io/)
- [LDesign Engine 文档](../../README.md)
- [LDesign Launcher 文档](../../../../../tools/launcher/README.md)

## 📝 许可证

MIT

