# 插件注册示例

本文档详细介绍了如何在 @ldesign/engine 中创建、注册和管理插件，包括插件的生命周期、依赖管理、配置选项等高级功能。

## 基础插件注册

### 简单插件示例

```typescript
import { Engine, Plugin } from '@ldesign/engine'

// 创建一个简单的日志插件
const loggerPlugin: Plugin = {
  name: 'LoggerPlugin',
  version: '1.0.0',
  description: '提供日志记录功能',

  install(engine) {
    console.log('日志插件正在安装...')

    // 添加日志方法到引擎
    engine.addMethod('log', (level: string, message: string, data?: any) => {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '')
    })

    // 监听引擎事件
    engine.on('engine:started', () => {
      engine.log('info', '引擎已启动')
    })

    engine.on('engine:stopped', () => {
      engine.log('info', '引擎已停止')
    })

    console.log('日志插件安装完成')
  },

  uninstall(engine) {
    console.log('日志插件正在卸载...')

    // 移除添加的方法
    engine.removeMethod('log')

    // 移除事件监听器
    engine.off('engine:started')
    engine.off('engine:stopped')

    console.log('日志插件卸载完成')
  }
}

// 创建引擎并注册插件
const engine = new Engine({
  name: 'PluginExample',
  debug: true
})

// 注册插件
engine.use(loggerPlugin)

// 启动引擎
engine.start().then(() => {
  // 使用插件提供的方法
  engine.log('info', '应用启动成功')
  engine.log('debug', '调试信息', { userId: 123 })
  engine.log('error', '错误信息', new Error('测试错误'))
})
```

### 带配置的插件

```typescript
import { Engine, Plugin } from '@ldesign/engine'

interface HttpPluginConfig {
  baseURL: string
  timeout: number
  retries: number
  headers?: Record<string, string>
}

// HTTP 客户端插件
const httpPlugin: Plugin<HttpPluginConfig> = {
  name: 'HttpPlugin',
  version: '1.0.0',
  description: 'HTTP 请求客户端',

  // 默认配置
  defaultConfig: {
    baseURL: 'https://api.example.com',
    timeout: 5000,
    retries: 3,
    headers: {
      'Content-Type': 'application/json'
    }
  },

  install(engine, config) {
    const finalConfig = { ...this.defaultConfig, ...config }

    console.log('HTTP插件配置:', finalConfig)

    // 创建 HTTP 客户端
    const httpClient = {
      async request(method: string, url: string, data?: any) {
        const fullUrl = `${finalConfig.baseURL}${url}`

        for (let attempt = 1; attempt <= finalConfig.retries; attempt++) {
          try {
            engine.emit('http:request:start', { method, url: fullUrl, attempt })

            // 模拟 HTTP 请求
            const response = await this.mockRequest(method, fullUrl, data, finalConfig)

            engine.emit('http:request:success', { method, url: fullUrl, response })
            return response
          }
 catch (error) {
            engine.emit('http:request:error', { method, url: fullUrl, error, attempt })

            if (attempt === finalConfig.retries) {
              throw error
            }

            // 重试延迟
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
        }
      },

      async mockRequest(method: string, url: string, data: any, config: HttpPluginConfig) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000))

        // 模拟随机失败
        if (Math.random() < 0.2) {
          throw new Error('网络错误')
        }

        return {
          status: 200,
          data: {
            method,
            url,
            requestData: data,
            timestamp: new Date().toISOString()
          }
        }
      },

      get(url: string) {
        return this.request('GET', url)
      },

      post(url: string, data: any) {
        return this.request('POST', url, data)
      },

      put(url: string, data: any) {
        return this.request('PUT', url, data)
      },

      delete(url: string) {
        return this.request('DELETE', url)
      }
    }

    // 将 HTTP 客户端添加到引擎
    engine.addService('http', httpClient)

    console.log('HTTP插件安装完成')
  },

  uninstall(engine) {
    engine.removeService('http')
    console.log('HTTP插件卸载完成')
  }
}

// 使用带配置的插件
const engine = new Engine({ name: 'HttpExample' })

// 注册插件并传入配置
engine.use(httpPlugin, {
  baseURL: 'https://my-api.com',
  timeout: 10000,
  retries: 5,
  headers: {
    'Authorization': 'Bearer token123',
    'X-API-Version': 'v1'
  }
})

// 监听 HTTP 事件
engine.on('http:request:start', (data) => {
  console.log(`🚀 开始请求: ${data.method} ${data.url} (尝试 ${data.attempt})`)
})

engine.on('http:request:success', (data) => {
  console.log(`✅ 请求成功: ${data.method} ${data.url}`)
})

engine.on('http:request:error', (data) => {
  console.log(`❌ 请求失败: ${data.method} ${data.url} (尝试 ${data.attempt})`, data.error.message)
})

// 测试 HTTP 插件
engine.start().then(async () => {
  const http = engine.getService('http')

  try {
    // GET 请求
    const users = await http.get('/users')
    console.log('用户列表:', users)

    // POST 请求
    const newUser = await http.post('/users', {
      name: 'John Doe',
      email: 'john@example.com'
    })
    console.log('创建用户:', newUser)

    // PUT 请求
    const updatedUser = await http.put('/users/1', {
      name: 'John Smith'
    })
    console.log('更新用户:', updatedUser)
  }
 catch (error) {
    console.error('HTTP 请求失败:', error.message)
  }
})
```

