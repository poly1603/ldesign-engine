# 自定义插件示例

本文档详细介绍了如何创建各种类型的自定义插件，包括功能插件、UI插件、数据插件、工具插件等，展示了插件开发的最佳实践和高级技巧。

## 基础自定义插件

### 简单功能插件

```typescript
import { Engine, Plugin } from '@ldesign/engine'

// 计算器插件
const calculatorPlugin: Plugin = {
  name: 'CalculatorPlugin',
  version: '1.0.0',
  description: '提供基础数学计算功能',
  author: 'Your Name',

  install(engine) {
    console.log('安装计算器插件...')

    const calculator = {
      // 基础运算
      add(a: number, b: number): number {
        const result = a + b
        engine.emit('calculator:operation', {
          operation: 'add',
          operands: [a, b],
          result
        })
        return result
      },

      subtract(a: number, b: number): number {
        const result = a - b
        engine.emit('calculator:operation', {
          operation: 'subtract',
          operands: [a, b],
          result
        })
        return result
      },

      multiply(a: number, b: number): number {
        const result = a * b
        engine.emit('calculator:operation', {
          operation: 'multiply',
          operands: [a, b],
          result
        })
        return result
      },

      divide(a: number, b: number): number {
        if (b === 0) {
          const error = new Error('除数不能为零')
          engine.emit('calculator:error', {
            operation: 'divide',
            operands: [a, b],
            error: error.message
          })
          throw error
        }

        const result = a / b
        engine.emit('calculator:operation', {
          operation: 'divide',
          operands: [a, b],
          result
        })
        return result
      },

      // 高级运算
      power(base: number, exponent: number): number {
        const result = base ** exponent
        engine.emit('calculator:operation', {
          operation: 'power',
          operands: [base, exponent],
          result
        })
        return result
      },

      sqrt(value: number): number {
        if (value < 0) {
          const error = new Error('不能计算负数的平方根')
          engine.emit('calculator:error', {
            operation: 'sqrt',
            operands: [value],
            error: error.message
          })
          throw error
        }

        const result = Math.sqrt(value)
        engine.emit('calculator:operation', {
          operation: 'sqrt',
          operands: [value],
          result
        })
        return result
      },

      // 批量计算
      sum(numbers: number[]): number {
        const result = numbers.reduce((acc, num) => acc + num, 0)
        engine.emit('calculator:operation', {
          operation: 'sum',
          operands: numbers,
          result
        })
        return result
      },

      average(numbers: number[]): number {
        if (numbers.length === 0) {
          const error = new Error('数组不能为空')
          engine.emit('calculator:error', {
            operation: 'average',
            operands: numbers,
            error: error.message
          })
          throw error
        }

        const result = this.sum(numbers) / numbers.length
        engine.emit('calculator:operation', {
          operation: 'average',
          operands: numbers,
          result
        })
        return result
      },

      // 计算历史
      history: [] as Array<{
        operation: string
        operands: any[]
        result: number
        timestamp: string
      }>,

      getHistory() {
        return [...this.history]
      },

      clearHistory() {
        this.history = []
        engine.emit('calculator:history:cleared')
      }
    }

    // 监听计算操作，记录历史
    engine.on('calculator:operation', (data) => {
      calculator.history.push({
        ...data,
        timestamp: new Date().toISOString()
      })

      // 限制历史记录数量
      if (calculator.history.length > 100) {
        calculator.history = calculator.history.slice(-100)
      }
    })

    engine.addService('calculator', calculator)
    console.log('计算器插件安装完成')
  },

  uninstall(engine) {
    engine.removeService('calculator')
    engine.off('calculator:operation')
    console.log('计算器插件卸载完成')
  }
}

// 测试计算器插件
const engine = new Engine({ name: 'CalculatorExample' })

// 监听计算事件
engine.on('calculator:operation', (data) => {
  console.log(`🧮 计算: ${data.operation}(${data.operands.join(', ')}) = ${data.result}`)
})

engine.on('calculator:error', (data) => {
  console.error(`❌ 计算错误: ${data.operation}(${data.operands.join(', ')}) - ${data.error}`)
})

engine.use(calculatorPlugin)

engine.start().then(() => {
  const calc = engine.getService('calculator')

  console.log('=== 测试计算器插件 ===')

  // 基础运算
  console.log('\n基础运算:')
  console.log('10 + 5 =', calc.add(10, 5))
  console.log('10 - 3 =', calc.subtract(10, 3))
  console.log('4 * 6 =', calc.multiply(4, 6))
  console.log('15 / 3 =', calc.divide(15, 3))

  // 高级运算
  console.log('\n高级运算:')
  console.log('2^8 =', calc.power(2, 8))
  console.log('√16 =', calc.sqrt(16))

  // 批量计算
  console.log('\n批量计算:')
  const numbers = [1, 2, 3, 4, 5]
  console.log('数组:', numbers)
  console.log('求和:', calc.sum(numbers))
  console.log('平均值:', calc.average(numbers))

  // 错误处理
  console.log('\n错误处理:')
  try {
    calc.divide(10, 0)
  }
 catch (error) {
    console.log('捕获到错误:', error.message)
  }

  try {
    calc.sqrt(-4)
  }
 catch (error) {
    console.log('捕获到错误:', error.message)
  }

  // 查看历史
  console.log('\n计算历史:')
  console.log(calc.getHistory())
})
```

