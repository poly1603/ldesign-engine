# Testing Guide - All Framework Examples

## 🎯 Quick Test (5 minutes)

### 1. Install Dependencies
```bash
cd D:\WorkBench\ldesign
pnpm install
```

### 2. Verify All Examples
```bash
cd packages\engine
.\test-all-examples.ps1
```

Expected: `✅ Success: 14, ❌ Errors: 0`

### 3. Test One Example

```bash
# Choose any framework
cd packages\engine\packages\react\example
pnpm dev

# Open browser to: http://localhost:5101
```

## 📋 All Available Examples

| Framework | Path | Port | Command |
|-----------|------|------|---------|
| React | `packages\react\example` | 5101 | `cd packages\engine\packages\react\example && pnpm dev` |
| Vue | `packages\vue\example` | 5100 | `cd packages\engine\packages\vue\example && pnpm dev` |
| Svelte | `packages\svelte\example` | 5099 | `cd packages\engine\packages\svelte\example && pnpm dev` |
| Solid | `packages\solid\example` | 5098 | `cd packages\engine\packages\solid\example && pnpm dev` |
| Preact | `packages\preact\example` | 5097 | `cd packages\engine\packages\preact\example && pnpm dev` |
| Lit | `packages\lit\example` | 5096 | `cd packages\engine\packages\lit\example && pnpm dev` |
| Next.js | `packages\nextjs\example` | 5102 | `cd packages\engine\packages\nextjs\example && pnpm dev` |
| SvelteKit | `packages\sveltekit\example` | 5103 | `cd packages\engine\packages\sveltekit\example && pnpm dev` |
| Nuxt.js | `packages\nuxtjs\example` | 5104 | `cd packages\engine\packages\nuxtjs\example && pnpm dev` |
| Remix | `packages\remix\example` | 5105 | `cd packages\engine\packages\remix\example && pnpm dev` |
| Qwik | `packages\qwik\example` | 5106 | `cd packages\engine\packages\qwik\example && pnpm dev` |
| Astro | `packages\astro\example` | 5107 | `cd packages\engine\packages\astro\example && pnpm dev` |
| Angular | `packages\angular\example` | 5108 | `cd packages\engine\packages\angular\example && pnpm dev` |
| Alpine.js | `packages\alpinejs\example` | 5109 | `cd packages\engine\packages\alpinejs\example && pnpm dev` |

## ✅ What You Should See

In the console:
```
[Plugin] Logging plugin installed
✅ Engine ready!
✅ App mounted!
🚀 [Framework] Engine App started successfully!
```

In the browser:
- 🚀 Engine Example header
- 📦 Core features section with test buttons
- 📊 Engine State display
- 📝 Event log showing activity

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill the process using the port (example for port 5101)
netstat -ano | findstr :5101
taskkill /PID [PID] /F
```

### Dependencies not found
```bash
# Reinstall from root
cd D:\WorkBench\ldesign
pnpm install --force
```

### Build errors
```bash
# Clean and rebuild
pnpm clean
pnpm install
```

## 📚 Documentation

- `EXAMPLES_COMPLETED.md` - Detailed documentation (English)
- `完成总结.md` - Summary (Chinese)
- Each example has its own `README.md`

## ✨ All Examples Are Ready!

Total: **14 frameworks**
Status: **100% complete**
All examples can be started and tested successfully!
