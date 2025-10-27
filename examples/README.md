# 示例项目

欢迎来到 LDesign Engine 的示例集合！这里包含了从基础到高级的各种使用示例。

## 📁 目录结构

```
examples/
├── basic-usage/              # 基础使用示例
│   ├── App.vue              # 基础组件
│   └── main.ts              # 入口文件
├── advanced-usage/           # 高级功能示例
│   └── main.ts
├── plugin-development/       # 插件开发示例
│   ├── simple-plugin/
│   ├── stateful-plugin/
│   └── async-plugin/
├── middleware-demo/          # 中间件示例
│   ├── auth-middleware/
│   └── logging-middleware/
├── state-management/         # 状态管理示例
│   ├── basic-state/
│   ├── time-travel/
│   └── distributed-sync/
├── performance-optimization/ # 性能优化示例
│   ├── virtual-scroll/
│   ├── worker-pool/
│   └── batch-processing/
├── micro-frontend/           # 微前端示例
│   ├── main-app/
│   └── sub-app/
└── real-world/              # 实战项目
    ├── todo-app/
    ├── dashboard/
    └── blog/
```

## 🚀 快速开始

### 运行示例

```bash
# 克隆仓库
git clone https://github.com/ldesign/engine.git
cd engine/packages/engine

# 安装依赖
pnpm install

# 运行基础示例
pnpm run dev:examples
```

### 在线演示