## 数据管理插件

### 本地存储插件

```typescript
import { Engine, Plugin } from '@ldesign/engine'

interface StorageConfig {
  prefix?: string
  encryption?: boolean
  compression?: boolean
  ttl?: number // 默认过期时间（毫秒）
}

// 高级本地存储插件
const advancedStoragePlugin: Plugin<StorageConfig> = {
  name: 'AdvancedStoragePlugin',
  version: '1.0.0',
  description: '高级本地存储管理，支持加密、压缩、过期时间',

  defaultConfig: {
    prefix: 'app_',
    encryption: false,
    compression: false,
    ttl: 0 // 0 表示永不过期
  },

  install(engine, config) {
    const finalConfig = { ...this.defaultConfig, ...config }
    console.log('安装高级存储插件...', finalConfig)

    const storage = {
      // 设置数据
      set(key: string, value: any, options?: { ttl?: number, encrypt?: boolean, compress?: boolean }) {
        try {
          const fullKey = finalConfig.prefix + key
          const opts = {
            ttl: options?.ttl ?? finalConfig.ttl,
            encrypt: options?.encrypt ?? finalConfig.encryption,
            compress: options?.compress ?? finalConfig.compression
          }

          let processedValue = value

          // 序列化
          if (typeof processedValue !== 'string') {
            processedValue = JSON.stringify(processedValue)
          }

          // 压缩
          if (opts.compress) {
            processedValue = this.compress(processedValue)
          }

          // 加密
          if (opts.encrypt) {
            processedValue = this.encrypt(processedValue)
          }

          // 包装数据
          const wrappedData = {
            value: processedValue,
            timestamp: Date.now(),
            ttl: opts.ttl,
            encrypted: opts.encrypt,
            compressed: opts.compress,
            originalType: typeof value
          }

          localStorage.setItem(fullKey, JSON.stringify(wrappedData))

          engine.emit('storage:set', {
            key,
            size: JSON.stringify(wrappedData).length,
            options: opts
          })

          console.log(`💾 存储数据: ${key}`, opts)
        }
 catch (error) {
          engine.emit('storage:error', {
            operation: 'set',
            key,
            error: error.message
          })
          throw error
        }
      },

      // 获取数据
      get(key: string, defaultValue?: any) {
        try {
          const fullKey = finalConfig.prefix + key
          const rawData = localStorage.getItem(fullKey)

          if (!rawData) {
            engine.emit('storage:miss', { key })
            return defaultValue
          }

          const wrappedData = JSON.parse(rawData)

          // 检查过期时间
          if (wrappedData.ttl > 0 && Date.now() - wrappedData.timestamp > wrappedData.ttl) {
            localStorage.removeItem(fullKey)
            engine.emit('storage:expired', { key })
            return defaultValue
          }

          let value = wrappedData.value

          // 解密
          if (wrappedData.encrypted) {
            value = this.decrypt(value)
          }

          // 解压缩
          if (wrappedData.compressed) {
            value = this.decompress(value)
          }

          // 反序列化
          if (wrappedData.originalType !== 'string') {
            value = JSON.parse(value)
          }

          engine.emit('storage:hit', { key })
          return value
        }
 catch (error) {
          engine.emit('storage:error', {
            operation: 'get',
            key,
            error: error.message
          })
          return defaultValue
        }
      },

      // 删除数据
      remove(key: string) {
        const fullKey = finalConfig.prefix + key
        const existed = localStorage.getItem(fullKey) !== null
        localStorage.removeItem(fullKey)

        if (existed) {
          engine.emit('storage:remove', { key })
        }

        return existed
      },

      // 检查是否存在
      has(key: string): boolean {
        const fullKey = finalConfig.prefix + key
        return localStorage.getItem(fullKey) !== null
      },

      // 获取所有键
      keys(): string[] {
        const keys: string[] = []
        const prefix = finalConfig.prefix

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(prefix)) {
            keys.push(key.substring(prefix.length))
          }
        }

        return keys
      },

      // 清空所有数据
      clear() {
        const keys = this.keys()
        keys.forEach(key => this.remove(key))
        engine.emit('storage:clear', { count: keys.length })
      },

      // 获取存储统计
      getStats() {
        const keys = this.keys()
        let totalSize = 0
        let expiredCount = 0

        keys.forEach((key) => {
          const fullKey = finalConfig.prefix + key
          const rawData = localStorage.getItem(fullKey)
          if (rawData) {
            totalSize += rawData.length

            try {
              const wrappedData = JSON.parse(rawData)
              if (wrappedData.ttl > 0 && Date.now() - wrappedData.timestamp > wrappedData.ttl) {
                expiredCount++
              }
            }
 catch (error) {
              // 忽略解析错误
            }
          }
        })

        return {
          totalKeys: keys.length,
          totalSize,
          expiredCount,
          availableSpace: this.getAvailableSpace()
        }
      },

      // 清理过期数据
      cleanup() {
        const keys = this.keys()
        let cleanedCount = 0

        keys.forEach((key) => {
          const fullKey = finalConfig.prefix + key
          const rawData = localStorage.getItem(fullKey)

          if (rawData) {
            try {
              const wrappedData = JSON.parse(rawData)
              if (wrappedData.ttl > 0 && Date.now() - wrappedData.timestamp > wrappedData.ttl) {
                localStorage.removeItem(fullKey)
                cleanedCount++
              }
            }
 catch (error) {
              // 删除损坏的数据
              localStorage.removeItem(fullKey)
              cleanedCount++
            }
          }
        })

        engine.emit('storage:cleanup', { cleanedCount })
        return cleanedCount
      },

      // 获取可用空间（估算）
      getAvailableSpace() {
        try {
          const testKey = '__storage_test__'
          const testData = 'x'.repeat(1024) // 1KB

          let size = 0
          while (size < 10 * 1024 * 1024) { // 最多测试 10MB
            try {
              localStorage.setItem(testKey, testData.repeat(size / 1024))
              localStorage.removeItem(testKey)
              size += 1024
            }
 catch (error) {
              break
            }
          }

          return size
        }
 catch (error) {
          return 0
        }
      },

      // 简单加密（仅用于演示，生产环境请使用更安全的加密方法）
      encrypt(text: string): string {
        return btoa(text.split('').reverse().join(''))
      },

      // 简单解密
      decrypt(encrypted: string): string {
        return atob(encrypted).split('').reverse().join('')
      },

      // 简单压缩（仅用于演示）
      compress(text: string): string {
        // 这里使用简单的重复字符压缩
        return text.replace(/(.)\1+/g, (match, char) => {
          return char + match.length
        })
      },

      // 简单解压缩
      decompress(compressed: string): string {
        return compressed.replace(/(.)(\d+)/g, (match, char, count) => {
          return char.repeat(Number.parseInt(count))
        })
      }
    }

    // 定期清理过期数据
    const cleanupInterval = setInterval(() => {
      storage.cleanup()
    }, 60000) // 每分钟清理一次

    // 保存清理定时器
    engine.setPluginData('AdvancedStoragePlugin', { cleanupInterval })

    engine.addService('storage', storage)
    console.log('高级存储插件安装完成')
  },

  uninstall(engine) {
    const pluginData = engine.getPluginData('AdvancedStoragePlugin')
    if (pluginData?.cleanupInterval) {
      clearInterval(pluginData.cleanupInterval)
    }

    engine.removeService('storage')
    console.log('高级存储插件卸载完成')
  }
}

// 测试高级存储插件
const engine = new Engine({ name: 'StorageExample' })

// 监听存储事件
engine.on('storage:set', (data) => {
  console.log(`💾 数据已存储: ${data.key} (${data.size} bytes)`, data.options)
})

engine.on('storage:hit', (data) => {
  console.log(`🎯 缓存命中: ${data.key}`)
})

engine.on('storage:miss', (data) => {
  console.log(`❌ 缓存未命中: ${data.key}`)
})

engine.on('storage:expired', (data) => {
  console.log(`⏰ 数据过期: ${data.key}`)
})

engine.on('storage:cleanup', (data) => {
  console.log(`🧹 清理完成: ${data.cleanedCount} 项`)
})

engine.use(advancedStoragePlugin, {
  prefix: 'myapp_',
  encryption: true,
  compression: true,
  ttl: 30000 // 30秒过期
})

engine.start().then(async () => {
  const storage = engine.getService('storage')

  console.log('=== 测试高级存储插件 ===')

  // 1. 基础存储操作
  console.log('\n1. 基础存储操作')

  storage.set('user', {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com'
  })

  storage.set('settings', {
    theme: 'dark',
    language: 'zh-CN'
  })

  console.log('用户数据:', storage.get('user'))
  console.log('设置数据:', storage.get('settings'))

  // 2. 带选项的存储
  console.log('\n2. 带选项的存储')

  storage.set('temp_data', 'This is temporary data', {
    ttl: 5000, // 5秒过期
    encrypt: true,
    compress: false
  })

  storage.set('large_data', 'x'.repeat(1000), {
    compress: true,
    encrypt: false
  })

  console.log('临时数据:', storage.get('temp_data'))
  console.log('大数据:', storage.get('large_data')?.length, '字符')

  // 3. 存储统计
  console.log('\n3. 存储统计')
  console.log('存储统计:', storage.getStats())
  console.log('所有键:', storage.keys())

  // 4. 测试过期
  console.log('\n4. 测试过期（等待6秒）')
  setTimeout(() => {
    console.log('6秒后的临时数据:', storage.get('temp_data', '已过期'))
    console.log('清理结果:', storage.cleanup(), '项被清理')
  }, 6000)

  // 5. 测试不存在的数据
  console.log('\n5. 测试不存在的数据')
  console.log('不存在的数据:', storage.get('nonexistent', '默认值'))

  // 6. 删除和清空
  setTimeout(() => {
    console.log('\n6. 删除和清空')
    console.log('删除用户数据:', storage.remove('user'))
    console.log('删除不存在的数据:', storage.remove('nonexistent'))

    console.log('清空前的键:', storage.keys())
    storage.clear()
    console.log('清空后的键:', storage.keys())
  }, 8000)
})
```

