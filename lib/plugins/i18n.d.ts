import type { I18nAdapter } from '../types/base';
import type { Plugin } from '../types/plugin';
export interface I18nEnginePluginOptions {
    adapter?: I18nAdapter;
    defaultLocale?: string;
    onLocaleChange?: (newLocale: string, oldLocale: string) => void | Promise<void>;
}
/**
 * @deprecated Use `createI18nEnginePlugin` from '@ldesign/i18n' instead for full i18n functionality
 *
 * This is a simplified i18n adapter integration for engine.
 * For complete internationalization support, use @ldesign/i18n package:
 *
 * @example
 * ```typescript
 * import { createI18nEnginePlugin } from '@ldesign/i18n'
 *
 * const i18nPlugin = createI18nEnginePlugin({
 *   locale: 'zh-CN',
 *   messages: { ... }
 * })
 * ```
 *
 * @see https://github.com/ldesign/ldesign/tree/main/packages/i18n
 */
export declare function createI18nEnginePlugin(options?: I18nEnginePluginOptions): Plugin;
