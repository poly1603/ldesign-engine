<template>
  <div class="app">
    <h1>{{ appName }}</h1>
    
    <div class="user-info">
      <h2>用户信息</h2>
      <p v-if="user">
        欢迎，{{ user.name }}（角色：{{ user.role }}）
      </p>
      <p v-else>未登录</p>
      
      <button @click="login" v-if="!user">
        登录
      </button>
      <button @click="logout" v-else>
        退出
      </button>
    </div>

    <div class="demo-section">
      <h2>防抖输入演示</h2>
      <input
        v-model="searchQuery"
        placeholder="输入搜索关键词（300ms防抖）"
        @input="handleSearch"
      />
      <p>搜索结果: {{ searchResult }}</p>
    </div>

    <div class="demo-section">
      <h2>缓存演示</h2>
      <button @click="setCache">设置缓存</button>
      <button @click="getCache">获取缓存</button>
      <p>缓存值: {{ cacheValue }}</p>
    </div>

    <div class="demo-section">
      <h2>事件演示</h2>
      <button @click="emitEvent">触发自定义事件</button>
      <p>事件计数: {{ eventCount }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useEngine } from '@ldesign/engine/vue'
import { debounce } from '@ldesign/engine/utils'

const engine = useEngine()

// 应用名称
const appName = computed(() => engine.config.get('appName', 'Engine Demo'))

// 用户状态
const user = computed(() => engine.state.get<{ name: string; role: string }>('user'))

// 搜索
const searchQuery = ref('')
const searchResult = ref('')

const handleSearch = debounce((e: Event) => {
  const target = e.target as HTMLInputElement
  searchResult.value = `搜索: ${target.value}`
  engine.logger.debug('执行搜索', { query: target.value })
}, 300)

// 登录/登出
function login() {
  engine.events.emit('user:login', {
    name: 'Alice',
    role: 'admin'
  })
}

function logout() {
  engine.state.remove('user')
  engine.logger.info('用户已登出')
}

// 缓存演示
const cacheValue = ref('')

async function setCache() {
  await engine.cache.set('demo-key', 'Hello Cache!', 60000)
  engine.logger.info('缓存已设置')
}

async function getCache() {
  const value = await engine.cache.get('demo-key')
  cacheValue.value = value || '无缓存'
}

// 事件演示
const eventCount = ref(0)

function emitEvent() {
  engine.events.emit('demo:event', { count: eventCount.value + 1 })
}

// 生命周期
onMounted(() => {
  // 监听自定义事件
  engine.events.on('demo:event', (data: any) => {
    eventCount.value = data.count
    engine.logger.info('收到事件', data)
  })

  engine.logger.info('组件已挂载')
})

onBeforeUnmount(() => {
  engine.logger.info('组件即将卸载')
})
</script>

<style scoped>
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #2c3e50;
  border-bottom: 2px solid #42b983;
  padding-bottom: 10px;
}

h2 {
  color: #42b983;
  font-size: 1.2em;
  margin-top: 20px;
}

.user-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  margin: 20px 0;
}

.demo-section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

button {
  background: #42b983;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

button:hover {
  background: #35a372;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

p {
  margin: 10px 0;
  color: #666;
}
</style>

