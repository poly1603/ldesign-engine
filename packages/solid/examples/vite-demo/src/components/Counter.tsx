import { Component } from 'solid-js'
import { useEngineState } from '@ldesign/engine-solid'

const Counter: Component = () => {
  const [count, setCount] = useEngineState<number>('count', 0)

  const increment = () => setCount((prev) => (prev || 0) + 1)
  const decrement = () => setCount((prev) => (prev || 0) - 1)
  const reset = () => setCount(0)

  return (
    <div class="counter">
      <div class="counter-value">{count()}</div>
      <div class="counter-buttons">
        <button onClick={decrement}>-1</button>
        <button onClick={reset}>重置</button>
        <button onClick={increment}>+1</button>
      </div>
    </div>
  )
}

export default Counter


