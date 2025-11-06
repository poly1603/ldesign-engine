<template>
  <div class="page">
    <h2>👤 用户详情</h2>
    
    <div v-if="user" class="card">
      <div class="user-profile">
        <div class="user-avatar">{{ user.avatar }}</div>
        <div class="user-info">
          <h3>{{ user.name }}</h3>
          <p class="user-role">{{ user.role }}</p>
          <p class="user-email">{{ user.email }}</p>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>🔄 切换用户</h3>
      <div class="user-switcher">
        <button
          v-for="u in Object.values(mockUsers)"
          :key="u.id"
          @click="handleUserChange(u.id)"
          :class="{ active: userId === u.id }"
        >
          {{ u.avatar }} {{ u.name }}
        </button>
      </div>
    </div>

    <div v-if="user" class="card">
      <h3>📊 用户统计</h3>
      <table class="info-table">
        <tbody>
          <tr>
            <td><strong>用户 ID:</strong></td>
            <td>{{ user.id }}</td>
          </tr>
          <tr>
            <td><strong>姓名:</strong></td>
            <td>{{ user.name }}</td>
          </tr>
          <tr>
            <td><strong>角色:</strong></td>
            <td>{{ user.role }}</td>
          </tr>
          <tr>
            <td><strong>邮箱:</strong></td>
            <td>{{ user.email }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3>🛣️ 路由参数</h3>
      <p>当前路由参数: <code>id = {{ userId }}</code></p>
      <p class="hint">
        这个页面演示了如何使用路由参数。尝试切换不同的用户，观察 URL 的变化。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useEngine } from '@ldesign/engine-vue3'

const engine = useEngine()

// 模拟用户数据
const mockUsers: Record<string, any> = {
  '1': { id: '1', name: 'Alice', role: 'Admin', email: 'alice@example.com', avatar: '👩' },
  '2': { id: '2', name: 'Bob', role: 'User', email: 'bob@example.com', avatar: '👨' },
  '3': { id: '3', name: 'Charlie', role: 'Developer', email: 'charlie@example.com', avatar: '👨‍💻' },
}

const userId = ref('1')
const user = computed(() => mockUsers[userId.value] || mockUsers['1'])

// 从路由参数获取用户 ID
onMounted(() => {
  if (engine.router) {
    const route = engine.router.getCurrentRoute()
    const id = route.value?.params?.id || '1'
    userId.value = id
  }
})

// 监听用户变化，更新 engine 状态
watch(user, (newUser) => {
  engine.state.set('currentUser', newUser)
}, { immediate: true })

const handleUserChange = (newUserId: string) => {
  userId.value = newUserId
  
  // 如果路由器可用，使用路由导航
  if (engine.router) {
    engine.router.push(`/user/${newUserId}`)
  }
}
</script>

