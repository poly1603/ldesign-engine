<script lang="ts">
  import { useEventListener, useEventEmitter } from '@ldesign/engine-svelte'

  interface EventLogItem {
    id: number
    event: string
    payload: any
    timestamp: string
  }

  let logs: EventLogItem[] = []
  const emit = useEventEmitter()

  // 监听自定义事件
  useEventListener('custom:event', (payload) => {
    addLog('custom:event', payload)
  })

  useEventListener('button:clicked', (payload) => {
    addLog('button:clicked', payload)
  })

  const addLog = (event: string, payload: any) => {
    const logItem: EventLogItem = {
      id: Date.now(),
      event,
      payload,
      timestamp: new Date().toLocaleTimeString()
    }
    logs = [logItem, ...logs].slice(0, 10)
  }

  const handleEmitEvent = () => {
    emit('custom:event', {
      message: 'Hello from Svelte!',
      timestamp: Date.now()
    })
  }

  const handleButtonClick = () => {
    emit('button:clicked', {
      button: 'demo-button',
      timestamp: Date.now()
    })
  }

  const clearLogs = () => {
    logs = []
  }
</script>

<div class="event-demo">
  <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
    <button on:click={handleEmitEvent}>发送自定义事件</button>
    <button on:click={handleButtonClick}>按钮点击事件</button>
    <button on:click={clearLogs}>清空日志</button>
  </div>

  <div class="event-log">
    {#if logs.length === 0}
      <div class="event-log-empty">暂无事件日志</div>
    {:else}
      {#each logs as log (log.id)}
        <div class="event-log-item">
          <strong>{log.event}</strong> @ {log.timestamp}
          <br />
          <code>{JSON.stringify(log.payload, null, 2)}</code>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .event-demo {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .event-log {
    padding: 1rem;
    background: white;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 0.875rem;
  }

  .event-log-item {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    background: #f0f0f0;
    border-radius: 4px;
  }

  .event-log-empty {
    color: #999;
    text-align: center;
    padding: 2rem;
  }
</style>


