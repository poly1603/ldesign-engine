<script lang="ts">
  import { getEngineContext } from '@ldesign/engine-svelte'
  import './DemoCard.css'

  interface EventLogEntry {
    timestamp: string
    event: string
    data: string
  }

  const engine = getEngineContext()

  let eventName = $state('custom:event')
  let eventData = $state('Hello from Svelte!')
  let eventLog = $state<EventLogEntry[]>([])

  // 监听事件
  $effect(() => {
    const addLog = (event: string, data: any) => {
      const timestamp = new Date().toLocaleTimeString()
      eventLog = [
        {
          timestamp,
          event,
          data: typeof data === 'object' ? JSON.stringify(data) : String(data),
        },
        ...eventLog,
      ].slice(0, 20) // 限制日志数量
    }

    // 监听自定义事件
    const customUnsub = engine.events.on('custom:event', (data: any) => {
      addLog('custom:event', data)
    })

    // 监听欢迎事件
    const welcomeUnsub = engine.events.on('app:welcome', (data: any) => {
      addLog('app:welcome', data)
    })

    // 监听用户事件
    const loginUnsub = engine.events.on('user:login', (data: any) => {
      addLog('user:login', data)
    })

    const logoutUnsub = engine.events.on('user:logout', (data: any) => {
      addLog('user:logout', data)
    })

    // 清理
    return () => {
      customUnsub()
      welcomeUnsub()
      loginUnsub()
      logoutUnsub()
    }
  })

  function emitEvent() {
    if (eventName) {
      engine.events.emit(eventName, eventData)
    }
  }

  async function emitAsyncEvent() {
    if (eventName) {
      await engine.events.emitAsync(eventName, eventData)
      alert('异步事件触发完成!')
    }
  }

  function clearLog() {
    eventLog = []
  }
</script>

<div class="demo-card">
  <h2>📡 事件系统演示</h2>
  <div class="demo-content">
    <div class="event-controls">
      <div class="input-group">
        <label>事件名称:</label>
        <input
          bind:value={eventName}
          type="text"
          placeholder="输入事件名称"
          class="input"
        />
      </div>
      <div class="input-group">
        <label>事件数据:</label>
        <input
          bind:value={eventData}
          type="text"
          placeholder="输入事件数据"
          class="input"
        />
      </div>
    </div>

    <div class="actions">
      <button onclick={emitEvent} class="btn btn-primary">
        触发事件
      </button>
      <button onclick={emitAsyncEvent} class="btn btn-secondary">
        触发异步事件
      </button>
      <button onclick={clearLog} class="btn btn-secondary">
        清空日志
      </button>
    </div>

    {#if eventLog.length > 0}
      <div class="log">
        <strong>事件日志:</strong>
        <div class="log-entries">
          {#each eventLog as entry (entry.timestamp + entry.event)}
            <div class="log-entry">
              <span class="timestamp">{entry.timestamp}</span>
              <span class="event-name">{entry.event}</span>
              <span class="event-data">{entry.data}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="info">
      <p>💡 提示: 所有事件都会被 logger 插件记录到控制台</p>
    </div>
  </div>
</div>
