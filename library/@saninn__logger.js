(function(){function l(){function n(a){return a?"object"===typeof a||"function"===typeof a:!1}var p=null;var g=function(a,b){function f(){}if(!n(a)||!n(b))throw new TypeError("Cannot create proxy with a non-object as target or handler");p=function(){f=function(a){throw new TypeError("Cannot perform '"+a+"' on a proxy that has been revoked");}};var e=b;b={get:null,set:null,apply:null,construct:null};for(var k in e){if(!(k in b))throw new TypeError("Proxy polyfill does not support trap '"+k+"'");b[k]=e[k]}"function"===
typeof e&&(b.apply=e.apply.bind(e));var c=this,g=!1,q=!1;"function"===typeof a?(c=function(){var h=this&&this.constructor===c,d=Array.prototype.slice.call(arguments);f(h?"construct":"apply");return h&&b.construct?b.construct.call(this,a,d):!h&&b.apply?b.apply(a,this,d):h?(d.unshift(a),new (a.bind.apply(a,d))):a.apply(this,d)},g=!0):a instanceof Array&&(c=[],q=!0);var r=b.get?function(a){f("get");return b.get(this,a,c)}:function(a){f("get");return this[a]},v=b.set?function(a,d){f("set");b.set(this,
a,d,c)}:function(a,b){f("set");this[a]=b},t={};Object.getOwnPropertyNames(a).forEach(function(b){if(!((g||q)&&b in c)){var d={enumerable:!!Object.getOwnPropertyDescriptor(a,b).enumerable,get:r.bind(a,b),set:v.bind(a,b)};Object.defineProperty(c,b,d);t[b]=!0}});e=!0;Object.setPrototypeOf?Object.setPrototypeOf(c,Object.getPrototypeOf(a)):c.__proto__?c.__proto__=a.__proto__:e=!1;if(b.get||!e)for(var m in a)t[m]||Object.defineProperty(c,m,{get:r.bind(a,m)});Object.seal(a);Object.seal(c);return c};g.revocable=
function(a,b){return{proxy:new g(a,b),revoke:p}};return g};var u="undefined"!==typeof process&&"[object process]"==={}.toString.call(process)||"undefined"!==typeof navigator&&"ReactNative"===navigator.product?global:self;u.Proxy||(u.Proxy=l(),u.Proxy.revocable=u.Proxy.revocable);})()
;/**
 *  @license
 *
 *  Copyright Saninn Salas Diaz All Rights Reserved.
 *
 *  Released under the MIT License
 *
 *  http://www.saninnsalas.com
 */
