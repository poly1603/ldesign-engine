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

var configManager = require('./config/config-manager.cjs');
var engine = require('./core/engine.cjs');
var errorManager = require('./errors/error-manager.cjs');
var eventManager = require('./events/event-manager.cjs');
var logger = require('./logger/logger.cjs');
var middlewareManager = require('./middleware/middleware-manager.cjs');
var pluginManager = require('./plugins/plugin-manager.cjs');
var stateManager = require('./state/state-manager.cjs');

const version = "1.0.0";

exports.ConfigManagerImpl = configManager.ConfigManagerImpl;
exports.createConfigManager = configManager.createConfigManager;
exports.EngineImpl = engine.EngineImpl;
exports.createErrorManager = errorManager.createErrorManager;
exports.ENGINE_EVENTS = eventManager.ENGINE_EVENTS;
exports.createEventManager = eventManager.createEventManager;
exports.createLogger = logger.createLogger;
exports.createMiddlewareManager = middlewareManager.createMiddlewareManager;
exports.createPluginManager = pluginManager.createPluginManager;
exports.createStateManager = stateManager.createStateManager;
exports.version = version;
//# sourceMappingURL=core.cjs.map
