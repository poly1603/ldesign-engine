# @ldesign/builder 配置改进说明

## 📝 改进概述

优化了 `@ldesign/builder` 的配置方式,使其能够从配置文件中自动读取 DTS 生成选项,无需在命令行传递参数。

## 🔄 改进前后对比

### 改进前

**builder.config.ts**:
```typescript
export default defineConfig({
  libraryType: 'typescript',
  input: 'src/index.ts',
  
  output: {
    esm: {
      dir: 'es',
      format: 'esm',
      preserveStructure: true,
      dts: true,
      sourcemap: true,
    },
    cjs: {
      dir: 'lib',
      format: 'cjs',
      preserveStructure: true,
      dts: true,
      sourcemap: true,
    },
    umd: {
      dir: 'dist',
      format: 'umd',
      name: 'LDesignEngineCore',
      minify: true,
      sourcemap: true,
      input: 'src/index.ts',
    },
  },
  
  typescript: {
    tsconfig: './tsconfig.json',
    target: 'es2020',
  },
  
  dts: true,
  sourcemap: true,
  clean: true,
})
```

**package.json**:
```json
{
  "scripts": {
    "build": "ldesign-builder build -f esm,cjs,dts"
  }
}
```

**问题**:
- ❌ 配置冗余:很多选项都是默认值,不需要显式配置
- ❌ 命令行参数:需要在 `package.json` 中传递 `-f esm,cjs,dts` 参数
- ❌ 配置分散:DTS 生成既在配置文件中配置,又需要命令行参数
- ❌ 不够直观:新用户不知道需要传递 `-f dts` 参数

### 改进后

**builder.config.ts**:
```typescript
export default defineConfig({
  output: {
    esm: {
      dir: 'es',
      preserveStructure: true,
      dts: true,
    },
    cjs: {
      dir: 'lib',
      preserveStructure: true,
      dts: true,
    },
    umd: {
      dir: 'dist',
      name: 'LDesignEngineCore',
      minify: true,
      input: 'src/index.ts',
    },
  },
})
```

**package.json**:
```json
{
  "scripts": {
    "build": "ldesign-builder build"
  }
}
```

**优势**:
- ✅ 配置简洁:只保留必要的配置项
- ✅ 无需参数:不需要在命令行传递 `-f` 参数
- ✅ 配置集中:所有配置都在 `builder.config.ts` 中
- ✅ 更加直观:一眼就能看出会生成哪些格式和类型声明

## 🔧 技术实现

### 修改的文件

**tools/builder/src/cli/commands/build.ts**

#### 1. 检测 DTS 配置

```typescript
// 改进前:只从命令行读取
const originalFormats = options.format ? options.format.split(',').map(f => f.trim()) : []
const hasDts = originalFormats.includes('dts') || originalFormats.includes('declaration') || originalFormats.includes('types')

// 改进后:同时从命令行和配置文件读取
const originalFormats = options.format ? options.format.split(',').map(f => f.trim()) : []
const hasDtsFromCli = originalFormats.includes('dts') || originalFormats.includes('declaration') || originalFormats.includes('types')

// 检查配置文件中是否启用了 dts
const hasDtsFromConfig = config.dts === true || 
  (config.output?.esm && typeof config.output.esm === 'object' && config.output.esm.dts === true) ||
  (config.output?.cjs && typeof config.output.cjs === 'object' && config.output.cjs.dts === true)

const hasDts = hasDtsFromCli || hasDtsFromConfig
```

#### 2. 智能确定输出目录

```typescript
// 改进前:固定为 es 和 lib
const outputDirs = []
if (formats.includes('esm')) outputDirs.push('es')
if (formats.includes('cjs')) outputDirs.push('lib')

// 改进后:根据配置动态确定
const outputDirs: string[] = []

// 检查 ESM 格式
if (formats.includes('esm') || (config.output?.esm && typeof config.output.esm === 'object')) {
  const esmConfig = typeof config.output?.esm === 'object' ? config.output.esm : null
  const esmDir = esmConfig?.dir || 'es'
  const esmDts = esmConfig?.dts !== false // 默认为 true,除非显式设置为 false
  if (esmDts) {
    outputDirs.push(esmDir)
  }
}

// 检查 CJS 格式
if (formats.includes('cjs') || (config.output?.cjs && typeof config.output.cjs === 'object')) {
  const cjsConfig = typeof config.output?.cjs === 'object' ? config.output.cjs : null
  const cjsDir = cjsConfig?.dir || 'lib'
  const cjsDts = cjsConfig?.dts !== false // 默认为 true,除非显式设置为 false
  if (cjsDts) {
    outputDirs.push(cjsDir)
  }
}
```