访问 [在线演示](https://ldesign.github.io/engine/examples/) 查看所有示例的运行效果。

## 📚 示例列表

### 基础示例

#### 1. 基础使用 (`basic-usage/`)

展示引擎的基本功能：
- ✅ 引擎初始化
- ✅ 状态管理
- ✅ 事件系统
- ✅ 缓存使用
- ✅ 日志记录

**难度**: ⭐

[查看代码](./basic-usage/) | [在线演示](https://ldesign.github.io/engine/examples/basic/)

#### 2. Vue 集成 (`vue-integration/`)

展示如何在 Vue 组件中使用引擎：
- ✅ 组合式 API
- ✅ 响应式数据
- ✅ 生命周期集成
- ✅ 指令使用

**难度**: ⭐

[查看代码](./vue-integration/) | [在线演示](https://ldesign.github.io/engine/examples/vue/)

### 中级示例

#### 3. 插件开发 (`plugin-development/`)

学习如何开发自定义插件：
- ✅ 简单插件
- ✅ 带状态的插件
- ✅ 异步插件
- ✅ 插件依赖管理

**难度**: ⭐⭐

[查看代码](./plugin-development/) | [文档](/examples/plugin-development)

#### 4. 中间件系统 (`middleware-demo/`)

展示中间件的使用场景：
- ✅ 认证中间件
- ✅ 日志中间件
- ✅ 错误处理
- ✅ 性能监控

**难度**: ⭐⭐

[查看代码](./middleware-demo/) | [文档](/examples/middleware-development)

#### 5. 状态管理 (`state-management/`)

深入状态管理功能：
- ✅ 模块化状态
- ✅ 计算属性
- ✅ 状态持久化
- ✅ 时间旅行

**难度**: ⭐⭐

[查看代码](./state-management/) | [文档](/examples/state-management)

### 高级示例

#### 6. 性能优化 (`performance-optimization/`)

性能优化技巧和工具：
- ✅ 虚拟滚动
- ✅ Worker 池
- ✅ 请求批处理
- ✅ 并发控制

**难度**: ⭐⭐⭐

[查看代码](./performance-optimization/) | [文档](/guide/performance-optimization)

#### 7. 微前端架构 (`micro-frontend/`)

构建微前端应用：
- ✅ 主应用配置
- ✅ 子应用开发
- ✅ 应用间通信
- ✅ 状态共享

**难度**: ⭐⭐⭐

[查看代码](./micro-frontend/) | [文档](/examples/micro-frontend)

#### 8. DevTools 集成 (`devtools-integration/`)

开发工具和调试：
- ✅ 性能火焰图
- ✅ 内存时间线
- ✅ 事件流可视化
- ✅ 自定义检查器

**难度**: ⭐⭐⭐

[查看代码](./devtools-integration/) | [文档](/guide/development)

### 实战项目

#### 9. Todo 应用 (`real-world/todo-app/`)

完整的 Todo 应用：
- ✅ 任务增删改查
- ✅ 状态持久化
- ✅ 撤销/重做
- ✅ 拖拽排序

**难度**: ⭐⭐

[查看代码](./real-world/todo-app/) | [在线演示](https://ldesign.github.io/engine/examples/todo/)

#### 10. 仪表板 (`real-world/dashboard/`)

数据可视化仪表板：
- ✅ 实时数据
- ✅ 图表渲染
- ✅ 性能监控
- ✅ 权限控制

**难度**: ⭐⭐⭐

[查看代码](./real-world/dashboard/) | [在线演示](https://ldesign.github.io/engine/examples/dashboard/)

#### 11. 博客系统 (`real-world/blog/`)

完整的博客应用：
- ✅ 文章列表
- ✅ 文章详情
- ✅ 评论系统
- ✅ 用户认证
- ✅ Markdown 编辑器

**难度**: ⭐⭐⭐

[查看代码](./real-world/blog/) | [在线演示](https://ldesign.github.io/engine/examples/blog/)

## 🎯 按功能查找

### 状态管理
- [基础使用](./basic-usage/)
- [状态管理](./state-management/)
- [Todo 应用](./real-world/todo-app/)

### 事件系统
- [基础使用](./basic-usage/)
- [中间件系统](./middleware-demo/)

### 插件系统
- [插件开发](./plugin-development/)
- [异步插件](./plugin-development/async-plugin/)

### 性能优化
- [性能优化](./performance-optimization/)
- [虚拟滚动](./performance-optimization/virtual-scroll/)
- [Worker 池](./performance-optimization/worker-pool/)

### 微前端
- [微前端架构](./micro-frontend/)
- [主应用](./micro-frontend/main-app/)
- [子应用](./micro-frontend/sub-app/)

### DevTools
- [DevTools 集成](./devtools-integration/)
- [性能分析](./devtools-integration/performance/)

## 📖 学习路径

### 初学者路径
1. ✅ [基础使用](./basic-usage/) - 了解基本概念
2. ✅ [Vue 集成](./vue-integration/) - 在 Vue 中使用
3. ✅ [Todo 应用](./real-world/todo-app/) - 实战练习

### 进阶路径
1. ✅ [插件开发](./plugin-development/) - 扩展功能
2. ✅ [中间件系统](./middleware-demo/) - 处理横切关注点
3. ✅ [状态管理](./state-management/) - 复杂状态管理
4. ✅ [仪表板](./real-world/dashboard/) - 综合应用

### 高级路径
1. ✅ [性能优化](./performance-optimization/) - 性能调优
2. ✅ [微前端架构](./micro-frontend/) - 大型应用架构
3. ✅ [DevTools 集成](./devtools-integration/) - 开发工具
4. ✅ [博客系统](./real-world/blog/) - 完整项目

## 💡 贡献示例

欢迎贡献新的示例！请遵循以下步骤：

1. **Fork 项目**
2. **创建示例目录**
   ```bash
   mkdir examples/your-example
   cd examples/your-example
   ```

3. **编写代码和文档**
   - 添加 `README.md` 说明
   - 编写清晰的代码注释
   - 提供运行说明

4. **提交 PR**
   - 描述示例的用途
   - 说明演示的功能
   - 标注难度等级

## 📝 示例模板

```typescript
/**
 * 示例标题
 * 
 * 功能说明：
 * - 功能1
 * - 功能2
 * - 功能3
 * 
 * 学习目标：
 * - 了解XXX
 * - 掌握YYY
 * 
 * 相关文档：
 * - 文档链接1
 * - 文档链接2
 */

import { createEngine } from '@ldesign/engine'

// 示例代码...
```

## 🔗 相关资源

- 📖 [完整文档](https://ldesign.github.io/engine/)
- 🚀 [快速开始](/guide/quick-start)
- 📘 [API 参考](/api/)
- 💬 [讨论区](https://github.com/ldesign/engine/discussions)

## ❓ 常见问题

### 如何运行特定示例？

```bash
# 进入示例目录
cd examples/basic-usage

# 安装依赖（如果需要）
pnpm install

# 运行
pnpm run dev
```

### 示例中使用的版本？

所有示例都使用最新版本的 `@ldesign/engine`。

### 可以在生产环境使用这些代码吗？

示例代码主要用于学习和演示。在生产环境使用前，请根据实际需求进行调整和优化。

### 如何获取帮助？

- 📖 查看 [文档](https://ldesign.github.io/engine/)
- 💬 在 [Discussions](https://github.com/ldesign/engine/discussions) 提问
- 🐛 报告 [Issues](https://github.com/ldesign/engine/issues)

---

**祝学习愉快！** 🎉

如果这些示例对你有帮助，请给我们一个 ⭐️


