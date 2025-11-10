<template>
  <div class="home">
    <div class="hero">
      <h1>🏠 欢迎使用 LDesign Engine</h1>
      <p>基于 Vue 2 的现代化引擎框架</p>
    </div>

    <!-- 配置面板 -->
    <ConfigPanel />

    <div class="counter">
      <h2>计数器演示</h2>
      <div class="counter-display">{{ count }}</div>
      <div class="counter-buttons">
        <button class="btn-secondary" @click="decrement">-</button>
        <button class="btn-secondary" @click="reset">重置</button>
        <button class="btn-primary" @click="increment">+</button>
      </div>
    </div>

    <div class="features">
      <div class="feature">
        <h3>⚡️ Vue 2</h3>
        <p>使用 Vue 2.7 构建应用</p>
      </div>
      <div class="feature">
        <h3>🔧 插件系统</h3>
        <p>强大的插件系统，轻松扩展功能</p>
      </div>
      <div class="feature">
        <h3>🎯 类型安全</h3>
        <p>完整的 TypeScript 支持</p>
      </div>
      <div class="feature">
        <h3>🚀 路由系统</h3>
        <p>集成 @ldesign/router 提供完整的路由功能</p>
      </div>
    </div>
  </div>
</template>

<script>
import { getEngine } from '@ldesign/engine-vue2'
import ConfigPanel from '../components/ConfigPanel.vue'

export default {
  name: 'Home',
  components: { ConfigPanel },
  data() {
    return {
      count: 0,
      unsubscribe: null,
    }
  },
  created() {
    const engine = getEngine()
    this.count = engine.state.get('count') || 0
    this.unsubscribe = engine.state.watch('count', (value) => {
      this.count = value
    })
  },
  beforeDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  },
  methods: {
    increment() {
      this.count++
      const engine = getEngine()
      engine.state.set('count', this.count)
      engine.events.emit('counter:changed', { count: this.count })
    },
    decrement() {
      this.count--
      const engine = getEngine()
      engine.state.set('count', this.count)
      engine.events.emit('counter:changed', { count: this.count })
    },
    reset() {
      this.count = 0
      const engine = getEngine()
      engine.state.set('count', this.count)
      engine.events.emit('counter:reset', { count: this.count })
    },
  },
}
</script>

<style scoped>
.home {
  padding: 2rem;
}

.hero {
  text-align: center;
  padding: 3rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.hero h1 {
  margin: 0 0 1rem;
  font-size: 2.5rem;
}

.counter {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.counter h2 {
  margin: 0 0 1rem;
  color: #333;
}

.counter-display {
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
  margin: 1rem 0;
}

.counter-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #f3f4f6;
  color: #333;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature {
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feature h3 {
  margin: 0 0 0.5rem;
  color: #667eea;
}

.feature p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}
</style>