## 📊 配置优先级

DTS 生成的配置优先级(从高到低):

1. **命令行参数**: `ldesign-builder build -f esm,cjs,dts`
2. **格式级配置**: `output.esm.dts` 或 `output.cjs.dts`
3. **顶层配置**: `dts: true`
4. **默认行为**: 如果配置了 `output.esm` 或 `output.cjs`,默认生成 DTS

## 🎯 使用建议

### 推荐配置(最简洁)

```typescript
export default defineConfig({
  output: {
    esm: {
      dir: 'es',
      preserveStructure: true,
      dts: true,
    },
    cjs: {
      dir: 'lib',
      preserveStructure: true,
      dts: true,
    },
    umd: {
      dir: 'dist',
      name: 'MyLibrary',
      minify: true,
      input: 'src/index.ts',
    },
  },
})
```

### 禁用某个格式的 DTS

```typescript
export default defineConfig({
  output: {
    esm: {
      dir: 'es',
      preserveStructure: true,
      dts: true,  // 生成 DTS
    },
    cjs: {
      dir: 'lib',
      preserveStructure: true,
      dts: false,  // 不生成 DTS
    },
  },
})
```

### 自定义输出目录

```typescript
export default defineConfig({
  output: {
    esm: {
      dir: 'dist/esm',  // 自定义目录
      preserveStructure: true,
      dts: true,
    },
    cjs: {
      dir: 'dist/cjs',  // 自定义目录
      preserveStructure: true,
      dts: true,
    },
  },
})
```

## ✅ 验证结果

### 构建输出

```bash
> ldesign-builder build

📦 入口: src/index.ts | 格式: esm+cjs | 模式: production
🔨 开始打包...
📝 生成类型声明文件...
✅ 已生成 23 个声明文件到 es/
✅ 已生成 23 个声明文件到 lib/

✓ 构建成功
⏱  耗时: 9.23s
📦 文件: 276 个
```

### 文件结构

```
packages/engine/packages/core/
├── es/
│   ├── index.js
│   ├── index.d.ts        ✅ 自动生成
│   ├── index.js.map
│   └── index.d.ts.map
├── lib/
│   ├── index.cjs
│   ├── index.d.ts        ✅ 自动生成
│   ├── index.cjs.map
│   └── index.d.ts.map
└── dist/
    ├── index.js
    ├── index.min.js
    └── index.min.js.map
```

## 🚀 迁移指南

如果你的项目使用旧的配置方式,可以按以下步骤迁移:

### 步骤 1: 简化 builder.config.ts

移除不必要的配置项:
- ❌ `libraryType` (自动检测)
- ❌ `input` (自动检测)
- ❌ `typescript` (使用默认值)
- ❌ 顶层 `dts` (移到 output 中)
- ❌ 顶层 `sourcemap` (使用默认值)
- ❌ 顶层 `clean` (使用默认值)

### 步骤 2: 更新 package.json

```diff
{
  "scripts": {
-   "build": "ldesign-builder build -f esm,cjs,dts"
+   "build": "ldesign-builder build"
  }
}
```

### 步骤 3: 测试构建

```bash
pnpm build
```

确保:
- ✅ ESM 和 CJS 格式都正常生成
- ✅ 类型声明文件 (.d.ts) 正常生成
- ✅ Source maps 正常生成
- ✅ 所有测试通过

---

**更新时间**: 2025-11-03  
**影响范围**: @ldesign/builder v1.0.0+  
**向后兼容**: ✅ 完全兼容旧的配置方式