var SaninnLogger = (function (exports) {
  'use strict';

  /**
   * ALL < DEBUG < INFO < WARN < ERROR < FATAL < OFF.
   */
  var LogLevelsEnum;
  (function (LogLevelsEnum) {
      LogLevelsEnum[LogLevelsEnum["DEBUG"] = 0] = "DEBUG";
      LogLevelsEnum[LogLevelsEnum["INFO"] = 1] = "INFO";
      LogLevelsEnum[LogLevelsEnum["WARN"] = 2] = "WARN";
      LogLevelsEnum[LogLevelsEnum["ERROR"] = 3] = "ERROR";
      LogLevelsEnum[LogLevelsEnum["FATAL"] = 4] = "FATAL";
      LogLevelsEnum[LogLevelsEnum["OFF"] = 5] = "OFF";
  })(LogLevelsEnum || (LogLevelsEnum = {}));

  /**
   * A really powerfull Enum that controls which getters/logger functions
   * exists on SaninnLogger and also the structure of each configuration
   * object that needs to be indivisual to every logger function.
   */
  var LoggerTypesEnum;
  (function (LoggerTypesEnum) {
      LoggerTypesEnum["debug"] = "debug";
      LoggerTypesEnum["log"] = "log";
      LoggerTypesEnum["info"] = "info";
      LoggerTypesEnum["dir"] = "dir";
      LoggerTypesEnum["warn"] = "warn";
      LoggerTypesEnum["error"] = "error";
  })(LoggerTypesEnum || (LoggerTypesEnum = {}));

  var Helpers;
  (function (Helpers) {
      Helpers.LOG_TYPES_ARRAY = Object.keys(LoggerTypesEnum);
      function getBindedConsoleProxy(logType, consoleProxy, config) {
          var logTypeToPrint = '';
          if (config.showLoggerFunctionNames && logType !== LoggerTypesEnum.dir) {
              logTypeToPrint = "[" + logType.toUpperCase() + "]";
          }
          if (!config.prefix && !config.showLoggerFunctionNames) {
              return consoleProxy[logType].bind(console);
          }
          if (!config.prefix && logTypeToPrint.length && logType !== LoggerTypesEnum.dir) {
              return consoleProxy[logType].bind(console, logTypeToPrint + ':');
          }
          if (!config.prefix) {
              return consoleProxy[logType].bind(console);
          }
          var prefixString = "[" + config.prefix + "]" + logTypeToPrint + ":";
          // Console.dir does not accept multiparameters,
          // We will add a raw console.log before the dir print
          if (logType === LoggerTypesEnum.dir) {
              // tslint:disable-next-line:no-console
              console.log(prefixString + '(dir after this line)');
              return consoleProxy[logType].bind(console);
          }
          if (!config.prefixColors[logType]) {
              return consoleProxy[logType].bind(console, prefixString);
          }
          return consoleProxy[logType].bind(console, "%c" + prefixString, "color: " + config.prefixColors[logType]);
      }
      Helpers.getBindedConsoleProxy = getBindedConsoleProxy;
      /**
       * Maps LoggerTypesEnum to LogLevelsEnum values, allowing to set mo
       */
      function getLogLevelOf(logType) {
          switch (logType) {
              case LoggerTypesEnum.debug:
                  return LogLevelsEnum.DEBUG;
              case LoggerTypesEnum.dir:
              case LoggerTypesEnum.info:
              case LoggerTypesEnum.log:
                  return LogLevelsEnum.INFO;
              case LoggerTypesEnum.warn:
                  return LogLevelsEnum.WARN;
              case LoggerTypesEnum.error:
                  return LogLevelsEnum.ERROR;
              default:
                  throw new Error('this LogType is not mapped to a LogLevel');
          }
      }
      Helpers.getLogLevelOf = getLogLevelOf;
  })(Helpers || (Helpers = {}));

  var LoggerConfig = /** @class */ (function () {
      function LoggerConfig(wantedLoggerConfig) {
          this.prefix = '';
          this.prefixColors = {};
          /** @deprecated */
          this.printToConsole = true;
          this.useGlobalPreLoggerFunctions = false;
          this.globalPreLoggerFunctions = {};
          this.useLoggerProcessors = false;
          // TODO: Make this more type safe (init with the function return instead of mutation)
          this.loggerProcessors = {};
          this.showLoggerFunctionNames = false;
          this.logLevel = LogLevelsEnum.DEBUG;
          if (!wantedLoggerConfig) {
              return;
          }
          this.prefix = wantedLoggerConfig.prefix || '';
          this.logLevel = wantedLoggerConfig.logLevel || this.logLevel;
          this.useLoggerProcessors = !!wantedLoggerConfig.useLoggerProcessors;
          this.showLoggerFunctionNames = !!wantedLoggerConfig.showLoggerFunctionNames;
          if (wantedLoggerConfig.loggerProcessors) {
              this.initializeLoggerProcessorsWith(wantedLoggerConfig.loggerProcessors);
          }
          this.useGlobalPreLoggerFunctions = !!wantedLoggerConfig.useGlobalPreLoggerFunctions;
          // Since printToConsole is true by default this is the safest way to assign it.
          if (typeof wantedLoggerConfig.printToConsole !== 'undefined') {
              this.printToConsole = wantedLoggerConfig.printToConsole;
          }
          if (this.globalPreLoggerFunctions) {
              this.initializeObjectsBasedOnEnumsLogTypes(this.globalPreLoggerFunctions, wantedLoggerConfig.globalPreLoggerFunctions);
          }
          // IE does not support colors!
          var isIE = this.isIE();
          if (this.prefixColors && !isIE) {
              this.initializeObjectsBasedOnEnumsLogTypes(this.prefixColors, wantedLoggerConfig.prefixColors);
          }
      }
      LoggerConfig.createInstance = function (wantedLoggerConfig) {
          return new LoggerConfig(wantedLoggerConfig);
      };
      LoggerConfig.prototype.initializeLoggerProcessorsWith = function (loggerProcessors) {
          var _this = this;
          Helpers.LOG_TYPES_ARRAY.forEach(function (logType) {
              // tslint:disable-next-line:prefer-conditional-expression
              if (loggerProcessors[logType]) {
                  _this.loggerProcessors[logType] = loggerProcessors[logType];
              }
              else {
                  _this.loggerProcessors[logType] = [];
              }
          });
      };
      LoggerConfig.prototype.initializeObjectsBasedOnEnumsLogTypes = function (object, configs) {
          if (!configs) {
              return;
          }
          Helpers.LOG_TYPES_ARRAY.forEach(function (logType) {
              if (configs[logType]) {
                  object[logType] = configs[logType];
              }
          });
      };
      LoggerConfig.prototype.isIE = function () {
          // @ts-ignore
          return /*@cc_on!@*/  !!document.documentMode;
      };
      return LoggerConfig;
  }());

  /*!
   *  @license
   *
   *  Copyright Saninn Salas Diaz All Rights Reserved.
   *
   *  Released under the MIT License
   *
   *  http://www.saninnsalas.com
   */
  // let saninnLoggerInstanceCounter = 0;
  var SaninnLogger = /** @class */ (function () {
      function SaninnLogger(loggerConfig) {
          // saninnLoggerInstanceCounter++;
          // this.loggerId = `SaninnLogger_${Date.now()}_${saninnLoggerInstanceCounter}`;
          var _this = this;
          // tslint:disable-next-line:no-empty
          this.consoleFunctionProxys = {};
          this.consoleProxyHandler = {
              get: function (target, prop) {
                  if (_this.config.useLoggerProcessors) {
                      return _this.consoleFunctionProxys[prop];
                  }
                  else {
                      return target[prop];
                  }
              }
          };
          this.consoleProxy = new Proxy(console, this.consoleProxyHandler);
          this.initProxy();
          if (typeof loggerConfig === 'string') {
              loggerConfig = {
                  prefix: loggerConfig
              };
          }
          this.config = LoggerConfig.createInstance(loggerConfig);
      }
      Object.defineProperty(SaninnLogger.prototype, "debug", {
          //    ██████  ███████ ████████ ████████ ███████ ██████  ███████
          //   ██       ██         ██       ██    ██      ██   ██ ██
          //   ██   ███ █████      ██       ██    █████   ██████  ███████
          //   ██    ██ ██         ██       ██    ██      ██   ██      ██
          //    ██████  ███████    ██       ██    ███████ ██   ██ ███████
          // TODO: There should be a way to make this automatically from the Enum...
          // TODO: Or could I use Proxy here???
          get: function () {
              return this.getConsoleHandlerFor(LoggerTypesEnum.debug);
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(SaninnLogger.prototype, "info", {
          get: function () {
              return this.getConsoleHandlerFor(LoggerTypesEnum.info);
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(SaninnLogger.prototype, "log", {
          get: function () {
              return this.getConsoleHandlerFor(LoggerTypesEnum.log);
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(SaninnLogger.prototype, "dir", {
          /**
           * console.dir does not accept multiparameters
           * if you log `logger.dir(x,y)` `y` will be ignored
           */
          get: function () {
              return this.getConsoleHandlerFor(LoggerTypesEnum.dir);
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(SaninnLogger.prototype, "warn", {
          get: function () {
              return this.getConsoleHandlerFor(LoggerTypesEnum.warn);
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(SaninnLogger.prototype, "error", {
          get: function () {
              return this.getConsoleHandlerFor(LoggerTypesEnum.error);
          },
          enumerable: true,
          configurable: true
      });
      //    ██████  ██    ██ ██████  ██      ██  ██████
      //    ██   ██ ██    ██ ██   ██ ██      ██ ██
      //    ██████  ██    ██ ██████  ██      ██ ██
      //    ██      ██    ██ ██   ██ ██      ██ ██
      //    ██       ██████  ██████  ███████ ██  ██████
      SaninnLogger.prototype.setPrefixTo = function (newPrefix) {
          this.config.prefix = newPrefix;
      };
      SaninnLogger.prototype.disableAll = function () {
          this.disablePrintToConsole();
          this.disableLoggerProcessors();
          this.disableGlobalLoggerFunctions();
      };
      SaninnLogger.prototype.enablePrintToConsole = function () {
          this.config.printToConsole = true;
      };
      SaninnLogger.prototype.disablePrintToConsole = function () {
          this.config.printToConsole = false;
      };
      SaninnLogger.prototype.addLoggerProcessor = function (logType, loggerProcessor) {
          this.config.loggerProcessors[logType].push(loggerProcessor);
      };
      SaninnLogger.prototype.removeLoggerProcessor = function (logType, loggerProcessor) {
          var indexToRemove = this.config.loggerProcessors[logType].indexOf(loggerProcessor);
          if (indexToRemove !== -1) {
              this.config.loggerProcessors[logType].splice(indexToRemove, 1);
          }
      };
      SaninnLogger.prototype.enableLoggerProcessors = function () {
          this.config.useLoggerProcessors = true;
      };
      SaninnLogger.prototype.disableLoggerProcessors = function () {
          this.config.useLoggerProcessors = false;
      };
      SaninnLogger.prototype.enableGlobalLoggerFunctions = function () {
          this.config.useGlobalPreLoggerFunctions = true;
      };
      SaninnLogger.prototype.disableGlobalLoggerFunctions = function () {
          this.config.useGlobalPreLoggerFunctions = false;
      };
      SaninnLogger.prototype.setLogLevelTo = function (level) {
          this.config.logLevel = level;
      };
      SaninnLogger.prototype.initProxy = function () {
          var _this = this;
          Helpers.LOG_TYPES_ARRAY.forEach(function (logType) {
              var consoleFunctionHandler = {
                  // tslint:disable-next-line:object-literal-shorthand
                  apply: function (target, consoleObject, argumentsList) {
                      return _this.consoleFunctionProxyApply(target, consoleObject, argumentsList, logType);
                  }
              };
              _this.consoleFunctionProxys[logType] = new Proxy(console[logType], consoleFunctionHandler);
              // console.error(this.consoleFunctionProxys[logType]);
          });
      };
      /**
       * @param nativeConsoleFunction - The native console.log Function
       * @param _nativeConsoleObject - window.console / global.console
       * @param argumentsList - contains all arguments sended to console.x(), including prefix, color, etc
       * @returns void
       */
      SaninnLogger.prototype.consoleFunctionProxyApply = function (nativeConsoleFunction, 
      // tslint:disable-next-line:variable-name
      _nativeConsoleObject, argumentsList, logType) {
          if (this.config.loggerProcessors[logType] && this.config.loggerProcessors[logType].length) {
              this.runLoggerProcessorsOf(logType, argumentsList);
          }
          if (this.config.printToConsole) {
              // Needed for IE10 https://stackoverflow.com/a/5539378/1255819
              var bindedFunction = Function.prototype.bind.call(nativeConsoleFunction, console);
              return bindedFunction.apply(void 0, argumentsList);
          }
      };
      SaninnLogger.prototype.runLoggerProcessorsOf = function (logType, rawArgumentList) {
          var initialIndexOfArguments = 0;
          var prefix = this.config.prefix;
          if (logType !== LoggerTypesEnum.dir && this.config.prefix) {
              initialIndexOfArguments++;
              if (this.config.prefixColors[logType]) {
                  initialIndexOfArguments++;
              }
          }
          var argumentsList = rawArgumentList.slice(initialIndexOfArguments);
          // TODO: Use it with the observer pattern?
          this.config.loggerProcessors[logType].forEach(function (loggerProcessor) {
              var params = {
                  prefix: prefix,
                  logType: logType,
                  args: argumentsList
              };
              loggerProcessor(params);
          });
      };
      SaninnLogger.prototype.getConsoleHandlerFor = function (logType) {
          var extraFunctionForThisLogType = this.config.globalPreLoggerFunctions[logType];
          // TODO: add an callback for when this function is done?????
          if (this.config.useGlobalPreLoggerFunctions && extraFunctionForThisLogType) {
              extraFunctionForThisLogType(this.config.prefix);
          }
          /** printToConsole is @deprecated */
          var loggerConsoleOutputIsDisabled = !this.config.printToConsole || this.config.logLevel === LogLevelsEnum.OFF;
          if (loggerConsoleOutputIsDisabled && !this.config.useLoggerProcessors) {
              return SaninnLogger.__emptyConsoleFunction;
          }
          var logLevelForThisLogType = Helpers.getLogLevelOf(logType);
          if (logLevelForThisLogType < this.config.logLevel) {
              return SaninnLogger.__emptyConsoleFunction;
          }
          return Helpers.getBindedConsoleProxy(logType, this.consoleProxy, this.config);
      };
      SaninnLogger.LOG_TYPES_ARRAY = Helpers.LOG_TYPES_ARRAY;
      // tslint:disable-next-line: variable-name
      SaninnLogger.__emptyConsoleFunction = function () { return void 0; };
      return SaninnLogger;
  }());

  exports.SaninnLogger = SaninnLogger;

  return SaninnLogger;

}({}));
