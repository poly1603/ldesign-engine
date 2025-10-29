<template>
  <div class="app">
    <header class="header">
      <h1>@ldesign/engine-vue3</h1>
      <p>Vue3 adapter for @ldesign/engine-core</p>
    </header>

    <main class="main">
      <section class="section">
        <h2>计数器示例</h2>
        <p>展示 useEngineState 状态管理</p>
        <Counter />
      </section>

      <section class="section">
        <h2>事件系统示例</h2>
        <p>展示 useEventListener 和 useEventEmitter</p>
        <EventDemo />
      </section>

      <section class="section section-full">
        <CacheDemo />
      </section>

      <section class="section section-full">
        <StateDemo />
      </section>
    </main>

    <footer class="footer">
      <p>Powered by @ldesign/engine</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import Counter from './components/Counter.vue'
import EventDemo from './components/EventDemo.vue'
import CacheDemo from './components/CacheDemo.vue'
import StateDemo from './components/StateDemo.vue'
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
}

.header h1 {
  font-size: 2.5rem;
  color: #42b983;
  margin-bottom: 0.5rem;
}

.header p {
  font-size: 1.2rem;
  color: #666;
}

.main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.section-full {
  grid-column: 1 / -1;
}

.section {
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.section p {
  color: #666;
  margin-bottom: 1.5rem;
}

.footer {
  text-align: center;
  padding-top: 2rem;
  border-top: 2px solid #e0e0e0;
  color: #999;
}
</style>

<style>
button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  background-color: #42b983;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #359268;
}

button:active {
  transform: translateY(1px);
}
</style>