## 插件依赖管理

### 插件依赖声明

```typescript
import { Engine, Plugin } from '@ldesign/engine'

// 基础存储插件
const storagePlugin: Plugin = {
  name: 'StoragePlugin',
  version: '1.0.0',
  description: '本地存储管理',

  install(engine) {
    const storage = {
      set(key: string, value: any) {
        localStorage.setItem(key, JSON.stringify(value))
        engine.emit('storage:set', { key, value })
      },

      get(key: string) {
        const value = localStorage.getItem(key)
        return value ? JSON.parse(value) : null
      },

      remove(key: string) {
        localStorage.removeItem(key)
        engine.emit('storage:remove', { key })
      },

      clear() {
        localStorage.clear()
        engine.emit('storage:clear')
      }
    }

    engine.addService('storage', storage)
    console.log('存储插件安装完成')
  }
}

// 缓存插件（依赖存储插件）
const cachePlugin: Plugin = {
  name: 'CachePlugin',
  version: '1.0.0',
  description: '缓存管理（依赖存储插件）',

  // 声明依赖
  dependencies: ['StoragePlugin'],

  install(engine) {
    // 检查依赖
    if (!engine.hasPlugin('StoragePlugin')) {
      throw new Error('CachePlugin 需要 StoragePlugin 支持')
    }

    const storage = engine.getService('storage')
    const cachePrefix = 'cache:'

    const cache = {
      set(key: string, value: any, ttl?: number) {
        const cacheKey = cachePrefix + key
        const cacheData = {
          value,
          timestamp: Date.now(),
          ttl: ttl || 0
        }

        storage.set(cacheKey, cacheData)
        engine.emit('cache:set', { key, value, ttl })
      },

      get(key: string) {
        const cacheKey = cachePrefix + key
        const cacheData = storage.get(cacheKey)

        if (!cacheData) {
          return null
        }

        // 检查是否过期
        if (cacheData.ttl > 0 && Date.now() - cacheData.timestamp > cacheData.ttl) {
          storage.remove(cacheKey)
          engine.emit('cache:expired', { key })
          return null
        }

        engine.emit('cache:hit', { key })
        return cacheData.value
      },

      remove(key: string) {
        const cacheKey = cachePrefix + key
        storage.remove(cacheKey)
        engine.emit('cache:remove', { key })
      },

      clear() {
        // 清除所有缓存项
        const allKeys = Object.keys(localStorage)
        const cacheKeys = allKeys.filter(key => key.startsWith(cachePrefix))

        cacheKeys.forEach((key) => {
          localStorage.removeItem(key)
        })

        engine.emit('cache:clear')
      },

      // 清理过期缓存
      cleanup() {
        const allKeys = Object.keys(localStorage)
        const cacheKeys = allKeys.filter(key => key.startsWith(cachePrefix))
        let cleanedCount = 0

        cacheKeys.forEach((cacheKey) => {
          const cacheData = storage.get(cacheKey.replace(cachePrefix, ''))
          if (cacheData && cacheData.ttl > 0 && Date.now() - cacheData.timestamp > cacheData.ttl) {
            localStorage.removeItem(cacheKey)
            cleanedCount++
          }
        })

        engine.emit('cache:cleanup', { cleanedCount })
        return cleanedCount
      }
    }

    engine.addService('cache', cache)

    // 定期清理过期缓存
    const cleanupInterval = setInterval(() => {
      cache.cleanup()
    }, 60000) // 每分钟清理一次

    // 保存清理定时器，以便卸载时清除
    engine.setPluginData('CachePlugin', { cleanupInterval })

    console.log('缓存插件安装完成')
  },

  uninstall(engine) {
    const pluginData = engine.getPluginData('CachePlugin')
    if (pluginData?.cleanupInterval) {
      clearInterval(pluginData.cleanupInterval)
    }

    engine.removeService('cache')
    console.log('缓存插件卸载完成')
  }
}

// 用户管理插件（依赖缓存插件）
const userPlugin: Plugin = {
  name: 'UserPlugin',
  version: '1.0.0',
  description: '用户管理（依赖缓存插件）',

  dependencies: ['CachePlugin'],

  install(engine) {
    if (!engine.hasPlugin('CachePlugin')) {
      throw new Error('UserPlugin 需要 CachePlugin 支持')
    }

    const cache = engine.getService('cache')

    const userManager = {
      async getUser(id: string) {
        // 先从缓存获取
        let user = cache.get(`user:${id}`)

        if (!user) {
          // 模拟从 API 获取用户
          console.log(`从 API 获取用户: ${id}`)
          await new Promise(resolve => setTimeout(resolve, 500))

          user = {
            id,
            name: `User ${id}`,
            email: `user${id}@example.com`,
            createdAt: new Date().toISOString()
          }

          // 缓存用户信息（5分钟）
          cache.set(`user:${id}`, user, 5 * 60 * 1000)
        }

        return user
      },

      async updateUser(id: string, updates: any) {
        console.log(`更新用户: ${id}`, updates)

        // 模拟 API 更新
        await new Promise(resolve => setTimeout(resolve, 300))

        // 获取当前用户
        const user = await this.getUser(id)
        const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() }

        // 更新缓存
        cache.set(`user:${id}`, updatedUser, 5 * 60 * 1000)

        engine.emit('user:updated', { id, user: updatedUser })
        return updatedUser
      },

      removeUser(id: string) {
        cache.remove(`user:${id}`)
        engine.emit('user:removed', { id })
      }
    }

    engine.addService('user', userManager)
    console.log('用户插件安装完成')
  }
}

// 按依赖顺序注册插件
const engine = new Engine({ name: 'DependencyExample' })

// 注册插件（引擎会自动处理依赖顺序）
engine.use(userPlugin) // 这会自动先安装 StoragePlugin 和 CachePlugin
engine.use(cachePlugin)
engine.use(storagePlugin)

// 监听缓存事件
engine.on('cache:set', (data) => {
  console.log(`💾 缓存设置: ${data.key}`, data.ttl ? `(TTL: ${data.ttl}ms)` : '')
})

engine.on('cache:hit', (data) => {
  console.log(`🎯 缓存命中: ${data.key}`)
})

engine.on('cache:expired', (data) => {
  console.log(`⏰ 缓存过期: ${data.key}`)
})

engine.on('cache:cleanup', (data) => {
  if (data.cleanedCount > 0) {
    console.log(`🧹 清理过期缓存: ${data.cleanedCount} 项`)
  }
})

// 测试依赖插件
engine.start().then(async () => {
  const user = engine.getService('user')
  const cache = engine.getService('cache')

  console.log('=== 测试用户管理 ===')

  // 第一次获取用户（从 API）
  console.log('\n1. 第一次获取用户')
  const user1 = await user.getUser('123')
  console.log('用户信息:', user1)

  // 第二次获取用户（从缓存）
  console.log('\n2. 第二次获取用户')
  const user2 = await user.getUser('123')
  console.log('用户信息:', user2)

  // 更新用户
  console.log('\n3. 更新用户')
  const updatedUser = await user.updateUser('123', {
    name: 'Updated User 123',
    phone: '+1234567890'
  })
  console.log('更新后的用户:', updatedUser)

  // 测试缓存过期
  console.log('\n4. 测试短期缓存')
  cache.set('test:short', 'short-lived data', 2000) // 2秒过期

  console.log('立即获取:', cache.get('test:short'))

  setTimeout(() => {
    console.log('2秒后获取:', cache.get('test:short'))
  }, 2500)
})
```

