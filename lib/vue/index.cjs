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

var useEngine = require('./composables/useEngine.cjs');
var useEngineFeatures = require('./composables/useEngineFeatures.cjs');
var plugin = require('./plugin.cjs');



exports.useEngine = useEngine.useEngine;
exports.useEngineAvailable = useEngine.useEngineAvailable;
exports.useEngineConfig = useEngine.useEngineConfig;
exports.useEngineErrors = useEngine.useEngineErrors;
exports.useEngineEvents = useEngine.useEngineEvents;
exports.useEngineLogger = useEngine.useEngineLogger;
exports.useEngineMiddleware = useEngine.useEngineMiddleware;
exports.useEngineNotifications = useEngine.useEngineNotifications;
exports.useEnginePlugins = useEngine.useEnginePlugins;
exports.useEngineState = useEngine.useEngineState;
exports.useCache = useEngineFeatures.useCache;
exports.useConfig = useEngineFeatures.useConfig;
exports.useErrorHandler = useEngineFeatures.useErrorHandler;
exports.useEvents = useEngineFeatures.useEvents;
exports.useLogger = useEngineFeatures.useLogger;
exports.useNotification = useEngineFeatures.useNotification;
exports.usePerformance = useEngineFeatures.usePerformance;
exports.usePlugins = useEngineFeatures.usePlugins;
exports.createAndMountApp = plugin.createAndMountApp;
exports.createVueEnginePlugin = plugin.createVueEnginePlugin;
exports.defineEngineModel = plugin.defineEngineModel;
exports.engineComponent = plugin.engineComponent;
exports.installEngine = plugin.installEngine;
exports.setupDevtools = plugin.setupDevtools;
//# sourceMappingURL=index.cjs.map
