/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { DirectiveBase } from '../base/directive-base.js';
import { defineDirective, directiveUtils } from '../base/vue-directive-adapter.js';

class InfiniteScrollDirective extends DirectiveBase {
  constructor() {
    super({
      name: "infinite-scroll",
      description: "\u65E0\u9650\u6EDA\u52A8\u52A0\u8F7D\u66F4\u591A\u6570\u636E",
      version: "1.0.0",
      category: "interaction",
      tags: ["infinite", "scroll", "load-more", "pagination"]
    });
  }
  mounted(el, binding) {
    const config = this.parseConfig(binding);
    if (!config.callback || typeof config.callback !== "function") {
      this.warn("Infinite scroll directive requires a callback function");
      return;
    }
    const distance = config.distance ?? 100;
    const delay = config.delay ?? 200;
    const container = this.getContainer(el, config.container);
    let isLoading = false;
    let timeoutId = null;
    const handleScroll = async () => {
      if (config.disabled || isLoading)
        return;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      timeoutId = setTimeout(async () => {
        const scrollTop = container === window ? window.pageYOffset || document.documentElement.scrollTop : container.scrollTop;
        const scrollHeight = container === window ? document.documentElement.scrollHeight : container.scrollHeight;
        const clientHeight = container === window ? window.innerHeight : container.clientHeight;
        if (scrollTop + clientHeight >= scrollHeight - distance) {
          isLoading = true;
          try {
            if (config.callback) {
              await config.callback();
            }
          } catch (error) {
            this.warn("Error in infinite scroll callback:", error);
          } finally {
            isLoading = false;
          }
        }
        timeoutId = null;
      }, delay);
    };
    directiveUtils.storeData(el, "infinite-scroll-handler", handleScroll);
    directiveUtils.storeData(el, "infinite-scroll-container", container);
    directiveUtils.storeData(el, "infinite-scroll-timeout", timeoutId);
    container.addEventListener("scroll", handleScroll, { passive: true });
    if (config.immediate) {
      handleScroll();
    }
    this.log("Infinite scroll directive mounted", el);
  }
  updated(el, binding) {
    this.cleanup(el);
    this.mounted(el, binding);
    this.log("Infinite scroll directive updated", el);
  }
  unmounted(el) {
    this.cleanup(el);
    this.log("Infinite scroll directive unmounted", el);
  }
  cleanup(el) {
    const handler = directiveUtils.getData(el, "infinite-scroll-handler");
    const container = directiveUtils.getData(el, "infinite-scroll-container");
    const timeout = directiveUtils.getData(el, "infinite-scroll-timeout");
    if (handler && container) {
      const typedContainer = container;
      typedContainer.removeEventListener("scroll", handler);
    }
    if (timeout) {
      clearTimeout(timeout);
    }
    directiveUtils.removeData(el, "infinite-scroll-handler");
    directiveUtils.removeData(el, "infinite-scroll-container");
    directiveUtils.removeData(el, "infinite-scroll-timeout");
    if (el && typeof el === "object") {
      el.__infiniteScroll = null;
    }
  }
  getContainer(el, container) {
    if (!container) {
      return window;
    }
    if (typeof container === "string") {
      const containerEl = document.querySelector(container);
      return containerEl || window;
    }
    return container;
  }
  parseConfig(binding) {
    const value = binding.value;
    if (typeof value === "function") {
      return { callback: value };
    }
    if (typeof value === "object" && value !== null) {
      return value;
    }
    return {};
  }
  getExample() {
    return `
<!-- Basic infinite scroll -->
<div v-infinite-scroll="loadMore" class="list-container">
  <div v-for="item in items" :key="item.id" class="list-item">
    {{ item.name }}
  </div>
  <div v-if="loading" class="loading">Loading...</div>
</div>

<!-- With options -->
<div v-infinite-scroll="{
  callback: loadMoreData,
  distance: 200,
  delay: 300,
  immediate: true
}" class="scroll-container">
  <article v-for="post in posts" :key="post.id">
    {{ post.title }}
  </article>
</div>

<!-- Custom container -->
<div class="wrapper">
  <div 
    v-infinite-scroll="{
      callback: fetchMore,
      container: '.scroll-area',
      disabled: isDisabled
    }"
    class="scroll-area"
    style="height: 500px; overflow-y: auto;"
  >
    <div v-for="n in count" :key="n">
      Item {{ n }}
    </div>
  </div>
</div>

<script setup>
import { ref } from 'vue'

const items = ref([])
const loading = ref(false)
const hasMore = ref(true)

const loadMore = async () => {
  if (loading.value || !hasMore.value) return
  
  loading.value = true
  try {
    const response = await fetch('/api/items?page=' + nextPage)
    const data = await response.json()
    items.value.push(...data.items)
    hasMore.value = data.hasMore
  } finally {
    loading.value = false
  }
}
<\/script>
    `;
  }
}
const vInfiniteScroll = defineDirective(new InfiniteScrollDirective());

export { InfiniteScrollDirective, vInfiniteScroll as default, vInfiniteScroll };
//# sourceMappingURL=infinite-scroll.js.map
