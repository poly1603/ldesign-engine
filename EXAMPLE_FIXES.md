# Engine Example 修复报告

本文档记录了对 `packages/engine` 下各框架适配器 example 项目的修复和改进。

## 修复概览

### ✅ 已修复的问题

1. **Vue2 Example** - 运行时构建警告
2. **Svelte Example** - Svelte 5 兼容性问题
3. **Angular Example** - JIT 编译错误
4. **Qwik** - 缺少 example 示例项目（已创建）
5. **Preact** - 缺少 example 示例项目（已创建）

---

## 详细修复说明

### 1. Vue2 Example 修复

**问题描述：**
```
[Vue warn]: You are using the runtime-only build of Vue where the template compiler is not available.
```

**原因分析：**
- Vue2 默认导入的是运行时版本，不包含模板编译器
- 使用 `.vue` 文件需要完整构建版本

**修复方案：**

1. 修改 `packages/engine/packages/vue2/example/src/main.ts`：
   ```typescript
   // 修改前
   import Vue from 'vue/dist/vue.esm.js'
   
   // 修改后
   import Vue from 'vue'
   ```

2. 修改 `packages/engine/packages/vue2/example/.ldesign/launcher.config.ts`：
   ```typescript
   resolve: {
     alias: {
       '@ldesign/engine-vue2': resolve(__dirname, '../../../vue2/src/index.ts'),
       '@ldesign/engine-core': resolve(__dirname, '../../../core/src/index.ts'),
       // 添加 Vue 完整构建版本别名
       'vue': 'vue/dist/vue.esm.js'
     }
   }
   ```

**测试验证：**
```bash
cd packages/engine/packages/vue2/example
pnpm dev
```

---

### 2. Svelte Example 修复

**问题描述：**
```
Error: Failed to mount Svelte component: component_api_invalid_new
Attempted to instantiate src/App.svelte with `new App`, which is no longer valid in Svelte 5.
```

**原因分析：**
- Svelte 5 改变了组件实例化方式
- 不再支持 `new Component()` 构造函数
- 需要使用 `mount()` 函数

**修复方案：**

修改 `packages/engine/packages/svelte/src/adapter.ts` 的 `mount` 方法：

```typescript
async mount(app: any, mountElement: string | Element): Promise<void> {
  const target = typeof mountElement === 'string'
    ? document.querySelector(mountElement)
    : mountElement

  if (!target) {
    throw new Error(`Mount element not found: ${mountElement}`)
  }

  const component = app.component
  const props = app.options.props || {}

  try {
    // 尝试导入 Svelte 5 的 mount 函数
    try {
      const { mount } = await import('svelte')
      // Svelte 5: 使用 mount() 函数
      mount(component, {
        target,
        props,
      })
    } catch (importError) {
      // Svelte 4: 使用构造函数方式
      new component({
        target,
        props,
      })
    }
  } catch (error) {
    throw new Error(`Failed to mount Svelte component: ${error instanceof Error ? error.message : String(error)}`)
  }
}
```

**测试验证：**
```bash
cd packages/engine/packages/svelte/example
pnpm dev
```

---

### 3. Angular Example 修复

**问题描述：**
```
Error: Errors during JIT compilation of template for AppComponent: 
Incomplete block "ldesign". If you meant to write the @ character, you should use the "&#64;" HTML entity instead.
```

**原因分析：**
- Angular 模板中 `@` 符号被解析为控制流语法
- 需要使用 HTML 实体 `&#64;` 来显示 `@` 字符

**修复方案：**

修改 `packages/engine/packages/angular/example/src/app/app.component.ts`：

```typescript
template: `
  <div class="app">
    <header class="header">
      <h1>🚀 Angular + LDesign Engine</h1>
      <!-- 修改前: @ldesign/engine-angular -->
      <!-- 修改后: &#64;ldesign/engine-angular -->
      <p>这是一个使用 &#64;ldesign/engine-angular 和 Angular 18 构建的示例项目</p>
    </header>
    
    <!-- ... -->
    
    <footer class="footer">
      <p>Powered by &#64;ldesign/engine-angular</p>
    </footer>
  </div>
