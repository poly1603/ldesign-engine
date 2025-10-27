/**
 * 异步插件开发示例
 * 
 * 学习目标：
 * - 学习如何开发异步插件
 * - 掌握异步初始化
 * - 了解资源加载和清理
 */

import { createEngine } from '@ldesign/engine'
import type { Plugin, Engine } from '@ldesign/engine'

// ============================================
// 1. 异步初始化插件
// ============================================

interface DatabasePluginOptions {
  connectionString: string
  poolSize?: number
}

function createDatabasePlugin(options: DatabasePluginOptions): Plugin {
  let connection: any = null

  return {
    name: 'database-plugin',
    version: '1.0.0',

    async install(engine: Engine) {
      engine.logger.info('正在连接数据库...')

      // 模拟异步数据库连接
      await new Promise(resolve => setTimeout(resolve, 1000))

      connection = {
        query: async (sql: string) => {
          engine.logger.debug(`执行查询: ${sql}`)
          // 模拟查询
          return []
        },
        close: async () => {
          engine.logger.info('关闭数据库连接')
        }
      }

        // 添加数据库方法到引擎
        ; (engine as any).db = connection

      engine.logger.info('数据库连接成功')
    },

    async uninstall(engine: Engine) {
      if (connection) {
        await connection.close()
        connection = null
      }

      delete (engine as any).db
      engine.logger.info('数据库插件已卸载')
    }
  }
}

// ============================================
// 2. 远程配置加载插件
// ============================================

interface RemoteConfigPluginOptions {
  url: string
  interval?: number
}

function createRemoteConfigPlugin(options: RemoteConfigPluginOptions): Plugin {
  let intervalId: NodeJS.Timeout | null = null

  return {
    name: 'remote-config',
    version: '1.0.0',

    async install(engine: Engine) {
      // 加载远程配置
      const loadConfig = async () => {
        try {
          engine.logger.info('加载远程配置...')

          // 模拟远程请求
          await new Promise(resolve => setTimeout(resolve, 500))

          const config = {
            features: {
              darkMode: true,
              notifications: true
            },
            apiUrl: 'https://api.example.com'
          }

          // 更新引擎配置
          engine.state.set('remoteConfig', config)

          engine.logger.info('远程配置已加载', config)
          engine.events.emit('config:loaded', config)
        } catch (error) {
          engine.logger.error('加载远程配置失败', error)
        }
      }

      // 初始加载
      await loadConfig()

      // 定期刷新
      if (options.interval) {
        intervalId = setInterval(loadConfig, options.interval)
      }

      // 添加手动刷新方法
      ; (engine as any).refreshConfig = loadConfig
    },

    async uninstall(engine: Engine) {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }

      delete (engine as any).refreshConfig
      engine.state.remove('remoteConfig')

      engine.logger.info('远程配置插件已卸载')
    }
  }
}

// ============================================
// 3. 资源预加载插件
// ============================================

interface Asset {
  name: string
  url: string
  type: 'script' | 'style' | 'image'
}

interface PreloadPluginOptions {
  assets: Asset[]
  parallel?: boolean
}

function createPreloadPlugin(options: PreloadPluginOptions): Plugin {
  const { assets, parallel = true } = options

  return {
    name: 'preload-plugin',
    version: '1.0.0',

    async install(engine: Engine) {
      engine.logger.info(`开始预加载 ${assets.length} 个资源`)

      const loadAsset = async (asset: Asset) => {
        engine.logger.debug(`加载资源: ${asset.name}`)

        // 模拟资源加载
        await new Promise((resolve) => {
          setTimeout(resolve, Math.random() * 1000)
        })

        engine.logger.debug(`资源加载完成: ${asset.name}`)
        return asset
      }

      try {
        let loadedAssets: Asset[]

        if (parallel) {
          // 并行加载
          loadedAssets = await Promise.all(assets.map(loadAsset))
        } else {
          // 顺序加载
          loadedAssets = []
          for (const asset of assets) {
            const loaded = await loadAsset(asset)
            loadedAssets.push(loaded)
          }
        }

        // 保存加载的资源
        engine.state.set('preloadedAssets', loadedAssets)

        engine.logger.info('所有资源加载完成')
        engine.events.emit('assets:loaded', loadedAssets)
      } catch (error) {
        engine.logger.error('资源加载失败', error)
        throw error
      }
    }
  }
}

