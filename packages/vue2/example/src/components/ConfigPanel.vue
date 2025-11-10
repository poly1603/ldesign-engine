<template>
  <div class="config-panel">
    <h3>📋 应用配置信息</h3>
    <div class="grid">
      <section>
        <h4>应用信息</h4>
        <div>名称：<b>{{ appConfig.app?.name }}</b></div>
        <div>版本：<code>{{ appConfig.app?.version }}</code></div>
        <div>描述：{{ appConfig.app?.description }}</div>
      </section>
      <section>
        <h4>API</h4>
        <div>baseUrl：<code>{{ appConfig.api?.baseUrl }}</code></div>
        <div>timeout：{{ appConfig.api?.timeout }} ms</div>
      </section>
      <section>
        <h4>特性</h4>
        <div>分析：{{ appConfig.features?.enableAnalytics ? '✅' : '❌' }}</div>
        <div>调试：{{ appConfig.features?.enableDebug ? '✅' : '❌' }}</div>
      </section>
      <section>
        <h4>主题</h4>
        <div>主色：<span class="dot" :style="{ background: appConfig.theme?.primaryColor }"></span> {{ appConfig.theme?.primaryColor }}</div>
        <div>模式：{{ appConfig.theme?.mode }}</div>
      </section>
      <section>
        <h4>环境</h4>
        <div>mode：<code>{{ appEnvironment.mode }}</code></div>
        <div>dev：{{ appEnvironment.isDev ? '✅' : '❌' }} / prod：{{ appEnvironment.isProd ? '✅' : '❌' }}</div>
      </section>
    </div>
  </div>
</template>
<script>
import { appConfigMixin } from '@ldesign/launcher/client/vue2'
export default { name: 'ConfigPanel', mixins: [appConfigMixin] }
</script>
<style scoped>
.config-panel{border:2px solid #42b883;border-radius:12px;padding:12px;margin-bottom:16px;background:linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}
section{background:#fff;padding:10px;border-radius:8px}
.dot{display:inline-block;width:14px;height:14px;border-radius:7px;margin-right:6px;vertical-align:-2px}
</style>