## 插件生命周期管理

### 完整生命周期插件

```typescript
import { Engine, Plugin } from '@ldesign/engine'

interface AnalyticsConfig {
  apiKey: string
  endpoint: string
  batchSize: number
  flushInterval: number
}

// 分析插件（完整生命周期）
const analyticsPlugin: Plugin<AnalyticsConfig> = {
  name: 'AnalyticsPlugin',
  version: '1.0.0',
  description: '用户行为分析插件',

  defaultConfig: {
    apiKey: '',
    endpoint: 'https://analytics.example.com/events',
    batchSize: 10,
    flushInterval: 30000
  },

  // 插件安装前的准备工作
  beforeInstall(engine, config) {
    console.log('分析插件准备安装...')

    // 验证配置
    if (!config?.apiKey) {
      throw new Error('Analytics plugin requires an API key')
    }

    // 检查环境
    if (typeof window === 'undefined') {
      console.warn('Analytics plugin is designed for browser environment')
    }

    return true
  },

  // 插件安装
  install(engine, config) {
    const finalConfig = { ...this.defaultConfig, ...config }
    console.log('分析插件正在安装...', finalConfig)

    // 事件队列
    const eventQueue: any[] = []
    let flushTimer: NodeJS.Timeout | null = null

    const analytics = {
      // 跟踪事件
      track(event: string, properties?: any) {
        const eventData = {
          event,
          properties: properties || {},
          timestamp: new Date().toISOString(),
          sessionId: this.getSessionId(),
          userId: engine.getState('currentUser')?.id || null
        }

        eventQueue.push(eventData)
        console.log(`📊 跟踪事件: ${event}`, properties)

        // 检查是否需要立即发送
        if (eventQueue.length >= finalConfig.batchSize) {
          this.flush()
        }
      },

      // 跟踪页面访问
      page(name: string, properties?: any) {
        this.track('page_view', {
          page: name,
          ...properties
        })
      },

      // 识别用户
      identify(userId: string, traits?: any) {
        this.track('identify', {
          userId,
          traits: traits || {}
        })
      },

      // 发送事件队列
      async flush() {
        if (eventQueue.length === 0)
return

        const events = eventQueue.splice(0, eventQueue.length)

        try {
          console.log(`📤 发送 ${events.length} 个分析事件`)

          // 模拟发送到分析服务
          await this.sendEvents(events)

          engine.emit('analytics:events:sent', { count: events.length })
        }
 catch (error) {
          console.error('发送分析事件失败:', error)

          // 重新加入队列
          eventQueue.unshift(...events)

          engine.emit('analytics:events:failed', { error, count: events.length })
        }
      },

      // 模拟发送事件
      async sendEvents(events: any[]) {
        await new Promise(resolve => setTimeout(resolve, 500))

        // 模拟随机失败
        if (Math.random() < 0.1) {
          throw new Error('Network error')
        }

        console.log('✅ 分析事件发送成功')
      },

      // 获取会话ID
      getSessionId() {
        let sessionId = sessionStorage.getItem('analytics_session_id')
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          sessionStorage.setItem('analytics_session_id', sessionId)
        }
        return sessionId
      },

      // 获取队列状态
      getQueueStatus() {
        return {
          queueLength: eventQueue.length,
          isFlushScheduled: flushTimer !== null
        }
      }
    }

    // 设置定时发送
    const scheduleFlush = () => {
      if (flushTimer) {
        clearTimeout(flushTimer)
      }

      flushTimer = setTimeout(() => {
        analytics.flush()
        flushTimer = null

        // 如果队列不为空，继续调度
        if (eventQueue.length > 0) {
          scheduleFlush()
        }
      }, finalConfig.flushInterval)
    }

    // 开始调度
    scheduleFlush()

    // 监听引擎事件
    engine.on('user:login', (user) => {
      analytics.identify(user.id, {
        name: user.name,
        email: user.email
      })
    })

    engine.on('user:logout', () => {
      analytics.track('logout')
    })

    // 页面卸载时发送剩余事件
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        analytics.flush()
      })
    }

    // 保存插件数据
    engine.setPluginData('AnalyticsPlugin', {
      flushTimer,
      eventQueue,
      config: finalConfig
    })

    engine.addService('analytics', analytics)
    console.log('分析插件安装完成')
  },

  // 插件安装后的初始化
  afterInstall(engine) {
    console.log('分析插件初始化...')

    const analytics = engine.getService('analytics')

    // 发送插件启动事件
    analytics.track('plugin_installed', {
      plugin: 'AnalyticsPlugin',
      version: this.version
    })

    console.log('分析插件初始化完成')
  },

  // 插件卸载前的清理
  beforeUninstall(engine) {
    console.log('分析插件准备卸载...')

    const analytics = engine.getService('analytics')
    const pluginData = engine.getPluginData('AnalyticsPlugin')

    // 发送最后的事件
    analytics.track('plugin_uninstalling', {
      plugin: 'AnalyticsPlugin'
    })

    // 立即发送剩余事件
    analytics.flush()

    // 清理定时器
    if (pluginData?.flushTimer) {
      clearTimeout(pluginData.flushTimer)
    }

    return true
  },

  // 插件卸载
  uninstall(engine) {
    console.log('分析插件正在卸载...')

    // 移除事件监听器
    engine.off('user:login')
    engine.off('user:logout')

    // 移除服务
    engine.removeService('analytics')

    // 清理插件数据
    engine.removePluginData('AnalyticsPlugin')

    console.log('分析插件卸载完成')
  },

  // 插件卸载后的清理
  afterUninstall(engine) {
    console.log('分析插件清理完成')
  }
}

// 测试插件生命周期
const engine = new Engine({
  name: 'LifecycleExample',
  initialState: {
    currentUser: null
  }
})

// 监听分析事件
engine.on('analytics:events:sent', (data) => {
  console.log(`📈 分析事件已发送: ${data.count} 个`)
})

engine.on('analytics:events:failed', (data) => {
  console.log(`❌ 分析事件发送失败: ${data.count} 个`, data.error.message)
})

// 注册插件
engine.use(analyticsPlugin, {
  apiKey: 'your-api-key-here',
  endpoint: 'https://your-analytics-endpoint.com/events',
  batchSize: 5,
  flushInterval: 10000
})

// 测试分析功能
engine.start().then(async () => {
  const analytics = engine.getService('analytics')

  console.log('=== 测试分析功能 ===')

  // 1. 页面访问
  analytics.page('home', { referrer: 'google.com' })
  analytics.page('products', { category: 'electronics' })

  // 2. 用户登录
  const user = {
    id: 'user123',
    name: 'John Doe',
    email: 'john@example.com'
  }

  engine.setState('currentUser', user)
  engine.emit('user:login', user)

  // 3. 用户行为跟踪
  analytics.track('button_click', {
    button: 'add_to_cart',
    product_id: 'prod123',
    price: 29.99
  })

  analytics.track('purchase', {
    order_id: 'order456',
    total: 59.98,
    items: 2
  })

  // 4. 查看队列状态
  console.log('队列状态:', analytics.getQueueStatus())

  // 5. 等待一段时间后卸载插件
  setTimeout(async () => {
    console.log('\n=== 卸载插件 ===')

    // 用户登出
    engine.emit('user:logout')

    // 卸载插件
    await engine.unuse('AnalyticsPlugin')

    console.log('插件卸载完成')
  }, 15000)
})
```

