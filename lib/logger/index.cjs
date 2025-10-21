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

var logger = require('./logger.cjs');

const defaultLogger = logger.createUnifiedLogger({
  level: "info",
  format: "pretty",
  console: true
});

exports.ErrorTrackingPlugin = logger.ErrorTrackingPlugin;
exports.Logger = logger.UnifiedLogger;
exports.PerformancePlugin = logger.PerformancePlugin;
exports.SamplingPlugin = logger.SamplingPlugin;
exports.UnifiedLogger = logger.UnifiedLogger;
exports.createLogger = logger.createLogger;
exports.createUnifiedLogger = logger.createUnifiedLogger;
exports.defaultLogger = defaultLogger;
//# sourceMappingURL=index.cjs.map
