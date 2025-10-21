/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { inject, ref, provide } from 'vue';

function usePluginState(key, defaultValue) {
  const injected = inject(key);
  if (injected) {
    return injected;
  }
  const state = ref(defaultValue);
  provide(key, state);
  return state;
}
function useLocale(defaultValue = "zh-CN") {
  return usePluginState("locale", defaultValue);
}
function useTheme(defaultValue = "blue") {
  return usePluginState("theme", defaultValue);
}
function useSize(defaultValue = "medium") {
  return usePluginState("size", defaultValue);
}
function useDark(defaultValue = false) {
  return usePluginState("dark", defaultValue);
}
function createSharedState(key, defaultValue) {
  return () => usePluginState(key, defaultValue);
}
function usePluginStates(states) {
  const result = {};
  for (const key in states) {
    result[key] = usePluginState(key, states[key]);
  }
  return result;
}

export { createSharedState, useDark, useLocale, usePluginState, usePluginStates, useSize, useTheme };
//# sourceMappingURL=use-plugin-state.js.map