## 插件热重载

### 支持热重载的插件

```typescript
import { Engine, Plugin } from '@ldesign/engine'

// 主题插件（支持热重载）
const themePlugin: Plugin = {
  name: 'ThemePlugin',
  version: '1.0.0',
  description: '主题管理插件（支持热重载）',

  // 支持热重载
  hotReloadable: true,

  install(engine, config) {
    console.log('主题插件安装中...', config)

    const themes = {
      light: {
        primary: '#007bff',
        secondary: '#6c757d',
        background: '#ffffff',
        text: '#212529'
      },
      dark: {
        primary: '#0d6efd',
        secondary: '#6c757d',
        background: '#212529',
        text: '#ffffff'
      },
      custom: config?.customTheme || {}
    }

    const themeManager = {
      currentTheme: 'light',

      setTheme(themeName: string) {
        if (!themes[themeName]) {
          throw new Error(`主题 '${themeName}' 不存在`)
        }

        this.currentTheme = themeName
        const theme = themes[themeName]

        // 应用主题到 DOM
        this.applyTheme(theme)

        // 保存到状态
        engine.setState('currentTheme', themeName)

        // 触发事件
        engine.emit('theme:changed', { theme: themeName, colors: theme })

        console.log(`🎨 主题已切换为: ${themeName}`)
      },

      getTheme(themeName?: string) {
        return themes[themeName || this.currentTheme]
      },

      addTheme(name: string, colors: any) {
        themes[name] = colors
        engine.emit('theme:added', { name, colors })
        console.log(`➕ 新主题已添加: ${name}`)
      },

      removeTheme(name: string) {
        if (name === 'light' || name === 'dark') {
          throw new Error('不能删除内置主题')
        }

        delete themes[name]
        engine.emit('theme:removed', { name })
        console.log(`➖ 主题已删除: ${name}`)
      },

      getAvailableThemes() {
        return Object.keys(themes)
      },

      applyTheme(theme: any) {
        if (typeof document !== 'undefined') {
          const root = document.documentElement
          Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value as string)
          })
        }
      },

      // 热重载时保存状态
      getState() {
        return {
          currentTheme: this.currentTheme,
          themes: { ...themes }
        }
      },

      // 热重载时恢复状态
      setState(state: any) {
        this.currentTheme = state.currentTheme
        Object.assign(themes, state.themes)
        this.applyTheme(themes[this.currentTheme])
      }
    }

    // 初始化主题
    const savedTheme = engine.getState('currentTheme') || 'light'
    themeManager.setTheme(savedTheme)

    engine.addService('theme', themeManager)
    console.log('主题插件安装完成')
  },

  // 热重载前保存状态
  beforeHotReload(engine) {
    console.log('主题插件准备热重载...')

    const theme = engine.getService('theme')
    const state = theme.getState()

    // 保存状态到引擎
    engine.setPluginData('ThemePlugin:hotReload', state)

    return true
  },

  // 热重载后恢复状态
  afterHotReload(engine) {
    console.log('主题插件热重载完成，恢复状态...')

    const theme = engine.getService('theme')
    const savedState = engine.getPluginData('ThemePlugin:hotReload')

    if (savedState) {
      theme.setState(savedState)
      engine.removePluginData('ThemePlugin:hotReload')
    }

    console.log('主题插件状态已恢复')
  },

  uninstall(engine) {
    engine.removeService('theme')
    console.log('主题插件卸载完成')
  }
}

// 测试热重载
const engine = new Engine({
  name: 'HotReloadExample',
  debug: true
})

// 注册主题插件
engine.use(themePlugin, {
  customTheme: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    background: '#f7f7f7',
    text: '#2c3e50'
  }
})

// 监听主题事件
engine.on('theme:changed', (data) => {
  console.log(`🎨 主题变更: ${data.theme}`, data.colors)
})

engine.on('theme:added', (data) => {
  console.log(`➕ 新增主题: ${data.name}`, data.colors)
})

// 测试主题功能和热重载
engine.start().then(async () => {
  const theme = engine.getService('theme')

  console.log('=== 测试主题功能 ===')

  // 1. 切换主题
  console.log('\n1. 切换主题')
  console.log('可用主题:', theme.getAvailableThemes())

  theme.setTheme('dark')
  await delay(1000)

  theme.setTheme('custom')
  await delay(1000)

  // 2. 添加新主题
  console.log('\n2. 添加新主题')
  theme.addTheme('ocean', {
    primary: '#0077be',
    secondary: '#00a8cc',
    background: '#e6f3ff',
    text: '#003d5c'
  })

  theme.setTheme('ocean')
  await delay(1000)

  // 3. 模拟热重载
  console.log('\n3. 模拟热重载')

  // 创建新版本的插件
  const themePluginV2: Plugin = {
    ...themePlugin,
    version: '1.1.0',

    install(engine, config) {
      console.log('主题插件 v1.1.0 安装中...', config)

      // 调用原始安装逻辑
      themePlugin.install.call(this, engine, config)

      // 添加新功能：自动切换主题
      const theme = engine.getService('theme')

      theme.autoSwitch = (schedule: { hour: number, theme: string }[]) => {
        console.log('🕐 启用自动主题切换', schedule)

        const checkTime = () => {
          const hour = new Date().getHours()
          const currentSchedule = schedule.find(s => s.hour === hour)

          if (currentSchedule && theme.currentTheme !== currentSchedule.theme) {
            theme.setTheme(currentSchedule.theme)
          }
        }

        // 立即检查
        checkTime()

        // 每小时检查一次
        const interval = setInterval(checkTime, 60 * 60 * 1000)

        return () => clearInterval(interval)
      }

      console.log('主题插件 v1.1.0 安装完成（新增自动切换功能）')
    }
  }

  // 执行热重载
  await engine.hotReload('ThemePlugin', themePluginV2)

  // 4. 测试新功能
  console.log('\n4. 测试新功能')
  const updatedTheme = engine.getService('theme')

  // 设置自动切换计划
  const stopAutoSwitch = updatedTheme.autoSwitch([
    { hour: 6, theme: 'light' },
    { hour: 18, theme: 'dark' },
    { hour: 22, theme: 'ocean' }
  ])

  console.log('当前主题:', updatedTheme.currentTheme)
  console.log('可用主题:', updatedTheme.getAvailableThemes())

  // 5. 清理
  setTimeout(() => {
    stopAutoSwitch()
    console.log('自动切换已停止')
  }, 5000)
})

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

## 总结

这些插件注册示例展示了 @ldesign/engine 插件系统的强大功能：

1. **基础插件注册** - 简单插件的创建和注册
2. **配置化插件** - 支持配置选项的插件
3. **依赖管理** - 插件间的依赖关系处理
4. **生命周期管理** - 完整的插件生命周期钩子
5. **热重载支持** - 开发时的热重载功能
6. **状态保持** - 插件状态的保存和恢复
7. **错误处理** - 插件安装和运行时的错误处理
8. **服务注册** - 插件向引擎注册服务的方式

通过这些示例，您可以创建功能丰富、可维护的插件，充分利用 @ldesign/engine 的插件架构优势。
