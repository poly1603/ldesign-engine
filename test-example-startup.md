# Example 启动测试指南

## 测试步骤

请按照以下顺序逐个测试每个框架的 example：

### 1. React Example
```powershell
cd packages\engine\packages\react\example
pnpm dev
```
等待启动完成后，记录 URL（通常是 http://localhost:5173）

### 2. Vue Example
```powershell
cd packages\engine\packages\vue\example
pnpm dev
```

### 3. Svelte Example
```powershell
cd packages\engine\packages\svelte\example
pnpm dev
```

### 4. Solid Example
```powershell
cd packages\engine\packages\solid\example
pnpm dev
```

### 5. Lit Example
```powershell
cd packages\engine\packages\lit\example
pnpm dev
```

### 6. Preact Example
```powershell
cd packages\engine\packages\preact\example
pnpm dev
```

### 7. Alpine.js Example
```powershell
cd packages\engine\packages\alpinejs\example
pnpm dev
```

### 8. Angular Example
```powershell
cd packages\engine\packages\angular\example
pnpm dev
```

### 9. Astro Example
```powershell
cd packages\engine\packages\astro\example
pnpm dev
```

### 10. Remix Example
```powershell
cd packages\engine\packages\remix\example
pnpm dev
```

### 11. SvelteKit Example
```powershell
cd packages\engine\packages\sveltekit\example
pnpm dev
```

### 12. Next.js Example
```powershell
cd packages\engine\packages\nextjs\example
pnpm dev
```

### 13. Nuxt.js Example
```powershell
cd packages\engine\packages\nuxtjs\example
pnpm dev
```

## 浏览器验证清单

对于每个成功启动的 example，在浏览器中检查：

- [ ] 页面是否正常加载（无白屏、无错误）
- [ ] 控制台是否有 Engine 相关的日志输出
  - `[Plugin] Logging plugin installed`
  - `[Middleware] Auth middleware executing`
  - `✅ Engine ready!`
  - `✅ App mounted!`
  - `🚀 [Framework] Engine App started successfully!`
- [ ] 页面是否显示预期的内容

## 测试结果记录

| 框架 | 启动状态 | URL | 页面加载 | 控制台日志 | 备注 |
|------|---------|-----|---------|-----------|------|
| React | | | | | |
| Vue | | | | | |
| Svelte | | | | | |
| Solid | | | | | |
| Lit | | | | | |
| Preact | | | | | |
| Alpine.js | | | | | |
| Angular | | | | | |
| Astro | | | | | |
| Remix | | | | | |
| SvelteKit | | | | | |
| Next.js | | | | | |
| Nuxt.js | | | | | |

