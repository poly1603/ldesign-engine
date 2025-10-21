/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
function createLocaleAwarePlugin(plugin, options) {
  const { name, syncLocale = true, version = "1.0.0", afterInstall } = options;
  return {
    name: `${name}-locale-aware`,
    version,
    async install(context) {
      const { engine } = context;
      const app = engine.app;
      if (typeof plugin.install === "function") {
        plugin.install(app);
        engine.logger?.debug(`Plugin "${name}" installed`, { syncLocale });
      }
      if (syncLocale && engine.localeManager) {
        engine.localeManager.register(name, plugin);
        engine.logger?.debug(`Plugin "${name}" registered to LocaleManager`);
      }
      if (engine.state) {
        engine.state.set(`plugins.${name}`, plugin);
      }
      if (afterInstall) {
        await afterInstall(engine, app);
      }
      engine.logger?.info(`Locale-aware plugin "${name}" installed successfully`);
    }
  };
}
function createSimpleLocaleAwarePlugin(pluginFactory, name) {
  return (options) => {
    const plugin = pluginFactory(options);
    return createLocaleAwarePlugin(plugin, { name });
  };
}

export { createLocaleAwarePlugin, createSimpleLocaleAwarePlugin };
//# sourceMappingURL=create-locale-aware-plugin.js.map
