<script lang="ts">
  import { createEngineStore } from '@ldesign/engine-svelte'

  const [count, setCount] = createEngineStore<number>('count', 0)

  const increment = () => setCount((prev) => (prev || 0) + 1)
  const decrement = () => setCount((prev) => (prev || 0) - 1)
  const reset = () => setCount(0)
</script>

<div class="counter">
  <div class="counter-value">{$count}</div>
  <div class="counter-buttons">
    <button on:click={decrement}>-1</button>
    <button on:click={reset}>重置</button>
    <button on:click={increment}>+1</button>
  </div>
</div>

<style>
  .counter {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .counter-value {
    font-size: 3rem;
    font-weight: bold;
    color: #ff3e00;
  }

  .counter-buttons {
    display: flex;
    gap: 1rem;
  }
</style>


