# Script to create missing examples for engine framework adapters
# This script creates example projects for all frameworks that don't have them yet

$ErrorActionPreference = "Stop"

$baseDir = $PSScriptRoot
$packagesDir = Join-Path $baseDir "packages"

# Framework configurations
$frameworks = @(
    @{
        Name = "nextjs"
        DisplayName = "Next.js"
        Port = 5102
        MountElement = $null  # Next.js doesn't use mount element
        HasSSR = $true
    },
    @{
        Name = "sveltekit"
        DisplayName = "SvelteKit"
        Port = 5103
        MountElement = $null  # SvelteKit doesn't use mount element
        HasSSR = $true
    },
    @{
        Name = "nuxtjs"
        DisplayName = "Nuxt.js"
        Port = 5104
        MountElement = $null  # Nuxt.js doesn't use mount element
        HasSSR = $true
    },
    @{
        Name = "remix"
        DisplayName = "Remix"
        Port = 5105
        MountElement = $null  # Remix doesn't use mount element
        HasSSR = $true
    },
    @{
        Name = "qwik"
        DisplayName = "Qwik"
        Port = 5106
        MountElement = "#root"
        HasSSR = $true
    },
    @{
        Name = "astro"
        DisplayName = "Astro"
        Port = 5107
        MountElement = "#app"
        HasSSR = $true
    },
    @{
        Name = "angular"
        DisplayName = "Angular"
        Port = 5108
        MountElement = "#app"
        HasSSR = $false
    },
    @{
        Name = "alpinejs"
        DisplayName = "Alpine.js"
        Port = 5109
        MountElement = "#app"
        HasSSR = $false
    }
)

function Create-Example {
    param(
        [string]$FrameworkName,
        [string]$DisplayName,
        [int]$Port,
        [string]$MountElement,
        [bool]$HasSSR
    )
    
    $exampleDir = Join-Path (Join-Path $packagesDir $FrameworkName) "example"
    
    # Check if example already exists
    if (Test-Path $exampleDir) {
        Write-Host "✓ Example already exists for $DisplayName at $exampleDir" -ForegroundColor Green
        return
    }
    
    Write-Host "Creating example for $DisplayName..." -ForegroundColor Cyan
    
    # Create directory structure
    New-Item -ItemType Directory -Path $exampleDir -Force | Out-Null
    $srcDir = Join-Path $exampleDir "src"
    New-Item -ItemType Directory -Path $srcDir -Force | Out-Null
    
    # Create package.json
    $packageJson = @"
{
  "name": "@ldesign/engine-$FrameworkName-example",
  "version": "0.2.0",
  "type": "module",
  "private": true,
  "description": "$DisplayName Engine 示例项目 - 演示 createEngineApp 的使用",
  "scripts": {
    "dev": "launcher dev",
    "build": "launcher build",
    "preview": "launcher preview"
  },
  "dependencies": {
    "@ldesign/engine-core": "workspace:*",
    "@ldesign/engine-$FrameworkName": "workspace:*"
  },
  "devDependencies": {
    "@ldesign/launcher": "workspace:*",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
"@
    Set-Content -Path (Join-Path $exampleDir "package.json") -Value $packageJson
    
    # Create launcher.config.ts
    $launcherConfig = @"
import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: '$FrameworkName'
  },
  
  server: {
    host: '0.0.0.0',
    port: $Port,
    open: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
"@
    Set-Content -Path (Join-Path $exampleDir "launcher.config.ts") -Value $launcherConfig
    
    # Create tsconfig.json
    $tsconfig = @"
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
"@
    Set-Content -Path (Join-Path $exampleDir "tsconfig.json") -Value $tsconfig
    
    # Create README.md
    $readme = @"
# $DisplayName Engine Example

This example demonstrates the usage of ``@ldesign/engine-$FrameworkName`` with the unified ``createEngineApp`` API.

## Features

- ✅ Unified Engine API
- ✅ Plugin System
- ✅ Middleware Support
- ✅ Lifecycle Hooks
- ✅ State Management
- ✅ Event Bus
$(if ($HasSSR) { "- ✅ SSR Support" })

## Quick Start

\`\`\`bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
\`\`\`

## Usage

See ``src/main.ts`` for the complete example of how to use ``createEngineApp`` with $DisplayName.

## API Reference

For more details, see the [@ldesign/engine-$FrameworkName documentation](../../README.md).
"@
    Set-Content -Path (Join-Path $exampleDir "README.md") -Value $readme
    
    # Create index.html
    $indexHtml = @"
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>$DisplayName Engine Example - createEngineApp</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
"@
    Set-Content -Path (Join-Path $exampleDir "index.html") -Value $indexHtml
    
    # Create main.ts based on framework type
    $mountCode = if ($MountElement) { "      mountElement: '$MountElement'," } else { "      // Note: $DisplayName manages mounting internally" }
    
    $mainTs = @"
/**
 * $DisplayName Engine 示例 - 演示 createEngineApp 的使用
 */

import { createEngineApp } from '@ldesign/engine-$FrameworkName'
import type { Plugin, Middleware } from '@ldesign/engine-core'
import './style.css'

// 示例插件
const loggingPlugin: Plugin = {
  name: 'logging-plugin',
  version: '1.0.0',
  install(engine) {
    console.log('[Plugin] Logging plugin installed')
    
    // 监听状态变化
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
$mountCode
      config: {
        debug: true,
      },
      plugins: [loggingPlugin],
      middleware: [authMiddleware],
      onReady: async (engine) => {
        console.log('✅ Engine ready!')
        
        // 设置初始状态
        engine.state.set('appName', '$DisplayName Engine Example')
        engine.state.set('version', '0.2.0')
      },
      onMounted: async (engine) => {
        console.log('✅ App mounted!')
        
        // 发送自定义事件
        engine.events.emit('app:mounted', { timestamp: Date.now() })
      },
      onError: (error, context) => {
        console.error(``❌ Error in `${context}`:``, error)
      }
    })

    // 暴露到全局以便调试
    ;(window as any).__ENGINE__ = engine

    console.log('🚀 $DisplayName Engine App started successfully!')
  } catch (error) {
    console.error('Failed to start app:', error)
  }
}

bootstrap()
"@
    Set-Content -Path (Join-Path $srcDir "main.ts") -Value $mainTs
    
    # Create style.css
    $styleCss = @"
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
  margin-bottom: 0.5em;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  button {
    background-color: #f9f9f9;
  }
}
"@
    Set-Content -Path (Join-Path $srcDir "style.css") -Value $styleCss
    
    Write-Host "✓ Created example for $DisplayName" -ForegroundColor Green
}

# Create examples for each framework
foreach ($fw in $frameworks) {
    Create-Example `
        -FrameworkName $fw.Name `
        -DisplayName $fw.DisplayName `
        -Port $fw.Port `
        -MountElement $fw.MountElement `
        -HasSSR $fw.HasSSR
}

Write-Host "`n✨ All examples created successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run 'pnpm install' in the root directory"
Write-Host "2. Test each example with 'pnpm dev' in their respective directories"
