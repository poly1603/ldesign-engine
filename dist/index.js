/*!
 * @ldesign/engine v1.0.0
 * (c) 2025 LDesign Team
 * @license MIT
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vue')) :
    typeof define === 'function' && define.amd ? define(['exports', 'vue'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.LDesignEngine = {}, global.Vue));
})(this, (function (exports, vue) { 'use strict';

    /**
     * 引擎状态枚举
     */
    var EngineState;
    (function (EngineState) {
        EngineState["CREATED"] = "created";
        EngineState["MOUNTING"] = "mounting";
        EngineState["MOUNTED"] = "mounted";
        EngineState["UNMOUNTING"] = "unmounting";
        EngineState["UNMOUNTED"] = "unmounted";
        EngineState["DESTROYING"] = "destroying";
        EngineState["DESTROYED"] = "destroyed";
        EngineState["ERROR"] = "error";
    })(EngineState || (EngineState = {}));
    /**
     * 错误类型
     */
    class EngineError extends Error {
        constructor(message, code, context) {
            super(message);
            Object.defineProperty(this, "code", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: code
            });
            Object.defineProperty(this, "context", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: context
            });
            this.name = 'EngineError';
        }
    }
    class PluginError extends EngineError {
        constructor(message, pluginName, context) {
            super(message, 'PLUGIN_ERROR', context);
            Object.defineProperty(this, "pluginName", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: pluginName
            });
            this.name = 'PluginError';
        }
    }
    class MiddlewareError extends EngineError {
        constructor(message, hook, context) {
            super(message, 'MIDDLEWARE_ERROR', context);
            Object.defineProperty(this, "hook", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: hook
            });
            this.name = 'MiddlewareError';
        }
    }
    class ConfigError extends EngineError {
        constructor(message, key, context) {
            super(message, 'CONFIG_ERROR', context);
            Object.defineProperty(this, "key", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: key
            });
            this.name = 'ConfigError';
        }
    }

    /**
     * 事件发射器实现
     * 提供高性能的事件发布订阅机制
     */
    class EventEmitterImpl {
        constructor() {
            Object.defineProperty(this, "events", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "onceEvents", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "maxListeners", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: 100
            });
        }
        /**
         * 发射事件
         */
        emit(event, ...args) {
            // 处理普通监听器
            const handlers = this.events.get(event);
            if (handlers) {
                for (const handler of handlers) {
                    try {
                        handler(...args);
                    }
                    catch (error) {
                        console.error(`Error in event handler for '${event}':`, error);
                    }
                }
            }
            // 处理一次性监听器
            const onceHandlers = this.onceEvents.get(event);
            if (onceHandlers) {
                for (const handler of onceHandlers) {
                    try {
                        handler(...args);
                    }
                    catch (error) {
                        console.error(`Error in once event handler for '${event}':`, error);
                    }
                }
                // 清除一次性监听器
                this.onceEvents.delete(event);
            }
        }
        /**
         * 添加事件监听器
         */
        on(event, handler) {
            if (typeof handler !== 'function') {
                throw new TypeError('Event handler must be a function');
            }
            let handlers = this.events.get(event);
            if (!handlers) {
                handlers = new Set();
                this.events.set(event, handlers);
            }
            // 检查监听器数量限制
            if (handlers.size >= this.maxListeners) {
                console.warn(`MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ` +
                    `${handlers.size + 1} ${event} listeners added. ` +
                    `Use setMaxListeners() to increase limit.`);
            }
            handlers.add(handler);
            // 返回取消订阅函数
            return () => this.off(event, handler);
        }
        /**
         * 移除事件监听器
         */
        off(event, handler) {
            if (!handler) {
                // 移除所有监听器
                this.events.delete(event);
                this.onceEvents.delete(event);
                return;
            }
            // 移除普通监听器
            const handlers = this.events.get(event);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    this.events.delete(event);
                }
            }
            // 移除一次性监听器
            const onceHandlers = this.onceEvents.get(event);
            if (onceHandlers) {
                onceHandlers.delete(handler);
                if (onceHandlers.size === 0) {
                    this.onceEvents.delete(event);
                }
            }
        }
        /**
         * 添加一次性事件监听器
         */
        once(event, handler) {
            if (typeof handler !== 'function') {
                throw new TypeError('Event handler must be a function');
            }
            let onceHandlers = this.onceEvents.get(event);
            if (!onceHandlers) {
                onceHandlers = new Set();
                this.onceEvents.set(event, onceHandlers);
            }
            onceHandlers.add(handler);
            // 返回取消订阅函数
            return () => this.off(event, handler);
        }
        /**
         * 移除所有监听器
         */
        removeAllListeners(event) {
            if (event) {
                this.events.delete(event);
                this.onceEvents.delete(event);
            }
            else {
                this.events.clear();
                this.onceEvents.clear();
            }
        }
        /**
         * 获取事件监听器数量
         */
        listenerCount(event) {
            const handlers = this.events.get(event);
            const onceHandlers = this.onceEvents.get(event);
            return (handlers?.size || 0) + (onceHandlers?.size || 0);
        }
        /**
         * 获取所有事件名称
         */
        eventNames() {
            const names = new Set();
            for (const event of this.events.keys()) {
                names.add(event);
            }
            for (const event of this.onceEvents.keys()) {
                names.add(event);
            }
            return Array.from(names);
        }
        /**
         * 设置最大监听器数量
         */
        setMaxListeners(n) {
            if (typeof n !== 'number' || n < 0 || Number.isNaN(n)) {
                throw new TypeError('n must be a non-negative number');
            }
            this.maxListeners = n;
        }
        /**
         * 获取最大监听器数量
         */
        getMaxListeners() {
            return this.maxListeners;
        }
        /**
         * 检查是否有监听器
         */
        hasListeners(event) {
            return this.listenerCount(event) > 0;
        }
        /**
         * 获取事件监听器列表
         */
        listeners(event) {
            const handlers = this.events.get(event);
            const onceHandlers = this.onceEvents.get(event);
            const result = [];
            if (handlers) {
                result.push(...handlers);
            }
            if (onceHandlers) {
                result.push(...onceHandlers);
            }
            return result;
        }
        /**
         * 销毁事件发射器
         */
        destroy() {
            this.removeAllListeners();
        }
    }

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

    /** Detect free variable `self`. */
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal || freeSelf || Function('return this')();

    /** Built-in value references. */
    var Symbol = root.Symbol;

    /** Used for built-in method references. */
    var objectProto$a = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$8 = objectProto$a.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString$1 = objectProto$a.toString;

    /** Built-in value references. */
    var symToStringTag$1 = Symbol ? Symbol.toStringTag : undefined;

    /**
     * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the raw `toStringTag`.
     */
    function getRawTag(value) {
      var isOwn = hasOwnProperty$8.call(value, symToStringTag$1),
          tag = value[symToStringTag$1];

      try {
        value[symToStringTag$1] = undefined;
        var unmasked = true;
      } catch (e) {}

      var result = nativeObjectToString$1.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag$1] = tag;
        } else {
          delete value[symToStringTag$1];
        }
      }
      return result;
    }

    /** Used for built-in method references. */
    var objectProto$9 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString = objectProto$9.toString;

    /**
     * Converts `value` to a string using `Object.prototype.toString`.
     *
     * @private
     * @param {*} value The value to convert.
     * @returns {string} Returns the converted string.
     */
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }

    /** `Object#toString` result references. */
    var nullTag = '[object Null]',
        undefinedTag = '[object Undefined]';

    /** Built-in value references. */
    var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

    /**
     * The base implementation of `getTag` without fallbacks for buggy environments.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function baseGetTag(value) {
      if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
      }
      return (symToStringTag && symToStringTag in Object(value))
        ? getRawTag(value)
        : objectToString(value);
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return value != null && typeof value == 'object';
    }

    /** `Object#toString` result references. */
    var symbolTag = '[object Symbol]';

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike(value) && baseGetTag(value) == symbolTag);
    }

    /**
     * A specialized version of `_.map` for arrays without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} [array] The array to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function arrayMap(array, iteratee) {
      var index = -1,
          length = array == null ? 0 : array.length,
          result = Array(length);

      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(document.body.children);
     * // => false
     *
     * _.isArray('abc');
     * // => false
     *
     * _.isArray(_.noop);
     * // => false
     */
    var isArray = Array.isArray;

    /** Used to convert symbols to primitives and strings. */
    var symbolProto = Symbol ? Symbol.prototype : undefined,
        symbolToString = symbolProto ? symbolProto.toString : undefined;

    /**
     * The base implementation of `_.toString` which doesn't convert nullish
     * values to empty strings.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {string} Returns the string.
     */
    function baseToString(value) {
      // Exit early for strings to avoid a performance hit in some environments.
      if (typeof value == 'string') {
        return value;
      }
      if (isArray(value)) {
        // Recursively convert values (susceptible to call stack limits).
        return arrayMap(value, baseToString) + '';
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : '';
      }
      var result = (value + '');
      return (result == '0' && (1 / value) == -Infinity) ? '-0' : result;
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == 'object' || type == 'function');
    }

    /**
     * This method returns the first argument it receives.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'a': 1 };
     *
     * console.log(_.identity(object) === object);
     * // => true
     */
    function identity(value) {
      return value;
    }

    /** `Object#toString` result references. */
    var asyncTag = '[object AsyncFunction]',
        funcTag$1 = '[object Function]',
        genTag = '[object GeneratorFunction]',
        proxyTag = '[object Proxy]';

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      if (!isObject(value)) {
        return false;
      }
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 9 which returns 'object' for typed arrays and other constructors.
      var tag = baseGetTag(value);
      return tag == funcTag$1 || tag == genTag || tag == asyncTag || tag == proxyTag;
    }

    /** Used to detect overreaching core-js shims. */
    var coreJsData = root['__core-js_shared__'];

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
      return uid ? ('Symbol(src)_1.' + uid) : '';
    }());

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && (maskSrcKey in func);
    }

    /** Used for built-in method references. */
    var funcProto$2 = Function.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString$2 = funcProto$2.toString;

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to convert.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString$2.call(func);
        } catch (e) {}
        try {
          return (func + '');
        } catch (e) {}
      }
      return '';
    }

    /**
     * Used to match `RegExp`
     * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
     */
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

    /** Used to detect host constructors (Safari). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /** Used for built-in method references. */
    var funcProto$1 = Function.prototype,
        objectProto$8 = Object.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString$1 = funcProto$1.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty$7 = objectProto$8.hasOwnProperty;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      funcToString$1.call(hasOwnProperty$7).replace(reRegExpChar, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /**
     * The base implementation of `_.isNative` without bad shim checks.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     */
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }

    /**
     * Gets the value at `key` of `object`.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function getValue(object, key) {
      return object == null ? undefined : object[key];
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : undefined;
    }

    /** Built-in value references. */
    var objectCreate = Object.create;

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} proto The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    var baseCreate = (function() {
      function object() {}
      return function(proto) {
        if (!isObject(proto)) {
          return {};
        }
        if (objectCreate) {
          return objectCreate(proto);
        }
        object.prototype = proto;
        var result = new object;
        object.prototype = undefined;
        return result;
      };
    }());

    /**
     * A faster alternative to `Function#apply`, this function invokes `func`
     * with the `this` binding of `thisArg` and the arguments of `args`.
     *
     * @private
     * @param {Function} func The function to invoke.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {Array} args The arguments to invoke `func` with.
     * @returns {*} Returns the result of `func`.
     */
    function apply(func, thisArg, args) {
      switch (args.length) {
        case 0: return func.call(thisArg);
        case 1: return func.call(thisArg, args[0]);
        case 2: return func.call(thisArg, args[0], args[1]);
        case 3: return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function copyArray(source, array) {
      var index = -1,
          length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    /** Used to detect hot functions by number of calls within a span of milliseconds. */
    var HOT_COUNT = 800,
        HOT_SPAN = 16;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeNow = Date.now;

    /**
     * Creates a function that'll short out and invoke `identity` instead
     * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
     * milliseconds.
     *
     * @private
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new shortable function.
     */
    function shortOut(func) {
      var count = 0,
          lastCalled = 0;

      return function() {
        var stamp = nativeNow(),
            remaining = HOT_SPAN - (stamp - lastCalled);

        lastCalled = stamp;
        if (remaining > 0) {
          if (++count >= HOT_COUNT) {
            return arguments[0];
          }
        } else {
          count = 0;
        }
        return func.apply(undefined, arguments);
      };
    }

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Util
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new constant function.
     * @example
     *
     * var objects = _.times(2, _.constant({ 'a': 1 }));
     *
     * console.log(objects);
     * // => [{ 'a': 1 }, { 'a': 1 }]
     *
     * console.log(objects[0] === objects[1]);
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    var defineProperty = (function() {
      try {
        var func = getNative(Object, 'defineProperty');
        func({}, '', {});
        return func;
      } catch (e) {}
    }());

    /**
     * The base implementation of `setToString` without support for hot loop shorting.
     *
     * @private
     * @param {Function} func The function to modify.
     * @param {Function} string The `toString` result.
     * @returns {Function} Returns `func`.
     */
    var baseSetToString = !defineProperty ? identity : function(func, string) {
      return defineProperty(func, 'toString', {
        'configurable': true,
        'enumerable': false,
        'value': constant(string),
        'writable': true
      });
    };

    /**
     * Sets the `toString` method of `func` to return `string`.
     *
     * @private
     * @param {Function} func The function to modify.
     * @param {Function} string The `toString` result.
     * @returns {Function} Returns `func`.
     */
    var setToString = shortOut(baseSetToString);

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER$1 = 9007199254740991;

    /** Used to detect unsigned integer values. */
    var reIsUint = /^(?:0|[1-9]\d*)$/;

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      var type = typeof value;
      length = length == null ? MAX_SAFE_INTEGER$1 : length;

      return !!length &&
        (type == 'number' ||
          (type != 'symbol' && reIsUint.test(value))) &&
            (value > -1 && value % 1 == 0 && value < length);
    }

    /**
     * The base implementation of `assignValue` and `assignMergeValue` without
     * value checks.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function baseAssignValue(object, key, value) {
      if (key == '__proto__' && defineProperty) {
        defineProperty(object, key, {
          'configurable': true,
          'enumerable': true,
          'value': value,
          'writable': true
        });
      } else {
        object[key] = value;
      }
    }

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq(value, other) {
      return value === other || (value !== value && other !== other);
    }

    /** Used for built-in method references. */
    var objectProto$7 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$6 = objectProto$7.hasOwnProperty;

    /**
     * Assigns `value` to `key` of `object` if the existing value is not equivalent
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function assignValue(object, key, value) {
      var objValue = object[key];
      if (!(hasOwnProperty$6.call(object, key) && eq(objValue, value)) ||
          (value === undefined && !(key in object))) {
        baseAssignValue(object, key, value);
      }
    }

    /**
     * Copies properties of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy properties from.
     * @param {Array} props The property identifiers to copy.
     * @param {Object} [object={}] The object to copy properties to.
     * @param {Function} [customizer] The function to customize copied values.
     * @returns {Object} Returns `object`.
     */
    function copyObject(source, props, object, customizer) {
      var isNew = !object;
      object || (object = {});

      var index = -1,
          length = props.length;

      while (++index < length) {
        var key = props[index];

        var newValue = undefined;

        if (newValue === undefined) {
          newValue = source[key];
        }
        if (isNew) {
          baseAssignValue(object, key, newValue);
        } else {
          assignValue(object, key, newValue);
        }
      }
      return object;
    }

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max;

    /**
     * A specialized version of `baseRest` which transforms the rest array.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @param {Function} transform The rest array transform.
     * @returns {Function} Returns the new function.
     */
    function overRest(func, start, transform) {
      start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
      return function() {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            array = Array(length);

        while (++index < length) {
          array[index] = args[start + index];
        }
        index = -1;
        var otherArgs = Array(start + 1);
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = transform(array);
        return apply(func, this, otherArgs);
      };
    }

    /**
     * The base implementation of `_.rest` which doesn't validate or coerce arguments.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     */
    function baseRest(func, start) {
      return setToString(overRest(func, start, identity), func + '');
    }

    /** Used as references for various `Number` constants. */
    var MAX_SAFE_INTEGER = 9007199254740991;

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }

    /**
     * Checks if the given arguments are from an iteratee call.
     *
     * @private
     * @param {*} value The potential iteratee value argument.
     * @param {*} index The potential iteratee index or key argument.
     * @param {*} object The potential iteratee object argument.
     * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
     *  else `false`.
     */
    function isIterateeCall(value, index, object) {
      if (!isObject(object)) {
        return false;
      }
      var type = typeof index;
      if (type == 'number'
            ? (isArrayLike(object) && isIndex(index, object.length))
            : (type == 'string' && index in object)
          ) {
        return eq(object[index], value);
      }
      return false;
    }

    /**
     * Creates a function like `_.assign`.
     *
     * @private
     * @param {Function} assigner The function to assign values.
     * @returns {Function} Returns the new assigner function.
     */
    function createAssigner(assigner) {
      return baseRest(function(object, sources) {
        var index = -1,
            length = sources.length,
            customizer = length > 1 ? sources[length - 1] : undefined,
            guard = length > 2 ? sources[2] : undefined;

        customizer = (assigner.length > 3 && typeof customizer == 'function')
          ? (length--, customizer)
          : undefined;

        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          customizer = length < 3 ? undefined : customizer;
          length = 1;
        }
        object = Object(object);
        while (++index < length) {
          var source = sources[index];
          if (source) {
            assigner(object, source, index, customizer);
          }
        }
        return object;
      });
    }

    /** Used for built-in method references. */
    var objectProto$6 = Object.prototype;

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype(value) {
      var Ctor = value && value.constructor,
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$6;

      return value === proto;
    }

    /**
     * The base implementation of `_.times` without support for iteratee shorthands
     * or max array length checks.
     *
     * @private
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the array of results.
     */
    function baseTimes(n, iteratee) {
      var index = -1,
          result = Array(n);

      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }

    /** `Object#toString` result references. */
    var argsTag$1 = '[object Arguments]';

    /**
     * The base implementation of `_.isArguments`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     */
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag$1;
    }

    /** Used for built-in method references. */
    var objectProto$5 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$5 = objectProto$5.hasOwnProperty;

    /** Built-in value references. */
    var propertyIsEnumerable = objectProto$5.propertyIsEnumerable;

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
      return isObjectLike(value) && hasOwnProperty$5.call(value, 'callee') &&
        !propertyIsEnumerable.call(value, 'callee');
    };

    /**
     * This method returns `false`.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {boolean} Returns `false`.
     * @example
     *
     * _.times(2, _.stubFalse);
     * // => [false, false]
     */
    function stubFalse() {
      return false;
    }

    /** Detect free variable `exports`. */
    var freeExports$2 = typeof exports == 'object' && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule$2 = freeExports$2 && typeof module == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports$2 = freeModule$2 && freeModule$2.exports === freeExports$2;

    /** Built-in value references. */
    var Buffer$1 = moduleExports$2 ? root.Buffer : undefined;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeIsBuffer = Buffer$1 ? Buffer$1.isBuffer : undefined;

    /**
     * Checks if `value` is a buffer.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
     * @example
     *
     * _.isBuffer(new Buffer(2));
     * // => true
     *
     * _.isBuffer(new Uint8Array(2));
     * // => false
     */
    var isBuffer = nativeIsBuffer || stubFalse;

    /** `Object#toString` result references. */
    var argsTag = '[object Arguments]',
        arrayTag = '[object Array]',
        boolTag = '[object Boolean]',
        dateTag = '[object Date]',
        errorTag = '[object Error]',
        funcTag = '[object Function]',
        mapTag = '[object Map]',
        numberTag = '[object Number]',
        objectTag$1 = '[object Object]',
        regexpTag = '[object RegExp]',
        setTag = '[object Set]',
        stringTag = '[object String]',
        weakMapTag = '[object WeakMap]';

    var arrayBufferTag = '[object ArrayBuffer]',
        dataViewTag = '[object DataView]',
        float32Tag = '[object Float32Array]',
        float64Tag = '[object Float64Array]',
        int8Tag = '[object Int8Array]',
        int16Tag = '[object Int16Array]',
        int32Tag = '[object Int32Array]',
        uint8Tag = '[object Uint8Array]',
        uint8ClampedTag = '[object Uint8ClampedArray]',
        uint16Tag = '[object Uint16Array]',
        uint32Tag = '[object Uint32Array]';

    /** Used to identify `toStringTag` values of typed arrays. */
    var typedArrayTags = {};
    typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
    typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
    typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
    typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
    typedArrayTags[uint32Tag] = true;
    typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
    typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
    typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
    typedArrayTags[errorTag] = typedArrayTags[funcTag] =
    typedArrayTags[mapTag] = typedArrayTags[numberTag] =
    typedArrayTags[objectTag$1] = typedArrayTags[regexpTag] =
    typedArrayTags[setTag] = typedArrayTags[stringTag] =
    typedArrayTags[weakMapTag] = false;

    /**
     * The base implementation of `_.isTypedArray` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     */
    function baseIsTypedArray(value) {
      return isObjectLike(value) &&
        isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
    }

    /**
     * The base implementation of `_.unary` without support for storing metadata.
     *
     * @private
     * @param {Function} func The function to cap arguments for.
     * @returns {Function} Returns the new capped function.
     */
    function baseUnary(func) {
      return function(value) {
        return func(value);
      };
    }

    /** Detect free variable `exports`. */
    var freeExports$1 = typeof exports == 'object' && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule$1 = freeExports$1 && typeof module == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;

    /** Detect free variable `process` from Node.js. */
    var freeProcess = moduleExports$1 && freeGlobal.process;

    /** Used to access faster Node.js helpers. */
    var nodeUtil = (function() {
      try {
        // Use `util.types` for Node.js 10+.
        var types = freeModule$1 && freeModule$1.require && freeModule$1.require('util').types;

        if (types) {
          return types;
        }

        // Legacy `process.binding('util')` for Node.js < 10.
        return freeProcess && freeProcess.binding && freeProcess.binding('util');
      } catch (e) {}
    }());

    /* Node.js helper references. */
    var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

    /**
     * Creates an array of the enumerable property names of the array-like `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @param {boolean} inherited Specify returning inherited property names.
     * @returns {Array} Returns the array of property names.
     */
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray(value),
          isArg = !isArr && isArguments(value),
          isBuff = !isArr && !isArg && isBuffer(value),
          isType = !isArr && !isArg && !isBuff && isTypedArray(value),
          skipIndexes = isArr || isArg || isBuff || isType,
          result = skipIndexes ? baseTimes(value.length, String) : [],
          length = result.length;

      for (var key in value) {
        if (!(skipIndexes && (
               // Safari 9 has enumerable `arguments.length` in strict mode.
               key == 'length' ||
               // Node.js 0.10 has enumerable non-index properties on buffers.
               (isBuff && (key == 'offset' || key == 'parent')) ||
               // PhantomJS 2 has enumerable non-index properties on typed arrays.
               (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
               // Skip index properties.
               isIndex(key, length)
            ))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Creates a unary function that invokes `func` with its argument transformed.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {Function} transform The argument transform.
     * @returns {Function} Returns the new function.
     */
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }

    /**
     * This function is like
     * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * except that it includes inherited enumerable properties.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function nativeKeysIn(object) {
      var result = [];
      if (object != null) {
        for (var key in Object(object)) {
          result.push(key);
        }
      }
      return result;
    }

    /** Used for built-in method references. */
    var objectProto$4 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$4 = objectProto$4.hasOwnProperty;

    /**
     * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeysIn(object) {
      if (!isObject(object)) {
        return nativeKeysIn(object);
      }
      var isProto = isPrototype(object),
          result = [];

      for (var key in object) {
        if (!(key == 'constructor' && (isProto || !hasOwnProperty$4.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Creates an array of the own and inherited enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keysIn(new Foo);
     * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
     */
    function keysIn(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeysIn(object);
    }

    /** Used to match property names within property paths. */
    var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
        reIsPlainProp = /^\w*$/;

    /**
     * Checks if `value` is a property name and not a property path.
     *
     * @private
     * @param {*} value The value to check.
     * @param {Object} [object] The object to query keys on.
     * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
     */
    function isKey(value, object) {
      if (isArray(value)) {
        return false;
      }
      var type = typeof value;
      if (type == 'number' || type == 'symbol' || type == 'boolean' ||
          value == null || isSymbol(value)) {
        return true;
      }
      return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
        (object != null && value in Object(object));
    }

    /* Built-in method references that are verified to be native. */
    var nativeCreate = getNative(Object, 'create');

    /**
     * Removes all key-value entries from the hash.
     *
     * @private
     * @name clear
     * @memberOf Hash
     */
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the hash.
     *
     * @private
     * @name delete
     * @memberOf Hash
     * @param {Object} hash The hash to modify.
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

    /** Used for built-in method references. */
    var objectProto$3 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$3 = objectProto$3.hasOwnProperty;

    /**
     * Gets the hash value for `key`.
     *
     * @private
     * @name get
     * @memberOf Hash
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED$1 ? undefined : result;
      }
      return hasOwnProperty$3.call(data, key) ? data[key] : undefined;
    }

    /** Used for built-in method references. */
    var objectProto$2 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$2 = objectProto$2.hasOwnProperty;

    /**
     * Checks if a hash value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Hash
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? (data[key] !== undefined) : hasOwnProperty$2.call(data, key);
    }

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED = '__lodash_hash_undefined__';

    /**
     * Sets the hash `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Hash
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the hash instance.
     */
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
      return this;
    }

    /**
     * Creates a hash object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Hash(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `Hash`.
    Hash.prototype.clear = hashClear;
    Hash.prototype['delete'] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;

    /**
     * Removes all key-value entries from the list cache.
     *
     * @private
     * @name clear
     * @memberOf ListCache
     */
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }

    /**
     * Gets the index at which the `key` is found in `array` of key-value pairs.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} key The key to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }

    /** Used for built-in method references. */
    var arrayProto = Array.prototype;

    /** Built-in value references. */
    var splice = arrayProto.splice;

    /**
     * Removes `key` and its value from the list cache.
     *
     * @private
     * @name delete
     * @memberOf ListCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function listCacheDelete(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }

    /**
     * Gets the list cache value for `key`.
     *
     * @private
     * @name get
     * @memberOf ListCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function listCacheGet(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      return index < 0 ? undefined : data[index][1];
    }

    /**
     * Checks if a list cache value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf ListCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }

    /**
     * Sets the list cache `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf ListCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the list cache instance.
     */
    function listCacheSet(key, value) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }

    /**
     * Creates an list cache object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function ListCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `ListCache`.
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype['delete'] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;

    /* Built-in method references that are verified to be native. */
    var Map$1 = getNative(root, 'Map');

    /**
     * Removes all key-value entries from the map.
     *
     * @private
     * @name clear
     * @memberOf MapCache
     */
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        'hash': new Hash,
        'map': new (Map$1 || ListCache),
        'string': new Hash
      };
    }

    /**
     * Checks if `value` is suitable for use as unique object key.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
     */
    function isKeyable(value) {
      var type = typeof value;
      return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
        ? (value !== '__proto__')
        : (value === null);
    }

    /**
     * Gets the data for `map`.
     *
     * @private
     * @param {Object} map The map to query.
     * @param {string} key The reference key.
     * @returns {*} Returns the map data.
     */
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key)
        ? data[typeof key == 'string' ? 'string' : 'hash']
        : data.map;
    }

    /**
     * Removes `key` and its value from the map.
     *
     * @private
     * @name delete
     * @memberOf MapCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function mapCacheDelete(key) {
      var result = getMapData(this, key)['delete'](key);
      this.size -= result ? 1 : 0;
      return result;
    }

    /**
     * Gets the map value for `key`.
     *
     * @private
     * @name get
     * @memberOf MapCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }

    /**
     * Checks if a map value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf MapCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }

    /**
     * Sets the map `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf MapCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the map cache instance.
     */
    function mapCacheSet(key, value) {
      var data = getMapData(this, key),
          size = data.size;

      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }

    /**
     * Creates a map cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function MapCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `MapCache`.
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype['delete'] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;

    /** Error message constants. */
    var FUNC_ERROR_TEXT = 'Expected a function';

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided, it determines the cache key for storing the result based on the
     * arguments provided to the memoized function. By default, the first argument
     * provided to the memoized function is used as the map cache key. The `func`
     * is invoked with the `this` binding of the memoized function.
     *
     * **Note:** The cache is exposed as the `cache` property on the memoized
     * function. Its creation may be customized by replacing the `_.memoize.Cache`
     * constructor with one whose instances implement the
     * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
     * method interface of `clear`, `delete`, `get`, `has`, and `set`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] The function to resolve the cache key.
     * @returns {Function} Returns the new memoized function.
     * @example
     *
     * var object = { 'a': 1, 'b': 2 };
     * var other = { 'c': 3, 'd': 4 };
     *
     * var values = _.memoize(_.values);
     * values(object);
     * // => [1, 2]
     *
     * values(other);
     * // => [3, 4]
     *
     * object.a = 2;
     * values(object);
     * // => [1, 2]
     *
     * // Modify the result cache.
     * values.cache.set(object, ['a', 'b']);
     * values(object);
     * // => ['a', 'b']
     *
     * // Replace `_.memoize.Cache`.
     * _.memoize.Cache = WeakMap;
     */
    function memoize(func, resolver) {
      if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var memoized = function() {
        var args = arguments,
            key = resolver ? resolver.apply(this, args) : args[0],
            cache = memoized.cache;

        if (cache.has(key)) {
          return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result) || cache;
        return result;
      };
      memoized.cache = new (memoize.Cache || MapCache);
      return memoized;
    }

    // Expose `MapCache`.
    memoize.Cache = MapCache;

    /** Used as the maximum memoize cache size. */
    var MAX_MEMOIZE_SIZE = 500;

    /**
     * A specialized version of `_.memoize` which clears the memoized function's
     * cache when it exceeds `MAX_MEMOIZE_SIZE`.
     *
     * @private
     * @param {Function} func The function to have its output memoized.
     * @returns {Function} Returns the new memoized function.
     */
    function memoizeCapped(func) {
      var result = memoize(func, function(key) {
        if (cache.size === MAX_MEMOIZE_SIZE) {
          cache.clear();
        }
        return key;
      });

      var cache = result.cache;
      return result;
    }

    /** Used to match property names within property paths. */
    var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

    /** Used to match backslashes in property paths. */
    var reEscapeChar = /\\(\\)?/g;

    /**
     * Converts `string` to a property path array.
     *
     * @private
     * @param {string} string The string to convert.
     * @returns {Array} Returns the property path array.
     */
    var stringToPath = memoizeCapped(function(string) {
      var result = [];
      if (string.charCodeAt(0) === 46 /* . */) {
        result.push('');
      }
      string.replace(rePropName, function(match, number, quote, subString) {
        result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
      });
      return result;
    });

    /**
     * Converts `value` to a string. An empty string is returned for `null`
     * and `undefined` values. The sign of `-0` is preserved.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {string} Returns the converted string.
     * @example
     *
     * _.toString(null);
     * // => ''
     *
     * _.toString(-0);
     * // => '-0'
     *
     * _.toString([1, 2, 3]);
     * // => '1,2,3'
     */
    function toString(value) {
      return value == null ? '' : baseToString(value);
    }

    /**
     * Casts `value` to a path array if it's not one.
     *
     * @private
     * @param {*} value The value to inspect.
     * @param {Object} [object] The object to query keys on.
     * @returns {Array} Returns the cast property path array.
     */
    function castPath(value, object) {
      if (isArray(value)) {
        return value;
      }
      return isKey(value, object) ? [value] : stringToPath(toString(value));
    }

    /**
     * Converts `value` to a string key if it's not a string or symbol.
     *
     * @private
     * @param {*} value The value to inspect.
     * @returns {string|symbol} Returns the key.
     */
    function toKey(value) {
      if (typeof value == 'string' || isSymbol(value)) {
        return value;
      }
      var result = (value + '');
      return (result == '0' && (1 / value) == -Infinity) ? '-0' : result;
    }

    /**
     * The base implementation of `_.get` without support for default values.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to get.
     * @returns {*} Returns the resolved value.
     */
    function baseGet(object, path) {
      path = castPath(path, object);

      var index = 0,
          length = path.length;

      while (object != null && index < length) {
        object = object[toKey(path[index++])];
      }
      return (index && index == length) ? object : undefined;
    }

    /**
     * Gets the value at `path` of `object`. If the resolved value is
     * `undefined`, the `defaultValue` is returned in its place.
     *
     * @static
     * @memberOf _
     * @since 3.7.0
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to get.
     * @param {*} [defaultValue] The value returned for `undefined` resolved values.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.get(object, 'a[0].b.c');
     * // => 3
     *
     * _.get(object, ['a', '0', 'b', 'c']);
     * // => 3
     *
     * _.get(object, 'a.b.c', 'default');
     * // => 'default'
     */
    function get(object, path, defaultValue) {
      var result = object == null ? undefined : baseGet(object, path);
      return result === undefined ? defaultValue : result;
    }

    /** Built-in value references. */
    var getPrototype = overArg(Object.getPrototypeOf, Object);

    /** `Object#toString` result references. */
    var objectTag = '[object Object]';

    /** Used for built-in method references. */
    var funcProto = Function.prototype,
        objectProto$1 = Object.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString = funcProto.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

    /** Used to infer the `Object` constructor. */
    var objectCtorString = funcToString.call(Object);

    /**
     * Checks if `value` is a plain object, that is, an object created by the
     * `Object` constructor or one with a `[[Prototype]]` of `null`.
     *
     * @static
     * @memberOf _
     * @since 0.8.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     * }
     *
     * _.isPlainObject(new Foo);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     *
     * _.isPlainObject(Object.create(null));
     * // => true
     */
    function isPlainObject(value) {
      if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
        return false;
      }
      var proto = getPrototype(value);
      if (proto === null) {
        return true;
      }
      var Ctor = hasOwnProperty$1.call(proto, 'constructor') && proto.constructor;
      return typeof Ctor == 'function' && Ctor instanceof Ctor &&
        funcToString.call(Ctor) == objectCtorString;
    }

    /**
     * The base implementation of `_.slice` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseSlice(array, start, end) {
      var index = -1,
          length = array.length;

      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = end > length ? length : end;
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : ((end - start) >>> 0);
      start >>>= 0;

      var result = Array(length);
      while (++index < length) {
        result[index] = array[index + start];
      }
      return result;
    }

    /**
     * Removes all key-value entries from the stack.
     *
     * @private
     * @name clear
     * @memberOf Stack
     */
    function stackClear() {
      this.__data__ = new ListCache;
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the stack.
     *
     * @private
     * @name delete
     * @memberOf Stack
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function stackDelete(key) {
      var data = this.__data__,
          result = data['delete'](key);

      this.size = data.size;
      return result;
    }

    /**
     * Gets the stack value for `key`.
     *
     * @private
     * @name get
     * @memberOf Stack
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function stackGet(key) {
      return this.__data__.get(key);
    }

    /**
     * Checks if a stack value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Stack
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function stackHas(key) {
      return this.__data__.has(key);
    }

    /** Used as the size to enable large array optimizations. */
    var LARGE_ARRAY_SIZE = 200;

    /**
     * Sets the stack `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Stack
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the stack cache instance.
     */
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof ListCache) {
        var pairs = data.__data__;
        if (!Map$1 || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
          pairs.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new MapCache(pairs);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }

    /**
     * Creates a stack cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Stack(entries) {
      var data = this.__data__ = new ListCache(entries);
      this.size = data.size;
    }

    // Add methods to `Stack`.
    Stack.prototype.clear = stackClear;
    Stack.prototype['delete'] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;

    /** Detect free variable `exports`. */
    var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

    /** Detect free variable `module`. */
    var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

    /** Detect the popular CommonJS extension `module.exports`. */
    var moduleExports = freeModule && freeModule.exports === freeExports;

    /** Built-in value references. */
    var Buffer = moduleExports ? root.Buffer : undefined;
        Buffer ? Buffer.allocUnsafe : undefined;

    /**
     * Creates a clone of  `buffer`.
     *
     * @private
     * @param {Buffer} buffer The buffer to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Buffer} Returns the cloned buffer.
     */
    function cloneBuffer(buffer, isDeep) {
      {
        return buffer.slice();
      }
    }

    /** Built-in value references. */
    var Uint8Array = root.Uint8Array;

    /**
     * Creates a clone of `arrayBuffer`.
     *
     * @private
     * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
     * @returns {ArrayBuffer} Returns the cloned array buffer.
     */
    function cloneArrayBuffer(arrayBuffer) {
      var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
      new Uint8Array(result).set(new Uint8Array(arrayBuffer));
      return result;
    }

    /**
     * Creates a clone of `typedArray`.
     *
     * @private
     * @param {Object} typedArray The typed array to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned typed array.
     */
    function cloneTypedArray(typedArray, isDeep) {
      var buffer = cloneArrayBuffer(typedArray.buffer) ;
      return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
    }

    /**
     * Initializes an object clone.
     *
     * @private
     * @param {Object} object The object to clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneObject(object) {
      return (typeof object.constructor == 'function' && !isPrototype(object))
        ? baseCreate(getPrototype(object))
        : {};
    }

    /**
     * Checks if `path` exists on `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @param {Function} hasFunc The function to check properties.
     * @returns {boolean} Returns `true` if `path` exists, else `false`.
     */
    function hasPath(object, path, hasFunc) {
      path = castPath(path, object);

      var index = -1,
          length = path.length,
          result = false;

      while (++index < length) {
        var key = toKey(path[index]);
        if (!(result = object != null && hasFunc(object, key))) {
          break;
        }
        object = object[key];
      }
      if (result || ++index != length) {
        return result;
      }
      length = object == null ? 0 : object.length;
      return !!length && isLength(length) && isIndex(key, length) &&
        (isArray(object) || isArguments(object));
    }

    /**
     * Creates a base function for methods like `_.forIn` and `_.forOwn`.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var index = -1,
            iterable = Object(object),
            props = keysFunc(object),
            length = props.length;

        while (length--) {
          var key = props[++index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }

    /**
     * The base implementation of `baseForOwn` which iterates over `object`
     * properties returned by `keysFunc` and invokes `iteratee` for each property.
     * Iteratee functions may exit iteration early by explicitly returning `false`.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseFor = createBaseFor();

    /**
     * This function is like `assignValue` except that it doesn't assign
     * `undefined` values.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function assignMergeValue(object, key, value) {
      if ((value !== undefined && !eq(object[key], value)) ||
          (value === undefined && !(key in object))) {
        baseAssignValue(object, key, value);
      }
    }

    /**
     * This method is like `_.isArrayLike` except that it also checks if `value`
     * is an object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array-like object,
     *  else `false`.
     * @example
     *
     * _.isArrayLikeObject([1, 2, 3]);
     * // => true
     *
     * _.isArrayLikeObject(document.body.children);
     * // => true
     *
     * _.isArrayLikeObject('abc');
     * // => false
     *
     * _.isArrayLikeObject(_.noop);
     * // => false
     */
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }

    /**
     * Gets the value at `key`, unless `key` is "__proto__" or "constructor".
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function safeGet(object, key) {
      if (key === 'constructor' && typeof object[key] === 'function') {
        return;
      }

      if (key == '__proto__') {
        return;
      }

      return object[key];
    }

    /**
     * Converts `value` to a plain object flattening inherited enumerable string
     * keyed properties of `value` to own properties of the plain object.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {Object} Returns the converted plain object.
     * @example
     *
     * function Foo() {
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.assign({ 'a': 1 }, new Foo);
     * // => { 'a': 1, 'b': 2 }
     *
     * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
     * // => { 'a': 1, 'b': 2, 'c': 3 }
     */
    function toPlainObject(value) {
      return copyObject(value, keysIn(value));
    }

    /**
     * A specialized version of `baseMerge` for arrays and objects which performs
     * deep merges and tracks traversed objects enabling objects with circular
     * references to be merged.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {string} key The key of the value to merge.
     * @param {number} srcIndex The index of `source`.
     * @param {Function} mergeFunc The function to merge values.
     * @param {Function} [customizer] The function to customize assigned values.
     * @param {Object} [stack] Tracks traversed source values and their merged
     *  counterparts.
     */
    function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
      var objValue = safeGet(object, key),
          srcValue = safeGet(source, key),
          stacked = stack.get(srcValue);

      if (stacked) {
        assignMergeValue(object, key, stacked);
        return;
      }
      var newValue = customizer
        ? customizer(objValue, srcValue, (key + ''), object, source, stack)
        : undefined;

      var isCommon = newValue === undefined;

      if (isCommon) {
        var isArr = isArray(srcValue),
            isBuff = !isArr && isBuffer(srcValue),
            isTyped = !isArr && !isBuff && isTypedArray(srcValue);

        newValue = srcValue;
        if (isArr || isBuff || isTyped) {
          if (isArray(objValue)) {
            newValue = objValue;
          }
          else if (isArrayLikeObject(objValue)) {
            newValue = copyArray(objValue);
          }
          else if (isBuff) {
            isCommon = false;
            newValue = cloneBuffer(srcValue);
          }
          else if (isTyped) {
            isCommon = false;
            newValue = cloneTypedArray(srcValue);
          }
          else {
            newValue = [];
          }
        }
        else if (isPlainObject(srcValue) || isArguments(srcValue)) {
          newValue = objValue;
          if (isArguments(objValue)) {
            newValue = toPlainObject(objValue);
          }
          else if (!isObject(objValue) || isFunction(objValue)) {
            newValue = initCloneObject(srcValue);
          }
        }
        else {
          isCommon = false;
        }
      }
      if (isCommon) {
        // Recursively merge objects and arrays (susceptible to call stack limits).
        stack.set(srcValue, newValue);
        mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
        stack['delete'](srcValue);
      }
      assignMergeValue(object, key, newValue);
    }

    /**
     * The base implementation of `_.merge` without support for multiple sources.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {number} srcIndex The index of `source`.
     * @param {Function} [customizer] The function to customize merged values.
     * @param {Object} [stack] Tracks traversed source values and their merged
     *  counterparts.
     */
    function baseMerge(object, source, srcIndex, customizer, stack) {
      if (object === source) {
        return;
      }
      baseFor(source, function(srcValue, key) {
        stack || (stack = new Stack);
        if (isObject(srcValue)) {
          baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
        }
        else {
          var newValue = customizer
            ? customizer(safeGet(object, key), srcValue, (key + ''), object, source, stack)
            : undefined;

          if (newValue === undefined) {
            newValue = srcValue;
          }
          assignMergeValue(object, key, newValue);
        }
      }, keysIn);
    }

    /**
     * Gets the last element of `array`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the last element of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     */
    function last(array) {
      var length = array == null ? 0 : array.length;
      return length ? array[length - 1] : undefined;
    }

    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /**
     * The base implementation of `_.has` without support for deep paths.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {Array|string} key The key to check.
     * @returns {boolean} Returns `true` if `key` exists, else `false`.
     */
    function baseHas(object, key) {
      return object != null && hasOwnProperty.call(object, key);
    }

    /**
     * Checks if `path` is a direct property of `object`.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @returns {boolean} Returns `true` if `path` exists, else `false`.
     * @example
     *
     * var object = { 'a': { 'b': 2 } };
     * var other = _.create({ 'a': _.create({ 'b': 2 }) });
     *
     * _.has(object, 'a');
     * // => true
     *
     * _.has(object, 'a.b');
     * // => true
     *
     * _.has(object, ['a', 'b']);
     * // => true
     *
     * _.has(other, 'a');
     * // => false
     */
    function has(object, path) {
      return object != null && hasPath(object, path, baseHas);
    }

    /**
     * Gets the parent value at `path` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} path The path to get the parent value of.
     * @returns {*} Returns the parent value.
     */
    function parent(object, path) {
      return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1));
    }

    /**
     * This method is like `_.assign` except that it recursively merges own and
     * inherited enumerable string keyed properties of source objects into the
     * destination object. Source properties that resolve to `undefined` are
     * skipped if a destination value exists. Array and plain object properties
     * are merged recursively. Other objects and value types are overridden by
     * assignment. Source objects are applied from left to right. Subsequent
     * sources overwrite property assignments of previous sources.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 0.5.0
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var object = {
     *   'a': [{ 'b': 2 }, { 'd': 4 }]
     * };
     *
     * var other = {
     *   'a': [{ 'c': 3 }, { 'e': 5 }]
     * };
     *
     * _.merge(object, other);
     * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
     */
    var merge = createAssigner(function(object, source, srcIndex) {
      baseMerge(object, source, srcIndex);
    });

    /**
     * The base implementation of `_.unset`.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {Array|string} path The property path to unset.
     * @returns {boolean} Returns `true` if the property is deleted, else `false`.
     */
    function baseUnset(object, path) {
      path = castPath(path, object);
      object = parent(object, path);
      return object == null || delete object[toKey(last(path))];
    }

    /**
     * The base implementation of `_.set`.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {Array|string} path The path of the property to set.
     * @param {*} value The value to set.
     * @param {Function} [customizer] The function to customize path creation.
     * @returns {Object} Returns `object`.
     */
    function baseSet(object, path, value, customizer) {
      if (!isObject(object)) {
        return object;
      }
      path = castPath(path, object);

      var index = -1,
          length = path.length,
          lastIndex = length - 1,
          nested = object;

      while (nested != null && ++index < length) {
        var key = toKey(path[index]),
            newValue = value;

        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return object;
        }

        if (index != lastIndex) {
          var objValue = nested[key];
          newValue = undefined;
          if (newValue === undefined) {
            newValue = isObject(objValue)
              ? objValue
              : (isIndex(path[index + 1]) ? [] : {});
          }
        }
        assignValue(nested, key, newValue);
        nested = nested[key];
      }
      return object;
    }

    /**
     * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
     * it's created. Arrays are created for missing index properties while objects
     * are created for all other missing properties. Use `_.setWith` to customize
     * `path` creation.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 3.7.0
     * @category Object
     * @param {Object} object The object to modify.
     * @param {Array|string} path The path of the property to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.set(object, 'a[0].b.c', 4);
     * console.log(object.a[0].b.c);
     * // => 4
     *
     * _.set(object, ['x', '0', 'y', 'z'], 5);
     * console.log(object.x[0].y.z);
     * // => 5
     */
    function set(object, path, value) {
      return object == null ? object : baseSet(object, path, value);
    }

    /**
     * Removes the property at `path` of `object`.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Object
     * @param {Object} object The object to modify.
     * @param {Array|string} path The path of the property to unset.
     * @returns {boolean} Returns `true` if the property is deleted, else `false`.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 7 } }] };
     * _.unset(object, 'a[0].b.c');
     * // => true
     *
     * console.log(object);
     * // => { 'a': [{ 'b': {} }] };
     *
     * _.unset(object, ['a', '0', 'b', 'c']);
     * // => true
     *
     * console.log(object);
     * // => { 'a': [{ 'b': {} }] };
     */
    function unset(object, path) {
      return object == null ? true : baseUnset(object, path);
    }

    /**
     * 配置管理器实现
     * 基于Vue 3的响应式系统提供配置管理功能
     */
    class ConfigManagerImpl {
        constructor(initialConfig = {}) {
            Object.defineProperty(this, "config", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "watchers", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "unwatchFns", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            // 创建响应式配置对象
            this.config = vue.reactive(merge({}, initialConfig));
            this.setupWatchers();
        }
        /**
         * 获取配置值
         */
        get(key) {
            try {
                return get(this.config, key);
            }
            catch (error) {
                throw new ConfigError(`Failed to get config '${key}'`, key, error);
            }
        }
        /**
         * 设置配置值
         */
        set(key, value) {
            try {
                const oldValue = this.get(key);
                set(this.config, key, value);
                // 触发监听器
                this.notifyWatchers(key, value, oldValue);
            }
            catch (error) {
                throw new ConfigError(`Failed to set config '${key}'`, key, error);
            }
        }
        /**
         * 批量更新配置
         */
        update(updates) {
            try {
                const oldConfig = { ...this.config };
                merge(this.config, updates);
                // 触发相关监听器
                this.notifyUpdateWatchers(updates, oldConfig);
            }
            catch (error) {
                throw new ConfigError('Failed to update config', 'update', error);
            }
        }
        /**
         * 监听配置变更
         */
        watch(key, callback) {
            if (typeof callback !== 'function') {
                throw new TypeError('Callback must be a function');
            }
            let watchers = this.watchers.get(key);
            if (!watchers) {
                watchers = new Set();
                this.watchers.set(key, watchers);
            }
            watchers.add(callback);
            // 设置Vue的watch
            const unwatchFn = vue.watch(() => this.get(key), (newValue, oldValue) => {
                try {
                    callback(newValue, oldValue);
                }
                catch (error) {
                    console.error(`Error in config watcher for '${key}':`, error);
                }
            }, { deep: true });
            // 存储取消监听函数
            let unwatchFns = this.unwatchFns.get(key);
            if (!unwatchFns) {
                unwatchFns = [];
                this.unwatchFns.set(key, unwatchFns);
            }
            unwatchFns.push(unwatchFn);
            // 返回取消监听函数
            return () => this.unwatch(key, callback);
        }
        /**
         * 取消监听配置变更
         */
        unwatch(key, callback) {
            if (!callback) {
                // 移除所有监听器
                this.watchers.delete(key);
                const unwatchFns = this.unwatchFns.get(key);
                if (unwatchFns) {
                    unwatchFns.forEach(fn => fn());
                    this.unwatchFns.delete(key);
                }
                return;
            }
            // 移除特定监听器
            const watchers = this.watchers.get(key);
            if (watchers) {
                watchers.delete(callback);
                if (watchers.size === 0) {
                    this.watchers.delete(key);
                    const unwatchFns = this.unwatchFns.get(key);
                    if (unwatchFns) {
                        unwatchFns.forEach(fn => fn());
                        this.unwatchFns.delete(key);
                    }
                }
            }
        }
        /**
         * 验证配置
         */
        validate(config) {
            try {
                // 基本类型验证
                if (config.name !== undefined && typeof config.name !== 'string') {
                    return false;
                }
                if (config.version !== undefined && typeof config.version !== 'string') {
                    return false;
                }
                if (config.debug !== undefined && typeof config.debug !== 'boolean') {
                    return false;
                }
                // 性能配置验证
                if (config.performance) {
                    const perf = config.performance;
                    if (perf.enabled !== undefined && typeof perf.enabled !== 'boolean') {
                        return false;
                    }
                    if (perf.sampleRate !== undefined &&
                        (typeof perf.sampleRate !== 'number' || perf.sampleRate < 0 || perf.sampleRate > 1)) {
                        return false;
                    }
                }
                // 开发配置验证
                if (config.dev) {
                    const dev = config.dev;
                    if (dev.enabled !== undefined && typeof dev.enabled !== 'boolean') {
                        return false;
                    }
                    if (dev.verbose !== undefined && typeof dev.verbose !== 'boolean') {
                        return false;
                    }
                }
                return true;
            }
            catch {
                return false;
            }
        }
        /**
         * 合并配置
         */
        merge(config) {
            if (!this.validate(config)) {
                throw new ConfigError('Invalid config provided', 'merge', config);
            }
            this.update(config);
        }
        /**
         * 检查配置是否存在
         */
        has(key) {
            return has(this.config, key);
        }
        /**
         * 删除配置
         */
        delete(key) {
            try {
                if (!this.has(key)) {
                    return false;
                }
                const oldValue = this.get(key);
                unset(this.config, key);
                // 触发监听器
                this.notifyWatchers(key, undefined, oldValue);
                return true;
            }
            catch (error) {
                throw new ConfigError(`Failed to delete config '${key}'`, key, error);
            }
        }
        /**
         * 获取所有配置
         */
        getAll() {
            return this.config;
        }
        /**
         * 重置配置
         */
        reset(newConfig) {
            const oldConfig = { ...this.config };
            // 清空当前配置
            Object.keys(this.config).forEach(key => {
                delete this.config[key];
            });
            // 设置新配置
            if (newConfig) {
                merge(this.config, newConfig);
            }
            // 触发所有监听器
            this.notifyResetWatchers(this.config, oldConfig);
        }
        /**
         * 获取配置键列表
         */
        keys() {
            return Object.keys(this.config);
        }
        /**
         * 设置监听器
         */
        setupWatchers() {
            // 监听整个配置对象的变化
            vue.watch(() => this.config, () => {
                // 配置变化时的全局处理
            }, { deep: true });
        }
        /**
         * 通知监听器
         */
        notifyWatchers(key, newValue, oldValue) {
            const watchers = this.watchers.get(key);
            if (watchers) {
                watchers.forEach(callback => {
                    try {
                        callback(newValue, oldValue);
                    }
                    catch (error) {
                        console.error(`Error in config watcher for '${key}':`, error);
                    }
                });
            }
        }
        /**
         * 通知更新监听器
         */
        notifyUpdateWatchers(updates, oldConfig) {
            Object.keys(updates).forEach(key => {
                const newValue = get(updates, key);
                const oldValue = get(oldConfig, key);
                if (newValue !== oldValue) {
                    this.notifyWatchers(key, newValue, oldValue);
                }
            });
        }
        /**
         * 通知重置监听器
         */
        notifyResetWatchers(newConfig, oldConfig) {
            const allKeys = new Set([...Object.keys(newConfig), ...Object.keys(oldConfig)]);
            allKeys.forEach(key => {
                const newValue = get(newConfig, key);
                const oldValue = get(oldConfig, key);
                if (newValue !== oldValue) {
                    this.notifyWatchers(key, newValue, oldValue);
                }
            });
        }
        /**
         * 销毁配置管理器
         */
        destroy() {
            // 清除所有监听器
            this.watchers.clear();
            // 取消所有Vue watch
            this.unwatchFns.forEach(unwatchFns => {
                unwatchFns.forEach(fn => fn());
            });
            this.unwatchFns.clear();
        }
    }

    /**
     * 依赖注入容器实现
     * 基于Vue 3的provide/inject机制提供依赖注入功能
     */
    class DIContainerImpl {
        constructor() {
            Object.defineProperty(this, "dependencies", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "singletons", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "factories", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "weakRefs", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new WeakMap()
            });
        }
        /**
         * 提供依赖
         */
        provide(key, value) {
            if (key === null || key === undefined) {
                throw new TypeError('Dependency key cannot be null or undefined');
            }
            this.dependencies.set(key, value);
            // 如果是对象，建立弱引用映射
            if (typeof value === 'object' && value !== null) {
                this.weakRefs.set(value, key);
            }
        }
        /**
         * 注入依赖
         */
        inject(key) {
            if (key === null || key === undefined) {
                return undefined;
            }
            // 检查是否有直接依赖
            if (this.dependencies.has(key)) {
                return this.dependencies.get(key);
            }
            // 检查是否有单例
            if (this.singletons.has(key)) {
                return this.singletons.get(key);
            }
            // 检查是否有工厂函数
            if (this.factories.has(key)) {
                const factory = this.factories.get(key);
                try {
                    const instance = factory();
                    // 缓存单例
                    this.singletons.set(key, instance);
                    return instance;
                }
                catch (error) {
                    console.error(`Error creating instance for key '${String(key)}':`, error);
                    return undefined;
                }
            }
            return undefined;
        }
        /**
         * 检查依赖是否存在
         */
        has(key) {
            return this.dependencies.has(key) ||
                this.singletons.has(key) ||
                this.factories.has(key);
        }
        /**
         * 移除依赖
         */
        remove(key) {
            let removed = false;
            if (this.dependencies.has(key)) {
                const value = this.dependencies.get(key);
                this.dependencies.delete(key);
                // 清理弱引用
                if (typeof value === 'object' && value !== null) {
                    this.weakRefs.delete(value);
                }
                removed = true;
            }
            if (this.singletons.has(key)) {
                const value = this.singletons.get(key);
                this.singletons.delete(key);
                // 如果实例有销毁方法，调用它
                if (value && typeof value.destroy === 'function') {
                    try {
                        value.destroy();
                    }
                    catch (error) {
                        console.error(`Error destroying instance for key '${String(key)}':`, error);
                    }
                }
                removed = true;
            }
            if (this.factories.has(key)) {
                this.factories.delete(key);
                removed = true;
            }
            return removed;
        }
        /**
         * 注册工厂函数
         */
        factory(key, factory) {
            if (typeof factory !== 'function') {
                throw new TypeError('Factory must be a function');
            }
            this.factories.set(key, factory);
        }
        /**
         * 注册单例
         */
        singleton(key, factory) {
            if (typeof factory !== 'function') {
                throw new TypeError('Factory must be a function');
            }
            // 延迟创建单例
            this.factory(key, () => {
                if (!this.singletons.has(key)) {
                    const instance = factory();
                    this.singletons.set(key, instance);
                    return instance;
                }
                return this.singletons.get(key);
            });
        }
        /**
         * 获取所有依赖键
         */
        keys() {
            const keys = new Set();
            for (const key of this.dependencies.keys()) {
                keys.add(key);
            }
            for (const key of this.singletons.keys()) {
                keys.add(key);
            }
            for (const key of this.factories.keys()) {
                keys.add(key);
            }
            return Array.from(keys);
        }
        /**
         * 获取依赖数量
         */
        size() {
            return this.keys().length;
        }
        /**
         * 清空所有依赖
         */
        clear() {
            // 销毁所有单例
            for (const [key, instance] of this.singletons) {
                if (instance && typeof instance.destroy === 'function') {
                    try {
                        instance.destroy();
                    }
                    catch (error) {
                        console.error(`Error destroying instance for key '${String(key)}':`, error);
                    }
                }
            }
            this.dependencies.clear();
            this.singletons.clear();
            this.factories.clear();
            // WeakMap会自动清理
        }
        /**
         * 克隆容器
         */
        clone() {
            const cloned = new DIContainerImpl();
            // 复制依赖
            for (const [key, value] of this.dependencies) {
                cloned.provide(key, value);
            }
            // 复制工厂函数
            for (const [key, factory] of this.factories) {
                cloned.factory(key, factory);
            }
            return cloned;
        }
        /**
         * 合并另一个容器
         */
        merge(other) {
            // 合并依赖
            for (const [key, value] of other.dependencies) {
                this.provide(key, value);
            }
            // 合并工厂函数
            for (const [key, factory] of other.factories) {
                this.factory(key, factory);
            }
        }
        /**
         * 获取依赖信息
         */
        getInfo(key) {
            if (this.dependencies.has(key)) {
                return {
                    exists: true,
                    type: 'direct',
                    value: this.dependencies.get(key)
                };
            }
            if (this.singletons.has(key)) {
                return {
                    exists: true,
                    type: 'singleton',
                    value: this.singletons.get(key)
                };
            }
            if (this.factories.has(key)) {
                return {
                    exists: true,
                    type: 'factory'
                };
            }
            return {
                exists: false,
                type: 'none'
            };
        }
        /**
         * 检查循环依赖
         */
        checkCircularDependency(key, visited = new Set()) {
            if (visited.has(key)) {
                return true; // 发现循环依赖
            }
            visited.add(key);
            const value = this.dependencies.get(key);
            if (value && typeof value === 'object') {
                // 检查对象的依赖
                const dependencyKey = this.weakRefs.get(value);
                if (dependencyKey && dependencyKey !== key) {
                    return this.checkCircularDependency(dependencyKey, visited);
                }
            }
            visited.delete(key);
            return false;
        }
        /**
         * 获取内存使用情况
         */
        getMemoryUsage() {
            return {
                dependencies: this.dependencies.size,
                singletons: this.singletons.size,
                factories: this.factories.size,
                total: this.dependencies.size + this.singletons.size + this.factories.size
            };
        }
        /**
         * 销毁容器
         */
        destroy() {
            this.clear();
        }
    }

    /**
     * 中间件管理器实现
     * 提供生命周期钩子中间件的注册、执行和管理功能
     */
    class MiddlewareManagerImpl {
        constructor() {
            Object.defineProperty(this, "middlewares", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "executing", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Set()
            });
            Object.defineProperty(this, "executionCount", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
        }
        /**
         * 添加中间件
         */
        add(hook, middleware, options = {}) {
            if (typeof middleware !== 'function') {
                throw new TypeError('Middleware must be a function');
            }
            if (!this.isValidHook(hook)) {
                throw new MiddlewareError(`Invalid lifecycle hook: ${hook}`, hook);
            }
            let middlewareList = this.middlewares.get(hook);
            if (!middlewareList) {
                middlewareList = [];
                this.middlewares.set(hook, middlewareList);
            }
            const middlewareInfo = {
                middleware,
                priority: options.priority || 0,
                name: options.name,
                once: options.once || false
            };
            // 按优先级插入
            const insertIndex = middlewareList.findIndex(item => item.priority < middlewareInfo.priority);
            if (insertIndex === -1) {
                middlewareList.push(middlewareInfo);
            }
            else {
                middlewareList.splice(insertIndex, 0, middlewareInfo);
            }
        }
        /**
         * 移除中间件
         */
        remove(hook, middleware) {
            const middlewareList = this.middlewares.get(hook);
            if (!middlewareList) {
                return;
            }
            const index = middlewareList.findIndex(item => item.middleware === middleware);
            if (index !== -1) {
                middlewareList.splice(index, 1);
                // 如果列表为空，删除整个钩子
                if (middlewareList.length === 0) {
                    this.middlewares.delete(hook);
                }
            }
        }
        /**
         * 执行中间件链
         */
        async execute(hook, context) {
            if (this.executing.has(hook)) {
                throw new MiddlewareError(`Middleware for hook '${hook}' is already executing`, hook);
            }
            const middlewareList = this.middlewares.get(hook);
            if (!middlewareList || middlewareList.length === 0) {
                return;
            }
            this.executing.add(hook);
            try {
                await this.executeMiddlewareChain(middlewareList, context, hook);
            }
            finally {
                this.executing.delete(hook);
            }
        }
        /**
         * 执行中间件链
         */
        async executeMiddlewareChain(middlewareList, context, hook) {
            let index = 0;
            const toRemove = [];
            const next = async () => {
                if (index >= middlewareList.length) {
                    return;
                }
                const middlewareInfo = middlewareList[index++];
                const { middleware, name, once } = middlewareInfo;
                try {
                    // 记录执行次数
                    const key = `${hook}:${name || 'anonymous'}`;
                    const count = this.executionCount.get(key) || 0;
                    this.executionCount.set(key, count + 1);
                    // 执行中间件
                    await middleware(context, next);
                    // 如果是一次性中间件，标记为待移除
                    if (once) {
                        toRemove.push(middlewareInfo);
                    }
                }
                catch (error) {
                    const middlewareError = new MiddlewareError(`Error in middleware '${name || 'anonymous'}' for hook '${hook}': ${error instanceof Error ? error.message : String(error)}`, hook, { middleware, error, context });
                    // 发射错误事件
                    if (context.engine && typeof context.engine.emit === 'function') {
                        context.engine.emit('middleware:error', middlewareError);
                    }
                    throw middlewareError;
                }
            };
            await next();
            // 移除一次性中间件
            toRemove.forEach(middlewareInfo => {
                const list = this.middlewares.get(hook);
                if (list) {
                    const index = list.indexOf(middlewareInfo);
                    if (index !== -1) {
                        list.splice(index, 1);
                    }
                }
            });
        }
        /**
         * 清除中间件
         */
        clear(hook) {
            if (hook) {
                this.middlewares.delete(hook);
            }
            else {
                this.middlewares.clear();
            }
        }
        /**
         * 获取中间件数量
         */
        count(hook) {
            if (hook) {
                const middlewareList = this.middlewares.get(hook);
                return middlewareList ? middlewareList.length : 0;
            }
            let total = 0;
            for (const list of this.middlewares.values()) {
                total += list.length;
            }
            return total;
        }
        /**
         * 获取所有钩子
         */
        getHooks() {
            return Array.from(this.middlewares.keys());
        }
        /**
         * 获取钩子的中间件列表
         */
        getMiddlewares(hook) {
            const middlewareList = this.middlewares.get(hook);
            return middlewareList ? middlewareList.map(item => item.middleware) : [];
        }
        /**
         * 检查是否有中间件
         */
        has(hook, middleware) {
            const middlewareList = this.middlewares.get(hook);
            if (!middlewareList) {
                return false;
            }
            if (!middleware) {
                return middlewareList.length > 0;
            }
            return middlewareList.some(item => item.middleware === middleware);
        }
        /**
         * 检查钩子是否正在执行
         */
        isExecuting(hook) {
            return this.executing.has(hook);
        }
        /**
         * 获取执行统计
         */
        getExecutionStats() {
            return Object.fromEntries(this.executionCount);
        }
        /**
         * 重置执行统计
         */
        resetExecutionStats() {
            this.executionCount.clear();
        }
        /**
         * 获取中间件信息
         */
        getMiddlewareInfo(hook) {
            const middlewareList = this.middlewares.get(hook);
            if (!middlewareList) {
                return [];
            }
            return middlewareList.map(({ name, priority, once }) => ({
                name,
                priority,
                once
            }));
        }
        /**
         * 验证生命周期钩子
         */
        isValidHook(hook) {
            const validHooks = [
                'beforeCreate',
                'created',
                'beforeMount',
                'mounted',
                'beforeUpdate',
                'updated',
                'beforeUnmount',
                'unmounted'
            ];
            return validHooks.includes(hook);
        }
        /**
         * 克隆中间件管理器
         */
        clone() {
            const cloned = new MiddlewareManagerImpl();
            for (const [hook, middlewareList] of this.middlewares) {
                cloned.middlewares.set(hook, [...middlewareList]);
            }
            return cloned;
        }
        /**
         * 获取统计信息
         */
        getStats() {
            return {
                hooks: this.middlewares.size,
                middlewares: this.count(),
                executing: this.executing.size,
                executionCount: this.getExecutionStats()
            };
        }
        /**
         * 获取内存使用情况
         */
        getMemoryUsage() {
            return {
                hooks: this.middlewares.size,
                middlewares: this.count(),
                executing: this.executing.size
            };
        }
        /**
         * 销毁中间件管理器
         */
        destroy() {
            this.clear();
            this.executing.clear();
            this.executionCount.clear();
        }
    }

    /**
     * 插件管理器实现
     * 提供插件的注册、卸载、依赖管理等功能
     */
    class PluginManagerImpl {
        constructor() {
            Object.defineProperty(this, "plugins", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "dependencyGraph", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "installOrder", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: []
            });
            Object.defineProperty(this, "installing", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Set()
            });
            Object.defineProperty(this, "uninstalling", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Set()
            });
        }
        /**
         * 安装插件
         */
        async install(plugin, engine, options) {
            if (!plugin || typeof plugin !== 'object') {
                throw new PluginError('Invalid plugin object', 'unknown');
            }
            if (!plugin.name || typeof plugin.name !== 'string') {
                throw new PluginError('Plugin must have a valid name', plugin.name || 'unknown');
            }
            if (typeof plugin.install !== 'function') {
                throw new PluginError('Plugin must have an install function', plugin.name);
            }
            if (this.plugins.has(plugin.name)) {
                throw new PluginError(`Plugin '${plugin.name}' is already installed`, plugin.name);
            }
            if (this.installing.has(plugin.name)) {
                throw new PluginError(`Plugin '${plugin.name}' is currently being installed`, plugin.name);
            }
            this.installing.add(plugin.name);
            try {
                // 检查依赖
                await this.checkDependencies(plugin);
                // 安装依赖
                await this.installDependencies(plugin);
                // 创建插件信息
                const pluginInfo = {
                    plugin,
                    options,
                    installed: false,
                    installTime: Date.now()
                };
                // 执行安装
                await this.installPlugin(pluginInfo, engine);
                // 注册插件
                this.plugins.set(plugin.name, pluginInfo);
                this.installOrder.push(plugin.name);
                // 更新依赖图
                this.updateDependencyGraph(plugin);
                // 发射安装事件
                engine.emit('plugin:installed', {
                    name: plugin.name,
                    plugin,
                    options
                });
            }
            catch (error) {
                const pluginError = new PluginError(`Failed to install plugin '${plugin.name}': ${error instanceof Error ? error.message : String(error)}`, plugin.name, { error, options });
                // 发射错误事件
                engine.emit('plugin:error', pluginError);
                throw pluginError;
            }
            finally {
                this.installing.delete(plugin.name);
            }
        }
        /**
         * 使用插件（install的别名）
         */
        async use(plugin, engine, options) {
            return this.install(plugin, engine, options);
        }
        /**
         * 移除插件（uninstall的别名）
         */
        async unuse(pluginName) {
            // 注意：这个方法需要engine参数，但接口定义中没有
            // 这是一个设计问题，暂时抛出错误提示
            throw new PluginError('unuse method requires engine parameter. Use uninstall(pluginName, engine) instead.', pluginName);
        }
        /**
         * 卸载插件
         */
        async uninstall(pluginName, engine) {
            if (!this.plugins.has(pluginName)) {
                throw new PluginError(`Plugin '${pluginName}' is not installed`, pluginName);
            }
            if (this.uninstalling.has(pluginName)) {
                throw new PluginError(`Plugin '${pluginName}' is currently being uninstalled`, pluginName);
            }
            // 检查依赖关系
            const dependents = this.getDependents(pluginName);
            if (dependents.length > 0) {
                throw new PluginError(`Cannot uninstall plugin '${pluginName}' because it is required by: ${dependents.join(', ')}`, pluginName);
            }
            this.uninstalling.add(pluginName);
            try {
                const pluginInfo = this.plugins.get(pluginName);
                // 执行卸载
                await this.uninstallPlugin(pluginInfo, engine);
                // 移除插件
                this.plugins.delete(pluginName);
                const orderIndex = this.installOrder.indexOf(pluginName);
                if (orderIndex !== -1) {
                    this.installOrder.splice(orderIndex, 1);
                }
                // 更新依赖图
                this.dependencyGraph.delete(pluginName);
                // 发射卸载事件
                engine.emit('plugin:uninstalled', {
                    name: pluginName,
                    plugin: pluginInfo.plugin
                });
            }
            catch (error) {
                const pluginError = new PluginError(`Failed to uninstall plugin '${pluginName}': ${error instanceof Error ? error.message : String(error)}`, pluginName, { error });
                // 发射错误事件
                engine.emit('plugin:error', pluginError);
                throw pluginError;
            }
            finally {
                this.uninstalling.delete(pluginName);
            }
        }
        /**
         * 检查插件是否已安装
         */
        has(pluginName) {
            return this.plugins.has(pluginName);
        }
        /**
         * 获取插件信息
         */
        get(pluginName) {
            return this.plugins.get(pluginName);
        }
        /**
         * 获取所有插件信息
         */
        list() {
            return Array.from(this.plugins.values());
        }
        /**
         * 清除所有插件
         */
        async clear(engine) {
            // 按安装顺序的逆序卸载
            const uninstallOrder = [...this.installOrder].reverse();
            for (const pluginName of uninstallOrder) {
                try {
                    if (engine) {
                        await this.uninstall(pluginName, engine);
                    }
                }
                catch (error) {
                    console.error(`Error uninstalling plugin '${pluginName}':`, error);
                }
            }
            this.plugins.clear();
            this.dependencyGraph.clear();
            this.installOrder.length = 0;
        }
        /**
         * 获取插件依赖
         */
        getDependencies(pluginName) {
            const node = this.dependencyGraph.get(pluginName);
            return node ? [...node.dependencies] : [];
        }
        /**
         * 获取插件依赖者
         */
        getDependents(pluginName) {
            const node = this.dependencyGraph.get(pluginName);
            return node ? [...node.dependents] : [];
        }
        /**
         * 获取安装顺序
         */
        getInstallOrder() {
            return [...this.installOrder];
        }
        /**
         * 检查依赖
         */
        async checkDependencies(plugin) {
            if (!plugin.dependencies || plugin.dependencies.length === 0) {
                return;
            }
            const missingDependencies = [];
            for (const dependency of plugin.dependencies) {
                if (!this.plugins.has(dependency)) {
                    missingDependencies.push(dependency);
                }
            }
            if (missingDependencies.length > 0) {
                throw new PluginError(`Plugin '${plugin.name}' has missing dependencies: ${missingDependencies.join(', ')}`, plugin.name);
            }
        }
        /**
         * 安装依赖
         */
        async installDependencies(plugin) {
            if (!plugin.dependencies || plugin.dependencies.length === 0) {
                return;
            }
            // 检查循环依赖
            this.checkCircularDependency(plugin.name, plugin.dependencies);
        }
        /**
         * 检查循环依赖
         */
        checkCircularDependency(pluginName, dependencies, visited = new Set()) {
            if (visited.has(pluginName)) {
                throw new PluginError(`Circular dependency detected for plugin '${pluginName}'`, pluginName);
            }
            visited.add(pluginName);
            for (const dependency of dependencies) {
                const depNode = this.dependencyGraph.get(dependency);
                if (depNode) {
                    this.checkCircularDependency(dependency, depNode.dependencies, visited);
                }
            }
            visited.delete(pluginName);
        }
        /**
         * 安装插件
         */
        async installPlugin(pluginInfo, engine) {
            const { plugin, options } = pluginInfo;
            try {
                const result = plugin.install(engine, options);
                // 如果返回Promise，等待完成
                if (result && typeof result.then === 'function') {
                    await result;
                }
                pluginInfo.installed = true;
            }
            catch (error) {
                throw new PluginError(`Plugin '${plugin.name}' installation failed: ${error instanceof Error ? error.message : String(error)}`, plugin.name, { error, options });
            }
        }
        /**
         * 卸载插件
         */
        async uninstallPlugin(pluginInfo, engine) {
            const { plugin } = pluginInfo;
            if (typeof plugin.uninstall === 'function') {
                try {
                    const result = plugin.uninstall(engine);
                    // 如果返回Promise，等待完成
                    if (result && typeof result.then === 'function') {
                        await result;
                    }
                }
                catch (error) {
                    throw new PluginError(`Plugin '${plugin.name}' uninstallation failed: ${error instanceof Error ? error.message : String(error)}`, plugin.name, { error });
                }
            }
            pluginInfo.installed = false;
        }
        /**
         * 更新依赖图
         */
        updateDependencyGraph(plugin) {
            const dependencies = plugin.dependencies || [];
            // 创建节点
            const node = {
                plugin,
                dependencies: [...dependencies],
                dependents: [],
                installed: true
            };
            this.dependencyGraph.set(plugin.name, node);
            // 更新依赖关系
            for (const dependency of dependencies) {
                const depNode = this.dependencyGraph.get(dependency);
                if (depNode) {
                    depNode.dependents.push(plugin.name);
                }
            }
        }
        /**
         * 获取插件统计信息
         */
        getStats() {
            return {
                total: this.plugins.size,
                installed: Array.from(this.plugins.values()).filter(p => p.installed).length,
                installing: this.installing.size,
                uninstalling: this.uninstalling.size
            };
        }
        /**
         * 获取内存使用情况
         */
        getMemoryUsage() {
            return {
                plugins: this.plugins.size,
                dependencyNodes: this.dependencyGraph.size,
                installOrder: this.installOrder.length
            };
        }
        /**
         * 销毁插件管理器
         */
        async destroy(engine) {
            await this.clear(engine);
            this.installing.clear();
            this.uninstalling.clear();
        }
    }

    /**
     * 引擎实现类
     */
    class EngineImpl {
        constructor(config = {}) {
            // 引擎信息
            Object.defineProperty(this, "name", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "version", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "_state", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: EngineState.CREATED
            });
            Object.defineProperty(this, "_app", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: null
            });
            Object.defineProperty(this, "_mountedInstance", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: null
            });
            Object.defineProperty(this, "_rootComponent", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: null
            });
            // 核心管理器
            Object.defineProperty(this, "eventEmitter", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "configManager", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "diContainer", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "middlewareManager", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "pluginManager", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            // 错误处理
            Object.defineProperty(this, "errorHandler", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            try {
                // 初始化引擎信息
                this.name = config.name || 'LDesignEngine';
                this.version = config.version || '1.0.0';
                // 初始化管理器
                this.eventEmitter = new EventEmitterImpl();
                this.configManager = new ConfigManagerImpl(config);
                this.diContainer = new DIContainerImpl();
                this.middlewareManager = new MiddlewareManagerImpl();
                this.pluginManager = new PluginManagerImpl();
                // 设置错误处理器
                if (config.errorHandler) {
                    this.errorHandler = config.errorHandler;
                }
                // 注入核心服务
                this.setupCoreServices();
                // 发射创建事件
                this.emit('engine:created', this);
            }
            catch (error) {
                this.handleError(new EngineError('Failed to create engine', 'CREATE_ERROR', { cause: error }));
                throw error;
            }
        }
        // 状态属性
        get state() {
            return this._state;
        }
        get app() {
            return this._app;
        }
        get config() {
            return vue.readonly(this.configManager.getAll());
        }
        // 核心方法
        async mount(selector) {
            try {
                if (this._state !== EngineState.CREATED) {
                    throw new EngineError(`Cannot mount engine in state: ${this._state}`);
                }
                this._state = EngineState.MOUNTING;
                // 执行 beforeMount 中间件
                await this.executeMiddleware('beforeMount');
                // 创建 Vue 应用
                this._app = this.createVueApp();
                // 挂载应用
                this._mountedInstance = this._app.mount(selector);
                this._state = EngineState.MOUNTED;
                // 执行 mounted 中间件
                await this.executeMiddleware('mounted');
                // 发射挂载事件
                this.emit('engine:mounted', this._mountedInstance);
                return this._mountedInstance;
            }
            catch (error) {
                this._state = EngineState.ERROR;
                const engineError = new EngineError('Failed to mount engine', 'MOUNT_ERROR', { cause: error });
                this.handleError(engineError);
                throw engineError;
            }
        }
        async unmount() {
            try {
                if (this._state !== EngineState.MOUNTED) {
                    throw new EngineError(`Cannot unmount engine in state: ${this._state}`);
                }
                this._state = EngineState.UNMOUNTING;
                // 执行 beforeUnmount 中间件
                await this.executeMiddleware('beforeUnmount');
                // 卸载应用
                if (this._app) {
                    this._app.unmount();
                    this._app = null;
                }
                this._mountedInstance = null;
                this._state = EngineState.UNMOUNTED;
                // 执行 unmounted 中间件
                await this.executeMiddleware('unmounted');
                // 发射卸载事件
                this.emit('engine:unmounted');
            }
            catch (error) {
                this._state = EngineState.ERROR;
                const engineError = new EngineError('Failed to unmount engine', 'UNMOUNT_ERROR', { cause: error });
                this.handleError(engineError);
                throw engineError;
            }
        }
        async destroy() {
            try {
                // 如果已挂载，先卸载
                if (this._state === EngineState.MOUNTED) {
                    await this.unmount();
                }
                this._state = EngineState.DESTROYING;
                // 卸载所有插件
                await this.pluginManager.clear(this);
                // 清理所有管理器
                this.middlewareManager.destroy();
                this.configManager.destroy();
                this.diContainer.destroy();
                this.eventEmitter.destroy();
                this._state = EngineState.DESTROYED;
                // 发射销毁事件
                this.emit('engine:destroyed');
            }
            catch (error) {
                this._state = EngineState.ERROR;
                const engineError = new EngineError('Failed to destroy engine', 'DESTROY_ERROR', { cause: error });
                this.handleError(engineError);
                throw engineError;
            }
        }
        // 配置管理
        getConfig(key) {
            return this.configManager.get(key);
        }
        setConfig(key, value) {
            this.configManager.set(key, value);
        }
        updateConfig(updates) {
            this.configManager.update(updates);
        }
        watchConfig(key, callback) {
            return this.configManager.watch(key, callback);
        }
        // 插件系统
        async use(plugin, options) {
            try {
                await this.pluginManager.install(plugin, this, options);
                return this;
            }
            catch (error) {
                const pluginError = new EngineError(`Failed to install plugin: ${plugin.name}`, 'PLUGIN_INSTALL_ERROR', { cause: error });
                this.handleError(pluginError);
                this.emit('plugin:error', pluginError, { plugin: plugin.name });
                throw pluginError;
            }
        }
        async unuse(pluginName) {
            try {
                await this.pluginManager.uninstall(pluginName, this);
                return this;
            }
            catch (error) {
                const pluginError = new EngineError(`Failed to uninstall plugin: ${pluginName}`, 'PLUGIN_UNINSTALL_ERROR', { cause: error });
                this.handleError(pluginError);
                this.emit('plugin:error', pluginError, { plugin: pluginName });
                throw pluginError;
            }
        }
        hasPlugin(pluginName) {
            return this.pluginManager.has(pluginName);
        }
        // 中间件系统
        addMiddleware(hook, middleware) {
            this.middlewareManager.add(hook, middleware);
        }
        removeMiddleware(hook, middleware) {
            this.middlewareManager.remove(hook, middleware);
        }
        // 事件系统
        emit(event, ...args) {
            this.eventEmitter.emit(event, ...args);
        }
        on(event, handler) {
            return this.eventEmitter.on(event, handler);
        }
        off(event, handler) {
            this.eventEmitter.off(event, handler);
        }
        once(event, handler) {
            return this.eventEmitter.once(event, handler);
        }
        // 依赖注入
        provide(key, value) {
            this.diContainer.provide(key, value);
            // 如果应用已创建，也在Vue应用中提供
            if (this._app) {
                this._app.provide(key, value);
            }
        }
        inject(key) {
            return this.diContainer.inject(key);
        }
        // 私有方法
        /**
         * 设置核心服务
         */
        setupCoreServices() {
            // 注入核心管理器
            this.diContainer.provide('eventEmitter', this.eventEmitter);
            this.diContainer.provide('configManager', this.configManager);
            this.diContainer.provide('diContainer', this.diContainer);
            this.diContainer.provide('middlewareManager', this.middlewareManager);
            this.diContainer.provide('pluginManager', this.pluginManager);
            this.diContainer.provide('engine', this);
        }
        /**
         * 创建Vue应用
         */
        createVueApp() {
            // 获取根组件
            const rootComponent = this.configManager.get('rootComponent') || this.createDefaultRootComponent();
            // 创建应用
            const app = vue.createApp(rootComponent);
            // 设置全局属性
            app.config.globalProperties.$engine = this;
            // 提供核心服务到Vue应用
            const serviceKeys = this.diContainer.keys();
            serviceKeys.forEach((key) => {
                const value = this.diContainer.inject(key);
                if (value !== undefined) {
                    app.provide(key, value);
                }
            });
            // 设置错误处理器
            if (this.errorHandler) {
                app.config.errorHandler = (error, instance, info) => {
                    const engineError = error instanceof Error ? error : new Error(String(error));
                    this.handleError(engineError, { instance, info, source: 'vue' });
                };
            }
            return app;
        }
        /**
         * 创建默认根组件
         */
        createDefaultRootComponent() {
            return {
                name: 'EngineRoot',
                template: '<div id="engine-root"><slot /></div>',
                setup() {
                    return {};
                }
            };
        }
        /**
         * 执行中间件
         */
        async executeMiddleware(hook) {
            try {
                const context = {
                    engine: this,
                    app: this._app,
                    config: this.config,
                    state: this._state,
                    hook
                };
                await this.middlewareManager.execute(hook, context);
            }
            catch (error) {
                const middlewareError = new EngineError(`Middleware execution failed for hook: ${hook}`, 'MIDDLEWARE_ERROR', { cause: error });
                this.handleError(middlewareError);
                this.emit('middleware:error', middlewareError, { hook });
                throw middlewareError;
            }
        }
        /**
         * 处理错误
         */
        handleError(error, context) {
            try {
                // 调用配置的错误处理器
                if (this.errorHandler) {
                    this.errorHandler(error, context);
                }
                // 发射错误事件
                this.emit('engine:error', error, context);
                // 开发模式下输出到控制台
                if (this.configManager.get('dev.enabled')) {
                    console.error('Engine Error:', error);
                    if (context) {
                        console.error('Context:', context);
                    }
                }
            }
            catch (handlerError) {
                // 错误处理器本身出错，直接输出到控制台
                console.error('Error in error handler:', handlerError);
                console.error('Original error:', error);
            }
        }
        // 调试和开发方法
        /**
         * 获取引擎状态信息
         */
        getDebugInfo() {
            return {
                state: this._state,
                hasApp: !!this._app,
                hasMountedInstance: !!this._mountedInstance,
                config: this.config,
                plugins: this.pluginManager.list(),
                middlewareStats: this.middlewareManager.getStats(),
                eventListeners: this.eventEmitter.eventNames(),
                diServices: this.diContainer.keys(),
                memoryUsage: {
                    middleware: this.middlewareManager.getMemoryUsage(),
                    plugins: this.pluginManager.getMemoryUsage(),
                    di: this.diContainer.getMemoryUsage(),
                    events: this.eventEmitter.eventNames().reduce((total, event) => {
                        return total + this.eventEmitter.listenerCount(event);
                    }, 0)
                }
            };
        }
        /**
         * 检查引擎健康状态
         */
        healthCheck() {
            const issues = [];
            // 检查状态
            if (this._state === EngineState.ERROR) {
                issues.push('Engine is in error state');
            }
            // 检查内存使用
            const memoryUsage = this.middlewareManager.getMemoryUsage();
            if (memoryUsage.middlewares > 100) {
                issues.push('Too many middleware registered');
            }
            // 检查事件监听器
            const totalListeners = this.eventEmitter.eventNames().reduce((total, event) => {
                return total + this.eventEmitter.listenerCount(event);
            }, 0);
            if (totalListeners > 1000) {
                issues.push('Too many event listeners');
            }
            // 检查插件状态
            const plugins = this.pluginManager.list();
            const failedPlugins = plugins.filter(p => !p.installed);
            if (failedPlugins.length > 0) {
                issues.push(`Failed plugins: ${failedPlugins.map(p => p.plugin.name).join(', ')}`);
            }
            return {
                healthy: issues.length === 0,
                issues
            };
        }
    }

    /**
     * 性能监控器实现
     */
    class PerformanceMonitorImpl {
        constructor(config = {}) {
            Object.defineProperty(this, "metrics", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "marks", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "memorySnapshots", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: []
            });
            Object.defineProperty(this, "observers", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: []
            });
            Object.defineProperty(this, "config", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.config = {
                enabled: config.enabled ?? true,
                trackMemory: config.trackMemory ?? false,
                trackTiming: config.trackTiming ?? true,
                sampleRate: config.sampleRate ?? 1.0,
                maxMetrics: config.maxMetrics ?? 1000
            };
            if (this.config.enabled) {
                this.setupPerformanceObservers();
                if (this.config.trackMemory) {
                    this.startMemoryTracking();
                }
            }
        }
        /**
         * 开始性能计时
         */
        start(name) {
            if (!this.config.enabled || !this.shouldSample()) {
                return;
            }
            const startTime = performance.now();
            this.marks.set(name, startTime);
            const metric = {
                name,
                startTime,
                type: 'timing'
            };
            this.addMetric(name, metric);
        }
        /**
         * 结束性能计时
         */
        end(name) {
            if (!this.config.enabled) {
                return 0;
            }
            const endTime = performance.now();
            const startTime = this.marks.get(name);
            if (startTime === undefined) {
                console.warn(`Performance timing '${name}' was not started`);
                return 0;
            }
            const duration = endTime - startTime;
            const metric = this.metrics.get(name);
            if (metric) {
                metric.endTime = endTime;
                metric.duration = duration;
            }
            this.marks.delete(name);
            return duration;
        }
        /**
         * 创建性能标记
         */
        mark(name) {
            if (!this.config.enabled || !this.shouldSample()) {
                return;
            }
            const timestamp = performance.now();
            if (typeof performance.mark === 'function') {
                performance.mark(name);
            }
            this.marks.set(name, timestamp);
        }
        /**
         * 测量性能
         */
        measure(name, startMark, endMark) {
            if (!this.config.enabled) {
                return 0;
            }
            let startTime;
            let endTime;
            if (startMark) {
                startTime = this.marks.get(startMark) ?? 0;
            }
            else {
                startTime = 0;
            }
            if (endMark) {
                endTime = this.marks.get(endMark) ?? performance.now();
            }
            else {
                endTime = performance.now();
            }
            const duration = endTime - startTime;
            if (typeof performance.measure === 'function' && startMark && endMark) {
                try {
                    performance.measure(name, startMark, endMark);
                }
                catch (error) {
                    console.warn(`Failed to create performance measure '${name}':`, error);
                }
            }
            const metric = {
                name,
                startTime,
                endTime,
                duration,
                type: 'timing'
            };
            this.addMetric(name, metric);
            return duration;
        }
        /**
         * 获取所有性能指标
         */
        getMetrics() {
            const result = {};
            // 计时指标
            const timingMetrics = {};
            const memoryMetrics = {};
            const customMetrics = {};
            for (const [name, metric] of this.metrics) {
                const data = {
                    startTime: metric.startTime,
                    endTime: metric.endTime,
                    duration: metric.duration,
                    data: metric.data
                };
                switch (metric.type) {
                    case 'timing':
                        timingMetrics[name] = data;
                        break;
                    case 'memory':
                        memoryMetrics[name] = data;
                        break;
                    case 'custom':
                        customMetrics[name] = data;
                        break;
                }
            }
            result.timing = timingMetrics;
            result.memory = memoryMetrics;
            result.custom = customMetrics;
            // 添加内存快照
            if (this.memorySnapshots.length > 0) {
                result.memorySnapshots = this.memorySnapshots;
            }
            // 添加浏览器性能指标
            if (typeof performance.getEntriesByType === 'function') {
                result.navigation = performance.getEntriesByType('navigation');
                result.resource = performance.getEntriesByType('resource');
                result.paint = performance.getEntriesByType('paint');
            }
            return result;
        }
        /**
         * 清除所有指标
         */
        clear() {
            this.metrics.clear();
            this.marks.clear();
            this.memorySnapshots.length = 0;
            if (typeof performance.clearMarks === 'function') {
                performance.clearMarks();
            }
            if (typeof performance.clearMeasures === 'function') {
                performance.clearMeasures();
            }
        }
        /**
         * 添加自定义指标
         */
        addCustomMetric(name, data) {
            if (!this.config.enabled) {
                return;
            }
            const metric = {
                name,
                startTime: performance.now(),
                type: 'custom',
                data
            };
            this.addMetric(name, metric);
        }
        /**
         * 获取内存使用情况
         */
        getMemoryUsage() {
            if (!this.config.trackMemory) {
                return null;
            }
            if (typeof performance.memory === 'object') {
                const memory = performance.memory;
                return {
                    usedJSHeapSize: memory.usedJSHeapSize,
                    totalJSHeapSize: memory.totalJSHeapSize,
                    jsHeapSizeLimit: memory.jsHeapSizeLimit,
                    timestamp: performance.now()
                };
            }
            return null;
        }
        /**
         * 获取性能摘要
         */
        getSummary() {
            const timingMetrics = Array.from(this.metrics.values())
                .filter(m => m.type === 'timing' && m.duration !== undefined);
            const durations = timingMetrics.map(m => m.duration);
            const averageDuration = durations.length > 0
                ? durations.reduce((sum, d) => sum + d, 0) / durations.length
                : 0;
            const longestMetric = timingMetrics.reduce((longest, current) => {
                if (!longest || (current.duration > longest.duration)) {
                    return current;
                }
                return longest;
            }, null);
            return {
                totalMetrics: this.metrics.size,
                timingMetrics: timingMetrics.length,
                memorySnapshots: this.memorySnapshots.length,
                averageDuration,
                longestDuration: longestMetric ? {
                    name: longestMetric.name,
                    duration: longestMetric.duration
                } : null
            };
        }
        /**
         * 添加指标
         */
        addMetric(name, metric) {
            // 检查指标数量限制
            if (this.metrics.size >= this.config.maxMetrics) {
                // 删除最旧的指标
                const oldestKey = this.metrics.keys().next().value;
                if (oldestKey) {
                    this.metrics.delete(oldestKey);
                }
            }
            this.metrics.set(name, metric);
        }
        /**
         * 是否应该采样
         */
        shouldSample() {
            return Math.random() < this.config.sampleRate;
        }
        /**
         * 设置性能观察器
         */
        setupPerformanceObservers() {
            if (typeof PerformanceObserver === 'undefined') {
                return;
            }
            try {
                // 观察导航时间
                const navObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.addCustomMetric(`navigation:${entry.name}`, {
                            type: entry.entryType,
                            startTime: entry.startTime,
                            duration: entry.duration
                        });
                    }
                });
                navObserver.observe({ entryTypes: ['navigation'] });
                this.observers.push(navObserver);
                // 观察资源加载时间
                const resourceObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.addCustomMetric(`resource:${entry.name}`, {
                            type: entry.entryType,
                            startTime: entry.startTime,
                            duration: entry.duration
                        });
                    }
                });
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.push(resourceObserver);
            }
            catch (error) {
                console.warn('Failed to setup performance observers:', error);
            }
        }
        /**
         * 开始内存跟踪
         */
        startMemoryTracking() {
            const trackMemory = () => {
                const memoryInfo = this.getMemoryUsage();
                if (memoryInfo) {
                    this.memorySnapshots.push(memoryInfo);
                    // 限制快照数量
                    if (this.memorySnapshots.length > 100) {
                        this.memorySnapshots.shift();
                    }
                }
            };
            // 每5秒记录一次内存使用情况
            setInterval(trackMemory, 5000);
            // 立即记录一次
            trackMemory();
        }
        /**
         * 销毁性能监控器
         */
        destroy() {
            this.clear();
            // 断开性能观察器
            this.observers.forEach(observer => {
                try {
                    observer.disconnect();
                }
                catch (error) {
                    console.warn('Error disconnecting performance observer:', error);
                }
            });
            this.observers.length = 0;
        }
    }
    /**
     * 性能监控插件
     */
    const performancePlugin = {
        name: 'performance',
        install(engine, options = {}) {
            const monitor = new PerformanceMonitorImpl(options);
            // 注入性能监控器
            engine.provide('performance', monitor);
            // 监控引擎生命周期
            engine.addMiddleware('beforeMount', async (_context, next) => {
                monitor.start('engine:mount');
                await next();
            });
            engine.addMiddleware('mounted', async (_context, next) => {
                monitor.end('engine:mount');
                await next();
            });
            engine.addMiddleware('beforeUnmount', async (_context, next) => {
                monitor.start('engine:unmount');
                await next();
            });
            engine.addMiddleware('unmounted', async (_context, next) => {
                monitor.end('engine:unmount');
                await next();
            });
            // 添加性能API到引擎
            Object.assign(engine, {
                startTiming: (name) => monitor.start(name),
                endTiming: (name) => monitor.end(name),
                markPerformance: (name) => monitor.mark(name),
                measurePerformance: (name, start, end) => monitor.measure(name, start, end),
                getPerformanceMetrics: () => monitor.getMetrics(),
                getPerformanceSummary: () => monitor.getSummary()
            });
        },
        uninstall(engine) {
            const monitor = engine.inject('performance');
            if (monitor) {
                monitor.destroy();
            }
        }
    };

    /**
     * 错误处理器实现
     */
    class ErrorHandlerImpl {
        constructor(config = {}) {
            Object.defineProperty(this, "errors", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: []
            });
            Object.defineProperty(this, "errorHandlers", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "recoveryStrategies", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "config", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "originalErrorHandler", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "originalUnhandledRejectionHandler", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.config = {
                enabled: config.enabled ?? true,
                captureUnhandledRejections: config.captureUnhandledRejections ?? true,
                captureUnhandledErrors: config.captureUnhandledErrors ?? true,
                maxErrors: config.maxErrors ?? 100,
                enableRecovery: config.enableRecovery ?? true,
                defaultRecoveryStrategy: config.defaultRecoveryStrategy ?? 'ignore',
                reportToConsole: config.reportToConsole ?? true,
                reportToServer: config.reportToServer ?? false,
                serverEndpoint: config.serverEndpoint ?? ''
            };
            if (this.config.enabled) {
                this.setupGlobalErrorHandling();
            }
        }
        /**
         * 处理错误
         */
        handleError(error, context) {
            if (!this.config.enabled) {
                return;
            }
            const errorInfo = {
                error,
                context,
                timestamp: Date.now(),
                stack: error.stack,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
                url: typeof window !== 'undefined' ? window.location.href : undefined,
                component: context?.component,
                hook: context?.hook
            };
            // 添加到错误列表
            this.addError(errorInfo);
            // 报告错误
            this.reportError(errorInfo);
            // 尝试恢复
            if (this.config.enableRecovery) {
                this.attemptRecovery(errorInfo);
            }
            // 调用自定义错误处理器
            this.callCustomHandlers(errorInfo);
        }
        /**
         * 注册错误处理器
         */
        registerHandler(name, handler) {
            this.errorHandlers.set(name, handler);
        }
        /**
         * 移除错误处理器
         */
        unregisterHandler(name) {
            this.errorHandlers.delete(name);
        }
        /**
         * 设置恢复策略
         */
        setRecoveryStrategy(errorType, strategy) {
            this.recoveryStrategies.set(errorType, strategy);
        }
        /**
         * 获取错误统计
         */
        getStats() {
            const stats = {
                total: this.errors.length,
                byType: {},
                byComponent: {},
                byHook: {},
                recent: this.errors.slice(-10)
            };
            for (const errorInfo of this.errors) {
                const errorType = errorInfo.error.constructor.name;
                stats.byType[errorType] = (stats.byType[errorType] || 0) + 1;
                if (errorInfo.component) {
                    stats.byComponent[errorInfo.component] = (stats.byComponent[errorInfo.component] || 0) + 1;
                }
                if (errorInfo.hook) {
                    stats.byHook[errorInfo.hook] = (stats.byHook[errorInfo.hook] || 0) + 1;
                }
            }
            return stats;
        }
        /**
         * 清除错误历史
         */
        clearErrors() {
            this.errors.length = 0;
        }
        /**
         * 获取最近的错误
         */
        getRecentErrors(count = 10) {
            return this.errors.slice(-count);
        }
        /**
         * 检查是否有错误
         */
        hasErrors() {
            return this.errors.length > 0;
        }
        /**
         * 添加错误到列表
         */
        addError(errorInfo) {
            this.errors.push(errorInfo);
            // 限制错误数量
            if (this.errors.length > this.config.maxErrors) {
                this.errors.shift();
            }
        }
        /**
         * 报告错误
         */
        reportError(errorInfo) {
            // 控制台报告
            if (this.config.reportToConsole) {
                console.error('Engine Error:', errorInfo.error);
                if (errorInfo.context) {
                    console.error('Context:', errorInfo.context);
                }
            }
            // 服务器报告
            if (this.config.reportToServer && this.config.serverEndpoint) {
                this.reportToServer(errorInfo).catch(err => {
                    console.warn('Failed to report error to server:', err);
                });
            }
        }
        /**
         * 向服务器报告错误
         */
        async reportToServer(errorInfo) {
            try {
                const payload = {
                    message: errorInfo.error.message,
                    stack: errorInfo.stack,
                    timestamp: errorInfo.timestamp,
                    userAgent: errorInfo.userAgent,
                    url: errorInfo.url,
                    component: errorInfo.component,
                    hook: errorInfo.hook,
                    context: errorInfo.context
                };
                await fetch(this.config.serverEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            }
            catch (error) {
                // 静默失败，避免无限循环
            }
        }
        /**
         * 尝试错误恢复
         */
        attemptRecovery(errorInfo) {
            const errorType = errorInfo.error.constructor.name;
            const strategy = this.recoveryStrategies.get(errorType) || this.config.defaultRecoveryStrategy;
            switch (strategy) {
                case 'ignore':
                    // 什么都不做
                    break;
                case 'retry':
                    // 如果有重试上下文，尝试重试
                    if (errorInfo.context?.retry && typeof errorInfo.context.retry === 'function') {
                        setTimeout(() => {
                            try {
                                errorInfo.context.retry();
                            }
                            catch (retryError) {
                                console.warn('Retry failed:', retryError);
                            }
                        }, 1000);
                    }
                    break;
                case 'fallback':
                    // 如果有回退函数，执行回退
                    if (errorInfo.context?.fallback && typeof errorInfo.context.fallback === 'function') {
                        try {
                            errorInfo.context.fallback();
                        }
                        catch (fallbackError) {
                            console.warn('Fallback failed:', fallbackError);
                        }
                    }
                    break;
                case 'reload':
                    // 重新加载页面（仅在浏览器环境）
                    if (typeof window !== 'undefined' && window.location) {
                        console.warn('Critical error detected, reloading page...');
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    }
                    break;
            }
        }
        /**
         * 调用自定义错误处理器
         */
        callCustomHandlers(errorInfo) {
            for (const [name, handler] of this.errorHandlers) {
                try {
                    handler(errorInfo.error, errorInfo.context);
                }
                catch (handlerError) {
                    console.error(`Error in custom error handler '${name}':`, handlerError);
                }
            }
        }
        /**
         * 设置全局错误处理
         */
        setupGlobalErrorHandling() {
            if (typeof window === 'undefined') {
                return;
            }
            // 捕获未处理的错误
            if (this.config.captureUnhandledErrors) {
                this.originalErrorHandler = window.onerror;
                window.onerror = (message, source, lineno, colno, error) => {
                    if (error) {
                        this.handleError(error, {
                            source,
                            lineno,
                            colno,
                            type: 'unhandled'
                        });
                    }
                    else {
                        this.handleError(new Error(String(message)), {
                            source,
                            lineno,
                            colno,
                            type: 'unhandled'
                        });
                    }
                    // 调用原始处理器
                    if (this.originalErrorHandler && typeof this.originalErrorHandler === 'function') {
                        return this.originalErrorHandler.call(window, message, source, lineno, colno, error);
                    }
                    return false;
                };
            }
            // 捕获未处理的Promise拒绝
            if (this.config.captureUnhandledRejections) {
                this.originalUnhandledRejectionHandler = window.onunhandledrejection;
                window.onunhandledrejection = (event) => {
                    const error = event.reason instanceof Error
                        ? event.reason
                        : new Error(String(event.reason));
                    this.handleError(error, {
                        type: 'unhandledRejection',
                        promise: event.promise
                    });
                    // 调用原始处理器
                    if (this.originalUnhandledRejectionHandler && typeof this.originalUnhandledRejectionHandler === 'function') {
                        this.originalUnhandledRejectionHandler(event);
                    }
                };
            }
        }
        /**
         * 恢复全局错误处理
         */
        restoreGlobalErrorHandling() {
            if (typeof window === 'undefined') {
                return;
            }
            if (this.originalErrorHandler !== undefined) {
                window.onerror = this.originalErrorHandler;
                this.originalErrorHandler = undefined;
            }
            if (this.originalUnhandledRejectionHandler !== undefined) {
                window.onunhandledrejection = this.originalUnhandledRejectionHandler;
                this.originalUnhandledRejectionHandler = undefined;
            }
        }
        /**
         * 销毁错误处理器
         */
        destroy() {
            this.restoreGlobalErrorHandling();
            this.clearErrors();
            this.errorHandlers.clear();
            this.recoveryStrategies.clear();
        }
    }
    /**
     * 错误处理插件
     */
    const errorHandlerPlugin = {
        name: 'error-handler',
        install(engine, options = {}) {
            const errorHandler = new ErrorHandlerImpl(options);
            // 注入错误处理器
            engine.provide('errorHandler', errorHandler);
            // 设置引擎错误处理器
            if (engine.updateConfig) {
                engine.updateConfig({
                    errorHandler: (error, context) => {
                        errorHandler.handleError(error, context);
                    }
                });
            }
            // 监听引擎错误事件
            engine.on('engine:error', (error, context) => {
                errorHandler.handleError(error, { ...context, source: 'engine' });
            });
            engine.on('plugin:error', (error, context) => {
                errorHandler.handleError(error, { ...context, source: 'plugin' });
            });
            engine.on('middleware:error', (error, context) => {
                errorHandler.handleError(error, { ...context, source: 'middleware' });
            });
            // 添加错误处理API到引擎
            Object.assign(engine, {
                handleError: (error, context) => errorHandler.handleError(error, context),
                registerErrorHandler: (name, handler) => errorHandler.registerHandler(name, handler),
                unregisterErrorHandler: (name) => errorHandler.unregisterHandler(name),
                setRecoveryStrategy: (errorType, strategy) => errorHandler.setRecoveryStrategy(errorType, strategy),
                getErrorStats: () => errorHandler.getStats(),
                clearErrors: () => errorHandler.clearErrors()
            });
        },
        uninstall(engine) {
            const errorHandler = engine.inject('errorHandler');
            if (errorHandler) {
                errorHandler.destroy();
            }
        }
    };

    /**
     * 创建引擎实例的工厂函数
     * @param config 可选的引擎配置
     * @returns 引擎实例
     */
    const createEngine = (config) => {
        return new EngineImpl(config);
    };
    /**
     * 版本信息
     */
    const version = '1.0.0';
    /**
     * 引擎信息
     */
    const engineInfo = {
        name: '@ldesign/engine',
        version,
        description: 'A lightweight Vue 3 based application engine',
        author: 'LDesign Team',
        license: 'MIT'
    };

    exports.ConfigError = ConfigError;
    exports.ConfigManagerImpl = ConfigManagerImpl;
    exports.DIContainerImpl = DIContainerImpl;
    exports.EngineError = EngineError;
    exports.EngineImpl = EngineImpl;
    exports.EventEmitterImpl = EventEmitterImpl;
    exports.MiddlewareError = MiddlewareError;
    exports.MiddlewareManagerImpl = MiddlewareManagerImpl;
    exports.PluginError = PluginError;
    exports.PluginManagerImpl = PluginManagerImpl;
    exports.createEngine = createEngine;
    exports.default = createEngine;
    exports.engineInfo = engineInfo;
    exports.errorHandlerPlugin = errorHandlerPlugin;
    exports.performancePlugin = performancePlugin;
    exports.version = version;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map
