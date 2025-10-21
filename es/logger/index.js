/*!
 * ***********************************
 * @ldesign/engine v0.3.0          *
 * Built with rollup               *
 * Build time: 2024-10-21 14:33:07 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { createUnifiedLogger } from './logger.js';
export { ErrorTrackingPlugin, UnifiedLogger as Logger, PerformancePlugin, SamplingPlugin, UnifiedLogger, createLogger } from './logger.js';

const defaultLogger = createUnifiedLogger({
  level: "info",
  format: "pretty",
  console: true
});

export { createUnifiedLogger, defaultLogger };
//# sourceMappingURL=index.js.map