## UI 组件插件

### 通知系统插件

```typescript
import { Engine, Plugin } from '@ldesign/engine'

interface NotificationConfig {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxNotifications: number
  defaultDuration: number
  enableSound: boolean
  enableAnimation: boolean
}

interface NotificationOptions {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  duration?: number
  persistent?: boolean
  actions?: Array<{
    label: string
    action: () => void
    style?: 'primary' | 'secondary'
  }>
  icon?: string
  onClick?: () => void
  onClose?: () => void
}

// 通知系统插件
const notificationPlugin: Plugin<NotificationConfig> = {
  name: 'NotificationPlugin',
  version: '1.0.0',
  description: '通知系统插件，支持多种类型的通知和自定义样式',

  defaultConfig: {
    position: 'top-right',
    maxNotifications: 5,
    defaultDuration: 5000,
    enableSound: true,
    enableAnimation: true
  },

  install(engine, config) {
    const finalConfig = { ...this.defaultConfig, ...config }
    console.log('安装通知系统插件...', finalConfig)

    // 通知数据结构
    interface Notification {
      id: string
      type: string
      title?: string
      message: string
      duration: number
      persistent: boolean
      actions: NotificationOptions['actions']
      icon?: string
      createdAt: number
      onClick?: () => void
      onClose?: () => void
    }

    const notificationSystem = {
      notifications: [] as Notification[],
      container: null as HTMLElement | null,

      // 初始化容器
      init() {
        if (typeof document === 'undefined') {
          console.warn('通知系统需要浏览器环境')
          return
        }

        this.container = document.createElement('div')
        this.container.id = 'notification-container'
        this.container.className = `notification-container ${finalConfig.position}`

        // 添加样式
        this.addStyles()

        document.body.appendChild(this.container)
        console.log('通知容器已创建')
      },

      // 添加样式
      addStyles() {
        const styleId = 'notification-styles'
        if (document.getElementById(styleId))
return

        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
          .notification-container {
            position: fixed;
            z-index: 10000;
            pointer-events: none;
          }

          .notification-container.top-right {
            top: 20px;
            right: 20px;
          }

          .notification-container.top-left {
            top: 20px;
            left: 20px;
          }

          .notification-container.bottom-right {
            bottom: 20px;
            right: 20px;
          }

          .notification-container.bottom-left {
            bottom: 20px;
            left: 20px;
          }

          .notification-container.top-center {
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
          }

          .notification-container.bottom-center {
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
          }

          .notification {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            margin-bottom: 10px;
            min-width: 300px;
            max-width: 400px;
            pointer-events: auto;
            position: relative;
            overflow: hidden;
          }

          .notification.info {
            border-left: 4px solid #3498db;
          }

          .notification.success {
            border-left: 4px solid #2ecc71;
          }

          .notification.warning {
            border-left: 4px solid #f39c12;
          }

          .notification.error {
            border-left: 4px solid #e74c3c;
          }

          .notification-header {
            display: flex;
            align-items: center;
            padding: 12px 16px 8px;
          }

          .notification-icon {
            margin-right: 8px;
            font-size: 18px;
          }

          .notification-title {
            font-weight: 600;
            font-size: 14px;
            color: #2c3e50;
            flex: 1;
          }

          .notification-close {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #95a5a6;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .notification-close:hover {
            color: #7f8c8d;
          }

          .notification-content {
            padding: 0 16px 12px;
            font-size: 13px;
            color: #34495e;
            line-height: 1.4;
          }

          .notification-actions {
            padding: 8px 16px 12px;
            display: flex;
            gap: 8px;
          }

          .notification-action {
            padding: 4px 12px;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .notification-action.primary {
            background: #3498db;
            color: white;
          }

          .notification-action.primary:hover {
            background: #2980b9;
          }

          .notification-action.secondary {
            background: #ecf0f1;
            color: #2c3e50;
          }

          .notification-action.secondary:hover {
            background: #d5dbdb;
          }

          .notification-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 2px;
            background: rgba(52, 152, 219, 0.3);
            transition: width linear;
          }

          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes slideOutRight {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }

          .notification.animate-in {
            animation: slideInRight 0.3s ease-out;
          }

          .notification.animate-out {
            animation: slideOutRight 0.3s ease-in;
          }
        `

        document.head.appendChild(style)
      },

      // 显示通知
      show(message: string, options: NotificationOptions = {}) {
        if (!this.container) {
          this.init()
        }

        const notification: Notification = {
          id: this.generateId(),
          type: options.type || 'info',
          title: options.title,
          message,
          duration: options.duration ?? finalConfig.defaultDuration,
          persistent: options.persistent || false,
          actions: options.actions || [],
          icon: options.icon,
          createdAt: Date.now(),
          onClick: options.onClick,
          onClose: options.onClose
        }

        // 限制通知数量
        if (this.notifications.length >= finalConfig.maxNotifications) {
          this.remove(this.notifications[0].id)
        }

        this.notifications.push(notification)
        this.render(notification)

        // 播放声音
        if (finalConfig.enableSound) {
          this.playSound(notification.type)
        }

        // 自动关闭
        if (!notification.persistent && notification.duration > 0) {
          setTimeout(() => {
            this.remove(notification.id)
          }, notification.duration)
        }

        engine.emit('notification:show', notification)
        return notification.id
      },

      // 渲染通知
      render(notification: Notification) {
        if (!this.container)
return

        const element = document.createElement('div')
        element.className = `notification ${notification.type}`
        element.dataset.id = notification.id

        if (finalConfig.enableAnimation) {
          element.classList.add('animate-in')
        }

        // 构建HTML
        let html = ''

        // 头部
        if (notification.title || notification.icon) {
          html += '<div class="notification-header">'

          if (notification.icon) {
            html += `<span class="notification-icon">${notification.icon}</span>`
          }

          if (notification.title) {
            html += `<div class="notification-title">${notification.title}</div>`
          }

          html += '<button class="notification-close" onclick="this.closest(\'.notification\').remove()">&times;</button>'
          html += '</div>'
        }

        // 内容
        html += `<div class="notification-content">${notification.message}</div>`

        // 操作按钮
        if (notification.actions && notification.actions.length > 0) {
          html += '<div class="notification-actions">'
          notification.actions.forEach((action, index) => {
            const style = action.style || 'secondary'
            html += `<button class="notification-action ${style}" data-action="${index}">${action.label}</button>`
          })
          html += '</div>'
        }

        // 进度条（非持久通知）
        if (!notification.persistent && notification.duration > 0) {
          html += '<div class="notification-progress"></div>'
        }

        element.innerHTML = html

        // 绑定事件
        this.bindEvents(element, notification)

        this.container.appendChild(element)

        // 启动进度条动画
        if (!notification.persistent && notification.duration > 0) {
          const progress = element.querySelector('.notification-progress') as HTMLElement
          if (progress) {
            setTimeout(() => {
              progress.style.width = '100%'
              progress.style.transition = `width ${notification.duration}ms linear`
            }, 10)
          }
        }
      },

      // 绑定事件
      bindEvents(element: HTMLElement, notification: Notification) {
        // 点击事件
        if (notification.onClick) {
          element.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).closest('.notification-close, .notification-action')) {
              notification.onClick!()
            }
          })
        }

        // 关闭按钮
        const closeBtn = element.querySelector('.notification-close')
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            this.remove(notification.id)
          })
        }

        // 操作按钮
        const actionBtns = element.querySelectorAll('.notification-action')
        actionBtns.forEach((btn, index) => {
          btn.addEventListener('click', () => {
            if (notification.actions && notification.actions[index]) {
              notification.actions[index].action()
              this.remove(notification.id)
            }
          })
        })
      },

      // 移除通知
      remove(id: string) {
        const index = this.notifications.findIndex(n => n.id === id)
        if (index === -1)
return

        const notification = this.notifications[index]
        const element = this.container?.querySelector(`[data-id="${id}"]`) as HTMLElement

        if (element) {
          if (finalConfig.enableAnimation) {
            element.classList.add('animate-out')
            setTimeout(() => {
              element.remove()
            }, 300)
          }
 else {
            element.remove()
          }
        }

        this.notifications.splice(index, 1)

        if (notification.onClose) {
          notification.onClose()
        }

        engine.emit('notification:close', notification)
      },

      // 清空所有通知
      clear() {
        const count = this.notifications.length
        this.notifications.forEach(n => this.remove(n.id))
        engine.emit('notification:clear', { count })
      },

      // 播放声音
      playSound(type: string) {
        // 这里可以播放不同类型的提示音
        console.log(`🔊 播放${type}提示音`)
      },

      // 生成ID
      generateId() {
        return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },

      // 便捷方法
      info(message: string, options?: Omit<NotificationOptions, 'type'>) {
        return this.show(message, { ...options, type: 'info' })
      },

      success(message: string, options?: Omit<NotificationOptions, 'type'>) {
        return this.show(message, { ...options, type: 'success' })
      },

      warning(message: string, options?: Omit<NotificationOptions, 'type'>) {
        return this.show(message, { ...options, type: 'warning' })
      },

      error(message: string, options?: Omit<NotificationOptions, 'type'>) {
        return this.show(message, { ...options, type: 'error' })
      }
    }

    // 初始化
    notificationSystem.init()

    engine.addService('notification', notificationSystem)
    console.log('通知系统插件安装完成')
  },

  uninstall(engine) {
    const notification = engine.getService('notification')
    if (notification) {
      notification.clear()

      // 移除容器和样式
      const container = document.getElementById('notification-container')
      if (container) {
        container.remove()
      }

      const styles = document.getElementById('notification-styles')
      if (styles) {
        styles.remove()
      }
    }

    engine.removeService('notification')
    console.log('通知系统插件卸载完成')
  }
}

