<template>
  <div id="app" class="app">
    <Navigation />
    <RouterView />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Navigation from './components/Navigation.vue'
import RouterView from './components/RouterView.vue'

export default Vue.extend({
  name: 'App',
  components: {
    Navigation,
    RouterView,
  },
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: #f8f9fa;
}
</style>

