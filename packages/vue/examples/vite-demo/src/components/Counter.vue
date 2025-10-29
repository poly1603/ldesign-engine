<template>
  <div class="counter">
    <div class="counter-value">{{ count }}</div>
    <div class="counter-buttons">
      <button @click="decrement">-1</button>
      <button @click="reset">重置</button>
      <button @click="increment">+1</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEngineState } from '@ldesign/engine-vue3'

const [count, setCount] = useEngineState<number>('count', 0)

const increment = () => setCount((prev) => (prev || 0) + 1)
const decrement = () => setCount((prev) => (prev || 0) - 1)
const reset = () => setCount(0)
</script>

<style scoped>
.counter {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.counter-value {
  font-size: 3rem;
  font-weight: bold;
  color: #42b983;
}

.counter-buttons {
  display: flex;
  gap: 1rem;
}
</style>


