<template>
  <div class="demo-card">
    <h2>🔌 插件系统演示</h2>
    <div class="demo-content">
      <div class="info-grid">
        <div class="info-item">
          <strong>已安装插件:</strong>
          <ul v-if="plugins.length > 0">
            <li v-for="plugin in plugins" :key="plugin.name">
              {{ plugin.name }} v{{ plugin.version }}
            </li>
          </ul>
          <p v-else class="empty">暂无插件</p>
        </div>
        <div class="info-item">
          <strong>插件数量:</strong>
          <span class="badge">{{ pluginCount }}</span>
        </div>
      </div>
      
      <div class="actions">
        <button @click="installPlugin" class="btn btn-primary">
          安装新插件
        </button>
        <button @click="uninstallPlugin" class="btn btn-secondary">
          卸载插件
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PluginDemo',
  data() {
    return {
      plugins: [] as any[],
      pluginCount: 0,
    }
  },
  mounted() {
    this.updatePluginInfo()
  },
  methods: {
    updatePluginInfo() {
      const engine = (this as any).$engine
      if (engine) {
        this.pluginCount = engine.plugins.size()
        this.plugins = Array.from(engine.plugins.getAll().values())
      }
    },
    async installPlugin() {
      const engine = (this as any).$engine
      if (!engine) return

      const newPlugin = {
        name: `plugin-${Date.now()}`,
        version: '1.0.0',
        install(context: any) {
          console.log(`✅ 插件 ${newPlugin.name} 已安装`)
          context.engine.state.set(`plugin-${newPlugin.name}`, {
            installed: true,
            timestamp: Date.now(),
          })
        },
      }

      try {
        await engine.use(newPlugin)
        this.updatePluginInfo()
        alert(`插件 ${newPlugin.name} 安装成功!`)
      } catch (error: any) {
        alert(`插件安装失败: ${error.message}`)
      }
    },
    async uninstallPlugin() {
      const engine = (this as any).$engine
      if (!engine || this.plugins.length === 0) {
        alert('没有可卸载的插件')
        return
      }

      const lastPlugin = this.plugins[this.plugins.length - 1]
      try {
        await engine.plugins.uninstall(lastPlugin.name)
        this.updatePluginInfo()
        alert(`插件 ${lastPlugin.name} 卸载成功!`)
      } catch (error: any) {
        alert(`插件卸载失败: ${error.message}`)
      }
    },
  },
})
</script>

<style scoped>
.demo-card {
  padding: 1.5rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-card h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.5rem;
}

.demo-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

.info-item {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.info-item strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
}

.info-item ul {
  margin: 0;
  padding-left: 1.5rem;
}

.info-item li {
  margin: 0.25rem 0;
  color: #666;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #667eea;
  color: white;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1.2rem;
}

.empty {
  color: #999;
  font-style: italic;
  margin: 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}
</style>

