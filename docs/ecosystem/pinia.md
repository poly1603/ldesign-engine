# Pinia 集成

LDesign Engine 可以与 Pinia 完美集成，结合两者的优势构建强大的应用。

## 安装

```bash
pnpm add pinia
```

## 基础集成

### 同时使用 Engine 和 Pinia

```typescript
import { createEngine } from '@ldesign/engine'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// 创建 Pinia
const pinia = createPinia()
app.use(pinia)

// 创建 Engine
const engine = createEngine({
  debug: true
})
engine.install(app)

app.mount('#app')
```

## 集成方案

### 方案一：Engine 作为全局状态，Pinia 管理模块状态

适用场景：全局配置使用 Engine，业务模块使用 Pinia。

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { useEngine } from '@ldesign/engine/vue'

export const useUserStore = defineStore('user', () => {
  const engine = useEngine()
  
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  
  async function login(credentials: Credentials) {
    try {
      const response = await api.login(credentials)
      user.value = response.user
      token.value = response.token
      
      // 同步到 Engine 缓存
      await engine.cache.set('auth_token', response.token, 86400000)
      
      // 触发 Engine 事件
      engine.events.emit('user:login', response.user)
      
      engine.logger.info('用户登录成功')
    } catch (error) {
      engine.logger.error('登录失败', error)
      throw error
    }
  }
  
  function logout() {
    user.value = null
    token.value = null
    
    engine.cache.remove('auth_token')
    engine.events.emit('user:logout')
    engine.logger.info('用户已登出')
  }
  
  return {
    user,
    token,
    login,
    logout
  }
})
```

### 方案二：Pinia Store 插件化

将 Pinia Store 封装为 Engine 插件。

```typescript
// plugins/pinia-plugin.ts
import type { Plugin, Engine } from '@ldesign/engine'
import { createPinia, type Pinia } from 'pinia'

export function createPiniaPlugin(): Plugin {
  let pinia: Pinia | null = null
  
  return {
    name: 'pinia-plugin',
    version: '1.0.0',
    
    install(engine: Engine) {
      pinia = createPinia()
      
      // 添加 Pinia 插件以集成 Engine
      pinia.use(({ store }) => {
        // 给每个 store 添加 engine 访问
        store.$engine = engine
      })
      
      // 将 Pinia 添加到 Engine
      ;(engine as any).pinia = pinia
      
      engine.logger.info('Pinia 插件已安装')
    }
  }
}

// main.ts
import { createEngine } from '@ldesign/engine'
import { createApp } from 'vue'
import { createPiniaPlugin } from './plugins/pinia-plugin'
import App from './App.vue'

const app = createApp(App)

const engine = createEngine()
engine.use(createPiniaPlugin())

// 使用 Engine 中的 Pinia
app.use((engine as any).pinia)
engine.install(app)

app.mount('#app')
```

### 方案三：Engine 状态同步到 Pinia

实时同步 Engine 状态到 Pinia Store。

```typescript
// stores/app.ts
import { defineStore } from 'pinia'
import { useEngine } from '@ldesign/engine/vue'

export const useAppStore = defineStore('app', () => {
  const engine = useEngine()
  
  // 从 Engine 初始化状态
  const config = ref(engine.config.getAll())
  const theme = ref(engine.state.get('theme', 'light'))
  
  // 监听 Engine 状态变化
  engine.state.watch('theme', (newTheme) => {
    theme.value = newTheme
  })
  
  // 修改主题时同步到 Engine
  function setTheme(newTheme: string) {
    theme.value = newTheme
    engine.state.set('theme', newTheme)
    engine.events.emit('theme:changed', newTheme)
  }
  
  return {
    config,
    theme,
    setTheme
  }
})
```

## 完整示例

### 1. 用户认证模块

```typescript
// stores/auth.ts
import { defineStore } from 'pinia'
import { useEngine } from '@ldesign/engine/vue'
import { computed, ref } from 'vue'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