// 测试通知系统插件
const engine = new Engine({ name: 'NotificationExample' })

engine.use(notificationPlugin, {
  position: 'top-right',
  maxNotifications: 3,
  defaultDuration: 4000,
  enableSound: true,
  enableAnimation: true
})

engine.start().then(async () => {
  const notification = engine.getService('notification')

  console.log('=== 测试通知系统插件 ===')

  // 延迟函数
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // 1. 基础通知
  console.log('\n1. 基础通知')
  notification.info('这是一条信息通知')

  await delay(1000)

  notification.success('操作成功完成！', {
    title: '成功',
    icon: '✅'
  })

  await delay(1000)

  notification.warning('请注意这个警告', {
    title: '警告',
    icon: '⚠️',
    duration: 6000
  })

  await delay(1000)

  notification.error('发生了一个错误', {
    title: '错误',
    icon: '❌',
    persistent: true,
    actions: [
      {
        label: '重试',
        action: () => console.log('重试操作'),
        style: 'primary'
      },
      {
        label: '忽略',
        action: () => console.log('忽略错误'),
        style: 'secondary'
      }
    ]
  })

  await delay(2000)

  // 2. 带点击事件的通知
  console.log('\n2. 带点击事件的通知')
  notification.info('点击这条通知查看详情', {
    title: '新消息',
    icon: '📧',
    onClick: () => {
      console.log('通知被点击了！')
      notification.success('已打开详情页面')
    },
    onClose: () => {
      console.log('通知被关闭了')
    }
  })

  await delay(3000)

  // 3. 测试通知数量限制
  console.log('\n3. 测试通知数量限制')
  for (let i = 1; i <= 5; i++) {
    notification.info(`通知 ${i}`, {
      title: `消息 ${i}`,
      duration: 8000
    })
    await delay(200)
  }

  await delay(3000)

  // 4. 清空所有通知
  console.log('\n4. 清空所有通知')
  notification.clear()
})
```

## 总结

这些自定义插件示例展示了如何创建各种类型的插件：

1. **功能插件** - 计算器插件，提供数学计算功能
2. **数据管理插件** - 高级存储插件，支持加密、压缩、过期时间
3. **UI组件插件** - 通知系统插件，提供丰富的通知功能

每个插件都展示了：
- 完整的生命周期管理
- 配置选项支持
- 事件系统集成
- 错误处理
- 服务注册
- 资源清理

通过这些示例，您可以学习如何创建功能丰富、可维护的自定义插件，充分利用 @ldesign/engine 的插件架构优势。
