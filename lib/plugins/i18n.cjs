/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:09 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
'use strict';

var vue = require('vue');

function createI18nEnginePlugin(options = {}) {
  return {
    name: "i18n-engine-plugin",
    version: "1.0.0",
    async install(context) {
      const { engine } = context;
      const app = engine.app;
      if (options.adapter && engine.setI18n) {
        engine.setI18n(options.adapter);
        engine.logger?.info("I18n adapter installed");
      }
      const defaultLocale = options.defaultLocale || "en";
      if (engine.state) {
        engine.state.set("i18n.locale", defaultLocale);
        engine.state.set("i18n.fallbackLocale", defaultLocale);
      }
      const currentLocale = vue.ref(defaultLocale);
      let unwatch = () => {
      };
      if (engine.state?.watch) {
        unwatch = engine.state.watch("i18n.locale", async (newLocale, oldLocale) => {
          if (newLocale && newLocale !== oldLocale) {
            currentLocale.value = newLocale;
            if (options.onLocaleChange) {
              try {
                await options.onLocaleChange(newLocale, oldLocale);
              } catch (error) {
                engine.logger?.error("Error in locale change hook", { error });
              }
            }
            if (engine.events?.emit) {
              engine.events.emit("i18n:locale-changed", {
                newLocale,
                oldLocale,
                timestamp: Date.now()
              });
            }
          }
        });
      }
      const setLocale = (locale) => {
        if (engine.state) {
          engine.state.set("i18n.locale", locale);
        }
        if (engine.i18n?.setLocale) {
          engine.i18n.setLocale(locale);
        }
      };
      const getLocale = () => {
        const localeValue = engine.state?.get("i18n.locale");
        return typeof localeValue === "string" ? localeValue : defaultLocale;
      };
      app.provide("engine-i18n", engine.i18n);
      app.provide("engine-locale", currentLocale);
      app.provide("setEngineLocale", setLocale);
      app.provide("getEngineLocale", getLocale);
      app.config.globalProperties.$engineLocale = currentLocale;
      app.config.globalProperties.$setEngineLocale = setLocale;
      app.config.globalProperties.$getEngineLocale = getLocale;
      engine.logger?.debug("I18n engine plugin installed with reactive locale support");
      if (app.unmount) {
        const originalUnmount = app.unmount;
        app.unmount = function() {
          unwatch();
          originalUnmount.call(this);
        };
      }
    }
  };
}

exports.createI18nEnginePlugin = createI18nEnginePlugin;
//# sourceMappingURL=i18n.cjs.map