export const useAuthStore = defineStore('auth', () => {
  const engine = useEngine()
  
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  
  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    
    try {
      engine.logger.info('开始登录', { email })
      
      // 调用 API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      if (!response.ok) {
        throw new Error('登录失败')
      }
      
      const data = await response.json()
      user.value = data.user
      
      // 缓存令牌
      await engine.cache.set('auth_token', data.token, 86400000)
      
      // 同步到 Engine 状态
      engine.state.set('currentUser', data.user)
      
      // 触发事件
      engine.events.emit('auth:login:success', data.user)
      
      // 显示通知
      engine.notifications.success(`欢迎回来，${data.user.name}！`)
      
      engine.logger.info('登录成功', { userId: data.user.id })
    } catch (err: any) {
      error.value = err.message
      engine.logger.error('登录失败', err)
      engine.events.emit('auth:login:error', err)
      engine.notifications.error('登录失败，请重试')
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function logout() {
    try {
      engine.logger.info('用户登出', { userId: user.value?.id })
      
      // 清理缓存
      await engine.cache.remove('auth_token')
      
      // 清理状态
      engine.state.remove('currentUser')
      
      // 触发事件
      engine.events.emit('auth:logout', user.value)
      
      // 清理 Store
      user.value = null
      error.value = null
      
      engine.notifications.info('已安全登出')
    } catch (err: any) {
      engine.logger.error('登出失败', err)
      throw err
    }
  }
  
  async function refresh() {
    const token = await engine.cache.get('auth_token')
    if (!token) return
    
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        user.value = data.user
        engine.state.set('currentUser', data.user)
      }
    } catch (err) {
      engine.logger.error('刷新用户信息失败', err)
      await logout()
    }
  }
  
  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    refresh
  }
})
```

### 2. 购物车模块

```typescript
// stores/cart.ts
import { defineStore } from 'pinia'
import { useEngine } from '@ldesign/engine/vue'
import { computed, ref } from 'vue'

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
}