`,
```

**测试验证：**
```bash
cd packages/engine/packages/angular/example
pnpm dev
```

---

### 4. Qwik Example 创建

**创建内容：**

新建了完整的 Qwik example 项目，包括：

```
packages/engine/packages/qwik/example/
├── .ldesign/
│   └── launcher.config.ts    # Launcher 配置
├── src/
│   ├── App.tsx               # 主应用组件
│   ├── App.css               # 应用样式
│   ├── main.tsx              # 入口文件
│   └── global.css            # 全局样式
├── index.html                # HTML 模板
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 项目文档
```

**特性：**
- ✅ 完整的 Qwik 引擎集成
- ✅ 插件系统演示
- ✅ 中间件系统演示
- ✅ TypeScript 支持
- ✅ 开发服务器配置（端口 5180）

**启动命令：**
```bash
cd packages/engine/packages/qwik/example
pnpm install
pnpm dev
```

---

### 5. Preact Example 创建

**创建内容：**

新建了完整的 Preact example 项目，包括：

```
packages/engine/packages/preact/example/
├── .ldesign/
│   └── launcher.config.ts    # Launcher 配置
├── src/
│   ├── App.tsx               # 主应用组件
│   ├── App.css               # 应用样式
│   ├── main.tsx              # 入口文件
│   └── global.css            # 全局样式
├── index.html                # HTML 模板
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 项目文档
```

**特性：**
- ✅ 完整的 Preact 引擎集成
- ✅ 插件系统演示
- ✅ 中间件系统演示
- ✅ TypeScript 支持
- ✅ 开发服务器配置（端口 5181）

**启动命令：**
```bash
cd packages/engine/packages/preact/example
pnpm install
pnpm dev
```

---

## 测试所有 Example

### 快速测试脚本

```bash
# Vue2
cd packages/engine/packages/vue2/example && pnpm dev

# Svelte
cd packages/engine/packages/svelte/example && pnpm dev

# Angular
cd packages/engine/packages/angular/example && pnpm dev

# Qwik
cd packages/engine/packages/qwik/example && pnpm dev

# Preact
cd packages/engine/packages/preact/example && pnpm dev
```

### 端口分配

| 框架 | 开发端口 | 预览端口 |
|------|---------|---------|
| React | 5175 | 4175 |
| Vue2 | 5176 | 4176 |
| Svelte | 5177 | 4177 |
| Solid | 5178 | 4178 |
| Angular | 5179 | 4179 |
| Qwik | 5180 | 4180 |
| Preact | 5181 | 4181 |

---

## 总结

### 修复统计

- ✅ 修复问题：3 个
- ✅ 新增项目：2 个
- ✅ 更新文件：5 个
- ✅ 新建文件：18 个

### 影响范围

所有修复都是向后兼容的，不会影响现有功能：

1. **Vue2** - 仅修改配置，保持 API 不变
2. **Svelte** - 同时支持 Svelte 4 和 Svelte 5
3. **Angular** - 仅修改模板显示，不影响功能
4. **Qwik** - 全新项目，无影响
5. **Preact** - 全新项目，无影响

### 后续建议

1. 为所有 example 添加自动化测试
2. 统一 example 项目的目录结构
3. 添加更多功能演示组件
4. 完善文档和注释

---

## 相关链接

- [Vue 2 文档](https://v2.vuejs.org/)
- [Svelte 5 迁移指南](https://svelte.dev/docs/v5-migration-guide)
- [Angular 模板语法](https://angular.io/guide/template-syntax)
- [Qwik 文档](https://qwik.builder.io/)
- [Preact 文档](https://preactjs.com/)