// ============================================
// 4. API 客户端插件
// ============================================

interface ApiClientOptions {
  baseUrl: string
  timeout?: number
  retries?: number
  headers?: Record<string, string>
}

function createApiClientPlugin(options: ApiClientOptions): Plugin {
  const { baseUrl, timeout = 5000, retries = 3, headers = {} } = options

  return {
    name: 'api-client',
    version: '1.0.0',

    async install(engine: Engine) {
      // 创建 API 客户端
      const apiClient = {
        async get(path: string) {
          return await this.request('GET', path)
        },

        async post(path: string, data: any) {
          return await this.request('POST', path, data)
        },

        async put(path: string, data: any) {
          return await this.request('PUT', path, data)
        },

        async delete(path: string) {
          return await this.request('DELETE', path)
        },

        async request(method: string, path: string, data?: any) {
          const url = `${baseUrl}${path}`

          engine.logger.debug(`API请求: ${method} ${url}`)

          for (let i = 0; i < retries; i++) {
            try {
              // 模拟 API 请求
              await new Promise((resolve, reject) => {
                setTimeout(() => {
                  // 模拟随机失败
                  if (Math.random() > 0.7 && i < retries - 1) {
                    reject(new Error('网络错误'))
                  } else {
                    resolve({ data: 'success' })
                  }
                }, 200)
              })

              engine.logger.debug(`API响应: ${method} ${url}`)
              return { success: true, data: {} }
            } catch (error) {
              if (i === retries - 1) {
                engine.logger.error(`API请求失败: ${method} ${url}`, error)
                throw error
              }

              engine.logger.warn(`API请求失败，正在重试 (${i + 1}/${retries})`)
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
            }
          }
        }
      }

        // 添加到引擎
        ; (engine as any).api = apiClient

      // 测试连接
      try {
        engine.logger.info('测试 API 连接...')
        await apiClient.get('/health')
        engine.logger.info('API 客户端就绪')
      } catch (error) {
        engine.logger.error('API 连接测试失败', error)
      }
    },

    uninstall(engine: Engine) {
      delete (engine as any).api
      engine.logger.info('API 客户端已卸载')
    }
  }
}

// ============================================
// 5. 认证插件
// ============================================

interface AuthPluginOptions {
  tokenKey?: string
  refreshInterval?: number
}