export const useCartStore = defineStore('cart', () => {
  const engine = useEngine()
  
  const items = ref<CartItem[]>([])
  
  // 从 Engine 缓存恢复
  engine.cache.get<CartItem[]>('cart_items').then(cached => {
    if (cached) {
      items.value = cached
    }
  })
  
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )
  
  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )
  
  function addItem(product: any) {
    const existingItem = items.value.find(item => item.productId === product.id)
    
    if (existingItem) {
      existingItem.quantity++
    } else {
      items.value.push({
        id: `cart-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      })
    }
    
    // 同步到缓存
    engine.cache.set('cart_items', items.value, 86400000)
    
    // 触发事件
    engine.events.emit('cart:item-added', product)
    
    engine.notifications.success(`${product.name} 已添加到购物车`)
    engine.logger.info('添加到购物车', { productId: product.id })
  }
  
  function removeItem(itemId: string) {
    const item = items.value.find(i => i.id === itemId)
    items.value = items.value.filter(i => i.id !== itemId)
    
    engine.cache.set('cart_items', items.value, 86400000)
    engine.events.emit('cart:item-removed', item)
    engine.notifications.info('商品已移除')
  }
  
  function updateQuantity(itemId: string, quantity: number) {
    const item = items.value.find(i => i.id === itemId)
    if (item) {
      item.quantity = quantity
      engine.cache.set('cart_items', items.value, 86400000)
      engine.events.emit('cart:quantity-updated', { itemId, quantity })
    }
  }
  
  function clear() {
    items.value = []
    engine.cache.remove('cart_items')
    engine.events.emit('cart:cleared')
    engine.notifications.info('购物车已清空')
  }
  
  return {
    items,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clear
  }
})
```

### 3. 在组件中使用

```vue
<template>
  <div class="cart">
    <h2>购物车 ({{ cart.itemCount }})</h2>
    
    <div v-for="item in cart.items" :key="item.id" class="cart-item">
      <span>{{ item.name }}</span>
      <span>¥{{ item.price }}</span>
      <input
        type="number"
        :value="item.quantity"
        @input="updateQuantity(item.id, $event.target.value)"
      >
      <button @click="cart.removeItem(item.id)">删除</button>
    </div>
    
    <div class="cart-total">
      总计: ¥{{ cart.total }}
    </div>
    
    <button @click="checkout" :disabled="cart.itemCount === 0">
      结算
    </button>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useEngine } from '@ldesign/engine/vue'

const engine = useEngine()
const cart = useCartStore()
const auth = useAuthStore()

function updateQuantity(itemId: string, value: string) {
  const quantity = parseInt(value)
  if (quantity > 0) {
    cart.updateQuantity(itemId, quantity)
  }
}

async function checkout() {
  if (!auth.isAuthenticated) {
    engine.notifications.warning('请先登录')
    return
  }
  
  try {
    engine.logger.info('开始结算', { itemCount: cart.itemCount })
    
    // 结算逻辑...
    await processCheckout(cart.items)
    
    cart.clear()
    engine.notifications.success('订单已创建')
  } catch (error) {
    engine.logger.error('结算失败', error)
    engine.notifications.error('结算失败，请重试')
  }
}
</script>
```

## 最佳实践

### 1. 状态分离

- **Engine 状态**: 全局配置、系统状态、跨模块状态
- **Pinia 状态**: 业务模块状态、组件状态

### 2. 事件通信

使用 Engine 事件系统进行 Store 间通信：

```typescript
// stores/order.ts
export const useOrderStore = defineStore('order', () => {
  const engine = useEngine()
  
  // 监听购物车结算事件
  engine.events.on('cart:checkout', async (items) => {
    await createOrder(items)
  })
  
  return { /* ... */ }
})
```

### 3. 缓存策略

```typescript
// stores/product.ts
export const useProductStore = defineStore('product', () => {
  const engine = useEngine()
  
  async function fetchProducts() {
    // 先从缓存获取
    const cached = await engine.cache.get('products')
    if (cached) {
      return cached
    }
    
    // 请求新数据
    const data = await api.fetchProducts()
    
    // 缓存数据
    await engine.cache.set('products', data, 300000) // 5分钟
    
    return data
  }
  
  return { fetchProducts }
})
```

### 4. 错误处理

```typescript
export const useDataStore = defineStore('data', () => {
  const engine = useEngine()
  
  async function loadData() {
    try {
      const data = await api.fetchData()
      return data
    } catch (error) {
      // 使用 Engine 的错误处理
      engine.errors.captureError(error as Error)
      engine.notifications.error('数据加载失败')
      throw error
    }
  }
  
  return { loadData }
})
```

## 性能优化

### 1. 选择性持久化

```typescript
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'light',
    language: 'zh-CN'
  }),
  persist: {
    key: 'app-settings',
    storage: localStorage
  }
})
```

### 2. 计算属性缓存

结合 Engine 缓存和 Pinia 计算属性：

```typescript
export const useStatsStore = defineStore('stats', () => {
  const engine = useEngine()
  
  const expensiveComputation = computed(async () => {
    const cacheKey = 'stats-computation'
    
    // 检查缓存
    const cached = await engine.cache.get(cacheKey)
    if (cached) return cached
    
    // 执行计算
    const result = performExpensiveComputation()
    
    // 缓存结果
    await engine.cache.set(cacheKey, result, 60000)
    
    return result
  })
  
  return { expensiveComputation }
})
```

## 总结

LDesign Engine 和 Pinia 的集成提供了：

- ✅ **灵活的状态管理**: 结合两者优势
- ✅ **统一的事件系统**: 跨 Store 通信
- ✅ **智能缓存**: 提升性能
- ✅ **完善的日志**: 便于调试
- ✅ **类型安全**: 完整的 TypeScript 支持

选择适合你项目的集成方案，构建高效的应用！

## 相关资源

- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Engine 状态管理](/guide/state)
- [Engine 事件系统](/guide/events)
- [Engine 缓存管理](/guide/cache)


