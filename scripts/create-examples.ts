/**
 * 批量创建 Engine 示例项目的脚本
 * 
 * 使用方法:
 * pnpm tsx packages/engine/scripts/create-examples.ts
 */

import * as fs from 'fs'
import * as path from 'path'

interface FrameworkConfig {
  name: string
  displayName: string
  port: number
  launcherType: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  gradient: string
  color: string
  mountElement: string
  fileExtension: string
  needsRootComponent: boolean
}

const frameworks: FrameworkConfig[] = [
  {
    name: 'qwik',
    displayName: 'Qwik',
    port: 5106,
    launcherType: 'qwik',
    dependencies: {
      '@builder.io/qwik': '^1.4.0',
      '@builder.io/qwik-city': '^1.4.0'
    },
    devDependencies: {
      '@builder.io/qwik-vite': '^1.4.0'
    },
    gradient: 'linear-gradient(135deg, #18b6f6 0%, #ac7ff4 100%)',
    color: '#18b6f6',
    mountElement: '#app',
    fileExtension: 'tsx',
    needsRootComponent: false
  },
  {
    name: 'lit',
    displayName: 'Lit',
    port: 5107,
    launcherType: 'lit',
    dependencies: {
      'lit': '^3.1.0'
    },
    devDependencies: {},
    gradient: 'linear-gradient(135deg, #324fff 0%, #00e8ff 100%)',
    color: '#324fff',
    mountElement: '#app',
    fileExtension: 'ts',
    needsRootComponent: false
  },
  {
    name: 'alpinejs',
    displayName: 'AlpineJS',
    port: 5108,
    launcherType: 'alpinejs',
    dependencies: {
      'alpinejs': '^3.13.0'
    },
    devDependencies: {},
    gradient: 'linear-gradient(135deg, #8bc0d0 0%, #77c1d2 100%)',
    color: '#8bc0d0',
    mountElement: '#app',
    fileExtension: 'ts',
    needsRootComponent: false
  }
]

const ENGINE_ROOT = path.resolve(__dirname, '..')

function createPackageJson(config: FrameworkConfig): string {
  const deps = {
    [`${config.name}`]: config.dependencies[Object.keys(config.dependencies)[0]],
    '@ldesign/engine-core': 'workspace:*',
    [`@ldesign/engine-${config.name}`]: 'workspace:*',
    ...config.dependencies
  }
  
  const devDeps = {
    '@ldesign/launcher': 'workspace:*',
    'typescript': '^5.3.0',
    'vite': '^5.0.0',
    ...config.devDependencies
  }

  return JSON.stringify({
    name: `@ldesign/engine-${config.name}-example`,
    version: '0.2.0',
    type: 'module',
    private: true,
    description: `${config.displayName} Engine 示例项目 - 演示 createEngineApp 的使用`,
    scripts: {
      dev: 'launcher dev',
      build: 'launcher build',
      preview: 'launcher preview'
    },
    dependencies: deps,
    devDependencies: devDeps
  }, null, 2)
}

function createLauncherConfig(config: FrameworkConfig): string {
  return `import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: '${config.launcherType}',
    options: {}
  },
  
  server: {
    host: '0.0.0.0',
    port: ${config.port},
    open: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
`
}

function createIndexHtml(config: FrameworkConfig): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.displayName} Engine Example - createEngineApp</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.${config.fileExtension}"></script>
  </body>
</html>
`
}

function createMainTs(config: FrameworkConfig): string {
  const rootComponentLine = config.needsRootComponent 
    ? `import App from './App'\n` 
    : ''
  
  const rootComponentOption = config.needsRootComponent
    ? `      rootComponent: App,\n`
    : ''

  return `/**
 * ${config.displayName} Engine 示例 - 演示 createEngineApp 的使用
 */

import { createEngineApp } from '@ldesign/engine-${config.name}'
import type { Plugin, Middleware } from '@ldesign/engine-core'
${rootComponentLine}import './style.css'

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
${rootComponentOption}      mountElement: '${config.mountElement}',
      config: {
        debug: true,
      },
      plugins: [loggingPlugin],
      middleware: [authMiddleware],
      onReady: async (engine) => {
        console.log('✅ Engine ready!')
        
        // 设置初始状态
        engine.state.set('appName', '${config.displayName} Engine Example')
        engine.state.set('version', '0.2.0')
      },
      onMounted: async (engine) => {
        console.log('✅ App mounted!')
        
        // 发送自定义事件
        engine.events.emit('app:mounted', { timestamp: Date.now() })
      },
      onError: (error, context) => {
        console.error(\`❌ Error in \${context}:\`, error)
      }
    })

    // 暴露到全局以便调试
    ;(window as any).__ENGINE__ = engine

    console.log('🚀 ${config.displayName} Engine App started successfully!')
  } catch (error) {
    console.error('Failed to start app:', error)
  }
}

bootstrap()
`
}

function createStyleCss(): string {
  return `:root {
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

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
}
`
}

function createReadme(config: FrameworkConfig): string {
  return `# ${config.displayName} Engine Example

这是一个演示 \`@ldesign/engine-${config.name}\` 中 \`createEngineApp\` 统一 API 的示例项目。

## 运行示例

### 安装依赖
\`\`\`bash
pnpm install
\`\`\`

### 启动开发服务器
\`\`\`bash
pnpm dev
\`\`\`

访问 http://localhost:${config.port}

### 构建生产版本
\`\`\`bash
pnpm build
\`\`\`

### 预览生产构建
\`\`\`bash
pnpm preview
\`\`\`

## 了解更多

- [${config.displayName} Engine 文档](../../README.md)
- [统一 API 文档](../../../UNIFIED_API.md)
- [Engine Core 文档](../../core/README.md)
`
}

function createExample(config: FrameworkConfig) {
  const exampleDir = path.join(ENGINE_ROOT, 'packages', config.name, 'example')
  const srcDir = path.join(exampleDir, 'src')

  // 创建目录
  if (!fs.existsSync(exampleDir)) {
    fs.mkdirSync(exampleDir, { recursive: true })
  }
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true })
  }

  // 创建文件
  fs.writeFileSync(path.join(exampleDir, 'package.json'), createPackageJson(config))
  fs.writeFileSync(path.join(exampleDir, 'launcher.config.ts'), createLauncherConfig(config))
  fs.writeFileSync(path.join(exampleDir, 'index.html'), createIndexHtml(config))
  fs.writeFileSync(path.join(srcDir, `main.${config.fileExtension}`), createMainTs(config))
  fs.writeFileSync(path.join(srcDir, 'style.css'), createStyleCss())
  fs.writeFileSync(path.join(exampleDir, 'README.md'), createReadme(config))

  console.log(`✅ Created example for ${config.displayName}`)
}

// 主函数
function main() {
  console.log('🚀 Creating Engine examples...\n')

  for (const config of frameworks) {
    try {
      createExample(config)
    } catch (error) {
      console.error(`❌ Failed to create example for ${config.displayName}:`, error)
    }
  }

  console.log('\n✨ Done! All examples created.')
  console.log('\n📝 Note: Some frameworks may need additional manual configuration.')
}

main()

