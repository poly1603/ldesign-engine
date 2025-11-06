/**
 * Svelte 配置文件
 */
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  // 使用 Vite 预处理器
  preprocess: vitePreprocess(),

  compilerOptions: {
    // Svelte 5.x 编译选项
    runes: true,
  },
}





