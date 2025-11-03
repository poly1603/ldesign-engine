# Framework Example 测试指南

## 📋 测试前准备

### 构建状态确认

以下框架适配包已成功构建，可以进行 example 测试：

| 框架 | 构建状态 | 耗时 |
|------|---------|------|
| ✅ React | 成功 | 20.77s |
| ✅ Vue | 成功 | 16.89s |
| ✅ Svelte | 成功 | 35.73s |
| ✅ Solid | 成功 | 19.79s |
| ✅ Lit | 成功 | 16.20s |
| ✅ Preact | 成功 | 15.92s |
| ✅ Alpine.js | 成功 | 7.01s |
| ✅ Angular | 成功 | 20.75s |
| ✅ Astro | 成功 | 6.51s |
| ✅ Remix | 成功 | 19.68s |
| ✅ SvelteKit | 成功 | 19.31s |
| ✅ Next.js | 成功 | 17.67s |
| ✅ Nuxt.js | 成功 | 12.91s |
| ❌ Qwik | 失败 | - |

**总计：13/14 框架构建成功**

## 🧪 测试步骤

### 方法 1：逐个手动测试（推荐）

对于每个框架，按照以下步骤测试：

#### 1. React Example

```powershell
# 进入目录
cd d:\WorkBench\ldesign\packages\engine\packages\react\example

# 启动开发服务器
pnpm dev

# 等待启动完成，会显示类似：
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
```

**浏览器验证：**
1. 打开浏览器访问显示的 URL（通常是 http://localhost:5173）
2. 检查页面是否正常加载
3. 打开浏览器控制台（F12），检查是否有以下日志：
   - `[Plugin] Logging plugin installed`
   - `[Middleware] Auth middleware executing`
   - `✅ Engine ready!`
   - `✅ App mounted!`
   - `🚀 [React] Engine App started successfully!`
4. 检查页面是否显示预期内容
5. 按 `Ctrl+C` 停止服务器

#### 2. Vue Example

```powershell
cd d:\WorkBench\ldesign\packages\engine\packages\vue\example
pnpm dev
```

**浏览器验证：** 同上，检查日志中的框架名称应为 `[Vue]`

#### 3. Svelte Example

```powershell
cd d:\WorkBench\ldesign\packages\engine\packages\svelte\example
pnpm dev
```

**浏览器验证：** 同上，检查日志中的框架名称应为 `[Svelte]`

#### 4. Solid Example

```powershell
cd d:\WorkBench\ldesign\packages\engine\packages\solid\example
pnpm dev
```

**浏览器验证：** 同上，检查日志中的框架名称应为 `[Solid]`

#### 5. Lit Example

```powershell
cd d:\WorkBench\ldesign\packages\engine\packages\lit\example
pnpm dev
```

**浏览器验证：** 同上，检查日志中的框架名称应为 `[Lit]`

#### 6. Preact Example

```powershell
cd d:\WorkBench\ldesign\packages\engine\packages\preact\example
pnpm dev
```

**浏览器验证：** 同上，检查日志中的框架名称应为 `[Preact]`

#### 7. Alpine.js Example

```powershell
cd d:\WorkBench\ldesign\packages\engine\packages\alpinejs\example
pnpm dev
```

**浏览器验证：** 同上，检查日志中的框架名称应为 `[Alpine.js]`

#### 8. Angular Example

```powershell
cd d:\WorkBench\ldesign\packages\engine\packages\angular\example
pnpm dev
```

**浏览器验证：** 同上，检查日志中的框架名称应为 `[Angular]`

#### 9. Astro Example

```powershell
cd d:\WorkBench\ldesign\packages\engine\packages\astro\example
pnpm dev
```

**浏览器验证：** 同上，检查日志中的框架名称应为 `[Astro]`

#### 10. Remix Example

```powershell
cd d:\WorkBench\ldesign\packages\engine\packages\remix\example
pnpm dev
```

**浏览器验证：** 同上，检查日志中的框架名称应为 `[Remix]`

#### 11. SvelteKit Example

```powershell
cd d:\WorkBench\ldesign\packages\engine\packages\sveltekit\example
pnpm dev
```

**浏览器验证：** 同上，检查日志中的框架名称应为 `[SvelteKit]`

#### 12. Next.js Example

```powershell
cd d:\WorkBench\ldesign\packages\engine\packages\nextjs\example
pnpm dev
```

**浏览器验证：** 同上，检查日志中的框架名称应为 `[Next.js]`

#### 13. Nuxt.js Example

```powershell
cd d:\WorkBench\ldesign\packages\engine\packages\nuxtjs\example
pnpm dev
```

**浏览器验证：** 同上，检查日志中的框架名称应为 `[Nuxt.js]`

### 方法 2：使用快捷脚本

我已经为每个框架创建了快捷启动脚本（如果需要）。

## 📊 测试结果记录表

请在测试时填写以下表格：

| 框架 | 启动状态 | URL | 页面加载 | 控制台日志 | 备注 |
|------|---------|-----|---------|-----------|------|
| React | ⬜ | | ⬜ | ⬜ | |
| Vue | ⬜ | | ⬜ | ⬜ | |
| Svelte | ⬜ | | ⬜ | ⬜ | |
| Solid | ⬜ | | ⬜ | ⬜ | |
| Lit | ⬜ | | ⬜ | ⬜ | |
| Preact | ⬜ | | ⬜ | ⬜ | |
| Alpine.js | ⬜ | | ⬜ | ⬜ | |
| Angular | ⬜ | | ⬜ | ⬜ | |
| Astro | ⬜ | | ⬜ | ⬜ | |
| Remix | ⬜ | | ⬜ | ⬜ | |
| SvelteKit | ⬜ | | ⬜ | ⬜ | |
| Next.js | ⬜ | | ⬜ | ⬜ | |
| Nuxt.js | ⬜ | | ⬜ | ⬜ | |

**图例：**
- ⬜ 未测试
- ✅ 成功
- ❌ 失败
- ⚠️ 部分成功

## 🔍 常见问题排查

### 问题 1：启动时报错 "找不到模块"

**解决方案：**
```powershell
# 重新安装依赖
pnpm install
```

### 问题 2：端口被占用

**解决方案：**
```powershell
# 查找占用端口的进程
netstat -ano | findstr :5173

# 结束进程（替换 PID 为实际的进程 ID）
taskkill /PID <PID> /F
```

### 问题 3：页面白屏或报错

**检查项：**
1. 浏览器控制台是否有错误信息
2. 网络请求是否正常
3. 框架适配包是否正确构建

### 问题 4：控制台没有 Engine 日志

**可能原因：**
1. Engine 初始化失败
2. 插件或中间件配置错误
3. 框架适配器实现问题

## 📝 测试完成后

测试完成后，请：

1. 统计成功/失败的框架数量
2. 记录所有失败的详细错误信息
3. 如有问题，提供：
   - 框架名称
   - 错误信息
   - 浏览器控制台截图
   - 终端输出

## 🎯 预期结果

所有 13 个成功构建的框架 example 都应该能够：
- ✅ 正常启动开发服务器
- ✅ 在浏览器中正常加载页面
- ✅ 在控制台显示 Engine 相关日志
- ✅ 显示预期的页面内容

## 🐛 已知问题

### Qwik 框架
- **状态：** 构建失败
- **错误：** `You must specify "output.file" or "output.dir" for the build`
- **影响：** 无法测试 Qwik example
- **待修复：** 需要修复 Qwik 的构建配置