function createAuthPlugin(options: AuthPluginOptions = {}): Plugin {
  const { tokenKey = 'auth_token', refreshInterval = 3600000 } = options
  let refreshTimer: NodeJS.Timeout | null = null

  return {
    name: 'auth-plugin',
    version: '1.0.0',

    async install(engine: Engine) {
      // 检查本地存储的令牌
      const storedToken = await engine.cache.get(tokenKey)

      const auth = {
        async login(username: string, password: string) {
          engine.logger.info(`用户登录: ${username}`)

          // 模拟登录请求
          await new Promise(resolve => setTimeout(resolve, 500))

          const token = `token_${Date.now()}_${Math.random()}`
          const user = {
            id: '123',
            username,
            name: 'User Name'
          }

          // 保存令牌和用户信息
          await engine.cache.set(tokenKey, token, refreshInterval)
          engine.state.set('user', user)

          engine.events.emit('auth:login', user)
          engine.logger.info('登录成功')

          // 启动令牌刷新
          this.startTokenRefresh()

          return { token, user }
        },

        async logout() {
          engine.logger.info('用户登出')

          // 清理令牌和用户信息
          await engine.cache.remove(tokenKey)
          engine.state.remove('user')

          // 停止令牌刷新
          if (refreshTimer) {
            clearInterval(refreshTimer)
            refreshTimer = null
          }

          engine.events.emit('auth:logout')
        },

        async refreshToken() {
          const token = await engine.cache.get(tokenKey)
          if (!token) {
            engine.logger.warn('没有令牌需要刷新')
            return
          }

          engine.logger.info('刷新令牌')

          // 模拟令牌刷新
          await new Promise(resolve => setTimeout(resolve, 300))

          const newToken = `token_${Date.now()}_${Math.random()}`
          await engine.cache.set(tokenKey, newToken, refreshInterval)

          engine.events.emit('auth:token-refreshed', newToken)
        },

        startTokenRefresh() {
          if (refreshTimer) {
            clearInterval(refreshTimer)
          }

          refreshTimer = setInterval(() => {
            this.refreshToken().catch(error => {
              engine.logger.error('令牌刷新失败', error)
            })
          }, refreshInterval)
        },

        async isAuthenticated(): Promise<boolean> {
          const token = await engine.cache.get(tokenKey)
          return !!token
        },

        async getToken(): Promise<string | undefined> {
          return await engine.cache.get(tokenKey)
        }
      }

        // 添加到引擎
        ; (engine as any).auth = auth

      // 如果有存储的令牌，尝试恢复会话
      if (storedToken) {
        engine.logger.info('检测到已保存的令牌，恢复会话')
        auth.startTokenRefresh()
      }

      engine.logger.info('认证插件已安装')
    },

    uninstall(engine: Engine) {
      if (refreshTimer) {
        clearInterval(refreshTimer)
        refreshTimer = null
      }

      delete (engine as any).auth
      engine.logger.info('认证插件已卸载')
    }
  }
}

// ============================================
// 使用示例
// ============================================

async function main() {
  const engine = createEngine({
    debug: true
  })

  // 1. 数据库插件
  console.log('\n=== 数据库插件 ===')
  await engine.use(createDatabasePlugin({
    connectionString: 'mongodb://localhost:27017',
    poolSize: 10
  }))

  // 使用数据库
  const db = (engine as any).db
  await db.query('SELECT * FROM users')

  // 2. 远程配置插件
  console.log('\n=== 远程配置插件 ===')
  await engine.use(createRemoteConfigPlugin({
    url: 'https://config.example.com',
    interval: 60000 // 每分钟刷新
  }))

  // 3. 资源预加载插件
  console.log('\n=== 资源预加载插件 ===')
  await engine.use(createPreloadPlugin({
    assets: [
      { name: 'app.js', url: '/js/app.js', type: 'script' },
      { name: 'app.css', url: '/css/app.css', type: 'style' },
      { name: 'logo.png', url: '/images/logo.png', type: 'image' }
    ],
    parallel: true
  }))

  // 4. API 客户端插件
  console.log('\n=== API 客户端插件 ===')
  await engine.use(createApiClientPlugin({
    baseUrl: 'https://api.example.com',
    timeout: 5000,
    retries: 3
  }))

  // 使用 API
  const api = (engine as any).api
  try {
    await api.get('/users')
  } catch (error) {
    console.error('API 调用失败:', error)
  }

  // 5. 认证插件
  console.log('\n=== 认证插件 ===')
  await engine.use(createAuthPlugin({
    tokenKey: 'my_app_token',
    refreshInterval: 3600000 // 1小时
  }))

  // 使用认证
  const auth = (engine as any).auth
  await auth.login('alice', 'password123')

  const isAuth = await auth.isAuthenticated()
  console.log('已认证:', isAuth)

  // 监听认证事件
  engine.events.on('auth:login', (user) => {
    console.log('用户登录事件:', user)
  })

  engine.events.on('auth:token-refreshed', (token) => {
    console.log('令牌已刷新')
  })

  // 清理
  setTimeout(async () => {
    await auth.logout()
    await engine.destroy()
  }, 5000)
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export {
  createDatabasePlugin,
  createRemoteConfigPlugin,
  createPreloadPlugin,
  createApiClientPlugin,
  createAuthPlugin
}


