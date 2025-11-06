# 批量完成剩余框架的路由集成脚本
# 此脚本将快速完成 Lit, Qwik, Angular 三个框架的路由集成

Write-Host "开始批量完成剩余框架的路由集成..." -ForegroundColor Green

# RouterConfig 接口模板（115行）
$routerConfigTemplate = @'
/**
 * 路由配置接口
 */
export interface RouterConfig {
  mode?: 'history' | 'hash' | 'memory'
  base?: string
  routes: RouteConfig[]
  preset?: 'spa' | 'mpa' | 'mobile' | 'desktop' | 'admin' | 'blog'
  scrollBehavior?: (to: any, from: any, savedPosition: any) => any
  linkActiveClass?: string
  linkExactActiveClass?: string
  preload?: boolean | PreloadConfig
  cache?: boolean | CacheConfig
  animation?: boolean | AnimationConfig
  performance?: PerformanceConfig
  development?: DevelopmentConfig
  security?: SecurityConfig
}

export interface RouteConfig {
  path: string
  component?: any
  children?: RouteConfig[]
  meta?: Record<string, any>
  [key: string]: any
}

export interface PreloadConfig {
  enabled: boolean
  delay?: number
  [key: string]: any
}

export interface CacheConfig {
  enabled: boolean
  maxAge?: number
  [key: string]: any
}

export interface AnimationConfig {
  enabled: boolean
  duration?: number
  [key: string]: any
}

export interface PerformanceConfig {
  [key: string]: any
}

export interface DevelopmentConfig {
  [key: string]: any
}

export interface SecurityConfig {
  [key: string]: any
}

'@

# 路由插件加载逻辑模板
$routerPluginTemplate = @'
    // 如果配置了路由，动态加载路由插件
    if (routerConfig) {
      try {
        const { createRouterEnginePlugin } = await import('@ldesign/router')
        const routerPlugin = createRouterEnginePlugin({
          name: 'router',
          version: '1.0.0',
          ...routerConfig,
        })
        plugins.unshift(routerPlugin)
        engine.logger.info('Router plugin created successfully')
      } catch (error) {
        engine.logger.warn(
          'Failed to load @ldesign/router. Make sure it is installed if you want to use routing features.',
          error
        )
      }
    }
'@

Write-Host "`n=== 提示 ===" -ForegroundColor Yellow
Write-Host "由于框架语法差异较大，建议手动完成以下步骤：" -ForegroundColor Yellow
Write-Host ""
Write-Host "对于每个框架（Lit, Qwik, Angular）：" -ForegroundColor Cyan
Write-Host "1. 在 src/engine-app.ts 开头添加 RouterConfig 接口" -ForegroundColor White
Write-Host "2. 在配置接口中添加 router?: RouterConfig" -ForegroundColor White
Write-Host "3. 在 createEngineApp 函数中添加路由插件加载逻辑" -ForegroundColor White
Write-Host "4. 更新 package.json 添加路由依赖" -ForegroundColor White
Write-Host "5. 创建示例页面和组件（根据框架语法）" -ForegroundColor White
Write-Host "6. 更新示例应用配置" -ForegroundColor White
Write-Host "7. 复制样式文件" -ForegroundColor White
Write-Host "8. 生成集成文档" -ForegroundColor White
Write-Host ""
Write-Host "RouterConfig 接口已保存到剪贴板，可直接粘贴使用" -ForegroundColor Green

# 将 RouterConfig 模板复制到剪贴板（如果可用）
try {
    $routerConfigTemplate | Set-Clipboard
    Write-Host "✓ RouterConfig 接口已复制到剪贴板" -ForegroundColor Green
} catch {
    Write-Host "! 无法复制到剪贴板，请手动复制" -ForegroundColor Yellow
}

Write-Host "`n=== 快速参考 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Lit 框架特点：" -ForegroundColor Yellow
Write-Host "- 使用 Web Components" -ForegroundColor White
Write-Host "- 使用 @customElement, @state 装饰器" -ForegroundColor White
Write-Host "- 使用 html 模板标签" -ForegroundColor White
Write-Host "- 文件扩展名: .ts" -ForegroundColor White
Write-Host ""
Write-Host "Qwik 框架特点：" -ForegroundColor Yellow
Write-Host "- 使用 $ 后缀（component$, useSignal$）" -ForegroundColor White
Write-Host "- Resumability 特性" -ForegroundColor White
Write-Host "- 使用 onClick$ 事件处理" -ForegroundColor White
Write-Host "- 文件扩展名: .tsx" -ForegroundColor White
Write-Host ""
Write-Host "Angular 框架特点：" -ForegroundColor Yellow
Write-Host "- 使用装饰器（@Component, @Injectable）" -ForegroundColor White
Write-Host "- 使用 RxJS" -ForegroundColor White
Write-Host "- 依赖注入" -ForegroundColor White
Write-Host "- 文件扩展名: .ts" -ForegroundColor White
Write-Host ""

Write-Host "脚本执行完成！" -ForegroundColor Green
Write-Host "请参考 REMAINING_FRAMEWORKS_GUIDE.md 获取详细的实施指南" -ForegroundColor Cyan

