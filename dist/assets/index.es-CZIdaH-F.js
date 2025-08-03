const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/secp256k1-Bf0WsDG8.js","assets/index-D5Hg1j76.js","assets/index-V6knYbMY.css","assets/events-BSFfDV4v.js","assets/core-DTyjt6Od.js"])))=>i.map(i=>d[i]);
import { w as __vitePreload, g as getDefaultExportFromCjs } from './index-D5Hg1j76.js';
import { e as eventsExports, N as Nt$3 } from './events-BSFfDV4v.js';

var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var BrowserInfo = /** @class */ (function () {
    function BrowserInfo(name, version, os) {
        this.name = name;
        this.version = version;
        this.os = os;
        this.type = 'browser';
    }
    return BrowserInfo;
}());
var NodeInfo = /** @class */ (function () {
    function NodeInfo(version) {
        this.version = version;
        this.type = 'node';
        this.name = 'node';
        this.os = process.platform;
    }
    return NodeInfo;
}());
var SearchBotDeviceInfo = /** @class */ (function () {
    function SearchBotDeviceInfo(name, version, os, bot) {
        this.name = name;
        this.version = version;
        this.os = os;
        this.bot = bot;
        this.type = 'bot-device';
    }
    return SearchBotDeviceInfo;
}());
var BotInfo = /** @class */ (function () {
    function BotInfo() {
        this.type = 'bot';
        this.bot = true; // NOTE: deprecated test name instead
        this.name = 'bot';
        this.version = null;
        this.os = null;
    }
    return BotInfo;
}());
var ReactNativeInfo = /** @class */ (function () {
    function ReactNativeInfo() {
        this.type = 'react-native';
        this.name = 'react-native';
        this.version = null;
        this.os = null;
    }
    return ReactNativeInfo;
}());
// tslint:disable-next-line:max-line-length
var SEARCHBOX_UA_REGEX = /alexa|bot|crawl(er|ing)|facebookexternalhit|feedburner|google web preview|nagios|postrank|pingdom|slurp|spider|yahoo!|yandex/;
var SEARCHBOT_OS_REGEX = /(nuhk|curl|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask\ Jeeves\/Teoma|ia_archiver)/;
var REQUIRED_VERSION_PARTS = 3;
var userAgentRules = [
    ['aol', /AOLShield\/([0-9\._]+)/],
    ['edge', /Edge\/([0-9\._]+)/],
    ['edge-ios', /EdgiOS\/([0-9\._]+)/],
    ['yandexbrowser', /YaBrowser\/([0-9\._]+)/],
    ['kakaotalk', /KAKAOTALK\s([0-9\.]+)/],
    ['samsung', /SamsungBrowser\/([0-9\.]+)/],
    ['silk', /\bSilk\/([0-9._-]+)\b/],
    ['miui', /MiuiBrowser\/([0-9\.]+)$/],
    ['beaker', /BeakerBrowser\/([0-9\.]+)/],
    ['edge-chromium', /EdgA?\/([0-9\.]+)/],
    [
        'chromium-webview',
        /(?!Chrom.*OPR)wv\).*Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/,
    ],
    ['chrome', /(?!Chrom.*OPR)Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/],
    ['phantomjs', /PhantomJS\/([0-9\.]+)(:?\s|$)/],
    ['crios', /CriOS\/([0-9\.]+)(:?\s|$)/],
    ['firefox', /Firefox\/([0-9\.]+)(?:\s|$)/],
    ['fxios', /FxiOS\/([0-9\.]+)/],
    ['opera-mini', /Opera Mini.*Version\/([0-9\.]+)/],
    ['opera', /Opera\/([0-9\.]+)(?:\s|$)/],
    ['opera', /OPR\/([0-9\.]+)(:?\s|$)/],
    ['pie', /^Microsoft Pocket Internet Explorer\/(\d+\.\d+)$/],
    ['pie', /^Mozilla\/\d\.\d+\s\(compatible;\s(?:MSP?IE|MSInternet Explorer) (\d+\.\d+);.*Windows CE.*\)$/],
    ['netfront', /^Mozilla\/\d\.\d+.*NetFront\/(\d.\d)/],
    ['ie', /Trident\/7\.0.*rv\:([0-9\.]+).*\).*Gecko$/],
    ['ie', /MSIE\s([0-9\.]+);.*Trident\/[4-7].0/],
    ['ie', /MSIE\s(7\.0)/],
    ['bb10', /BB10;\sTouch.*Version\/([0-9\.]+)/],
    ['android', /Android\s([0-9\.]+)/],
    ['ios', /Version\/([0-9\._]+).*Mobile.*Safari.*/],
    ['safari', /Version\/([0-9\._]+).*Safari/],
    ['facebook', /FB[AS]V\/([0-9\.]+)/],
    ['instagram', /Instagram\s([0-9\.]+)/],
    ['ios-webview', /AppleWebKit\/([0-9\.]+).*Mobile/],
    ['ios-webview', /AppleWebKit\/([0-9\.]+).*Gecko\)$/],
    ['curl', /^curl\/([0-9\.]+)$/],
    ['searchbot', SEARCHBOX_UA_REGEX],
];
var operatingSystemRules = [
    ['iOS', /iP(hone|od|ad)/],
    ['Android OS', /Android/],
    ['BlackBerry OS', /BlackBerry|BB10/],
    ['Windows Mobile', /IEMobile/],
    ['Amazon OS', /Kindle/],
    ['Windows 3.11', /Win16/],
    ['Windows 95', /(Windows 95)|(Win95)|(Windows_95)/],
    ['Windows 98', /(Windows 98)|(Win98)/],
    ['Windows 2000', /(Windows NT 5.0)|(Windows 2000)/],
    ['Windows XP', /(Windows NT 5.1)|(Windows XP)/],
    ['Windows Server 2003', /(Windows NT 5.2)/],
    ['Windows Vista', /(Windows NT 6.0)/],
    ['Windows 7', /(Windows NT 6.1)/],
    ['Windows 8', /(Windows NT 6.2)/],
    ['Windows 8.1', /(Windows NT 6.3)/],
    ['Windows 10', /(Windows NT 10.0)/],
    ['Windows ME', /Windows ME/],
    ['Windows CE', /Windows CE|WinCE|Microsoft Pocket Internet Explorer/],
    ['Open BSD', /OpenBSD/],
    ['Sun OS', /SunOS/],
    ['Chrome OS', /CrOS/],
    ['Linux', /(Linux)|(X11)/],
    ['Mac OS', /(Mac_PowerPC)|(Macintosh)/],
    ['QNX', /QNX/],
    ['BeOS', /BeOS/],
    ['OS/2', /OS\/2/],
];
function detect(userAgent) {
    if (typeof document === 'undefined' &&
        typeof navigator !== 'undefined' &&
        navigator.product === 'ReactNative') {
        return new ReactNativeInfo();
    }
    if (typeof navigator !== 'undefined') {
        return parseUserAgent(navigator.userAgent);
    }
    return getNodeVersion();
}
function matchUserAgent(ua) {
    // opted for using reduce here rather than Array#first with a regex.test call
    // this is primarily because using the reduce we only perform the regex
    // execution once rather than once for the test and for the exec again below
    // probably something that needs to be benchmarked though
    return (ua !== '' &&
        userAgentRules.reduce(function (matched, _a) {
            var browser = _a[0], regex = _a[1];
            if (matched) {
                return matched;
            }
            var uaMatch = regex.exec(ua);
            return !!uaMatch && [browser, uaMatch];
        }, false));
}
function parseUserAgent(ua) {
    var matchedRule = matchUserAgent(ua);
    if (!matchedRule) {
        return null;
    }
    var name = matchedRule[0], match = matchedRule[1];
    if (name === 'searchbot') {
        return new BotInfo();
    }
    // Do not use RegExp for split operation as some browser do not support it (See: http://blog.stevenlevithan.com/archives/cross-browser-split)
    var versionParts = match[1] && match[1].split('.').join('_').split('_').slice(0, 3);
    if (versionParts) {
        if (versionParts.length < REQUIRED_VERSION_PARTS) {
            versionParts = __spreadArray(__spreadArray([], versionParts, true), createVersionParts(REQUIRED_VERSION_PARTS - versionParts.length), true);
        }
    }
    else {
        versionParts = [];
    }
    var version = versionParts.join('.');
    var os = detectOS(ua);
    var searchBotMatch = SEARCHBOT_OS_REGEX.exec(ua);
    if (searchBotMatch && searchBotMatch[1]) {
        return new SearchBotDeviceInfo(name, version, os, searchBotMatch[1]);
    }
    return new BrowserInfo(name, version, os);
}
function detectOS(ua) {
    for (var ii = 0, count = operatingSystemRules.length; ii < count; ii++) {
        var _a = operatingSystemRules[ii], os = _a[0], regex = _a[1];
        var match = regex.exec(ua);
        if (match) {
            return os;
        }
    }
    return null;
}
function getNodeVersion() {
    var isNode = typeof process !== 'undefined' && process.version;
    return isNode ? new NodeInfo(process.version.slice(1)) : null;
}
function createVersionParts(count) {
    var output = [];
    for (var ii = 0; ii < count; ii++) {
        output.push('0');
    }
    return output;
}

var cjs$3 = {};

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var extendStatics$1 = function(d, b) {
  extendStatics$1 = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
  };
  return extendStatics$1(d, b);
};
function __extends$1(d, b) {
  extendStatics$1(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign$1 = function() {
  __assign$1 = Object.assign || function __assign2(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
  };
  return __assign$1.apply(this, arguments);
};
function __rest$1(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
    t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
}
function __decorate$1(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function __param$1(paramIndex, decorator) {
  return function(target, key) {
    decorator(target, key, paramIndex);
  };
}
function __metadata$1(metadataKey, metadataValue) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}
function __awaiter$1(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator$1(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1) throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return { value: op[1], done: false };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
}
function __createBinding$1(o, m, k, k2) {
  if (k2 === void 0) k2 = k;
  o[k2] = m[k];
}
function __exportStar$1(m, exports) {
  for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) exports[p] = m[p];
}
function __values$1(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function() {
      if (o && i >= o.length) o = void 0;
      return { value: o && o[i++], done: !o };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read$1(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
}
function __spread$1() {
  for (var ar = [], i = 0; i < arguments.length; i++)
    ar = ar.concat(__read$1(arguments[i]));
  return ar;
}
function __spreadArrays$1() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
    for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
      r[k] = a[j];
  return r;
}
function __await$1(v) {
  return this instanceof __await$1 ? (this.v = v, this) : new __await$1(v);
}
function __asyncGenerator$1(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
    return this;
  }, i;
  function verb(n) {
    if (g[n]) i[n] = function(v) {
      return new Promise(function(a, b) {
        q.push([n, v, a, b]) > 1 || resume(n, v);
      });
    };
  }
  function resume(n, v) {
    try {
      step(g[n](v));
    } catch (e) {
      settle(q[0][3], e);
    }
  }
  function step(r) {
    r.value instanceof __await$1 ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
  }
  function fulfill(value) {
    resume("next", value);
  }
  function reject(value) {
    resume("throw", value);
  }
  function settle(f, v) {
    if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
  }
}
function __asyncDelegator$1(o) {
  var i, p;
  return i = {}, verb("next"), verb("throw", function(e) {
    throw e;
  }), verb("return"), i[Symbol.iterator] = function() {
    return this;
  }, i;
  function verb(n, f) {
    i[n] = o[n] ? function(v) {
      return (p = !p) ? { value: __await$1(o[n](v)), done: n === "return" } : f ? f(v) : v;
    } : f;
  }
}
function __asyncValues$1(o) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator], i;
  return m ? m.call(o) : (o = typeof __values$1 === "function" ? __values$1(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
    return this;
  }, i);
  function verb(n) {
    i[n] = o[n] && function(v) {
      return new Promise(function(resolve, reject) {
        v = o[n](v), settle(resolve, reject, v.done, v.value);
      });
    };
  }
  function settle(resolve, reject, d, v) {
    Promise.resolve(v).then(function(v2) {
      resolve({ value: v2, done: d });
    }, reject);
  }
}
function __makeTemplateObject$1(cooked, raw) {
  if (Object.defineProperty) {
    Object.defineProperty(cooked, "raw", { value: raw });
  } else {
    cooked.raw = raw;
  }
  return cooked;
}
function __importStar$1(mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) {
    for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
  }
  result.default = mod;
  return result;
}
function __importDefault$1(mod) {
  return mod && mod.__esModule ? mod : { default: mod };
}
function __classPrivateFieldGet$1(receiver, privateMap) {
  if (!privateMap.has(receiver)) {
    throw new TypeError("attempted to get private field on non-instance");
  }
  return privateMap.get(receiver);
}
function __classPrivateFieldSet$1(receiver, privateMap, value) {
  if (!privateMap.has(receiver)) {
    throw new TypeError("attempted to set private field on non-instance");
  }
  privateMap.set(receiver, value);
  return value;
}

const tslib_es6$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    get __assign () { return __assign$1; },
    __asyncDelegator: __asyncDelegator$1,
    __asyncGenerator: __asyncGenerator$1,
    __asyncValues: __asyncValues$1,
    __await: __await$1,
    __awaiter: __awaiter$1,
    __classPrivateFieldGet: __classPrivateFieldGet$1,
    __classPrivateFieldSet: __classPrivateFieldSet$1,
    __createBinding: __createBinding$1,
    __decorate: __decorate$1,
    __exportStar: __exportStar$1,
    __extends: __extends$1,
    __generator: __generator$1,
    __importDefault: __importDefault$1,
    __importStar: __importStar$1,
    __makeTemplateObject: __makeTemplateObject$1,
    __metadata: __metadata$1,
    __param: __param$1,
    __read: __read$1,
    __rest: __rest$1,
    __spread: __spread$1,
    __spreadArrays: __spreadArrays$1,
    __values: __values$1
}, Symbol.toStringTag, { value: 'Module' }));

var utils = {};

var delay = {};

var hasRequiredDelay;

function requireDelay () {
	if (hasRequiredDelay) return delay;
	hasRequiredDelay = 1;
	Object.defineProperty(delay, "__esModule", { value: true });
	delay.delay = void 0;
	function delay$1(timeout) {
	    return new Promise(resolve => {
	        setTimeout(() => {
	            resolve(true);
	        }, timeout);
	    });
	}
	delay.delay = delay$1;
	
	return delay;
}

var convert = {};

var constants = {};

var misc = {};

var hasRequiredMisc;

function requireMisc () {
	if (hasRequiredMisc) return misc;
	hasRequiredMisc = 1;
	Object.defineProperty(misc, "__esModule", { value: true });
	misc.ONE_THOUSAND = misc.ONE_HUNDRED = void 0;
	misc.ONE_HUNDRED = 100;
	misc.ONE_THOUSAND = 1000;
	
	return misc;
}

var time = {};

var hasRequiredTime;

function requireTime () {
	if (hasRequiredTime) return time;
	hasRequiredTime = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.ONE_YEAR = exports.FOUR_WEEKS = exports.THREE_WEEKS = exports.TWO_WEEKS = exports.ONE_WEEK = exports.THIRTY_DAYS = exports.SEVEN_DAYS = exports.FIVE_DAYS = exports.THREE_DAYS = exports.ONE_DAY = exports.TWENTY_FOUR_HOURS = exports.TWELVE_HOURS = exports.SIX_HOURS = exports.THREE_HOURS = exports.ONE_HOUR = exports.SIXTY_MINUTES = exports.THIRTY_MINUTES = exports.TEN_MINUTES = exports.FIVE_MINUTES = exports.ONE_MINUTE = exports.SIXTY_SECONDS = exports.THIRTY_SECONDS = exports.TEN_SECONDS = exports.FIVE_SECONDS = exports.ONE_SECOND = void 0;
		exports.ONE_SECOND = 1;
		exports.FIVE_SECONDS = 5;
		exports.TEN_SECONDS = 10;
		exports.THIRTY_SECONDS = 30;
		exports.SIXTY_SECONDS = 60;
		exports.ONE_MINUTE = exports.SIXTY_SECONDS;
		exports.FIVE_MINUTES = exports.ONE_MINUTE * 5;
		exports.TEN_MINUTES = exports.ONE_MINUTE * 10;
		exports.THIRTY_MINUTES = exports.ONE_MINUTE * 30;
		exports.SIXTY_MINUTES = exports.ONE_MINUTE * 60;
		exports.ONE_HOUR = exports.SIXTY_MINUTES;
		exports.THREE_HOURS = exports.ONE_HOUR * 3;
		exports.SIX_HOURS = exports.ONE_HOUR * 6;
		exports.TWELVE_HOURS = exports.ONE_HOUR * 12;
		exports.TWENTY_FOUR_HOURS = exports.ONE_HOUR * 24;
		exports.ONE_DAY = exports.TWENTY_FOUR_HOURS;
		exports.THREE_DAYS = exports.ONE_DAY * 3;
		exports.FIVE_DAYS = exports.ONE_DAY * 5;
		exports.SEVEN_DAYS = exports.ONE_DAY * 7;
		exports.THIRTY_DAYS = exports.ONE_DAY * 30;
		exports.ONE_WEEK = exports.SEVEN_DAYS;
		exports.TWO_WEEKS = exports.ONE_WEEK * 2;
		exports.THREE_WEEKS = exports.ONE_WEEK * 3;
		exports.FOUR_WEEKS = exports.ONE_WEEK * 4;
		exports.ONE_YEAR = exports.ONE_DAY * 365;
		
	} (time));
	return time;
}

var hasRequiredConstants;

function requireConstants () {
	if (hasRequiredConstants) return constants;
	hasRequiredConstants = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		const tslib_1 = tslib_es6$1;
		tslib_1.__exportStar(requireMisc(), exports);
		tslib_1.__exportStar(requireTime(), exports);
		
	} (constants));
	return constants;
}

var hasRequiredConvert;

function requireConvert () {
	if (hasRequiredConvert) return convert;
	hasRequiredConvert = 1;
	Object.defineProperty(convert, "__esModule", { value: true });
	convert.fromMiliseconds = convert.toMiliseconds = void 0;
	const constants_1 = requireConstants();
	function toMiliseconds(seconds) {
	    return seconds * constants_1.ONE_THOUSAND;
	}
	convert.toMiliseconds = toMiliseconds;
	function fromMiliseconds(miliseconds) {
	    return Math.floor(miliseconds / constants_1.ONE_THOUSAND);
	}
	convert.fromMiliseconds = fromMiliseconds;
	
	return convert;
}

var hasRequiredUtils;

function requireUtils () {
	if (hasRequiredUtils) return utils;
	hasRequiredUtils = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		const tslib_1 = tslib_es6$1;
		tslib_1.__exportStar(requireDelay(), exports);
		tslib_1.__exportStar(requireConvert(), exports);
		
	} (utils));
	return utils;
}

var watch$2 = {};

var hasRequiredWatch$1;

function requireWatch$1 () {
	if (hasRequiredWatch$1) return watch$2;
	hasRequiredWatch$1 = 1;
	Object.defineProperty(watch$2, "__esModule", { value: true });
	watch$2.Watch = void 0;
	class Watch {
	    constructor() {
	        this.timestamps = new Map();
	    }
	    start(label) {
	        if (this.timestamps.has(label)) {
	            throw new Error(`Watch already started for label: ${label}`);
	        }
	        this.timestamps.set(label, { started: Date.now() });
	    }
	    stop(label) {
	        const timestamp = this.get(label);
	        if (typeof timestamp.elapsed !== "undefined") {
	            throw new Error(`Watch already stopped for label: ${label}`);
	        }
	        const elapsed = Date.now() - timestamp.started;
	        this.timestamps.set(label, { started: timestamp.started, elapsed });
	    }
	    get(label) {
	        const timestamp = this.timestamps.get(label);
	        if (typeof timestamp === "undefined") {
	            throw new Error(`No timestamp found for label: ${label}`);
	        }
	        return timestamp;
	    }
	    elapsed(label) {
	        const timestamp = this.get(label);
	        const elapsed = timestamp.elapsed || Date.now() - timestamp.started;
	        return elapsed;
	    }
	}
	watch$2.Watch = Watch;
	watch$2.default = Watch;
	
	return watch$2;
}

var types = {};

var watch$1 = {};

var hasRequiredWatch;

function requireWatch () {
	if (hasRequiredWatch) return watch$1;
	hasRequiredWatch = 1;
	Object.defineProperty(watch$1, "__esModule", { value: true });
	watch$1.IWatch = void 0;
	class IWatch {
	}
	watch$1.IWatch = IWatch;
	
	return watch$1;
}

var hasRequiredTypes;

function requireTypes () {
	if (hasRequiredTypes) return types;
	hasRequiredTypes = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		const tslib_1 = tslib_es6$1;
		tslib_1.__exportStar(requireWatch(), exports);
		
	} (types));
	return types;
}

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	const tslib_1 = tslib_es6$1;
	tslib_1.__exportStar(requireUtils(), exports);
	tslib_1.__exportStar(requireWatch$1(), exports);
	tslib_1.__exportStar(requireTypes(), exports);
	tslib_1.__exportStar(requireConstants(), exports);
	
} (cjs$3));

var cjs$2 = {};

Object.defineProperty(cjs$2, "__esModule", { value: true });
cjs$2.getLocalStorage = cjs$2.getLocalStorageOrThrow = cjs$2.getCrypto = cjs$2.getCryptoOrThrow = getLocation_1 = cjs$2.getLocation = cjs$2.getLocationOrThrow = getNavigator_1 = cjs$2.getNavigator = cjs$2.getNavigatorOrThrow = getDocument_1 = cjs$2.getDocument = cjs$2.getDocumentOrThrow = cjs$2.getFromWindowOrThrow = cjs$2.getFromWindow = void 0;
function getFromWindow(name) {
    let res = undefined;
    if (typeof window !== "undefined" && typeof window[name] !== "undefined") {
        res = window[name];
    }
    return res;
}
cjs$2.getFromWindow = getFromWindow;
function getFromWindowOrThrow(name) {
    const res = getFromWindow(name);
    if (!res) {
        throw new Error(`${name} is not defined in Window`);
    }
    return res;
}
cjs$2.getFromWindowOrThrow = getFromWindowOrThrow;
function getDocumentOrThrow() {
    return getFromWindowOrThrow("document");
}
cjs$2.getDocumentOrThrow = getDocumentOrThrow;
function getDocument() {
    return getFromWindow("document");
}
var getDocument_1 = cjs$2.getDocument = getDocument;
function getNavigatorOrThrow() {
    return getFromWindowOrThrow("navigator");
}
cjs$2.getNavigatorOrThrow = getNavigatorOrThrow;
function getNavigator() {
    return getFromWindow("navigator");
}
var getNavigator_1 = cjs$2.getNavigator = getNavigator;
function getLocationOrThrow() {
    return getFromWindowOrThrow("location");
}
cjs$2.getLocationOrThrow = getLocationOrThrow;
function getLocation() {
    return getFromWindow("location");
}
var getLocation_1 = cjs$2.getLocation = getLocation;
function getCryptoOrThrow() {
    return getFromWindowOrThrow("crypto");
}
cjs$2.getCryptoOrThrow = getCryptoOrThrow;
function getCrypto() {
    return getFromWindow("crypto");
}
cjs$2.getCrypto = getCrypto;
function getLocalStorageOrThrow() {
    return getFromWindowOrThrow("localStorage");
}
cjs$2.getLocalStorageOrThrow = getLocalStorageOrThrow;
function getLocalStorage() {
    return getFromWindow("localStorage");
}
cjs$2.getLocalStorage = getLocalStorage;

var cjs$1 = {};

Object.defineProperty(cjs$1, "__esModule", { value: true });
var getWindowMetadata_1 = cjs$1.getWindowMetadata = void 0;
const window_getters_1 = cjs$2;
function getWindowMetadata() {
    let doc;
    let loc;
    try {
        doc = window_getters_1.getDocumentOrThrow();
        loc = window_getters_1.getLocationOrThrow();
    }
    catch (e) {
        return null;
    }
    function getIcons() {
        const links = doc.getElementsByTagName("link");
        const icons = [];
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const rel = link.getAttribute("rel");
            if (rel) {
                if (rel.toLowerCase().indexOf("icon") > -1) {
                    const href = link.getAttribute("href");
                    if (href) {
                        if (href.toLowerCase().indexOf("https:") === -1 &&
                            href.toLowerCase().indexOf("http:") === -1 &&
                            href.indexOf("//") !== 0) {
                            let absoluteHref = loc.protocol + "//" + loc.host;
                            if (href.indexOf("/") === 0) {
                                absoluteHref += href;
                            }
                            else {
                                const path = loc.pathname.split("/");
                                path.pop();
                                const finalPath = path.join("/");
                                absoluteHref += finalPath + "/" + href;
                            }
                            icons.push(absoluteHref);
                        }
                        else if (href.indexOf("//") === 0) {
                            const absoluteUrl = loc.protocol + href;
                            icons.push(absoluteUrl);
                        }
                        else {
                            icons.push(href);
                        }
                    }
                }
            }
        }
        return icons;
    }
    function getWindowMetadataOfAny(...args) {
        const metaTags = doc.getElementsByTagName("meta");
        for (let i = 0; i < metaTags.length; i++) {
            const tag = metaTags[i];
            const attributes = ["itemprop", "property", "name"]
                .map((target) => tag.getAttribute(target))
                .filter((attr) => {
                if (attr) {
                    return args.includes(attr);
                }
                return false;
            });
            if (attributes.length && attributes) {
                const content = tag.getAttribute("content");
                if (content) {
                    return content;
                }
            }
        }
        return "";
    }
    function getName() {
        let name = getWindowMetadataOfAny("name", "og:site_name", "og:title", "twitter:title");
        if (!name) {
            name = doc.title;
        }
        return name;
    }
    function getDescription() {
        const description = getWindowMetadataOfAny("description", "og:description", "twitter:description", "keywords");
        return description;
    }
    const name = getName();
    const description = getDescription();
    const url = loc.origin;
    const icons = getIcons();
    const meta = {
        description,
        url,
        icons,
        name,
    };
    return meta;
}
getWindowMetadata_1 = cjs$1.getWindowMetadata = getWindowMetadata;

function isHex(value, { strict = true } = {}) {
    if (!value)
        return false;
    if (typeof value !== 'string')
        return false;
    return strict ? /^0x[0-9a-fA-F]*$/.test(value) : value.startsWith('0x');
}

/**
 * @description Retrieves the size of the value (in bytes).
 *
 * @param value The value (hex or byte array) to retrieve the size of.
 * @returns The size of the value (in bytes).
 */
function size(value) {
    if (isHex(value, { strict: false }))
        return Math.ceil((value.length - 2) / 2);
    return value.length;
}

const version = '2.23.2';

let errorConfig = {
    getDocsUrl: ({ docsBaseUrl, docsPath = '', docsSlug, }) => docsPath
        ? `${docsBaseUrl ?? 'https://viem.sh'}${docsPath}${docsSlug ? `#${docsSlug}` : ''}`
        : undefined,
    version: `viem@${version}`,
};
class BaseError extends Error {
    constructor(shortMessage, args = {}) {
        const details = (() => {
            if (args.cause instanceof BaseError)
                return args.cause.details;
            if (args.cause?.message)
                return args.cause.message;
            return args.details;
        })();
        const docsPath = (() => {
            if (args.cause instanceof BaseError)
                return args.cause.docsPath || args.docsPath;
            return args.docsPath;
        })();
        const docsUrl = errorConfig.getDocsUrl?.({ ...args, docsPath });
        const message = [
            shortMessage || 'An error occurred.',
            '',
            ...(args.metaMessages ? [...args.metaMessages, ''] : []),
            ...(docsUrl ? [`Docs: ${docsUrl}`] : []),
            ...(details ? [`Details: ${details}`] : []),
            ...(errorConfig.version ? [`Version: ${errorConfig.version}`] : []),
        ].join('\n');
        super(message, args.cause ? { cause: args.cause } : undefined);
        Object.defineProperty(this, "details", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "docsPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "metaMessages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "shortMessage", {
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
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'BaseError'
        });
        this.details = details;
        this.docsPath = docsPath;
        this.metaMessages = args.metaMessages;
        this.name = args.name ?? this.name;
        this.shortMessage = shortMessage;
        this.version = version;
    }
    walk(fn) {
        return walk(this, fn);
    }
}
function walk(err, fn) {
    if (fn?.(err))
        return err;
    if (err &&
        typeof err === 'object' &&
        'cause' in err &&
        err.cause !== undefined)
        return walk(err.cause, fn);
    return fn ? null : err;
}

class SizeExceedsPaddingSizeError extends BaseError {
    constructor({ size, targetSize, type, }) {
        super(`${type.charAt(0).toUpperCase()}${type
            .slice(1)
            .toLowerCase()} size (${size}) exceeds padding size (${targetSize}).`, { name: 'SizeExceedsPaddingSizeError' });
    }
}

function pad(hexOrBytes, { dir, size = 32 } = {}) {
    if (typeof hexOrBytes === 'string')
        return padHex(hexOrBytes, { dir, size });
    return padBytes(hexOrBytes, { dir, size });
}
function padHex(hex_, { dir, size = 32 } = {}) {
    if (size === null)
        return hex_;
    const hex = hex_.replace('0x', '');
    if (hex.length > size * 2)
        throw new SizeExceedsPaddingSizeError({
            size: Math.ceil(hex.length / 2),
            targetSize: size,
            type: 'hex',
        });
    return `0x${hex[dir === 'right' ? 'padEnd' : 'padStart'](size * 2, '0')}`;
}
function padBytes(bytes, { dir, size = 32 } = {}) {
    if (size === null)
        return bytes;
    if (bytes.length > size)
        throw new SizeExceedsPaddingSizeError({
            size: bytes.length,
            targetSize: size,
            type: 'bytes',
        });
    const paddedBytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
        const padEnd = dir === 'right';
        paddedBytes[padEnd ? i : size - i - 1] =
            bytes[padEnd ? i : bytes.length - i - 1];
    }
    return paddedBytes;
}

class IntegerOutOfRangeError extends BaseError {
    constructor({ max, min, signed, size, value, }) {
        super(`Number "${value}" is not in safe ${size ? `${size * 8}-bit ${signed ? 'signed' : 'unsigned'} ` : ''}integer range ${max ? `(${min} to ${max})` : `(above ${min})`}`, { name: 'IntegerOutOfRangeError' });
    }
}
class SizeOverflowError extends BaseError {
    constructor({ givenSize, maxSize }) {
        super(`Size cannot exceed ${maxSize} bytes. Given size: ${givenSize} bytes.`, { name: 'SizeOverflowError' });
    }
}

function assertSize(hexOrBytes, { size: size$1 }) {
    if (size(hexOrBytes) > size$1)
        throw new SizeOverflowError({
            givenSize: size(hexOrBytes),
            maxSize: size$1,
        });
}
/**
 * Decodes a hex value into a bigint.
 *
 * - Docs: https://viem.sh/docs/utilities/fromHex#hextobigint
 *
 * @param hex Hex value to decode.
 * @param opts Options.
 * @returns BigInt value.
 *
 * @example
 * import { hexToBigInt } from 'viem'
 * const data = hexToBigInt('0x1a4', { signed: true })
 * // 420n
 *
 * @example
 * import { hexToBigInt } from 'viem'
 * const data = hexToBigInt('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // 420n
 */
function hexToBigInt(hex, opts = {}) {
    const { signed } = opts;
    if (opts.size)
        assertSize(hex, { size: opts.size });
    const value = BigInt(hex);
    if (!signed)
        return value;
    const size = (hex.length - 2) / 2;
    const max = (1n << (BigInt(size) * 8n - 1n)) - 1n;
    if (value <= max)
        return value;
    return value - BigInt(`0x${'f'.padStart(size * 2, 'f')}`) - 1n;
}
/**
 * Decodes a hex string into a number.
 *
 * - Docs: https://viem.sh/docs/utilities/fromHex#hextonumber
 *
 * @param hex Hex value to decode.
 * @param opts Options.
 * @returns Number value.
 *
 * @example
 * import { hexToNumber } from 'viem'
 * const data = hexToNumber('0x1a4')
 * // 420
 *
 * @example
 * import { hexToNumber } from 'viem'
 * const data = hexToBigInt('0x00000000000000000000000000000000000000000000000000000000000001a4', { size: 32 })
 * // 420
 */
function hexToNumber(hex, opts = {}) {
    return Number(hexToBigInt(hex, opts));
}

const hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, '0'));
/**
 * Encodes a string, number, bigint, or ByteArray into a hex string
 *
 * - Docs: https://viem.sh/docs/utilities/toHex
 * - Example: https://viem.sh/docs/utilities/toHex#usage
 *
 * @param value Value to encode.
 * @param opts Options.
 * @returns Hex value.
 *
 * @example
 * import { toHex } from 'viem'
 * const data = toHex('Hello world')
 * // '0x48656c6c6f20776f726c6421'
 *
 * @example
 * import { toHex } from 'viem'
 * const data = toHex(420)
 * // '0x1a4'
 *
 * @example
 * import { toHex } from 'viem'
 * const data = toHex('Hello world', { size: 32 })
 * // '0x48656c6c6f20776f726c64210000000000000000000000000000000000000000'
 */
function toHex(value, opts = {}) {
    if (typeof value === 'number' || typeof value === 'bigint')
        return numberToHex(value, opts);
    if (typeof value === 'string') {
        return stringToHex(value, opts);
    }
    if (typeof value === 'boolean')
        return boolToHex(value, opts);
    return bytesToHex(value, opts);
}
/**
 * Encodes a boolean into a hex string
 *
 * - Docs: https://viem.sh/docs/utilities/toHex#booltohex
 *
 * @param value Value to encode.
 * @param opts Options.
 * @returns Hex value.
 *
 * @example
 * import { boolToHex } from 'viem'
 * const data = boolToHex(true)
 * // '0x1'
 *
 * @example
 * import { boolToHex } from 'viem'
 * const data = boolToHex(false)
 * // '0x0'
 *
 * @example
 * import { boolToHex } from 'viem'
 * const data = boolToHex(true, { size: 32 })
 * // '0x0000000000000000000000000000000000000000000000000000000000000001'
 */
function boolToHex(value, opts = {}) {
    const hex = `0x${Number(value)}`;
    if (typeof opts.size === 'number') {
        assertSize(hex, { size: opts.size });
        return pad(hex, { size: opts.size });
    }
    return hex;
}
/**
 * Encodes a bytes array into a hex string
 *
 * - Docs: https://viem.sh/docs/utilities/toHex#bytestohex
 *
 * @param value Value to encode.
 * @param opts Options.
 * @returns Hex value.
 *
 * @example
 * import { bytesToHex } from 'viem'
 * const data = bytesToHex(Uint8Array.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * // '0x48656c6c6f20576f726c6421'
 *
 * @example
 * import { bytesToHex } from 'viem'
 * const data = bytesToHex(Uint8Array.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]), { size: 32 })
 * // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
 */
function bytesToHex(value, opts = {}) {
    let string = '';
    for (let i = 0; i < value.length; i++) {
        string += hexes[value[i]];
    }
    const hex = `0x${string}`;
    if (typeof opts.size === 'number') {
        assertSize(hex, { size: opts.size });
        return pad(hex, { dir: 'right', size: opts.size });
    }
    return hex;
}
/**
 * Encodes a number or bigint into a hex string
 *
 * - Docs: https://viem.sh/docs/utilities/toHex#numbertohex
 *
 * @param value Value to encode.
 * @param opts Options.
 * @returns Hex value.
 *
 * @example
 * import { numberToHex } from 'viem'
 * const data = numberToHex(420)
 * // '0x1a4'
 *
 * @example
 * import { numberToHex } from 'viem'
 * const data = numberToHex(420, { size: 32 })
 * // '0x00000000000000000000000000000000000000000000000000000000000001a4'
 */
function numberToHex(value_, opts = {}) {
    const { signed, size } = opts;
    const value = BigInt(value_);
    let maxValue;
    if (size) {
        if (signed)
            maxValue = (1n << (BigInt(size) * 8n - 1n)) - 1n;
        else
            maxValue = 2n ** (BigInt(size) * 8n) - 1n;
    }
    else if (typeof value_ === 'number') {
        maxValue = BigInt(Number.MAX_SAFE_INTEGER);
    }
    const minValue = typeof maxValue === 'bigint' && signed ? -maxValue - 1n : 0;
    if ((maxValue && value > maxValue) || value < minValue) {
        const suffix = typeof value_ === 'bigint' ? 'n' : '';
        throw new IntegerOutOfRangeError({
            max: maxValue ? `${maxValue}${suffix}` : undefined,
            min: `${minValue}${suffix}`,
            signed,
            size,
            value: `${value_}${suffix}`,
        });
    }
    const hex = `0x${(signed && value < 0 ? (1n << BigInt(size * 8)) + BigInt(value) : value).toString(16)}`;
    if (size)
        return pad(hex, { size });
    return hex;
}
const encoder$1 = /*#__PURE__*/ new TextEncoder();
/**
 * Encodes a UTF-8 string into a hex string
 *
 * - Docs: https://viem.sh/docs/utilities/toHex#stringtohex
 *
 * @param value Value to encode.
 * @param opts Options.
 * @returns Hex value.
 *
 * @example
 * import { stringToHex } from 'viem'
 * const data = stringToHex('Hello World!')
 * // '0x48656c6c6f20576f726c6421'
 *
 * @example
 * import { stringToHex } from 'viem'
 * const data = stringToHex('Hello World!', { size: 32 })
 * // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
 */
function stringToHex(value_, opts = {}) {
    const value = encoder$1.encode(value_);
    return bytesToHex(value, opts);
}

const encoder = /*#__PURE__*/ new TextEncoder();
/**
 * Encodes a UTF-8 string, hex value, bigint, number or boolean to a byte array.
 *
 * - Docs: https://viem.sh/docs/utilities/toBytes
 * - Example: https://viem.sh/docs/utilities/toBytes#usage
 *
 * @param value Value to encode.
 * @param opts Options.
 * @returns Byte array value.
 *
 * @example
 * import { toBytes } from 'viem'
 * const data = toBytes('Hello world')
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 *
 * @example
 * import { toBytes } from 'viem'
 * const data = toBytes(420)
 * // Uint8Array([1, 164])
 *
 * @example
 * import { toBytes } from 'viem'
 * const data = toBytes(420, { size: 4 })
 * // Uint8Array([0, 0, 1, 164])
 */
function toBytes$1(value, opts = {}) {
    if (typeof value === 'number' || typeof value === 'bigint')
        return numberToBytes(value, opts);
    if (typeof value === 'boolean')
        return boolToBytes(value, opts);
    if (isHex(value))
        return hexToBytes(value, opts);
    return stringToBytes(value, opts);
}
/**
 * Encodes a boolean into a byte array.
 *
 * - Docs: https://viem.sh/docs/utilities/toBytes#booltobytes
 *
 * @param value Boolean value to encode.
 * @param opts Options.
 * @returns Byte array value.
 *
 * @example
 * import { boolToBytes } from 'viem'
 * const data = boolToBytes(true)
 * // Uint8Array([1])
 *
 * @example
 * import { boolToBytes } from 'viem'
 * const data = boolToBytes(true, { size: 32 })
 * // Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
 */
function boolToBytes(value, opts = {}) {
    const bytes = new Uint8Array(1);
    bytes[0] = Number(value);
    if (typeof opts.size === 'number') {
        assertSize(bytes, { size: opts.size });
        return pad(bytes, { size: opts.size });
    }
    return bytes;
}
// We use very optimized technique to convert hex string to byte array
const charCodeMap = {
    zero: 48,
    nine: 57,
    A: 65,
    F: 70,
    a: 97,
    f: 102,
};
function charCodeToBase16(char) {
    if (char >= charCodeMap.zero && char <= charCodeMap.nine)
        return char - charCodeMap.zero;
    if (char >= charCodeMap.A && char <= charCodeMap.F)
        return char - (charCodeMap.A - 10);
    if (char >= charCodeMap.a && char <= charCodeMap.f)
        return char - (charCodeMap.a - 10);
    return undefined;
}
/**
 * Encodes a hex string into a byte array.
 *
 * - Docs: https://viem.sh/docs/utilities/toBytes#hextobytes
 *
 * @param hex Hex string to encode.
 * @param opts Options.
 * @returns Byte array value.
 *
 * @example
 * import { hexToBytes } from 'viem'
 * const data = hexToBytes('0x48656c6c6f20776f726c6421')
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 *
 * @example
 * import { hexToBytes } from 'viem'
 * const data = hexToBytes('0x48656c6c6f20776f726c6421', { size: 32 })
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
 */
function hexToBytes(hex_, opts = {}) {
    let hex = hex_;
    if (opts.size) {
        assertSize(hex, { size: opts.size });
        hex = pad(hex, { dir: 'right', size: opts.size });
    }
    let hexString = hex.slice(2);
    if (hexString.length % 2)
        hexString = `0${hexString}`;
    const length = hexString.length / 2;
    const bytes = new Uint8Array(length);
    for (let index = 0, j = 0; index < length; index++) {
        const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
        const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
        if (nibbleLeft === undefined || nibbleRight === undefined) {
            throw new BaseError(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
        }
        bytes[index] = nibbleLeft * 16 + nibbleRight;
    }
    return bytes;
}
/**
 * Encodes a number into a byte array.
 *
 * - Docs: https://viem.sh/docs/utilities/toBytes#numbertobytes
 *
 * @param value Number to encode.
 * @param opts Options.
 * @returns Byte array value.
 *
 * @example
 * import { numberToBytes } from 'viem'
 * const data = numberToBytes(420)
 * // Uint8Array([1, 164])
 *
 * @example
 * import { numberToBytes } from 'viem'
 * const data = numberToBytes(420, { size: 4 })
 * // Uint8Array([0, 0, 1, 164])
 */
function numberToBytes(value, opts) {
    const hex = numberToHex(value, opts);
    return hexToBytes(hex);
}
/**
 * Encodes a UTF-8 string into a byte array.
 *
 * - Docs: https://viem.sh/docs/utilities/toBytes#stringtobytes
 *
 * @param value String to encode.
 * @param opts Options.
 * @returns Byte array value.
 *
 * @example
 * import { stringToBytes } from 'viem'
 * const data = stringToBytes('Hello world!')
 * // Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33])
 *
 * @example
 * import { stringToBytes } from 'viem'
 * const data = stringToBytes('Hello world!', { size: 32 })
 * // Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
 */
function stringToBytes(value, opts = {}) {
    const bytes = encoder.encode(value);
    if (typeof opts.size === 'number') {
        assertSize(bytes, { size: opts.size });
        return pad(bytes, { dir: 'right', size: opts.size });
    }
    return bytes;
}

/**
 * Internal assertion helpers.
 * @module
 */
/** Asserts something is positive integer. */
function anumber(n) {
    if (!Number.isSafeInteger(n) || n < 0)
        throw new Error('positive integer expected, got ' + n);
}
/** Is number an Uint8Array? Copied from utils for perf. */
function isBytes(a) {
    return a instanceof Uint8Array || (ArrayBuffer.isView(a) && a.constructor.name === 'Uint8Array');
}
/** Asserts something is Uint8Array. */
function abytes(b, ...lengths) {
    if (!isBytes(b))
        throw new Error('Uint8Array expected');
    if (lengths.length > 0 && !lengths.includes(b.length))
        throw new Error('Uint8Array expected of length ' + lengths + ', got length=' + b.length);
}
/** Asserts something is hash */
function ahash(h) {
    if (typeof h !== 'function' || typeof h.create !== 'function')
        throw new Error('Hash should be wrapped by utils.wrapConstructor');
    anumber(h.outputLen);
    anumber(h.blockLen);
}
/** Asserts a hash instance has not been destroyed / finished */
function aexists(instance, checkFinished = true) {
    if (instance.destroyed)
        throw new Error('Hash instance has been destroyed');
    if (checkFinished && instance.finished)
        throw new Error('Hash#digest() has already been called');
}
/** Asserts output is properly-sized byte array */
function aoutput(out, instance) {
    abytes(out);
    const min = instance.outputLen;
    if (out.length < min) {
        throw new Error('digestInto() expects output buffer of length at least ' + min);
    }
}

/**
 * Internal helpers for u64. BigUint64Array is too slow as per 2025, so we implement it using Uint32Array.
 * @todo re-check https://issues.chromium.org/issues/42212588
 * @module
 */
const U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
const _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
    if (le)
        return { h: Number(n & U32_MASK64), l: Number((n >> _32n) & U32_MASK64) };
    return { h: Number((n >> _32n) & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
    let Ah = new Uint32Array(lst.length);
    let Al = new Uint32Array(lst.length);
    for (let i = 0; i < lst.length; i++) {
        const { h, l } = fromBig(lst[i], le);
        [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
}
// Left rotate for Shift in [1, 32)
const rotlSH = (h, l, s) => (h << s) | (l >>> (32 - s));
const rotlSL = (h, l, s) => (l << s) | (h >>> (32 - s));
// Left rotate for Shift in (32, 64), NOTE: 32 is special case.
const rotlBH = (h, l, s) => (l << (s - 32)) | (h >>> (64 - s));
const rotlBL = (h, l, s) => (h << (s - 32)) | (l >>> (64 - s));

const crypto$2 = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;

/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
const isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("utf8ToBytes expected string, got " + typeof str);
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
class Hash {
  // Safe version that clones internal state
  clone() {
    return this._cloneInto();
  }
}
function wrapConstructor(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
function randomBytes(bytesLength = 32) {
  if (crypto$2 && typeof crypto$2.getRandomValues === "function") {
    return crypto$2.getRandomValues(new Uint8Array(bytesLength));
  }
  if (crypto$2 && typeof crypto$2.randomBytes === "function") {
    return crypto$2.randomBytes(bytesLength);
  }
  throw new Error("crypto.getRandomValues must be defined");
}

/**
 * SHA3 (keccak) hash function, based on a new "Sponge function" design.
 * Different from older hashes, the internal state is bigger than output size.
 *
 * Check out [FIPS-202](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf),
 * [Website](https://keccak.team/keccak.html),
 * [the differences between SHA-3 and Keccak](https://crypto.stackexchange.com/questions/15727/what-are-the-key-differences-between-the-draft-sha-3-standard-and-the-keccak-sub).
 *
 * Check out `sha3-addons` module for cSHAKE, k12, and others.
 * @module
 */
// Various per round constants calculations
const SHA3_PI = [];
const SHA3_ROTL = [];
const _SHA3_IOTA = [];
const _0n = /* @__PURE__ */ BigInt(0);
const _1n = /* @__PURE__ */ BigInt(1);
const _2n = /* @__PURE__ */ BigInt(2);
const _7n = /* @__PURE__ */ BigInt(7);
const _256n = /* @__PURE__ */ BigInt(256);
const _0x71n = /* @__PURE__ */ BigInt(0x71);
for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
    // Pi
    [x, y] = [y, (2 * x + 3 * y) % 5];
    SHA3_PI.push(2 * (5 * y + x));
    // Rotational
    SHA3_ROTL.push((((round + 1) * (round + 2)) / 2) % 64);
    // Iota
    let t = _0n;
    for (let j = 0; j < 7; j++) {
        R = ((R << _1n) ^ ((R >> _7n) * _0x71n)) % _256n;
        if (R & _2n)
            t ^= _1n << ((_1n << /* @__PURE__ */ BigInt(j)) - _1n);
    }
    _SHA3_IOTA.push(t);
}
const [SHA3_IOTA_H, SHA3_IOTA_L] = /* @__PURE__ */ split(_SHA3_IOTA, true);
// Left rotation (without 0, 32, 64)
const rotlH = (h, l, s) => (s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s));
const rotlL = (h, l, s) => (s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s));
/** `keccakf1600` internal function, additionally allows to adjust round count. */
function keccakP(s, rounds = 24) {
    const B = new Uint32Array(5 * 2);
    // NOTE: all indices are x2 since we store state as u32 instead of u64 (bigints to slow in js)
    for (let round = 24 - rounds; round < 24; round++) {
        // Theta θ
        for (let x = 0; x < 10; x++)
            B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
        for (let x = 0; x < 10; x += 2) {
            const idx1 = (x + 8) % 10;
            const idx0 = (x + 2) % 10;
            const B0 = B[idx0];
            const B1 = B[idx0 + 1];
            const Th = rotlH(B0, B1, 1) ^ B[idx1];
            const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
            for (let y = 0; y < 50; y += 10) {
                s[x + y] ^= Th;
                s[x + y + 1] ^= Tl;
            }
        }
        // Rho (ρ) and Pi (π)
        let curH = s[2];
        let curL = s[3];
        for (let t = 0; t < 24; t++) {
            const shift = SHA3_ROTL[t];
            const Th = rotlH(curH, curL, shift);
            const Tl = rotlL(curH, curL, shift);
            const PI = SHA3_PI[t];
            curH = s[PI];
            curL = s[PI + 1];
            s[PI] = Th;
            s[PI + 1] = Tl;
        }
        // Chi (χ)
        for (let y = 0; y < 50; y += 10) {
            for (let x = 0; x < 10; x++)
                B[x] = s[y + x];
            for (let x = 0; x < 10; x++)
                s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
        }
        // Iota (ι)
        s[0] ^= SHA3_IOTA_H[round];
        s[1] ^= SHA3_IOTA_L[round];
    }
    B.fill(0);
}
/** Keccak sponge function. */
class Keccak extends Hash {
    // NOTE: we accept arguments in bytes instead of bits here.
    constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
        super();
        this.blockLen = blockLen;
        this.suffix = suffix;
        this.outputLen = outputLen;
        this.enableXOF = enableXOF;
        this.rounds = rounds;
        this.pos = 0;
        this.posOut = 0;
        this.finished = false;
        this.destroyed = false;
        // Can be passed from user as dkLen
        anumber(outputLen);
        // 1600 = 5x5 matrix of 64bit.  1600 bits === 200 bytes
        // 0 < blockLen < 200
        if (0 >= this.blockLen || this.blockLen >= 200)
            throw new Error('Sha3 supports only keccak-f1600 function');
        this.state = new Uint8Array(200);
        this.state32 = u32(this.state);
    }
    keccak() {
        if (!isLE)
            byteSwap32(this.state32);
        keccakP(this.state32, this.rounds);
        if (!isLE)
            byteSwap32(this.state32);
        this.posOut = 0;
        this.pos = 0;
    }
    update(data) {
        aexists(this);
        const { blockLen, state } = this;
        data = toBytes(data);
        const len = data.length;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            for (let i = 0; i < take; i++)
                state[this.pos++] ^= data[pos++];
            if (this.pos === blockLen)
                this.keccak();
        }
        return this;
    }
    finish() {
        if (this.finished)
            return;
        this.finished = true;
        const { state, suffix, pos, blockLen } = this;
        // Do the padding
        state[pos] ^= suffix;
        if ((suffix & 0x80) !== 0 && pos === blockLen - 1)
            this.keccak();
        state[blockLen - 1] ^= 0x80;
        this.keccak();
    }
    writeInto(out) {
        aexists(this, false);
        abytes(out);
        this.finish();
        const bufferOut = this.state;
        const { blockLen } = this;
        for (let pos = 0, len = out.length; pos < len;) {
            if (this.posOut >= blockLen)
                this.keccak();
            const take = Math.min(blockLen - this.posOut, len - pos);
            out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
            this.posOut += take;
            pos += take;
        }
        return out;
    }
    xofInto(out) {
        // Sha3/Keccak usage with XOF is probably mistake, only SHAKE instances can do XOF
        if (!this.enableXOF)
            throw new Error('XOF is not possible for this instance');
        return this.writeInto(out);
    }
    xof(bytes) {
        anumber(bytes);
        return this.xofInto(new Uint8Array(bytes));
    }
    digestInto(out) {
        aoutput(out, this);
        if (this.finished)
            throw new Error('digest() was already called');
        this.writeInto(out);
        this.destroy();
        return out;
    }
    digest() {
        return this.digestInto(new Uint8Array(this.outputLen));
    }
    destroy() {
        this.destroyed = true;
        this.state.fill(0);
    }
    _cloneInto(to) {
        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
        to || (to = new Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        // Suffix can change in cSHAKE
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        to.destroyed = this.destroyed;
        return to;
    }
}
const gen = (suffix, blockLen, outputLen) => wrapConstructor(() => new Keccak(blockLen, suffix, outputLen));
/** keccak-256 hash function. Different from SHA3-256. */
const keccak_256 = /* @__PURE__ */ gen(0x01, 136, 256 / 8);

function keccak256(value, to_) {
    const to = to_ || 'hex';
    const bytes = keccak_256(isHex(value, { strict: false }) ? toBytes$1(value) : value);
    if (to === 'bytes')
        return bytes;
    return toHex(bytes);
}

/**
 * Map with a LRU (Least recently used) policy.
 *
 * @link https://en.wikipedia.org/wiki/Cache_replacement_policies#LRU
 */
class LruMap extends Map {
    constructor(size) {
        super();
        Object.defineProperty(this, "maxSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.maxSize = size;
    }
    get(key) {
        const value = super.get(key);
        if (super.has(key) && value !== undefined) {
            this.delete(key);
            super.set(key, value);
        }
        return value;
    }
    set(key, value) {
        super.set(key, value);
        if (this.maxSize && this.size > this.maxSize) {
            const firstKey = this.keys().next().value;
            if (firstKey)
                this.delete(firstKey);
        }
        return this;
    }
}

const checksumAddressCache = /*#__PURE__*/ new LruMap(8192);
function checksumAddress(address_, 
/**
 * Warning: EIP-1191 checksum addresses are generally not backwards compatible with the
 * wider Ethereum ecosystem, meaning it will break when validated against an application/tool
 * that relies on EIP-55 checksum encoding (checksum without chainId).
 *
 * It is highly recommended to not use this feature unless you
 * know what you are doing.
 *
 * See more: https://github.com/ethereum/EIPs/issues/1121
 */
chainId) {
    if (checksumAddressCache.has(`${address_}.${chainId}`))
        return checksumAddressCache.get(`${address_}.${chainId}`);
    const hexAddress = address_.substring(2).toLowerCase();
    const hash = keccak256(stringToBytes(hexAddress), 'bytes');
    const address = (hexAddress).split('');
    for (let i = 0; i < 40; i += 2) {
        if (hash[i >> 1] >> 4 >= 8 && address[i]) {
            address[i] = address[i].toUpperCase();
        }
        if ((hash[i >> 1] & 0x0f) >= 8 && address[i + 1]) {
            address[i + 1] = address[i + 1].toUpperCase();
        }
    }
    const result = `0x${address.join('')}`;
    checksumAddressCache.set(`${address_}.${chainId}`, result);
    return result;
}

/**
 * @description Converts an ECDSA public key to an address.
 *
 * @param publicKey The public key to convert.
 *
 * @returns The address.
 */
function publicKeyToAddress(publicKey) {
    const address = keccak256(`0x${publicKey.substring(4)}`).substring(26);
    return checksumAddress(`0x${address}`);
}

async function recoverPublicKey({ hash, signature, }) {
    const hashHex = isHex(hash) ? hash : toHex(hash);
    const { secp256k1 } = await __vitePreload(async () => { const { secp256k1 } = await import('./secp256k1-Bf0WsDG8.js');return { secp256k1 }},true?__vite__mapDeps([0,1,2,3]):void 0);
    const signature_ = (() => {
        // typeof signature: `Signature`
        if (typeof signature === 'object' && 'r' in signature && 's' in signature) {
            const { r, s, v, yParity } = signature;
            const yParityOrV = Number(yParity ?? v);
            const recoveryBit = toRecoveryBit(yParityOrV);
            return new secp256k1.Signature(hexToBigInt(r), hexToBigInt(s)).addRecoveryBit(recoveryBit);
        }
        // typeof signature: `Hex | ByteArray`
        const signatureHex = isHex(signature) ? signature : toHex(signature);
        const yParityOrV = hexToNumber(`0x${signatureHex.slice(130)}`);
        const recoveryBit = toRecoveryBit(yParityOrV);
        return secp256k1.Signature.fromCompact(signatureHex.substring(2, 130)).addRecoveryBit(recoveryBit);
    })();
    const publicKey = signature_
        .recoverPublicKey(hashHex.substring(2))
        .toHex(false);
    return `0x${publicKey}`;
}
function toRecoveryBit(yParityOrV) {
    if (yParityOrV === 0 || yParityOrV === 1)
        return yParityOrV;
    if (yParityOrV === 27)
        return 0;
    if (yParityOrV === 28)
        return 1;
    throw new Error('Invalid yParityOrV value');
}

async function recoverAddress({ hash, signature, }) {
    return publicKeyToAddress(await recoverPublicKey({ hash: hash, signature }));
}

// base-x encoding / decoding
// Copyright (c) 2018 base-x contributors
// Copyright (c) 2014-2018 The Bitcoin Core developers (base58.cpp)
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
function base$1 (ALPHABET) {
  if (ALPHABET.length >= 255) { throw new TypeError('Alphabet too long') }
  const BASE_MAP = new Uint8Array(256);
  for (let j = 0; j < BASE_MAP.length; j++) {
    BASE_MAP[j] = 255;
  }
  for (let i = 0; i < ALPHABET.length; i++) {
    const x = ALPHABET.charAt(i);
    const xc = x.charCodeAt(0);
    if (BASE_MAP[xc] !== 255) { throw new TypeError(x + ' is ambiguous') }
    BASE_MAP[xc] = i;
  }
  const BASE = ALPHABET.length;
  const LEADER = ALPHABET.charAt(0);
  const FACTOR = Math.log(BASE) / Math.log(256); // log(BASE) / log(256), rounded up
  const iFACTOR = Math.log(256) / Math.log(BASE); // log(256) / log(BASE), rounded up
  function encode (source) {
    // eslint-disable-next-line no-empty
    if (source instanceof Uint8Array) ; else if (ArrayBuffer.isView(source)) {
      source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
    } else if (Array.isArray(source)) {
      source = Uint8Array.from(source);
    }
    if (!(source instanceof Uint8Array)) { throw new TypeError('Expected Uint8Array') }
    if (source.length === 0) { return '' }
    // Skip & count leading zeroes.
    let zeroes = 0;
    let length = 0;
    let pbegin = 0;
    const pend = source.length;
    while (pbegin !== pend && source[pbegin] === 0) {
      pbegin++;
      zeroes++;
    }
    // Allocate enough space in big-endian base58 representation.
    const size = ((pend - pbegin) * iFACTOR + 1) >>> 0;
    const b58 = new Uint8Array(size);
    // Process the bytes.
    while (pbegin !== pend) {
      let carry = source[pbegin];
      // Apply "b58 = b58 * 256 + ch".
      let i = 0;
      for (let it1 = size - 1; (carry !== 0 || i < length) && (it1 !== -1); it1--, i++) {
        carry += (256 * b58[it1]) >>> 0;
        b58[it1] = (carry % BASE) >>> 0;
        carry = (carry / BASE) >>> 0;
      }
      if (carry !== 0) { throw new Error('Non-zero carry') }
      length = i;
      pbegin++;
    }
    // Skip leading zeroes in base58 result.
    let it2 = size - length;
    while (it2 !== size && b58[it2] === 0) {
      it2++;
    }
    // Translate the result into a string.
    let str = LEADER.repeat(zeroes);
    for (; it2 < size; ++it2) { str += ALPHABET.charAt(b58[it2]); }
    return str
  }
  function decodeUnsafe (source) {
    if (typeof source !== 'string') { throw new TypeError('Expected String') }
    if (source.length === 0) { return new Uint8Array() }
    let psz = 0;
    // Skip and count leading '1's.
    let zeroes = 0;
    let length = 0;
    while (source[psz] === LEADER) {
      zeroes++;
      psz++;
    }
    // Allocate enough space in big-endian base256 representation.
    const size = (((source.length - psz) * FACTOR) + 1) >>> 0; // log(58) / log(256), rounded up.
    const b256 = new Uint8Array(size);
    // Process the characters.
    while (psz < source.length) {
      // Find code of next character
      const charCode = source.charCodeAt(psz);
      // Base map can not be indexed using char code
      if (charCode > 255) { return }
      // Decode character
      let carry = BASE_MAP[charCode];
      // Invalid character
      if (carry === 255) { return }
      let i = 0;
      for (let it3 = size - 1; (carry !== 0 || i < length) && (it3 !== -1); it3--, i++) {
        carry += (BASE * b256[it3]) >>> 0;
        b256[it3] = (carry % 256) >>> 0;
        carry = (carry / 256) >>> 0;
      }
      if (carry !== 0) { throw new Error('Non-zero carry') }
      length = i;
      psz++;
    }
    // Skip leading zeroes in b256.
    let it4 = size - length;
    while (it4 !== size && b256[it4] === 0) {
      it4++;
    }
    const vch = new Uint8Array(zeroes + (size - it4));
    let j = zeroes;
    while (it4 !== size) {
      vch[j++] = b256[it4++];
    }
    return vch
  }
  function decode (string) {
    const buffer = decodeUnsafe(string);
    if (buffer) { return buffer }
    throw new Error('Non-base' + BASE + ' character')
  }
  return {
    encode,
    decodeUnsafe,
    decode
  }
}

var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const Vo$2 = base$1(ALPHABET);

const JSONStringify = data => JSON.stringify(data, (_, value) => typeof value === "bigint" ? value.toString() + "n" : value);
const JSONParse = json => {
    const numbersBiggerThanMaxInt = /([\[:])?(\d{17,}|(?:[9](?:[1-9]07199254740991|0[1-9]7199254740991|00[8-9]199254740991|007[2-9]99254740991|007199[3-9]54740991|0071992[6-9]4740991|00719925[5-9]740991|007199254[8-9]40991|0071992547[5-9]0991|00719925474[1-9]991|00719925474099[2-9])))([,\}\]])/g;
    const serializedData = json.replace(numbersBiggerThanMaxInt, "$1\"$2n\"$3");
    return JSON.parse(serializedData, (_, value) => {
        const isCustomFormatBigInt = typeof value === "string" && value.match(/^\d+n$/);
        if (isCustomFormatBigInt)
            return BigInt(value.substring(0, value.length - 1));
        return value;
    });
};
function safeJsonParse(value) {
    if (typeof value !== "string") {
        throw new Error(`Cannot safe json parse value of type ${typeof value}`);
    }
    try {
        return JSONParse(value);
    }
    catch (_a) {
        return value;
    }
}
function safeJsonStringify(value) {
    return typeof value === "string" ? value : JSONStringify(value) || "";
}

function En$2(t) {
  return t instanceof Uint8Array || ArrayBuffer.isView(t) && t.constructor.name === "Uint8Array";
}
function fe$1(t, ...e) {
  if (!En$2(t)) throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(t.length)) throw new Error("Uint8Array expected of length " + e + ", got length=" + t.length);
}
function De$3(t, e = true) {
  if (t.destroyed) throw new Error("Hash instance has been destroyed");
  if (e && t.finished) throw new Error("Hash#digest() has already been called");
}
function gn$2(t, e) {
  fe$1(t);
  const n = e.outputLen;
  if (t.length < n) throw new Error("digestInto() expects output buffer of length at least " + n);
}
const it$2 = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const _t$3 = (t) => new DataView(t.buffer, t.byteOffset, t.byteLength);
function yn$2(t) {
  if (typeof t != "string") throw new Error("utf8ToBytes expected string, got " + typeof t);
  return new Uint8Array(new TextEncoder().encode(t));
}
function de$3(t) {
  return typeof t == "string" && (t = yn$2(t)), fe$1(t), t;
}
let xn$1 = class xn {
  clone() {
    return this._cloneInto();
  }
};
function Bn$1(t) {
  const e = (r) => t().update(de$3(r)).digest(), n = t();
  return e.outputLen = n.outputLen, e.blockLen = n.blockLen, e.create = () => t(), e;
}
function he$3(t = 32) {
  if (it$2 && typeof it$2.getRandomValues == "function") return it$2.getRandomValues(new Uint8Array(t));
  if (it$2 && typeof it$2.randomBytes == "function") return it$2.randomBytes(t);
  throw new Error("crypto.getRandomValues must be defined");
}
function Cn$2(t, e, n, r) {
  if (typeof t.setBigUint64 == "function") return t.setBigUint64(e, n, r);
  const o = BigInt(32), s = BigInt(4294967295), a = Number(n >> o & s), u = Number(n & s), i = r ? 4 : 0, D = r ? 0 : 4;
  t.setUint32(e + i, a, r), t.setUint32(e + D, u, r);
}
let An$1 = class An extends xn$1 {
  constructor(e, n, r, o) {
    super(), this.blockLen = e, this.outputLen = n, this.padOffset = r, this.isLE = o, this.finished = false, this.length = 0, this.pos = 0, this.destroyed = false, this.buffer = new Uint8Array(e), this.view = _t$3(this.buffer);
  }
  update(e) {
    De$3(this);
    const { view: n, buffer: r, blockLen: o } = this;
    e = de$3(e);
    const s = e.length;
    for (let a = 0; a < s; ) {
      const u = Math.min(o - this.pos, s - a);
      if (u === o) {
        const i = _t$3(e);
        for (; o <= s - a; a += o) this.process(i, a);
        continue;
      }
      r.set(e.subarray(a, a + u), this.pos), this.pos += u, a += u, this.pos === o && (this.process(n, 0), this.pos = 0);
    }
    return this.length += e.length, this.roundClean(), this;
  }
  digestInto(e) {
    De$3(this), gn$2(e, this), this.finished = true;
    const { buffer: n, view: r, blockLen: o, isLE: s } = this;
    let { pos: a } = this;
    n[a++] = 128, this.buffer.subarray(a).fill(0), this.padOffset > o - a && (this.process(r, 0), a = 0);
    for (let l = a; l < o; l++) n[l] = 0;
    Cn$2(r, o - 8, BigInt(this.length * 8), s), this.process(r, 0);
    const u = _t$3(e), i = this.outputLen;
    if (i % 4) throw new Error("_sha2: outputLen should be aligned to 32bit");
    const D = i / 4, c = this.get();
    if (D > c.length) throw new Error("_sha2: outputLen bigger than state");
    for (let l = 0; l < D; l++) u.setUint32(4 * l, c[l], s);
  }
  digest() {
    const { buffer: e, outputLen: n } = this;
    this.digestInto(e);
    const r = e.slice(0, n);
    return this.destroy(), r;
  }
  _cloneInto(e) {
    e || (e = new this.constructor()), e.set(...this.get());
    const { blockLen: n, buffer: r, length: o, finished: s, destroyed: a, pos: u } = this;
    return e.length = o, e.pos = u, e.finished = s, e.destroyed = a, o % n && e.buffer.set(r), e;
  }
};
const wt$3 = BigInt(2 ** 32 - 1), St$4 = BigInt(32);
function le$3(t, e = false) {
  return e ? { h: Number(t & wt$3), l: Number(t >> St$4 & wt$3) } : { h: Number(t >> St$4 & wt$3) | 0, l: Number(t & wt$3) | 0 };
}
function mn$2(t, e = false) {
  let n = new Uint32Array(t.length), r = new Uint32Array(t.length);
  for (let o = 0; o < t.length; o++) {
    const { h: s, l: a } = le$3(t[o], e);
    [n[o], r[o]] = [s, a];
  }
  return [n, r];
}
const _n$2 = (t, e) => BigInt(t >>> 0) << St$4 | BigInt(e >>> 0), Sn$1 = (t, e, n) => t >>> n, vn$1 = (t, e, n) => t << 32 - n | e >>> n, In$1 = (t, e, n) => t >>> n | e << 32 - n, Un$1 = (t, e, n) => t << 32 - n | e >>> n, Tn$2 = (t, e, n) => t << 64 - n | e >>> n - 32, Fn$2 = (t, e, n) => t >>> n - 32 | e << 64 - n, Nn$1 = (t, e) => e, Ln$1 = (t, e) => t, On$1 = (t, e, n) => t << n | e >>> 32 - n, Hn$1 = (t, e, n) => e << n | t >>> 32 - n, zn$2 = (t, e, n) => e << n - 32 | t >>> 64 - n, Mn$2 = (t, e, n) => t << n - 32 | e >>> 64 - n;
function qn$1(t, e, n, r) {
  const o = (e >>> 0) + (r >>> 0);
  return { h: t + n + (o / 2 ** 32 | 0) | 0, l: o | 0 };
}
const $n$2 = (t, e, n) => (t >>> 0) + (e >>> 0) + (n >>> 0), kn$2 = (t, e, n, r) => e + n + r + (t / 2 ** 32 | 0) | 0, Rn$2 = (t, e, n, r) => (t >>> 0) + (e >>> 0) + (n >>> 0) + (r >>> 0), jn$2 = (t, e, n, r, o) => e + n + r + o + (t / 2 ** 32 | 0) | 0, Zn$2 = (t, e, n, r, o) => (t >>> 0) + (e >>> 0) + (n >>> 0) + (r >>> 0) + (o >>> 0), Gn$2 = (t, e, n, r, o, s) => e + n + r + o + s + (t / 2 ** 32 | 0) | 0, x$3 = { fromBig: le$3, split: mn$2, toBig: _n$2, shrSH: Sn$1, shrSL: vn$1, rotrSH: In$1, rotrSL: Un$1, rotrBH: Tn$2, rotrBL: Fn$2, rotr32H: Nn$1, rotr32L: Ln$1, rotlSH: On$1, rotlSL: Hn$1, rotlBH: zn$2, rotlBL: Mn$2, add: qn$1, add3L: $n$2, add3H: kn$2, add4L: Rn$2, add4H: jn$2, add5H: Gn$2, add5L: Zn$2 }, [Vn$2, Yn$2] = (() => x$3.split(["0x428a2f98d728ae22", "0x7137449123ef65cd", "0xb5c0fbcfec4d3b2f", "0xe9b5dba58189dbbc", "0x3956c25bf348b538", "0x59f111f1b605d019", "0x923f82a4af194f9b", "0xab1c5ed5da6d8118", "0xd807aa98a3030242", "0x12835b0145706fbe", "0x243185be4ee4b28c", "0x550c7dc3d5ffb4e2", "0x72be5d74f27b896f", "0x80deb1fe3b1696b1", "0x9bdc06a725c71235", "0xc19bf174cf692694", "0xe49b69c19ef14ad2", "0xefbe4786384f25e3", "0x0fc19dc68b8cd5b5", "0x240ca1cc77ac9c65", "0x2de92c6f592b0275", "0x4a7484aa6ea6e483", "0x5cb0a9dcbd41fbd4", "0x76f988da831153b5", "0x983e5152ee66dfab", "0xa831c66d2db43210", "0xb00327c898fb213f", "0xbf597fc7beef0ee4", "0xc6e00bf33da88fc2", "0xd5a79147930aa725", "0x06ca6351e003826f", "0x142929670a0e6e70", "0x27b70a8546d22ffc", "0x2e1b21385c26c926", "0x4d2c6dfc5ac42aed", "0x53380d139d95b3df", "0x650a73548baf63de", "0x766a0abb3c77b2a8", "0x81c2c92e47edaee6", "0x92722c851482353b", "0xa2bfe8a14cf10364", "0xa81a664bbc423001", "0xc24b8b70d0f89791", "0xc76c51a30654be30", "0xd192e819d6ef5218", "0xd69906245565a910", "0xf40e35855771202a", "0x106aa07032bbd1b8", "0x19a4c116b8d2d0c8", "0x1e376c085141ab53", "0x2748774cdf8eeb99", "0x34b0bcb5e19b48a8", "0x391c0cb3c5c95a63", "0x4ed8aa4ae3418acb", "0x5b9cca4f7763e373", "0x682e6ff3d6b2b8a3", "0x748f82ee5defb2fc", "0x78a5636f43172f60", "0x84c87814a1f0ab72", "0x8cc702081a6439ec", "0x90befffa23631e28", "0xa4506cebde82bde9", "0xbef9a3f7b2c67915", "0xc67178f2e372532b", "0xca273eceea26619c", "0xd186b8c721c0c207", "0xeada7dd6cde0eb1e", "0xf57d4f7fee6ed178", "0x06f067aa72176fba", "0x0a637dc5a2c898a6", "0x113f9804bef90dae", "0x1b710b35131c471b", "0x28db77f523047d84", "0x32caab7b40c72493", "0x3c9ebe0a15c9bebc", "0x431d67c49c100d4c", "0x4cc5d4becb3e42b6", "0x597f299cfc657e2a", "0x5fcb6fab3ad6faec", "0x6c44198c4a475817"].map((t) => BigInt(t))))(), P$4 = new Uint32Array(80), Q$3 = new Uint32Array(80);
let Jn$2 = class Jn extends An$1 {
  constructor() {
    super(128, 64, 16, false), this.Ah = 1779033703, this.Al = -205731576, this.Bh = -1150833019, this.Bl = -2067093701, this.Ch = 1013904242, this.Cl = -23791573, this.Dh = -1521486534, this.Dl = 1595750129, this.Eh = 1359893119, this.El = -1377402159, this.Fh = -1694144372, this.Fl = 725511199, this.Gh = 528734635, this.Gl = -79577749, this.Hh = 1541459225, this.Hl = 327033209;
  }
  get() {
    const { Ah: e, Al: n, Bh: r, Bl: o, Ch: s, Cl: a, Dh: u, Dl: i, Eh: D, El: c, Fh: l, Fl: p, Gh: w, Gl: h, Hh: g, Hl: S } = this;
    return [e, n, r, o, s, a, u, i, D, c, l, p, w, h, g, S];
  }
  set(e, n, r, o, s, a, u, i, D, c, l, p, w, h, g, S) {
    this.Ah = e | 0, this.Al = n | 0, this.Bh = r | 0, this.Bl = o | 0, this.Ch = s | 0, this.Cl = a | 0, this.Dh = u | 0, this.Dl = i | 0, this.Eh = D | 0, this.El = c | 0, this.Fh = l | 0, this.Fl = p | 0, this.Gh = w | 0, this.Gl = h | 0, this.Hh = g | 0, this.Hl = S | 0;
  }
  process(e, n) {
    for (let d = 0; d < 16; d++, n += 4) P$4[d] = e.getUint32(n), Q$3[d] = e.getUint32(n += 4);
    for (let d = 16; d < 80; d++) {
      const m = P$4[d - 15] | 0, F = Q$3[d - 15] | 0, q = x$3.rotrSH(m, F, 1) ^ x$3.rotrSH(m, F, 8) ^ x$3.shrSH(m, F, 7), z = x$3.rotrSL(m, F, 1) ^ x$3.rotrSL(m, F, 8) ^ x$3.shrSL(m, F, 7), I = P$4[d - 2] | 0, O = Q$3[d - 2] | 0, ot = x$3.rotrSH(I, O, 19) ^ x$3.rotrBH(I, O, 61) ^ x$3.shrSH(I, O, 6), tt = x$3.rotrSL(I, O, 19) ^ x$3.rotrBL(I, O, 61) ^ x$3.shrSL(I, O, 6), st = x$3.add4L(z, tt, Q$3[d - 7], Q$3[d - 16]), at = x$3.add4H(st, q, ot, P$4[d - 7], P$4[d - 16]);
      P$4[d] = at | 0, Q$3[d] = st | 0;
    }
    let { Ah: r, Al: o, Bh: s, Bl: a, Ch: u, Cl: i, Dh: D, Dl: c, Eh: l, El: p, Fh: w, Fl: h, Gh: g, Gl: S, Hh: v, Hl: L } = this;
    for (let d = 0; d < 80; d++) {
      const m = x$3.rotrSH(l, p, 14) ^ x$3.rotrSH(l, p, 18) ^ x$3.rotrBH(l, p, 41), F = x$3.rotrSL(l, p, 14) ^ x$3.rotrSL(l, p, 18) ^ x$3.rotrBL(l, p, 41), q = l & w ^ ~l & g, z = p & h ^ ~p & S, I = x$3.add5L(L, F, z, Yn$2[d], Q$3[d]), O = x$3.add5H(I, v, m, q, Vn$2[d], P$4[d]), ot = I | 0, tt = x$3.rotrSH(r, o, 28) ^ x$3.rotrBH(r, o, 34) ^ x$3.rotrBH(r, o, 39), st = x$3.rotrSL(r, o, 28) ^ x$3.rotrBL(r, o, 34) ^ x$3.rotrBL(r, o, 39), at = r & s ^ r & u ^ s & u, Ct = o & a ^ o & i ^ a & i;
      v = g | 0, L = S | 0, g = w | 0, S = h | 0, w = l | 0, h = p | 0, { h: l, l: p } = x$3.add(D | 0, c | 0, O | 0, ot | 0), D = u | 0, c = i | 0, u = s | 0, i = a | 0, s = r | 0, a = o | 0;
      const At = x$3.add3L(ot, st, Ct);
      r = x$3.add3H(At, O, tt, at), o = At | 0;
    }
    (({ h: r, l: o } = x$3.add(this.Ah | 0, this.Al | 0, r | 0, o | 0))), { h: s, l: a } = x$3.add(this.Bh | 0, this.Bl | 0, s | 0, a | 0), { h: u, l: i } = x$3.add(this.Ch | 0, this.Cl | 0, u | 0, i | 0), { h: D, l: c } = x$3.add(this.Dh | 0, this.Dl | 0, D | 0, c | 0), { h: l, l: p } = x$3.add(this.Eh | 0, this.El | 0, l | 0, p | 0), { h: w, l: h } = x$3.add(this.Fh | 0, this.Fl | 0, w | 0, h | 0), { h: g, l: S } = x$3.add(this.Gh | 0, this.Gl | 0, g | 0, S | 0), { h: v, l: L } = x$3.add(this.Hh | 0, this.Hl | 0, v | 0, L | 0), this.set(r, o, s, a, u, i, D, c, l, p, w, h, g, S, v, L);
  }
  roundClean() {
    P$4.fill(0), Q$3.fill(0);
  }
  destroy() {
    this.buffer.fill(0), this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
};
const Kn$2 = Bn$1(() => new Jn$2());
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const vt$1 = BigInt(0), be$3 = BigInt(1), Wn$2 = BigInt(2);
function It$3(t) {
  return t instanceof Uint8Array || ArrayBuffer.isView(t) && t.constructor.name === "Uint8Array";
}
function Ut$2(t) {
  if (!It$3(t)) throw new Error("Uint8Array expected");
}
function Tt$3(t, e) {
  if (typeof e != "boolean") throw new Error(t + " boolean expected, got " + e);
}
const Xn$2 = Array.from({ length: 256 }, (t, e) => e.toString(16).padStart(2, "0"));
function Ft$3(t) {
  Ut$2(t);
  let e = "";
  for (let n = 0; n < t.length; n++) e += Xn$2[t[n]];
  return e;
}
function pe$3(t) {
  if (typeof t != "string") throw new Error("hex string expected, got " + typeof t);
  return t === "" ? vt$1 : BigInt("0x" + t);
}
const K$4 = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function we$3(t) {
  if (t >= K$4._0 && t <= K$4._9) return t - K$4._0;
  if (t >= K$4.A && t <= K$4.F) return t - (K$4.A - 10);
  if (t >= K$4.a && t <= K$4.f) return t - (K$4.a - 10);
}
function Ee$4(t) {
  if (typeof t != "string") throw new Error("hex string expected, got " + typeof t);
  const e = t.length, n = e / 2;
  if (e % 2) throw new Error("hex string expected, got unpadded hex of length " + e);
  const r = new Uint8Array(n);
  for (let o = 0, s = 0; o < n; o++, s += 2) {
    const a = we$3(t.charCodeAt(s)), u = we$3(t.charCodeAt(s + 1));
    if (a === void 0 || u === void 0) {
      const i = t[s] + t[s + 1];
      throw new Error('hex string expected, got non-hex character "' + i + '" at index ' + s);
    }
    r[o] = a * 16 + u;
  }
  return r;
}
function Pn$2(t) {
  return pe$3(Ft$3(t));
}
function Et$3(t) {
  return Ut$2(t), pe$3(Ft$3(Uint8Array.from(t).reverse()));
}
function ge$3(t, e) {
  return Ee$4(t.toString(16).padStart(e * 2, "0"));
}
function Nt$2(t, e) {
  return ge$3(t, e).reverse();
}
function W$3(t, e, n) {
  let r;
  if (typeof e == "string") try {
    r = Ee$4(e);
  } catch (s) {
    throw new Error(t + " must be hex string or Uint8Array, cause: " + s);
  }
  else if (It$3(e)) r = Uint8Array.from(e);
  else throw new Error(t + " must be hex string or Uint8Array");
  const o = r.length;
  if (typeof n == "number" && o !== n) throw new Error(t + " of length " + n + " expected, got " + o);
  return r;
}
function ye$3(...t) {
  let e = 0;
  for (let r = 0; r < t.length; r++) {
    const o = t[r];
    Ut$2(o), e += o.length;
  }
  const n = new Uint8Array(e);
  for (let r = 0, o = 0; r < t.length; r++) {
    const s = t[r];
    n.set(s, o), o += s.length;
  }
  return n;
}
const Lt$3 = (t) => typeof t == "bigint" && vt$1 <= t;
function Qn$2(t, e, n) {
  return Lt$3(t) && Lt$3(e) && Lt$3(n) && e <= t && t < n;
}
function ft$3(t, e, n, r) {
  if (!Qn$2(e, n, r)) throw new Error("expected valid " + t + ": " + n + " <= n < " + r + ", got " + e);
}
function tr$2(t) {
  let e;
  for (e = 0; t > vt$1; t >>= be$3, e += 1) ;
  return e;
}
const er$2 = (t) => (Wn$2 << BigInt(t - 1)) - be$3, nr$2 = { bigint: (t) => typeof t == "bigint", function: (t) => typeof t == "function", boolean: (t) => typeof t == "boolean", string: (t) => typeof t == "string", stringOrUint8Array: (t) => typeof t == "string" || It$3(t), isSafeInteger: (t) => Number.isSafeInteger(t), array: (t) => Array.isArray(t), field: (t, e) => e.Fp.isValid(t), hash: (t) => typeof t == "function" && Number.isSafeInteger(t.outputLen) };
function Ot$3(t, e, n = {}) {
  const r = (o, s, a) => {
    const u = nr$2[s];
    if (typeof u != "function") throw new Error("invalid validator function");
    const i = t[o];
    if (!(a && i === void 0) && !u(i, t)) throw new Error("param " + String(o) + " is invalid. Expected " + s + ", got " + i);
  };
  for (const [o, s] of Object.entries(e)) r(o, s, false);
  for (const [o, s] of Object.entries(n)) r(o, s, true);
  return t;
}
function xe$2(t) {
  const e = /* @__PURE__ */ new WeakMap();
  return (n, ...r) => {
    const o = e.get(n);
    if (o !== void 0) return o;
    const s = t(n, ...r);
    return e.set(n, s), s;
  };
}
const M$4 = BigInt(0), N$3 = BigInt(1), nt$3 = BigInt(2), rr$2 = BigInt(3), Ht$2 = BigInt(4), Be$2 = BigInt(5), Ce$2 = BigInt(8);
function H$3(t, e) {
  const n = t % e;
  return n >= M$4 ? n : e + n;
}
function or$3(t, e, n) {
  if (e < M$4) throw new Error("invalid exponent, negatives unsupported");
  if (n <= M$4) throw new Error("invalid modulus");
  if (n === N$3) return M$4;
  let r = N$3;
  for (; e > M$4; ) e & N$3 && (r = r * t % n), t = t * t % n, e >>= N$3;
  return r;
}
function J$3(t, e, n) {
  let r = t;
  for (; e-- > M$4; ) r *= r, r %= n;
  return r;
}
function Ae$2(t, e) {
  if (t === M$4) throw new Error("invert: expected non-zero number");
  if (e <= M$4) throw new Error("invert: expected positive modulus, got " + e);
  let n = H$3(t, e), r = e, o = M$4, s = N$3;
  for (; n !== M$4; ) {
    const u = r / n, i = r % n, D = o - s * u;
    r = n, n = i, o = s, s = D;
  }
  if (r !== N$3) throw new Error("invert: does not exist");
  return H$3(o, e);
}
function sr$2(t) {
  const e = (t - N$3) / nt$3;
  let n, r, o;
  for (n = t - N$3, r = 0; n % nt$3 === M$4; n /= nt$3, r++) ;
  for (o = nt$3; o < t && or$3(o, e, t) !== t - N$3; o++) if (o > 1e3) throw new Error("Cannot find square root: likely non-prime P");
  if (r === 1) {
    const a = (t + N$3) / Ht$2;
    return function(i, D) {
      const c = i.pow(D, a);
      if (!i.eql(i.sqr(c), D)) throw new Error("Cannot find square root");
      return c;
    };
  }
  const s = (n + N$3) / nt$3;
  return function(u, i) {
    if (u.pow(i, e) === u.neg(u.ONE)) throw new Error("Cannot find square root");
    let D = r, c = u.pow(u.mul(u.ONE, o), n), l = u.pow(i, s), p = u.pow(i, n);
    for (; !u.eql(p, u.ONE); ) {
      if (u.eql(p, u.ZERO)) return u.ZERO;
      let w = 1;
      for (let g = u.sqr(p); w < D && !u.eql(g, u.ONE); w++) g = u.sqr(g);
      const h = u.pow(c, N$3 << BigInt(D - w - 1));
      c = u.sqr(h), l = u.mul(l, h), p = u.mul(p, c), D = w;
    }
    return l;
  };
}
function ir$2(t) {
  if (t % Ht$2 === rr$2) {
    const e = (t + N$3) / Ht$2;
    return function(r, o) {
      const s = r.pow(o, e);
      if (!r.eql(r.sqr(s), o)) throw new Error("Cannot find square root");
      return s;
    };
  }
  if (t % Ce$2 === Be$2) {
    const e = (t - Be$2) / Ce$2;
    return function(r, o) {
      const s = r.mul(o, nt$3), a = r.pow(s, e), u = r.mul(o, a), i = r.mul(r.mul(u, nt$3), a), D = r.mul(u, r.sub(i, r.ONE));
      if (!r.eql(r.sqr(D), o)) throw new Error("Cannot find square root");
      return D;
    };
  }
  return sr$2(t);
}
const ur$2 = (t, e) => (H$3(t, e) & N$3) === N$3, cr$2 = ["create", "isValid", "is0", "neg", "inv", "sqrt", "sqr", "eql", "add", "sub", "mul", "pow", "div", "addN", "subN", "mulN", "sqrN"];
function ar$2(t) {
  const e = { ORDER: "bigint", MASK: "bigint", BYTES: "isSafeInteger", BITS: "isSafeInteger" }, n = cr$2.reduce((r, o) => (r[o] = "function", r), e);
  return Ot$3(t, n);
}
function fr$2(t, e, n) {
  if (n < M$4) throw new Error("invalid exponent, negatives unsupported");
  if (n === M$4) return t.ONE;
  if (n === N$3) return e;
  let r = t.ONE, o = e;
  for (; n > M$4; ) n & N$3 && (r = t.mul(r, o)), o = t.sqr(o), n >>= N$3;
  return r;
}
function Dr$2(t, e) {
  const n = new Array(e.length), r = e.reduce((s, a, u) => t.is0(a) ? s : (n[u] = s, t.mul(s, a)), t.ONE), o = t.inv(r);
  return e.reduceRight((s, a, u) => t.is0(a) ? s : (n[u] = t.mul(s, n[u]), t.mul(s, a)), o), n;
}
function me$3(t, e) {
  const n = e !== void 0 ? e : t.toString(2).length, r = Math.ceil(n / 8);
  return { nBitLength: n, nByteLength: r };
}
function _e$4(t, e, n = false, r = {}) {
  if (t <= M$4) throw new Error("invalid field: expected ORDER > 0, got " + t);
  const { nBitLength: o, nByteLength: s } = me$3(t, e);
  if (s > 2048) throw new Error("invalid field: expected ORDER of <= 2048 bytes");
  let a;
  const u = Object.freeze({ ORDER: t, isLE: n, BITS: o, BYTES: s, MASK: er$2(o), ZERO: M$4, ONE: N$3, create: (i) => H$3(i, t), isValid: (i) => {
    if (typeof i != "bigint") throw new Error("invalid field element: expected bigint, got " + typeof i);
    return M$4 <= i && i < t;
  }, is0: (i) => i === M$4, isOdd: (i) => (i & N$3) === N$3, neg: (i) => H$3(-i, t), eql: (i, D) => i === D, sqr: (i) => H$3(i * i, t), add: (i, D) => H$3(i + D, t), sub: (i, D) => H$3(i - D, t), mul: (i, D) => H$3(i * D, t), pow: (i, D) => fr$2(u, i, D), div: (i, D) => H$3(i * Ae$2(D, t), t), sqrN: (i) => i * i, addN: (i, D) => i + D, subN: (i, D) => i - D, mulN: (i, D) => i * D, inv: (i) => Ae$2(i, t), sqrt: r.sqrt || ((i) => (a || (a = ir$2(t)), a(u, i))), invertBatch: (i) => Dr$2(u, i), cmov: (i, D, c) => c ? D : i, toBytes: (i) => n ? Nt$2(i, s) : ge$3(i, s), fromBytes: (i) => {
    if (i.length !== s) throw new Error("Field.fromBytes: expected " + s + " bytes, got " + i.length);
    return n ? Et$3(i) : Pn$2(i);
  } });
  return Object.freeze(u);
}
const Se$2 = BigInt(0), gt$3 = BigInt(1);
function zt$2(t, e) {
  const n = e.negate();
  return t ? n : e;
}
function ve$2(t, e) {
  if (!Number.isSafeInteger(t) || t <= 0 || t > e) throw new Error("invalid window size, expected [1.." + e + "], got W=" + t);
}
function Mt$3(t, e) {
  ve$2(t, e);
  const n = Math.ceil(e / t) + 1, r = 2 ** (t - 1);
  return { windows: n, windowSize: r };
}
function dr$2(t, e) {
  if (!Array.isArray(t)) throw new Error("array expected");
  t.forEach((n, r) => {
    if (!(n instanceof e)) throw new Error("invalid point at index " + r);
  });
}
function hr$2(t, e) {
  if (!Array.isArray(t)) throw new Error("array of scalars expected");
  t.forEach((n, r) => {
    if (!e.isValid(n)) throw new Error("invalid scalar at index " + r);
  });
}
const qt$3 = /* @__PURE__ */ new WeakMap(), Ie$2 = /* @__PURE__ */ new WeakMap();
function $t$2(t) {
  return Ie$2.get(t) || 1;
}
function lr$2(t, e) {
  return { constTimeNegate: zt$2, hasPrecomputes(n) {
    return $t$2(n) !== 1;
  }, unsafeLadder(n, r, o = t.ZERO) {
    let s = n;
    for (; r > Se$2; ) r & gt$3 && (o = o.add(s)), s = s.double(), r >>= gt$3;
    return o;
  }, precomputeWindow(n, r) {
    const { windows: o, windowSize: s } = Mt$3(r, e), a = [];
    let u = n, i = u;
    for (let D = 0; D < o; D++) {
      i = u, a.push(i);
      for (let c = 1; c < s; c++) i = i.add(u), a.push(i);
      u = i.double();
    }
    return a;
  }, wNAF(n, r, o) {
    const { windows: s, windowSize: a } = Mt$3(n, e);
    let u = t.ZERO, i = t.BASE;
    const D = BigInt(2 ** n - 1), c = 2 ** n, l = BigInt(n);
    for (let p = 0; p < s; p++) {
      const w = p * a;
      let h = Number(o & D);
      o >>= l, h > a && (h -= c, o += gt$3);
      const g = w, S = w + Math.abs(h) - 1, v = p % 2 !== 0, L = h < 0;
      h === 0 ? i = i.add(zt$2(v, r[g])) : u = u.add(zt$2(L, r[S]));
    }
    return { p: u, f: i };
  }, wNAFUnsafe(n, r, o, s = t.ZERO) {
    const { windows: a, windowSize: u } = Mt$3(n, e), i = BigInt(2 ** n - 1), D = 2 ** n, c = BigInt(n);
    for (let l = 0; l < a; l++) {
      const p = l * u;
      if (o === Se$2) break;
      let w = Number(o & i);
      if (o >>= c, w > u && (w -= D, o += gt$3), w === 0) continue;
      let h = r[p + Math.abs(w) - 1];
      w < 0 && (h = h.negate()), s = s.add(h);
    }
    return s;
  }, getPrecomputes(n, r, o) {
    let s = qt$3.get(r);
    return s || (s = this.precomputeWindow(r, n), n !== 1 && qt$3.set(r, o(s))), s;
  }, wNAFCached(n, r, o) {
    const s = $t$2(n);
    return this.wNAF(s, this.getPrecomputes(s, n, o), r);
  }, wNAFCachedUnsafe(n, r, o, s) {
    const a = $t$2(n);
    return a === 1 ? this.unsafeLadder(n, r, s) : this.wNAFUnsafe(a, this.getPrecomputes(a, n, o), r, s);
  }, setWindowSize(n, r) {
    ve$2(r, e), Ie$2.set(n, r), qt$3.delete(n);
  } };
}
function br$2(t, e, n, r) {
  if (dr$2(n, t), hr$2(r, e), n.length !== r.length) throw new Error("arrays of points and scalars must have equal length");
  const o = t.ZERO, s = tr$2(BigInt(n.length)), a = s > 12 ? s - 3 : s > 4 ? s - 2 : s ? 2 : 1, u = (1 << a) - 1, i = new Array(u + 1).fill(o), D = Math.floor((e.BITS - 1) / a) * a;
  let c = o;
  for (let l = D; l >= 0; l -= a) {
    i.fill(o);
    for (let w = 0; w < r.length; w++) {
      const h = r[w], g = Number(h >> BigInt(l) & BigInt(u));
      i[g] = i[g].add(n[w]);
    }
    let p = o;
    for (let w = i.length - 1, h = o; w > 0; w--) h = h.add(i[w]), p = p.add(h);
    if (c = c.add(p), l !== 0) for (let w = 0; w < a; w++) c = c.double();
  }
  return c;
}
function pr$1(t) {
  return ar$2(t.Fp), Ot$3(t, { n: "bigint", h: "bigint", Gx: "field", Gy: "field" }, { nBitLength: "isSafeInteger", nByteLength: "isSafeInteger" }), Object.freeze({ ...me$3(t.n, t.nBitLength), ...t, p: t.Fp.ORDER });
}
const G$3 = BigInt(0), j$3 = BigInt(1), yt$3 = BigInt(2), wr$2 = BigInt(8), Er$1 = { zip215: true };
function gr$1(t) {
  const e = pr$1(t);
  return Ot$3(t, { hash: "function", a: "bigint", d: "bigint", randomBytes: "function" }, { adjustScalarBytes: "function", domain: "function", uvRatio: "function", mapToCurve: "function" }), Object.freeze({ ...e });
}
function yr$1(t) {
  const e = gr$1(t), { Fp: n, n: r, prehash: o, hash: s, randomBytes: a, nByteLength: u, h: i } = e, D = yt$3 << BigInt(u * 8) - j$3, c = n.create, l = _e$4(e.n, e.nBitLength), p = e.uvRatio || ((y, f) => {
    try {
      return { isValid: true, value: n.sqrt(y * n.inv(f)) };
    } catch {
      return { isValid: false, value: G$3 };
    }
  }), w = e.adjustScalarBytes || ((y) => y), h = e.domain || ((y, f, b) => {
    if (Tt$3("phflag", b), f.length || b) throw new Error("Contexts/pre-hash are not supported");
    return y;
  });
  function g(y, f) {
    ft$3("coordinate " + y, f, G$3, D);
  }
  function S(y) {
    if (!(y instanceof d)) throw new Error("ExtendedPoint expected");
  }
  const v = xe$2((y, f) => {
    const { ex: b, ey: E, ez: B } = y, C = y.is0();
    f == null && (f = C ? wr$2 : n.inv(B));
    const A = c(b * f), U = c(E * f), _ = c(B * f);
    if (C) return { x: G$3, y: j$3 };
    if (_ !== j$3) throw new Error("invZ was invalid");
    return { x: A, y: U };
  }), L = xe$2((y) => {
    const { a: f, d: b } = e;
    if (y.is0()) throw new Error("bad point: ZERO");
    const { ex: E, ey: B, ez: C, et: A } = y, U = c(E * E), _ = c(B * B), T = c(C * C), $ = c(T * T), R = c(U * f), V = c(T * c(R + _)), Y = c($ + c(b * c(U * _)));
    if (V !== Y) throw new Error("bad point: equation left != right (1)");
    const Z = c(E * B), X = c(C * A);
    if (Z !== X) throw new Error("bad point: equation left != right (2)");
    return true;
  });
  class d {
    constructor(f, b, E, B) {
      this.ex = f, this.ey = b, this.ez = E, this.et = B, g("x", f), g("y", b), g("z", E), g("t", B), Object.freeze(this);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    static fromAffine(f) {
      if (f instanceof d) throw new Error("extended point not allowed");
      const { x: b, y: E } = f || {};
      return g("x", b), g("y", E), new d(b, E, j$3, c(b * E));
    }
    static normalizeZ(f) {
      const b = n.invertBatch(f.map((E) => E.ez));
      return f.map((E, B) => E.toAffine(b[B])).map(d.fromAffine);
    }
    static msm(f, b) {
      return br$2(d, l, f, b);
    }
    _setWindowSize(f) {
      q.setWindowSize(this, f);
    }
    assertValidity() {
      L(this);
    }
    equals(f) {
      S(f);
      const { ex: b, ey: E, ez: B } = this, { ex: C, ey: A, ez: U } = f, _ = c(b * U), T = c(C * B), $ = c(E * U), R = c(A * B);
      return _ === T && $ === R;
    }
    is0() {
      return this.equals(d.ZERO);
    }
    negate() {
      return new d(c(-this.ex), this.ey, this.ez, c(-this.et));
    }
    double() {
      const { a: f } = e, { ex: b, ey: E, ez: B } = this, C = c(b * b), A = c(E * E), U = c(yt$3 * c(B * B)), _ = c(f * C), T = b + E, $ = c(c(T * T) - C - A), R = _ + A, V = R - U, Y = _ - A, Z = c($ * V), X = c(R * Y), et = c($ * Y), pt = c(V * R);
      return new d(Z, X, pt, et);
    }
    add(f) {
      S(f);
      const { a: b, d: E } = e, { ex: B, ey: C, ez: A, et: U } = this, { ex: _, ey: T, ez: $, et: R } = f;
      if (b === BigInt(-1)) {
        const re = c((C - B) * (T + _)), oe = c((C + B) * (T - _)), mt = c(oe - re);
        if (mt === G$3) return this.double();
        const se = c(A * yt$3 * R), ie = c(U * yt$3 * $), ue = ie + se, ce = oe + re, ae = ie - se, Dn = c(ue * mt), dn = c(ce * ae), hn = c(ue * ae), ln = c(mt * ce);
        return new d(Dn, dn, ln, hn);
      }
      const V = c(B * _), Y = c(C * T), Z = c(U * E * R), X = c(A * $), et = c((B + C) * (_ + T) - V - Y), pt = X - Z, ee = X + Z, ne = c(Y - b * V), un = c(et * pt), cn = c(ee * ne), an = c(et * ne), fn = c(pt * ee);
      return new d(un, cn, fn, an);
    }
    subtract(f) {
      return this.add(f.negate());
    }
    wNAF(f) {
      return q.wNAFCached(this, f, d.normalizeZ);
    }
    multiply(f) {
      const b = f;
      ft$3("scalar", b, j$3, r);
      const { p: E, f: B } = this.wNAF(b);
      return d.normalizeZ([E, B])[0];
    }
    multiplyUnsafe(f, b = d.ZERO) {
      const E = f;
      return ft$3("scalar", E, G$3, r), E === G$3 ? F : this.is0() || E === j$3 ? this : q.wNAFCachedUnsafe(this, E, d.normalizeZ, b);
    }
    isSmallOrder() {
      return this.multiplyUnsafe(i).is0();
    }
    isTorsionFree() {
      return q.unsafeLadder(this, r).is0();
    }
    toAffine(f) {
      return v(this, f);
    }
    clearCofactor() {
      const { h: f } = e;
      return f === j$3 ? this : this.multiplyUnsafe(f);
    }
    static fromHex(f, b = false) {
      const { d: E, a: B } = e, C = n.BYTES;
      f = W$3("pointHex", f, C), Tt$3("zip215", b);
      const A = f.slice(), U = f[C - 1];
      A[C - 1] = U & -129;
      const _ = Et$3(A), T = b ? D : n.ORDER;
      ft$3("pointHex.y", _, G$3, T);
      const $ = c(_ * _), R = c($ - j$3), V = c(E * $ - B);
      let { isValid: Y, value: Z } = p(R, V);
      if (!Y) throw new Error("Point.fromHex: invalid y coordinate");
      const X = (Z & j$3) === j$3, et = (U & 128) !== 0;
      if (!b && Z === G$3 && et) throw new Error("Point.fromHex: x=0 and x_0=1");
      return et !== X && (Z = c(-Z)), d.fromAffine({ x: Z, y: _ });
    }
    static fromPrivateKey(f) {
      return O(f).point;
    }
    toRawBytes() {
      const { x: f, y: b } = this.toAffine(), E = Nt$2(b, n.BYTES);
      return E[E.length - 1] |= f & j$3 ? 128 : 0, E;
    }
    toHex() {
      return Ft$3(this.toRawBytes());
    }
  }
  d.BASE = new d(e.Gx, e.Gy, j$3, c(e.Gx * e.Gy)), d.ZERO = new d(G$3, j$3, j$3, G$3);
  const { BASE: m, ZERO: F } = d, q = lr$2(d, u * 8);
  function z(y) {
    return H$3(y, r);
  }
  function I(y) {
    return z(Et$3(y));
  }
  function O(y) {
    const f = n.BYTES;
    y = W$3("private key", y, f);
    const b = W$3("hashed private key", s(y), 2 * f), E = w(b.slice(0, f)), B = b.slice(f, 2 * f), C = I(E), A = m.multiply(C), U = A.toRawBytes();
    return { head: E, prefix: B, scalar: C, point: A, pointBytes: U };
  }
  function ot(y) {
    return O(y).pointBytes;
  }
  function tt(y = new Uint8Array(), ...f) {
    const b = ye$3(...f);
    return I(s(h(b, W$3("context", y), !!o)));
  }
  function st(y, f, b = {}) {
    y = W$3("message", y), o && (y = o(y));
    const { prefix: E, scalar: B, pointBytes: C } = O(f), A = tt(b.context, E, y), U = m.multiply(A).toRawBytes(), _ = tt(b.context, U, C, y), T = z(A + _ * B);
    ft$3("signature.s", T, G$3, r);
    const $ = ye$3(U, Nt$2(T, n.BYTES));
    return W$3("result", $, n.BYTES * 2);
  }
  const at = Er$1;
  function Ct(y, f, b, E = at) {
    const { context: B, zip215: C } = E, A = n.BYTES;
    y = W$3("signature", y, 2 * A), f = W$3("message", f), b = W$3("publicKey", b, A), C !== void 0 && Tt$3("zip215", C), o && (f = o(f));
    const U = Et$3(y.slice(A, 2 * A));
    let _, T, $;
    try {
      _ = d.fromHex(b, C), T = d.fromHex(y.slice(0, A), C), $ = m.multiplyUnsafe(U);
    } catch {
      return false;
    }
    if (!C && _.isSmallOrder()) return false;
    const R = tt(B, T.toRawBytes(), _.toRawBytes(), f);
    return T.add(_.multiplyUnsafe(R)).subtract($).clearCofactor().equals(d.ZERO);
  }
  return m._setWindowSize(8), { CURVE: e, getPublicKey: ot, sign: st, verify: Ct, ExtendedPoint: d, utils: { getExtendedPublicKey: O, randomPrivateKey: () => a(n.BYTES), precompute(y = 8, f = d.BASE) {
    return f._setWindowSize(y), f.multiply(BigInt(3)), f;
  } } };
}
BigInt(0), BigInt(1);
const kt$3 = BigInt("57896044618658097711785492504343953926634992332820282019728792003956564819949"), Ue$3 = BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");
BigInt(0);
const xr$1 = BigInt(1), Te$2 = BigInt(2);
BigInt(3);
const Br$2 = BigInt(5), Cr$2 = BigInt(8);
function Ar$2(t) {
  const e = BigInt(10), n = BigInt(20), r = BigInt(40), o = BigInt(80), s = kt$3, u = t * t % s * t % s, i = J$3(u, Te$2, s) * u % s, D = J$3(i, xr$1, s) * t % s, c = J$3(D, Br$2, s) * D % s, l = J$3(c, e, s) * c % s, p = J$3(l, n, s) * l % s, w = J$3(p, r, s) * p % s, h = J$3(w, o, s) * w % s, g = J$3(h, o, s) * w % s, S = J$3(g, e, s) * c % s;
  return { pow_p_5_8: J$3(S, Te$2, s) * t % s, b2: u };
}
function mr$2(t) {
  return t[0] &= 248, t[31] &= 127, t[31] |= 64, t;
}
function _r$2(t, e) {
  const n = kt$3, r = H$3(e * e * e, n), o = H$3(r * r * e, n), s = Ar$2(t * o).pow_p_5_8;
  let a = H$3(t * r * s, n);
  const u = H$3(e * a * a, n), i = a, D = H$3(a * Ue$3, n), c = u === t, l = u === H$3(-t, n), p = u === H$3(-t * Ue$3, n);
  return c && (a = i), (l || p) && (a = D), ur$2(a, n) && (a = H$3(-a, n)), { isValid: c || l, value: a };
}
const Sr$2 = (() => _e$4(kt$3, void 0, true))(), vr$2 = (() => ({ a: BigInt(-1), d: BigInt("37095705934669439343138083508754565189542113879843219016388785533085940283555"), Fp: Sr$2, n: BigInt("7237005577332262213973186563042994240857116359379907606001950938285454250989"), h: Cr$2, Gx: BigInt("15112221349535400772501151409588531511454012693041857206046113283949847762202"), Gy: BigInt("46316835694926478169428394003475163141307993866256225615783033603165251855960"), hash: Kn$2, randomBytes: he$3, adjustScalarBytes: mr$2, uvRatio: _r$2 }))(), Rt$3 = (() => yr$1(vr$2))(), jt$3 = "EdDSA", Zt$2 = "JWT", ut$3 = ".", Dt$2 = "base64url", Gt$2 = "utf8", xt$3 = "utf8", Vt$3 = ":", Yt$2 = "did", Jt$3 = "key", dt$3 = "base58btc", Kt$3 = "z", Wt$3 = "K36", Ne$2 = 32;
function Xt$3(t) {
  return globalThis.Buffer != null ? new Uint8Array(t.buffer, t.byteOffset, t.byteLength) : t;
}
function Le$3(t = 0) {
  return globalThis.Buffer != null && globalThis.Buffer.allocUnsafe != null ? Xt$3(globalThis.Buffer.allocUnsafe(t)) : new Uint8Array(t);
}
function Oe$2(t, e) {
  e || (e = t.reduce((o, s) => o + s.length, 0));
  const n = Le$3(e);
  let r = 0;
  for (const o of t) n.set(o, r), r += o.length;
  return Xt$3(n);
}
function Ir$2(t, e) {
  if (t.length >= 255) throw new TypeError("Alphabet too long");
  for (var n = new Uint8Array(256), r = 0; r < n.length; r++) n[r] = 255;
  for (var o = 0; o < t.length; o++) {
    var s = t.charAt(o), a = s.charCodeAt(0);
    if (n[a] !== 255) throw new TypeError(s + " is ambiguous");
    n[a] = o;
  }
  var u = t.length, i = t.charAt(0), D = Math.log(u) / Math.log(256), c = Math.log(256) / Math.log(u);
  function l(h) {
    if (h instanceof Uint8Array || (ArrayBuffer.isView(h) ? h = new Uint8Array(h.buffer, h.byteOffset, h.byteLength) : Array.isArray(h) && (h = Uint8Array.from(h))), !(h instanceof Uint8Array)) throw new TypeError("Expected Uint8Array");
    if (h.length === 0) return "";
    for (var g = 0, S = 0, v = 0, L = h.length; v !== L && h[v] === 0; ) v++, g++;
    for (var d = (L - v) * c + 1 >>> 0, m = new Uint8Array(d); v !== L; ) {
      for (var F = h[v], q = 0, z = d - 1; (F !== 0 || q < S) && z !== -1; z--, q++) F += 256 * m[z] >>> 0, m[z] = F % u >>> 0, F = F / u >>> 0;
      if (F !== 0) throw new Error("Non-zero carry");
      S = q, v++;
    }
    for (var I = d - S; I !== d && m[I] === 0; ) I++;
    for (var O = i.repeat(g); I < d; ++I) O += t.charAt(m[I]);
    return O;
  }
  function p(h) {
    if (typeof h != "string") throw new TypeError("Expected String");
    if (h.length === 0) return new Uint8Array();
    var g = 0;
    if (h[g] !== " ") {
      for (var S = 0, v = 0; h[g] === i; ) S++, g++;
      for (var L = (h.length - g) * D + 1 >>> 0, d = new Uint8Array(L); h[g]; ) {
        var m = n[h.charCodeAt(g)];
        if (m === 255) return;
        for (var F = 0, q = L - 1; (m !== 0 || F < v) && q !== -1; q--, F++) m += u * d[q] >>> 0, d[q] = m % 256 >>> 0, m = m / 256 >>> 0;
        if (m !== 0) throw new Error("Non-zero carry");
        v = F, g++;
      }
      if (h[g] !== " ") {
        for (var z = L - v; z !== L && d[z] === 0; ) z++;
        for (var I = new Uint8Array(S + (L - z)), O = S; z !== L; ) I[O++] = d[z++];
        return I;
      }
    }
  }
  function w(h) {
    var g = p(h);
    if (g) return g;
    throw new Error(`Non-${e} character`);
  }
  return { encode: l, decodeUnsafe: p, decode: w };
}
var Ur$2 = Ir$2, Tr$2 = Ur$2;
const He$3 = (t) => {
  if (t instanceof Uint8Array && t.constructor.name === "Uint8Array") return t;
  if (t instanceof ArrayBuffer) return new Uint8Array(t);
  if (ArrayBuffer.isView(t)) return new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
  throw new Error("Unknown type, must be binary type");
}, Fr$2 = (t) => new TextEncoder().encode(t), Nr$2 = (t) => new TextDecoder().decode(t);
let Lr$2 = class Lr {
  constructor(e, n, r) {
    this.name = e, this.prefix = n, this.baseEncode = r;
  }
  encode(e) {
    if (e instanceof Uint8Array) return `${this.prefix}${this.baseEncode(e)}`;
    throw Error("Unknown type, must be binary type");
  }
};
let Or$2 = class Or {
  constructor(e, n, r) {
    if (this.name = e, this.prefix = n, n.codePointAt(0) === void 0) throw new Error("Invalid prefix character");
    this.prefixCodePoint = n.codePointAt(0), this.baseDecode = r;
  }
  decode(e) {
    if (typeof e == "string") {
      if (e.codePointAt(0) !== this.prefixCodePoint) throw Error(`Unable to decode multibase string ${JSON.stringify(e)}, ${this.name} decoder only supports inputs prefixed with ${this.prefix}`);
      return this.baseDecode(e.slice(this.prefix.length));
    } else throw Error("Can only multibase decode strings");
  }
  or(e) {
    return ze$3(this, e);
  }
};
let Hr$2 = class Hr {
  constructor(e) {
    this.decoders = e;
  }
  or(e) {
    return ze$3(this, e);
  }
  decode(e) {
    const n = e[0], r = this.decoders[n];
    if (r) return r.decode(e);
    throw RangeError(`Unable to decode multibase string ${JSON.stringify(e)}, only inputs prefixed with ${Object.keys(this.decoders)} are supported`);
  }
};
const ze$3 = (t, e) => new Hr$2({ ...t.decoders || { [t.prefix]: t }, ...e.decoders || { [e.prefix]: e } });
let zr$2 = class zr {
  constructor(e, n, r, o) {
    this.name = e, this.prefix = n, this.baseEncode = r, this.baseDecode = o, this.encoder = new Lr$2(e, n, r), this.decoder = new Or$2(e, n, o);
  }
  encode(e) {
    return this.encoder.encode(e);
  }
  decode(e) {
    return this.decoder.decode(e);
  }
};
const Bt$3 = ({ name: t, prefix: e, encode: n, decode: r }) => new zr$2(t, e, n, r), ht$3 = ({ prefix: t, name: e, alphabet: n }) => {
  const { encode: r, decode: o } = Tr$2(n, e);
  return Bt$3({ prefix: t, name: e, encode: r, decode: (s) => He$3(o(s)) });
}, Mr$2 = (t, e, n, r) => {
  const o = {};
  for (let c = 0; c < e.length; ++c) o[e[c]] = c;
  let s = t.length;
  for (; t[s - 1] === "="; ) --s;
  const a = new Uint8Array(s * n / 8 | 0);
  let u = 0, i = 0, D = 0;
  for (let c = 0; c < s; ++c) {
    const l = o[t[c]];
    if (l === void 0) throw new SyntaxError(`Non-${r} character`);
    i = i << n | l, u += n, u >= 8 && (u -= 8, a[D++] = 255 & i >> u);
  }
  if (u >= n || 255 & i << 8 - u) throw new SyntaxError("Unexpected end of data");
  return a;
}, qr$2 = (t, e, n) => {
  const r = e[e.length - 1] === "=", o = (1 << n) - 1;
  let s = "", a = 0, u = 0;
  for (let i = 0; i < t.length; ++i) for (u = u << 8 | t[i], a += 8; a > n; ) a -= n, s += e[o & u >> a];
  if (a && (s += e[o & u << n - a]), r) for (; s.length * n & 7; ) s += "=";
  return s;
}, k$6 = ({ name: t, prefix: e, bitsPerChar: n, alphabet: r }) => Bt$3({ prefix: e, name: t, encode(o) {
  return qr$2(o, r, n);
}, decode(o) {
  return Mr$2(o, r, n, t);
} }), $r$2 = Bt$3({ prefix: "\0", name: "identity", encode: (t) => Nr$2(t), decode: (t) => Fr$2(t) });
var kr$2 = Object.freeze({ __proto__: null, identity: $r$2 });
const Rr$2 = k$6({ prefix: "0", name: "base2", alphabet: "01", bitsPerChar: 1 });
var jr$2 = Object.freeze({ __proto__: null, base2: Rr$2 });
const Zr$2 = k$6({ prefix: "7", name: "base8", alphabet: "01234567", bitsPerChar: 3 });
var Gr$2 = Object.freeze({ __proto__: null, base8: Zr$2 });
const Vr$2 = ht$3({ prefix: "9", name: "base10", alphabet: "0123456789" });
var Yr$2 = Object.freeze({ __proto__: null, base10: Vr$2 });
const Jr$2 = k$6({ prefix: "f", name: "base16", alphabet: "0123456789abcdef", bitsPerChar: 4 }), Kr$2 = k$6({ prefix: "F", name: "base16upper", alphabet: "0123456789ABCDEF", bitsPerChar: 4 });
var Wr$2 = Object.freeze({ __proto__: null, base16: Jr$2, base16upper: Kr$2 });
const Xr$2 = k$6({ prefix: "b", name: "base32", alphabet: "abcdefghijklmnopqrstuvwxyz234567", bitsPerChar: 5 }), Pr$2 = k$6({ prefix: "B", name: "base32upper", alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567", bitsPerChar: 5 }), Qr$2 = k$6({ prefix: "c", name: "base32pad", alphabet: "abcdefghijklmnopqrstuvwxyz234567=", bitsPerChar: 5 }), to$2 = k$6({ prefix: "C", name: "base32padupper", alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=", bitsPerChar: 5 }), eo$2 = k$6({ prefix: "v", name: "base32hex", alphabet: "0123456789abcdefghijklmnopqrstuv", bitsPerChar: 5 }), no$2 = k$6({ prefix: "V", name: "base32hexupper", alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV", bitsPerChar: 5 }), ro$2 = k$6({ prefix: "t", name: "base32hexpad", alphabet: "0123456789abcdefghijklmnopqrstuv=", bitsPerChar: 5 }), oo$2 = k$6({ prefix: "T", name: "base32hexpadupper", alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV=", bitsPerChar: 5 }), so$2 = k$6({ prefix: "h", name: "base32z", alphabet: "ybndrfg8ejkmcpqxot1uwisza345h769", bitsPerChar: 5 });
var io$2 = Object.freeze({ __proto__: null, base32: Xr$2, base32upper: Pr$2, base32pad: Qr$2, base32padupper: to$2, base32hex: eo$2, base32hexupper: no$2, base32hexpad: ro$2, base32hexpadupper: oo$2, base32z: so$2 });
const uo$2 = ht$3({ prefix: "k", name: "base36", alphabet: "0123456789abcdefghijklmnopqrstuvwxyz" }), co$2 = ht$3({ prefix: "K", name: "base36upper", alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" });
var ao$2 = Object.freeze({ __proto__: null, base36: uo$2, base36upper: co$2 });
const fo$2 = ht$3({ name: "base58btc", prefix: "z", alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz" }), Do$1 = ht$3({ name: "base58flickr", prefix: "Z", alphabet: "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ" });
var ho$2 = Object.freeze({ __proto__: null, base58btc: fo$2, base58flickr: Do$1 });
const lo$2 = k$6({ prefix: "m", name: "base64", alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", bitsPerChar: 6 }), bo$2 = k$6({ prefix: "M", name: "base64pad", alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", bitsPerChar: 6 }), po$2 = k$6({ prefix: "u", name: "base64url", alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", bitsPerChar: 6 }), wo$2 = k$6({ prefix: "U", name: "base64urlpad", alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=", bitsPerChar: 6 });
var Eo$2 = Object.freeze({ __proto__: null, base64: lo$2, base64pad: bo$2, base64url: po$2, base64urlpad: wo$2 });
const Me$4 = Array.from("🚀🪐☄🛰🌌🌑🌒🌓🌔🌕🌖🌗🌘🌍🌏🌎🐉☀💻🖥💾💿😂❤😍🤣😊🙏💕😭😘👍😅👏😁🔥🥰💔💖💙😢🤔😆🙄💪😉☺👌🤗💜😔😎😇🌹🤦🎉💞✌✨🤷😱😌🌸🙌😋💗💚😏💛🙂💓🤩😄😀🖤😃💯🙈👇🎶😒🤭❣😜💋👀😪😑💥🙋😞😩😡🤪👊🥳😥🤤👉💃😳✋😚😝😴🌟😬🙃🍀🌷😻😓⭐✅🥺🌈😈🤘💦✔😣🏃💐☹🎊💘😠☝😕🌺🎂🌻😐🖕💝🙊😹🗣💫💀👑🎵🤞😛🔴😤🌼😫⚽🤙☕🏆🤫👈😮🙆🍻🍃🐶💁😲🌿🧡🎁⚡🌞🎈❌✊👋😰🤨😶🤝🚶💰🍓💢🤟🙁🚨💨🤬✈🎀🍺🤓😙💟🌱😖👶🥴▶➡❓💎💸⬇😨🌚🦋😷🕺⚠🙅😟😵👎🤲🤠🤧📌🔵💅🧐🐾🍒😗🤑🌊🤯🐷☎💧😯💆👆🎤🙇🍑❄🌴💣🐸💌📍🥀🤢👅💡💩👐📸👻🤐🤮🎼🥵🚩🍎🍊👼💍📣🥂"), go$2 = Me$4.reduce((t, e, n) => (t[n] = e, t), []), yo$2 = Me$4.reduce((t, e, n) => (t[e.codePointAt(0)] = n, t), []);
function xo$2(t) {
  return t.reduce((e, n) => (e += go$2[n], e), "");
}
function Bo$2(t) {
  const e = [];
  for (const n of t) {
    const r = yo$2[n.codePointAt(0)];
    if (r === void 0) throw new Error(`Non-base256emoji character: ${n}`);
    e.push(r);
  }
  return new Uint8Array(e);
}
const Co$1 = Bt$3({ prefix: "🚀", name: "base256emoji", encode: xo$2, decode: Bo$2 });
var Ao$2 = Object.freeze({ __proto__: null, base256emoji: Co$1 }), mo$2 = $e$3, qe$3 = 128, So$2 = -128, vo$2 = Math.pow(2, 31);
function $e$3(t, e, n) {
  e = e || [], n = n || 0;
  for (var r = n; t >= vo$2; ) e[n++] = t & 255 | qe$3, t /= 128;
  for (; t & So$2; ) e[n++] = t & 255 | qe$3, t >>>= 7;
  return e[n] = t | 0, $e$3.bytes = n - r + 1, e;
}
var Io$2 = Pt$3, Uo$2 = 128, ke$4 = 127;
function Pt$3(t, r) {
  var n = 0, r = r || 0, o = 0, s = r, a, u = t.length;
  do {
    if (s >= u) throw Pt$3.bytes = 0, new RangeError("Could not decode varint");
    a = t[s++], n += o < 28 ? (a & ke$4) << o : (a & ke$4) * Math.pow(2, o), o += 7;
  } while (a >= Uo$2);
  return Pt$3.bytes = s - r, n;
}
var To$2 = Math.pow(2, 7), Fo$1 = Math.pow(2, 14), No$2 = Math.pow(2, 21), Lo$2 = Math.pow(2, 28), Oo$2 = Math.pow(2, 35), Ho$1 = Math.pow(2, 42), zo$1 = Math.pow(2, 49), Mo$1 = Math.pow(2, 56), qo$1 = Math.pow(2, 63), $o$2 = function(t) {
  return t < To$2 ? 1 : t < Fo$1 ? 2 : t < No$2 ? 3 : t < Lo$2 ? 4 : t < Oo$2 ? 5 : t < Ho$1 ? 6 : t < zo$1 ? 7 : t < Mo$1 ? 8 : t < qo$1 ? 9 : 10;
}, ko$1 = { encode: mo$2, decode: Io$2, encodingLength: $o$2 }, Re$1 = ko$1;
const je$3 = (t, e, n = 0) => (Re$1.encode(t, e, n), e), Ze$3 = (t) => Re$1.encodingLength(t), Qt$3 = (t, e) => {
  const n = e.byteLength, r = Ze$3(t), o = r + Ze$3(n), s = new Uint8Array(o + n);
  return je$3(t, s, 0), je$3(n, s, r), s.set(e, o), new Ro$2(t, n, e, s);
};
let Ro$2 = class Ro {
  constructor(e, n, r, o) {
    this.code = e, this.size = n, this.digest = r, this.bytes = o;
  }
};
const Ge$4 = ({ name: t, code: e, encode: n }) => new jo$1(t, e, n);
let jo$1 = class jo {
  constructor(e, n, r) {
    this.name = e, this.code = n, this.encode = r;
  }
  digest(e) {
    if (e instanceof Uint8Array) {
      const n = this.encode(e);
      return n instanceof Uint8Array ? Qt$3(this.code, n) : n.then((r) => Qt$3(this.code, r));
    } else throw Error("Unknown type, must be binary type");
  }
};
const Ve$3 = (t) => async (e) => new Uint8Array(await crypto.subtle.digest(t, e)), Zo$1 = Ge$4({ name: "sha2-256", code: 18, encode: Ve$3("SHA-256") }), Go$2 = Ge$4({ name: "sha2-512", code: 19, encode: Ve$3("SHA-512") });
var Vo$1 = Object.freeze({ __proto__: null, sha256: Zo$1, sha512: Go$2 });
const Ye$3 = 0, Yo$2 = "identity", Je$3 = He$3, Jo$2 = (t) => Qt$3(Ye$3, Je$3(t)), Ko$2 = { code: Ye$3, name: Yo$2, encode: Je$3, digest: Jo$2 };
var Wo$2 = Object.freeze({ __proto__: null, identity: Ko$2 });
new TextEncoder(), new TextDecoder();
const Ke$4 = { ...kr$2, ...jr$2, ...Gr$2, ...Yr$2, ...Wr$2, ...io$2, ...ao$2, ...ho$2, ...Eo$2, ...Ao$2 };
({ ...Vo$1, ...Wo$2 });
function We$3(t, e, n, r) {
  return { name: t, prefix: e, encoder: { name: t, prefix: e, encode: n }, decoder: { decode: r } };
}
const Xe$3 = We$3("utf8", "u", (t) => "u" + new TextDecoder("utf8").decode(t), (t) => new TextEncoder().encode(t.substring(1))), te$2 = We$3("ascii", "a", (t) => {
  let e = "a";
  for (let n = 0; n < t.length; n++) e += String.fromCharCode(t[n]);
  return e;
}, (t) => {
  t = t.substring(1);
  const e = Le$3(t.length);
  for (let n = 0; n < t.length; n++) e[n] = t.charCodeAt(n);
  return e;
}), Pe$2 = { utf8: Xe$3, "utf-8": Xe$3, hex: Ke$4.base16, latin1: te$2, ascii: te$2, binary: te$2, ...Ke$4 };
function ct$2(t, e = "utf8") {
  const n = Pe$2[e];
  if (!n) throw new Error(`Unsupported encoding "${e}"`);
  return (e === "utf8" || e === "utf-8") && globalThis.Buffer != null && globalThis.Buffer.from != null ? globalThis.Buffer.from(t.buffer, t.byteOffset, t.byteLength).toString("utf8") : n.encoder.encode(t).substring(1);
}
function rt$1(t, e = "utf8") {
  const n = Pe$2[e];
  if (!n) throw new Error(`Unsupported encoding "${e}"`);
  return (e === "utf8" || e === "utf-8") && globalThis.Buffer != null && globalThis.Buffer.from != null ? Xt$3(globalThis.Buffer.from(t, "utf-8")) : n.decoder.decode(`${n.prefix}${t}`);
}
function lt$2(t) {
  return safeJsonParse(ct$2(rt$1(t, Dt$2), Gt$2));
}
function bt$2(t) {
  return ct$2(rt$1(safeJsonStringify(t), Gt$2), Dt$2);
}
function Qe$3(t) {
  const e = rt$1(Wt$3, dt$3), n = Kt$3 + ct$2(Oe$2([e, t]), dt$3);
  return [Yt$2, Jt$3, n].join(Vt$3);
}
function en$1(t) {
  return ct$2(t, Dt$2);
}
function nn$2(t) {
  return rt$1(t, Dt$2);
}
function rn$2(t) {
  return rt$1([bt$2(t.header), bt$2(t.payload)].join(ut$3), xt$3);
}
function on$2(t) {
  return [bt$2(t.header), bt$2(t.payload), en$1(t.signature)].join(ut$3);
}
function sn$2(t) {
  const e = t.split(ut$3), n = lt$2(e[0]), r = lt$2(e[1]), o = nn$2(e[2]), s = rt$1(e.slice(0, 2).join(ut$3), xt$3);
  return { header: n, payload: r, signature: o, data: s };
}
function Po$1(t = he$3(Ne$2)) {
  const e = Rt$3.getPublicKey(t);
  return { secretKey: Oe$2([t, e]), publicKey: e };
}
async function Qo(t, e, n, r, o = cjs$3.fromMiliseconds(Date.now())) {
  const s = { alg: jt$3, typ: Zt$2 }, a = Qe$3(r.publicKey), u = o + n, i = { iss: a, sub: t, aud: e, iat: o, exp: u }, D = rn$2({ header: s, payload: i }), c = Rt$3.sign(D, r.secretKey.slice(0, 32));
  return on$2({ header: s, payload: i, signature: c });
}

function allocUnsafe(size = 0) {
  if (globalThis.Buffer != null && globalThis.Buffer.allocUnsafe != null) {
    return globalThis.Buffer.allocUnsafe(size);
  }
  return new Uint8Array(size);
}

function concat(arrays, length) {
  if (!length) {
    length = arrays.reduce((acc, curr) => acc + curr.length, 0);
  }
  const output = allocUnsafe(length);
  let offset = 0;
  for (const arr of arrays) {
    output.set(arr, offset);
    offset += arr.length;
  }
  return output;
}

function base(ALPHABET, name) {
  if (ALPHABET.length >= 255) {
    throw new TypeError('Alphabet too long');
  }
  var BASE_MAP = new Uint8Array(256);
  for (var j = 0; j < BASE_MAP.length; j++) {
    BASE_MAP[j] = 255;
  }
  for (var i = 0; i < ALPHABET.length; i++) {
    var x = ALPHABET.charAt(i);
    var xc = x.charCodeAt(0);
    if (BASE_MAP[xc] !== 255) {
      throw new TypeError(x + ' is ambiguous');
    }
    BASE_MAP[xc] = i;
  }
  var BASE = ALPHABET.length;
  var LEADER = ALPHABET.charAt(0);
  var FACTOR = Math.log(BASE) / Math.log(256);
  var iFACTOR = Math.log(256) / Math.log(BASE);
  function encode(source) {
    if (source instanceof Uint8Array);
    else if (ArrayBuffer.isView(source)) {
      source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
    } else if (Array.isArray(source)) {
      source = Uint8Array.from(source);
    }
    if (!(source instanceof Uint8Array)) {
      throw new TypeError('Expected Uint8Array');
    }
    if (source.length === 0) {
      return '';
    }
    var zeroes = 0;
    var length = 0;
    var pbegin = 0;
    var pend = source.length;
    while (pbegin !== pend && source[pbegin] === 0) {
      pbegin++;
      zeroes++;
    }
    var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
    var b58 = new Uint8Array(size);
    while (pbegin !== pend) {
      var carry = source[pbegin];
      var i = 0;
      for (var it1 = size - 1; (carry !== 0 || i < length) && it1 !== -1; it1--, i++) {
        carry += 256 * b58[it1] >>> 0;
        b58[it1] = carry % BASE >>> 0;
        carry = carry / BASE >>> 0;
      }
      if (carry !== 0) {
        throw new Error('Non-zero carry');
      }
      length = i;
      pbegin++;
    }
    var it2 = size - length;
    while (it2 !== size && b58[it2] === 0) {
      it2++;
    }
    var str = LEADER.repeat(zeroes);
    for (; it2 < size; ++it2) {
      str += ALPHABET.charAt(b58[it2]);
    }
    return str;
  }
  function decodeUnsafe(source) {
    if (typeof source !== 'string') {
      throw new TypeError('Expected String');
    }
    if (source.length === 0) {
      return new Uint8Array();
    }
    var psz = 0;
    if (source[psz] === ' ') {
      return;
    }
    var zeroes = 0;
    var length = 0;
    while (source[psz] === LEADER) {
      zeroes++;
      psz++;
    }
    var size = (source.length - psz) * FACTOR + 1 >>> 0;
    var b256 = new Uint8Array(size);
    while (source[psz]) {
      var carry = BASE_MAP[source.charCodeAt(psz)];
      if (carry === 255) {
        return;
      }
      var i = 0;
      for (var it3 = size - 1; (carry !== 0 || i < length) && it3 !== -1; it3--, i++) {
        carry += BASE * b256[it3] >>> 0;
        b256[it3] = carry % 256 >>> 0;
        carry = carry / 256 >>> 0;
      }
      if (carry !== 0) {
        throw new Error('Non-zero carry');
      }
      length = i;
      psz++;
    }
    if (source[psz] === ' ') {
      return;
    }
    var it4 = size - length;
    while (it4 !== size && b256[it4] === 0) {
      it4++;
    }
    var vch = new Uint8Array(zeroes + (size - it4));
    var j = zeroes;
    while (it4 !== size) {
      vch[j++] = b256[it4++];
    }
    return vch;
  }
  function decode(string) {
    var buffer = decodeUnsafe(string);
    if (buffer) {
      return buffer;
    }
    throw new Error(`Non-${ name } character`);
  }
  return {
    encode: encode,
    decodeUnsafe: decodeUnsafe,
    decode: decode
  };
}
var src = base;
var _brrp__multiformats_scope_baseX = src;

const coerce = o => {
  if (o instanceof Uint8Array && o.constructor.name === 'Uint8Array')
    return o;
  if (o instanceof ArrayBuffer)
    return new Uint8Array(o);
  if (ArrayBuffer.isView(o)) {
    return new Uint8Array(o.buffer, o.byteOffset, o.byteLength);
  }
  throw new Error('Unknown type, must be binary type');
};
const fromString$1 = str => new TextEncoder().encode(str);
const toString$1 = b => new TextDecoder().decode(b);

class Encoder {
  constructor(name, prefix, baseEncode) {
    this.name = name;
    this.prefix = prefix;
    this.baseEncode = baseEncode;
  }
  encode(bytes) {
    if (bytes instanceof Uint8Array) {
      return `${ this.prefix }${ this.baseEncode(bytes) }`;
    } else {
      throw Error('Unknown type, must be binary type');
    }
  }
}
class Decoder {
  constructor(name, prefix, baseDecode) {
    this.name = name;
    this.prefix = prefix;
    if (prefix.codePointAt(0) === undefined) {
      throw new Error('Invalid prefix character');
    }
    this.prefixCodePoint = prefix.codePointAt(0);
    this.baseDecode = baseDecode;
  }
  decode(text) {
    if (typeof text === 'string') {
      if (text.codePointAt(0) !== this.prefixCodePoint) {
        throw Error(`Unable to decode multibase string ${ JSON.stringify(text) }, ${ this.name } decoder only supports inputs prefixed with ${ this.prefix }`);
      }
      return this.baseDecode(text.slice(this.prefix.length));
    } else {
      throw Error('Can only multibase decode strings');
    }
  }
  or(decoder) {
    return or$2(this, decoder);
  }
}
class ComposedDecoder {
  constructor(decoders) {
    this.decoders = decoders;
  }
  or(decoder) {
    return or$2(this, decoder);
  }
  decode(input) {
    const prefix = input[0];
    const decoder = this.decoders[prefix];
    if (decoder) {
      return decoder.decode(input);
    } else {
      throw RangeError(`Unable to decode multibase string ${ JSON.stringify(input) }, only inputs prefixed with ${ Object.keys(this.decoders) } are supported`);
    }
  }
}
const or$2 = (left, right) => new ComposedDecoder({
  ...left.decoders || { [left.prefix]: left },
  ...right.decoders || { [right.prefix]: right }
});
class Codec {
  constructor(name, prefix, baseEncode, baseDecode) {
    this.name = name;
    this.prefix = prefix;
    this.baseEncode = baseEncode;
    this.baseDecode = baseDecode;
    this.encoder = new Encoder(name, prefix, baseEncode);
    this.decoder = new Decoder(name, prefix, baseDecode);
  }
  encode(input) {
    return this.encoder.encode(input);
  }
  decode(input) {
    return this.decoder.decode(input);
  }
}
const from = ({name, prefix, encode, decode}) => new Codec(name, prefix, encode, decode);
const baseX = ({prefix, name, alphabet}) => {
  const {encode, decode} = _brrp__multiformats_scope_baseX(alphabet, name);
  return from({
    prefix,
    name,
    encode,
    decode: text => coerce(decode(text))
  });
};
const decode$1 = (string, alphabet, bitsPerChar, name) => {
  const codes = {};
  for (let i = 0; i < alphabet.length; ++i) {
    codes[alphabet[i]] = i;
  }
  let end = string.length;
  while (string[end - 1] === '=') {
    --end;
  }
  const out = new Uint8Array(end * bitsPerChar / 8 | 0);
  let bits = 0;
  let buffer = 0;
  let written = 0;
  for (let i = 0; i < end; ++i) {
    const value = codes[string[i]];
    if (value === undefined) {
      throw new SyntaxError(`Non-${ name } character`);
    }
    buffer = buffer << bitsPerChar | value;
    bits += bitsPerChar;
    if (bits >= 8) {
      bits -= 8;
      out[written++] = 255 & buffer >> bits;
    }
  }
  if (bits >= bitsPerChar || 255 & buffer << 8 - bits) {
    throw new SyntaxError('Unexpected end of data');
  }
  return out;
};
const encode$1 = (data, alphabet, bitsPerChar) => {
  const pad = alphabet[alphabet.length - 1] === '=';
  const mask = (1 << bitsPerChar) - 1;
  let out = '';
  let bits = 0;
  let buffer = 0;
  for (let i = 0; i < data.length; ++i) {
    buffer = buffer << 8 | data[i];
    bits += 8;
    while (bits > bitsPerChar) {
      bits -= bitsPerChar;
      out += alphabet[mask & buffer >> bits];
    }
  }
  if (bits) {
    out += alphabet[mask & buffer << bitsPerChar - bits];
  }
  if (pad) {
    while (out.length * bitsPerChar & 7) {
      out += '=';
    }
  }
  return out;
};
const rfc4648 = ({name, prefix, bitsPerChar, alphabet}) => {
  return from({
    prefix,
    name,
    encode(input) {
      return encode$1(input, alphabet, bitsPerChar);
    },
    decode(input) {
      return decode$1(input, alphabet, bitsPerChar, name);
    }
  });
};

const identity = from({
  prefix: '\0',
  name: 'identity',
  encode: buf => toString$1(buf),
  decode: str => fromString$1(str)
});

const identityBase = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    identity
}, Symbol.toStringTag, { value: 'Module' }));

const base2 = rfc4648({
  prefix: '0',
  name: 'base2',
  alphabet: '01',
  bitsPerChar: 1
});

const base2$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    base2
}, Symbol.toStringTag, { value: 'Module' }));

const base8 = rfc4648({
  prefix: '7',
  name: 'base8',
  alphabet: '01234567',
  bitsPerChar: 3
});

const base8$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    base8
}, Symbol.toStringTag, { value: 'Module' }));

const base10 = baseX({
  prefix: '9',
  name: 'base10',
  alphabet: '0123456789'
});

const base10$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    base10
}, Symbol.toStringTag, { value: 'Module' }));

const base16 = rfc4648({
  prefix: 'f',
  name: 'base16',
  alphabet: '0123456789abcdef',
  bitsPerChar: 4
});
const base16upper = rfc4648({
  prefix: 'F',
  name: 'base16upper',
  alphabet: '0123456789ABCDEF',
  bitsPerChar: 4
});

const base16$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    base16,
    base16upper
}, Symbol.toStringTag, { value: 'Module' }));

const base32 = rfc4648({
  prefix: 'b',
  name: 'base32',
  alphabet: 'abcdefghijklmnopqrstuvwxyz234567',
  bitsPerChar: 5
});
const base32upper = rfc4648({
  prefix: 'B',
  name: 'base32upper',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
  bitsPerChar: 5
});
const base32pad = rfc4648({
  prefix: 'c',
  name: 'base32pad',
  alphabet: 'abcdefghijklmnopqrstuvwxyz234567=',
  bitsPerChar: 5
});
const base32padupper = rfc4648({
  prefix: 'C',
  name: 'base32padupper',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=',
  bitsPerChar: 5
});
const base32hex = rfc4648({
  prefix: 'v',
  name: 'base32hex',
  alphabet: '0123456789abcdefghijklmnopqrstuv',
  bitsPerChar: 5
});
const base32hexupper = rfc4648({
  prefix: 'V',
  name: 'base32hexupper',
  alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUV',
  bitsPerChar: 5
});
const base32hexpad = rfc4648({
  prefix: 't',
  name: 'base32hexpad',
  alphabet: '0123456789abcdefghijklmnopqrstuv=',
  bitsPerChar: 5
});
const base32hexpadupper = rfc4648({
  prefix: 'T',
  name: 'base32hexpadupper',
  alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUV=',
  bitsPerChar: 5
});
const base32z = rfc4648({
  prefix: 'h',
  name: 'base32z',
  alphabet: 'ybndrfg8ejkmcpqxot1uwisza345h769',
  bitsPerChar: 5
});

const base32$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    base32,
    base32hex,
    base32hexpad,
    base32hexpadupper,
    base32hexupper,
    base32pad,
    base32padupper,
    base32upper,
    base32z
}, Symbol.toStringTag, { value: 'Module' }));

const base36 = baseX({
  prefix: 'k',
  name: 'base36',
  alphabet: '0123456789abcdefghijklmnopqrstuvwxyz'
});
const base36upper = baseX({
  prefix: 'K',
  name: 'base36upper',
  alphabet: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
});

const base36$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    base36,
    base36upper
}, Symbol.toStringTag, { value: 'Module' }));

const base58btc = baseX({
  name: 'base58btc',
  prefix: 'z',
  alphabet: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
});
const base58flickr = baseX({
  name: 'base58flickr',
  prefix: 'Z',
  alphabet: '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
});

const base58 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    base58btc,
    base58flickr
}, Symbol.toStringTag, { value: 'Module' }));

const base64 = rfc4648({
  prefix: 'm',
  name: 'base64',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
  bitsPerChar: 6
});
const base64pad = rfc4648({
  prefix: 'M',
  name: 'base64pad',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
  bitsPerChar: 6
});
const base64url = rfc4648({
  prefix: 'u',
  name: 'base64url',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
  bitsPerChar: 6
});
const base64urlpad = rfc4648({
  prefix: 'U',
  name: 'base64urlpad',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=',
  bitsPerChar: 6
});

const base64$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    base64,
    base64pad,
    base64url,
    base64urlpad
}, Symbol.toStringTag, { value: 'Module' }));

const alphabet = Array.from('\uD83D\uDE80\uD83E\uDE90\u2604\uD83D\uDEF0\uD83C\uDF0C\uD83C\uDF11\uD83C\uDF12\uD83C\uDF13\uD83C\uDF14\uD83C\uDF15\uD83C\uDF16\uD83C\uDF17\uD83C\uDF18\uD83C\uDF0D\uD83C\uDF0F\uD83C\uDF0E\uD83D\uDC09\u2600\uD83D\uDCBB\uD83D\uDDA5\uD83D\uDCBE\uD83D\uDCBF\uD83D\uDE02\u2764\uD83D\uDE0D\uD83E\uDD23\uD83D\uDE0A\uD83D\uDE4F\uD83D\uDC95\uD83D\uDE2D\uD83D\uDE18\uD83D\uDC4D\uD83D\uDE05\uD83D\uDC4F\uD83D\uDE01\uD83D\uDD25\uD83E\uDD70\uD83D\uDC94\uD83D\uDC96\uD83D\uDC99\uD83D\uDE22\uD83E\uDD14\uD83D\uDE06\uD83D\uDE44\uD83D\uDCAA\uD83D\uDE09\u263A\uD83D\uDC4C\uD83E\uDD17\uD83D\uDC9C\uD83D\uDE14\uD83D\uDE0E\uD83D\uDE07\uD83C\uDF39\uD83E\uDD26\uD83C\uDF89\uD83D\uDC9E\u270C\u2728\uD83E\uDD37\uD83D\uDE31\uD83D\uDE0C\uD83C\uDF38\uD83D\uDE4C\uD83D\uDE0B\uD83D\uDC97\uD83D\uDC9A\uD83D\uDE0F\uD83D\uDC9B\uD83D\uDE42\uD83D\uDC93\uD83E\uDD29\uD83D\uDE04\uD83D\uDE00\uD83D\uDDA4\uD83D\uDE03\uD83D\uDCAF\uD83D\uDE48\uD83D\uDC47\uD83C\uDFB6\uD83D\uDE12\uD83E\uDD2D\u2763\uD83D\uDE1C\uD83D\uDC8B\uD83D\uDC40\uD83D\uDE2A\uD83D\uDE11\uD83D\uDCA5\uD83D\uDE4B\uD83D\uDE1E\uD83D\uDE29\uD83D\uDE21\uD83E\uDD2A\uD83D\uDC4A\uD83E\uDD73\uD83D\uDE25\uD83E\uDD24\uD83D\uDC49\uD83D\uDC83\uD83D\uDE33\u270B\uD83D\uDE1A\uD83D\uDE1D\uD83D\uDE34\uD83C\uDF1F\uD83D\uDE2C\uD83D\uDE43\uD83C\uDF40\uD83C\uDF37\uD83D\uDE3B\uD83D\uDE13\u2B50\u2705\uD83E\uDD7A\uD83C\uDF08\uD83D\uDE08\uD83E\uDD18\uD83D\uDCA6\u2714\uD83D\uDE23\uD83C\uDFC3\uD83D\uDC90\u2639\uD83C\uDF8A\uD83D\uDC98\uD83D\uDE20\u261D\uD83D\uDE15\uD83C\uDF3A\uD83C\uDF82\uD83C\uDF3B\uD83D\uDE10\uD83D\uDD95\uD83D\uDC9D\uD83D\uDE4A\uD83D\uDE39\uD83D\uDDE3\uD83D\uDCAB\uD83D\uDC80\uD83D\uDC51\uD83C\uDFB5\uD83E\uDD1E\uD83D\uDE1B\uD83D\uDD34\uD83D\uDE24\uD83C\uDF3C\uD83D\uDE2B\u26BD\uD83E\uDD19\u2615\uD83C\uDFC6\uD83E\uDD2B\uD83D\uDC48\uD83D\uDE2E\uD83D\uDE46\uD83C\uDF7B\uD83C\uDF43\uD83D\uDC36\uD83D\uDC81\uD83D\uDE32\uD83C\uDF3F\uD83E\uDDE1\uD83C\uDF81\u26A1\uD83C\uDF1E\uD83C\uDF88\u274C\u270A\uD83D\uDC4B\uD83D\uDE30\uD83E\uDD28\uD83D\uDE36\uD83E\uDD1D\uD83D\uDEB6\uD83D\uDCB0\uD83C\uDF53\uD83D\uDCA2\uD83E\uDD1F\uD83D\uDE41\uD83D\uDEA8\uD83D\uDCA8\uD83E\uDD2C\u2708\uD83C\uDF80\uD83C\uDF7A\uD83E\uDD13\uD83D\uDE19\uD83D\uDC9F\uD83C\uDF31\uD83D\uDE16\uD83D\uDC76\uD83E\uDD74\u25B6\u27A1\u2753\uD83D\uDC8E\uD83D\uDCB8\u2B07\uD83D\uDE28\uD83C\uDF1A\uD83E\uDD8B\uD83D\uDE37\uD83D\uDD7A\u26A0\uD83D\uDE45\uD83D\uDE1F\uD83D\uDE35\uD83D\uDC4E\uD83E\uDD32\uD83E\uDD20\uD83E\uDD27\uD83D\uDCCC\uD83D\uDD35\uD83D\uDC85\uD83E\uDDD0\uD83D\uDC3E\uD83C\uDF52\uD83D\uDE17\uD83E\uDD11\uD83C\uDF0A\uD83E\uDD2F\uD83D\uDC37\u260E\uD83D\uDCA7\uD83D\uDE2F\uD83D\uDC86\uD83D\uDC46\uD83C\uDFA4\uD83D\uDE47\uD83C\uDF51\u2744\uD83C\uDF34\uD83D\uDCA3\uD83D\uDC38\uD83D\uDC8C\uD83D\uDCCD\uD83E\uDD40\uD83E\uDD22\uD83D\uDC45\uD83D\uDCA1\uD83D\uDCA9\uD83D\uDC50\uD83D\uDCF8\uD83D\uDC7B\uD83E\uDD10\uD83E\uDD2E\uD83C\uDFBC\uD83E\uDD75\uD83D\uDEA9\uD83C\uDF4E\uD83C\uDF4A\uD83D\uDC7C\uD83D\uDC8D\uD83D\uDCE3\uD83E\uDD42');
const alphabetBytesToChars = alphabet.reduce((p, c, i) => {
  p[i] = c;
  return p;
}, []);
const alphabetCharsToBytes = alphabet.reduce((p, c, i) => {
  p[c.codePointAt(0)] = i;
  return p;
}, []);
function encode(data) {
  return data.reduce((p, c) => {
    p += alphabetBytesToChars[c];
    return p;
  }, '');
}
function decode(str) {
  const byts = [];
  for (const char of str) {
    const byt = alphabetCharsToBytes[char.codePointAt(0)];
    if (byt === undefined) {
      throw new Error(`Non-base256emoji character: ${ char }`);
    }
    byts.push(byt);
  }
  return new Uint8Array(byts);
}
const base256emoji = from({
  prefix: '\uD83D\uDE80',
  name: 'base256emoji',
  encode,
  decode
});

const base256emoji$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    base256emoji
}, Symbol.toStringTag, { value: 'Module' }));

new TextEncoder();
new TextDecoder();

const bases = {
  ...identityBase,
  ...base2$1,
  ...base8$1,
  ...base10$1,
  ...base16$1,
  ...base32$1,
  ...base36$1,
  ...base58,
  ...base64$1,
  ...base256emoji$1
};

function createCodec(name, prefix, encode, decode) {
  return {
    name,
    prefix,
    encoder: {
      name,
      prefix,
      encode
    },
    decoder: { decode }
  };
}
const string = createCodec('utf8', 'u', buf => {
  const decoder = new TextDecoder('utf8');
  return 'u' + decoder.decode(buf);
}, str => {
  const encoder = new TextEncoder();
  return encoder.encode(str.substring(1));
});
const ascii = createCodec('ascii', 'a', buf => {
  let string = 'a';
  for (let i = 0; i < buf.length; i++) {
    string += String.fromCharCode(buf[i]);
  }
  return string;
}, str => {
  str = str.substring(1);
  const buf = allocUnsafe(str.length);
  for (let i = 0; i < str.length; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
});
const BASES = {
  utf8: string,
  'utf-8': string,
  hex: bases.base16,
  latin1: ascii,
  ascii: ascii,
  binary: ascii,
  ...bases
};

function fromString(string, encoding = "utf8") {
  const base = BASES[encoding];
  if (!base) {
    throw new Error(`Unsupported encoding "${encoding}"`);
  }
  if ((encoding === "utf8" || encoding === "utf-8") && globalThis.Buffer != null && globalThis.Buffer.from != null) {
    return globalThis.Buffer.from(string, "utf8");
  }
  return base.decoder.decode(`${base.prefix}${string}`);
}

function toString(array, encoding = "utf8") {
  const base = BASES[encoding];
  if (!base) {
    throw new Error(`Unsupported encoding "${encoding}"`);
  }
  if ((encoding === "utf8" || encoding === "utf-8") && globalThis.Buffer != null && globalThis.Buffer.from != null) {
    return globalThis.Buffer.from(array.buffer, array.byteOffset, array.byteLength).toString("utf8");
  }
  return base.encoder.encode(array).substring(1);
}

const C$4={waku:{publish:"waku_publish",batchPublish:"waku_batchPublish",subscribe:"waku_subscribe",batchSubscribe:"waku_batchSubscribe",subscription:"waku_subscription",unsubscribe:"waku_unsubscribe",batchUnsubscribe:"waku_batchUnsubscribe",batchFetchMessages:"waku_batchFetchMessages"},irn:{publish:"irn_publish",batchPublish:"irn_batchPublish",subscribe:"irn_subscribe",batchSubscribe:"irn_batchSubscribe",subscription:"irn_subscription",unsubscribe:"irn_unsubscribe",batchUnsubscribe:"irn_batchUnsubscribe",batchFetchMessages:"irn_batchFetchMessages"},iridium:{publish:"iridium_publish",batchPublish:"iridium_batchPublish",subscribe:"iridium_subscribe",batchSubscribe:"iridium_batchSubscribe",subscription:"iridium_subscription",unsubscribe:"iridium_unsubscribe",batchUnsubscribe:"iridium_batchUnsubscribe",batchFetchMessages:"iridium_batchFetchMessages"}};

var define_process_env_default$1 = { };
const ae$2 = ":";
function Ne$1(t) {
  const [e, n] = t.split(ae$2);
  return { namespace: e, reference: n };
}
function Ko$1(t, e = []) {
  const n = [];
  return Object.keys(t).forEach((r) => {
    if (e.length && !e.includes(r)) return;
    const o = t[r];
    n.push(...o.accounts);
  }), n;
}
function ue$2(t, e) {
  return t.includes(":") ? [t] : e.chains || [];
}
var Zo = Object.defineProperty, Yo$1 = Object.defineProperties, Go$1 = Object.getOwnPropertyDescriptors, Tn$1 = Object.getOwnPropertySymbols, Wo$1 = Object.prototype.hasOwnProperty, Xo$1 = Object.prototype.propertyIsEnumerable, Rn$1 = (t, e, n) => e in t ? Zo(t, e, { enumerable: true, configurable: true, writable: true, value: n }) : t[e] = n, _n$1 = (t, e) => {
  for (var n in e || (e = {})) Wo$1.call(e, n) && Rn$1(t, n, e[n]);
  if (Tn$1) for (var n of Tn$1(e)) Xo$1.call(e, n) && Rn$1(t, n, e[n]);
  return t;
}, Jo$1 = (t, e) => Yo$1(t, Go$1(e));
const $n$1 = "ReactNative", Y$3 = { reactNative: "react-native", node: "node", browser: "browser", unknown: "unknown" }, jn$1 = "js";
function _e$3() {
  return typeof process < "u" && typeof process.versions < "u" && typeof process.versions.node < "u";
}
function pt$2() {
  return !getDocument_1() && !!getNavigator_1() && navigator.product === $n$1;
}
function ei$1() {
  return pt$2() && typeof globalThis < "u" && typeof (globalThis == null ? void 0 : globalThis.Platform) < "u" && (globalThis == null ? void 0 : globalThis.Platform.OS) === "android";
}
function ni$1() {
  return pt$2() && typeof globalThis < "u" && typeof (globalThis == null ? void 0 : globalThis.Platform) < "u" && (globalThis == null ? void 0 : globalThis.Platform.OS) === "ios";
}
function Tt$2() {
  return !_e$3() && !!getNavigator_1() && !!getDocument_1();
}
function xt$2() {
  return pt$2() ? Y$3.reactNative : _e$3() ? Y$3.node : Tt$2() ? Y$3.browser : Y$3.unknown;
}
function ri$1() {
  var t;
  try {
    return pt$2() && typeof globalThis < "u" && typeof (globalThis == null ? void 0 : globalThis.Application) < "u" ? (t = globalThis.Application) == null ? void 0 : t.applicationId : void 0;
  } catch {
    return;
  }
}
function Cn$1(t, e) {
  const n = new URLSearchParams(t);
  for (const r of Object.keys(e).sort()) if (e.hasOwnProperty(r)) {
    const o = e[r];
    o !== void 0 && n.set(r, o);
  }
  return n.toString();
}
function oi$1(t) {
  var e, n;
  const r = Pn$1();
  try {
    return t != null && t.url && r.url && new URL(t.url).host !== new URL(r.url).host && (console.warn(`The configured WalletConnect 'metadata.url':${t.url} differs from the actual page url:${r.url}. This is probably unintended and can lead to issues.`), t.url = r.url), (e = t?.icons) != null && e.length && t.icons.length > 0 && (t.icons = t.icons.filter((o) => o !== "")), Jo$1(_n$1(_n$1({}, r), t), { url: t?.url || r.url, name: t?.name || r.name, description: t?.description || r.description, icons: (n = t?.icons) != null && n.length && t.icons.length > 0 ? t.icons : r.icons });
  } catch (o) {
    return console.warn("Error populating app metadata", o), t || r;
  }
}
function Pn$1() {
  return getWindowMetadata_1() || { name: "", description: "", url: "", icons: [""] };
}
function kn$1() {
  if (xt$2() === Y$3.reactNative && typeof globalThis < "u" && typeof (globalThis == null ? void 0 : globalThis.Platform) < "u") {
    const { OS: n, Version: r } = globalThis.Platform;
    return [n, r].join("-");
  }
  const t = detect();
  if (t === null) return "unknown";
  const e = t.os ? t.os.replace(" ", "").toLowerCase() : "unknown";
  return t.type === "browser" ? [e, t.name, t.version].join("-") : [e, t.version].join("-");
}
function Vn$1() {
  var t;
  const e = xt$2();
  return e === Y$3.browser ? [e, ((t = getLocation_1()) == null ? void 0 : t.host) || "unknown"].join(":") : e;
}
function Mn$1(t, e, n) {
  const r = kn$1(), o = Vn$1();
  return [[t, e].join("-"), [jn$1, n].join("-"), r, o].join("/");
}
function si$1({ protocol: t, version: e, relayUrl: n, sdkVersion: r, auth: o, projectId: i, useOnCloseEvent: s, bundleId: c, packageName: a }) {
  const u = n.split("?"), l = Mn$1(t, e, r), f = { auth: o, ua: l, projectId: i, useOnCloseEvent: s, packageName: a || void 0, bundleId: c || void 0 }, h = Cn$1(u[1] || "", f);
  return u[0] + "?" + h;
}
function gt$2(t, e) {
  return t.filter((n) => e.includes(n)).length === t.length;
}
function fi$1(t) {
  return Object.fromEntries(t.entries());
}
function li$1(t) {
  return new Map(Object.entries(t));
}
function gi$1(t = cjs$3.FIVE_MINUTES, e) {
  const n = cjs$3.toMiliseconds(t || cjs$3.FIVE_MINUTES);
  let r, o, i, s;
  return { resolve: (c) => {
    i && r && (clearTimeout(i), r(c), s = Promise.resolve(c));
  }, reject: (c) => {
    i && o && (clearTimeout(i), o(c));
  }, done: () => new Promise((c, a) => {
    if (s) return c(s);
    i = setTimeout(() => {
      const u = new Error(e);
      s = Promise.reject(u), a(u);
    }, n), r = c, o = a;
  }) };
}
function yi$1(t, e, n) {
  return new Promise(async (r, o) => {
    const i = setTimeout(() => o(new Error(n)), e);
    try {
      const s = await t;
      r(s);
    } catch (s) {
      o(s);
    }
    clearTimeout(i);
  });
}
function $e$2(t, e) {
  if (typeof e == "string" && e.startsWith(`${t}:`)) return e;
  if (t.toLowerCase() === "topic") {
    if (typeof e != "string") throw new Error('Value must be "string" for expirer target type: topic');
    return `topic:${e}`;
  } else if (t.toLowerCase() === "id") {
    if (typeof e != "number") throw new Error('Value must be "number" for expirer target type: id');
    return `id:${e}`;
  }
  throw new Error(`Unknown expirer target type: ${t}`);
}
function mi$1(t) {
  return $e$2("topic", t);
}
function wi$1(t) {
  return $e$2("id", t);
}
function bi$1(t) {
  const [e, n] = t.split(":"), r = { id: void 0, topic: void 0 };
  if (e === "topic" && typeof n == "string") r.topic = n;
  else if (e === "id" && Number.isInteger(Number(n))) r.id = Number(n);
  else throw new Error(`Invalid target, expected id:number or topic:string, got ${e}:${n}`);
  return r;
}
function Ei$1(t, e) {
  return cjs$3.fromMiliseconds((Date.now()) + cjs$3.toMiliseconds(t));
}
function vi$1(t) {
  return Date.now() >= cjs$3.toMiliseconds(t);
}
function xi$1(t, e) {
  return `${t}${e ? `:${e}` : ""}`;
}
function ot$1(t = [], e = []) {
  return [.../* @__PURE__ */ new Set([...t, ...e])];
}
async function Si$1({ id: t, topic: e, wcDeepLink: n }) {
  var r;
  try {
    if (!n) return;
    const o = typeof n == "string" ? JSON.parse(n) : n, i = o?.href;
    if (typeof i != "string") return;
    const s = Kn$1(i, t, e), c = xt$2();
    if (c === Y$3.browser) {
      if (!((r = getDocument_1()) != null && r.hasFocus())) {
        console.warn("Document does not have focus, skipping deeplink.");
        return;
      }
      Fn$1(s);
    } else c === Y$3.reactNative && typeof (globalThis == null ? void 0 : globalThis.Linking) < "u" && await globalThis.Linking.openURL(s);
  } catch (o) {
    console.error(o);
  }
}
function Kn$1(t, e, n) {
  const r = `requestId=${e}&sessionTopic=${n}`;
  t.endsWith("/") && (t = t.slice(0, -1));
  let o = `${t}`;
  if (t.startsWith("https://t.me")) {
    const i = t.includes("?") ? "&startapp=" : "?startapp=";
    o = `${o}${i}${Yn$1(r, true)}`;
  } else o = `${o}/wc?${r}`;
  return o;
}
function Fn$1(t) {
  let e = "_self";
  Zn$1() ? e = "_top" : (zn$1() || t.startsWith("https://") || t.startsWith("http://")) && (e = "_blank"), window.open(t, e, "noreferrer noopener");
}
async function Oi$1(t, e) {
  let n = "";
  try {
    if (Tt$2() && (n = localStorage.getItem(e), n)) return n;
    n = await t.getItem(e);
  } catch (r) {
    console.error(r);
  }
  return n;
}
function Ai$1(t, e) {
  if (!t.includes(e)) return null;
  const n = t.split(/([&,?,=])/), r = n.indexOf(e);
  return n[r + 2];
}
function Bi$1() {
  return typeof crypto < "u" && crypto != null && crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/gu, (t) => {
    const e = Math.random() * 16 | 0;
    return (t === "x" ? e : e & 3 | 8).toString(16);
  });
}
function Ii$1() {
  return typeof process < "u" && define_process_env_default$1.IS_VITEST === "true";
}
function zn$1() {
  return typeof window < "u" && (!!window.TelegramWebviewProxy || !!window.Telegram || !!window.TelegramWebviewProxyProto);
}
function Zn$1() {
  try {
    return window.self !== window.top;
  } catch {
    return false;
  }
}
function Yn$1(t, e = false) {
  const n = Buffer.from(t).toString("base64");
  return e ? n.replace(/[=]/g, "") : n;
}
function je$2(t) {
  return Buffer.from(t, "base64").toString("utf-8");
}
function Ni$1(t) {
  return new Promise((e) => setTimeout(e, t));
}
function Wt$2(t) {
  if (!Number.isSafeInteger(t) || t < 0) throw new Error("positive integer expected, got " + t);
}
function Ui$1(t) {
  return t instanceof Uint8Array || ArrayBuffer.isView(t) && t.constructor.name === "Uint8Array";
}
function Xt$2(t, ...e) {
  if (!Ui$1(t)) throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(t.length)) throw new Error("Uint8Array expected of length " + e + ", got length=" + t.length);
}
function Ce$1(t) {
  if (typeof t != "function" || typeof t.create != "function") throw new Error("Hash should be wrapped by utils.wrapConstructor");
  Wt$2(t.outputLen), Wt$2(t.blockLen);
}
function Rt$2(t, e = true) {
  if (t.destroyed) throw new Error("Hash instance has been destroyed");
  if (e && t.finished) throw new Error("Hash#digest() has already been called");
}
function Gn$1(t, e) {
  Xt$2(t);
  const n = e.outputLen;
  if (t.length < n) throw new Error("digestInto() expects output buffer of length at least " + n);
}
const le$2 = BigInt(2 ** 32 - 1), Wn$1 = BigInt(32);
function Ti$1(t, e = false) {
  return e ? { h: Number(t & le$2), l: Number(t >> Wn$1 & le$2) } : { h: Number(t >> Wn$1 & le$2) | 0, l: Number(t & le$2) | 0 };
}
function Ri$1(t, e = false) {
  let n = new Uint32Array(t.length), r = new Uint32Array(t.length);
  for (let o = 0; o < t.length; o++) {
    const { h: i, l: s } = Ti$1(t[o], e);
    [n[o], r[o]] = [i, s];
  }
  return [n, r];
}
const _i$1 = (t, e, n) => t << n | e >>> 32 - n, $i$1 = (t, e, n) => e << n | t >>> 32 - n, Li$1 = (t, e, n) => e << n - 32 | t >>> 64 - n, ji$1 = (t, e, n) => t << n - 32 | e >>> 64 - n, _t$2 = typeof globalThis == "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
function Ci$1(t) {
  return new Uint32Array(t.buffer, t.byteOffset, Math.floor(t.byteLength / 4));
}
function Pe$1(t) {
  return new DataView(t.buffer, t.byteOffset, t.byteLength);
}
function ct$1(t, e) {
  return t << 32 - e | t >>> e;
}
const Xn$1 = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
function Pi$1(t) {
  return t << 24 & 4278190080 | t << 8 & 16711680 | t >>> 8 & 65280 | t >>> 24 & 255;
}
function Jn$1(t) {
  for (let e = 0; e < t.length; e++) t[e] = Pi$1(t[e]);
}
function ki$1(t) {
  if (typeof t != "string") throw new Error("utf8ToBytes expected string, got " + typeof t);
  return new Uint8Array(new TextEncoder().encode(t));
}
function $t$1(t) {
  return typeof t == "string" && (t = ki$1(t)), Xt$2(t), t;
}
function Vi$1(...t) {
  let e = 0;
  for (let r = 0; r < t.length; r++) {
    const o = t[r];
    Xt$2(o), e += o.length;
  }
  const n = new Uint8Array(e);
  for (let r = 0, o = 0; r < t.length; r++) {
    const i = t[r];
    n.set(i, o), o += i.length;
  }
  return n;
}
let ke$3 = class ke {
  clone() {
    return this._cloneInto();
  }
};
function Qn$1(t) {
  const e = (r) => t().update($t$1(r)).digest(), n = t();
  return e.outputLen = n.outputLen, e.blockLen = n.blockLen, e.create = () => t(), e;
}
function Lt$2(t = 32) {
  if (_t$2 && typeof _t$2.getRandomValues == "function") return _t$2.getRandomValues(new Uint8Array(t));
  if (_t$2 && typeof _t$2.randomBytes == "function") return _t$2.randomBytes(t);
  throw new Error("crypto.getRandomValues must be defined");
}
const tr$1 = [], er$1 = [], nr$1 = [], Mi$1 = BigInt(0), Jt$2 = BigInt(1), Di$1 = BigInt(2), Hi = BigInt(7), qi$1 = BigInt(256), Ki$1 = BigInt(113);
for (let t = 0, e = Jt$2, n = 1, r = 0; t < 24; t++) {
  [n, r] = [r, (2 * n + 3 * r) % 5], tr$1.push(2 * (5 * r + n)), er$1.push((t + 1) * (t + 2) / 2 % 64);
  let o = Mi$1;
  for (let i = 0; i < 7; i++) e = (e << Jt$2 ^ (e >> Hi) * Ki$1) % qi$1, e & Di$1 && (o ^= Jt$2 << (Jt$2 << BigInt(i)) - Jt$2);
  nr$1.push(o);
}
const [Fi$1, zi$1] = Ri$1(nr$1, true), rr$1 = (t, e, n) => n > 32 ? Li$1(t, e, n) : _i$1(t, e, n), or$1 = (t, e, n) => n > 32 ? ji$1(t, e, n) : $i$1(t, e, n);
function Zi(t, e = 24) {
  const n = new Uint32Array(10);
  for (let r = 24 - e; r < 24; r++) {
    for (let s = 0; s < 10; s++) n[s] = t[s] ^ t[s + 10] ^ t[s + 20] ^ t[s + 30] ^ t[s + 40];
    for (let s = 0; s < 10; s += 2) {
      const c = (s + 8) % 10, a = (s + 2) % 10, u = n[a], l = n[a + 1], f = rr$1(u, l, 1) ^ n[c], h = or$1(u, l, 1) ^ n[c + 1];
      for (let y = 0; y < 50; y += 10) t[s + y] ^= f, t[s + y + 1] ^= h;
    }
    let o = t[2], i = t[3];
    for (let s = 0; s < 24; s++) {
      const c = er$1[s], a = rr$1(o, i, c), u = or$1(o, i, c), l = tr$1[s];
      o = t[l], i = t[l + 1], t[l] = a, t[l + 1] = u;
    }
    for (let s = 0; s < 50; s += 10) {
      for (let c = 0; c < 10; c++) n[c] = t[s + c];
      for (let c = 0; c < 10; c++) t[s + c] ^= ~n[(c + 2) % 10] & n[(c + 4) % 10];
    }
    t[0] ^= Fi$1[r], t[1] ^= zi$1[r];
  }
  n.fill(0);
}
let En$1 = class En extends ke$3 {
  constructor(e, n, r, o = false, i = 24) {
    if (super(), this.blockLen = e, this.suffix = n, this.outputLen = r, this.enableXOF = o, this.rounds = i, this.pos = 0, this.posOut = 0, this.finished = false, this.destroyed = false, Wt$2(r), 0 >= this.blockLen || this.blockLen >= 200) throw new Error("Sha3 supports only keccak-f1600 function");
    this.state = new Uint8Array(200), this.state32 = Ci$1(this.state);
  }
  keccak() {
    Xn$1 || Jn$1(this.state32), Zi(this.state32, this.rounds), Xn$1 || Jn$1(this.state32), this.posOut = 0, this.pos = 0;
  }
  update(e) {
    Rt$2(this);
    const { blockLen: n, state: r } = this;
    e = $t$1(e);
    const o = e.length;
    for (let i = 0; i < o; ) {
      const s = Math.min(n - this.pos, o - i);
      for (let c = 0; c < s; c++) r[this.pos++] ^= e[i++];
      this.pos === n && this.keccak();
    }
    return this;
  }
  finish() {
    if (this.finished) return;
    this.finished = true;
    const { state: e, suffix: n, pos: r, blockLen: o } = this;
    e[r] ^= n, (n & 128) !== 0 && r === o - 1 && this.keccak(), e[o - 1] ^= 128, this.keccak();
  }
  writeInto(e) {
    Rt$2(this, false), Xt$2(e), this.finish();
    const n = this.state, { blockLen: r } = this;
    for (let o = 0, i = e.length; o < i; ) {
      this.posOut >= r && this.keccak();
      const s = Math.min(r - this.posOut, i - o);
      e.set(n.subarray(this.posOut, this.posOut + s), o), this.posOut += s, o += s;
    }
    return e;
  }
  xofInto(e) {
    if (!this.enableXOF) throw new Error("XOF is not possible for this instance");
    return this.writeInto(e);
  }
  xof(e) {
    return Wt$2(e), this.xofInto(new Uint8Array(e));
  }
  digestInto(e) {
    if (Gn$1(e, this), this.finished) throw new Error("digest() was already called");
    return this.writeInto(e), this.destroy(), e;
  }
  digest() {
    return this.digestInto(new Uint8Array(this.outputLen));
  }
  destroy() {
    this.destroyed = true, this.state.fill(0);
  }
  _cloneInto(e) {
    const { blockLen: n, suffix: r, outputLen: o, rounds: i, enableXOF: s } = this;
    return e || (e = new En(n, r, o, s, i)), e.state32.set(this.state32), e.pos = this.pos, e.posOut = this.posOut, e.finished = this.finished, e.rounds = i, e.suffix = r, e.outputLen = o, e.enableXOF = s, e.destroyed = this.destroyed, e;
  }
};
const Yi = (t, e, n) => Qn$1(() => new En$1(e, t, n)), Gi = Yi(1, 136, 256 / 8), Wi = "https://rpc.walletconnect.org/v1";
function Ve$2(t) {
  const e = `Ethereum Signed Message:
${t.length}`, n = new TextEncoder().encode(e + t);
  return "0x" + Buffer.from(Gi(n)).toString("hex");
}
async function ir$1(t, e, n, r, o, i) {
  switch (n.t) {
    case "eip191":
      return await sr$1(t, e, n.s);
    case "eip1271":
      return await cr$1(t, e, n.s, r, o, i);
    default:
      throw new Error(`verifySignature failed: Attempted to verify CacaoSignature with unknown type: ${n.t}`);
  }
}
async function sr$1(t, e, n) {
  return (await recoverAddress({ hash: Ve$2(e), signature: n })).toLowerCase() === t.toLowerCase();
}
async function cr$1(t, e, n, r, o, i) {
  const s = Ne$1(r);
  if (!s.namespace || !s.reference) throw new Error(`isValidEip1271Signature failed: chainId must be in CAIP-2 format, received: ${r}`);
  try {
    const c = "0x1626ba7e", a = "0000000000000000000000000000000000000000000000000000000000000040", u = "0000000000000000000000000000000000000000000000000000000000000041", l = n.substring(2), f = Ve$2(e).substring(2), h = c + f + a + u + l, y = await fetch(`${i || Wi}/?chainId=${r}&projectId=${o}`, { method: "POST", body: JSON.stringify({ id: Xi(), jsonrpc: "2.0", method: "eth_call", params: [{ to: t, data: h }, "latest"] }) }), { result: E } = await y.json();
    return E ? E.slice(0, c.length).toLowerCase() === c.toLowerCase() : false;
  } catch (c) {
    return console.error("isValidEip1271Signature: ", c), false;
  }
}
function Xi() {
  return Date.now() + Math.floor(Math.random() * 1e3);
}
function Ji(t) {
  const e = atob(t), n = new Uint8Array(e.length);
  for (let s = 0; s < e.length; s++) n[s] = e.charCodeAt(s);
  const r = n[0];
  if (r === 0) throw new Error("No signatures found");
  const o = 1 + r * 64;
  if (n.length < o) throw new Error("Transaction data too short for claimed signature count");
  if (n.length < 100) throw new Error("Transaction too short");
  const i = Buffer.from(t, "base64").slice(1, 65);
  return Vo$2.encode(i);
}
var Qi = Object.defineProperty, ts$1 = Object.defineProperties, es$1 = Object.getOwnPropertyDescriptors, ar$1 = Object.getOwnPropertySymbols, ns = Object.prototype.hasOwnProperty, rs = Object.prototype.propertyIsEnumerable, ur$1 = (t, e, n) => e in t ? Qi(t, e, { enumerable: true, configurable: true, writable: true, value: n }) : t[e] = n, Me$3 = (t, e) => {
  for (var n in e || (e = {})) ns.call(e, n) && ur$1(t, n, e[n]);
  if (ar$1) for (var n of ar$1(e)) rs.call(e, n) && ur$1(t, n, e[n]);
  return t;
}, fr$1 = (t, e) => ts$1(t, es$1(e));
const os = "did:pkh:", de$2 = (t) => t?.split(":"), lr$1 = (t) => {
  const e = t && de$2(t);
  if (e) return t.includes(os) ? e[3] : e[1];
}, dr$1 = (t) => {
  const e = t && de$2(t);
  if (e) return e[2] + ":" + e[3];
}, De$2 = (t) => {
  const e = t && de$2(t);
  if (e) return e.pop();
};
async function is(t) {
  const { cacao: e, projectId: n } = t, { s: r, p: o } = e, i = hr$1(o, o.iss), s = De$2(o.iss);
  return await ir$1(s, i, r, dr$1(o.iss), n);
}
const hr$1 = (t, e) => {
  const n = `${t.domain} wants you to sign in with your Ethereum account:`, r = De$2(e);
  if (!t.aud && !t.uri) throw new Error("Either `aud` or `uri` is required to construct the message");
  let o = t.statement || void 0;
  const i = `URI: ${t.aud || t.uri}`, s = `Version: ${t.version}`, c = `Chain ID: ${lr$1(e)}`, a = `Nonce: ${t.nonce}`, u = `Issued At: ${t.iat}`, l = t.exp ? `Expiration Time: ${t.exp}` : void 0, f = t.nbf ? `Not Before: ${t.nbf}` : void 0, h = t.requestId ? `Request ID: ${t.requestId}` : void 0, y = t.resources ? `Resources:${t.resources.map((p) => `
- ${p}`).join("")}` : void 0, E = pe$2(t.resources);
  if (E) {
    const p = yt$2(E);
    o = Ke$3(o, p);
  }
  return [n, r, "", o, "", i, s, c, a, u, l, f, h, y].filter((p) => p != null).join(`
`);
};
function mr$1(t) {
  return Buffer.from(JSON.stringify(t)).toString("base64");
}
function wr$1(t) {
  return JSON.parse(Buffer.from(t, "base64").toString("utf-8"));
}
function at$1(t) {
  if (!t) throw new Error("No recap provided, value is undefined");
  if (!t.att) throw new Error("No `att` property found");
  const e = Object.keys(t.att);
  if (!(e != null && e.length)) throw new Error("No resources found in `att` property");
  e.forEach((n) => {
    const r = t.att[n];
    if (Array.isArray(r)) throw new Error(`Resource must be an object: ${n}`);
    if (typeof r != "object") throw new Error(`Resource must be an object: ${n}`);
    if (!Object.keys(r).length) throw new Error(`Resource object is empty: ${n}`);
    Object.keys(r).forEach((o) => {
      const i = r[o];
      if (!Array.isArray(i)) throw new Error(`Ability limits ${o} must be an array of objects, found: ${i}`);
      if (!i.length) throw new Error(`Value of ${o} is empty array, must be an array with objects`);
      i.forEach((s) => {
        if (typeof s != "object") throw new Error(`Ability limits (${o}) must be an array of objects, found: ${s}`);
      });
    });
  });
}
function br$1(t, e, n, r = {}) {
  return n?.sort((o, i) => o.localeCompare(i)), { att: { [t]: He$2(e, n, r) } };
}
function He$2(t, e, n = {}) {
  e = e?.sort((o, i) => o.localeCompare(i));
  const r = e.map((o) => ({ [`${t}/${o}`]: [n] }));
  return Object.assign({}, ...r);
}
function he$2(t) {
  return at$1(t), `urn:recap:${mr$1(t).replace(/=/g, "")}`;
}
function yt$2(t) {
  const e = wr$1(t.replace("urn:recap:", ""));
  return at$1(e), e;
}
function fs(t, e, n) {
  const r = br$1(t, e, n);
  return he$2(r);
}
function qe$2(t) {
  return t && t.includes("urn:recap:");
}
function ls(t, e) {
  const n = yt$2(t), r = yt$2(e), o = vr$1(n, r);
  return he$2(o);
}
function vr$1(t, e) {
  at$1(t), at$1(e);
  const n = Object.keys(t.att).concat(Object.keys(e.att)).sort((o, i) => o.localeCompare(i)), r = { att: {} };
  return n.forEach((o) => {
    var i, s;
    Object.keys(((i = t.att) == null ? void 0 : i[o]) || {}).concat(Object.keys(((s = e.att) == null ? void 0 : s[o]) || {})).sort((c, a) => c.localeCompare(a)).forEach((c) => {
      var a, u;
      r.att[o] = fr$1(Me$3({}, r.att[o]), { [c]: ((a = t.att[o]) == null ? void 0 : a[c]) || ((u = e.att[o]) == null ? void 0 : u[c]) });
    });
  }), r;
}
function Ke$3(t = "", e) {
  at$1(e);
  const n = "I further authorize the stated URI to perform the following actions on my behalf: ";
  if (t.includes(n)) return t;
  const r = [];
  let o = 0;
  Object.keys(e.att).forEach((c) => {
    const a = Object.keys(e.att[c]).map((f) => ({ ability: f.split("/")[0], action: f.split("/")[1] }));
    a.sort((f, h) => f.action.localeCompare(h.action));
    const u = {};
    a.forEach((f) => {
      u[f.ability] || (u[f.ability] = []), u[f.ability].push(f.action);
    });
    const l = Object.keys(u).map((f) => (o++, `(${o}) '${f}': '${u[f].join("', '")}' for '${c}'.`));
    r.push(l.join(", ").replace(".,", "."));
  });
  const i = r.join(" "), s = `${n}${i}`;
  return `${t ? t + " " : ""}${s}`;
}
function ds(t) {
  var e;
  const n = yt$2(t);
  at$1(n);
  const r = (e = n.att) == null ? void 0 : e.eip155;
  return r ? Object.keys(r).map((o) => o.split("/")[1]) : [];
}
function hs(t) {
  const e = yt$2(t);
  at$1(e);
  const n = [];
  return Object.values(e.att).forEach((r) => {
    Object.values(r).forEach((o) => {
      var i;
      (i = o?.[0]) != null && i.chains && n.push(o[0].chains);
    });
  }), [...new Set(n.flat())];
}
function pe$2(t) {
  if (!t) return;
  const e = t?.[t.length - 1];
  return qe$2(e) ? e : void 0;
}
function Fe$2(t) {
  if (!Number.isSafeInteger(t) || t < 0) throw new Error("positive integer expected, got " + t);
}
function Sr$1(t) {
  return t instanceof Uint8Array || ArrayBuffer.isView(t) && t.constructor.name === "Uint8Array";
}
function tt$1(t, ...e) {
  if (!Sr$1(t)) throw new Error("Uint8Array expected");
  if (e.length > 0 && !e.includes(t.length)) throw new Error("Uint8Array expected of length " + e + ", got length=" + t.length);
}
function Or$1(t, e = true) {
  if (t.destroyed) throw new Error("Hash instance has been destroyed");
  if (e && t.finished) throw new Error("Hash#digest() has already been called");
}
function ps(t, e) {
  tt$1(t);
  const n = e.outputLen;
  if (t.length < n) throw new Error("digestInto() expects output buffer of length at least " + n);
}
function Ar$1(t) {
  if (typeof t != "boolean") throw new Error(`boolean expected, not ${t}`);
}
const mt$2 = (t) => new Uint32Array(t.buffer, t.byteOffset, Math.floor(t.byteLength / 4)), gs = (t) => new DataView(t.buffer, t.byteOffset, t.byteLength), ys = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
if (!ys) throw new Error("Non little-endian hardware is not supported");
function ms(t) {
  if (typeof t != "string") throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(t));
}
function ze$2(t) {
  if (typeof t == "string") t = ms(t);
  else if (Sr$1(t)) t = Ze$2(t);
  else throw new Error("Uint8Array expected, got " + typeof t);
  return t;
}
function ws(t, e) {
  if (e == null || typeof e != "object") throw new Error("options must be defined");
  return Object.assign(t, e);
}
function bs$1(t, e) {
  if (t.length !== e.length) return false;
  let n = 0;
  for (let r = 0; r < t.length; r++) n |= t[r] ^ e[r];
  return n === 0;
}
const Es = (t, e) => {
  function n(r, ...o) {
    if (tt$1(r), t.nonceLength !== void 0) {
      const l = o[0];
      if (!l) throw new Error("nonce / iv required");
      t.varSizeNonce ? tt$1(l) : tt$1(l, t.nonceLength);
    }
    const i = t.tagLength;
    i && o[1] !== void 0 && tt$1(o[1]);
    const s = e(r, ...o), c = (l, f) => {
      if (f !== void 0) {
        if (l !== 2) throw new Error("cipher output not supported");
        tt$1(f);
      }
    };
    let a = false;
    return { encrypt(l, f) {
      if (a) throw new Error("cannot encrypt() twice with same key + nonce");
      return a = true, tt$1(l), c(s.encrypt.length, f), s.encrypt(l, f);
    }, decrypt(l, f) {
      if (tt$1(l), i && l.length < i) throw new Error("invalid ciphertext length: smaller than tagLength=" + i);
      return c(s.decrypt.length, f), s.decrypt(l, f);
    } };
  }
  return Object.assign(n, t), n;
};
function Br$1(t, e, n = true) {
  if (e === void 0) return new Uint8Array(t);
  if (e.length !== t) throw new Error("invalid output length, expected " + t + ", got: " + e.length);
  if (n && !vs$1(e)) throw new Error("invalid output, must be aligned");
  return e;
}
function Ir$1(t, e, n, r) {
  if (typeof t.setBigUint64 == "function") return t.setBigUint64(e, n, r);
  const o = BigInt(32), i = BigInt(4294967295), s = Number(n >> o & i), c = Number(n & i), a = 4 , u = 0 ;
  t.setUint32(e + a, s, r), t.setUint32(e + u, c, r);
}
function vs$1(t) {
  return t.byteOffset % 4 === 0;
}
function Ze$2(t) {
  return Uint8Array.from(t);
}
function jt$2(...t) {
  for (let e = 0; e < t.length; e++) t[e].fill(0);
}
const Nr$1 = (t) => Uint8Array.from(t.split("").map((e) => e.charCodeAt(0))), xs$1 = Nr$1("expand 16-byte k"), Ss = Nr$1("expand 32-byte k"), Os$1 = mt$2(xs$1), As$1 = mt$2(Ss);
function V$4(t, e) {
  return t << e | t >>> 32 - e;
}
function Ye$2(t) {
  return t.byteOffset % 4 === 0;
}
const ge$2 = 64, Bs = 16, Ur$1 = 2 ** 32 - 1, Tr$1 = new Uint32Array();
function Is$1(t, e, n, r, o, i, s, c) {
  const a = o.length, u = new Uint8Array(ge$2), l = mt$2(u), f = Ye$2(o) && Ye$2(i), h = f ? mt$2(o) : Tr$1, y = f ? mt$2(i) : Tr$1;
  for (let E = 0; E < a; s++) {
    if (t(e, n, r, l, s, c), s >= Ur$1) throw new Error("arx: counter overflow");
    const p = Math.min(ge$2, a - E);
    if (f && p === ge$2) {
      const d = E / 4;
      if (E % 4 !== 0) throw new Error("arx: invalid block position");
      for (let v = 0, m; v < Bs; v++) m = d + v, y[m] = h[m] ^ l[v];
      E += ge$2;
      continue;
    }
    for (let d = 0, v; d < p; d++) v = E + d, i[v] = o[v] ^ u[d];
    E += p;
  }
}
function Ns$1(t, e) {
  const { allowShortKeys: n, extendNonceFn: r, counterLength: o, counterRight: i, rounds: s } = ws({ allowShortKeys: false, counterLength: 8, counterRight: false, rounds: 20 }, e);
  if (typeof t != "function") throw new Error("core must be a function");
  return Fe$2(o), Fe$2(s), Ar$1(i), Ar$1(n), (c, a, u, l, f = 0) => {
    tt$1(c), tt$1(a), tt$1(u);
    const h = u.length;
    if (l === void 0 && (l = new Uint8Array(h)), tt$1(l), Fe$2(f), f < 0 || f >= Ur$1) throw new Error("arx: counter overflow");
    if (l.length < h) throw new Error(`arx: output (${l.length}) is shorter than data (${h})`);
    const y = [];
    let E = c.length, p, d;
    if (E === 32) y.push(p = Ze$2(c)), d = As$1;
    else if (E === 16 && n) p = new Uint8Array(32), p.set(c), p.set(c, 16), d = Os$1, y.push(p);
    else throw new Error(`arx: invalid 32-byte key, got length=${E}`);
    Ye$2(a) || y.push(a = Ze$2(a));
    const v = mt$2(p);
    if (r) {
      if (a.length !== 24) throw new Error("arx: extended nonce must be 24 bytes");
      r(d, v, mt$2(a.subarray(0, 16)), v), a = a.subarray(16);
    }
    const m = 16 - o;
    if (m !== a.length) throw new Error(`arx: nonce must be ${m} or 16 bytes`);
    if (m !== 12) {
      const N = new Uint8Array(12);
      N.set(a, i ? 0 : 12 - a.length), a = N, y.push(a);
    }
    const O = mt$2(a);
    return Is$1(t, d, v, O, u, l, f, s), jt$2(...y), l;
  };
}
const F$3 = (t, e) => t[e++] & 255 | (t[e++] & 255) << 8;
class Us {
  constructor(e) {
    this.blockLen = 16, this.outputLen = 16, this.buffer = new Uint8Array(16), this.r = new Uint16Array(10), this.h = new Uint16Array(10), this.pad = new Uint16Array(8), this.pos = 0, this.finished = false, e = ze$2(e), tt$1(e, 32);
    const n = F$3(e, 0), r = F$3(e, 2), o = F$3(e, 4), i = F$3(e, 6), s = F$3(e, 8), c = F$3(e, 10), a = F$3(e, 12), u = F$3(e, 14);
    this.r[0] = n & 8191, this.r[1] = (n >>> 13 | r << 3) & 8191, this.r[2] = (r >>> 10 | o << 6) & 7939, this.r[3] = (o >>> 7 | i << 9) & 8191, this.r[4] = (i >>> 4 | s << 12) & 255, this.r[5] = s >>> 1 & 8190, this.r[6] = (s >>> 14 | c << 2) & 8191, this.r[7] = (c >>> 11 | a << 5) & 8065, this.r[8] = (a >>> 8 | u << 8) & 8191, this.r[9] = u >>> 5 & 127;
    for (let l = 0; l < 8; l++) this.pad[l] = F$3(e, 16 + 2 * l);
  }
  process(e, n, r = false) {
    const o = r ? 0 : 2048, { h: i, r: s } = this, c = s[0], a = s[1], u = s[2], l = s[3], f = s[4], h = s[5], y = s[6], E = s[7], p = s[8], d = s[9], v = F$3(e, n + 0), m = F$3(e, n + 2), O = F$3(e, n + 4), N = F$3(e, n + 6), $ = F$3(e, n + 8), B = F$3(e, n + 10), A = F$3(e, n + 12), T = F$3(e, n + 14);
    let S = i[0] + (v & 8191), L = i[1] + ((v >>> 13 | m << 3) & 8191), U = i[2] + ((m >>> 10 | O << 6) & 8191), _ = i[3] + ((O >>> 7 | N << 9) & 8191), j = i[4] + ((N >>> 4 | $ << 12) & 8191), g = i[5] + ($ >>> 1 & 8191), w = i[6] + (($ >>> 14 | B << 2) & 8191), b = i[7] + ((B >>> 11 | A << 5) & 8191), I = i[8] + ((A >>> 8 | T << 8) & 8191), R = i[9] + (T >>> 5 | o), x = 0, C = x + S * c + L * (5 * d) + U * (5 * p) + _ * (5 * E) + j * (5 * y);
    x = C >>> 13, C &= 8191, C += g * (5 * h) + w * (5 * f) + b * (5 * l) + I * (5 * u) + R * (5 * a), x += C >>> 13, C &= 8191;
    let P = x + S * a + L * c + U * (5 * d) + _ * (5 * p) + j * (5 * E);
    x = P >>> 13, P &= 8191, P += g * (5 * y) + w * (5 * h) + b * (5 * f) + I * (5 * l) + R * (5 * u), x += P >>> 13, P &= 8191;
    let k = x + S * u + L * a + U * c + _ * (5 * d) + j * (5 * p);
    x = k >>> 13, k &= 8191, k += g * (5 * E) + w * (5 * y) + b * (5 * h) + I * (5 * f) + R * (5 * l), x += k >>> 13, k &= 8191;
    let M = x + S * l + L * u + U * a + _ * c + j * (5 * d);
    x = M >>> 13, M &= 8191, M += g * (5 * p) + w * (5 * E) + b * (5 * y) + I * (5 * h) + R * (5 * f), x += M >>> 13, M &= 8191;
    let D = x + S * f + L * l + U * u + _ * a + j * c;
    x = D >>> 13, D &= 8191, D += g * (5 * d) + w * (5 * p) + b * (5 * E) + I * (5 * y) + R * (5 * h), x += D >>> 13, D &= 8191;
    let z = x + S * h + L * f + U * l + _ * u + j * a;
    x = z >>> 13, z &= 8191, z += g * c + w * (5 * d) + b * (5 * p) + I * (5 * E) + R * (5 * y), x += z >>> 13, z &= 8191;
    let Z = x + S * y + L * h + U * f + _ * l + j * u;
    x = Z >>> 13, Z &= 8191, Z += g * a + w * c + b * (5 * d) + I * (5 * p) + R * (5 * E), x += Z >>> 13, Z &= 8191;
    let st = x + S * E + L * y + U * h + _ * f + j * l;
    x = st >>> 13, st &= 8191, st += g * u + w * a + b * c + I * (5 * d) + R * (5 * p), x += st >>> 13, st &= 8191;
    let W = x + S * p + L * E + U * y + _ * h + j * f;
    x = W >>> 13, W &= 8191, W += g * l + w * u + b * a + I * c + R * (5 * d), x += W >>> 13, W &= 8191;
    let J = x + S * d + L * p + U * E + _ * y + j * h;
    x = J >>> 13, J &= 8191, J += g * f + w * l + b * u + I * a + R * c, x += J >>> 13, J &= 8191, x = (x << 2) + x | 0, x = x + C | 0, C = x & 8191, x = x >>> 13, P += x, i[0] = C, i[1] = P, i[2] = k, i[3] = M, i[4] = D, i[5] = z, i[6] = Z, i[7] = st, i[8] = W, i[9] = J;
  }
  finalize() {
    const { h: e, pad: n } = this, r = new Uint16Array(10);
    let o = e[1] >>> 13;
    e[1] &= 8191;
    for (let c = 2; c < 10; c++) e[c] += o, o = e[c] >>> 13, e[c] &= 8191;
    e[0] += o * 5, o = e[0] >>> 13, e[0] &= 8191, e[1] += o, o = e[1] >>> 13, e[1] &= 8191, e[2] += o, r[0] = e[0] + 5, o = r[0] >>> 13, r[0] &= 8191;
    for (let c = 1; c < 10; c++) r[c] = e[c] + o, o = r[c] >>> 13, r[c] &= 8191;
    r[9] -= 8192;
    let i = (o ^ 1) - 1;
    for (let c = 0; c < 10; c++) r[c] &= i;
    i = ~i;
    for (let c = 0; c < 10; c++) e[c] = e[c] & i | r[c];
    e[0] = (e[0] | e[1] << 13) & 65535, e[1] = (e[1] >>> 3 | e[2] << 10) & 65535, e[2] = (e[2] >>> 6 | e[3] << 7) & 65535, e[3] = (e[3] >>> 9 | e[4] << 4) & 65535, e[4] = (e[4] >>> 12 | e[5] << 1 | e[6] << 14) & 65535, e[5] = (e[6] >>> 2 | e[7] << 11) & 65535, e[6] = (e[7] >>> 5 | e[8] << 8) & 65535, e[7] = (e[8] >>> 8 | e[9] << 5) & 65535;
    let s = e[0] + n[0];
    e[0] = s & 65535;
    for (let c = 1; c < 8; c++) s = (e[c] + n[c] | 0) + (s >>> 16) | 0, e[c] = s & 65535;
    jt$2(r);
  }
  update(e) {
    Or$1(this);
    const { buffer: n, blockLen: r } = this;
    e = ze$2(e);
    const o = e.length;
    for (let i = 0; i < o; ) {
      const s = Math.min(r - this.pos, o - i);
      if (s === r) {
        for (; r <= o - i; i += r) this.process(e, i);
        continue;
      }
      n.set(e.subarray(i, i + s), this.pos), this.pos += s, i += s, this.pos === r && (this.process(n, 0, false), this.pos = 0);
    }
    return this;
  }
  destroy() {
    jt$2(this.h, this.r, this.buffer, this.pad);
  }
  digestInto(e) {
    Or$1(this), ps(e, this), this.finished = true;
    const { buffer: n, h: r } = this;
    let { pos: o } = this;
    if (o) {
      for (n[o++] = 1; o < 16; o++) n[o] = 0;
      this.process(n, 0, true);
    }
    this.finalize();
    let i = 0;
    for (let s = 0; s < 8; s++) e[i++] = r[s] >>> 0, e[i++] = r[s] >>> 8;
    return e;
  }
  digest() {
    const { buffer: e, outputLen: n } = this;
    this.digestInto(e);
    const r = e.slice(0, n);
    return this.destroy(), r;
  }
}
function Ts$1(t) {
  const e = (r, o) => t(o).update(ze$2(r)).digest(), n = t(new Uint8Array(32));
  return e.outputLen = n.outputLen, e.blockLen = n.blockLen, e.create = (r) => t(r), e;
}
const Rs = Ts$1((t) => new Us(t));
function _s(t, e, n, r, o, i = 20) {
  let s = t[0], c = t[1], a = t[2], u = t[3], l = e[0], f = e[1], h = e[2], y = e[3], E = e[4], p = e[5], d = e[6], v = e[7], m = o, O = n[0], N = n[1], $ = n[2], B = s, A = c, T = a, S = u, L = l, U = f, _ = h, j = y, g = E, w = p, b = d, I = v, R = m, x = O, C = N, P = $;
  for (let M = 0; M < i; M += 2) B = B + L | 0, R = V$4(R ^ B, 16), g = g + R | 0, L = V$4(L ^ g, 12), B = B + L | 0, R = V$4(R ^ B, 8), g = g + R | 0, L = V$4(L ^ g, 7), A = A + U | 0, x = V$4(x ^ A, 16), w = w + x | 0, U = V$4(U ^ w, 12), A = A + U | 0, x = V$4(x ^ A, 8), w = w + x | 0, U = V$4(U ^ w, 7), T = T + _ | 0, C = V$4(C ^ T, 16), b = b + C | 0, _ = V$4(_ ^ b, 12), T = T + _ | 0, C = V$4(C ^ T, 8), b = b + C | 0, _ = V$4(_ ^ b, 7), S = S + j | 0, P = V$4(P ^ S, 16), I = I + P | 0, j = V$4(j ^ I, 12), S = S + j | 0, P = V$4(P ^ S, 8), I = I + P | 0, j = V$4(j ^ I, 7), B = B + U | 0, P = V$4(P ^ B, 16), b = b + P | 0, U = V$4(U ^ b, 12), B = B + U | 0, P = V$4(P ^ B, 8), b = b + P | 0, U = V$4(U ^ b, 7), A = A + _ | 0, R = V$4(R ^ A, 16), I = I + R | 0, _ = V$4(_ ^ I, 12), A = A + _ | 0, R = V$4(R ^ A, 8), I = I + R | 0, _ = V$4(_ ^ I, 7), T = T + j | 0, x = V$4(x ^ T, 16), g = g + x | 0, j = V$4(j ^ g, 12), T = T + j | 0, x = V$4(x ^ T, 8), g = g + x | 0, j = V$4(j ^ g, 7), S = S + L | 0, C = V$4(C ^ S, 16), w = w + C | 0, L = V$4(L ^ w, 12), S = S + L | 0, C = V$4(C ^ S, 8), w = w + C | 0, L = V$4(L ^ w, 7);
  let k = 0;
  r[k++] = s + B | 0, r[k++] = c + A | 0, r[k++] = a + T | 0, r[k++] = u + S | 0, r[k++] = l + L | 0, r[k++] = f + U | 0, r[k++] = h + _ | 0, r[k++] = y + j | 0, r[k++] = E + g | 0, r[k++] = p + w | 0, r[k++] = d + b | 0, r[k++] = v + I | 0, r[k++] = m + R | 0, r[k++] = O + x | 0, r[k++] = N + C | 0, r[k++] = $ + P | 0;
}
const $s = Ns$1(_s, { counterRight: false, counterLength: 4, allowShortKeys: false }), Ls$1 = new Uint8Array(16), Rr$1 = (t, e) => {
  t.update(e);
  const n = e.length % 16;
  n && t.update(Ls$1.subarray(n));
}, js = new Uint8Array(32);
function _r$1(t, e, n, r, o) {
  const i = t(e, n, js), s = Rs.create(i);
  o && Rr$1(s, o), Rr$1(s, r);
  const c = new Uint8Array(16), a = gs(c);
  Ir$1(a, 0, BigInt(o ? o.length : 0), true), Ir$1(a, 8, BigInt(r.length), true), s.update(c);
  const u = s.digest();
  return jt$2(i, c), u;
}
const Cs$1 = (t) => (e, n, r) => ({ encrypt(i, s) {
  const c = i.length;
  s = Br$1(c + 16, s, false), s.set(i);
  const a = s.subarray(0, -16);
  t(e, n, a, a, 1);
  const u = _r$1(t, e, n, a, r);
  return s.set(u, c), jt$2(u), s;
}, decrypt(i, s) {
  s = Br$1(i.length - 16, s, false);
  const c = i.subarray(0, -16), a = i.subarray(-16), u = _r$1(t, e, n, c, r);
  if (!bs$1(a, u)) throw new Error("invalid tag");
  return s.set(i.subarray(0, -16)), t(e, n, s, s, 1), jt$2(u), s;
} }), $r$1 = Es({ blockSize: 64, nonceLength: 12, tagLength: 16 }, Cs$1($s));
let Lr$1 = class Lr extends ke$3 {
  constructor(e, n) {
    super(), this.finished = false, this.destroyed = false, Ce$1(e);
    const r = $t$1(n);
    if (this.iHash = e.create(), typeof this.iHash.update != "function") throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen, this.outputLen = this.iHash.outputLen;
    const o = this.blockLen, i = new Uint8Array(o);
    i.set(r.length > o ? e.create().update(r).digest() : r);
    for (let s = 0; s < i.length; s++) i[s] ^= 54;
    this.iHash.update(i), this.oHash = e.create();
    for (let s = 0; s < i.length; s++) i[s] ^= 106;
    this.oHash.update(i), i.fill(0);
  }
  update(e) {
    return Rt$2(this), this.iHash.update(e), this;
  }
  digestInto(e) {
    Rt$2(this), Xt$2(e, this.outputLen), this.finished = true, this.iHash.digestInto(e), this.oHash.update(e), this.oHash.digestInto(e), this.destroy();
  }
  digest() {
    const e = new Uint8Array(this.oHash.outputLen);
    return this.digestInto(e), e;
  }
  _cloneInto(e) {
    e || (e = Object.create(Object.getPrototypeOf(this), {}));
    const { oHash: n, iHash: r, finished: o, destroyed: i, blockLen: s, outputLen: c } = this;
    return e = e, e.finished = o, e.destroyed = i, e.blockLen = s, e.outputLen = c, e.oHash = n._cloneInto(e.oHash), e.iHash = r._cloneInto(e.iHash), e;
  }
  destroy() {
    this.destroyed = true, this.oHash.destroy(), this.iHash.destroy();
  }
};
const ye$2 = (t, e, n) => new Lr$1(t, e).update(n).digest();
ye$2.create = (t, e) => new Lr$1(t, e);
function Ps$1(t, e, n) {
  return Ce$1(t), n === void 0 && (n = new Uint8Array(t.outputLen)), ye$2(t, $t$1(n), $t$1(e));
}
const Ge$3 = new Uint8Array([0]), jr$1 = new Uint8Array();
function ks$1(t, e, n, r = 32) {
  if (Ce$1(t), Wt$2(r), r > 255 * t.outputLen) throw new Error("Length should be <= 255*HashLen");
  const o = Math.ceil(r / t.outputLen);
  n === void 0 && (n = jr$1);
  const i = new Uint8Array(o * t.outputLen), s = ye$2.create(t, e), c = s._cloneInto(), a = new Uint8Array(s.outputLen);
  for (let u = 0; u < o; u++) Ge$3[0] = u + 1, c.update(u === 0 ? jr$1 : a).update(n).update(Ge$3).digestInto(a), i.set(a, t.outputLen * u), s._cloneInto(c);
  return s.destroy(), c.destroy(), a.fill(0), Ge$3.fill(0), i.slice(0, r);
}
const Vs$1 = (t, e, n, r, o) => ks$1(t, Ps$1(t, e, n), r, o);
function Ms$1(t, e, n, r) {
  if (typeof t.setBigUint64 == "function") return t.setBigUint64(e, n, r);
  const o = BigInt(32), i = BigInt(4294967295), s = Number(n >> o & i), c = Number(n & i), a = r ? 4 : 0, u = r ? 0 : 4;
  t.setUint32(e + a, s, r), t.setUint32(e + u, c, r);
}
function Ds$1(t, e, n) {
  return t & e ^ ~t & n;
}
function Hs(t, e, n) {
  return t & e ^ t & n ^ e & n;
}
let qs$1 = class qs extends ke$3 {
  constructor(e, n, r, o) {
    super(), this.blockLen = e, this.outputLen = n, this.padOffset = r, this.isLE = o, this.finished = false, this.length = 0, this.pos = 0, this.destroyed = false, this.buffer = new Uint8Array(e), this.view = Pe$1(this.buffer);
  }
  update(e) {
    Rt$2(this);
    const { view: n, buffer: r, blockLen: o } = this;
    e = $t$1(e);
    const i = e.length;
    for (let s = 0; s < i; ) {
      const c = Math.min(o - this.pos, i - s);
      if (c === o) {
        const a = Pe$1(e);
        for (; o <= i - s; s += o) this.process(a, s);
        continue;
      }
      r.set(e.subarray(s, s + c), this.pos), this.pos += c, s += c, this.pos === o && (this.process(n, 0), this.pos = 0);
    }
    return this.length += e.length, this.roundClean(), this;
  }
  digestInto(e) {
    Rt$2(this), Gn$1(e, this), this.finished = true;
    const { buffer: n, view: r, blockLen: o, isLE: i } = this;
    let { pos: s } = this;
    n[s++] = 128, this.buffer.subarray(s).fill(0), this.padOffset > o - s && (this.process(r, 0), s = 0);
    for (let f = s; f < o; f++) n[f] = 0;
    Ms$1(r, o - 8, BigInt(this.length * 8), i), this.process(r, 0);
    const c = Pe$1(e), a = this.outputLen;
    if (a % 4) throw new Error("_sha2: outputLen should be aligned to 32bit");
    const u = a / 4, l = this.get();
    if (u > l.length) throw new Error("_sha2: outputLen bigger than state");
    for (let f = 0; f < u; f++) c.setUint32(4 * f, l[f], i);
  }
  digest() {
    const { buffer: e, outputLen: n } = this;
    this.digestInto(e);
    const r = e.slice(0, n);
    return this.destroy(), r;
  }
  _cloneInto(e) {
    e || (e = new this.constructor()), e.set(...this.get());
    const { blockLen: n, buffer: r, length: o, finished: i, destroyed: s, pos: c } = this;
    return e.length = o, e.pos = c, e.finished = i, e.destroyed = s, o % n && e.buffer.set(r), e;
  }
};
const Ks = new Uint32Array([1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298]), wt$2 = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]), bt$1 = new Uint32Array(64);
class Fs extends qs$1 {
  constructor() {
    super(64, 32, 8, false), this.A = wt$2[0] | 0, this.B = wt$2[1] | 0, this.C = wt$2[2] | 0, this.D = wt$2[3] | 0, this.E = wt$2[4] | 0, this.F = wt$2[5] | 0, this.G = wt$2[6] | 0, this.H = wt$2[7] | 0;
  }
  get() {
    const { A: e, B: n, C: r, D: o, E: i, F: s, G: c, H: a } = this;
    return [e, n, r, o, i, s, c, a];
  }
  set(e, n, r, o, i, s, c, a) {
    this.A = e | 0, this.B = n | 0, this.C = r | 0, this.D = o | 0, this.E = i | 0, this.F = s | 0, this.G = c | 0, this.H = a | 0;
  }
  process(e, n) {
    for (let f = 0; f < 16; f++, n += 4) bt$1[f] = e.getUint32(n, false);
    for (let f = 16; f < 64; f++) {
      const h = bt$1[f - 15], y = bt$1[f - 2], E = ct$1(h, 7) ^ ct$1(h, 18) ^ h >>> 3, p = ct$1(y, 17) ^ ct$1(y, 19) ^ y >>> 10;
      bt$1[f] = p + bt$1[f - 7] + E + bt$1[f - 16] | 0;
    }
    let { A: r, B: o, C: i, D: s, E: c, F: a, G: u, H: l } = this;
    for (let f = 0; f < 64; f++) {
      const h = ct$1(c, 6) ^ ct$1(c, 11) ^ ct$1(c, 25), y = l + h + Ds$1(c, a, u) + Ks[f] + bt$1[f] | 0, p = (ct$1(r, 2) ^ ct$1(r, 13) ^ ct$1(r, 22)) + Hs(r, o, i) | 0;
      l = u, u = a, a = c, c = s + y | 0, s = i, i = o, o = r, r = y + p | 0;
    }
    r = r + this.A | 0, o = o + this.B | 0, i = i + this.C | 0, s = s + this.D | 0, c = c + this.E | 0, a = a + this.F | 0, u = u + this.G | 0, l = l + this.H | 0, this.set(r, o, i, s, c, a, u, l);
  }
  roundClean() {
    bt$1.fill(0);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0), this.buffer.fill(0);
  }
}
const Qt$2 = Qn$1(() => new Fs());
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
const me$2 = BigInt(0), we$2 = BigInt(1), zs = BigInt(2);
function St$3(t) {
  return t instanceof Uint8Array || ArrayBuffer.isView(t) && t.constructor.name === "Uint8Array";
}
function te$1(t) {
  if (!St$3(t)) throw new Error("Uint8Array expected");
}
function Ct$1(t, e) {
  if (typeof e != "boolean") throw new Error(t + " boolean expected, got " + e);
}
const Zs$1 = Array.from({ length: 256 }, (t, e) => e.toString(16).padStart(2, "0"));
function Pt$2(t) {
  te$1(t);
  let e = "";
  for (let n = 0; n < t.length; n++) e += Zs$1[t[n]];
  return e;
}
function kt$2(t) {
  const e = t.toString(16);
  return e.length & 1 ? "0" + e : e;
}
function We$2(t) {
  if (typeof t != "string") throw new Error("hex string expected, got " + typeof t);
  return t === "" ? me$2 : BigInt("0x" + t);
}
const ut$2 = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function Cr$1(t) {
  if (t >= ut$2._0 && t <= ut$2._9) return t - ut$2._0;
  if (t >= ut$2.A && t <= ut$2.F) return t - (ut$2.A - 10);
  if (t >= ut$2.a && t <= ut$2.f) return t - (ut$2.a - 10);
}
function Vt$2(t) {
  if (typeof t != "string") throw new Error("hex string expected, got " + typeof t);
  const e = t.length, n = e / 2;
  if (e % 2) throw new Error("hex string expected, got unpadded hex of length " + e);
  const r = new Uint8Array(n);
  for (let o = 0, i = 0; o < n; o++, i += 2) {
    const s = Cr$1(t.charCodeAt(i)), c = Cr$1(t.charCodeAt(i + 1));
    if (s === void 0 || c === void 0) {
      const a = t[i] + t[i + 1];
      throw new Error('hex string expected, got non-hex character "' + a + '" at index ' + i);
    }
    r[o] = s * 16 + c;
  }
  return r;
}
function Ot$2(t) {
  return We$2(Pt$2(t));
}
function ee$1(t) {
  return te$1(t), We$2(Pt$2(Uint8Array.from(t).reverse()));
}
function Mt$2(t, e) {
  return Vt$2(t.toString(16).padStart(e * 2, "0"));
}
function be$2(t, e) {
  return Mt$2(t, e).reverse();
}
function Ys(t) {
  return Vt$2(kt$2(t));
}
function et$2(t, e, n) {
  let r;
  if (typeof e == "string") try {
    r = Vt$2(e);
  } catch (i) {
    throw new Error(t + " must be hex string or Uint8Array, cause: " + i);
  }
  else if (St$3(e)) r = Uint8Array.from(e);
  else throw new Error(t + " must be hex string or Uint8Array");
  const o = r.length;
  if (typeof n == "number" && o !== n) throw new Error(t + " of length " + n + " expected, got " + o);
  return r;
}
function ne$2(...t) {
  let e = 0;
  for (let r = 0; r < t.length; r++) {
    const o = t[r];
    te$1(o), e += o.length;
  }
  const n = new Uint8Array(e);
  for (let r = 0, o = 0; r < t.length; r++) {
    const i = t[r];
    n.set(i, o), o += i.length;
  }
  return n;
}
function Gs(t, e) {
  if (t.length !== e.length) return false;
  let n = 0;
  for (let r = 0; r < t.length; r++) n |= t[r] ^ e[r];
  return n === 0;
}
function Ws(t) {
  if (typeof t != "string") throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(t));
}
const Xe$2 = (t) => typeof t == "bigint" && me$2 <= t;
function Ee$3(t, e, n) {
  return Xe$2(t) && Xe$2(e) && Xe$2(n) && e <= t && t < n;
}
function ft$2(t, e, n, r) {
  if (!Ee$3(e, n, r)) throw new Error("expected valid " + t + ": " + n + " <= n < " + r + ", got " + e);
}
function Pr$1(t) {
  let e;
  for (e = 0; t > me$2; t >>= we$2, e += 1) ;
  return e;
}
function Xs(t, e) {
  return t >> BigInt(e) & we$2;
}
function Js(t, e, n) {
  return t | (n ? we$2 : me$2) << BigInt(e);
}
const Je$2 = (t) => (zs << BigInt(t - 1)) - we$2, Qe$2 = (t) => new Uint8Array(t), kr$1 = (t) => Uint8Array.from(t);
function Vr$1(t, e, n) {
  if (typeof t != "number" || t < 2) throw new Error("hashLen must be a number");
  if (typeof e != "number" || e < 2) throw new Error("qByteLen must be a number");
  if (typeof n != "function") throw new Error("hmacFn must be a function");
  let r = Qe$2(t), o = Qe$2(t), i = 0;
  const s = () => {
    r.fill(1), o.fill(0), i = 0;
  }, c = (...f) => n(o, r, ...f), a = (f = Qe$2()) => {
    o = c(kr$1([0]), f), r = c(), f.length !== 0 && (o = c(kr$1([1]), f), r = c());
  }, u = () => {
    if (i++ >= 1e3) throw new Error("drbg: tried 1000 values");
    let f = 0;
    const h = [];
    for (; f < e; ) {
      r = c();
      const y = r.slice();
      h.push(y), f += r.length;
    }
    return ne$2(...h);
  };
  return (f, h) => {
    s(), a(f);
    let y;
    for (; !(y = h(u())); ) a();
    return s(), y;
  };
}
const Qs = { bigint: (t) => typeof t == "bigint", function: (t) => typeof t == "function", boolean: (t) => typeof t == "boolean", string: (t) => typeof t == "string", stringOrUint8Array: (t) => typeof t == "string" || St$3(t), isSafeInteger: (t) => Number.isSafeInteger(t), array: (t) => Array.isArray(t), field: (t, e) => e.Fp.isValid(t), hash: (t) => typeof t == "function" && Number.isSafeInteger(t.outputLen) };
function Dt$1(t, e, n = {}) {
  const r = (o, i, s) => {
    const c = Qs[i];
    if (typeof c != "function") throw new Error("invalid validator function");
    const a = t[o];
    if (!(s && a === void 0) && !c(a, t)) throw new Error("param " + String(o) + " is invalid. Expected " + i + ", got " + a);
  };
  for (const [o, i] of Object.entries(e)) r(o, i, false);
  for (const [o, i] of Object.entries(n)) r(o, i, true);
  return t;
}
const tc = () => {
  throw new Error("not implemented");
};
function tn$1(t) {
  const e = /* @__PURE__ */ new WeakMap();
  return (n, ...r) => {
    const o = e.get(n);
    if (o !== void 0) return o;
    const i = t(n, ...r);
    return e.set(n, i), i;
  };
}
var ec = Object.freeze({ __proto__: null, isBytes: St$3, abytes: te$1, abool: Ct$1, bytesToHex: Pt$2, numberToHexUnpadded: kt$2, hexToNumber: We$2, hexToBytes: Vt$2, bytesToNumberBE: Ot$2, bytesToNumberLE: ee$1, numberToBytesBE: Mt$2, numberToBytesLE: be$2, numberToVarBytesBE: Ys, ensureBytes: et$2, concatBytes: ne$2, equalBytes: Gs, utf8ToBytes: Ws, inRange: Ee$3, aInRange: ft$2, bitLen: Pr$1, bitGet: Xs, bitSet: Js, bitMask: Je$2, createHmacDrbg: Vr$1, validateObject: Dt$1, notImplemented: tc, memoized: tn$1 });
const q$2 = BigInt(0), H$2 = BigInt(1), At$1 = BigInt(2), nc = BigInt(3), en = BigInt(4), Mr$1 = BigInt(5), Dr$1 = BigInt(8);
function X$2(t, e) {
  const n = t % e;
  return n >= q$2 ? n : e + n;
}
function Hr$1(t, e, n) {
  if (e < q$2) throw new Error("invalid exponent, negatives unsupported");
  if (n <= q$2) throw new Error("invalid modulus");
  if (n === H$2) return q$2;
  let r = H$2;
  for (; e > q$2; ) e & H$2 && (r = r * t % n), t = t * t % n, e >>= H$2;
  return r;
}
function it$1(t, e, n) {
  let r = t;
  for (; e-- > q$2; ) r *= r, r %= n;
  return r;
}
function nn$1(t, e) {
  if (t === q$2) throw new Error("invert: expected non-zero number");
  if (e <= q$2) throw new Error("invert: expected positive modulus, got " + e);
  let n = X$2(t, e), r = e, o = q$2, i = H$2;
  for (; n !== q$2; ) {
    const c = r / n, a = r % n, u = o - i * c;
    r = n, n = a, o = i, i = u;
  }
  if (r !== H$2) throw new Error("invert: does not exist");
  return X$2(o, e);
}
function rc(t) {
  const e = (t - H$2) / At$1;
  let n, r, o;
  for (n = t - H$2, r = 0; n % At$1 === q$2; n /= At$1, r++) ;
  for (o = At$1; o < t && Hr$1(o, e, t) !== t - H$2; o++) if (o > 1e3) throw new Error("Cannot find square root: likely non-prime P");
  if (r === 1) {
    const s = (t + H$2) / en;
    return function(a, u) {
      const l = a.pow(u, s);
      if (!a.eql(a.sqr(l), u)) throw new Error("Cannot find square root");
      return l;
    };
  }
  const i = (n + H$2) / At$1;
  return function(c, a) {
    if (c.pow(a, e) === c.neg(c.ONE)) throw new Error("Cannot find square root");
    let u = r, l = c.pow(c.mul(c.ONE, o), n), f = c.pow(a, i), h = c.pow(a, n);
    for (; !c.eql(h, c.ONE); ) {
      if (c.eql(h, c.ZERO)) return c.ZERO;
      let y = 1;
      for (let p = c.sqr(h); y < u && !c.eql(p, c.ONE); y++) p = c.sqr(p);
      const E = c.pow(l, H$2 << BigInt(u - y - 1));
      l = c.sqr(E), f = c.mul(f, E), h = c.mul(h, l), u = y;
    }
    return f;
  };
}
function oc(t) {
  if (t % en === nc) {
    const e = (t + H$2) / en;
    return function(r, o) {
      const i = r.pow(o, e);
      if (!r.eql(r.sqr(i), o)) throw new Error("Cannot find square root");
      return i;
    };
  }
  if (t % Dr$1 === Mr$1) {
    const e = (t - Mr$1) / Dr$1;
    return function(r, o) {
      const i = r.mul(o, At$1), s = r.pow(i, e), c = r.mul(o, s), a = r.mul(r.mul(c, At$1), s), u = r.mul(c, r.sub(a, r.ONE));
      if (!r.eql(r.sqr(u), o)) throw new Error("Cannot find square root");
      return u;
    };
  }
  return rc(t);
}
const ic = ["create", "isValid", "is0", "neg", "inv", "sqrt", "sqr", "eql", "add", "sub", "mul", "pow", "div", "addN", "subN", "mulN", "sqrN"];
function sc(t) {
  const e = { ORDER: "bigint", MASK: "bigint", BYTES: "isSafeInteger", BITS: "isSafeInteger" }, n = ic.reduce((r, o) => (r[o] = "function", r), e);
  return Dt$1(t, n);
}
function cc(t, e, n) {
  if (n < q$2) throw new Error("invalid exponent, negatives unsupported");
  if (n === q$2) return t.ONE;
  if (n === H$2) return e;
  let r = t.ONE, o = e;
  for (; n > q$2; ) n & H$2 && (r = t.mul(r, o)), o = t.sqr(o), n >>= H$2;
  return r;
}
function ac(t, e) {
  const n = new Array(e.length), r = e.reduce((i, s, c) => t.is0(s) ? i : (n[c] = i, t.mul(i, s)), t.ONE), o = t.inv(r);
  return e.reduceRight((i, s, c) => t.is0(s) ? i : (n[c] = t.mul(i, n[c]), t.mul(i, s)), o), n;
}
function qr$1(t, e) {
  const n = e !== void 0 ? e : t.toString(2).length, r = Math.ceil(n / 8);
  return { nBitLength: n, nByteLength: r };
}
function Kr$1(t, e, n = false, r = {}) {
  if (t <= q$2) throw new Error("invalid field: expected ORDER > 0, got " + t);
  const { nBitLength: o, nByteLength: i } = qr$1(t, e);
  if (i > 2048) throw new Error("invalid field: expected ORDER of <= 2048 bytes");
  let s;
  const c = Object.freeze({ ORDER: t, isLE: n, BITS: o, BYTES: i, MASK: Je$2(o), ZERO: q$2, ONE: H$2, create: (a) => X$2(a, t), isValid: (a) => {
    if (typeof a != "bigint") throw new Error("invalid field element: expected bigint, got " + typeof a);
    return q$2 <= a && a < t;
  }, is0: (a) => a === q$2, isOdd: (a) => (a & H$2) === H$2, neg: (a) => X$2(-a, t), eql: (a, u) => a === u, sqr: (a) => X$2(a * a, t), add: (a, u) => X$2(a + u, t), sub: (a, u) => X$2(a - u, t), mul: (a, u) => X$2(a * u, t), pow: (a, u) => cc(c, a, u), div: (a, u) => X$2(a * nn$1(u, t), t), sqrN: (a) => a * a, addN: (a, u) => a + u, subN: (a, u) => a - u, mulN: (a, u) => a * u, inv: (a) => nn$1(a, t), sqrt: r.sqrt || ((a) => (s || (s = oc(t)), s(c, a))), invertBatch: (a) => ac(c, a), cmov: (a, u, l) => l ? u : a, toBytes: (a) => n ? be$2(a, i) : Mt$2(a, i), fromBytes: (a) => {
    if (a.length !== i) throw new Error("Field.fromBytes: expected " + i + " bytes, got " + a.length);
    return n ? ee$1(a) : Ot$2(a);
  } });
  return Object.freeze(c);
}
function Fr$1(t) {
  if (typeof t != "bigint") throw new Error("field order must be bigint");
  const e = t.toString(2).length;
  return Math.ceil(e / 8);
}
function zr$1(t) {
  const e = Fr$1(t);
  return e + Math.ceil(e / 2);
}
function uc(t, e, n = false) {
  const r = t.length, o = Fr$1(e), i = zr$1(e);
  if (r < 16 || r < i || r > 1024) throw new Error("expected " + i + "-1024 bytes of input, got " + r);
  const s = n ? ee$1(t) : Ot$2(t), c = X$2(s, e - H$2) + H$2;
  return n ? be$2(c, o) : Mt$2(c, o);
}
const Zr$1 = BigInt(0), ve$1 = BigInt(1);
function rn$1(t, e) {
  const n = e.negate();
  return t ? n : e;
}
function Yr$1(t, e) {
  if (!Number.isSafeInteger(t) || t <= 0 || t > e) throw new Error("invalid window size, expected [1.." + e + "], got W=" + t);
}
function on$1(t, e) {
  Yr$1(t, e);
  const n = Math.ceil(e / t) + 1, r = 2 ** (t - 1);
  return { windows: n, windowSize: r };
}
function fc(t, e) {
  if (!Array.isArray(t)) throw new Error("array expected");
  t.forEach((n, r) => {
    if (!(n instanceof e)) throw new Error("invalid point at index " + r);
  });
}
function lc(t, e) {
  if (!Array.isArray(t)) throw new Error("array of scalars expected");
  t.forEach((n, r) => {
    if (!e.isValid(n)) throw new Error("invalid scalar at index " + r);
  });
}
const sn$1 = /* @__PURE__ */ new WeakMap(), Gr$1 = /* @__PURE__ */ new WeakMap();
function cn$1(t) {
  return Gr$1.get(t) || 1;
}
function dc(t, e) {
  return { constTimeNegate: rn$1, hasPrecomputes(n) {
    return cn$1(n) !== 1;
  }, unsafeLadder(n, r, o = t.ZERO) {
    let i = n;
    for (; r > Zr$1; ) r & ve$1 && (o = o.add(i)), i = i.double(), r >>= ve$1;
    return o;
  }, precomputeWindow(n, r) {
    const { windows: o, windowSize: i } = on$1(r, e), s = [];
    let c = n, a = c;
    for (let u = 0; u < o; u++) {
      a = c, s.push(a);
      for (let l = 1; l < i; l++) a = a.add(c), s.push(a);
      c = a.double();
    }
    return s;
  }, wNAF(n, r, o) {
    const { windows: i, windowSize: s } = on$1(n, e);
    let c = t.ZERO, a = t.BASE;
    const u = BigInt(2 ** n - 1), l = 2 ** n, f = BigInt(n);
    for (let h = 0; h < i; h++) {
      const y = h * s;
      let E = Number(o & u);
      o >>= f, E > s && (E -= l, o += ve$1);
      const p = y, d = y + Math.abs(E) - 1, v = h % 2 !== 0, m = E < 0;
      E === 0 ? a = a.add(rn$1(v, r[p])) : c = c.add(rn$1(m, r[d]));
    }
    return { p: c, f: a };
  }, wNAFUnsafe(n, r, o, i = t.ZERO) {
    const { windows: s, windowSize: c } = on$1(n, e), a = BigInt(2 ** n - 1), u = 2 ** n, l = BigInt(n);
    for (let f = 0; f < s; f++) {
      const h = f * c;
      if (o === Zr$1) break;
      let y = Number(o & a);
      if (o >>= l, y > c && (y -= u, o += ve$1), y === 0) continue;
      let E = r[h + Math.abs(y) - 1];
      y < 0 && (E = E.negate()), i = i.add(E);
    }
    return i;
  }, getPrecomputes(n, r, o) {
    let i = sn$1.get(r);
    return i || (i = this.precomputeWindow(r, n), n !== 1 && sn$1.set(r, o(i))), i;
  }, wNAFCached(n, r, o) {
    const i = cn$1(n);
    return this.wNAF(i, this.getPrecomputes(i, n, o), r);
  }, wNAFCachedUnsafe(n, r, o, i) {
    const s = cn$1(n);
    return s === 1 ? this.unsafeLadder(n, r, i) : this.wNAFUnsafe(s, this.getPrecomputes(s, n, o), r, i);
  }, setWindowSize(n, r) {
    Yr$1(r, e), Gr$1.set(n, r), sn$1.delete(n);
  } };
}
function hc(t, e, n, r) {
  if (fc(n, t), lc(r, e), n.length !== r.length) throw new Error("arrays of points and scalars must have equal length");
  const o = t.ZERO, i = Pr$1(BigInt(n.length)), s = i > 12 ? i - 3 : i > 4 ? i - 2 : i ? 2 : 1, c = (1 << s) - 1, a = new Array(c + 1).fill(o), u = Math.floor((e.BITS - 1) / s) * s;
  let l = o;
  for (let f = u; f >= 0; f -= s) {
    a.fill(o);
    for (let y = 0; y < r.length; y++) {
      const E = r[y], p = Number(E >> BigInt(f) & BigInt(c));
      a[p] = a[p].add(n[y]);
    }
    let h = o;
    for (let y = a.length - 1, E = o; y > 0; y--) E = E.add(a[y]), h = h.add(E);
    if (l = l.add(h), f !== 0) for (let y = 0; y < s; y++) l = l.double();
  }
  return l;
}
function Wr$1(t) {
  return sc(t.Fp), Dt$1(t, { n: "bigint", h: "bigint", Gx: "field", Gy: "field" }, { nBitLength: "isSafeInteger", nByteLength: "isSafeInteger" }), Object.freeze({ ...qr$1(t.n, t.nBitLength), ...t, p: t.Fp.ORDER });
}
BigInt(0), BigInt(1), BigInt(2), BigInt(8);
const Ht$1 = BigInt(0), an$1 = BigInt(1);
function pc(t) {
  return Dt$1(t, { a: "bigint" }, { montgomeryBits: "isSafeInteger", nByteLength: "isSafeInteger", adjustScalarBytes: "function", domain: "function", powPminus2: "function", Gu: "bigint" }), Object.freeze({ ...t });
}
function gc(t) {
  const e = pc(t), { P: n } = e, r = (m) => X$2(m, n), o = e.montgomeryBits, i = Math.ceil(o / 8), s = e.nByteLength, c = e.adjustScalarBytes || ((m) => m), a = e.powPminus2 || ((m) => Hr$1(m, n - BigInt(2), n));
  function u(m, O, N) {
    const $ = r(m * (O - N));
    return O = r(O - $), N = r(N + $), [O, N];
  }
  const l = (e.a - BigInt(2)) / BigInt(4);
  function f(m, O) {
    ft$2("u", m, Ht$1, n), ft$2("scalar", O, Ht$1, n);
    const N = O, $ = m;
    let B = an$1, A = Ht$1, T = m, S = an$1, L = Ht$1, U;
    for (let j = BigInt(o - 1); j >= Ht$1; j--) {
      const g = N >> j & an$1;
      L ^= g, U = u(L, B, T), B = U[0], T = U[1], U = u(L, A, S), A = U[0], S = U[1], L = g;
      const w = B + A, b = r(w * w), I = B - A, R = r(I * I), x = b - R, C = T + S, P = T - S, k = r(P * w), M = r(C * I), D = k + M, z = k - M;
      T = r(D * D), S = r($ * r(z * z)), B = r(b * R), A = r(x * (b + r(l * x)));
    }
    U = u(L, B, T), B = U[0], T = U[1], U = u(L, A, S), A = U[0], S = U[1];
    const _ = a(A);
    return r(B * _);
  }
  function h(m) {
    return be$2(r(m), i);
  }
  function y(m) {
    const O = et$2("u coordinate", m, i);
    return s === 32 && (O[31] &= 127), ee$1(O);
  }
  function E(m) {
    const O = et$2("scalar", m), N = O.length;
    if (N !== i && N !== s) {
      let $ = "" + i + " or " + s;
      throw new Error("invalid scalar, expected " + $ + " bytes, got " + N);
    }
    return ee$1(c(O));
  }
  function p(m, O) {
    const N = y(O), $ = E(m), B = f(N, $);
    if (B === Ht$1) throw new Error("invalid private or public key received");
    return h(B);
  }
  const d = h(e.Gu);
  function v(m) {
    return p(m, d);
  }
  return { scalarMult: p, scalarMultBase: v, getSharedSecret: (m, O) => p(m, O), getPublicKey: (m) => v(m), utils: { randomPrivateKey: () => e.randomBytes(e.nByteLength) }, GuBytes: d };
}
const un$1 = BigInt("57896044618658097711785492504343953926634992332820282019728792003956564819949");
BigInt(0);
const yc = BigInt(1), Xr$1 = BigInt(2), mc = BigInt(3), wc = BigInt(5);
BigInt(8);
function bc(t) {
  const e = BigInt(10), n = BigInt(20), r = BigInt(40), o = BigInt(80), i = un$1, c = t * t % i * t % i, a = it$1(c, Xr$1, i) * c % i, u = it$1(a, yc, i) * t % i, l = it$1(u, wc, i) * u % i, f = it$1(l, e, i) * l % i, h = it$1(f, n, i) * f % i, y = it$1(h, r, i) * h % i, E = it$1(y, o, i) * y % i, p = it$1(E, o, i) * y % i, d = it$1(p, e, i) * l % i;
  return { pow_p_5_8: it$1(d, Xr$1, i) * t % i, b2: c };
}
function Ec(t) {
  return t[0] &= 248, t[31] &= 127, t[31] |= 64, t;
}
const fn$1 = gc({ P: un$1, a: BigInt(486662), montgomeryBits: 255, nByteLength: 32, Gu: BigInt(9), powPminus2: (t) => {
  const e = un$1, { pow_p_5_8: n, b2: r } = bc(t);
  return X$2(it$1(n, mc, e) * r, e);
}, adjustScalarBytes: Ec, randomBytes: Lt$2 });
function Jr$1(t) {
  t.lowS !== void 0 && Ct$1("lowS", t.lowS), t.prehash !== void 0 && Ct$1("prehash", t.prehash);
}
function vc(t) {
  const e = Wr$1(t);
  Dt$1(e, { a: "field", b: "field" }, { allowedPrivateKeyLengths: "array", wrapPrivateKey: "boolean", isTorsionFree: "function", clearCofactor: "function", allowInfinityPoint: "boolean", fromBytes: "function", toBytes: "function" });
  const { endo: n, Fp: r, a: o } = e;
  if (n) {
    if (!r.eql(o, r.ZERO)) throw new Error("invalid endomorphism, can only be defined for Koblitz curves that have a=0");
    if (typeof n != "object" || typeof n.beta != "bigint" || typeof n.splitScalar != "function") throw new Error("invalid endomorphism, expected beta: bigint and splitScalar: function");
  }
  return Object.freeze({ ...e });
}
const { bytesToNumberBE: xc, hexToBytes: Sc } = ec;
class Oc extends Error {
  constructor(e = "") {
    super(e);
  }
}
const lt$1 = { Err: Oc, _tlv: { encode: (t, e) => {
  const { Err: n } = lt$1;
  if (t < 0 || t > 256) throw new n("tlv.encode: wrong tag");
  if (e.length & 1) throw new n("tlv.encode: unpadded data");
  const r = e.length / 2, o = kt$2(r);
  if (o.length / 2 & 128) throw new n("tlv.encode: long form length too big");
  const i = r > 127 ? kt$2(o.length / 2 | 128) : "";
  return kt$2(t) + i + o + e;
}, decode(t, e) {
  const { Err: n } = lt$1;
  let r = 0;
  if (t < 0 || t > 256) throw new n("tlv.encode: wrong tag");
  if (e.length < 2 || e[r++] !== t) throw new n("tlv.decode: wrong tlv");
  const o = e[r++], i = !!(o & 128);
  let s = 0;
  if (!i) s = o;
  else {
    const a = o & 127;
    if (!a) throw new n("tlv.decode(long): indefinite length not supported");
    if (a > 4) throw new n("tlv.decode(long): byte length is too big");
    const u = e.subarray(r, r + a);
    if (u.length !== a) throw new n("tlv.decode: length bytes not complete");
    if (u[0] === 0) throw new n("tlv.decode(long): zero leftmost byte");
    for (const l of u) s = s << 8 | l;
    if (r += a, s < 128) throw new n("tlv.decode(long): not minimal encoding");
  }
  const c = e.subarray(r, r + s);
  if (c.length !== s) throw new n("tlv.decode: wrong value length");
  return { v: c, l: e.subarray(r + s) };
} }, _int: { encode(t) {
  const { Err: e } = lt$1;
  if (t < dt$2) throw new e("integer: negative integers are not allowed");
  let n = kt$2(t);
  if (Number.parseInt(n[0], 16) & 8 && (n = "00" + n), n.length & 1) throw new e("unexpected DER parsing assertion: unpadded hex");
  return n;
}, decode(t) {
  const { Err: e } = lt$1;
  if (t[0] & 128) throw new e("invalid signature integer: negative");
  if (t[0] === 0 && !(t[1] & 128)) throw new e("invalid signature integer: unnecessary leading zero");
  return xc(t);
} }, toSig(t) {
  const { Err: e, _int: n, _tlv: r } = lt$1, o = typeof t == "string" ? Sc(t) : t;
  te$1(o);
  const { v: i, l: s } = r.decode(48, o);
  if (s.length) throw new e("invalid signature: left bytes after parsing");
  const { v: c, l: a } = r.decode(2, i), { v: u, l } = r.decode(2, a);
  if (l.length) throw new e("invalid signature: left bytes after parsing");
  return { r: n.decode(c), s: n.decode(u) };
}, hexFromSig(t) {
  const { _tlv: e, _int: n } = lt$1, r = e.encode(2, n.encode(t.r)), o = e.encode(2, n.encode(t.s)), i = r + o;
  return e.encode(48, i);
} }, dt$2 = BigInt(0), K$3 = BigInt(1);
BigInt(2);
const Qr$1 = BigInt(3);
BigInt(4);
function Ac(t) {
  const e = vc(t), { Fp: n } = e, r = Kr$1(e.n, e.nBitLength), o = e.toBytes || ((p, d, v) => {
    const m = d.toAffine();
    return ne$2(Uint8Array.from([4]), n.toBytes(m.x), n.toBytes(m.y));
  }), i = e.fromBytes || ((p) => {
    const d = p.subarray(1), v = n.fromBytes(d.subarray(0, n.BYTES)), m = n.fromBytes(d.subarray(n.BYTES, 2 * n.BYTES));
    return { x: v, y: m };
  });
  function s(p) {
    const { a: d, b: v } = e, m = n.sqr(p), O = n.mul(m, p);
    return n.add(n.add(O, n.mul(p, d)), v);
  }
  if (!n.eql(n.sqr(e.Gy), s(e.Gx))) throw new Error("bad generator point: equation left != right");
  function c(p) {
    return Ee$3(p, K$3, e.n);
  }
  function a(p) {
    const { allowedPrivateKeyLengths: d, nByteLength: v, wrapPrivateKey: m, n: O } = e;
    if (d && typeof p != "bigint") {
      if (St$3(p) && (p = Pt$2(p)), typeof p != "string" || !d.includes(p.length)) throw new Error("invalid private key");
      p = p.padStart(v * 2, "0");
    }
    let N;
    try {
      N = typeof p == "bigint" ? p : Ot$2(et$2("private key", p, v));
    } catch {
      throw new Error("invalid private key, expected hex or " + v + " bytes, got " + typeof p);
    }
    return m && (N = X$2(N, O)), ft$2("private key", N, K$3, O), N;
  }
  function u(p) {
    if (!(p instanceof h)) throw new Error("ProjectivePoint expected");
  }
  const l = tn$1((p, d) => {
    const { px: v, py: m, pz: O } = p;
    if (n.eql(O, n.ONE)) return { x: v, y: m };
    const N = p.is0();
    d == null && (d = N ? n.ONE : n.inv(O));
    const $ = n.mul(v, d), B = n.mul(m, d), A = n.mul(O, d);
    if (N) return { x: n.ZERO, y: n.ZERO };
    if (!n.eql(A, n.ONE)) throw new Error("invZ was invalid");
    return { x: $, y: B };
  }), f = tn$1((p) => {
    if (p.is0()) {
      if (e.allowInfinityPoint && !n.is0(p.py)) return;
      throw new Error("bad point: ZERO");
    }
    const { x: d, y: v } = p.toAffine();
    if (!n.isValid(d) || !n.isValid(v)) throw new Error("bad point: x or y not FE");
    const m = n.sqr(v), O = s(d);
    if (!n.eql(m, O)) throw new Error("bad point: equation left != right");
    if (!p.isTorsionFree()) throw new Error("bad point: not in prime-order subgroup");
    return true;
  });
  class h {
    constructor(d, v, m) {
      if (this.px = d, this.py = v, this.pz = m, d == null || !n.isValid(d)) throw new Error("x required");
      if (v == null || !n.isValid(v)) throw new Error("y required");
      if (m == null || !n.isValid(m)) throw new Error("z required");
      Object.freeze(this);
    }
    static fromAffine(d) {
      const { x: v, y: m } = d || {};
      if (!d || !n.isValid(v) || !n.isValid(m)) throw new Error("invalid affine point");
      if (d instanceof h) throw new Error("projective point not allowed");
      const O = (N) => n.eql(N, n.ZERO);
      return O(v) && O(m) ? h.ZERO : new h(v, m, n.ONE);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    static normalizeZ(d) {
      const v = n.invertBatch(d.map((m) => m.pz));
      return d.map((m, O) => m.toAffine(v[O])).map(h.fromAffine);
    }
    static fromHex(d) {
      const v = h.fromAffine(i(et$2("pointHex", d)));
      return v.assertValidity(), v;
    }
    static fromPrivateKey(d) {
      return h.BASE.multiply(a(d));
    }
    static msm(d, v) {
      return hc(h, r, d, v);
    }
    _setWindowSize(d) {
      E.setWindowSize(this, d);
    }
    assertValidity() {
      f(this);
    }
    hasEvenY() {
      const { y: d } = this.toAffine();
      if (n.isOdd) return !n.isOdd(d);
      throw new Error("Field doesn't support isOdd");
    }
    equals(d) {
      u(d);
      const { px: v, py: m, pz: O } = this, { px: N, py: $, pz: B } = d, A = n.eql(n.mul(v, B), n.mul(N, O)), T = n.eql(n.mul(m, B), n.mul($, O));
      return A && T;
    }
    negate() {
      return new h(this.px, n.neg(this.py), this.pz);
    }
    double() {
      const { a: d, b: v } = e, m = n.mul(v, Qr$1), { px: O, py: N, pz: $ } = this;
      let B = n.ZERO, A = n.ZERO, T = n.ZERO, S = n.mul(O, O), L = n.mul(N, N), U = n.mul($, $), _ = n.mul(O, N);
      return _ = n.add(_, _), T = n.mul(O, $), T = n.add(T, T), B = n.mul(d, T), A = n.mul(m, U), A = n.add(B, A), B = n.sub(L, A), A = n.add(L, A), A = n.mul(B, A), B = n.mul(_, B), T = n.mul(m, T), U = n.mul(d, U), _ = n.sub(S, U), _ = n.mul(d, _), _ = n.add(_, T), T = n.add(S, S), S = n.add(T, S), S = n.add(S, U), S = n.mul(S, _), A = n.add(A, S), U = n.mul(N, $), U = n.add(U, U), S = n.mul(U, _), B = n.sub(B, S), T = n.mul(U, L), T = n.add(T, T), T = n.add(T, T), new h(B, A, T);
    }
    add(d) {
      u(d);
      const { px: v, py: m, pz: O } = this, { px: N, py: $, pz: B } = d;
      let A = n.ZERO, T = n.ZERO, S = n.ZERO;
      const L = e.a, U = n.mul(e.b, Qr$1);
      let _ = n.mul(v, N), j = n.mul(m, $), g = n.mul(O, B), w = n.add(v, m), b = n.add(N, $);
      w = n.mul(w, b), b = n.add(_, j), w = n.sub(w, b), b = n.add(v, O);
      let I = n.add(N, B);
      return b = n.mul(b, I), I = n.add(_, g), b = n.sub(b, I), I = n.add(m, O), A = n.add($, B), I = n.mul(I, A), A = n.add(j, g), I = n.sub(I, A), S = n.mul(L, b), A = n.mul(U, g), S = n.add(A, S), A = n.sub(j, S), S = n.add(j, S), T = n.mul(A, S), j = n.add(_, _), j = n.add(j, _), g = n.mul(L, g), b = n.mul(U, b), j = n.add(j, g), g = n.sub(_, g), g = n.mul(L, g), b = n.add(b, g), _ = n.mul(j, b), T = n.add(T, _), _ = n.mul(I, b), A = n.mul(w, A), A = n.sub(A, _), _ = n.mul(w, j), S = n.mul(I, S), S = n.add(S, _), new h(A, T, S);
    }
    subtract(d) {
      return this.add(d.negate());
    }
    is0() {
      return this.equals(h.ZERO);
    }
    wNAF(d) {
      return E.wNAFCached(this, d, h.normalizeZ);
    }
    multiplyUnsafe(d) {
      const { endo: v, n: m } = e;
      ft$2("scalar", d, dt$2, m);
      const O = h.ZERO;
      if (d === dt$2) return O;
      if (this.is0() || d === K$3) return this;
      if (!v || E.hasPrecomputes(this)) return E.wNAFCachedUnsafe(this, d, h.normalizeZ);
      let { k1neg: N, k1: $, k2neg: B, k2: A } = v.splitScalar(d), T = O, S = O, L = this;
      for (; $ > dt$2 || A > dt$2; ) $ & K$3 && (T = T.add(L)), A & K$3 && (S = S.add(L)), L = L.double(), $ >>= K$3, A >>= K$3;
      return N && (T = T.negate()), B && (S = S.negate()), S = new h(n.mul(S.px, v.beta), S.py, S.pz), T.add(S);
    }
    multiply(d) {
      const { endo: v, n: m } = e;
      ft$2("scalar", d, K$3, m);
      let O, N;
      if (v) {
        const { k1neg: $, k1: B, k2neg: A, k2: T } = v.splitScalar(d);
        let { p: S, f: L } = this.wNAF(B), { p: U, f: _ } = this.wNAF(T);
        S = E.constTimeNegate($, S), U = E.constTimeNegate(A, U), U = new h(n.mul(U.px, v.beta), U.py, U.pz), O = S.add(U), N = L.add(_);
      } else {
        const { p: $, f: B } = this.wNAF(d);
        O = $, N = B;
      }
      return h.normalizeZ([O, N])[0];
    }
    multiplyAndAddUnsafe(d, v, m) {
      const O = h.BASE, N = (B, A) => A === dt$2 || A === K$3 || !B.equals(O) ? B.multiplyUnsafe(A) : B.multiply(A), $ = N(this, v).add(N(d, m));
      return $.is0() ? void 0 : $;
    }
    toAffine(d) {
      return l(this, d);
    }
    isTorsionFree() {
      const { h: d, isTorsionFree: v } = e;
      if (d === K$3) return true;
      if (v) return v(h, this);
      throw new Error("isTorsionFree() has not been declared for the elliptic curve");
    }
    clearCofactor() {
      const { h: d, clearCofactor: v } = e;
      return d === K$3 ? this : v ? v(h, this) : this.multiplyUnsafe(e.h);
    }
    toRawBytes(d = true) {
      return Ct$1("isCompressed", d), this.assertValidity(), o(h, this, d);
    }
    toHex(d = true) {
      return Ct$1("isCompressed", d), Pt$2(this.toRawBytes(d));
    }
  }
  h.BASE = new h(e.Gx, e.Gy, n.ONE), h.ZERO = new h(n.ZERO, n.ONE, n.ZERO);
  const y = e.nBitLength, E = dc(h, e.endo ? Math.ceil(y / 2) : y);
  return { CURVE: e, ProjectivePoint: h, normPrivateKeyToScalar: a, weierstrassEquation: s, isWithinCurveOrder: c };
}
function Bc(t) {
  const e = Wr$1(t);
  return Dt$1(e, { hash: "hash", hmac: "function", randomBytes: "function" }, { bits2int: "function", bits2int_modN: "function", lowS: "boolean" }), Object.freeze({ lowS: true, ...e });
}
function Ic(t) {
  const e = Bc(t), { Fp: n, n: r } = e, o = n.BYTES + 1, i = 2 * n.BYTES + 1;
  function s(g) {
    return X$2(g, r);
  }
  function c(g) {
    return nn$1(g, r);
  }
  const { ProjectivePoint: a, normPrivateKeyToScalar: u, weierstrassEquation: l, isWithinCurveOrder: f } = Ac({ ...e, toBytes(g, w, b) {
    const I = w.toAffine(), R = n.toBytes(I.x), x = ne$2;
    return Ct$1("isCompressed", b), b ? x(Uint8Array.from([w.hasEvenY() ? 2 : 3]), R) : x(Uint8Array.from([4]), R, n.toBytes(I.y));
  }, fromBytes(g) {
    const w = g.length, b = g[0], I = g.subarray(1);
    if (w === o && (b === 2 || b === 3)) {
      const R = Ot$2(I);
      if (!Ee$3(R, K$3, n.ORDER)) throw new Error("Point is not on curve");
      const x = l(R);
      let C;
      try {
        C = n.sqrt(x);
      } catch (M) {
        const D = M instanceof Error ? ": " + M.message : "";
        throw new Error("Point is not on curve" + D);
      }
      const P = (C & K$3) === K$3;
      return (b & 1) === 1 !== P && (C = n.neg(C)), { x: R, y: C };
    } else if (w === i && b === 4) {
      const R = n.fromBytes(I.subarray(0, n.BYTES)), x = n.fromBytes(I.subarray(n.BYTES, 2 * n.BYTES));
      return { x: R, y: x };
    } else {
      const R = o, x = i;
      throw new Error("invalid Point, expected length of " + R + ", or uncompressed " + x + ", got " + w);
    }
  } }), h = (g) => Pt$2(Mt$2(g, e.nByteLength));
  function y(g) {
    const w = r >> K$3;
    return g > w;
  }
  function E(g) {
    return y(g) ? s(-g) : g;
  }
  const p = (g, w, b) => Ot$2(g.slice(w, b));
  class d {
    constructor(w, b, I) {
      this.r = w, this.s = b, this.recovery = I, this.assertValidity();
    }
    static fromCompact(w) {
      const b = e.nByteLength;
      return w = et$2("compactSignature", w, b * 2), new d(p(w, 0, b), p(w, b, 2 * b));
    }
    static fromDER(w) {
      const { r: b, s: I } = lt$1.toSig(et$2("DER", w));
      return new d(b, I);
    }
    assertValidity() {
      ft$2("r", this.r, K$3, r), ft$2("s", this.s, K$3, r);
    }
    addRecoveryBit(w) {
      return new d(this.r, this.s, w);
    }
    recoverPublicKey(w) {
      const { r: b, s: I, recovery: R } = this, x = B(et$2("msgHash", w));
      if (R == null || ![0, 1, 2, 3].includes(R)) throw new Error("recovery id invalid");
      const C = R === 2 || R === 3 ? b + e.n : b;
      if (C >= n.ORDER) throw new Error("recovery id 2 or 3 invalid");
      const P = (R & 1) === 0 ? "02" : "03", k = a.fromHex(P + h(C)), M = c(C), D = s(-x * M), z = s(I * M), Z = a.BASE.multiplyAndAddUnsafe(k, D, z);
      if (!Z) throw new Error("point at infinify");
      return Z.assertValidity(), Z;
    }
    hasHighS() {
      return y(this.s);
    }
    normalizeS() {
      return this.hasHighS() ? new d(this.r, s(-this.s), this.recovery) : this;
    }
    toDERRawBytes() {
      return Vt$2(this.toDERHex());
    }
    toDERHex() {
      return lt$1.hexFromSig({ r: this.r, s: this.s });
    }
    toCompactRawBytes() {
      return Vt$2(this.toCompactHex());
    }
    toCompactHex() {
      return h(this.r) + h(this.s);
    }
  }
  const v = { isValidPrivateKey(g) {
    try {
      return u(g), true;
    } catch {
      return false;
    }
  }, normPrivateKeyToScalar: u, randomPrivateKey: () => {
    const g = zr$1(e.n);
    return uc(e.randomBytes(g), e.n);
  }, precompute(g = 8, w = a.BASE) {
    return w._setWindowSize(g), w.multiply(BigInt(3)), w;
  } };
  function m(g, w = true) {
    return a.fromPrivateKey(g).toRawBytes(w);
  }
  function O(g) {
    const w = St$3(g), b = typeof g == "string", I = (w || b) && g.length;
    return w ? I === o || I === i : b ? I === 2 * o || I === 2 * i : g instanceof a;
  }
  function N(g, w, b = true) {
    if (O(g)) throw new Error("first arg must be private key");
    if (!O(w)) throw new Error("second arg must be public key");
    return a.fromHex(w).multiply(u(g)).toRawBytes(b);
  }
  const $ = e.bits2int || function(g) {
    if (g.length > 8192) throw new Error("input is too large");
    const w = Ot$2(g), b = g.length * 8 - e.nBitLength;
    return b > 0 ? w >> BigInt(b) : w;
  }, B = e.bits2int_modN || function(g) {
    return s($(g));
  }, A = Je$2(e.nBitLength);
  function T(g) {
    return ft$2("num < 2^" + e.nBitLength, g, dt$2, A), Mt$2(g, e.nByteLength);
  }
  function S(g, w, b = L) {
    if (["recovered", "canonical"].some((W) => W in b)) throw new Error("sign() legacy options not supported");
    const { hash: I, randomBytes: R } = e;
    let { lowS: x, prehash: C, extraEntropy: P } = b;
    x == null && (x = true), g = et$2("msgHash", g), Jr$1(b), C && (g = et$2("prehashed msgHash", I(g)));
    const k = B(g), M = u(w), D = [T(M), T(k)];
    if (P != null && P !== false) {
      const W = P === true ? R(n.BYTES) : P;
      D.push(et$2("extraEntropy", W));
    }
    const z = ne$2(...D), Z = k;
    function st(W) {
      const J = $(W);
      if (!f(J)) return;
      const Be = c(J), zt = a.BASE.multiply(J).toAffine(), vt = s(zt.x);
      if (vt === dt$2) return;
      const Zt = s(Be * s(Z + vt * M));
      if (Zt === dt$2) return;
      let Ut = (zt.x === vt ? 0 : 2) | Number(zt.y & K$3), vn = Zt;
      return x && y(Zt) && (vn = E(Zt), Ut ^= 1), new d(vt, vn, Ut);
    }
    return { seed: z, k2sig: st };
  }
  const L = { lowS: e.lowS, prehash: false }, U = { lowS: e.lowS, prehash: false };
  function _(g, w, b = L) {
    const { seed: I, k2sig: R } = S(g, w, b), x = e;
    return Vr$1(x.hash.outputLen, x.nByteLength, x.hmac)(I, R);
  }
  a.BASE._setWindowSize(8);
  function j(g, w, b, I = U) {
    const R = g;
    w = et$2("msgHash", w), b = et$2("publicKey", b);
    const { lowS: x, prehash: C, format: P } = I;
    if (Jr$1(I), "strict" in I) throw new Error("options.strict was renamed to lowS");
    if (P !== void 0 && P !== "compact" && P !== "der") throw new Error("format must be compact or der");
    const k = typeof R == "string" || St$3(R), M = !k && !P && typeof R == "object" && R !== null && typeof R.r == "bigint" && typeof R.s == "bigint";
    if (!k && !M) throw new Error("invalid signature, expected Uint8Array, hex string or Signature instance");
    let D, z;
    try {
      if (M && (D = new d(R.r, R.s)), k) {
        try {
          P !== "compact" && (D = d.fromDER(R));
        } catch (Ut) {
          if (!(Ut instanceof lt$1.Err)) throw Ut;
        }
        !D && P !== "der" && (D = d.fromCompact(R));
      }
      z = a.fromHex(b);
    } catch {
      return false;
    }
    if (!D || x && D.hasHighS()) return false;
    C && (w = e.hash(w));
    const { r: Z, s: st } = D, W = B(w), J = c(st), Be = s(W * J), zt = s(Z * J), vt = a.BASE.multiplyAndAddUnsafe(z, Be, zt)?.toAffine();
    return vt ? s(vt.x) === Z : false;
  }
  return { CURVE: e, getPublicKey: m, getSharedSecret: N, sign: _, verify: j, ProjectivePoint: a, Signature: d, utils: v };
}
function Nc(t) {
  return { hash: t, hmac: (e, ...n) => ye$2(t, e, Vi$1(...n)), randomBytes: Lt$2 };
}
function Uc(t, e) {
  const n = (r) => Ic({ ...t, ...Nc(r) });
  return { ...n(e), create: n };
}
const to$1 = Kr$1(BigInt("0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff")), Tc = to$1.create(BigInt("-3")), Rc = BigInt("0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b"), _c = Uc({ a: Tc, b: Rc, Fp: to$1, n: BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551"), Gx: BigInt("0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296"), Gy: BigInt("0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5"), h: BigInt(1), lowS: false }, Qt$2), ln$1 = "base10", G$2 = "base16", qt$2 = "base64pad", xe$1 = "base64url", Kt$2 = "utf8", dn$1 = 0, Ft$2 = 1, re$2 = 2, $c = 0, eo$1 = 1, oe$1 = 12, hn$1 = 32;
function Lc() {
  const t = fn$1.utils.randomPrivateKey(), e = fn$1.getPublicKey(t);
  return { privateKey: toString(t, G$2), publicKey: toString(e, G$2) };
}
function jc() {
  const t = Lt$2(hn$1);
  return toString(t, G$2);
}
function Cc(t, e) {
  const n = fn$1.getSharedSecret(fromString(t, G$2), fromString(e, G$2)), r = Vs$1(Qt$2, n, void 0, void 0, hn$1);
  return toString(r, G$2);
}
function Pc(t) {
  const e = Qt$2(fromString(t, G$2));
  return toString(e, G$2);
}
function kc(t) {
  const e = Qt$2(fromString(t, Kt$2));
  return toString(e, G$2);
}
function pn$1(t) {
  return fromString(`${t}`, ln$1);
}
function Bt$2(t) {
  return Number(toString(t, ln$1));
}
function no$1(t) {
  return t.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function ro$1(t) {
  const e = t.replace(/-/g, "+").replace(/_/g, "/"), n = (4 - e.length % 4) % 4;
  return e + "=".repeat(n);
}
function Vc(t) {
  const e = pn$1(typeof t.type < "u" ? t.type : dn$1);
  if (Bt$2(e) === Ft$2 && typeof t.senderPublicKey > "u") throw new Error("Missing sender public key for type 1 envelope");
  const n = typeof t.senderPublicKey < "u" ? fromString(t.senderPublicKey, G$2) : void 0, r = typeof t.iv < "u" ? fromString(t.iv, G$2) : Lt$2(oe$1), o = fromString(t.symKey, G$2), i = $r$1(o, r).encrypt(fromString(t.message, Kt$2)), s = gn$1({ type: e, sealed: i, iv: r, senderPublicKey: n });
  return t.encoding === xe$1 ? no$1(s) : s;
}
function Mc(t) {
  const e = fromString(t.symKey, G$2), { sealed: n, iv: r } = Se$1({ encoded: t.encoded, encoding: t.encoding }), o = $r$1(e, r).decrypt(n);
  if (o === null) throw new Error("Failed to decrypt");
  return toString(o, Kt$2);
}
function Dc(t, e) {
  const n = pn$1(re$2), r = Lt$2(oe$1), o = fromString(t, Kt$2), i = gn$1({ type: n, sealed: o, iv: r });
  return e === xe$1 ? no$1(i) : i;
}
function Hc(t, e) {
  const { sealed: n } = Se$1({ encoded: t, encoding: e });
  return toString(n, Kt$2);
}
function gn$1(t) {
  if (Bt$2(t.type) === re$2) return toString(concat([t.type, t.sealed]), qt$2);
  if (Bt$2(t.type) === Ft$2) {
    if (typeof t.senderPublicKey > "u") throw new Error("Missing sender public key for type 1 envelope");
    return toString(concat([t.type, t.senderPublicKey, t.iv, t.sealed]), qt$2);
  }
  return toString(concat([t.type, t.iv, t.sealed]), qt$2);
}
function Se$1(t) {
  const e = (t.encoding || qt$2) === xe$1 ? ro$1(t.encoded) : t.encoded, n = fromString(e, qt$2), r = n.slice($c, eo$1), o = eo$1;
  if (Bt$2(r) === Ft$2) {
    const a = o + hn$1, u = a + oe$1, l = n.slice(o, a), f = n.slice(a, u), h = n.slice(u);
    return { type: r, sealed: h, iv: f, senderPublicKey: l };
  }
  if (Bt$2(r) === re$2) {
    const a = n.slice(o), u = Lt$2(oe$1);
    return { type: r, sealed: a, iv: u };
  }
  const i = o + oe$1, s = n.slice(o, i), c = n.slice(i);
  return { type: r, sealed: c, iv: s };
}
function qc(t, e) {
  const n = Se$1({ encoded: t, encoding: e?.encoding });
  return oo$1({ type: Bt$2(n.type), senderPublicKey: typeof n.senderPublicKey < "u" ? toString(n.senderPublicKey, G$2) : void 0, receiverPublicKey: e?.receiverPublicKey });
}
function oo$1(t) {
  const e = t?.type || dn$1;
  if (e === Ft$2) {
    if (typeof t?.senderPublicKey > "u") throw new Error("missing sender public key");
    if (typeof t?.receiverPublicKey > "u") throw new Error("missing receiver public key");
  }
  return { type: e, senderPublicKey: t?.senderPublicKey, receiverPublicKey: t?.receiverPublicKey };
}
function Kc(t) {
  return t.type === Ft$2 && typeof t.senderPublicKey == "string" && typeof t.receiverPublicKey == "string";
}
function Fc(t) {
  return t.type === re$2;
}
function io$1(t) {
  const e = Buffer.from(t.x, "base64"), n = Buffer.from(t.y, "base64");
  return concat([new Uint8Array([4]), e, n]);
}
function zc(t, e) {
  const [n, r, o] = t.split("."), i = Buffer.from(ro$1(o), "base64");
  if (i.length !== 64) throw new Error("Invalid signature length");
  const s = i.slice(0, 32), c = i.slice(32, 64), a = `${n}.${r}`, u = Qt$2(a), l = io$1(e);
  if (!_c.verify(concat([s, c]), u, l)) throw new Error("Invalid signature");
  return sn$2(t).payload;
}
const so$1 = "irn";
function Zc(t) {
  return t?.relay || { protocol: so$1 };
}
function Yc(t) {
  const e = C$4[t];
  if (typeof e > "u") throw new Error(`Relay Protocol not supported: ${t}`);
  return e;
}
function co$1(t, e = "-") {
  const n = {}, r = "relay" + e;
  return Object.keys(t).forEach((o) => {
    if (o.startsWith(r)) {
      const i = o.replace(r, ""), s = t[o];
      n[i] = s;
    }
  }), n;
}
function Gc(t) {
  if (!t.includes("wc:")) {
    const u = je$2(t);
    u != null && u.includes("wc:") && (t = u);
  }
  t = t.includes("wc://") ? t.replace("wc://", "") : t, t = t.includes("wc:") ? t.replace("wc:", "") : t;
  const e = t.indexOf(":"), n = t.indexOf("?") !== -1 ? t.indexOf("?") : void 0, r = t.substring(0, e), o = t.substring(e + 1, n).split("@"), i = typeof n < "u" ? t.substring(n) : "", s = new URLSearchParams(i), c = {};
  s.forEach((u, l) => {
    c[l] = u;
  });
  const a = typeof c.methods == "string" ? c.methods.split(",") : void 0;
  return { protocol: r, topic: ao$1(o[0]), version: parseInt(o[1], 10), symKey: c.symKey, relay: co$1(c), methods: a, expiryTimestamp: c.expiryTimestamp ? parseInt(c.expiryTimestamp, 10) : void 0 };
}
function ao$1(t) {
  return t.startsWith("//") ? t.substring(2) : t;
}
function uo$1(t, e = "-") {
  const n = "relay", r = {};
  return Object.keys(t).forEach((o) => {
    const i = o, s = n + e + i;
    t[i] && (r[s] = t[i]);
  }), r;
}
function Wc(t) {
  const e = new URLSearchParams(), n = uo$1(t.relay);
  Object.keys(n).sort().forEach((o) => {
    e.set(o, n[o]);
  }), e.set("symKey", t.symKey), t.expiryTimestamp && e.set("expiryTimestamp", t.expiryTimestamp.toString()), t.methods && e.set("methods", t.methods.join(","));
  const r = e.toString();
  return `${t.protocol}:${t.topic}@${t.version}?${r}`;
}
function Xc(t, e, n) {
  return `${t}?wc_ev=${n}&topic=${e}`;
}
var Jc = Object.defineProperty, Qc = Object.defineProperties, ta = Object.getOwnPropertyDescriptors, fo$1 = Object.getOwnPropertySymbols, ea = Object.prototype.hasOwnProperty, na = Object.prototype.propertyIsEnumerable, lo$1 = (t, e, n) => e in t ? Jc(t, e, { enumerable: true, configurable: true, writable: true, value: n }) : t[e] = n, ra = (t, e) => {
  for (var n in e || (e = {})) ea.call(e, n) && lo$1(t, n, e[n]);
  if (fo$1) for (var n of fo$1(e)) na.call(e, n) && lo$1(t, n, e[n]);
  return t;
}, oa = (t, e) => Qc(t, ta(e));
function It$2(t) {
  const e = [];
  return t.forEach((n) => {
    const [r, o] = n.split(":");
    e.push(`${r}:${o}`);
  }), e;
}
function ho$1(t) {
  const e = [];
  return Object.values(t).forEach((n) => {
    e.push(...It$2(n.accounts));
  }), e;
}
function po$1(t, e) {
  const n = [];
  return Object.values(t).forEach((r) => {
    It$2(r.accounts).includes(e) && n.push(...r.methods);
  }), n;
}
function go$1(t, e) {
  const n = [];
  return Object.values(t).forEach((r) => {
    It$2(r.accounts).includes(e) && n.push(...r.events);
  }), n;
}
function yn$1(t) {
  return t.includes(":");
}
function yo$1(t) {
  return yn$1(t) ? t.split(":")[0] : t;
}
function ie$1(t) {
  var e, n, r;
  const o = {};
  if (!Oe$1(t)) return o;
  for (const [i, s] of Object.entries(t)) {
    const c = yn$1(i) ? [i] : s.chains, a = s.methods || [], u = s.events || [], l = yo$1(i);
    o[l] = oa(ra({}, o[l]), { chains: ot$1(c, (e = o[l]) == null ? void 0 : e.chains), methods: ot$1(a, (n = o[l]) == null ? void 0 : n.methods), events: ot$1(u, (r = o[l]) == null ? void 0 : r.events) });
  }
  return o;
}
function mo$1(t) {
  const e = {};
  return t?.forEach((n) => {
    var r;
    const [o, i] = n.split(":");
    e[o] || (e[o] = { accounts: [], chains: [], events: [], methods: [] }), e[o].accounts.push(n), (r = e[o].chains) == null || r.push(`${o}:${i}`);
  }), e;
}
function ca(t, e) {
  e = e.map((r) => r.replace("did:pkh:", ""));
  const n = mo$1(e);
  for (const [r, o] of Object.entries(n)) o.methods ? o.methods = ot$1(o.methods, t) : o.methods = t, o.events = ["chainChanged", "accountsChanged"];
  return n;
}
function aa(t, e) {
  var n, r, o, i, s, c;
  const a = ie$1(t), u = ie$1(e), l = {}, f = Object.keys(a).concat(Object.keys(u));
  for (const h of f) l[h] = { chains: ot$1((n = a[h]) == null ? void 0 : n.chains, (r = u[h]) == null ? void 0 : r.chains), methods: ot$1((o = a[h]) == null ? void 0 : o.methods, (i = u[h]) == null ? void 0 : i.methods), events: ot$1((s = a[h]) == null ? void 0 : s.events, (c = u[h]) == null ? void 0 : c.events) };
  return l;
}
const wo$1 = { INVALID_METHOD: { message: "Invalid method.", code: 1001 }, INVALID_EVENT: { message: "Invalid event.", code: 1002 }, INVALID_UPDATE_REQUEST: { message: "Invalid update request.", code: 1003 }, INVALID_EXTEND_REQUEST: { message: "Invalid extend request.", code: 1004 }, INVALID_SESSION_SETTLE_REQUEST: { message: "Invalid session settle request.", code: 1005 }, UNAUTHORIZED_METHOD: { message: "Unauthorized method.", code: 3001 }, UNAUTHORIZED_EVENT: { message: "Unauthorized event.", code: 3002 }, UNAUTHORIZED_UPDATE_REQUEST: { message: "Unauthorized update request.", code: 3003 }, UNAUTHORIZED_EXTEND_REQUEST: { message: "Unauthorized extend request.", code: 3004 }, USER_REJECTED: { message: "User rejected.", code: 5e3 }, USER_REJECTED_CHAINS: { message: "User rejected chains.", code: 5001 }, USER_REJECTED_METHODS: { message: "User rejected methods.", code: 5002 }, USER_REJECTED_EVENTS: { message: "User rejected events.", code: 5003 }, UNSUPPORTED_CHAINS: { message: "Unsupported chains.", code: 5100 }, UNSUPPORTED_METHODS: { message: "Unsupported methods.", code: 5101 }, UNSUPPORTED_EVENTS: { message: "Unsupported events.", code: 5102 }, UNSUPPORTED_ACCOUNTS: { message: "Unsupported accounts.", code: 5103 }, UNSUPPORTED_NAMESPACE_KEY: { message: "Unsupported namespace key.", code: 5104 }, USER_DISCONNECTED: { message: "User disconnected.", code: 6e3 }, SESSION_SETTLEMENT_FAILED: { message: "Session settlement failed.", code: 7e3 }, WC_METHOD_UNSUPPORTED: { message: "Unsupported wc_ method.", code: 10001 } }, bo$1 = { NOT_INITIALIZED: { message: "Not initialized.", code: 1 }, NO_MATCHING_KEY: { message: "No matching key.", code: 2 }, RESTORE_WILL_OVERRIDE: { message: "Restore will override.", code: 3 }, RESUBSCRIBED: { message: "Resubscribed.", code: 4 }, MISSING_OR_INVALID: { message: "Missing or invalid.", code: 5 }, EXPIRED: { message: "Expired.", code: 6 }, UNKNOWN_TYPE: { message: "Unknown type.", code: 7 }, MISMATCHED_TOPIC: { message: "Mismatched topic.", code: 8 }, NON_CONFORMING_NAMESPACES: { message: "Non conforming namespaces.", code: 9 } };
function ht$2(t, e) {
  const { message: n, code: r } = bo$1[t];
  return { message: e ? `${n} ${e}` : n, code: r };
}
function Nt$1(t, e) {
  const { message: n, code: r } = wo$1[t];
  return { message: e ? `${n} ${e}` : n, code: r };
}
function se$2(t, e) {
  return Array.isArray(t) ? true : false;
}
function Oe$1(t) {
  return Object.getPrototypeOf(t) === Object.prototype && Object.keys(t).length;
}
function Et$2(t) {
  return typeof t > "u";
}
function nt$2(t, e) {
  return e && Et$2(t) ? true : typeof t == "string" && !!t.trim().length;
}
function Ae$1(t, e) {
  return e && Et$2(t) ? true : typeof t == "number" && !isNaN(t);
}
function ua(t, e) {
  const { requiredNamespaces: n } = e, r = Object.keys(t.namespaces), o = Object.keys(n);
  let i = true;
  return gt$2(o, r) ? (r.forEach((s) => {
    const { accounts: c, methods: a, events: u } = t.namespaces[s], l = It$2(c), f = n[s];
    (!gt$2(ue$2(s, f), l) || !gt$2(f.methods, a) || !gt$2(f.events, u)) && (i = false);
  }), i) : false;
}
function ce$2(t) {
  return nt$2(t, false) && t.includes(":") ? t.split(":").length === 2 : false;
}
function Eo$1(t) {
  if (nt$2(t, false) && t.includes(":")) {
    const e = t.split(":");
    if (e.length === 3) {
      const n = e[0] + ":" + e[1];
      return !!e[2] && ce$2(n);
    }
  }
  return false;
}
function fa(t) {
  function e(n) {
    try {
      return typeof new URL(n) < "u";
    } catch {
      return false;
    }
  }
  try {
    if (nt$2(t, false)) {
      if (e(t)) return true;
      const n = je$2(t);
      return e(n);
    }
  } catch {
  }
  return false;
}
function la(t) {
  var e;
  return (e = t?.proposer) == null ? void 0 : e.publicKey;
}
function da(t) {
  return t?.topic;
}
function ha(t, e) {
  let n = null;
  return nt$2(t?.publicKey, false) || (n = ht$2("MISSING_OR_INVALID", `${e} controller public key should be a string`)), n;
}
function mn$1(t) {
  let e = true;
  return se$2(t) ? t.length && (e = t.every((n) => nt$2(n, false))) : e = false, e;
}
function vo$1(t, e, n) {
  let r = null;
  return se$2(e) && e.length ? e.forEach((o) => {
    r || ce$2(o) || (r = Nt$1("UNSUPPORTED_CHAINS", `${n}, chain ${o} should be a string and conform to "namespace:chainId" format`));
  }) : ce$2(t) || (r = Nt$1("UNSUPPORTED_CHAINS", `${n}, chains must be defined as "namespace:chainId" e.g. "eip155:1": {...} in the namespace key OR as an array of CAIP-2 chainIds e.g. eip155: { chains: ["eip155:1", "eip155:5"] }`)), r;
}
function xo$1(t, e, n) {
  let r = null;
  return Object.entries(t).forEach(([o, i]) => {
    if (r) return;
    const s = vo$1(o, ue$2(o, i), `${e} ${n}`);
    s && (r = s);
  }), r;
}
function So$1(t, e) {
  let n = null;
  return se$2(t) ? t.forEach((r) => {
    n || Eo$1(r) || (n = Nt$1("UNSUPPORTED_ACCOUNTS", `${e}, account ${r} should be a string and conform to "namespace:chainId:address" format`));
  }) : n = Nt$1("UNSUPPORTED_ACCOUNTS", `${e}, accounts should be an array of strings conforming to "namespace:chainId:address" format`), n;
}
function Oo$1(t, e) {
  let n = null;
  return Object.values(t).forEach((r) => {
    if (n) return;
    const o = So$1(r?.accounts, `${e} namespace`);
    o && (n = o);
  }), n;
}
function Ao$1(t, e) {
  let n = null;
  return mn$1(t?.methods) ? mn$1(t?.events) || (n = Nt$1("UNSUPPORTED_EVENTS", `${e}, events should be an array of strings or empty array for no events`)) : n = Nt$1("UNSUPPORTED_METHODS", `${e}, methods should be an array of strings or empty array for no methods`), n;
}
function wn$1(t, e) {
  let n = null;
  return Object.values(t).forEach((r) => {
    if (n) return;
    const o = Ao$1(r, `${e}, namespace`);
    o && (n = o);
  }), n;
}
function pa(t, e, n) {
  let r = null;
  if (t && Oe$1(t)) {
    const o = wn$1(t, e);
    o && (r = o);
    const i = xo$1(t, e, n);
    i && (r = i);
  } else r = ht$2("MISSING_OR_INVALID", `${e}, ${n} should be an object with data`);
  return r;
}
function Bo$1(t, e) {
  let n = null;
  if (t && Oe$1(t)) {
    const r = wn$1(t, e);
    r && (n = r);
    const o = Oo$1(t, e);
    o && (n = o);
  } else n = ht$2("MISSING_OR_INVALID", `${e}, namespaces should be an object with data`);
  return n;
}
function Io$1(t) {
  return nt$2(t.protocol, true);
}
function ga(t, e) {
  let n = false;
  return !t ? n = true : t && se$2(t) && t.length && t.forEach((r) => {
    n = Io$1(r);
  }), n;
}
function ya(t) {
  return typeof t == "number";
}
function ma(t) {
  return typeof t < "u" && typeof t !== null;
}
function wa(t) {
  return !(!t || typeof t != "object" || !t.code || !Ae$1(t.code, false) || !t.message || !nt$2(t.message, false));
}
function ba(t) {
  return !(Et$2(t) || !nt$2(t.method, false));
}
function Ea(t) {
  return !(Et$2(t) || Et$2(t.result) && Et$2(t.error) || !Ae$1(t.id, false) || !nt$2(t.jsonrpc, false));
}
function va(t) {
  return !(Et$2(t) || !nt$2(t.name, false));
}
function xa(t, e) {
  return !(!ce$2(e) || !ho$1(t).includes(e));
}
function Sa(t, e, n) {
  return nt$2(n, false) ? po$1(t, e).includes(n) : false;
}
function Oa(t, e, n) {
  return nt$2(n, false) ? go$1(t, e).includes(n) : false;
}
function No$1(t, e, n) {
  let r = null;
  const o = Aa(t), i = Ba(e), s = Object.keys(o), c = Object.keys(i), a = Uo$1(Object.keys(t)), u = Uo$1(Object.keys(e)), l = a.filter((f) => !u.includes(f));
  return l.length && (r = ht$2("NON_CONFORMING_NAMESPACES", `${n} namespaces keys don't satisfy requiredNamespaces.
      Required: ${l.toString()}
      Received: ${Object.keys(e).toString()}`)), gt$2(s, c) || (r = ht$2("NON_CONFORMING_NAMESPACES", `${n} namespaces chains don't satisfy required namespaces.
      Required: ${s.toString()}
      Approved: ${c.toString()}`)), Object.keys(e).forEach((f) => {
    if (!f.includes(":") || r) return;
    const h = It$2(e[f].accounts);
    h.includes(f) || (r = ht$2("NON_CONFORMING_NAMESPACES", `${n} namespaces accounts don't satisfy namespace accounts for ${f}
        Required: ${f}
        Approved: ${h.toString()}`));
  }), s.forEach((f) => {
    r || (gt$2(o[f].methods, i[f].methods) ? gt$2(o[f].events, i[f].events) || (r = ht$2("NON_CONFORMING_NAMESPACES", `${n} namespaces events don't satisfy namespace events for ${f}`)) : r = ht$2("NON_CONFORMING_NAMESPACES", `${n} namespaces methods don't satisfy namespace methods for ${f}`));
  }), r;
}
function Aa(t) {
  const e = {};
  return Object.keys(t).forEach((n) => {
    var r;
    n.includes(":") ? e[n] = t[n] : (r = t[n].chains) == null || r.forEach((o) => {
      e[o] = { methods: t[n].methods, events: t[n].events };
    });
  }), e;
}
function Uo$1(t) {
  return [...new Set(t.map((e) => e.includes(":") ? e.split(":")[0] : e))];
}
function Ba(t) {
  const e = {};
  return Object.keys(t).forEach((n) => {
    if (n.includes(":")) e[n] = t[n];
    else {
      const r = It$2(t[n].accounts);
      r?.forEach((o) => {
        e[o] = { accounts: t[n].accounts.filter((i) => i.includes(`${o}:`)), methods: t[n].methods, events: t[n].events };
      });
    }
  }), e;
}
function Ia(t, e) {
  return Ae$1(t, false) && t <= e.max && t >= e.min;
}
function Na() {
  const t = xt$2();
  return new Promise((e) => {
    switch (t) {
      case Y$3.browser:
        e(To$1());
        break;
      case Y$3.reactNative:
        e(Ro$1());
        break;
      case Y$3.node:
        e(_o$1());
        break;
      default:
        e(true);
    }
  });
}
function To$1() {
  return Tt$2() && navigator?.onLine;
}
async function Ro$1() {
  if (pt$2() && typeof globalThis < "u" && globalThis != null && globalThis.NetInfo) {
    const t = await (globalThis == null ? void 0 : globalThis.NetInfo.fetch());
    return t?.isConnected;
  }
  return true;
}
function _o$1() {
  return true;
}
function Ua(t) {
  switch (xt$2()) {
    case Y$3.browser:
      $o$1(t);
      break;
    case Y$3.reactNative:
      Lo$1(t);
      break;
  }
}
function $o$1(t) {
  !pt$2() && Tt$2() && (window.addEventListener("online", () => t(true)), window.addEventListener("offline", () => t(false)));
}
function Lo$1(t) {
  pt$2() && typeof globalThis < "u" && globalThis != null && globalThis.NetInfo && globalThis?.NetInfo.addEventListener((e) => t(e?.isConnected));
}
function Ta() {
  var t;
  return Tt$2() && getDocument_1() ? ((t = getDocument_1()) == null ? void 0 : t.visibilityState) === "visible" : true;
}
const bn$1 = {};
class Ra {
  static get(e) {
    return bn$1[e];
  }
  static set(e, n) {
    bn$1[e] = n;
  }
  static delete(e) {
    delete bn$1[e];
  }
}

class IEvents {
}

let n$2 = class n extends IEvents{constructor(e){super();}};const s=cjs$3.FIVE_SECONDS,r$1={pulse:"heartbeat_pulse"};let i$2 = class i extends n$2{constructor(e){super(e),this.events=new eventsExports.EventEmitter,this.interval=s,this.interval=e?.interval||s;}static async init(e){const t=new i(e);return await t.init(),t}async init(){await this.initialize();}stop(){clearInterval(this.intervalRef);}on(e,t){this.events.on(e,t);}once(e,t){this.events.once(e,t);}off(e,t){this.events.off(e,t);}removeListener(e,t){this.events.removeListener(e,t);}async initialize(){this.intervalRef=setInterval(()=>this.pulse(),cjs$3.toMiliseconds(this.interval));}pulse(){this.events.emit(r$1.pulse);}};

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c) => c.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}
function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
  return normalizeKey(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}

function defineDriver(factory) {
  return factory;
}

const DRIVER_NAME = "memory";
const memory = defineDriver(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME,
    getInstance: () => data,
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return [...data.keys()];
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey(key);
          if (!maskedMounts.some((p) => fullKey.startsWith(p))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]?.();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    },
    // Aliases
    keys: (base, opts = {}) => storage.getKeys(base, opts),
    get: (key, opts = {}) => storage.getItem(key, opts),
    set: (key, value, opts = {}) => storage.setItem(key, value, opts),
    has: (key, opts = {}) => storage.hasItem(key, opts),
    del: (key, opts = {}) => storage.removeItem(key, opts),
    remove: (key, opts = {}) => storage.removeItem(key, opts)
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
        // @ts-ignore - file size hacks
        request.oncomplete = request.onsuccess = () => resolve(request.result);
        // @ts-ignore - file size hacks
        request.onabort = request.onerror = () => reject(request.error);
    });
}
function createStore(dbName, storeName) {
    let dbp;
    const getDB = () => {
        if (dbp)
            return dbp;
        const request = indexedDB.open(dbName);
        request.onupgradeneeded = () => request.result.createObjectStore(storeName);
        dbp = promisifyRequest(request);
        dbp.then((db) => {
            // It seems like Safari sometimes likes to just close the connection.
            // It's supposed to fire this event when that happens. Let's hope it does!
            db.onclose = () => (dbp = undefined);
        }, () => { });
        return dbp;
    };
    return (txMode, callback) => getDB().then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)));
}
let defaultGetStoreFunc;
function defaultGetStore() {
    if (!defaultGetStoreFunc) {
        defaultGetStoreFunc = createStore('keyval-store', 'keyval');
    }
    return defaultGetStoreFunc;
}
/**
 * Get a value by its key.
 *
 * @param key
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
function get(key, customStore = defaultGetStore()) {
    return customStore('readonly', (store) => promisifyRequest(store.get(key)));
}
/**
 * Set a value with a key.
 *
 * @param key
 * @param value
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
function set$1(key, value, customStore = defaultGetStore()) {
    return customStore('readwrite', (store) => {
        store.put(value, key);
        return promisifyRequest(store.transaction);
    });
}
/**
 * Delete a particular key from the store.
 *
 * @param key
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
function del(key, customStore = defaultGetStore()) {
    return customStore('readwrite', (store) => {
        store.delete(key);
        return promisifyRequest(store.transaction);
    });
}
/**
 * Clear all values in the store.
 *
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
function clear(customStore = defaultGetStore()) {
    return customStore('readwrite', (store) => {
        store.clear();
        return promisifyRequest(store.transaction);
    });
}
function eachCursor(store, callback) {
    store.openCursor().onsuccess = function () {
        if (!this.result)
            return;
        callback(this.result);
        this.result.continue();
    };
    return promisifyRequest(store.transaction);
}
/**
 * Get all keys in the store.
 *
 * @param customStore Method to get a custom store. Use with caution (see the docs).
 */
function keys(customStore = defaultGetStore()) {
    return customStore('readonly', (store) => {
        // Fast path for modern browsers
        if (store.getAllKeys) {
            return promisifyRequest(store.getAllKeys());
        }
        const items = [];
        return eachCursor(store, (cursor) => items.push(cursor.key)).then(() => items);
    });
}

const x$2 = "idb-keyval";
var z$3 = (i = {}) => {
  const t = i.base && i.base.length > 0 ? `${i.base}:` : "", e = (s) => t + s;
  let n;
  return i.dbName && i.storeName && (n = createStore(i.dbName, i.storeName)), { name: x$2, options: i, async hasItem(s) {
    return !(typeof await get(e(s), n) > "u");
  }, async getItem(s) {
    return await get(e(s), n) ?? null;
  }, setItem(s, a) {
    return set$1(e(s), a, n);
  }, removeItem(s) {
    return del(e(s), n);
  }, getKeys() {
    return keys(n);
  }, clear() {
    return clear(n);
  } };
};
const D$2 = "WALLET_CONNECT_V2_INDEXED_DB", E$6 = "keyvaluestorage";
let _$2 = class _ {
  constructor() {
    this.indexedDb = createStorage({ driver: z$3({ dbName: D$2, storeName: E$6 }) });
  }
  async getKeys() {
    return this.indexedDb.getKeys();
  }
  async getEntries() {
    return (await this.indexedDb.getItems(await this.indexedDb.getKeys())).map((t) => [t.key, t.value]);
  }
  async getItem(t) {
    const e = await this.indexedDb.getItem(t);
    if (e !== null) return e;
  }
  async setItem(t, e) {
    await this.indexedDb.setItem(t, safeJsonStringify(e));
  }
  async removeItem(t) {
    await this.indexedDb.removeItem(t);
  }
};
var l$3 = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : {}, c$4 = { exports: {} };
(function() {
  let i;
  function t() {
  }
  i = t, i.prototype.getItem = function(e) {
    return this.hasOwnProperty(e) ? String(this[e]) : null;
  }, i.prototype.setItem = function(e, n) {
    this[e] = String(n);
  }, i.prototype.removeItem = function(e) {
    delete this[e];
  }, i.prototype.clear = function() {
    const e = this;
    Object.keys(e).forEach(function(n) {
      e[n] = void 0, delete e[n];
    });
  }, i.prototype.key = function(e) {
    return e = e || 0, Object.keys(this)[e];
  }, i.prototype.__defineGetter__("length", function() {
    return Object.keys(this).length;
  }), typeof l$3 < "u" && l$3.localStorage ? c$4.exports = l$3.localStorage : typeof window < "u" && window.localStorage ? c$4.exports = window.localStorage : c$4.exports = new t();
})();
function k$5(i) {
  var t;
  return [i[0], safeJsonParse((t = i[1]) != null ? t : "")];
}
let K$2 = class K {
  constructor() {
    this.localStorage = c$4.exports;
  }
  async getKeys() {
    return Object.keys(this.localStorage);
  }
  async getEntries() {
    return Object.entries(this.localStorage).map(k$5);
  }
  async getItem(t) {
    const e = this.localStorage.getItem(t);
    if (e !== null) return safeJsonParse(e);
  }
  async setItem(t, e) {
    this.localStorage.setItem(t, safeJsonStringify(e));
  }
  async removeItem(t) {
    this.localStorage.removeItem(t);
  }
};
const N$2 = "wc_storage_version", y$4 = 1, O$5 = async (i, t, e) => {
  const n = N$2, s = await t.getItem(n);
  if (s && s >= y$4) {
    e(t);
    return;
  }
  const a = await i.getKeys();
  if (!a.length) {
    e(t);
    return;
  }
  const m = [];
  for (; a.length; ) {
    const r = a.shift();
    if (!r) continue;
    const o = r.toLowerCase();
    if (o.includes("wc@") || o.includes("walletconnect") || o.includes("wc_") || o.includes("wallet_connect")) {
      const f = await i.getItem(r);
      await t.setItem(r, f), m.push(r);
    }
  }
  await t.setItem(n, y$4), e(t), j$2(i, m);
}, j$2 = async (i, t) => {
  t.length && t.forEach(async (e) => {
    await i.removeItem(e);
  });
};
let h$3 = class h {
  constructor() {
    this.initialized = false, this.setInitialized = (e) => {
      this.storage = e, this.initialized = true;
    };
    const t = new K$2();
    this.storage = t;
    try {
      const e = new _$2();
      O$5(t, e, this.setInitialized);
    } catch {
      this.initialized = true;
    }
  }
  async getKeys() {
    return await this.initialize(), this.storage.getKeys();
  }
  async getEntries() {
    return await this.initialize(), this.storage.getEntries();
  }
  async getItem(t) {
    return await this.initialize(), this.storage.getItem(t);
  }
  async setItem(t, e) {
    return await this.initialize(), this.storage.setItem(t, e);
  }
  async removeItem(t) {
    return await this.initialize(), this.storage.removeItem(t);
  }
  async initialize() {
    this.initialized || await new Promise((t) => {
      const e = setInterval(() => {
        this.initialized && (clearInterval(e), t());
      }, 20);
    });
  }
};

function tryStringify (o) {
  try { return JSON.stringify(o) } catch(e) { return '"[Circular]"' }
}

var quickFormatUnescaped = format$1;

function format$1(f, args, opts) {
  var ss = (opts && opts.stringify) || tryStringify;
  var offset = 1;
  if (typeof f === 'object' && f !== null) {
    var len = args.length + offset;
    if (len === 1) return f
    var objects = new Array(len);
    objects[0] = ss(f);
    for (var index = 1; index < len; index++) {
      objects[index] = ss(args[index]);
    }
    return objects.join(' ')
  }
  if (typeof f !== 'string') {
    return f
  }
  var argLen = args.length;
  if (argLen === 0) return f
  var str = '';
  var a = 1 - offset;
  var lastPos = -1;
  var flen = (f && f.length) || 0;
  for (var i = 0; i < flen;) {
    if (f.charCodeAt(i) === 37 && i + 1 < flen) {
      lastPos = lastPos > -1 ? lastPos : 0;
      switch (f.charCodeAt(i + 1)) {
        case 100: // 'd'
        case 102: // 'f'
          if (a >= argLen)
            break
          if (args[a] == null)  break
          if (lastPos < i)
            str += f.slice(lastPos, i);
          str += Number(args[a]);
          lastPos = i + 2;
          i++;
          break
        case 105: // 'i'
          if (a >= argLen)
            break
          if (args[a] == null)  break
          if (lastPos < i)
            str += f.slice(lastPos, i);
          str += Math.floor(Number(args[a]));
          lastPos = i + 2;
          i++;
          break
        case 79: // 'O'
        case 111: // 'o'
        case 106: // 'j'
          if (a >= argLen)
            break
          if (args[a] === undefined) break
          if (lastPos < i)
            str += f.slice(lastPos, i);
          var type = typeof args[a];
          if (type === 'string') {
            str += '\'' + args[a] + '\'';
            lastPos = i + 2;
            i++;
            break
          }
          if (type === 'function') {
            str += args[a].name || '<anonymous>';
            lastPos = i + 2;
            i++;
            break
          }
          str += ss(args[a]);
          lastPos = i + 2;
          i++;
          break
        case 115: // 's'
          if (a >= argLen)
            break
          if (lastPos < i)
            str += f.slice(lastPos, i);
          str += String(args[a]);
          lastPos = i + 2;
          i++;
          break
        case 37: // '%'
          if (lastPos < i)
            str += f.slice(lastPos, i);
          str += '%';
          lastPos = i + 2;
          i++;
          a--;
          break
      }
      ++a;
    }
    ++i;
  }
  if (lastPos === -1)
    return f
  else if (lastPos < flen) {
    str += f.slice(lastPos);
  }

  return str
}

const format = quickFormatUnescaped;
var browser$1 = pino;
const _console = pfGlobalThisOrFallback().console || {};
const stdSerializers = {
  mapHttpRequest: mock,
  mapHttpResponse: mock,
  wrapRequestSerializer: passthrough,
  wrapResponseSerializer: passthrough,
  wrapErrorSerializer: passthrough,
  req: mock,
  res: mock,
  err: asErrValue
};
function shouldSerialize(serialize, serializers) {
  if (Array.isArray(serialize)) {
    const hasToFilter = serialize.filter(function(k) {
      return k !== "!stdSerializers.err";
    });
    return hasToFilter;
  } else if (serialize === true) {
    return Object.keys(serializers);
  }
  return false;
}
function pino(opts) {
  opts = opts || {};
  opts.browser = opts.browser || {};
  const transmit2 = opts.browser.transmit;
  if (transmit2 && typeof transmit2.send !== "function") {
    throw Error("pino: transmit option must have a send function");
  }
  const proto = opts.browser.write || _console;
  if (opts.browser.write) opts.browser.asObject = true;
  const serializers = opts.serializers || {};
  const serialize = shouldSerialize(opts.browser.serialize, serializers);
  let stdErrSerialize = opts.browser.serialize;
  if (Array.isArray(opts.browser.serialize) && opts.browser.serialize.indexOf("!stdSerializers.err") > -1) stdErrSerialize = false;
  const levels = ["error", "fatal", "warn", "info", "debug", "trace"];
  if (typeof proto === "function") {
    proto.error = proto.fatal = proto.warn = proto.info = proto.debug = proto.trace = proto;
  }
  if (opts.enabled === false) opts.level = "silent";
  const level = opts.level || "info";
  const logger = Object.create(proto);
  if (!logger.log) logger.log = noop;
  Object.defineProperty(logger, "levelVal", {
    get: getLevelVal
  });
  Object.defineProperty(logger, "level", {
    get: getLevel,
    set: setLevel
  });
  const setOpts = {
    transmit: transmit2,
    serialize,
    asObject: opts.browser.asObject,
    levels,
    timestamp: getTimeFunction(opts)
  };
  logger.levels = pino.levels;
  logger.level = level;
  logger.setMaxListeners = logger.getMaxListeners = logger.emit = logger.addListener = logger.on = logger.prependListener = logger.once = logger.prependOnceListener = logger.removeListener = logger.removeAllListeners = logger.listeners = logger.listenerCount = logger.eventNames = logger.write = logger.flush = noop;
  logger.serializers = serializers;
  logger._serialize = serialize;
  logger._stdErrSerialize = stdErrSerialize;
  logger.child = child;
  if (transmit2) logger._logEvent = createLogEventShape();
  function getLevelVal() {
    return this.level === "silent" ? Infinity : this.levels.values[this.level];
  }
  function getLevel() {
    return this._level;
  }
  function setLevel(level2) {
    if (level2 !== "silent" && !this.levels.values[level2]) {
      throw Error("unknown level " + level2);
    }
    this._level = level2;
    set(setOpts, logger, "error", "log");
    set(setOpts, logger, "fatal", "error");
    set(setOpts, logger, "warn", "error");
    set(setOpts, logger, "info", "log");
    set(setOpts, logger, "debug", "log");
    set(setOpts, logger, "trace", "log");
  }
  function child(bindings, childOptions) {
    if (!bindings) {
      throw new Error("missing bindings for child Pino");
    }
    childOptions = childOptions || {};
    if (serialize && bindings.serializers) {
      childOptions.serializers = bindings.serializers;
    }
    const childOptionsSerializers = childOptions.serializers;
    if (serialize && childOptionsSerializers) {
      var childSerializers = Object.assign({}, serializers, childOptionsSerializers);
      var childSerialize = opts.browser.serialize === true ? Object.keys(childSerializers) : serialize;
      delete bindings.serializers;
      applySerializers([bindings], childSerialize, childSerializers, this._stdErrSerialize);
    }
    function Child(parent) {
      this._childLevel = (parent._childLevel | 0) + 1;
      this.error = bind(parent, bindings, "error");
      this.fatal = bind(parent, bindings, "fatal");
      this.warn = bind(parent, bindings, "warn");
      this.info = bind(parent, bindings, "info");
      this.debug = bind(parent, bindings, "debug");
      this.trace = bind(parent, bindings, "trace");
      if (childSerializers) {
        this.serializers = childSerializers;
        this._serialize = childSerialize;
      }
      if (transmit2) {
        this._logEvent = createLogEventShape(
          [].concat(parent._logEvent.bindings, bindings)
        );
      }
    }
    Child.prototype = this;
    return new Child(this);
  }
  return logger;
}
pino.levels = {
  values: {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10
  },
  labels: {
    10: "trace",
    20: "debug",
    30: "info",
    40: "warn",
    50: "error",
    60: "fatal"
  }
};
pino.stdSerializers = stdSerializers;
pino.stdTimeFunctions = Object.assign({}, { nullTime, epochTime, unixTime, isoTime });
function set(opts, logger, level, fallback) {
  const proto = Object.getPrototypeOf(logger);
  logger[level] = logger.levelVal > logger.levels.values[level] ? noop : proto[level] ? proto[level] : _console[level] || _console[fallback] || noop;
  wrap(opts, logger, level);
}
function wrap(opts, logger, level) {
  if (!opts.transmit && logger[level] === noop) return;
  logger[level] = /* @__PURE__ */ function(write) {
    return function LOG() {
      const ts = opts.timestamp();
      const args = new Array(arguments.length);
      const proto = Object.getPrototypeOf && Object.getPrototypeOf(this) === _console ? _console : this;
      for (var i = 0; i < args.length; i++) args[i] = arguments[i];
      if (opts.serialize && !opts.asObject) {
        applySerializers(args, this._serialize, this.serializers, this._stdErrSerialize);
      }
      if (opts.asObject) write.call(proto, asObject(this, level, args, ts));
      else write.apply(proto, args);
      if (opts.transmit) {
        const transmitLevel = opts.transmit.level || logger.level;
        const transmitValue = pino.levels.values[transmitLevel];
        const methodValue = pino.levels.values[level];
        if (methodValue < transmitValue) return;
        transmit(this, {
          ts,
          methodLevel: level,
          methodValue,
          transmitValue: pino.levels.values[opts.transmit.level || logger.level],
          send: opts.transmit.send,
          val: logger.levelVal
        }, args);
      }
    };
  }(logger[level]);
}
function asObject(logger, level, args, ts) {
  if (logger._serialize) applySerializers(args, logger._serialize, logger.serializers, logger._stdErrSerialize);
  const argsCloned = args.slice();
  let msg = argsCloned[0];
  const o = {};
  if (ts) {
    o.time = ts;
  }
  o.level = pino.levels.values[level];
  let lvl = (logger._childLevel | 0) + 1;
  if (lvl < 1) lvl = 1;
  if (msg !== null && typeof msg === "object") {
    while (lvl-- && typeof argsCloned[0] === "object") {
      Object.assign(o, argsCloned.shift());
    }
    msg = argsCloned.length ? format(argsCloned.shift(), argsCloned) : void 0;
  } else if (typeof msg === "string") msg = format(argsCloned.shift(), argsCloned);
  if (msg !== void 0) o.msg = msg;
  return o;
}
function applySerializers(args, serialize, serializers, stdErrSerialize) {
  for (const i in args) {
    if (stdErrSerialize && args[i] instanceof Error) {
      args[i] = pino.stdSerializers.err(args[i]);
    } else if (typeof args[i] === "object" && !Array.isArray(args[i])) {
      for (const k in args[i]) {
        if (serialize && serialize.indexOf(k) > -1 && k in serializers) {
          args[i][k] = serializers[k](args[i][k]);
        }
      }
    }
  }
}
function bind(parent, bindings, level) {
  return function() {
    const args = new Array(1 + arguments.length);
    args[0] = bindings;
    for (var i = 1; i < args.length; i++) {
      args[i] = arguments[i - 1];
    }
    return parent[level].apply(this, args);
  };
}
function transmit(logger, opts, args) {
  const send = opts.send;
  const ts = opts.ts;
  const methodLevel = opts.methodLevel;
  const methodValue = opts.methodValue;
  const val = opts.val;
  const bindings = logger._logEvent.bindings;
  applySerializers(
    args,
    logger._serialize || Object.keys(logger.serializers),
    logger.serializers,
    logger._stdErrSerialize === void 0 ? true : logger._stdErrSerialize
  );
  logger._logEvent.ts = ts;
  logger._logEvent.messages = args.filter(function(arg) {
    return bindings.indexOf(arg) === -1;
  });
  logger._logEvent.level.label = methodLevel;
  logger._logEvent.level.value = methodValue;
  send(methodLevel, logger._logEvent, val);
  logger._logEvent = createLogEventShape(bindings);
}
function createLogEventShape(bindings) {
  return {
    ts: 0,
    messages: [],
    bindings: bindings || [],
    level: { label: "", value: 0 }
  };
}
function asErrValue(err) {
  const obj = {
    type: err.constructor.name,
    msg: err.message,
    stack: err.stack
  };
  for (const key in err) {
    if (obj[key] === void 0) {
      obj[key] = err[key];
    }
  }
  return obj;
}
function getTimeFunction(opts) {
  if (typeof opts.timestamp === "function") {
    return opts.timestamp;
  }
  if (opts.timestamp === false) {
    return nullTime;
  }
  return epochTime;
}
function mock() {
  return {};
}
function passthrough(a) {
  return a;
}
function noop() {
}
function nullTime() {
  return false;
}
function epochTime() {
  return Date.now();
}
function unixTime() {
  return Math.round(Date.now() / 1e3);
}
function isoTime() {
  return new Date(Date.now()).toISOString();
}
function pfGlobalThisOrFallback() {
  function defd(o) {
    return typeof o !== "undefined" && o;
  }
  try {
    if (typeof globalThis !== "undefined") return globalThis;
    Object.defineProperty(Object.prototype, "globalThis", {
      get: function() {
        delete Object.prototype.globalThis;
        return this.globalThis = this;
      },
      configurable: true
    });
    return globalThis;
  } catch (e) {
    return defd(self) || defd(window) || defd(this) || {};
  }
}

const Ot$1 = /*@__PURE__*/getDefaultExportFromCjs(browser$1);

const c$3={level:"info"},n$1="custom_context",l$2=1e3*1024;let O$4 = class O{constructor(e){this.nodeValue=e,this.sizeInBytes=new TextEncoder().encode(this.nodeValue).length,this.next=null;}get value(){return this.nodeValue}get size(){return this.sizeInBytes}};let d$4 = class d{constructor(e){this.head=null,this.tail=null,this.lengthInNodes=0,this.maxSizeInBytes=e,this.sizeInBytes=0;}append(e){const t=new O$4(e);if(t.size>this.maxSizeInBytes)throw new Error(`[LinkedList] Value too big to insert into list: ${e} with size ${t.size}`);for(;this.size+t.size>this.maxSizeInBytes;)this.shift();this.head?(this.tail&&(this.tail.next=t),this.tail=t):(this.head=t,this.tail=t),this.lengthInNodes++,this.sizeInBytes+=t.size;}shift(){if(!this.head)return;const e=this.head;this.head=this.head.next,this.head||(this.tail=null),this.lengthInNodes--,this.sizeInBytes-=e.size;}toArray(){const e=[];let t=this.head;for(;t!==null;)e.push(t.value),t=t.next;return e}get length(){return this.lengthInNodes}get size(){return this.sizeInBytes}toOrderedArray(){return Array.from(this)}[Symbol.iterator](){let e=this.head;return {next:()=>{if(!e)return {done:true,value:null};const t=e.value;return e=e.next,{done:false,value:t}}}}};let L$4 = class L{constructor(e,t=l$2){this.level=e??"error",this.levelValue=browser$1.levels.values[this.level],this.MAX_LOG_SIZE_IN_BYTES=t,this.logs=new d$4(this.MAX_LOG_SIZE_IN_BYTES);}forwardToConsole(e,t){t===browser$1.levels.values.error?console.error(e):t===browser$1.levels.values.warn?console.warn(e):t===browser$1.levels.values.debug?console.debug(e):t===browser$1.levels.values.trace?console.trace(e):console.log(e);}appendToLogs(e){this.logs.append(safeJsonStringify({timestamp:new Date().toISOString(),log:e}));const t=typeof e=="string"?JSON.parse(e).level:e.level;t>=this.levelValue&&this.forwardToConsole(e,t);}getLogs(){return this.logs}clearLogs(){this.logs=new d$4(this.MAX_LOG_SIZE_IN_BYTES);}getLogArray(){return Array.from(this.logs)}logsToBlob(e){const t=this.getLogArray();return t.push(safeJsonStringify({extraMetadata:e})),new Blob(t,{type:"application/json"})}};let m$1 = class m{constructor(e,t=l$2){this.baseChunkLogger=new L$4(e,t);}write(e){this.baseChunkLogger.appendToLogs(e);}getLogs(){return this.baseChunkLogger.getLogs()}clearLogs(){this.baseChunkLogger.clearLogs();}getLogArray(){return this.baseChunkLogger.getLogArray()}logsToBlob(e){return this.baseChunkLogger.logsToBlob(e)}downloadLogsBlobInBrowser(e){const t=URL.createObjectURL(this.logsToBlob(e)),o=document.createElement("a");o.href=t,o.download=`walletconnect-logs-${new Date().toISOString()}.txt`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(t);}};let B$3 = class B{constructor(e,t=l$2){this.baseChunkLogger=new L$4(e,t);}write(e){this.baseChunkLogger.appendToLogs(e);}getLogs(){return this.baseChunkLogger.getLogs()}clearLogs(){this.baseChunkLogger.clearLogs();}getLogArray(){return this.baseChunkLogger.getLogArray()}logsToBlob(e){return this.baseChunkLogger.logsToBlob(e)}};var x$1=Object.defineProperty,S$4=Object.defineProperties,_$1=Object.getOwnPropertyDescriptors,p$4=Object.getOwnPropertySymbols,T$3=Object.prototype.hasOwnProperty,z$2=Object.prototype.propertyIsEnumerable,f$5=(r,e,t)=>e in r?x$1(r,e,{enumerable:true,configurable:true,writable:true,value:t}):r[e]=t,i$1=(r,e)=>{for(var t in e||(e={}))T$3.call(e,t)&&f$5(r,t,e[t]);if(p$4)for(var t of p$4(e))z$2.call(e,t)&&f$5(r,t,e[t]);return r},g$1=(r,e)=>S$4(r,_$1(e));function k$4(r){return g$1(i$1({},r),{level:r?.level||c$3.level})}function v$6(r,e=n$1){return r[e]||""}function b$5(r,e,t=n$1){return r[t]=e,r}function y$3(r,e=n$1){let t="";return typeof r.bindings>"u"?t=v$6(r,e):t=r.bindings().context||"",t}function w$4(r,e,t=n$1){const o=y$3(r,t);return o.trim()?`${o}/${e}`:e}function E$5(r,e,t=n$1){const o=w$4(r,e,t),a=r.child({context:o});return b$5(a,o,t)}function C$3(r){var e,t;const o=new m$1((e=r.opts)==null?void 0:e.level,r.maxSizeInBytes);return {logger:Ot$1(g$1(i$1({},r.opts),{level:"trace",browser:g$1(i$1({},(t=r.opts)==null?void 0:t.browser),{write:a=>o.write(a)})})),chunkLoggerController:o}}function I$3(r){var e;const t=new B$3((e=r.opts)==null?void 0:e.level,r.maxSizeInBytes);return {logger:Ot$1(g$1(i$1({},r.opts),{level:"trace"}),t),chunkLoggerController:t}}function A$3(r){return typeof r.loggerOverride<"u"&&typeof r.loggerOverride!="string"?{logger:r.loggerOverride,chunkLoggerController:null}:typeof window<"u"?C$3(r):I$3(r)}

var a=Object.defineProperty,u$1=(e,s,r)=>s in e?a(e,s,{enumerable:true,configurable:true,writable:true,value:r}):e[s]=r,c$2=(e,s,r)=>u$1(e,typeof s!="symbol"?s+"":s,r);let h$2 = class h extends IEvents{constructor(s){super(),this.opts=s,c$2(this,"protocol","wc"),c$2(this,"version",2);}};var p$3=Object.defineProperty,b$4=(e,s,r)=>s in e?p$3(e,s,{enumerable:true,configurable:true,writable:true,value:r}):e[s]=r,v$5=(e,s,r)=>b$4(e,s+"",r);let I$2 = class I extends IEvents{constructor(s,r){super(),this.core=s,this.logger=r,v$5(this,"records",new Map);}};let y$2 = class y{constructor(s,r){this.logger=s,this.core=r;}};class m extends IEvents{constructor(s,r){super(),this.relayer=s,this.logger=r;}}let d$3 = class d extends IEvents{constructor(s){super();}};let f$4 = class f{constructor(s,r,t,q){this.core=s,this.logger=r,this.name=t;}};let P$3 = class P extends IEvents{constructor(s,r){super(),this.relayer=s,this.logger=r;}};let S$3 = class S extends IEvents{constructor(s,r){super(),this.core=s,this.logger=r;}};let M$3 = class M{constructor(s,r,t){this.core=s,this.logger=r,this.store=t;}};let O$3 = class O{constructor(s,r){this.projectId=s,this.logger=r;}};let R$2 = class R{constructor(s,r,t){this.core=s,this.logger=r,this.telemetryEnabled=t;}};var T$2=Object.defineProperty,k$3=(e,s,r)=>s in e?T$2(e,s,{enumerable:true,configurable:true,writable:true,value:r}):e[s]=r,i=(e,s,r)=>k$3(e,typeof s!="symbol"?s+"":s,r);let J$2 = class J{constructor(s){this.opts=s,i(this,"protocol","wc"),i(this,"version",2);}};let V$3 = class V{constructor(s){this.client=s;}};

const PARSE_ERROR = "PARSE_ERROR";
const INVALID_REQUEST = "INVALID_REQUEST";
const METHOD_NOT_FOUND = "METHOD_NOT_FOUND";
const INVALID_PARAMS = "INVALID_PARAMS";
const INTERNAL_ERROR = "INTERNAL_ERROR";
const SERVER_ERROR = "SERVER_ERROR";
const RESERVED_ERROR_CODES = [-32700, -32600, -32601, -32602, -32603];
const STANDARD_ERROR_MAP = {
    [PARSE_ERROR]: { code: -32700, message: "Parse error" },
    [INVALID_REQUEST]: { code: -32600, message: "Invalid Request" },
    [METHOD_NOT_FOUND]: { code: -32601, message: "Method not found" },
    [INVALID_PARAMS]: { code: -32602, message: "Invalid params" },
    [INTERNAL_ERROR]: { code: -32603, message: "Internal error" },
    [SERVER_ERROR]: { code: -32e3, message: "Server error" },
};
const DEFAULT_ERROR = SERVER_ERROR;

function isReservedErrorCode(code) {
    return RESERVED_ERROR_CODES.includes(code);
}
function getError(type) {
    if (!Object.keys(STANDARD_ERROR_MAP).includes(type)) {
        return STANDARD_ERROR_MAP[DEFAULT_ERROR];
    }
    return STANDARD_ERROR_MAP[type];
}
function getErrorByCode(code) {
    const match = Object.values(STANDARD_ERROR_MAP).find(e => e.code === code);
    if (!match) {
        return STANDARD_ERROR_MAP[DEFAULT_ERROR];
    }
    return match;
}
function parseConnectionError(e, url, type) {
    return e.message.includes("getaddrinfo ENOTFOUND") || e.message.includes("connect ECONNREFUSED")
        ? new Error(`Unavailable ${type} RPC url at ${url}`)
        : e;
}

var cjs = {};

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
  };
  return extendStatics(d, b);
};
function __extends(d, b) {
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign = function() {
  __assign = Object.assign || function __assign2(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
function __rest(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
    t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
}
function __decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function __param(paramIndex, decorator) {
  return function(target, key) {
    decorator(target, key, paramIndex);
  };
}
function __metadata(metadataKey, metadataValue) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1) throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return { value: op[1], done: false };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
}
function __createBinding(o, m, k, k2) {
  if (k2 === void 0) k2 = k;
  o[k2] = m[k];
}
function __exportStar(m, exports) {
  for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) exports[p] = m[p];
}
function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function() {
      if (o && i >= o.length) o = void 0;
      return { value: o && o[i++], done: !o };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
}
function __spread() {
  for (var ar = [], i = 0; i < arguments.length; i++)
    ar = ar.concat(__read(arguments[i]));
  return ar;
}
function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
    for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
      r[k] = a[j];
  return r;
}
function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
    return this;
  }, i;
  function verb(n) {
    if (g[n]) i[n] = function(v) {
      return new Promise(function(a, b) {
        q.push([n, v, a, b]) > 1 || resume(n, v);
      });
    };
  }
  function resume(n, v) {
    try {
      step(g[n](v));
    } catch (e) {
      settle(q[0][3], e);
    }
  }
  function step(r) {
    r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
  }
  function fulfill(value) {
    resume("next", value);
  }
  function reject(value) {
    resume("throw", value);
  }
  function settle(f, v) {
    if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
  }
}
function __asyncDelegator(o) {
  var i, p;
  return i = {}, verb("next"), verb("throw", function(e) {
    throw e;
  }), verb("return"), i[Symbol.iterator] = function() {
    return this;
  }, i;
  function verb(n, f) {
    i[n] = o[n] ? function(v) {
      return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v;
    } : f;
  }
}
function __asyncValues(o) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator], i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
    return this;
  }, i);
  function verb(n) {
    i[n] = o[n] && function(v) {
      return new Promise(function(resolve, reject) {
        v = o[n](v), settle(resolve, reject, v.done, v.value);
      });
    };
  }
  function settle(resolve, reject, d, v) {
    Promise.resolve(v).then(function(v2) {
      resolve({ value: v2, done: d });
    }, reject);
  }
}
function __makeTemplateObject(cooked, raw) {
  if (Object.defineProperty) {
    Object.defineProperty(cooked, "raw", { value: raw });
  } else {
    cooked.raw = raw;
  }
  return cooked;
}
function __importStar(mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) {
    for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
  }
  result.default = mod;
  return result;
}
function __importDefault(mod) {
  return mod && mod.__esModule ? mod : { default: mod };
}
function __classPrivateFieldGet(receiver, privateMap) {
  if (!privateMap.has(receiver)) {
    throw new TypeError("attempted to get private field on non-instance");
  }
  return privateMap.get(receiver);
}
function __classPrivateFieldSet(receiver, privateMap, value) {
  if (!privateMap.has(receiver)) {
    throw new TypeError("attempted to set private field on non-instance");
  }
  privateMap.set(receiver, value);
  return value;
}

const tslib_es6 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    get __assign () { return __assign; },
    __asyncDelegator,
    __asyncGenerator,
    __asyncValues,
    __await,
    __awaiter,
    __classPrivateFieldGet,
    __classPrivateFieldSet,
    __createBinding,
    __decorate,
    __exportStar,
    __extends,
    __generator,
    __importDefault,
    __importStar,
    __makeTemplateObject,
    __metadata,
    __param,
    __read,
    __rest,
    __spread,
    __spreadArrays,
    __values
}, Symbol.toStringTag, { value: 'Module' }));

var crypto$1 = {};

var hasRequiredCrypto;

function requireCrypto () {
	if (hasRequiredCrypto) return crypto$1;
	hasRequiredCrypto = 1;
	Object.defineProperty(crypto$1, "__esModule", { value: true });
	crypto$1.isBrowserCryptoAvailable = crypto$1.getSubtleCrypto = crypto$1.getBrowerCrypto = void 0;
	function getBrowerCrypto() {
	  return (globalThis === null || globalThis === void 0 ? void 0 : globalThis.crypto) || (globalThis === null || globalThis === void 0 ? void 0 : globalThis.msCrypto) || {};
	}
	crypto$1.getBrowerCrypto = getBrowerCrypto;
	function getSubtleCrypto() {
	  const browserCrypto = getBrowerCrypto();
	  return browserCrypto.subtle || browserCrypto.webkitSubtle;
	}
	crypto$1.getSubtleCrypto = getSubtleCrypto;
	function isBrowserCryptoAvailable() {
	  return !!getBrowerCrypto() && !!getSubtleCrypto();
	}
	crypto$1.isBrowserCryptoAvailable = isBrowserCryptoAvailable;
	return crypto$1;
}

var env = {};

var hasRequiredEnv;

function requireEnv () {
	if (hasRequiredEnv) return env;
	hasRequiredEnv = 1;
	Object.defineProperty(env, "__esModule", { value: true });
	env.isBrowser = env.isNode = env.isReactNative = void 0;
	function isReactNative() {
	    return (typeof document === "undefined" &&
	        typeof navigator !== "undefined" &&
	        navigator.product === "ReactNative");
	}
	env.isReactNative = isReactNative;
	function isNode() {
	    return (typeof process !== "undefined" &&
	        typeof process.versions !== "undefined" &&
	        typeof process.versions.node !== "undefined");
	}
	env.isNode = isNode;
	function isBrowser() {
	    return !isReactNative() && !isNode();
	}
	env.isBrowser = isBrowser;
	
	return env;
}

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	const tslib_1 = tslib_es6;
	tslib_1.__exportStar(requireCrypto(), exports);
	tslib_1.__exportStar(requireEnv(), exports);
	
} (cjs));

function payloadId(entropy = 3) {
    const date = Date.now() * Math.pow(10, entropy);
    const extra = Math.floor(Math.random() * Math.pow(10, entropy));
    return date + extra;
}
function getBigIntRpcId(entropy = 6) {
    return BigInt(payloadId(entropy));
}
function formatJsonRpcRequest(method, params, id) {
    return {
        id: id || payloadId(),
        jsonrpc: "2.0",
        method,
        params,
    };
}
function formatJsonRpcResult(id, result) {
    return {
        id,
        jsonrpc: "2.0",
        result,
    };
}
function formatJsonRpcError(id, error, data) {
    return {
        id,
        jsonrpc: "2.0",
        error: formatErrorMessage(error),
    };
}
function formatErrorMessage(error, data) {
    if (typeof error === "undefined") {
        return getError(INTERNAL_ERROR);
    }
    if (typeof error === "string") {
        error = Object.assign(Object.assign({}, getError(SERVER_ERROR)), { message: error });
    }
    if (isReservedErrorCode(error.code)) {
        error = getErrorByCode(error.code);
    }
    return error;
}

class e{}class n extends e{constructor(){super();}}class r extends n{constructor(c){super();}}

const HTTP_REGEX = "^https?:";
const WS_REGEX = "^wss?:";
function getUrlProtocol(url) {
    const matches = url.match(new RegExp(/^\w+:/, "gi"));
    if (!matches || !matches.length)
        return;
    return matches[0];
}
function matchRegexProtocol(url, regex) {
    const protocol = getUrlProtocol(url);
    if (typeof protocol === "undefined")
        return false;
    return new RegExp(regex).test(protocol);
}
function isHttpUrl(url) {
    return matchRegexProtocol(url, HTTP_REGEX);
}
function isWsUrl(url) {
    return matchRegexProtocol(url, WS_REGEX);
}
function isLocalhostUrl(url) {
    return new RegExp("wss?://localhost(:d{2,5})?").test(url);
}

function isJsonRpcPayload(payload) {
    return (typeof payload === "object" &&
        "id" in payload &&
        "jsonrpc" in payload &&
        payload.jsonrpc === "2.0");
}
function isJsonRpcRequest(payload) {
    return isJsonRpcPayload(payload) && "method" in payload;
}
function isJsonRpcResponse(payload) {
    return isJsonRpcPayload(payload) && (isJsonRpcResult(payload) || isJsonRpcError(payload));
}
function isJsonRpcResult(payload) {
    return "result" in payload;
}
function isJsonRpcError(payload) {
    return "error" in payload;
}

let o$1 = class o extends r{constructor(t){super(t),this.events=new eventsExports.EventEmitter,this.hasRegisteredEventListeners=false,this.connection=this.setConnection(t),this.connection.connected&&this.registerEventListeners();}async connect(t=this.connection){await this.open(t);}async disconnect(){await this.close();}on(t,e){this.events.on(t,e);}once(t,e){this.events.once(t,e);}off(t,e){this.events.off(t,e);}removeListener(t,e){this.events.removeListener(t,e);}async request(t,e){return this.requestStrict(formatJsonRpcRequest(t.method,t.params||[],t.id||getBigIntRpcId().toString()),e)}async requestStrict(t,e){return new Promise(async(i,s)=>{if(!this.connection.connected)try{await this.open();}catch(n){s(n);}this.events.on(`${t.id}`,n=>{isJsonRpcError(n)?s(n.error):i(n.result);});try{await this.connection.send(t,e);}catch(n){s(n);}})}setConnection(t=this.connection){return t}onPayload(t){this.events.emit("payload",t),isJsonRpcResponse(t)?this.events.emit(`${t.id}`,t):this.events.emit("message",{type:t.method,data:t.params});}onClose(t){t&&t.code===3e3&&this.events.emit("error",new Error(`WebSocket connection closed abnormally with code: ${t.code} ${t.reason?`(${t.reason})`:""}`)),this.events.emit("disconnect");}async open(t=this.connection){this.connection===t&&this.connection.connected||(this.connection.connected&&this.close(),typeof t=="string"&&(await this.connection.open(t),t=this.connection),this.connection=this.setConnection(t),await this.connection.open(),this.registerEventListeners(),this.events.emit("connect"));}async close(){await this.connection.close();}registerEventListeners(){this.hasRegisteredEventListeners||(this.connection.on("payload",t=>this.onPayload(t)),this.connection.on("close",t=>this.onClose(t)),this.connection.on("error",t=>this.events.emit("error",t)),this.connection.on("register_error",t=>this.onClose()),this.hasRegisteredEventListeners=true);}};

var browser;
var hasRequiredBrowser;

function requireBrowser () {
	if (hasRequiredBrowser) return browser;
	hasRequiredBrowser = 1;

	browser = function () {
	  throw new Error(
	    'ws does not work in the browser. Browser clients must use the native ' +
	      'WebSocket object'
	  );
	};
	return browser;
}

const v$4 = () => typeof WebSocket < "u" ? WebSocket : typeof globalThis < "u" && typeof globalThis.WebSocket < "u" ? globalThis.WebSocket : typeof window < "u" && typeof window.WebSocket < "u" ? window.WebSocket : typeof self < "u" && typeof self.WebSocket < "u" ? self.WebSocket : requireBrowser(), w$3 = () => typeof WebSocket < "u" || typeof globalThis < "u" && typeof globalThis.WebSocket < "u" || typeof window < "u" && typeof window.WebSocket < "u" || typeof self < "u" && typeof self.WebSocket < "u", d$2 = (r) => r.split("?")[0], h$1 = 10, b$3 = v$4();
let f$3 = class f {
  constructor(e) {
    if (this.url = e, this.events = new eventsExports.EventEmitter(), this.registering = false, !isWsUrl(e)) throw new Error(`Provided URL is not compatible with WebSocket connection: ${e}`);
    this.url = e;
  }
  get connected() {
    return typeof this.socket < "u";
  }
  get connecting() {
    return this.registering;
  }
  on(e, t) {
    this.events.on(e, t);
  }
  once(e, t) {
    this.events.once(e, t);
  }
  off(e, t) {
    this.events.off(e, t);
  }
  removeListener(e, t) {
    this.events.removeListener(e, t);
  }
  async open(e = this.url) {
    await this.register(e);
  }
  async close() {
    return new Promise((e, t) => {
      if (typeof this.socket > "u") {
        t(new Error("Connection already closed"));
        return;
      }
      this.socket.onclose = (n) => {
        this.onClose(n), e();
      }, this.socket.close();
    });
  }
  async send(e) {
    typeof this.socket > "u" && (this.socket = await this.register());
    try {
      this.socket.send(safeJsonStringify(e));
    } catch (t) {
      this.onError(e.id, t);
    }
  }
  register(e = this.url) {
    if (!isWsUrl(e)) throw new Error(`Provided URL is not compatible with WebSocket connection: ${e}`);
    if (this.registering) {
      const t = this.events.getMaxListeners();
      return (this.events.listenerCount("register_error") >= t || this.events.listenerCount("open") >= t) && this.events.setMaxListeners(t + 1), new Promise((n, s) => {
        this.events.once("register_error", (o) => {
          this.resetMaxListeners(), s(o);
        }), this.events.once("open", () => {
          if (this.resetMaxListeners(), typeof this.socket > "u") return s(new Error("WebSocket connection is missing or invalid"));
          n(this.socket);
        });
      });
    }
    return this.url = e, this.registering = true, new Promise((t, n) => {
      const s = cjs.isReactNative() ? void 0 : { rejectUnauthorized: !isLocalhostUrl(e) }, o = new b$3(e, [], s);
      w$3() ? o.onerror = (i) => {
        const a = i;
        n(this.emitError(a.error));
      } : o.on("error", (i) => {
        n(this.emitError(i));
      }), o.onopen = () => {
        this.onOpen(o), t(o);
      };
    });
  }
  onOpen(e) {
    e.onmessage = (t) => this.onPayload(t), e.onclose = (t) => this.onClose(t), this.socket = e, this.registering = false, this.events.emit("open");
  }
  onClose(e) {
    this.socket = void 0, this.registering = false, this.events.emit("close", e);
  }
  onPayload(e) {
    if (typeof e.data > "u") return;
    const t = typeof e.data == "string" ? safeJsonParse(e.data) : e.data;
    this.events.emit("payload", t);
  }
  onError(e, t) {
    const n = this.parseError(t), s = n.message || n.toString(), o = formatJsonRpcError(e, s);
    this.events.emit("payload", o);
  }
  parseError(e, t = this.url) {
    return parseConnectionError(e, d$2(t), "WS");
  }
  resetMaxListeners() {
    this.events.getMaxListeners() > h$1 && this.events.setMaxListeners(h$1);
  }
  emitError(e) {
    const t = this.parseError(new Error(e?.message || `WebSocket connection failed for host: ${d$2(this.url)}`));
    return this.events.emit("register_error", t), t;
  }
};

var define_process_env_default = { VITE_PLATFORM_FEE_RECEIVER: "0x47d80671Bcb7Ec368ef4d3ca6E1C20173CCc9a28", VITE_ETHEREUM_RPC_URL: "your_ethereum_rpc_url_here", VITE_SEPOLIA_RPC_URL: "your_sepolia_rpc_url_here", VITE_BASE_RPC_URL: "https://base-mainnet.g.alchemy.com/v2/hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3", VITE_ALCHEMY_API_KEY: "hoaKpKFy40ibWtxftFZbJNUk5NQoL0R3", VITE_BASESCAN_API_KEY: "PD6BITPMKB19J57SJN1MB2XH5FQJ54GBE1", VITE_ETHERSCAN_API_KEY: "your_etherscan_api_key_here", VITE_BSCSCAN_API_KEY: "your_bscscan_api_key_here", VITE_AVALANCHE_API_KEY: "your_avalanche_api_key_here", VITE_POLYGONSCAN_API_KEY: "your_polygonscan_api_key_here", VITE_REPORT_GAS: "true", NODE_ENV: "production" };
const ze$1 = "wc", Le$2 = 2, he$1 = "core", B$2 = `${ze$1}@2:${he$1}:`, Et$1 = { logger: "error" }, It$1 = { database: ":memory:" }, Tt$1 = "crypto", ke$2 = "client_ed25519_seed", Ct = cjs$3.ONE_DAY, Pt$1 = "keychain", St$2 = "0.3", Ot = "messages", Rt$1 = "0.3", je$1 = cjs$3.SIX_HOURS, At = "publisher", xt$1 = "irn", Nt = "error", Ue$2 = "wss://relay.walletconnect.org", $t = "relayer", C$2 = { message: "relayer_message", message_ack: "relayer_message_ack", connect: "relayer_connect", disconnect: "relayer_disconnect", error: "relayer_error", connection_stalled: "relayer_connection_stalled", transport_closed: "relayer_transport_closed", publish: "relayer_publish" }, zt$1 = "_subscription", L$3 = { payload: "payload", connect: "connect", disconnect: "disconnect", error: "error" }, Lt$1 = 0.1, _e$2 = "2.21.1", Q$2 = { link_mode: "link_mode", relay: "relay" }, le$1 = { inbound: "inbound", outbound: "outbound" }, kt$1 = "0.3", jt$1 = "WALLETCONNECT_CLIENT_ID", Fe$1 = "WALLETCONNECT_LINK_MODE_APPS", $$3 = { created: "subscription_created", deleted: "subscription_deleted", expired: "subscription_expired", disabled: "subscription_disabled", sync: "subscription_sync", resubscribed: "subscription_resubscribed" }, Ut$1 = "subscription", Ft$1 = "0.3", Mt$1 = "pairing", Kt$1 = "0.3", se$1 = { wc_pairingDelete: { req: { ttl: cjs$3.ONE_DAY, prompt: false, tag: 1e3 }, res: { ttl: cjs$3.ONE_DAY, prompt: false, tag: 1001 } }, wc_pairingPing: { req: { ttl: cjs$3.THIRTY_SECONDS, prompt: false, tag: 1002 }, res: { ttl: cjs$3.THIRTY_SECONDS, prompt: false, tag: 1003 } }, unregistered_method: { req: { ttl: cjs$3.ONE_DAY, prompt: false, tag: 0 }, res: { ttl: cjs$3.ONE_DAY, prompt: false, tag: 0 } } }, re$1 = { create: "pairing_create", expire: "pairing_expire", delete: "pairing_delete", ping: "pairing_ping" }, F$2 = { created: "history_created", updated: "history_updated", deleted: "history_deleted", sync: "history_sync" }, Bt$1 = "history", Vt$1 = "0.3", qt$1 = "expirer", M$2 = { created: "expirer_created", deleted: "expirer_deleted", expired: "expirer_expired", sync: "expirer_sync" }, Gt$1 = "0.3", Wt$1 = "verify-api", Zs = "https://verify.walletconnect.com", Ht = "https://verify.walletconnect.org", ue$1 = Ht, Yt$1 = `${ue$1}/v3`, Jt$1 = [Zs, Ht], Xt$1 = "echo", Zt$1 = "https://echo.walletconnect.com", G$1 = { pairing_started: "pairing_started", pairing_uri_validation_success: "pairing_uri_validation_success", pairing_uri_not_expired: "pairing_uri_not_expired", store_new_pairing: "store_new_pairing", subscribing_pairing_topic: "subscribing_pairing_topic", subscribe_pairing_topic_success: "subscribe_pairing_topic_success", existing_pairing: "existing_pairing", pairing_not_expired: "pairing_not_expired", emit_inactive_pairing: "emit_inactive_pairing", emit_session_proposal: "emit_session_proposal", subscribing_to_pairing_topic: "subscribing_to_pairing_topic" }, Y$2 = { no_wss_connection: "no_wss_connection", no_internet_connection: "no_internet_connection", malformed_pairing_uri: "malformed_pairing_uri", active_pairing_already_exists: "active_pairing_already_exists", subscribe_pairing_topic_failure: "subscribe_pairing_topic_failure", pairing_expired: "pairing_expired", proposal_expired: "proposal_expired", proposal_listener_not_found: "proposal_listener_not_found" }, er = { session_approve_started: "session_approve_started", proposal_not_expired: "proposal_not_expired", session_namespaces_validation_success: "session_namespaces_validation_success", create_session_topic: "create_session_topic", subscribing_session_topic: "subscribing_session_topic", subscribe_session_topic_success: "subscribe_session_topic_success", publishing_session_approve: "publishing_session_approve", session_approve_publish_success: "session_approve_publish_success", store_session: "store_session", publishing_session_settle: "publishing_session_settle", session_settle_publish_success: "session_settle_publish_success" }, tr = { no_internet_connection: "no_internet_connection", no_wss_connection: "no_wss_connection", proposal_expired: "proposal_expired", subscribe_session_topic_failure: "subscribe_session_topic_failure", session_approve_publish_failure: "session_approve_publish_failure", session_settle_publish_failure: "session_settle_publish_failure", session_approve_namespace_validation_failure: "session_approve_namespace_validation_failure", proposal_not_found: "proposal_not_found" }, ir = { authenticated_session_approve_started: "authenticated_session_approve_started", create_authenticated_session_topic: "create_authenticated_session_topic", cacaos_verified: "cacaos_verified", store_authenticated_session: "store_authenticated_session", subscribing_authenticated_session_topic: "subscribing_authenticated_session_topic", subscribe_authenticated_session_topic_success: "subscribe_authenticated_session_topic_success", publishing_authenticated_session_approve: "publishing_authenticated_session_approve"}, sr = { no_internet_connection: "no_internet_connection", invalid_cacao: "invalid_cacao", subscribe_authenticated_session_topic_failure: "subscribe_authenticated_session_topic_failure", authenticated_session_approve_publish_failure: "authenticated_session_approve_publish_failure", authenticated_session_pending_request_not_found: "authenticated_session_pending_request_not_found" }, Qt$1 = 0.1, ei = "event-client", ti = 86400, ii = "https://pulse.walletconnect.org/batch";
function rr(r, e) {
  if (r.length >= 255) throw new TypeError("Alphabet too long");
  for (var t = new Uint8Array(256), i = 0; i < t.length; i++) t[i] = 255;
  for (var s = 0; s < r.length; s++) {
    var n = r.charAt(s), o = n.charCodeAt(0);
    if (t[o] !== 255) throw new TypeError(n + " is ambiguous");
    t[o] = s;
  }
  var a = r.length, c = r.charAt(0), h = Math.log(a) / Math.log(256), l = Math.log(256) / Math.log(a);
  function d(u) {
    if (u instanceof Uint8Array || (ArrayBuffer.isView(u) ? u = new Uint8Array(u.buffer, u.byteOffset, u.byteLength) : Array.isArray(u) && (u = Uint8Array.from(u))), !(u instanceof Uint8Array)) throw new TypeError("Expected Uint8Array");
    if (u.length === 0) return "";
    for (var b = 0, x = 0, I = 0, D = u.length; I !== D && u[I] === 0; ) I++, b++;
    for (var j = (D - I) * l + 1 >>> 0, T = new Uint8Array(j); I !== D; ) {
      for (var q = u[I], J = 0, K = j - 1; (q !== 0 || J < x) && K !== -1; K--, J++) q += 256 * T[K] >>> 0, T[K] = q % a >>> 0, q = q / a >>> 0;
      if (q !== 0) throw new Error("Non-zero carry");
      x = J, I++;
    }
    for (var H = j - x; H !== j && T[H] === 0; ) H++;
    for (var me = c.repeat(b); H < j; ++H) me += r.charAt(T[H]);
    return me;
  }
  function g(u) {
    if (typeof u != "string") throw new TypeError("Expected String");
    if (u.length === 0) return new Uint8Array();
    var b = 0;
    if (u[b] !== " ") {
      for (var x = 0, I = 0; u[b] === c; ) x++, b++;
      for (var D = (u.length - b) * h + 1 >>> 0, j = new Uint8Array(D); u[b]; ) {
        var T = t[u.charCodeAt(b)];
        if (T === 255) return;
        for (var q = 0, J = D - 1; (T !== 0 || q < I) && J !== -1; J--, q++) T += a * j[J] >>> 0, j[J] = T % 256 >>> 0, T = T / 256 >>> 0;
        if (T !== 0) throw new Error("Non-zero carry");
        I = q, b++;
      }
      if (u[b] !== " ") {
        for (var K = D - I; K !== D && j[K] === 0; ) K++;
        for (var H = new Uint8Array(x + (D - K)), me = x; K !== D; ) H[me++] = j[K++];
        return H;
      }
    }
  }
  function _(u) {
    var b = g(u);
    if (b) return b;
    throw new Error(`Non-${e} character`);
  }
  return { encode: d, decodeUnsafe: g, decode: _ };
}
var nr = rr, or = nr;
const si = (r) => {
  if (r instanceof Uint8Array && r.constructor.name === "Uint8Array") return r;
  if (r instanceof ArrayBuffer) return new Uint8Array(r);
  if (ArrayBuffer.isView(r)) return new Uint8Array(r.buffer, r.byteOffset, r.byteLength);
  throw new Error("Unknown type, must be binary type");
}, ar = (r) => new TextEncoder().encode(r), cr = (r) => new TextDecoder().decode(r);
class hr {
  constructor(e, t, i) {
    this.name = e, this.prefix = t, this.baseEncode = i;
  }
  encode(e) {
    if (e instanceof Uint8Array) return `${this.prefix}${this.baseEncode(e)}`;
    throw Error("Unknown type, must be binary type");
  }
}
class lr {
  constructor(e, t, i) {
    if (this.name = e, this.prefix = t, t.codePointAt(0) === void 0) throw new Error("Invalid prefix character");
    this.prefixCodePoint = t.codePointAt(0), this.baseDecode = i;
  }
  decode(e) {
    if (typeof e == "string") {
      if (e.codePointAt(0) !== this.prefixCodePoint) throw Error(`Unable to decode multibase string ${JSON.stringify(e)}, ${this.name} decoder only supports inputs prefixed with ${this.prefix}`);
      return this.baseDecode(e.slice(this.prefix.length));
    } else throw Error("Can only multibase decode strings");
  }
  or(e) {
    return ri(this, e);
  }
}
class ur {
  constructor(e) {
    this.decoders = e;
  }
  or(e) {
    return ri(this, e);
  }
  decode(e) {
    const t = e[0], i = this.decoders[t];
    if (i) return i.decode(e);
    throw RangeError(`Unable to decode multibase string ${JSON.stringify(e)}, only inputs prefixed with ${Object.keys(this.decoders)} are supported`);
  }
}
const ri = (r, e) => new ur({ ...r.decoders || { [r.prefix]: r }, ...e.decoders || { [e.prefix]: e } });
class dr {
  constructor(e, t, i, s) {
    this.name = e, this.prefix = t, this.baseEncode = i, this.baseDecode = s, this.encoder = new hr(e, t, i), this.decoder = new lr(e, t, s);
  }
  encode(e) {
    return this.encoder.encode(e);
  }
  decode(e) {
    return this.decoder.decode(e);
  }
}
const Ee$2 = ({ name: r, prefix: e, encode: t, decode: i }) => new dr(r, e, t, i), de$1 = ({ prefix: r, name: e, alphabet: t }) => {
  const { encode: i, decode: s } = or(t, e);
  return Ee$2({ prefix: r, name: e, encode: i, decode: (n) => si(s(n)) });
}, gr = (r, e, t, i) => {
  const s = {};
  for (let l = 0; l < e.length; ++l) s[e[l]] = l;
  let n = r.length;
  for (; r[n - 1] === "="; ) --n;
  const o = new Uint8Array(n * t / 8 | 0);
  let a = 0, c = 0, h = 0;
  for (let l = 0; l < n; ++l) {
    const d = s[r[l]];
    if (d === void 0) throw new SyntaxError(`Non-${i} character`);
    c = c << t | d, a += t, a >= 8 && (a -= 8, o[h++] = 255 & c >> a);
  }
  if (a >= t || 255 & c << 8 - a) throw new SyntaxError("Unexpected end of data");
  return o;
}, pr = (r, e, t) => {
  const i = e[e.length - 1] === "=", s = (1 << t) - 1;
  let n = "", o = 0, a = 0;
  for (let c = 0; c < r.length; ++c) for (a = a << 8 | r[c], o += 8; o > t; ) o -= t, n += e[s & a >> o];
  if (o && (n += e[s & a << t - o]), i) for (; n.length * t & 7; ) n += "=";
  return n;
}, P$2 = ({ name: r, prefix: e, bitsPerChar: t, alphabet: i }) => Ee$2({ prefix: e, name: r, encode(s) {
  return pr(s, i, t);
}, decode(s) {
  return gr(s, i, t, r);
} }), yr = Ee$2({ prefix: "\0", name: "identity", encode: (r) => cr(r), decode: (r) => ar(r) });
var br = Object.freeze({ __proto__: null, identity: yr });
const mr = P$2({ prefix: "0", name: "base2", alphabet: "01", bitsPerChar: 1 });
var fr = Object.freeze({ __proto__: null, base2: mr });
const Dr = P$2({ prefix: "7", name: "base8", alphabet: "01234567", bitsPerChar: 3 });
var vr = Object.freeze({ __proto__: null, base8: Dr });
const wr = de$1({ prefix: "9", name: "base10", alphabet: "0123456789" });
var _r = Object.freeze({ __proto__: null, base10: wr });
const Er = P$2({ prefix: "f", name: "base16", alphabet: "0123456789abcdef", bitsPerChar: 4 }), Ir = P$2({ prefix: "F", name: "base16upper", alphabet: "0123456789ABCDEF", bitsPerChar: 4 });
var Tr = Object.freeze({ __proto__: null, base16: Er, base16upper: Ir });
const Cr = P$2({ prefix: "b", name: "base32", alphabet: "abcdefghijklmnopqrstuvwxyz234567", bitsPerChar: 5 }), Pr = P$2({ prefix: "B", name: "base32upper", alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567", bitsPerChar: 5 }), Sr = P$2({ prefix: "c", name: "base32pad", alphabet: "abcdefghijklmnopqrstuvwxyz234567=", bitsPerChar: 5 }), Or = P$2({ prefix: "C", name: "base32padupper", alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=", bitsPerChar: 5 }), Rr = P$2({ prefix: "v", name: "base32hex", alphabet: "0123456789abcdefghijklmnopqrstuv", bitsPerChar: 5 }), Ar = P$2({ prefix: "V", name: "base32hexupper", alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV", bitsPerChar: 5 }), xr = P$2({ prefix: "t", name: "base32hexpad", alphabet: "0123456789abcdefghijklmnopqrstuv=", bitsPerChar: 5 }), Nr = P$2({ prefix: "T", name: "base32hexpadupper", alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV=", bitsPerChar: 5 }), $r = P$2({ prefix: "h", name: "base32z", alphabet: "ybndrfg8ejkmcpqxot1uwisza345h769", bitsPerChar: 5 });
var zr = Object.freeze({ __proto__: null, base32: Cr, base32upper: Pr, base32pad: Sr, base32padupper: Or, base32hex: Rr, base32hexupper: Ar, base32hexpad: xr, base32hexpadupper: Nr, base32z: $r });
const Lr = de$1({ prefix: "k", name: "base36", alphabet: "0123456789abcdefghijklmnopqrstuvwxyz" }), kr = de$1({ prefix: "K", name: "base36upper", alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" });
var jr = Object.freeze({ __proto__: null, base36: Lr, base36upper: kr });
const Ur = de$1({ name: "base58btc", prefix: "z", alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz" }), Fr = de$1({ name: "base58flickr", prefix: "Z", alphabet: "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ" });
var Mr = Object.freeze({ __proto__: null, base58btc: Ur, base58flickr: Fr });
const Kr = P$2({ prefix: "m", name: "base64", alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", bitsPerChar: 6 }), Br = P$2({ prefix: "M", name: "base64pad", alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", bitsPerChar: 6 }), Vr = P$2({ prefix: "u", name: "base64url", alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", bitsPerChar: 6 }), qr = P$2({ prefix: "U", name: "base64urlpad", alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=", bitsPerChar: 6 });
var Gr = Object.freeze({ __proto__: null, base64: Kr, base64pad: Br, base64url: Vr, base64urlpad: qr });
const ni = Array.from("🚀🪐☄🛰🌌🌑🌒🌓🌔🌕🌖🌗🌘🌍🌏🌎🐉☀💻🖥💾💿😂❤😍🤣😊🙏💕😭😘👍😅👏😁🔥🥰💔💖💙😢🤔😆🙄💪😉☺👌🤗💜😔😎😇🌹🤦🎉💞✌✨🤷😱😌🌸🙌😋💗💚😏💛🙂💓🤩😄😀🖤😃💯🙈👇🎶😒🤭❣😜💋👀😪😑💥🙋😞😩😡🤪👊🥳😥🤤👉💃😳✋😚😝😴🌟😬🙃🍀🌷😻😓⭐✅🥺🌈😈🤘💦✔😣🏃💐☹🎊💘😠☝😕🌺🎂🌻😐🖕💝🙊😹🗣💫💀👑🎵🤞😛🔴😤🌼😫⚽🤙☕🏆🤫👈😮🙆🍻🍃🐶💁😲🌿🧡🎁⚡🌞🎈❌✊👋😰🤨😶🤝🚶💰🍓💢🤟🙁🚨💨🤬✈🎀🍺🤓😙💟🌱😖👶🥴▶➡❓💎💸⬇😨🌚🦋😷🕺⚠🙅😟😵👎🤲🤠🤧📌🔵💅🧐🐾🍒😗🤑🌊🤯🐷☎💧😯💆👆🎤🙇🍑❄🌴💣🐸💌📍🥀🤢👅💡💩👐📸👻🤐🤮🎼🥵🚩🍎🍊👼💍📣🥂"), Wr = ni.reduce((r, e, t) => (r[t] = e, r), []), Hr = ni.reduce((r, e, t) => (r[e.codePointAt(0)] = t, r), []);
function Yr(r) {
  return r.reduce((e, t) => (e += Wr[t], e), "");
}
function Jr(r) {
  const e = [];
  for (const t of r) {
    const i = Hr[t.codePointAt(0)];
    if (i === void 0) throw new Error(`Non-base256emoji character: ${t}`);
    e.push(i);
  }
  return new Uint8Array(e);
}
const Xr = Ee$2({ prefix: "🚀", name: "base256emoji", encode: Yr, decode: Jr });
var Zr = Object.freeze({ __proto__: null, base256emoji: Xr }), Qr = ai, oi = 128, tn = -128, sn = Math.pow(2, 31);
function ai(r, e, t) {
  e = e || [], t = t || 0;
  for (var i = t; r >= sn; ) e[t++] = r & 255 | oi, r /= 128;
  for (; r & tn; ) e[t++] = r & 255 | oi, r >>>= 7;
  return e[t] = r | 0, ai.bytes = t - i + 1, e;
}
var rn = Me$2, nn = 128, ci = 127;
function Me$2(r, i) {
  var t = 0, i = i || 0, s = 0, n = i, o, a = r.length;
  do {
    if (n >= a) throw Me$2.bytes = 0, new RangeError("Could not decode varint");
    o = r[n++], t += s < 28 ? (o & ci) << s : (o & ci) * Math.pow(2, s), s += 7;
  } while (o >= nn);
  return Me$2.bytes = n - i, t;
}
var on = Math.pow(2, 7), an = Math.pow(2, 14), cn = Math.pow(2, 21), hn = Math.pow(2, 28), ln = Math.pow(2, 35), un = Math.pow(2, 42), dn = Math.pow(2, 49), gn = Math.pow(2, 56), pn = Math.pow(2, 63), yn = function(r) {
  return r < on ? 1 : r < an ? 2 : r < cn ? 3 : r < hn ? 4 : r < ln ? 5 : r < un ? 6 : r < dn ? 7 : r < gn ? 8 : r < pn ? 9 : 10;
}, bn = { encode: Qr, decode: rn, encodingLength: yn }, hi = bn;
const li = (r, e, t = 0) => (hi.encode(r, e, t), e), ui = (r) => hi.encodingLength(r), Ke$2 = (r, e) => {
  const t = e.byteLength, i = ui(r), s = i + ui(t), n = new Uint8Array(s + t);
  return li(r, n, 0), li(t, n, i), n.set(e, s), new mn(r, t, e, n);
};
class mn {
  constructor(e, t, i, s) {
    this.code = e, this.size = t, this.digest = i, this.bytes = s;
  }
}
const di = ({ name: r, code: e, encode: t }) => new fn(r, e, t);
class fn {
  constructor(e, t, i) {
    this.name = e, this.code = t, this.encode = i;
  }
  digest(e) {
    if (e instanceof Uint8Array) {
      const t = this.encode(e);
      return t instanceof Uint8Array ? Ke$2(this.code, t) : t.then((i) => Ke$2(this.code, i));
    } else throw Error("Unknown type, must be binary type");
  }
}
const gi = (r) => async (e) => new Uint8Array(await crypto.subtle.digest(r, e)), Dn = di({ name: "sha2-256", code: 18, encode: gi("SHA-256") }), vn = di({ name: "sha2-512", code: 19, encode: gi("SHA-512") });
var wn = Object.freeze({ __proto__: null, sha256: Dn, sha512: vn });
const pi = 0, _n = "identity", yi = si, En = (r) => Ke$2(pi, yi(r)), In = { code: pi, name: _n, encode: yi, digest: En };
var Tn = Object.freeze({ __proto__: null, identity: In });
new TextEncoder(), new TextDecoder();
const bi = { ...br, ...fr, ...vr, ..._r, ...Tr, ...zr, ...jr, ...Mr, ...Gr, ...Zr };
({ ...wn, ...Tn });
function Cn(r = 0) {
  return globalThis.Buffer != null && globalThis.Buffer.allocUnsafe != null ? globalThis.Buffer.allocUnsafe(r) : new Uint8Array(r);
}
function mi(r, e, t, i) {
  return { name: r, prefix: e, encoder: { name: r, prefix: e, encode: t }, decoder: { decode: i } };
}
const fi = mi("utf8", "u", (r) => "u" + new TextDecoder("utf8").decode(r), (r) => new TextEncoder().encode(r.substring(1))), Be$1 = mi("ascii", "a", (r) => {
  let e = "a";
  for (let t = 0; t < r.length; t++) e += String.fromCharCode(r[t]);
  return e;
}, (r) => {
  r = r.substring(1);
  const e = Cn(r.length);
  for (let t = 0; t < r.length; t++) e[t] = r.charCodeAt(t);
  return e;
}), Pn = { utf8: fi, "utf-8": fi, hex: bi.base16, latin1: Be$1, ascii: Be$1, binary: Be$1, ...bi };
function Sn(r, e = "utf8") {
  const t = Pn[e];
  if (!t) throw new Error(`Unsupported encoding "${e}"`);
  return (e === "utf8" || e === "utf-8") && globalThis.Buffer != null && globalThis.Buffer.from != null ? globalThis.Buffer.from(r, "utf8") : t.decoder.decode(`${t.prefix}${r}`);
}
var On = Object.defineProperty, Rn = (r, e, t) => e in r ? On(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, W$2 = (r, e, t) => Rn(r, typeof e != "symbol" ? e + "" : e, t);
class Di {
  constructor(e, t) {
    this.core = e, this.logger = t, W$2(this, "keychain", /* @__PURE__ */ new Map()), W$2(this, "name", Pt$1), W$2(this, "version", St$2), W$2(this, "initialized", false), W$2(this, "storagePrefix", B$2), W$2(this, "init", async () => {
      if (!this.initialized) {
        const i = await this.getKeyChain();
        typeof i < "u" && (this.keychain = i), this.initialized = true;
      }
    }), W$2(this, "has", (i) => (this.isInitialized(), this.keychain.has(i))), W$2(this, "set", async (i, s) => {
      this.isInitialized(), this.keychain.set(i, s), await this.persist();
    }), W$2(this, "get", (i) => {
      this.isInitialized();
      const s = this.keychain.get(i);
      if (typeof s > "u") {
        const { message: n } = ht$2("NO_MATCHING_KEY", `${this.name}: ${i}`);
        throw new Error(n);
      }
      return s;
    }), W$2(this, "del", async (i) => {
      this.isInitialized(), this.keychain.delete(i), await this.persist();
    }), this.core = e, this.logger = E$5(t, this.name);
  }
  get context() {
    return y$3(this.logger);
  }
  get storageKey() {
    return this.storagePrefix + this.version + this.core.customStoragePrefix + "//" + this.name;
  }
  async setKeyChain(e) {
    await this.core.storage.setItem(this.storageKey, fi$1(e));
  }
  async getKeyChain() {
    const e = await this.core.storage.getItem(this.storageKey);
    return typeof e < "u" ? li$1(e) : void 0;
  }
  async persist() {
    await this.setKeyChain(this.keychain);
  }
  isInitialized() {
    if (!this.initialized) {
      const { message: e } = ht$2("NOT_INITIALIZED", this.name);
      throw new Error(e);
    }
  }
}
var An = Object.defineProperty, xn = (r, e, t) => e in r ? An(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, S$2 = (r, e, t) => xn(r, typeof e != "symbol" ? e + "" : e, t);
class vi {
  constructor(e, t, i) {
    this.core = e, this.logger = t, S$2(this, "name", Tt$1), S$2(this, "keychain"), S$2(this, "randomSessionIdentifier", jc()), S$2(this, "initialized", false), S$2(this, "init", async () => {
      this.initialized || (await this.keychain.init(), this.initialized = true);
    }), S$2(this, "hasKeys", (s) => (this.isInitialized(), this.keychain.has(s))), S$2(this, "getClientId", async () => {
      this.isInitialized();
      const s = await this.getClientSeed(), n = Po$1(s);
      return Qe$3(n.publicKey);
    }), S$2(this, "generateKeyPair", () => {
      this.isInitialized();
      const s = Lc();
      return this.setPrivateKey(s.publicKey, s.privateKey);
    }), S$2(this, "signJWT", async (s) => {
      this.isInitialized();
      const n = await this.getClientSeed(), o = Po$1(n), a = this.randomSessionIdentifier, c = Ct;
      return await Qo(a, s, c, o);
    }), S$2(this, "generateSharedKey", (s, n, o) => {
      this.isInitialized();
      const a = this.getPrivateKey(s), c = Cc(a, n);
      return this.setSymKey(c, o);
    }), S$2(this, "setSymKey", async (s, n) => {
      this.isInitialized();
      const o = n || Pc(s);
      return await this.keychain.set(o, s), o;
    }), S$2(this, "deleteKeyPair", async (s) => {
      this.isInitialized(), await this.keychain.del(s);
    }), S$2(this, "deleteSymKey", async (s) => {
      this.isInitialized(), await this.keychain.del(s);
    }), S$2(this, "encode", async (s, n, o) => {
      this.isInitialized();
      const a = oo$1(o), c = safeJsonStringify(n);
      if (Fc(a)) return Dc(c, o?.encoding);
      if (Kc(a)) {
        const g = a.senderPublicKey, _ = a.receiverPublicKey;
        s = await this.generateSharedKey(g, _);
      }
      const h = this.getSymKey(s), { type: l, senderPublicKey: d } = a;
      return Vc({ type: l, symKey: h, message: c, senderPublicKey: d, encoding: o?.encoding });
    }), S$2(this, "decode", async (s, n, o) => {
      this.isInitialized();
      const a = qc(n, o);
      if (Fc(a)) {
        const c = Hc(n, o?.encoding);
        return safeJsonParse(c);
      }
      if (Kc(a)) {
        const c = a.receiverPublicKey, h = a.senderPublicKey;
        s = await this.generateSharedKey(c, h);
      }
      try {
        const c = this.getSymKey(s), h = Mc({ symKey: c, encoded: n, encoding: o?.encoding });
        return safeJsonParse(h);
      } catch (c) {
        this.logger.error(`Failed to decode message from topic: '${s}', clientId: '${await this.getClientId()}'`), this.logger.error(c);
      }
    }), S$2(this, "getPayloadType", (s, n = qt$2) => {
      const o = Se$1({ encoded: s, encoding: n });
      return Bt$2(o.type);
    }), S$2(this, "getPayloadSenderPublicKey", (s, n = qt$2) => {
      const o = Se$1({ encoded: s, encoding: n });
      return o.senderPublicKey ? toString(o.senderPublicKey, G$2) : void 0;
    }), this.core = e, this.logger = E$5(t, this.name), this.keychain = i || new Di(this.core, this.logger);
  }
  get context() {
    return y$3(this.logger);
  }
  async setPrivateKey(e, t) {
    return await this.keychain.set(e, t), e;
  }
  getPrivateKey(e) {
    return this.keychain.get(e);
  }
  async getClientSeed() {
    let e = "";
    try {
      e = this.keychain.get(ke$2);
    } catch {
      e = jc(), await this.keychain.set(ke$2, e);
    }
    return Sn(e, "base16");
  }
  getSymKey(e) {
    return this.keychain.get(e);
  }
  isInitialized() {
    if (!this.initialized) {
      const { message: e } = ht$2("NOT_INITIALIZED", this.name);
      throw new Error(e);
    }
  }
}
var Nn = Object.defineProperty, $n = Object.defineProperties, zn = Object.getOwnPropertyDescriptors, wi = Object.getOwnPropertySymbols, Ln = Object.prototype.hasOwnProperty, kn = Object.prototype.propertyIsEnumerable, Ve$1 = (r, e, t) => e in r ? Nn(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, jn = (r, e) => {
  for (var t in e || (e = {})) Ln.call(e, t) && Ve$1(r, t, e[t]);
  if (wi) for (var t of wi(e)) kn.call(e, t) && Ve$1(r, t, e[t]);
  return r;
}, Un = (r, e) => $n(r, zn(e)), k$2 = (r, e, t) => Ve$1(r, typeof e != "symbol" ? e + "" : e, t);
class _i extends y$2 {
  constructor(e, t) {
    super(e, t), this.logger = e, this.core = t, k$2(this, "messages", /* @__PURE__ */ new Map()), k$2(this, "messagesWithoutClientAck", /* @__PURE__ */ new Map()), k$2(this, "name", Ot), k$2(this, "version", Rt$1), k$2(this, "initialized", false), k$2(this, "storagePrefix", B$2), k$2(this, "init", async () => {
      if (!this.initialized) {
        this.logger.trace("Initialized");
        try {
          const i = await this.getRelayerMessages();
          typeof i < "u" && (this.messages = i);
          const s = await this.getRelayerMessagesWithoutClientAck();
          typeof s < "u" && (this.messagesWithoutClientAck = s), this.logger.debug(`Successfully Restored records for ${this.name}`), this.logger.trace({ type: "method", method: "restore", size: this.messages.size });
        } catch (i) {
          this.logger.debug(`Failed to Restore records for ${this.name}`), this.logger.error(i);
        } finally {
          this.initialized = true;
        }
      }
    }), k$2(this, "set", async (i, s, n) => {
      this.isInitialized();
      const o = kc(s);
      let a = this.messages.get(i);
      if (typeof a > "u" && (a = {}), typeof a[o] < "u") return o;
      if (a[o] = s, this.messages.set(i, a), n === le$1.inbound) {
        const c = this.messagesWithoutClientAck.get(i) || {};
        this.messagesWithoutClientAck.set(i, Un(jn({}, c), { [o]: s }));
      }
      return await this.persist(), o;
    }), k$2(this, "get", (i) => {
      this.isInitialized();
      let s = this.messages.get(i);
      return typeof s > "u" && (s = {}), s;
    }), k$2(this, "getWithoutAck", (i) => {
      this.isInitialized();
      const s = {};
      for (const n of i) {
        const o = this.messagesWithoutClientAck.get(n) || {};
        s[n] = Object.values(o);
      }
      return s;
    }), k$2(this, "has", (i, s) => {
      this.isInitialized();
      const n = this.get(i), o = kc(s);
      return typeof n[o] < "u";
    }), k$2(this, "ack", async (i, s) => {
      this.isInitialized();
      const n = this.messagesWithoutClientAck.get(i);
      if (typeof n > "u") return;
      const o = kc(s);
      delete n[o], Object.keys(n).length === 0 ? this.messagesWithoutClientAck.delete(i) : this.messagesWithoutClientAck.set(i, n), await this.persist();
    }), k$2(this, "del", async (i) => {
      this.isInitialized(), this.messages.delete(i), this.messagesWithoutClientAck.delete(i), await this.persist();
    }), this.logger = E$5(e, this.name), this.core = t;
  }
  get context() {
    return y$3(this.logger);
  }
  get storageKey() {
    return this.storagePrefix + this.version + this.core.customStoragePrefix + "//" + this.name;
  }
  get storageKeyWithoutClientAck() {
    return this.storagePrefix + this.version + this.core.customStoragePrefix + "//" + this.name + "_withoutClientAck";
  }
  async setRelayerMessages(e) {
    await this.core.storage.setItem(this.storageKey, fi$1(e));
  }
  async setRelayerMessagesWithoutClientAck(e) {
    await this.core.storage.setItem(this.storageKeyWithoutClientAck, fi$1(e));
  }
  async getRelayerMessages() {
    const e = await this.core.storage.getItem(this.storageKey);
    return typeof e < "u" ? li$1(e) : void 0;
  }
  async getRelayerMessagesWithoutClientAck() {
    const e = await this.core.storage.getItem(this.storageKeyWithoutClientAck);
    return typeof e < "u" ? li$1(e) : void 0;
  }
  async persist() {
    await this.setRelayerMessages(this.messages), await this.setRelayerMessagesWithoutClientAck(this.messagesWithoutClientAck);
  }
  isInitialized() {
    if (!this.initialized) {
      const { message: e } = ht$2("NOT_INITIALIZED", this.name);
      throw new Error(e);
    }
  }
}
var Fn = Object.defineProperty, Mn = Object.defineProperties, Kn = Object.getOwnPropertyDescriptors, Ei = Object.getOwnPropertySymbols, Bn = Object.prototype.hasOwnProperty, Vn = Object.prototype.propertyIsEnumerable, qe$1 = (r, e, t) => e in r ? Fn(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, Ie$1 = (r, e) => {
  for (var t in e || (e = {})) Bn.call(e, t) && qe$1(r, t, e[t]);
  if (Ei) for (var t of Ei(e)) Vn.call(e, t) && qe$1(r, t, e[t]);
  return r;
}, Ge$2 = (r, e) => Mn(r, Kn(e)), V$2 = (r, e, t) => qe$1(r, typeof e != "symbol" ? e + "" : e, t);
class qn extends m {
  constructor(e, t) {
    super(e, t), this.relayer = e, this.logger = t, V$2(this, "events", new eventsExports.EventEmitter()), V$2(this, "name", At), V$2(this, "queue", /* @__PURE__ */ new Map()), V$2(this, "publishTimeout", cjs$3.toMiliseconds(cjs$3.ONE_MINUTE)), V$2(this, "initialPublishTimeout", cjs$3.toMiliseconds(cjs$3.ONE_SECOND * 15)), V$2(this, "needsTransportRestart", false), V$2(this, "publish", async (i, s, n) => {
      var o;
      this.logger.debug("Publishing Payload"), this.logger.trace({ type: "method", method: "publish", params: { topic: i, message: s, opts: n } });
      const a = n?.ttl || je$1, c = Zc(n), h = n?.prompt || false, l = n?.tag || 0, d = n?.id || getBigIntRpcId().toString(), g = { topic: i, message: s, opts: { ttl: a, relay: c, prompt: h, tag: l, id: d, attestation: n?.attestation, tvf: n?.tvf } }, _ = `Failed to publish payload, please try again. id:${d} tag:${l}`;
      try {
        const u = new Promise(async (b) => {
          const x = ({ id: D }) => {
            g.opts.id === D && (this.removeRequestFromQueue(D), this.relayer.events.removeListener(C$2.publish, x), b(g));
          };
          this.relayer.events.on(C$2.publish, x);
          const I = yi$1(new Promise((D, j) => {
            this.rpcPublish({ topic: i, message: s, ttl: a, prompt: h, tag: l, id: d, attestation: n?.attestation, tvf: n?.tvf }).then(D).catch((T) => {
              this.logger.warn(T, T?.message), j(T);
            });
          }), this.initialPublishTimeout, `Failed initial publish, retrying.... id:${d} tag:${l}`);
          try {
            await I, this.events.removeListener(C$2.publish, x);
          } catch (D) {
            this.queue.set(d, Ge$2(Ie$1({}, g), { attempt: 1 })), this.logger.warn(D, D?.message);
          }
        });
        this.logger.trace({ type: "method", method: "publish", params: { id: d, topic: i, message: s, opts: n } }), await yi$1(u, this.publishTimeout, _);
      } catch (u) {
        if (this.logger.debug("Failed to Publish Payload"), this.logger.error(u), (o = n?.internal) != null && o.throwOnFailedPublish) throw u;
      } finally {
        this.queue.delete(d);
      }
    }), V$2(this, "on", (i, s) => {
      this.events.on(i, s);
    }), V$2(this, "once", (i, s) => {
      this.events.once(i, s);
    }), V$2(this, "off", (i, s) => {
      this.events.off(i, s);
    }), V$2(this, "removeListener", (i, s) => {
      this.events.removeListener(i, s);
    }), this.relayer = e, this.logger = E$5(t, this.name), this.registerEventListeners();
  }
  get context() {
    return y$3(this.logger);
  }
  async rpcPublish(e) {
    var t, i, s, n;
    const { topic: o, message: a, ttl: c = je$1, prompt: h, tag: l, id: d, attestation: g, tvf: _ } = e, u = { method: Yc(Zc().protocol).publish, params: Ie$1({ topic: o, message: a, ttl: c, prompt: h, tag: l, attestation: g }, _), id: d };
    Et$2((t = u.params) == null ? void 0 : t.prompt) && ((i = u.params) == null || delete i.prompt), Et$2((s = u.params) == null ? void 0 : s.tag) && ((n = u.params) == null || delete n.tag), this.logger.debug("Outgoing Relay Payload"), this.logger.trace({ type: "message", direction: "outgoing", request: u });
    const b = await this.relayer.request(u);
    return this.relayer.events.emit(C$2.publish, e), this.logger.debug("Successfully Published Payload"), b;
  }
  removeRequestFromQueue(e) {
    this.queue.delete(e);
  }
  checkQueue() {
    this.queue.forEach(async (e, t) => {
      const i = e.attempt + 1;
      this.queue.set(t, Ge$2(Ie$1({}, e), { attempt: i }));
      const { topic: s, message: n, opts: o, attestation: a } = e;
      this.logger.warn({}, `Publisher: queue->publishing: ${e.opts.id}, tag: ${e.opts.tag}, attempt: ${i}`), await this.rpcPublish(Ge$2(Ie$1({}, e), { topic: s, message: n, ttl: o.ttl, prompt: o.prompt, tag: o.tag, id: o.id, attestation: a, tvf: o.tvf })), this.logger.warn({}, `Publisher: queue->published: ${e.opts.id}`);
    });
  }
  registerEventListeners() {
    this.relayer.core.heartbeat.on(r$1.pulse, () => {
      if (this.needsTransportRestart) {
        this.needsTransportRestart = false, this.relayer.events.emit(C$2.connection_stalled);
        return;
      }
      this.checkQueue();
    }), this.relayer.on(C$2.message_ack, (e) => {
      this.removeRequestFromQueue(e.id.toString());
    });
  }
}
var Gn = Object.defineProperty, Wn = (r, e, t) => e in r ? Gn(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, ne$1 = (r, e, t) => Wn(r, typeof e != "symbol" ? e + "" : e, t);
class Hn {
  constructor() {
    ne$1(this, "map", /* @__PURE__ */ new Map()), ne$1(this, "set", (e, t) => {
      const i = this.get(e);
      this.exists(e, t) || this.map.set(e, [...i, t]);
    }), ne$1(this, "get", (e) => this.map.get(e) || []), ne$1(this, "exists", (e, t) => this.get(e).includes(t)), ne$1(this, "delete", (e, t) => {
      if (typeof t > "u") {
        this.map.delete(e);
        return;
      }
      if (!this.map.has(e)) return;
      const i = this.get(e);
      if (!this.exists(e, t)) return;
      const s = i.filter((n) => n !== t);
      if (!s.length) {
        this.map.delete(e);
        return;
      }
      this.map.set(e, s);
    }), ne$1(this, "clear", () => {
      this.map.clear();
    });
  }
  get topics() {
    return Array.from(this.map.keys());
  }
}
var Yn = Object.defineProperty, Jn = Object.defineProperties, Xn = Object.getOwnPropertyDescriptors, Ii = Object.getOwnPropertySymbols, Zn = Object.prototype.hasOwnProperty, Qn = Object.prototype.propertyIsEnumerable, We$1 = (r, e, t) => e in r ? Yn(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, ge$1 = (r, e) => {
  for (var t in e || (e = {})) Zn.call(e, t) && We$1(r, t, e[t]);
  if (Ii) for (var t of Ii(e)) Qn.call(e, t) && We$1(r, t, e[t]);
  return r;
}, He$1 = (r, e) => Jn(r, Xn(e)), f$2 = (r, e, t) => We$1(r, typeof e != "symbol" ? e + "" : e, t);
class Ti extends P$3 {
  constructor(e, t) {
    super(e, t), this.relayer = e, this.logger = t, f$2(this, "subscriptions", /* @__PURE__ */ new Map()), f$2(this, "topicMap", new Hn()), f$2(this, "events", new eventsExports.EventEmitter()), f$2(this, "name", Ut$1), f$2(this, "version", Ft$1), f$2(this, "pending", /* @__PURE__ */ new Map()), f$2(this, "cached", []), f$2(this, "initialized", false), f$2(this, "storagePrefix", B$2), f$2(this, "subscribeTimeout", cjs$3.toMiliseconds(cjs$3.ONE_MINUTE)), f$2(this, "initialSubscribeTimeout", cjs$3.toMiliseconds(cjs$3.ONE_SECOND * 15)), f$2(this, "clientId"), f$2(this, "batchSubscribeTopicsLimit", 500), f$2(this, "init", async () => {
      this.initialized || (this.logger.trace("Initialized"), this.registerEventListeners(), await this.restore()), this.initialized = true;
    }), f$2(this, "subscribe", async (i, s) => {
      this.isInitialized(), this.logger.debug("Subscribing Topic"), this.logger.trace({ type: "method", method: "subscribe", params: { topic: i, opts: s } });
      try {
        const n = Zc(s), o = { topic: i, relay: n, transportType: s?.transportType };
        this.pending.set(i, o);
        const a = await this.rpcSubscribe(i, n, s);
        return typeof a == "string" && (this.onSubscribe(a, o), this.logger.debug("Successfully Subscribed Topic"), this.logger.trace({ type: "method", method: "subscribe", params: { topic: i, opts: s } })), a;
      } catch (n) {
        throw this.logger.debug("Failed to Subscribe Topic"), this.logger.error(n), n;
      }
    }), f$2(this, "unsubscribe", async (i, s) => {
      this.isInitialized(), typeof s?.id < "u" ? await this.unsubscribeById(i, s.id, s) : await this.unsubscribeByTopic(i, s);
    }), f$2(this, "isSubscribed", (i) => new Promise((s) => {
      s(this.topicMap.topics.includes(i));
    })), f$2(this, "isKnownTopic", (i) => new Promise((s) => {
      s(this.topicMap.topics.includes(i) || this.pending.has(i) || this.cached.some((n) => n.topic === i));
    })), f$2(this, "on", (i, s) => {
      this.events.on(i, s);
    }), f$2(this, "once", (i, s) => {
      this.events.once(i, s);
    }), f$2(this, "off", (i, s) => {
      this.events.off(i, s);
    }), f$2(this, "removeListener", (i, s) => {
      this.events.removeListener(i, s);
    }), f$2(this, "start", async () => {
      await this.onConnect();
    }), f$2(this, "stop", async () => {
      await this.onDisconnect();
    }), f$2(this, "restart", async () => {
      await this.restore(), await this.onRestart();
    }), f$2(this, "checkPending", async () => {
      if (this.pending.size === 0 && (!this.initialized || !this.relayer.connected)) return;
      const i = [];
      this.pending.forEach((s) => {
        i.push(s);
      }), await this.batchSubscribe(i);
    }), f$2(this, "registerEventListeners", () => {
      this.relayer.core.heartbeat.on(r$1.pulse, async () => {
        await this.checkPending();
      }), this.events.on($$3.created, async (i) => {
        const s = $$3.created;
        this.logger.info(`Emitting ${s}`), this.logger.debug({ type: "event", event: s, data: i }), await this.persist();
      }), this.events.on($$3.deleted, async (i) => {
        const s = $$3.deleted;
        this.logger.info(`Emitting ${s}`), this.logger.debug({ type: "event", event: s, data: i }), await this.persist();
      });
    }), this.relayer = e, this.logger = E$5(t, this.name), this.clientId = "";
  }
  get context() {
    return y$3(this.logger);
  }
  get storageKey() {
    return this.storagePrefix + this.version + this.relayer.core.customStoragePrefix + "//" + this.name;
  }
  get length() {
    return this.subscriptions.size;
  }
  get ids() {
    return Array.from(this.subscriptions.keys());
  }
  get values() {
    return Array.from(this.subscriptions.values());
  }
  get topics() {
    return this.topicMap.topics;
  }
  get hasAnyTopics() {
    return this.topicMap.topics.length > 0 || this.pending.size > 0 || this.cached.length > 0 || this.subscriptions.size > 0;
  }
  hasSubscription(e, t) {
    let i = false;
    try {
      i = this.getSubscription(e).topic === t;
    } catch {
    }
    return i;
  }
  reset() {
    this.cached = [], this.initialized = true;
  }
  onDisable() {
    this.values.length > 0 && (this.cached = this.values), this.subscriptions.clear(), this.topicMap.clear();
  }
  async unsubscribeByTopic(e, t) {
    const i = this.topicMap.get(e);
    await Promise.all(i.map(async (s) => await this.unsubscribeById(e, s, t)));
  }
  async unsubscribeById(e, t, i) {
    this.logger.debug("Unsubscribing Topic"), this.logger.trace({ type: "method", method: "unsubscribe", params: { topic: e, id: t, opts: i } });
    try {
      const s = Zc(i);
      await this.restartToComplete({ topic: e, id: t, relay: s }), await this.rpcUnsubscribe(e, t, s);
      const n = Nt$1("USER_DISCONNECTED", `${this.name}, ${e}`);
      await this.onUnsubscribe(e, t, n), this.logger.debug("Successfully Unsubscribed Topic"), this.logger.trace({ type: "method", method: "unsubscribe", params: { topic: e, id: t, opts: i } });
    } catch (s) {
      throw this.logger.debug("Failed to Unsubscribe Topic"), this.logger.error(s), s;
    }
  }
  async rpcSubscribe(e, t, i) {
    var s;
    (!i || i?.transportType === Q$2.relay) && await this.restartToComplete({ topic: e, id: e, relay: t });
    const n = { method: Yc(t.protocol).subscribe, params: { topic: e } };
    this.logger.debug("Outgoing Relay Payload"), this.logger.trace({ type: "payload", direction: "outgoing", request: n });
    const o = (s = i?.internal) == null ? void 0 : s.throwOnFailedPublish;
    try {
      const a = await this.getSubscriptionId(e);
      if (i?.transportType === Q$2.link_mode) return setTimeout(() => {
        (this.relayer.connected || this.relayer.connecting) && this.relayer.request(n).catch((l) => this.logger.warn(l));
      }, cjs$3.toMiliseconds(cjs$3.ONE_SECOND)), a;
      const c = new Promise(async (l) => {
        const d = (g) => {
          g.topic === e && (this.events.removeListener($$3.created, d), l(g.id));
        };
        this.events.on($$3.created, d);
        try {
          const g = await yi$1(new Promise((_, u) => {
            this.relayer.request(n).catch((b) => {
              this.logger.warn(b, b?.message), u(b);
            }).then(_);
          }), this.initialSubscribeTimeout, `Subscribing to ${e} failed, please try again`);
          this.events.removeListener($$3.created, d), l(g);
        } catch {
        }
      }), h = await yi$1(c, this.subscribeTimeout, `Subscribing to ${e} failed, please try again`);
      if (!h && o) throw new Error(`Subscribing to ${e} failed, please try again`);
      return h ? a : null;
    } catch (a) {
      if (this.logger.debug("Outgoing Relay Subscribe Payload stalled"), this.relayer.events.emit(C$2.connection_stalled), o) throw a;
    }
    return null;
  }
  async rpcBatchSubscribe(e) {
    if (!e.length) return;
    const t = e[0].relay, i = { method: Yc(t.protocol).batchSubscribe, params: { topics: e.map((s) => s.topic) } };
    this.logger.debug("Outgoing Relay Payload"), this.logger.trace({ type: "payload", direction: "outgoing", request: i });
    try {
      await await yi$1(new Promise((s) => {
        this.relayer.request(i).catch((n) => this.logger.warn(n)).then(s);
      }), this.subscribeTimeout, "rpcBatchSubscribe failed, please try again");
    } catch {
      this.relayer.events.emit(C$2.connection_stalled);
    }
  }
  async rpcBatchFetchMessages(e) {
    if (!e.length) return;
    const t = e[0].relay, i = { method: Yc(t.protocol).batchFetchMessages, params: { topics: e.map((n) => n.topic) } };
    this.logger.debug("Outgoing Relay Payload"), this.logger.trace({ type: "payload", direction: "outgoing", request: i });
    let s;
    try {
      s = await await yi$1(new Promise((n, o) => {
        this.relayer.request(i).catch((a) => {
          this.logger.warn(a), o(a);
        }).then(n);
      }), this.subscribeTimeout, "rpcBatchFetchMessages failed, please try again");
    } catch {
      this.relayer.events.emit(C$2.connection_stalled);
    }
    return s;
  }
  rpcUnsubscribe(e, t, i) {
    const s = { method: Yc(i.protocol).unsubscribe, params: { topic: e, id: t } };
    return this.logger.debug("Outgoing Relay Payload"), this.logger.trace({ type: "payload", direction: "outgoing", request: s }), this.relayer.request(s);
  }
  onSubscribe(e, t) {
    this.setSubscription(e, He$1(ge$1({}, t), { id: e })), this.pending.delete(t.topic);
  }
  onBatchSubscribe(e) {
    e.length && e.forEach((t) => {
      this.setSubscription(t.id, ge$1({}, t)), this.pending.delete(t.topic);
    });
  }
  async onUnsubscribe(e, t, i) {
    this.events.removeAllListeners(t), this.hasSubscription(t, e) && this.deleteSubscription(t, i), await this.relayer.messages.del(e);
  }
  async setRelayerSubscriptions(e) {
    await this.relayer.core.storage.setItem(this.storageKey, e);
  }
  async getRelayerSubscriptions() {
    return await this.relayer.core.storage.getItem(this.storageKey);
  }
  setSubscription(e, t) {
    this.logger.debug("Setting subscription"), this.logger.trace({ type: "method", method: "setSubscription", id: e, subscription: t }), this.addSubscription(e, t);
  }
  addSubscription(e, t) {
    this.subscriptions.set(e, ge$1({}, t)), this.topicMap.set(t.topic, e), this.events.emit($$3.created, t);
  }
  getSubscription(e) {
    this.logger.debug("Getting subscription"), this.logger.trace({ type: "method", method: "getSubscription", id: e });
    const t = this.subscriptions.get(e);
    if (!t) {
      const { message: i } = ht$2("NO_MATCHING_KEY", `${this.name}: ${e}`);
      throw new Error(i);
    }
    return t;
  }
  deleteSubscription(e, t) {
    this.logger.debug("Deleting subscription"), this.logger.trace({ type: "method", method: "deleteSubscription", id: e, reason: t });
    const i = this.getSubscription(e);
    this.subscriptions.delete(e), this.topicMap.delete(i.topic, e), this.events.emit($$3.deleted, He$1(ge$1({}, i), { reason: t }));
  }
  async persist() {
    await this.setRelayerSubscriptions(this.values), this.events.emit($$3.sync);
  }
  async onRestart() {
    if (this.cached.length) {
      const e = [...this.cached], t = Math.ceil(this.cached.length / this.batchSubscribeTopicsLimit);
      for (let i = 0; i < t; i++) {
        const s = e.splice(0, this.batchSubscribeTopicsLimit);
        await this.batchSubscribe(s);
      }
    }
    this.events.emit($$3.resubscribed);
  }
  async restore() {
    try {
      const e = await this.getRelayerSubscriptions();
      if (typeof e > "u" || !e.length) return;
      if (this.subscriptions.size) {
        const { message: t } = ht$2("RESTORE_WILL_OVERRIDE", this.name);
        throw this.logger.error(t), this.logger.error(`${this.name}: ${JSON.stringify(this.values)}`), new Error(t);
      }
      this.cached = e, this.logger.debug(`Successfully Restored subscriptions for ${this.name}`), this.logger.trace({ type: "method", method: "restore", subscriptions: this.values });
    } catch (e) {
      this.logger.debug(`Failed to Restore subscriptions for ${this.name}`), this.logger.error(e);
    }
  }
  async batchSubscribe(e) {
    e.length && (await this.rpcBatchSubscribe(e), this.onBatchSubscribe(await Promise.all(e.map(async (t) => He$1(ge$1({}, t), { id: await this.getSubscriptionId(t.topic) })))));
  }
  async batchFetchMessages(e) {
    if (!e.length) return;
    this.logger.trace(`Fetching batch messages for ${e.length} subscriptions`);
    const t = await this.rpcBatchFetchMessages(e);
    t && t.messages && (await Ni$1(cjs$3.toMiliseconds(cjs$3.ONE_SECOND)), await this.relayer.handleBatchMessageEvents(t.messages));
  }
  async onConnect() {
    await this.restart(), this.reset();
  }
  onDisconnect() {
    this.onDisable();
  }
  isInitialized() {
    if (!this.initialized) {
      const { message: e } = ht$2("NOT_INITIALIZED", this.name);
      throw new Error(e);
    }
  }
  async restartToComplete(e) {
    !this.relayer.connected && !this.relayer.connecting && (this.cached.push(e), await this.relayer.transportOpen());
  }
  async getClientId() {
    return this.clientId || (this.clientId = await this.relayer.core.crypto.getClientId()), this.clientId;
  }
  async getSubscriptionId(e) {
    return kc(e + await this.getClientId());
  }
}
var eo = Object.defineProperty, Ci = Object.getOwnPropertySymbols, to = Object.prototype.hasOwnProperty, io = Object.prototype.propertyIsEnumerable, Ye$1 = (r, e, t) => e in r ? eo(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, Pi = (r, e) => {
  for (var t in e || (e = {})) to.call(e, t) && Ye$1(r, t, e[t]);
  if (Ci) for (var t of Ci(e)) io.call(e, t) && Ye$1(r, t, e[t]);
  return r;
}, y$1 = (r, e, t) => Ye$1(r, typeof e != "symbol" ? e + "" : e, t);
class Si extends d$3 {
  constructor(e) {
    super(e), y$1(this, "protocol", "wc"), y$1(this, "version", 2), y$1(this, "core"), y$1(this, "logger"), y$1(this, "events", new eventsExports.EventEmitter()), y$1(this, "provider"), y$1(this, "messages"), y$1(this, "subscriber"), y$1(this, "publisher"), y$1(this, "name", $t), y$1(this, "transportExplicitlyClosed", false), y$1(this, "initialized", false), y$1(this, "connectionAttemptInProgress", false), y$1(this, "relayUrl"), y$1(this, "projectId"), y$1(this, "packageName"), y$1(this, "bundleId"), y$1(this, "hasExperiencedNetworkDisruption", false), y$1(this, "pingTimeout"), y$1(this, "heartBeatTimeout", cjs$3.toMiliseconds(cjs$3.THIRTY_SECONDS + cjs$3.FIVE_SECONDS)), y$1(this, "reconnectTimeout"), y$1(this, "connectPromise"), y$1(this, "reconnectInProgress", false), y$1(this, "requestsInFlight", []), y$1(this, "connectTimeout", cjs$3.toMiliseconds(cjs$3.ONE_SECOND * 15)), y$1(this, "request", async (t) => {
      var i, s;
      this.logger.debug("Publishing Request Payload");
      const n = t.id || getBigIntRpcId().toString();
      await this.toEstablishConnection();
      try {
        this.logger.trace({ id: n, method: t.method, topic: (i = t.params) == null ? void 0 : i.topic }, "relayer.request - publishing...");
        const o = `${n}:${((s = t.params) == null ? void 0 : s.tag) || ""}`;
        this.requestsInFlight.push(o);
        const a = await this.provider.request(t);
        return this.requestsInFlight = this.requestsInFlight.filter((c) => c !== o), a;
      } catch (o) {
        throw this.logger.debug(`Failed to Publish Request: ${n}`), o;
      }
    }), y$1(this, "resetPingTimeout", () => {
      _e$3() && (clearTimeout(this.pingTimeout), this.pingTimeout = setTimeout(() => {
        var t, i, s, n;
        try {
          this.logger.debug({}, "pingTimeout: Connection stalled, terminating..."), (n = (s = (i = (t = this.provider) == null ? void 0 : t.connection) == null ? void 0 : i.socket) == null ? void 0 : s.terminate) == null || n.call(s);
        } catch (o) {
          this.logger.warn(o, o?.message);
        }
      }, this.heartBeatTimeout));
    }), y$1(this, "onPayloadHandler", (t) => {
      this.onProviderPayload(t), this.resetPingTimeout();
    }), y$1(this, "onConnectHandler", () => {
      this.logger.warn({}, "Relayer connected 🛜"), this.startPingTimeout(), this.events.emit(C$2.connect);
    }), y$1(this, "onDisconnectHandler", () => {
      this.logger.warn({}, "Relayer disconnected 🛑"), this.requestsInFlight = [], this.onProviderDisconnect();
    }), y$1(this, "onProviderErrorHandler", (t) => {
      this.logger.fatal(`Fatal socket error: ${t.message}`), this.events.emit(C$2.error, t), this.logger.fatal("Fatal socket error received, closing transport"), this.transportClose();
    }), y$1(this, "registerProviderListeners", () => {
      this.provider.on(L$3.payload, this.onPayloadHandler), this.provider.on(L$3.connect, this.onConnectHandler), this.provider.on(L$3.disconnect, this.onDisconnectHandler), this.provider.on(L$3.error, this.onProviderErrorHandler);
    }), this.core = e.core, this.logger = typeof e.logger < "u" && typeof e.logger != "string" ? E$5(e.logger, this.name) : Ot$1(k$4({ level: e.logger || Nt })), this.messages = new _i(this.logger, e.core), this.subscriber = new Ti(this, this.logger), this.publisher = new qn(this, this.logger), this.relayUrl = e?.relayUrl || Ue$2, this.projectId = e.projectId, ei$1() ? this.packageName = ri$1() : ni$1() && (this.bundleId = ri$1()), this.provider = {};
  }
  async init() {
    if (this.logger.trace("Initialized"), this.registerEventListeners(), await Promise.all([this.messages.init(), this.subscriber.init()]), this.initialized = true, this.subscriber.hasAnyTopics) try {
      await this.transportOpen();
    } catch (e) {
      this.logger.warn(e, e?.message);
    }
  }
  get context() {
    return y$3(this.logger);
  }
  get connected() {
    var e, t, i;
    return ((i = (t = (e = this.provider) == null ? void 0 : e.connection) == null ? void 0 : t.socket) == null ? void 0 : i.readyState) === 1 || false;
  }
  get connecting() {
    var e, t, i;
    return ((i = (t = (e = this.provider) == null ? void 0 : e.connection) == null ? void 0 : t.socket) == null ? void 0 : i.readyState) === 0 || this.connectPromise !== void 0 || false;
  }
  async publish(e, t, i) {
    this.isInitialized(), await this.publisher.publish(e, t, i), await this.recordMessageEvent({ topic: e, message: t, publishedAt: Date.now(), transportType: Q$2.relay }, le$1.outbound);
  }
  async subscribe(e, t) {
    var i, s, n;
    this.isInitialized(), (!(t != null && t.transportType) || t?.transportType === "relay") && await this.toEstablishConnection();
    const o = typeof ((i = t?.internal) == null ? void 0 : i.throwOnFailedPublish) > "u" ? true : (s = t?.internal) == null ? void 0 : s.throwOnFailedPublish;
    let a = ((n = this.subscriber.topicMap.get(e)) == null ? void 0 : n[0]) || "", c;
    const h = (l) => {
      l.topic === e && (this.subscriber.off($$3.created, h), c());
    };
    return await Promise.all([new Promise((l) => {
      c = l, this.subscriber.on($$3.created, h);
    }), new Promise(async (l, d) => {
      a = await this.subscriber.subscribe(e, Pi({ internal: { throwOnFailedPublish: o } }, t)).catch((g) => {
        o && d(g);
      }) || a, l();
    })]), a;
  }
  async unsubscribe(e, t) {
    this.isInitialized(), await this.subscriber.unsubscribe(e, t);
  }
  on(e, t) {
    this.events.on(e, t);
  }
  once(e, t) {
    this.events.once(e, t);
  }
  off(e, t) {
    this.events.off(e, t);
  }
  removeListener(e, t) {
    this.events.removeListener(e, t);
  }
  async transportDisconnect() {
    this.provider.disconnect && (this.hasExperiencedNetworkDisruption || this.connected) ? await yi$1(this.provider.disconnect(), 2e3, "provider.disconnect()").catch(() => this.onProviderDisconnect()) : this.onProviderDisconnect();
  }
  async transportClose() {
    this.transportExplicitlyClosed = true, await this.transportDisconnect();
  }
  async transportOpen(e) {
    if (!this.subscriber.hasAnyTopics) {
      this.logger.warn("Starting WS connection skipped because the client has no topics to work with.");
      return;
    }
    if (this.connectPromise ? (this.logger.debug({}, "Waiting for existing connection attempt to resolve..."), await this.connectPromise, this.logger.debug({}, "Existing connection attempt resolved")) : (this.connectPromise = new Promise(async (t, i) => {
      await this.connect(e).then(t).catch(i).finally(() => {
        this.connectPromise = void 0;
      });
    }), await this.connectPromise), !this.connected) throw new Error(`Couldn't establish socket connection to the relay server: ${this.relayUrl}`);
  }
  async restartTransport(e) {
    this.logger.debug({}, "Restarting transport..."), !this.connectionAttemptInProgress && (this.relayUrl = e || this.relayUrl, await this.confirmOnlineStateOrThrow(), await this.transportClose(), await this.transportOpen());
  }
  async confirmOnlineStateOrThrow() {
    if (!await Na()) throw new Error("No internet connection detected. Please restart your network and try again.");
  }
  async handleBatchMessageEvents(e) {
    if (e?.length === 0) {
      this.logger.trace("Batch message events is empty. Ignoring...");
      return;
    }
    const t = e.sort((i, s) => i.publishedAt - s.publishedAt);
    this.logger.debug(`Batch of ${t.length} message events sorted`);
    for (const i of t) try {
      await this.onMessageEvent(i);
    } catch (s) {
      this.logger.warn(s, "Error while processing batch message event: " + s?.message);
    }
    this.logger.trace(`Batch of ${t.length} message events processed`);
  }
  async onLinkMessageEvent(e, t) {
    const { topic: i } = e;
    if (!t.sessionExists) {
      const s = Ei$1(cjs$3.FIVE_MINUTES), n = { topic: i, expiry: s, relay: { protocol: "irn" }, active: false };
      await this.core.pairing.pairings.set(i, n);
    }
    this.events.emit(C$2.message, e), await this.recordMessageEvent(e, le$1.inbound);
  }
  async connect(e) {
    await this.confirmOnlineStateOrThrow(), e && e !== this.relayUrl && (this.relayUrl = e, await this.transportDisconnect()), this.connectionAttemptInProgress = true, this.transportExplicitlyClosed = false;
    let t = 1;
    for (; t < 6; ) {
      try {
        if (this.transportExplicitlyClosed) break;
        this.logger.debug({}, `Connecting to ${this.relayUrl}, attempt: ${t}...`), await this.createProvider(), await new Promise(async (i, s) => {
          const n = () => {
            s(new Error("Connection interrupted while trying to subscribe"));
          };
          this.provider.once(L$3.disconnect, n), await yi$1(new Promise((o, a) => {
            this.provider.connect().then(o).catch(a);
          }), this.connectTimeout, `Socket stalled when trying to connect to ${this.relayUrl}`).catch((o) => {
            s(o);
          }).finally(() => {
            this.provider.off(L$3.disconnect, n), clearTimeout(this.reconnectTimeout);
          }), await new Promise(async (o, a) => {
            const c = () => {
              a(new Error("Connection interrupted while trying to subscribe"));
            };
            this.provider.once(L$3.disconnect, c), await this.subscriber.start().then(o).catch(a).finally(() => {
              this.provider.off(L$3.disconnect, c);
            });
          }), this.hasExperiencedNetworkDisruption = false, i();
        });
      } catch (i) {
        await this.subscriber.stop();
        const s = i;
        this.logger.warn({}, s.message), this.hasExperiencedNetworkDisruption = true;
      } finally {
        this.connectionAttemptInProgress = false;
      }
      if (this.connected) {
        this.logger.debug({}, `Connected to ${this.relayUrl} successfully on attempt: ${t}`);
        break;
      }
      await new Promise((i) => setTimeout(i, cjs$3.toMiliseconds(t * 1))), t++;
    }
  }
  startPingTimeout() {
    var e, t, i, s, n;
    if (_e$3()) try {
      (t = (e = this.provider) == null ? void 0 : e.connection) != null && t.socket && ((n = (s = (i = this.provider) == null ? void 0 : i.connection) == null ? void 0 : s.socket) == null || n.on("ping", () => {
        this.resetPingTimeout();
      })), this.resetPingTimeout();
    } catch (o) {
      this.logger.warn(o, o?.message);
    }
  }
  async createProvider() {
    this.provider.connection && this.unregisterProviderListeners();
    const e = await this.core.crypto.signJWT(this.relayUrl);
    this.provider = new o$1(new f$3(si$1({ sdkVersion: _e$2, protocol: this.protocol, version: this.version, relayUrl: this.relayUrl, projectId: this.projectId, auth: e, useOnCloseEvent: true, bundleId: this.bundleId, packageName: this.packageName }))), this.registerProviderListeners();
  }
  async recordMessageEvent(e, t) {
    const { topic: i, message: s } = e;
    await this.messages.set(i, s, t);
  }
  async shouldIgnoreMessageEvent(e) {
    const { topic: t, message: i } = e;
    if (!i || i.length === 0) return this.logger.warn(`Ignoring invalid/empty message: ${i}`), true;
    if (!await this.subscriber.isKnownTopic(t)) return this.logger.warn(`Ignoring message for unknown topic ${t}`), true;
    const s = this.messages.has(t, i);
    return s && this.logger.warn(`Ignoring duplicate message: ${i}`), s;
  }
  async onProviderPayload(e) {
    if (this.logger.debug("Incoming Relay Payload"), this.logger.trace({ type: "payload", direction: "incoming", payload: e }), isJsonRpcRequest(e)) {
      if (!e.method.endsWith(zt$1)) return;
      const t = e.params, { topic: i, message: s, publishedAt: n, attestation: o } = t.data, a = { topic: i, message: s, publishedAt: n, transportType: Q$2.relay, attestation: o };
      this.logger.debug("Emitting Relayer Payload"), this.logger.trace(Pi({ type: "event", event: t.id }, a)), this.events.emit(t.id, a), await this.acknowledgePayload(e), await this.onMessageEvent(a);
    } else isJsonRpcResponse(e) && this.events.emit(C$2.message_ack, e);
  }
  async onMessageEvent(e) {
    await this.shouldIgnoreMessageEvent(e) || (await this.recordMessageEvent(e, le$1.inbound), this.events.emit(C$2.message, e));
  }
  async acknowledgePayload(e) {
    const t = formatJsonRpcResult(e.id, true);
    await this.provider.connection.send(t);
  }
  unregisterProviderListeners() {
    this.provider.off(L$3.payload, this.onPayloadHandler), this.provider.off(L$3.connect, this.onConnectHandler), this.provider.off(L$3.disconnect, this.onDisconnectHandler), this.provider.off(L$3.error, this.onProviderErrorHandler), clearTimeout(this.pingTimeout);
  }
  async registerEventListeners() {
    let e = await Na();
    Ua(async (t) => {
      e !== t && (e = t, t ? await this.transportOpen().catch((i) => this.logger.error(i, i?.message)) : (this.hasExperiencedNetworkDisruption = true, await this.transportDisconnect(), this.transportExplicitlyClosed = false));
    }), this.core.heartbeat.on(r$1.pulse, async () => {
      if (!this.transportExplicitlyClosed && !this.connected && Ta()) try {
        await this.confirmOnlineStateOrThrow(), await this.transportOpen();
      } catch (t) {
        this.logger.warn(t, t?.message);
      }
    });
  }
  async onProviderDisconnect() {
    clearTimeout(this.pingTimeout), this.events.emit(C$2.disconnect), this.connectionAttemptInProgress = false, !this.reconnectInProgress && (this.reconnectInProgress = true, await this.subscriber.stop(), this.subscriber.hasAnyTopics && (this.transportExplicitlyClosed || (this.reconnectTimeout = setTimeout(async () => {
      await this.transportOpen().catch((e) => this.logger.error(e, e?.message)), this.reconnectTimeout = void 0, this.reconnectInProgress = false;
    }, cjs$3.toMiliseconds(Lt$1)))));
  }
  isInitialized() {
    if (!this.initialized) {
      const { message: e } = ht$2("NOT_INITIALIZED", this.name);
      throw new Error(e);
    }
  }
  async toEstablishConnection() {
    if (await this.confirmOnlineStateOrThrow(), !this.connected) {
      if (this.connectPromise) {
        await this.connectPromise;
        return;
      }
      await this.connect();
    }
  }
}
function so() {
}
function Oi(r) {
  if (!r || typeof r != "object") return false;
  const e = Object.getPrototypeOf(r);
  return e === null || e === Object.prototype || Object.getPrototypeOf(e) === null ? Object.prototype.toString.call(r) === "[object Object]" : false;
}
function Ri(r) {
  return Object.getOwnPropertySymbols(r).filter((e) => Object.prototype.propertyIsEnumerable.call(r, e));
}
function Ai(r) {
  return r == null ? r === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(r);
}
const ro = "[object RegExp]", no = "[object String]", oo = "[object Number]", ao = "[object Boolean]", xi = "[object Arguments]", co = "[object Symbol]", ho = "[object Date]", lo = "[object Map]", uo = "[object Set]", go = "[object Array]", po = "[object Function]", yo = "[object ArrayBuffer]", Je$1 = "[object Object]", bo = "[object Error]", mo = "[object DataView]", fo = "[object Uint8Array]", Do = "[object Uint8ClampedArray]", vo = "[object Uint16Array]", wo = "[object Uint32Array]", _o = "[object BigUint64Array]", Eo = "[object Int8Array]", Io = "[object Int16Array]", To = "[object Int32Array]", Co = "[object BigInt64Array]", Po = "[object Float32Array]", So = "[object Float64Array]";
function Oo(r, e) {
  return r === e || Number.isNaN(r) && Number.isNaN(e);
}
function Ro(r, e, t) {
  return pe$1(r, e, void 0, void 0, void 0, void 0, t);
}
function pe$1(r, e, t, i, s, n, o) {
  const a = o(r, e, t, i, s, n);
  if (a !== void 0) return a;
  if (typeof r == typeof e) switch (typeof r) {
    case "bigint":
    case "string":
    case "boolean":
    case "symbol":
    case "undefined":
      return r === e;
    case "number":
      return r === e || Object.is(r, e);
    case "function":
      return r === e;
    case "object":
      return ye$1(r, e, n, o);
  }
  return ye$1(r, e, n, o);
}
function ye$1(r, e, t, i) {
  if (Object.is(r, e)) return true;
  let s = Ai(r), n = Ai(e);
  if (s === xi && (s = Je$1), n === xi && (n = Je$1), s !== n) return false;
  switch (s) {
    case no:
      return r.toString() === e.toString();
    case oo: {
      const c = r.valueOf(), h = e.valueOf();
      return Oo(c, h);
    }
    case ao:
    case ho:
    case co:
      return Object.is(r.valueOf(), e.valueOf());
    case ro:
      return r.source === e.source && r.flags === e.flags;
    case po:
      return r === e;
  }
  t = t ?? /* @__PURE__ */ new Map();
  const o = t.get(r), a = t.get(e);
  if (o != null && a != null) return o === e;
  t.set(r, e), t.set(e, r);
  try {
    switch (s) {
      case lo: {
        if (r.size !== e.size) return false;
        for (const [c, h] of r.entries()) if (!e.has(c) || !pe$1(h, e.get(c), c, r, e, t, i)) return false;
        return true;
      }
      case uo: {
        if (r.size !== e.size) return false;
        const c = Array.from(r.values()), h = Array.from(e.values());
        for (let l = 0; l < c.length; l++) {
          const d = c[l], g = h.findIndex((_) => pe$1(d, _, void 0, r, e, t, i));
          if (g === -1) return false;
          h.splice(g, 1);
        }
        return true;
      }
      case go:
      case fo:
      case Do:
      case vo:
      case wo:
      case _o:
      case Eo:
      case Io:
      case To:
      case Co:
      case Po:
      case So: {
        if (typeof Buffer < "u" && Buffer.isBuffer(r) !== Buffer.isBuffer(e) || r.length !== e.length) return false;
        for (let c = 0; c < r.length; c++) if (!pe$1(r[c], e[c], c, r, e, t, i)) return false;
        return true;
      }
      case yo:
        return r.byteLength !== e.byteLength ? false : ye$1(new Uint8Array(r), new Uint8Array(e), t, i);
      case mo:
        return r.byteLength !== e.byteLength || r.byteOffset !== e.byteOffset ? false : ye$1(new Uint8Array(r), new Uint8Array(e), t, i);
      case bo:
        return r.name === e.name && r.message === e.message;
      case Je$1: {
        if (!(ye$1(r.constructor, e.constructor, t, i) || Oi(r) && Oi(e))) return false;
        const h = [...Object.keys(r), ...Ri(r)], l = [...Object.keys(e), ...Ri(e)];
        if (h.length !== l.length) return false;
        for (let d = 0; d < h.length; d++) {
          const g = h[d], _ = r[g];
          if (!Object.hasOwn(e, g)) return false;
          const u = e[g];
          if (!pe$1(_, u, g, r, e, t, i)) return false;
        }
        return true;
      }
      default:
        return false;
    }
  } finally {
    t.delete(r), t.delete(e);
  }
}
function Ao(r, e) {
  return Ro(r, e, so);
}
var xo = Object.defineProperty, Ni = Object.getOwnPropertySymbols, No = Object.prototype.hasOwnProperty, $o = Object.prototype.propertyIsEnumerable, Xe$1 = (r, e, t) => e in r ? xo(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, $i = (r, e) => {
  for (var t in e || (e = {})) No.call(e, t) && Xe$1(r, t, e[t]);
  if (Ni) for (var t of Ni(e)) $o.call(e, t) && Xe$1(r, t, e[t]);
  return r;
}, z$1 = (r, e, t) => Xe$1(r, typeof e != "symbol" ? e + "" : e, t);
class zi extends f$4 {
  constructor(e, t, i, s = B$2, n = void 0) {
    super(e, t, i, s), this.core = e, this.logger = t, this.name = i, z$1(this, "map", /* @__PURE__ */ new Map()), z$1(this, "version", kt$1), z$1(this, "cached", []), z$1(this, "initialized", false), z$1(this, "getKey"), z$1(this, "storagePrefix", B$2), z$1(this, "recentlyDeleted", []), z$1(this, "recentlyDeletedLimit", 200), z$1(this, "init", async () => {
      this.initialized || (this.logger.trace("Initialized"), await this.restore(), this.cached.forEach((o) => {
        this.getKey && o !== null && !Et$2(o) ? this.map.set(this.getKey(o), o) : la(o) ? this.map.set(o.id, o) : da(o) && this.map.set(o.topic, o);
      }), this.cached = [], this.initialized = true);
    }), z$1(this, "set", async (o, a) => {
      this.isInitialized(), this.map.has(o) ? await this.update(o, a) : (this.logger.debug("Setting value"), this.logger.trace({ type: "method", method: "set", key: o, value: a }), this.map.set(o, a), await this.persist());
    }), z$1(this, "get", (o) => (this.isInitialized(), this.logger.debug("Getting value"), this.logger.trace({ type: "method", method: "get", key: o }), this.getData(o))), z$1(this, "getAll", (o) => (this.isInitialized(), o ? this.values.filter((a) => Object.keys(o).every((c) => Ao(a[c], o[c]))) : this.values)), z$1(this, "update", async (o, a) => {
      this.isInitialized(), this.logger.debug("Updating value"), this.logger.trace({ type: "method", method: "update", key: o, update: a });
      const c = $i($i({}, this.getData(o)), a);
      this.map.set(o, c), await this.persist();
    }), z$1(this, "delete", async (o, a) => {
      this.isInitialized(), this.map.has(o) && (this.logger.debug("Deleting value"), this.logger.trace({ type: "method", method: "delete", key: o, reason: a }), this.map.delete(o), this.addToRecentlyDeleted(o), await this.persist());
    }), this.logger = E$5(t, this.name), this.storagePrefix = s, this.getKey = n;
  }
  get context() {
    return y$3(this.logger);
  }
  get storageKey() {
    return this.storagePrefix + this.version + this.core.customStoragePrefix + "//" + this.name;
  }
  get length() {
    return this.map.size;
  }
  get keys() {
    return Array.from(this.map.keys());
  }
  get values() {
    return Array.from(this.map.values());
  }
  addToRecentlyDeleted(e) {
    this.recentlyDeleted.push(e), this.recentlyDeleted.length >= this.recentlyDeletedLimit && this.recentlyDeleted.splice(0, this.recentlyDeletedLimit / 2);
  }
  async setDataStore(e) {
    await this.core.storage.setItem(this.storageKey, e);
  }
  async getDataStore() {
    return await this.core.storage.getItem(this.storageKey);
  }
  getData(e) {
    const t = this.map.get(e);
    if (!t) {
      if (this.recentlyDeleted.includes(e)) {
        const { message: s } = ht$2("MISSING_OR_INVALID", `Record was recently deleted - ${this.name}: ${e}`);
        throw this.logger.error(s), new Error(s);
      }
      const { message: i } = ht$2("NO_MATCHING_KEY", `${this.name}: ${e}`);
      throw this.logger.error(i), new Error(i);
    }
    return t;
  }
  async persist() {
    await this.setDataStore(this.values);
  }
  async restore() {
    try {
      const e = await this.getDataStore();
      if (typeof e > "u" || !e.length) return;
      if (this.map.size) {
        const { message: t } = ht$2("RESTORE_WILL_OVERRIDE", this.name);
        throw this.logger.error(t), new Error(t);
      }
      this.cached = e, this.logger.debug(`Successfully Restored value for ${this.name}`), this.logger.trace({ type: "method", method: "restore", value: this.values });
    } catch (e) {
      this.logger.debug(`Failed to Restore value for ${this.name}`), this.logger.error(e);
    }
  }
  isInitialized() {
    if (!this.initialized) {
      const { message: e } = ht$2("NOT_INITIALIZED", this.name);
      throw new Error(e);
    }
  }
}
var zo = Object.defineProperty, Lo = (r, e, t) => e in r ? zo(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, p$2 = (r, e, t) => Lo(r, typeof e != "symbol" ? e + "" : e, t);
class Li {
  constructor(e, t) {
    this.core = e, this.logger = t, p$2(this, "name", Mt$1), p$2(this, "version", Kt$1), p$2(this, "events", new Nt$3()), p$2(this, "pairings"), p$2(this, "initialized", false), p$2(this, "storagePrefix", B$2), p$2(this, "ignoredPayloadTypes", [Ft$2]), p$2(this, "registeredMethods", []), p$2(this, "init", async () => {
      this.initialized || (await this.pairings.init(), await this.cleanup(), this.registerRelayerEvents(), this.registerExpirerEvents(), this.initialized = true, this.logger.trace("Initialized"));
    }), p$2(this, "register", ({ methods: i }) => {
      this.isInitialized(), this.registeredMethods = [.../* @__PURE__ */ new Set([...this.registeredMethods, ...i])];
    }), p$2(this, "create", async (i) => {
      this.isInitialized();
      const s = jc(), n = await this.core.crypto.setSymKey(s), o = Ei$1(cjs$3.FIVE_MINUTES), a = { protocol: xt$1 }, c = { topic: n, expiry: o, relay: a, active: false, methods: i?.methods }, h = Wc({ protocol: this.core.protocol, version: this.core.version, topic: n, symKey: s, relay: a, expiryTimestamp: o, methods: i?.methods });
      return this.events.emit(re$1.create, c), this.core.expirer.set(n, o), await this.pairings.set(n, c), await this.core.relayer.subscribe(n, { transportType: i?.transportType }), { topic: n, uri: h };
    }), p$2(this, "pair", async (i) => {
      this.isInitialized();
      const s = this.core.eventClient.createEvent({ properties: { topic: i?.uri, trace: [G$1.pairing_started] } });
      this.isValidPair(i, s);
      const { topic: n, symKey: o, relay: a, expiryTimestamp: c, methods: h } = Gc(i.uri);
      s.props.properties.topic = n, s.addTrace(G$1.pairing_uri_validation_success), s.addTrace(G$1.pairing_uri_not_expired);
      let l;
      if (this.pairings.keys.includes(n)) {
        if (l = this.pairings.get(n), s.addTrace(G$1.existing_pairing), l.active) throw s.setError(Y$2.active_pairing_already_exists), new Error(`Pairing already exists: ${n}. Please try again with a new connection URI.`);
        s.addTrace(G$1.pairing_not_expired);
      }
      const d = c || Ei$1(cjs$3.FIVE_MINUTES), g = { topic: n, relay: a, expiry: d, active: false, methods: h };
      this.core.expirer.set(n, d), await this.pairings.set(n, g), s.addTrace(G$1.store_new_pairing), i.activatePairing && await this.activate({ topic: n }), this.events.emit(re$1.create, g), s.addTrace(G$1.emit_inactive_pairing), this.core.crypto.keychain.has(n) || await this.core.crypto.setSymKey(o, n), s.addTrace(G$1.subscribing_pairing_topic);
      try {
        await this.core.relayer.confirmOnlineStateOrThrow();
      } catch {
        s.setError(Y$2.no_internet_connection);
      }
      try {
        await this.core.relayer.subscribe(n, { relay: a });
      } catch (_) {
        throw s.setError(Y$2.subscribe_pairing_topic_failure), _;
      }
      return s.addTrace(G$1.subscribe_pairing_topic_success), g;
    }), p$2(this, "activate", async ({ topic: i }) => {
      this.isInitialized();
      const s = Ei$1(cjs$3.FIVE_MINUTES);
      this.core.expirer.set(i, s), await this.pairings.update(i, { active: true, expiry: s });
    }), p$2(this, "ping", async (i) => {
      this.isInitialized(), await this.isValidPing(i), this.logger.warn("ping() is deprecated and will be removed in the next major release.");
      const { topic: s } = i;
      if (this.pairings.keys.includes(s)) {
        const n = await this.sendRequest(s, "wc_pairingPing", {}), { done: o, resolve: a, reject: c } = gi$1();
        this.events.once(xi$1("pairing_ping", n), ({ error: h }) => {
          h ? c(h) : a();
        }), await o();
      }
    }), p$2(this, "updateExpiry", async ({ topic: i, expiry: s }) => {
      this.isInitialized(), await this.pairings.update(i, { expiry: s });
    }), p$2(this, "updateMetadata", async ({ topic: i, metadata: s }) => {
      this.isInitialized(), await this.pairings.update(i, { peerMetadata: s });
    }), p$2(this, "getPairings", () => (this.isInitialized(), this.pairings.values)), p$2(this, "disconnect", async (i) => {
      this.isInitialized(), await this.isValidDisconnect(i);
      const { topic: s } = i;
      this.pairings.keys.includes(s) && (await this.sendRequest(s, "wc_pairingDelete", Nt$1("USER_DISCONNECTED")), await this.deletePairing(s));
    }), p$2(this, "formatUriFromPairing", (i) => {
      this.isInitialized();
      const { topic: s, relay: n, expiry: o, methods: a } = i, c = this.core.crypto.keychain.get(s);
      return Wc({ protocol: this.core.protocol, version: this.core.version, topic: s, symKey: c, relay: n, expiryTimestamp: o, methods: a });
    }), p$2(this, "sendRequest", async (i, s, n) => {
      const o = formatJsonRpcRequest(s, n), a = await this.core.crypto.encode(i, o), c = se$1[s].req;
      return this.core.history.set(i, o), this.core.relayer.publish(i, a, c), o.id;
    }), p$2(this, "sendResult", async (i, s, n) => {
      const o = formatJsonRpcResult(i, n), a = await this.core.crypto.encode(s, o), c = (await this.core.history.get(s, i)).request.method, h = se$1[c].res;
      await this.core.relayer.publish(s, a, h), await this.core.history.resolve(o);
    }), p$2(this, "sendError", async (i, s, n) => {
      const o = formatJsonRpcError(i, n), a = await this.core.crypto.encode(s, o), c = (await this.core.history.get(s, i)).request.method, h = se$1[c] ? se$1[c].res : se$1.unregistered_method.res;
      await this.core.relayer.publish(s, a, h), await this.core.history.resolve(o);
    }), p$2(this, "deletePairing", async (i, s) => {
      await this.core.relayer.unsubscribe(i), await Promise.all([this.pairings.delete(i, Nt$1("USER_DISCONNECTED")), this.core.crypto.deleteSymKey(i), s ? Promise.resolve() : this.core.expirer.del(i)]);
    }), p$2(this, "cleanup", async () => {
      const i = this.pairings.getAll().filter((s) => vi$1(s.expiry));
      await Promise.all(i.map((s) => this.deletePairing(s.topic)));
    }), p$2(this, "onRelayEventRequest", async (i) => {
      const { topic: s, payload: n } = i;
      switch (n.method) {
        case "wc_pairingPing":
          return await this.onPairingPingRequest(s, n);
        case "wc_pairingDelete":
          return await this.onPairingDeleteRequest(s, n);
        default:
          return await this.onUnknownRpcMethodRequest(s, n);
      }
    }), p$2(this, "onRelayEventResponse", async (i) => {
      const { topic: s, payload: n } = i, o = (await this.core.history.get(s, n.id)).request.method;
      switch (o) {
        case "wc_pairingPing":
          return this.onPairingPingResponse(s, n);
        default:
          return this.onUnknownRpcMethodResponse(o);
      }
    }), p$2(this, "onPairingPingRequest", async (i, s) => {
      const { id: n } = s;
      try {
        this.isValidPing({ topic: i }), await this.sendResult(n, i, true), this.events.emit(re$1.ping, { id: n, topic: i });
      } catch (o) {
        await this.sendError(n, i, o), this.logger.error(o);
      }
    }), p$2(this, "onPairingPingResponse", (i, s) => {
      const { id: n } = s;
      setTimeout(() => {
        isJsonRpcResult(s) ? this.events.emit(xi$1("pairing_ping", n), {}) : isJsonRpcError(s) && this.events.emit(xi$1("pairing_ping", n), { error: s.error });
      }, 500);
    }), p$2(this, "onPairingDeleteRequest", async (i, s) => {
      const { id: n } = s;
      try {
        this.isValidDisconnect({ topic: i }), await this.deletePairing(i), this.events.emit(re$1.delete, { id: n, topic: i });
      } catch (o) {
        await this.sendError(n, i, o), this.logger.error(o);
      }
    }), p$2(this, "onUnknownRpcMethodRequest", async (i, s) => {
      const { id: n, method: o } = s;
      try {
        if (this.registeredMethods.includes(o)) return;
        const a = Nt$1("WC_METHOD_UNSUPPORTED", o);
        await this.sendError(n, i, a), this.logger.error(a);
      } catch (a) {
        await this.sendError(n, i, a), this.logger.error(a);
      }
    }), p$2(this, "onUnknownRpcMethodResponse", (i) => {
      this.registeredMethods.includes(i) || this.logger.error(Nt$1("WC_METHOD_UNSUPPORTED", i));
    }), p$2(this, "isValidPair", (i, s) => {
      var n;
      if (!ma(i)) {
        const { message: a } = ht$2("MISSING_OR_INVALID", `pair() params: ${i}`);
        throw s.setError(Y$2.malformed_pairing_uri), new Error(a);
      }
      if (!fa(i.uri)) {
        const { message: a } = ht$2("MISSING_OR_INVALID", `pair() uri: ${i.uri}`);
        throw s.setError(Y$2.malformed_pairing_uri), new Error(a);
      }
      const o = Gc(i?.uri);
      if (!((n = o?.relay) != null && n.protocol)) {
        const { message: a } = ht$2("MISSING_OR_INVALID", "pair() uri#relay-protocol");
        throw s.setError(Y$2.malformed_pairing_uri), new Error(a);
      }
      if (!(o != null && o.symKey)) {
        const { message: a } = ht$2("MISSING_OR_INVALID", "pair() uri#symKey");
        throw s.setError(Y$2.malformed_pairing_uri), new Error(a);
      }
      if (o != null && o.expiryTimestamp && cjs$3.toMiliseconds(o?.expiryTimestamp) < Date.now()) {
        s.setError(Y$2.pairing_expired);
        const { message: a } = ht$2("EXPIRED", "pair() URI has expired. Please try again with a new connection URI.");
        throw new Error(a);
      }
    }), p$2(this, "isValidPing", async (i) => {
      if (!ma(i)) {
        const { message: n } = ht$2("MISSING_OR_INVALID", `ping() params: ${i}`);
        throw new Error(n);
      }
      const { topic: s } = i;
      await this.isValidPairingTopic(s);
    }), p$2(this, "isValidDisconnect", async (i) => {
      if (!ma(i)) {
        const { message: n } = ht$2("MISSING_OR_INVALID", `disconnect() params: ${i}`);
        throw new Error(n);
      }
      const { topic: s } = i;
      await this.isValidPairingTopic(s);
    }), p$2(this, "isValidPairingTopic", async (i) => {
      if (!nt$2(i, false)) {
        const { message: s } = ht$2("MISSING_OR_INVALID", `pairing topic should be a string: ${i}`);
        throw new Error(s);
      }
      if (!this.pairings.keys.includes(i)) {
        const { message: s } = ht$2("NO_MATCHING_KEY", `pairing topic doesn't exist: ${i}`);
        throw new Error(s);
      }
      if (vi$1(this.pairings.get(i).expiry)) {
        await this.deletePairing(i);
        const { message: s } = ht$2("EXPIRED", `pairing topic: ${i}`);
        throw new Error(s);
      }
    }), this.core = e, this.logger = E$5(t, this.name), this.pairings = new zi(this.core, this.logger, this.name, this.storagePrefix);
  }
  get context() {
    return y$3(this.logger);
  }
  isInitialized() {
    if (!this.initialized) {
      const { message: e } = ht$2("NOT_INITIALIZED", this.name);
      throw new Error(e);
    }
  }
  registerRelayerEvents() {
    this.core.relayer.on(C$2.message, async (e) => {
      const { topic: t, message: i, transportType: s } = e;
      if (this.pairings.keys.includes(t) && s !== Q$2.link_mode && !this.ignoredPayloadTypes.includes(this.core.crypto.getPayloadType(i))) try {
        const n = await this.core.crypto.decode(t, i);
        isJsonRpcRequest(n) ? (this.core.history.set(t, n), await this.onRelayEventRequest({ topic: t, payload: n })) : isJsonRpcResponse(n) && (await this.core.history.resolve(n), await this.onRelayEventResponse({ topic: t, payload: n }), this.core.history.delete(t, n.id)), await this.core.relayer.messages.ack(t, i);
      } catch (n) {
        this.logger.error(n);
      }
    });
  }
  registerExpirerEvents() {
    this.core.expirer.on(M$2.expired, async (e) => {
      const { topic: t } = bi$1(e.target);
      t && this.pairings.keys.includes(t) && (await this.deletePairing(t, true), this.events.emit(re$1.expire, { topic: t }));
    });
  }
}
var ko = Object.defineProperty, jo = (r, e, t) => e in r ? ko(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, O$2 = (r, e, t) => jo(r, typeof e != "symbol" ? e + "" : e, t);
class ki extends I$2 {
  constructor(e, t) {
    super(e, t), this.core = e, this.logger = t, O$2(this, "records", /* @__PURE__ */ new Map()), O$2(this, "events", new eventsExports.EventEmitter()), O$2(this, "name", Bt$1), O$2(this, "version", Vt$1), O$2(this, "cached", []), O$2(this, "initialized", false), O$2(this, "storagePrefix", B$2), O$2(this, "init", async () => {
      this.initialized || (this.logger.trace("Initialized"), await this.restore(), this.cached.forEach((i) => this.records.set(i.id, i)), this.cached = [], this.registerEventListeners(), this.initialized = true);
    }), O$2(this, "set", (i, s, n) => {
      if (this.isInitialized(), this.logger.debug("Setting JSON-RPC request history record"), this.logger.trace({ type: "method", method: "set", topic: i, request: s, chainId: n }), this.records.has(s.id)) return;
      const o = { id: s.id, topic: i, request: { method: s.method, params: s.params || null }, chainId: n, expiry: Ei$1(cjs$3.THIRTY_DAYS) };
      this.records.set(o.id, o), this.persist(), this.events.emit(F$2.created, o);
    }), O$2(this, "resolve", async (i) => {
      if (this.isInitialized(), this.logger.debug("Updating JSON-RPC response history record"), this.logger.trace({ type: "method", method: "update", response: i }), !this.records.has(i.id)) return;
      const s = await this.getRecord(i.id);
      typeof s.response > "u" && (s.response = isJsonRpcError(i) ? { error: i.error } : { result: i.result }, this.records.set(s.id, s), this.persist(), this.events.emit(F$2.updated, s));
    }), O$2(this, "get", async (i, s) => (this.isInitialized(), this.logger.debug("Getting record"), this.logger.trace({ type: "method", method: "get", topic: i, id: s }), await this.getRecord(s))), O$2(this, "delete", (i, s) => {
      this.isInitialized(), this.logger.debug("Deleting record"), this.logger.trace({ type: "method", method: "delete", id: s }), this.values.forEach((n) => {
        if (n.topic === i) {
          if (typeof s < "u" && n.id !== s) return;
          this.records.delete(n.id), this.events.emit(F$2.deleted, n);
        }
      }), this.persist();
    }), O$2(this, "exists", async (i, s) => (this.isInitialized(), this.records.has(s) ? (await this.getRecord(s)).topic === i : false)), O$2(this, "on", (i, s) => {
      this.events.on(i, s);
    }), O$2(this, "once", (i, s) => {
      this.events.once(i, s);
    }), O$2(this, "off", (i, s) => {
      this.events.off(i, s);
    }), O$2(this, "removeListener", (i, s) => {
      this.events.removeListener(i, s);
    }), this.logger = E$5(t, this.name);
  }
  get context() {
    return y$3(this.logger);
  }
  get storageKey() {
    return this.storagePrefix + this.version + this.core.customStoragePrefix + "//" + this.name;
  }
  get size() {
    return this.records.size;
  }
  get keys() {
    return Array.from(this.records.keys());
  }
  get values() {
    return Array.from(this.records.values());
  }
  get pending() {
    const e = [];
    return this.values.forEach((t) => {
      if (typeof t.response < "u") return;
      const i = { topic: t.topic, request: formatJsonRpcRequest(t.request.method, t.request.params, t.id), chainId: t.chainId };
      return e.push(i);
    }), e;
  }
  async setJsonRpcRecords(e) {
    await this.core.storage.setItem(this.storageKey, e);
  }
  async getJsonRpcRecords() {
    return await this.core.storage.getItem(this.storageKey);
  }
  getRecord(e) {
    this.isInitialized();
    const t = this.records.get(e);
    if (!t) {
      const { message: i } = ht$2("NO_MATCHING_KEY", `${this.name}: ${e}`);
      throw new Error(i);
    }
    return t;
  }
  async persist() {
    await this.setJsonRpcRecords(this.values), this.events.emit(F$2.sync);
  }
  async restore() {
    try {
      const e = await this.getJsonRpcRecords();
      if (typeof e > "u" || !e.length) return;
      if (this.records.size) {
        const { message: t } = ht$2("RESTORE_WILL_OVERRIDE", this.name);
        throw this.logger.error(t), new Error(t);
      }
      this.cached = e, this.logger.debug(`Successfully Restored records for ${this.name}`), this.logger.trace({ type: "method", method: "restore", records: this.values });
    } catch (e) {
      this.logger.debug(`Failed to Restore records for ${this.name}`), this.logger.error(e);
    }
  }
  registerEventListeners() {
    this.events.on(F$2.created, (e) => {
      const t = F$2.created;
      this.logger.info(`Emitting ${t}`), this.logger.debug({ type: "event", event: t, record: e });
    }), this.events.on(F$2.updated, (e) => {
      const t = F$2.updated;
      this.logger.info(`Emitting ${t}`), this.logger.debug({ type: "event", event: t, record: e });
    }), this.events.on(F$2.deleted, (e) => {
      const t = F$2.deleted;
      this.logger.info(`Emitting ${t}`), this.logger.debug({ type: "event", event: t, record: e });
    }), this.core.heartbeat.on(r$1.pulse, () => {
      this.cleanup();
    });
  }
  cleanup() {
    try {
      this.isInitialized();
      let e = false;
      this.records.forEach((t) => {
        cjs$3.toMiliseconds(t.expiry || 0) - Date.now() <= 0 && (this.logger.info(`Deleting expired history log: ${t.id}`), this.records.delete(t.id), this.events.emit(F$2.deleted, t, false), e = true);
      }), e && this.persist();
    } catch (e) {
      this.logger.warn(e);
    }
  }
  isInitialized() {
    if (!this.initialized) {
      const { message: e } = ht$2("NOT_INITIALIZED", this.name);
      throw new Error(e);
    }
  }
}
var Uo = Object.defineProperty, Fo = (r, e, t) => e in r ? Uo(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, A$2 = (r, e, t) => Fo(r, typeof e != "symbol" ? e + "" : e, t);
class ji extends S$3 {
  constructor(e, t) {
    super(e, t), this.core = e, this.logger = t, A$2(this, "expirations", /* @__PURE__ */ new Map()), A$2(this, "events", new eventsExports.EventEmitter()), A$2(this, "name", qt$1), A$2(this, "version", Gt$1), A$2(this, "cached", []), A$2(this, "initialized", false), A$2(this, "storagePrefix", B$2), A$2(this, "init", async () => {
      this.initialized || (this.logger.trace("Initialized"), await this.restore(), this.cached.forEach((i) => this.expirations.set(i.target, i)), this.cached = [], this.registerEventListeners(), this.initialized = true);
    }), A$2(this, "has", (i) => {
      try {
        const s = this.formatTarget(i);
        return typeof this.getExpiration(s) < "u";
      } catch {
        return false;
      }
    }), A$2(this, "set", (i, s) => {
      this.isInitialized();
      const n = this.formatTarget(i), o = { target: n, expiry: s };
      this.expirations.set(n, o), this.checkExpiry(n, o), this.events.emit(M$2.created, { target: n, expiration: o });
    }), A$2(this, "get", (i) => {
      this.isInitialized();
      const s = this.formatTarget(i);
      return this.getExpiration(s);
    }), A$2(this, "del", (i) => {
      if (this.isInitialized(), this.has(i)) {
        const s = this.formatTarget(i), n = this.getExpiration(s);
        this.expirations.delete(s), this.events.emit(M$2.deleted, { target: s, expiration: n });
      }
    }), A$2(this, "on", (i, s) => {
      this.events.on(i, s);
    }), A$2(this, "once", (i, s) => {
      this.events.once(i, s);
    }), A$2(this, "off", (i, s) => {
      this.events.off(i, s);
    }), A$2(this, "removeListener", (i, s) => {
      this.events.removeListener(i, s);
    }), this.logger = E$5(t, this.name);
  }
  get context() {
    return y$3(this.logger);
  }
  get storageKey() {
    return this.storagePrefix + this.version + this.core.customStoragePrefix + "//" + this.name;
  }
  get length() {
    return this.expirations.size;
  }
  get keys() {
    return Array.from(this.expirations.keys());
  }
  get values() {
    return Array.from(this.expirations.values());
  }
  formatTarget(e) {
    if (typeof e == "string") return mi$1(e);
    if (typeof e == "number") return wi$1(e);
    const { message: t } = ht$2("UNKNOWN_TYPE", `Target type: ${typeof e}`);
    throw new Error(t);
  }
  async setExpirations(e) {
    await this.core.storage.setItem(this.storageKey, e);
  }
  async getExpirations() {
    return await this.core.storage.getItem(this.storageKey);
  }
  async persist() {
    await this.setExpirations(this.values), this.events.emit(M$2.sync);
  }
  async restore() {
    try {
      const e = await this.getExpirations();
      if (typeof e > "u" || !e.length) return;
      if (this.expirations.size) {
        const { message: t } = ht$2("RESTORE_WILL_OVERRIDE", this.name);
        throw this.logger.error(t), new Error(t);
      }
      this.cached = e, this.logger.debug(`Successfully Restored expirations for ${this.name}`), this.logger.trace({ type: "method", method: "restore", expirations: this.values });
    } catch (e) {
      this.logger.debug(`Failed to Restore expirations for ${this.name}`), this.logger.error(e);
    }
  }
  getExpiration(e) {
    const t = this.expirations.get(e);
    if (!t) {
      const { message: i } = ht$2("NO_MATCHING_KEY", `${this.name}: ${e}`);
      throw this.logger.warn(i), new Error(i);
    }
    return t;
  }
  checkExpiry(e, t) {
    const { expiry: i } = t;
    cjs$3.toMiliseconds(i) - Date.now() <= 0 && this.expire(e, t);
  }
  expire(e, t) {
    this.expirations.delete(e), this.events.emit(M$2.expired, { target: e, expiration: t });
  }
  checkExpirations() {
    this.core.relayer.connected && this.expirations.forEach((e, t) => this.checkExpiry(t, e));
  }
  registerEventListeners() {
    this.core.heartbeat.on(r$1.pulse, () => this.checkExpirations()), this.events.on(M$2.created, (e) => {
      const t = M$2.created;
      this.logger.info(`Emitting ${t}`), this.logger.debug({ type: "event", event: t, data: e }), this.persist();
    }), this.events.on(M$2.expired, (e) => {
      const t = M$2.expired;
      this.logger.info(`Emitting ${t}`), this.logger.debug({ type: "event", event: t, data: e }), this.persist();
    }), this.events.on(M$2.deleted, (e) => {
      const t = M$2.deleted;
      this.logger.info(`Emitting ${t}`), this.logger.debug({ type: "event", event: t, data: e }), this.persist();
    });
  }
  isInitialized() {
    if (!this.initialized) {
      const { message: e } = ht$2("NOT_INITIALIZED", this.name);
      throw new Error(e);
    }
  }
}
var Mo = Object.defineProperty, Ko = (r, e, t) => e in r ? Mo(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, w$2 = (r, e, t) => Ko(r, typeof e != "symbol" ? e + "" : e, t);
class Ui extends M$3 {
  constructor(e, t, i) {
    super(e, t, i), this.core = e, this.logger = t, this.store = i, w$2(this, "name", Wt$1), w$2(this, "abortController"), w$2(this, "isDevEnv"), w$2(this, "verifyUrlV3", Yt$1), w$2(this, "storagePrefix", B$2), w$2(this, "version", Le$2), w$2(this, "publicKey"), w$2(this, "fetchPromise"), w$2(this, "init", async () => {
      var s;
      this.isDevEnv || (this.publicKey = await this.store.getItem(this.storeKey), this.publicKey && cjs$3.toMiliseconds((s = this.publicKey) == null ? void 0 : s.expiresAt) < Date.now() && (this.logger.debug("verify v2 public key expired"), await this.removePublicKey()));
    }), w$2(this, "register", async (s) => {
      if (!Tt$2() || this.isDevEnv) return;
      const n = window.location.origin, { id: o, decryptedId: a } = s, c = `${this.verifyUrlV3}/attestation?projectId=${this.core.projectId}&origin=${n}&id=${o}&decryptedId=${a}`;
      try {
        const h = getDocument_1(), l = this.startAbortTimer(cjs$3.ONE_SECOND * 5), d = await new Promise((g, _) => {
          const u = () => {
            window.removeEventListener("message", x), h.body.removeChild(b), _("attestation aborted");
          };
          this.abortController.signal.addEventListener("abort", u);
          const b = h.createElement("iframe");
          b.src = c, b.style.display = "none", b.addEventListener("error", u, { signal: this.abortController.signal });
          const x = (I) => {
            if (I.data && typeof I.data == "string") try {
              const D = JSON.parse(I.data);
              if (D.type === "verify_attestation") {
                if (sn$2(D.attestation).payload.id !== o) return;
                clearInterval(l), h.body.removeChild(b), this.abortController.signal.removeEventListener("abort", u), window.removeEventListener("message", x), g(D.attestation === null ? "" : D.attestation);
              }
            } catch (D) {
              this.logger.warn(D);
            }
          };
          h.body.appendChild(b), window.addEventListener("message", x, { signal: this.abortController.signal });
        });
        return this.logger.debug("jwt attestation", d), d;
      } catch (h) {
        this.logger.warn(h);
      }
      return "";
    }), w$2(this, "resolve", async (s) => {
      if (this.isDevEnv) return "";
      const { attestationId: n, hash: o, encryptedId: a } = s;
      if (n === "") {
        this.logger.debug("resolve: attestationId is empty, skipping");
        return;
      }
      if (n) {
        if (sn$2(n).payload.id !== a) return;
        const h = await this.isValidJwtAttestation(n);
        if (h) {
          if (!h.isVerified) {
            this.logger.warn("resolve: jwt attestation: origin url not verified");
            return;
          }
          return h;
        }
      }
      if (!o) return;
      const c = this.getVerifyUrl(s?.verifyUrl);
      return this.fetchAttestation(o, c);
    }), w$2(this, "fetchAttestation", async (s, n) => {
      this.logger.debug(`resolving attestation: ${s} from url: ${n}`);
      const o = this.startAbortTimer(cjs$3.ONE_SECOND * 5), a = await fetch(`${n}/attestation/${s}?v2Supported=true`, { signal: this.abortController.signal });
      return clearTimeout(o), a.status === 200 ? await a.json() : void 0;
    }), w$2(this, "getVerifyUrl", (s) => {
      let n = s || ue$1;
      return Jt$1.includes(n) || (this.logger.info(`verify url: ${n}, not included in trusted list, assigning default: ${ue$1}`), n = ue$1), n;
    }), w$2(this, "fetchPublicKey", async () => {
      try {
        this.logger.debug(`fetching public key from: ${this.verifyUrlV3}`);
        const s = this.startAbortTimer(cjs$3.FIVE_SECONDS), n = await fetch(`${this.verifyUrlV3}/public-key`, { signal: this.abortController.signal });
        return clearTimeout(s), await n.json();
      } catch (s) {
        this.logger.warn(s);
      }
    }), w$2(this, "persistPublicKey", async (s) => {
      this.logger.debug("persisting public key to local storage", s), await this.store.setItem(this.storeKey, s), this.publicKey = s;
    }), w$2(this, "removePublicKey", async () => {
      this.logger.debug("removing verify v2 public key from storage"), await this.store.removeItem(this.storeKey), this.publicKey = void 0;
    }), w$2(this, "isValidJwtAttestation", async (s) => {
      const n = await this.getPublicKey();
      try {
        if (n) return this.validateAttestation(s, n);
      } catch (a) {
        this.logger.error(a), this.logger.warn("error validating attestation");
      }
      const o = await this.fetchAndPersistPublicKey();
      try {
        if (o) return this.validateAttestation(s, o);
      } catch (a) {
        this.logger.error(a), this.logger.warn("error validating attestation");
      }
    }), w$2(this, "getPublicKey", async () => this.publicKey ? this.publicKey : await this.fetchAndPersistPublicKey()), w$2(this, "fetchAndPersistPublicKey", async () => {
      if (this.fetchPromise) return await this.fetchPromise, this.publicKey;
      this.fetchPromise = new Promise(async (n) => {
        const o = await this.fetchPublicKey();
        o && (await this.persistPublicKey(o), n(o));
      });
      const s = await this.fetchPromise;
      return this.fetchPromise = void 0, s;
    }), w$2(this, "validateAttestation", (s, n) => {
      const o = zc(s, n.publicKey), a = { hasExpired: cjs$3.toMiliseconds(o.exp) < Date.now(), payload: o };
      if (a.hasExpired) throw this.logger.warn("resolve: jwt attestation expired"), new Error("JWT attestation expired");
      return { origin: a.payload.origin, isScam: a.payload.isScam, isVerified: a.payload.isVerified };
    }), this.logger = E$5(t, this.name), this.abortController = new AbortController(), this.isDevEnv = Ii$1(), this.init();
  }
  get storeKey() {
    return this.storagePrefix + this.version + this.core.customStoragePrefix + "//verify:public:key";
  }
  get context() {
    return y$3(this.logger);
  }
  startAbortTimer(e) {
    return this.abortController = new AbortController(), setTimeout(() => this.abortController.abort(), cjs$3.toMiliseconds(e));
  }
}
var Bo = Object.defineProperty, Vo = (r, e, t) => e in r ? Bo(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, Fi = (r, e, t) => Vo(r, typeof e != "symbol" ? e + "" : e, t);
class Mi extends O$3 {
  constructor(e, t) {
    super(e, t), this.projectId = e, this.logger = t, Fi(this, "context", Xt$1), Fi(this, "registerDeviceToken", async (i) => {
      const { clientId: s, token: n, notificationType: o, enableEncrypted: a = false } = i, c = `${Zt$1}/${this.projectId}/clients`;
      await fetch(c, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: s, type: o, token: n, always_raw: a }) });
    }), this.logger = E$5(t, this.context);
  }
}
var qo = Object.defineProperty, Ki = Object.getOwnPropertySymbols, Go = Object.prototype.hasOwnProperty, Wo = Object.prototype.propertyIsEnumerable, Ze$1 = (r, e, t) => e in r ? qo(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, be$1 = (r, e) => {
  for (var t in e || (e = {})) Go.call(e, t) && Ze$1(r, t, e[t]);
  if (Ki) for (var t of Ki(e)) Wo.call(e, t) && Ze$1(r, t, e[t]);
  return r;
}, E$4 = (r, e, t) => Ze$1(r, typeof e != "symbol" ? e + "" : e, t);
class Bi extends R$2 {
  constructor(e, t, i = true) {
    super(e, t, i), this.core = e, this.logger = t, E$4(this, "context", ei), E$4(this, "storagePrefix", B$2), E$4(this, "storageVersion", Qt$1), E$4(this, "events", /* @__PURE__ */ new Map()), E$4(this, "shouldPersist", false), E$4(this, "init", async () => {
      if (!Ii$1()) try {
        const s = { eventId: Bi$1(), timestamp: Date.now(), domain: this.getAppDomain(), props: { event: "INIT", type: "", properties: { client_id: await this.core.crypto.getClientId(), user_agent: Mn$1(this.core.relayer.protocol, this.core.relayer.version, _e$2) } } };
        await this.sendEvent([s]);
      } catch (s) {
        this.logger.warn(s);
      }
    }), E$4(this, "createEvent", (s) => {
      const { event: n = "ERROR", type: o = "", properties: { topic: a, trace: c } } = s, h = Bi$1(), l = this.core.projectId || "", d = Date.now(), g = be$1({ eventId: h, timestamp: d, props: { event: n, type: o, properties: { topic: a, trace: c } }, bundleId: l, domain: this.getAppDomain() }, this.setMethods(h));
      return this.telemetryEnabled && (this.events.set(h, g), this.shouldPersist = true), g;
    }), E$4(this, "getEvent", (s) => {
      const { eventId: n, topic: o } = s;
      if (n) return this.events.get(n);
      const a = Array.from(this.events.values()).find((c) => c.props.properties.topic === o);
      if (a) return be$1(be$1({}, a), this.setMethods(a.eventId));
    }), E$4(this, "deleteEvent", (s) => {
      const { eventId: n } = s;
      this.events.delete(n), this.shouldPersist = true;
    }), E$4(this, "setEventListeners", () => {
      this.core.heartbeat.on(r$1.pulse, async () => {
        this.shouldPersist && await this.persist(), this.events.forEach((s) => {
          cjs$3.fromMiliseconds(Date.now()) - cjs$3.fromMiliseconds(s.timestamp) > ti && (this.events.delete(s.eventId), this.shouldPersist = true);
        });
      });
    }), E$4(this, "setMethods", (s) => ({ addTrace: (n) => this.addTrace(s, n), setError: (n) => this.setError(s, n) })), E$4(this, "addTrace", (s, n) => {
      const o = this.events.get(s);
      o && (o.props.properties.trace.push(n), this.events.set(s, o), this.shouldPersist = true);
    }), E$4(this, "setError", (s, n) => {
      const o = this.events.get(s);
      o && (o.props.type = n, o.timestamp = Date.now(), this.events.set(s, o), this.shouldPersist = true);
    }), E$4(this, "persist", async () => {
      await this.core.storage.setItem(this.storageKey, Array.from(this.events.values())), this.shouldPersist = false;
    }), E$4(this, "restore", async () => {
      try {
        const s = await this.core.storage.getItem(this.storageKey) || [];
        if (!s.length) return;
        s.forEach((n) => {
          this.events.set(n.eventId, be$1(be$1({}, n), this.setMethods(n.eventId)));
        });
      } catch (s) {
        this.logger.warn(s);
      }
    }), E$4(this, "submit", async () => {
      if (!this.telemetryEnabled || this.events.size === 0) return;
      const s = [];
      for (const [n, o] of this.events) o.props.type && s.push(o);
      if (s.length !== 0) try {
        if ((await this.sendEvent(s)).ok) for (const n of s) this.events.delete(n.eventId), this.shouldPersist = true;
      } catch (n) {
        this.logger.warn(n);
      }
    }), E$4(this, "sendEvent", async (s) => {
      const n = this.getAppDomain() ? "" : "&sp=desktop";
      return await fetch(`${ii}?projectId=${this.core.projectId}&st=events_sdk&sv=js-${_e$2}${n}`, { method: "POST", body: JSON.stringify(s) });
    }), E$4(this, "getAppDomain", () => Pn$1().url), this.logger = E$5(t, this.context), this.telemetryEnabled = i, i ? this.restore().then(async () => {
      await this.submit(), this.setEventListeners();
    }) : this.persist();
  }
  get storageKey() {
    return this.storagePrefix + this.storageVersion + this.core.customStoragePrefix + "//" + this.context;
  }
}
var Ho = Object.defineProperty, Vi = Object.getOwnPropertySymbols, Yo = Object.prototype.hasOwnProperty, Jo = Object.prototype.propertyIsEnumerable, Qe$1 = (r, e, t) => e in r ? Ho(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t, qi = (r, e) => {
  for (var t in e || (e = {})) Yo.call(e, t) && Qe$1(r, t, e[t]);
  if (Vi) for (var t of Vi(e)) Jo.call(e, t) && Qe$1(r, t, e[t]);
  return r;
}, v$3 = (r, e, t) => Qe$1(r, typeof e != "symbol" ? e + "" : e, t);
let Te$1 = class Te extends h$2 {
  constructor(e) {
    var t;
    super(e), v$3(this, "protocol", ze$1), v$3(this, "version", Le$2), v$3(this, "name", he$1), v$3(this, "relayUrl"), v$3(this, "projectId"), v$3(this, "customStoragePrefix"), v$3(this, "events", new eventsExports.EventEmitter()), v$3(this, "logger"), v$3(this, "heartbeat"), v$3(this, "relayer"), v$3(this, "crypto"), v$3(this, "storage"), v$3(this, "history"), v$3(this, "expirer"), v$3(this, "pairing"), v$3(this, "verify"), v$3(this, "echoClient"), v$3(this, "linkModeSupportedApps"), v$3(this, "eventClient"), v$3(this, "initialized", false), v$3(this, "logChunkController"), v$3(this, "on", (a, c) => this.events.on(a, c)), v$3(this, "once", (a, c) => this.events.once(a, c)), v$3(this, "off", (a, c) => this.events.off(a, c)), v$3(this, "removeListener", (a, c) => this.events.removeListener(a, c)), v$3(this, "dispatchEnvelope", ({ topic: a, message: c, sessionExists: h }) => {
      if (!a || !c) return;
      const l = { topic: a, message: c, publishedAt: Date.now(), transportType: Q$2.link_mode };
      this.relayer.onLinkMessageEvent(l, { sessionExists: h });
    });
    const i = this.getGlobalCore(e?.customStoragePrefix);
    if (i) try {
      return this.customStoragePrefix = i.customStoragePrefix, this.logger = i.logger, this.heartbeat = i.heartbeat, this.crypto = i.crypto, this.history = i.history, this.expirer = i.expirer, this.storage = i.storage, this.relayer = i.relayer, this.pairing = i.pairing, this.verify = i.verify, this.echoClient = i.echoClient, this.linkModeSupportedApps = i.linkModeSupportedApps, this.eventClient = i.eventClient, this.initialized = i.initialized, this.logChunkController = i.logChunkController, i;
    } catch (a) {
      console.warn("Failed to copy global core", a);
    }
    this.projectId = e?.projectId, this.relayUrl = e?.relayUrl || Ue$2, this.customStoragePrefix = e != null && e.customStoragePrefix ? `:${e.customStoragePrefix}` : "";
    const s = k$4({ level: typeof e?.logger == "string" && e.logger ? e.logger : Et$1.logger, name: he$1 }), { logger: n, chunkLoggerController: o } = A$3({ opts: s, maxSizeInBytes: e?.maxLogBlobSizeInBytes, loggerOverride: e?.logger });
    this.logChunkController = o, (t = this.logChunkController) != null && t.downloadLogsBlobInBrowser && (window.downloadLogsBlobInBrowser = async () => {
      var a, c;
      (a = this.logChunkController) != null && a.downloadLogsBlobInBrowser && ((c = this.logChunkController) == null || c.downloadLogsBlobInBrowser({ clientId: await this.crypto.getClientId() }));
    }), this.logger = E$5(n, this.name), this.heartbeat = new i$2(), this.crypto = new vi(this, this.logger, e?.keychain), this.history = new ki(this, this.logger), this.expirer = new ji(this, this.logger), this.storage = e != null && e.storage ? e.storage : new h$3(qi(qi({}, It$1), e?.storageOptions)), this.relayer = new Si({ core: this, logger: this.logger, relayUrl: this.relayUrl, projectId: this.projectId }), this.pairing = new Li(this, this.logger), this.verify = new Ui(this, this.logger, this.storage), this.echoClient = new Mi(this.projectId || "", this.logger), this.linkModeSupportedApps = [], this.eventClient = new Bi(this, this.logger, e?.telemetryEnabled), this.setGlobalCore(this);
  }
  static async init(e) {
    const t = new Te(e);
    await t.initialize();
    const i = await t.crypto.getClientId();
    return await t.storage.setItem(jt$1, i), t;
  }
  get context() {
    return y$3(this.logger);
  }
  async start() {
    this.initialized || await this.initialize();
  }
  async getLogsBlob() {
    var e;
    return (e = this.logChunkController) == null ? void 0 : e.logsToBlob({ clientId: await this.crypto.getClientId() });
  }
  async addLinkModeSupportedApp(e) {
    this.linkModeSupportedApps.includes(e) || (this.linkModeSupportedApps.push(e), await this.storage.setItem(Fe$1, this.linkModeSupportedApps));
  }
  async initialize() {
    this.logger.trace("Initialized");
    try {
      await this.crypto.init(), await this.history.init(), await this.expirer.init(), await this.relayer.init(), await this.heartbeat.init(), await this.pairing.init(), this.linkModeSupportedApps = await this.storage.getItem(Fe$1) || [], this.initialized = true, this.logger.info("Core Initialization Success");
    } catch (e) {
      throw this.logger.warn(`Core Initialization Failure at epoch ${Date.now()}`, e), this.logger.error(e.message), e;
    }
  }
  getGlobalCore(e = "") {
    try {
      if (this.isGlobalCoreDisabled()) return;
      const t = `_walletConnectCore_${e}`, i = `${t}_count`;
      return globalThis[i] = (globalThis[i] || 0) + 1, globalThis[i] > 1 && console.warn(`WalletConnect Core is already initialized. This is probably a mistake and can lead to unexpected behavior. Init() was called ${globalThis[i]} times.`), globalThis[t];
    } catch (t) {
      console.warn("Failed to get global WalletConnect core", t);
      return;
    }
  }
  setGlobalCore(e) {
    var t;
    try {
      if (this.isGlobalCoreDisabled()) return;
      const i = `_walletConnectCore_${((t = e.opts) == null ? void 0 : t.customStoragePrefix) || ""}`;
      globalThis[i] = e;
    } catch (i) {
      console.warn("Failed to set global WalletConnect core", i);
    }
  }
  isGlobalCoreDisabled() {
    try {
      return typeof process < "u" && define_process_env_default.DISABLE_GLOBAL_CORE === "true";
    } catch {
      return true;
    }
  }
};
const Xo = Te$1;

const De$1 = "wc", Le$1 = 2, ke$1 = "client", we$1 = `${De$1}@${Le$1}:${ke$1}:`, me$1 = { name: ke$1, logger: "error"}, Me$1 = "WALLETCONNECT_DEEPLINK_CHOICE", pt$1 = "proposal", $e$1 = "Proposal expired", ht$1 = "session", J$1 = cjs$3.SEVEN_DAYS, dt$1 = "engine", N$1 = { wc_sessionPropose: { req: { ttl: cjs$3.FIVE_MINUTES, prompt: true, tag: 1100 }, res: { ttl: cjs$3.FIVE_MINUTES, prompt: false, tag: 1101 }, reject: { ttl: cjs$3.FIVE_MINUTES, prompt: false, tag: 1120 }, autoReject: { ttl: cjs$3.FIVE_MINUTES, prompt: false, tag: 1121 } }, wc_sessionSettle: { req: { ttl: cjs$3.FIVE_MINUTES, prompt: false, tag: 1102 }, res: { ttl: cjs$3.FIVE_MINUTES, prompt: false, tag: 1103 } }, wc_sessionUpdate: { req: { ttl: cjs$3.ONE_DAY, prompt: false, tag: 1104 }, res: { ttl: cjs$3.ONE_DAY, prompt: false, tag: 1105 } }, wc_sessionExtend: { req: { ttl: cjs$3.ONE_DAY, prompt: false, tag: 1106 }, res: { ttl: cjs$3.ONE_DAY, prompt: false, tag: 1107 } }, wc_sessionRequest: { req: { ttl: cjs$3.FIVE_MINUTES, prompt: true, tag: 1108 }, res: { ttl: cjs$3.FIVE_MINUTES, prompt: false, tag: 1109 } }, wc_sessionEvent: { req: { ttl: cjs$3.FIVE_MINUTES, prompt: true, tag: 1110 }, res: { ttl: cjs$3.FIVE_MINUTES, prompt: false, tag: 1111 } }, wc_sessionDelete: { req: { ttl: cjs$3.ONE_DAY, prompt: false, tag: 1112 }, res: { ttl: cjs$3.ONE_DAY, prompt: false, tag: 1113 } }, wc_sessionPing: { req: { ttl: cjs$3.ONE_DAY, prompt: false, tag: 1114 }, res: { ttl: cjs$3.ONE_DAY, prompt: false, tag: 1115 } }, wc_sessionAuthenticate: { req: { ttl: cjs$3.ONE_HOUR, prompt: true, tag: 1116 }, res: { ttl: cjs$3.ONE_HOUR, prompt: false, tag: 1117 }, reject: { ttl: cjs$3.FIVE_MINUTES, prompt: false, tag: 1118 }, autoReject: { ttl: cjs$3.FIVE_MINUTES, prompt: false, tag: 1119 } } }, _e$1 = { min: cjs$3.FIVE_MINUTES, max: cjs$3.SEVEN_DAYS }, $$2 = { idle: "IDLE", active: "ACTIVE" }, Ke$1 = { eth_sendTransaction: { key: "" }, eth_sendRawTransaction: { key: "" }, wallet_sendCalls: { key: "" }, solana_signTransaction: { key: "signature" }, solana_signAllTransactions: { key: "transactions" }, solana_signAndSendTransaction: { key: "signature" } }, ut$1 = "request", gt$1 = ["wc_sessionPropose", "wc_sessionRequest", "wc_authRequest", "wc_sessionAuthenticate"], yt$1 = "wc", wt$1 = "auth", mt$1 = "authKeys", _t$1 = "pairingTopics", Et = "requests", ae$1 = `${yt$1}@${1.5}:${wt$1}:`, ce$1 = `${ae$1}:PUB_KEY`;
var vs = Object.defineProperty, Is = Object.defineProperties, Ts = Object.getOwnPropertyDescriptors, ft$1 = Object.getOwnPropertySymbols, qs = Object.prototype.hasOwnProperty, Ps = Object.prototype.propertyIsEnumerable, Ue$1 = (S, n, e) => n in S ? vs(S, n, { enumerable: true, configurable: true, writable: true, value: e }) : S[n] = e, v$2 = (S, n) => {
  for (var e in n || (n = {})) qs.call(n, e) && Ue$1(S, e, n[e]);
  if (ft$1) for (var e of ft$1(n)) Ps.call(n, e) && Ue$1(S, e, n[e]);
  return S;
}, b$2 = (S, n) => Is(S, Ts(n)), c$1 = (S, n, e) => Ue$1(S, typeof n != "symbol" ? n + "" : n, e);
class Ns extends V$3 {
  constructor(n) {
    super(n), c$1(this, "name", dt$1), c$1(this, "events", new Nt$3()), c$1(this, "initialized", false), c$1(this, "requestQueue", { state: $$2.idle, queue: [] }), c$1(this, "sessionRequestQueue", { state: $$2.idle, queue: [] }), c$1(this, "requestQueueDelay", cjs$3.ONE_SECOND), c$1(this, "expectedPairingMethodMap", /* @__PURE__ */ new Map()), c$1(this, "recentlyDeletedMap", /* @__PURE__ */ new Map()), c$1(this, "recentlyDeletedLimit", 200), c$1(this, "relayMessageCache", []), c$1(this, "pendingSessions", /* @__PURE__ */ new Map()), c$1(this, "init", async () => {
      this.initialized || (await this.cleanup(), this.registerRelayerEvents(), this.registerExpirerEvents(), this.registerPairingEvents(), await this.registerLinkModeListeners(), this.client.core.pairing.register({ methods: Object.keys(N$1) }), this.initialized = true, setTimeout(async () => {
        await this.processPendingMessageEvents(), this.sessionRequestQueue.queue = this.getPendingSessionRequests(), this.processSessionRequestQueue();
      }, cjs$3.toMiliseconds(this.requestQueueDelay)));
    }), c$1(this, "connect", async (e) => {
      this.isInitialized(), await this.confirmOnlineStateOrThrow();
      const t = b$2(v$2({}, e), { requiredNamespaces: e.requiredNamespaces || {}, optionalNamespaces: e.optionalNamespaces || {} });
      await this.isValidConnect(t), t.optionalNamespaces = aa(t.requiredNamespaces, t.optionalNamespaces), t.requiredNamespaces = {};
      const { pairingTopic: s, requiredNamespaces: i, optionalNamespaces: r, sessionProperties: o, scopedProperties: a, relays: l } = t;
      let p = s, h, u = false;
      try {
        if (p) {
          const T = this.client.core.pairing.pairings.get(p);
          this.client.logger.warn("connect() with existing pairing topic is deprecated and will be removed in the next major release."), u = T.active;
        }
      } catch (T) {
        throw this.client.logger.error(`connect() -> pairing.get(${p}) failed`), T;
      }
      if (!p || !u) {
        const { topic: T, uri: K } = await this.client.core.pairing.create();
        p = T, h = K;
      }
      if (!p) {
        const { message: T } = ht$2("NO_MATCHING_KEY", `connect() pairing topic: ${p}`);
        throw new Error(T);
      }
      const d = await this.client.core.crypto.generateKeyPair(), w = N$1.wc_sessionPropose.req.ttl || cjs$3.FIVE_MINUTES, m = Ei$1(w), f = b$2(v$2(v$2({ requiredNamespaces: i, optionalNamespaces: r, relays: l ?? [{ protocol: xt$1 }], proposer: { publicKey: d, metadata: this.client.metadata }, expiryTimestamp: m, pairingTopic: p }, o && { sessionProperties: o }), a && { scopedProperties: a }), { id: payloadId() }), _ = xi$1("session_connect", f.id), { reject: g, resolve: A, done: D } = gi$1(w, $e$1), I = ({ id: T }) => {
        T === f.id && (this.client.events.off("proposal_expire", I), this.pendingSessions.delete(f.id), this.events.emit(_, { error: { message: $e$1, code: 0 } }));
      };
      return this.client.events.on("proposal_expire", I), this.events.once(_, ({ error: T, session: K }) => {
        this.client.events.off("proposal_expire", I), T ? g(T) : K && A(K);
      }), await this.sendRequest({ topic: p, method: "wc_sessionPropose", params: f, throwOnFailedPublish: true, clientRpcId: f.id }), await this.setProposal(f.id, f), { uri: h, approval: D };
    }), c$1(this, "pair", async (e) => {
      this.isInitialized(), await this.confirmOnlineStateOrThrow();
      try {
        return await this.client.core.pairing.pair(e);
      } catch (t) {
        throw this.client.logger.error("pair() failed"), t;
      }
    }), c$1(this, "approve", async (e) => {
      var t, s, i;
      const r = this.client.core.eventClient.createEvent({ properties: { topic: (t = e?.id) == null ? void 0 : t.toString(), trace: [er.session_approve_started] } });
      try {
        this.isInitialized(), await this.confirmOnlineStateOrThrow();
      } catch (q) {
        throw r.setError(tr.no_internet_connection), q;
      }
      try {
        await this.isValidProposalId(e?.id);
      } catch (q) {
        throw this.client.logger.error(`approve() -> proposal.get(${e?.id}) failed`), r.setError(tr.proposal_not_found), q;
      }
      try {
        await this.isValidApprove(e);
      } catch (q) {
        throw this.client.logger.error("approve() -> isValidApprove() failed"), r.setError(tr.session_approve_namespace_validation_failure), q;
      }
      const { id: o, relayProtocol: a, namespaces: l, sessionProperties: p, scopedProperties: h, sessionConfig: u } = e, d = this.client.proposal.get(o);
      this.client.core.eventClient.deleteEvent({ eventId: r.eventId });
      const { pairingTopic: w, proposer: m, requiredNamespaces: f, optionalNamespaces: _ } = d;
      let g = (s = this.client.core.eventClient) == null ? void 0 : s.getEvent({ topic: w });
      g || (g = (i = this.client.core.eventClient) == null ? void 0 : i.createEvent({ type: er.session_approve_started, properties: { topic: w, trace: [er.session_approve_started, er.session_namespaces_validation_success] } }));
      const A = await this.client.core.crypto.generateKeyPair(), D = m.publicKey, I = await this.client.core.crypto.generateSharedKey(A, D), T = v$2(v$2(v$2({ relay: { protocol: a ?? "irn" }, namespaces: l, controller: { publicKey: A, metadata: this.client.metadata }, expiry: Ei$1(J$1) }, p && { sessionProperties: p }), h && { scopedProperties: h }), u && { sessionConfig: u }), K = Q$2.relay;
      g.addTrace(er.subscribing_session_topic);
      try {
        await this.client.core.relayer.subscribe(I, { transportType: K });
      } catch (q) {
        throw g.setError(tr.subscribe_session_topic_failure), q;
      }
      g.addTrace(er.subscribe_session_topic_success);
      const fe = b$2(v$2({}, T), { topic: I, requiredNamespaces: f, optionalNamespaces: _, pairingTopic: w, acknowledged: false, self: T.controller, peer: { publicKey: m.publicKey, metadata: m.metadata }, controller: A, transportType: Q$2.relay });
      await this.client.session.set(I, fe), g.addTrace(er.store_session);
      try {
        g.addTrace(er.publishing_session_settle), await this.sendRequest({ topic: I, method: "wc_sessionSettle", params: T, throwOnFailedPublish: true }).catch((q) => {
          throw g?.setError(tr.session_settle_publish_failure), q;
        }), g.addTrace(er.session_settle_publish_success), g.addTrace(er.publishing_session_approve), await this.sendResult({ id: o, topic: w, result: { relay: { protocol: a ?? "irn" }, responderPublicKey: A }, throwOnFailedPublish: true }).catch((q) => {
          throw g?.setError(tr.session_approve_publish_failure), q;
        }), g.addTrace(er.session_approve_publish_success);
      } catch (q) {
        throw this.client.logger.error(q), this.client.session.delete(I, Nt$1("USER_DISCONNECTED")), await this.client.core.relayer.unsubscribe(I), q;
      }
      return this.client.core.eventClient.deleteEvent({ eventId: g.eventId }), await this.client.core.pairing.updateMetadata({ topic: w, metadata: m.metadata }), await this.client.proposal.delete(o, Nt$1("USER_DISCONNECTED")), await this.client.core.pairing.activate({ topic: w }), await this.setExpiry(I, Ei$1(J$1)), { topic: I, acknowledged: () => Promise.resolve(this.client.session.get(I)) };
    }), c$1(this, "reject", async (e) => {
      this.isInitialized(), await this.confirmOnlineStateOrThrow();
      try {
        await this.isValidReject(e);
      } catch (r) {
        throw this.client.logger.error("reject() -> isValidReject() failed"), r;
      }
      const { id: t, reason: s } = e;
      let i;
      try {
        i = this.client.proposal.get(t).pairingTopic;
      } catch (r) {
        throw this.client.logger.error(`reject() -> proposal.get(${t}) failed`), r;
      }
      i && (await this.sendError({ id: t, topic: i, error: s, rpcOpts: N$1.wc_sessionPropose.reject }), await this.client.proposal.delete(t, Nt$1("USER_DISCONNECTED")));
    }), c$1(this, "update", async (e) => {
      this.isInitialized(), await this.confirmOnlineStateOrThrow();
      try {
        await this.isValidUpdate(e);
      } catch (h) {
        throw this.client.logger.error("update() -> isValidUpdate() failed"), h;
      }
      const { topic: t, namespaces: s } = e, { done: i, resolve: r, reject: o } = gi$1(), a = payloadId(), l = getBigIntRpcId().toString(), p = this.client.session.get(t).namespaces;
      return this.events.once(xi$1("session_update", a), ({ error: h }) => {
        h ? o(h) : r();
      }), await this.client.session.update(t, { namespaces: s }), await this.sendRequest({ topic: t, method: "wc_sessionUpdate", params: { namespaces: s }, throwOnFailedPublish: true, clientRpcId: a, relayRpcId: l }).catch((h) => {
        this.client.logger.error(h), this.client.session.update(t, { namespaces: p }), o(h);
      }), { acknowledged: i };
    }), c$1(this, "extend", async (e) => {
      this.isInitialized(), await this.confirmOnlineStateOrThrow();
      try {
        await this.isValidExtend(e);
      } catch (a) {
        throw this.client.logger.error("extend() -> isValidExtend() failed"), a;
      }
      const { topic: t } = e, s = payloadId(), { done: i, resolve: r, reject: o } = gi$1();
      return this.events.once(xi$1("session_extend", s), ({ error: a }) => {
        a ? o(a) : r();
      }), await this.setExpiry(t, Ei$1(J$1)), this.sendRequest({ topic: t, method: "wc_sessionExtend", params: {}, clientRpcId: s, throwOnFailedPublish: true }).catch((a) => {
        o(a);
      }), { acknowledged: i };
    }), c$1(this, "request", async (e) => {
      this.isInitialized();
      try {
        await this.isValidRequest(e);
      } catch (_) {
        throw this.client.logger.error("request() -> isValidRequest() failed"), _;
      }
      const { chainId: t, request: s, topic: i, expiry: r = N$1.wc_sessionRequest.req.ttl } = e, o = this.client.session.get(i);
      o?.transportType === Q$2.relay && await this.confirmOnlineStateOrThrow();
      const a = payloadId(), l = getBigIntRpcId().toString(), { done: p, resolve: h, reject: u } = gi$1(r, "Request expired. Please try again.");
      this.events.once(xi$1("session_request", a), ({ error: _, result: g }) => {
        _ ? u(_) : h(g);
      });
      const d = "wc_sessionRequest", w = this.getAppLinkIfEnabled(o.peer.metadata, o.transportType);
      if (w) return await this.sendRequest({ clientRpcId: a, relayRpcId: l, topic: i, method: d, params: { request: b$2(v$2({}, s), { expiryTimestamp: Ei$1(r) }), chainId: t }, expiry: r, throwOnFailedPublish: true, appLink: w }).catch((_) => u(_)), this.client.events.emit("session_request_sent", { topic: i, request: s, chainId: t, id: a }), await p();
      const m = { request: b$2(v$2({}, s), { expiryTimestamp: Ei$1(r) }), chainId: t }, f = this.shouldSetTVF(d, m);
      return await Promise.all([new Promise(async (_) => {
        await this.sendRequest(v$2({ clientRpcId: a, relayRpcId: l, topic: i, method: d, params: m, expiry: r, throwOnFailedPublish: true }, f && { tvf: this.getTVFParams(a, m) })).catch((g) => u(g)), this.client.events.emit("session_request_sent", { topic: i, request: s, chainId: t, id: a }), _();
      }), new Promise(async (_) => {
        var g;
        if (!((g = o.sessionConfig) != null && g.disableDeepLink)) {
          const A = await Oi$1(this.client.core.storage, Me$1);
          await Si$1({ id: a, topic: i, wcDeepLink: A });
        }
        _();
      }), p()]).then((_) => _[2]);
    }), c$1(this, "respond", async (e) => {
      this.isInitialized(), await this.isValidRespond(e);
      const { topic: t, response: s } = e, { id: i } = s, r = this.client.session.get(t);
      r.transportType === Q$2.relay && await this.confirmOnlineStateOrThrow();
      const o = this.getAppLinkIfEnabled(r.peer.metadata, r.transportType);
      isJsonRpcResult(s) ? await this.sendResult({ id: i, topic: t, result: s.result, throwOnFailedPublish: true, appLink: o }) : isJsonRpcError(s) && await this.sendError({ id: i, topic: t, error: s.error, appLink: o }), this.cleanupAfterResponse(e);
    }), c$1(this, "ping", async (e) => {
      this.isInitialized(), await this.confirmOnlineStateOrThrow();
      try {
        await this.isValidPing(e);
      } catch (s) {
        throw this.client.logger.error("ping() -> isValidPing() failed"), s;
      }
      const { topic: t } = e;
      if (this.client.session.keys.includes(t)) {
        const s = payloadId(), i = getBigIntRpcId().toString(), { done: r, resolve: o, reject: a } = gi$1();
        this.events.once(xi$1("session_ping", s), ({ error: l }) => {
          l ? a(l) : o();
        }), await Promise.all([this.sendRequest({ topic: t, method: "wc_sessionPing", params: {}, throwOnFailedPublish: true, clientRpcId: s, relayRpcId: i }), r()]);
      } else this.client.core.pairing.pairings.keys.includes(t) && (this.client.logger.warn("ping() on pairing topic is deprecated and will be removed in the next major release."), await this.client.core.pairing.ping({ topic: t }));
    }), c$1(this, "emit", async (e) => {
      this.isInitialized(), await this.confirmOnlineStateOrThrow(), await this.isValidEmit(e);
      const { topic: t, event: s, chainId: i } = e, r = getBigIntRpcId().toString(), o = payloadId();
      await this.sendRequest({ topic: t, method: "wc_sessionEvent", params: { event: s, chainId: i }, throwOnFailedPublish: true, relayRpcId: r, clientRpcId: o });
    }), c$1(this, "disconnect", async (e) => {
      this.isInitialized(), await this.confirmOnlineStateOrThrow(), await this.isValidDisconnect(e);
      const { topic: t } = e;
      if (this.client.session.keys.includes(t)) await this.sendRequest({ topic: t, method: "wc_sessionDelete", params: Nt$1("USER_DISCONNECTED"), throwOnFailedPublish: true }), await this.deleteSession({ topic: t, emitEvent: false });
      else if (this.client.core.pairing.pairings.keys.includes(t)) await this.client.core.pairing.disconnect({ topic: t });
      else {
        const { message: s } = ht$2("MISMATCHED_TOPIC", `Session or pairing topic not found: ${t}`);
        throw new Error(s);
      }
    }), c$1(this, "find", (e) => (this.isInitialized(), this.client.session.getAll().filter((t) => ua(t, e)))), c$1(this, "getPendingSessionRequests", () => this.client.pendingRequest.getAll()), c$1(this, "authenticate", async (e, t) => {
      var s;
      this.isInitialized(), this.isValidAuthenticate(e);
      const i = t && this.client.core.linkModeSupportedApps.includes(t) && ((s = this.client.metadata.redirect) == null ? void 0 : s.linkMode), r = i ? Q$2.link_mode : Q$2.relay;
      r === Q$2.relay && await this.confirmOnlineStateOrThrow();
      const { chains: o, statement: a = "", uri: l, domain: p, nonce: h, type: u, exp: d, nbf: w, methods: m = [], expiry: f } = e, _ = [...e.resources || []], { topic: g, uri: A } = await this.client.core.pairing.create({ methods: ["wc_sessionAuthenticate"], transportType: r });
      this.client.logger.info({ message: "Generated new pairing", pairing: { topic: g, uri: A } });
      const D = await this.client.core.crypto.generateKeyPair(), I = Pc(D);
      if (await Promise.all([this.client.auth.authKeys.set(ce$1, { responseTopic: I, publicKey: D }), this.client.auth.pairingTopics.set(I, { topic: I, pairingTopic: g })]), await this.client.core.relayer.subscribe(I, { transportType: r }), this.client.logger.info(`sending request to new pairing topic: ${g}`), m.length > 0) {
        const { namespace: x } = Ne$1(o[0]);
        let L = fs(x, "request", m);
        pe$2(_) && (L = ls(L, _.pop())), _.push(L);
      }
      const T = f && f > N$1.wc_sessionAuthenticate.req.ttl ? f : N$1.wc_sessionAuthenticate.req.ttl, K = { authPayload: { type: u ?? "caip122", chains: o, statement: a, aud: l, domain: p, version: "1", nonce: h, iat: (/* @__PURE__ */ new Date()).toISOString(), exp: d, nbf: w, resources: _ }, requester: { publicKey: D, metadata: this.client.metadata }, expiryTimestamp: Ei$1(T) }, fe = { eip155: { chains: o, methods: [.../* @__PURE__ */ new Set(["personal_sign", ...m])], events: ["chainChanged", "accountsChanged"] } }, q = { requiredNamespaces: {}, optionalNamespaces: fe, relays: [{ protocol: "irn" }], pairingTopic: g, proposer: { publicKey: D, metadata: this.client.metadata }, expiryTimestamp: Ei$1(N$1.wc_sessionPropose.req.ttl), id: payloadId() }, { done: Rt, resolve: je, reject: Se } = gi$1(T, "Request expired"), te = payloadId(), le = xi$1("session_connect", q.id), Re = xi$1("session_request", te), pe = async ({ error: x, session: L }) => {
        this.events.off(Re, ve), x ? Se(x) : L && je({ session: L });
      }, ve = async (x) => {
        var L, Fe, Qe;
        if (await this.deletePendingAuthRequest(te, { message: "fulfilled", code: 0 }), x.error) {
          const ie = Nt$1("WC_METHOD_UNSUPPORTED", "wc_sessionAuthenticate");
          return x.error.code === ie.code ? void 0 : (this.events.off(le, pe), Se(x.error.message));
        }
        await this.deleteProposal(q.id), this.events.off(le, pe);
        const { cacaos: He, responder: Q } = x.result, Te = [], ze = [];
        for (const ie of He) {
          await is({ cacao: ie, projectId: this.client.core.projectId }) || (this.client.logger.error(ie, "Signature verification failed"), Se(Nt$1("SESSION_SETTLEMENT_FAILED", "Signature verification failed")));
          const { p: qe } = ie, Pe = pe$2(qe.resources), Ye = [dr$1(qe.iss)], vt = De$2(qe.iss);
          if (Pe) {
            const Ne = ds(Pe), It = hs(Pe);
            Te.push(...Ne), Ye.push(...It);
          }
          for (const Ne of Ye) ze.push(`${Ne}:${vt}`);
        }
        const se = await this.client.core.crypto.generateSharedKey(D, Q.publicKey);
        let he;
        Te.length > 0 && (he = { topic: se, acknowledged: true, self: { publicKey: D, metadata: this.client.metadata }, peer: Q, controller: Q.publicKey, expiry: Ei$1(J$1), requiredNamespaces: {}, optionalNamespaces: {}, relay: { protocol: "irn" }, pairingTopic: g, namespaces: ca([...new Set(Te)], [...new Set(ze)]), transportType: r }, await this.client.core.relayer.subscribe(se, { transportType: r }), await this.client.session.set(se, he), g && await this.client.core.pairing.updateMetadata({ topic: g, metadata: Q.metadata }), he = this.client.session.get(se)), (L = this.client.metadata.redirect) != null && L.linkMode && (Fe = Q.metadata.redirect) != null && Fe.linkMode && (Qe = Q.metadata.redirect) != null && Qe.universal && t && (this.client.core.addLinkModeSupportedApp(Q.metadata.redirect.universal), this.client.session.update(se, { transportType: Q$2.link_mode })), je({ auths: He, session: he });
      };
      this.events.once(le, pe), this.events.once(Re, ve);
      let Ie;
      try {
        if (i) {
          const x = formatJsonRpcRequest("wc_sessionAuthenticate", K, te);
          this.client.core.history.set(g, x);
          const L = await this.client.core.crypto.encode("", x, { type: re$2, encoding: xe$1 });
          Ie = Xc(t, g, L);
        } else await Promise.all([this.sendRequest({ topic: g, method: "wc_sessionAuthenticate", params: K, expiry: e.expiry, throwOnFailedPublish: true, clientRpcId: te }), this.sendRequest({ topic: g, method: "wc_sessionPropose", params: q, expiry: N$1.wc_sessionPropose.req.ttl, throwOnFailedPublish: true, clientRpcId: q.id })]);
      } catch (x) {
        throw this.events.off(le, pe), this.events.off(Re, ve), x;
      }
      return await this.setProposal(q.id, q), await this.setAuthRequest(te, { request: b$2(v$2({}, K), { verifyContext: {} }), pairingTopic: g, transportType: r }), { uri: Ie ?? A, response: Rt };
    }), c$1(this, "approveSessionAuthenticate", async (e) => {
      const { id: t, auths: s } = e, i = this.client.core.eventClient.createEvent({ properties: { topic: t.toString(), trace: [ir.authenticated_session_approve_started] } });
      try {
        this.isInitialized();
      } catch (f) {
        throw i.setError(sr.no_internet_connection), f;
      }
      const r = this.getPendingAuthRequest(t);
      if (!r) throw i.setError(sr.authenticated_session_pending_request_not_found), new Error(`Could not find pending auth request with id ${t}`);
      const o = r.transportType || Q$2.relay;
      o === Q$2.relay && await this.confirmOnlineStateOrThrow();
      const a = r.requester.publicKey, l = await this.client.core.crypto.generateKeyPair(), p = Pc(a), h = { type: Ft$2, receiverPublicKey: a, senderPublicKey: l }, u = [], d = [];
      for (const f of s) {
        if (!await is({ cacao: f, projectId: this.client.core.projectId })) {
          i.setError(sr.invalid_cacao);
          const I = Nt$1("SESSION_SETTLEMENT_FAILED", "Signature verification failed");
          throw await this.sendError({ id: t, topic: p, error: I, encodeOpts: h }), new Error(I.message);
        }
        i.addTrace(ir.cacaos_verified);
        const { p: _ } = f, g = pe$2(_.resources), A = [dr$1(_.iss)], D = De$2(_.iss);
        if (g) {
          const I = ds(g), T = hs(g);
          u.push(...I), A.push(...T);
        }
        for (const I of A) d.push(`${I}:${D}`);
      }
      const w = await this.client.core.crypto.generateSharedKey(l, a);
      i.addTrace(ir.create_authenticated_session_topic);
      let m;
      if (u?.length > 0) {
        m = { topic: w, acknowledged: true, self: { publicKey: l, metadata: this.client.metadata }, peer: { publicKey: a, metadata: r.requester.metadata }, controller: a, expiry: Ei$1(J$1), authentication: s, requiredNamespaces: {}, optionalNamespaces: {}, relay: { protocol: "irn" }, pairingTopic: r.pairingTopic, namespaces: ca([...new Set(u)], [...new Set(d)]), transportType: o }, i.addTrace(ir.subscribing_authenticated_session_topic);
        try {
          await this.client.core.relayer.subscribe(w, { transportType: o });
        } catch (f) {
          throw i.setError(sr.subscribe_authenticated_session_topic_failure), f;
        }
        i.addTrace(ir.subscribe_authenticated_session_topic_success), await this.client.session.set(w, m), i.addTrace(ir.store_authenticated_session), await this.client.core.pairing.updateMetadata({ topic: r.pairingTopic, metadata: r.requester.metadata });
      }
      i.addTrace(ir.publishing_authenticated_session_approve);
      try {
        await this.sendResult({ topic: p, id: t, result: { cacaos: s, responder: { publicKey: l, metadata: this.client.metadata } }, encodeOpts: h, throwOnFailedPublish: true, appLink: this.getAppLinkIfEnabled(r.requester.metadata, o) });
      } catch (f) {
        throw i.setError(sr.authenticated_session_approve_publish_failure), f;
      }
      return await this.client.auth.requests.delete(t, { message: "fulfilled", code: 0 }), await this.client.core.pairing.activate({ topic: r.pairingTopic }), this.client.core.eventClient.deleteEvent({ eventId: i.eventId }), { session: m };
    }), c$1(this, "rejectSessionAuthenticate", async (e) => {
      this.isInitialized();
      const { id: t, reason: s } = e, i = this.getPendingAuthRequest(t);
      if (!i) throw new Error(`Could not find pending auth request with id ${t}`);
      i.transportType === Q$2.relay && await this.confirmOnlineStateOrThrow();
      const r = i.requester.publicKey, o = await this.client.core.crypto.generateKeyPair(), a = Pc(r), l = { type: Ft$2, receiverPublicKey: r, senderPublicKey: o };
      await this.sendError({ id: t, topic: a, error: s, encodeOpts: l, rpcOpts: N$1.wc_sessionAuthenticate.reject, appLink: this.getAppLinkIfEnabled(i.requester.metadata, i.transportType) }), await this.client.auth.requests.delete(t, { message: "rejected", code: 0 }), await this.client.proposal.delete(t, Nt$1("USER_DISCONNECTED"));
    }), c$1(this, "formatAuthMessage", (e) => {
      this.isInitialized();
      const { request: t, iss: s } = e;
      return hr$1(t, s);
    }), c$1(this, "processRelayMessageCache", () => {
      setTimeout(async () => {
        if (this.relayMessageCache.length !== 0) for (; this.relayMessageCache.length > 0; ) try {
          const e = this.relayMessageCache.shift();
          e && await this.onRelayMessage(e);
        } catch (e) {
          this.client.logger.error(e);
        }
      }, 50);
    }), c$1(this, "cleanupDuplicatePairings", async (e) => {
      if (e.pairingTopic) try {
        const t = this.client.core.pairing.pairings.get(e.pairingTopic), s = this.client.core.pairing.pairings.getAll().filter((i) => {
          var r, o;
          return ((r = i.peerMetadata) == null ? void 0 : r.url) && ((o = i.peerMetadata) == null ? void 0 : o.url) === e.peer.metadata.url && i.topic && i.topic !== t.topic;
        });
        if (s.length === 0) return;
        this.client.logger.info(`Cleaning up ${s.length} duplicate pairing(s)`), await Promise.all(s.map((i) => this.client.core.pairing.disconnect({ topic: i.topic }))), this.client.logger.info("Duplicate pairings clean up finished");
      } catch (t) {
        this.client.logger.error(t);
      }
    }), c$1(this, "deleteSession", async (e) => {
      var t;
      const { topic: s, expirerHasDeleted: i = false, emitEvent: r = true, id: o = 0 } = e, { self: a } = this.client.session.get(s);
      await this.client.core.relayer.unsubscribe(s), await this.client.session.delete(s, Nt$1("USER_DISCONNECTED")), this.addToRecentlyDeleted(s, "session"), this.client.core.crypto.keychain.has(a.publicKey) && await this.client.core.crypto.deleteKeyPair(a.publicKey), this.client.core.crypto.keychain.has(s) && await this.client.core.crypto.deleteSymKey(s), i || this.client.core.expirer.del(s), this.client.core.storage.removeItem(Me$1).catch((l) => this.client.logger.warn(l)), this.getPendingSessionRequests().forEach((l) => {
        l.topic === s && this.deletePendingSessionRequest(l.id, Nt$1("USER_DISCONNECTED"));
      }), s === ((t = this.sessionRequestQueue.queue[0]) == null ? void 0 : t.topic) && (this.sessionRequestQueue.state = $$2.idle), r && this.client.events.emit("session_delete", { id: o, topic: s });
    }), c$1(this, "deleteProposal", async (e, t) => {
      if (t) try {
        const s = this.client.proposal.get(e), i = this.client.core.eventClient.getEvent({ topic: s.pairingTopic });
        i?.setError(tr.proposal_expired);
      } catch {
      }
      await Promise.all([this.client.proposal.delete(e, Nt$1("USER_DISCONNECTED")), t ? Promise.resolve() : this.client.core.expirer.del(e)]), this.addToRecentlyDeleted(e, "proposal");
    }), c$1(this, "deletePendingSessionRequest", async (e, t, s = false) => {
      await Promise.all([this.client.pendingRequest.delete(e, t), s ? Promise.resolve() : this.client.core.expirer.del(e)]), this.addToRecentlyDeleted(e, "request"), this.sessionRequestQueue.queue = this.sessionRequestQueue.queue.filter((i) => i.id !== e), s && (this.sessionRequestQueue.state = $$2.idle, this.client.events.emit("session_request_expire", { id: e }));
    }), c$1(this, "deletePendingAuthRequest", async (e, t, s = false) => {
      await Promise.all([this.client.auth.requests.delete(e, t), s ? Promise.resolve() : this.client.core.expirer.del(e)]);
    }), c$1(this, "setExpiry", async (e, t) => {
      this.client.session.keys.includes(e) && (this.client.core.expirer.set(e, t), await this.client.session.update(e, { expiry: t }));
    }), c$1(this, "setProposal", async (e, t) => {
      this.client.core.expirer.set(e, Ei$1(N$1.wc_sessionPropose.req.ttl)), await this.client.proposal.set(e, t);
    }), c$1(this, "setAuthRequest", async (e, t) => {
      const { request: s, pairingTopic: i, transportType: r = Q$2.relay } = t;
      this.client.core.expirer.set(e, s.expiryTimestamp), await this.client.auth.requests.set(e, { authPayload: s.authPayload, requester: s.requester, expiryTimestamp: s.expiryTimestamp, id: e, pairingTopic: i, verifyContext: s.verifyContext, transportType: r });
    }), c$1(this, "setPendingSessionRequest", async (e) => {
      const { id: t, topic: s, params: i, verifyContext: r } = e, o = i.request.expiryTimestamp || Ei$1(N$1.wc_sessionRequest.req.ttl);
      this.client.core.expirer.set(t, o), await this.client.pendingRequest.set(t, { id: t, topic: s, params: i, verifyContext: r });
    }), c$1(this, "sendRequest", async (e) => {
      const { topic: t, method: s, params: i, expiry: r, relayRpcId: o, clientRpcId: a, throwOnFailedPublish: l, appLink: p, tvf: h } = e, u = formatJsonRpcRequest(s, i, a);
      let d;
      const w = !!p;
      try {
        const _ = w ? xe$1 : qt$2;
        d = await this.client.core.crypto.encode(t, u, { encoding: _ });
      } catch (_) {
        throw await this.cleanup(), this.client.logger.error(`sendRequest() -> core.crypto.encode() for topic ${t} failed`), _;
      }
      let m;
      if (gt$1.includes(s)) {
        const _ = kc(JSON.stringify(u)), g = kc(d);
        m = await this.client.core.verify.register({ id: g, decryptedId: _ });
      }
      const f = N$1[s].req;
      if (f.attestation = m, r && (f.ttl = r), o && (f.id = o), this.client.core.history.set(t, u), w) {
        const _ = Xc(p, t, d);
        await globalThis.Linking.openURL(_, this.client.name);
      } else {
        const _ = N$1[s].req;
        r && (_.ttl = r), o && (_.id = o), _.tvf = b$2(v$2({}, h), { correlationId: u.id }), l ? (_.internal = b$2(v$2({}, _.internal), { throwOnFailedPublish: true }), await this.client.core.relayer.publish(t, d, _)) : this.client.core.relayer.publish(t, d, _).catch((g) => this.client.logger.error(g));
      }
      return u.id;
    }), c$1(this, "sendResult", async (e) => {
      const { id: t, topic: s, result: i, throwOnFailedPublish: r, encodeOpts: o, appLink: a } = e, l = formatJsonRpcResult(t, i);
      let p;
      const h = a && typeof (globalThis == null ? void 0 : globalThis.Linking) < "u";
      try {
        const w = h ? xe$1 : qt$2;
        p = await this.client.core.crypto.encode(s, l, b$2(v$2({}, o || {}), { encoding: w }));
      } catch (w) {
        throw await this.cleanup(), this.client.logger.error(`sendResult() -> core.crypto.encode() for topic ${s} failed`), w;
      }
      let u, d;
      try {
        u = await this.client.core.history.get(s, t);
        const w = u.request;
        try {
          this.shouldSetTVF(w.method, w.params) && (d = this.getTVFParams(t, w.params, i));
        } catch (m) {
          this.client.logger.warn("sendResult() -> getTVFParams() failed", m);
        }
      } catch (w) {
        throw this.client.logger.error(`sendResult() -> history.get(${s}, ${t}) failed`), w;
      }
      if (h) {
        const w = Xc(a, s, p);
        await globalThis.Linking.openURL(w, this.client.name);
      } else {
        const w = u.request.method, m = N$1[w].res;
        m.tvf = b$2(v$2({}, d), { correlationId: t }), r ? (m.internal = b$2(v$2({}, m.internal), { throwOnFailedPublish: true }), await this.client.core.relayer.publish(s, p, m)) : this.client.core.relayer.publish(s, p, m).catch((f) => this.client.logger.error(f));
      }
      await this.client.core.history.resolve(l);
    }), c$1(this, "sendError", async (e) => {
      const { id: t, topic: s, error: i, encodeOpts: r, rpcOpts: o, appLink: a } = e, l = formatJsonRpcError(t, i);
      let p;
      const h = a && typeof (globalThis == null ? void 0 : globalThis.Linking) < "u";
      try {
        const d = h ? xe$1 : qt$2;
        p = await this.client.core.crypto.encode(s, l, b$2(v$2({}, r || {}), { encoding: d }));
      } catch (d) {
        throw await this.cleanup(), this.client.logger.error(`sendError() -> core.crypto.encode() for topic ${s} failed`), d;
      }
      let u;
      try {
        u = await this.client.core.history.get(s, t);
      } catch (d) {
        throw this.client.logger.error(`sendError() -> history.get(${s}, ${t}) failed`), d;
      }
      if (h) {
        const d = Xc(a, s, p);
        await globalThis.Linking.openURL(d, this.client.name);
      } else {
        const d = u.request.method, w = o || N$1[d].res;
        this.client.core.relayer.publish(s, p, w);
      }
      await this.client.core.history.resolve(l);
    }), c$1(this, "cleanup", async () => {
      const e = [], t = [];
      this.client.session.getAll().forEach((s) => {
        let i = false;
        vi$1(s.expiry) && (i = true), this.client.core.crypto.keychain.has(s.topic) || (i = true), i && e.push(s.topic);
      }), this.client.proposal.getAll().forEach((s) => {
        vi$1(s.expiryTimestamp) && t.push(s.id);
      }), await Promise.all([...e.map((s) => this.deleteSession({ topic: s })), ...t.map((s) => this.deleteProposal(s))]);
    }), c$1(this, "onProviderMessageEvent", async (e) => {
      !this.initialized || this.relayMessageCache.length > 0 ? this.relayMessageCache.push(e) : await this.onRelayMessage(e);
    }), c$1(this, "onRelayEventRequest", async (e) => {
      this.requestQueue.queue.push(e), await this.processRequestsQueue();
    }), c$1(this, "processRequestsQueue", async () => {
      if (this.requestQueue.state === $$2.active) {
        this.client.logger.info("Request queue already active, skipping...");
        return;
      }
      for (this.client.logger.info(`Request queue starting with ${this.requestQueue.queue.length} requests`); this.requestQueue.queue.length > 0; ) {
        this.requestQueue.state = $$2.active;
        const e = this.requestQueue.queue.shift();
        if (e) try {
          await this.processRequest(e);
        } catch (t) {
          this.client.logger.warn(t);
        }
      }
      this.requestQueue.state = $$2.idle;
    }), c$1(this, "processRequest", async (e) => {
      const { topic: t, payload: s, attestation: i, transportType: r, encryptedId: o } = e, a = s.method;
      if (!this.shouldIgnorePairingRequest({ topic: t, requestMethod: a })) switch (a) {
        case "wc_sessionPropose":
          return await this.onSessionProposeRequest({ topic: t, payload: s, attestation: i, encryptedId: o });
        case "wc_sessionSettle":
          return await this.onSessionSettleRequest(t, s);
        case "wc_sessionUpdate":
          return await this.onSessionUpdateRequest(t, s);
        case "wc_sessionExtend":
          return await this.onSessionExtendRequest(t, s);
        case "wc_sessionPing":
          return await this.onSessionPingRequest(t, s);
        case "wc_sessionDelete":
          return await this.onSessionDeleteRequest(t, s);
        case "wc_sessionRequest":
          return await this.onSessionRequest({ topic: t, payload: s, attestation: i, encryptedId: o, transportType: r });
        case "wc_sessionEvent":
          return await this.onSessionEventRequest(t, s);
        case "wc_sessionAuthenticate":
          return await this.onSessionAuthenticateRequest({ topic: t, payload: s, attestation: i, encryptedId: o, transportType: r });
        default:
          return this.client.logger.info(`Unsupported request method ${a}`);
      }
    }), c$1(this, "onRelayEventResponse", async (e) => {
      const { topic: t, payload: s, transportType: i } = e, r = (await this.client.core.history.get(t, s.id)).request.method;
      switch (r) {
        case "wc_sessionPropose":
          return this.onSessionProposeResponse(t, s, i);
        case "wc_sessionSettle":
          return this.onSessionSettleResponse(t, s);
        case "wc_sessionUpdate":
          return this.onSessionUpdateResponse(t, s);
        case "wc_sessionExtend":
          return this.onSessionExtendResponse(t, s);
        case "wc_sessionPing":
          return this.onSessionPingResponse(t, s);
        case "wc_sessionRequest":
          return this.onSessionRequestResponse(t, s);
        case "wc_sessionAuthenticate":
          return this.onSessionAuthenticateResponse(t, s);
        default:
          return this.client.logger.info(`Unsupported response method ${r}`);
      }
    }), c$1(this, "onRelayEventUnknownPayload", (e) => {
      const { topic: t } = e, { message: s } = ht$2("MISSING_OR_INVALID", `Decoded payload on topic ${t} is not identifiable as a JSON-RPC request or a response.`);
      throw new Error(s);
    }), c$1(this, "shouldIgnorePairingRequest", (e) => {
      const { topic: t, requestMethod: s } = e, i = this.expectedPairingMethodMap.get(t);
      return !i || i.includes(s) ? false : !!(i.includes("wc_sessionAuthenticate") && this.client.events.listenerCount("session_authenticate") > 0);
    }), c$1(this, "onSessionProposeRequest", async (e) => {
      const { topic: t, payload: s, attestation: i, encryptedId: r } = e, { params: o, id: a } = s;
      try {
        const l = this.client.core.eventClient.getEvent({ topic: t });
        this.client.events.listenerCount("session_proposal") === 0 && (console.warn("No listener for session_proposal event"), l?.setError(Y$2.proposal_listener_not_found)), this.isValidConnect(v$2({}, s.params));
        const p = o.expiryTimestamp || Ei$1(N$1.wc_sessionPropose.req.ttl), h = v$2({ id: a, pairingTopic: t, expiryTimestamp: p }, o);
        await this.setProposal(a, h);
        const u = await this.getVerifyContext({ attestationId: i, hash: kc(JSON.stringify(s)), encryptedId: r, metadata: h.proposer.metadata });
        l?.addTrace(G$1.emit_session_proposal), this.client.events.emit("session_proposal", { id: a, params: h, verifyContext: u });
      } catch (l) {
        await this.sendError({ id: a, topic: t, error: l, rpcOpts: N$1.wc_sessionPropose.autoReject }), this.client.logger.error(l);
      }
    }), c$1(this, "onSessionProposeResponse", async (e, t, s) => {
      const { id: i } = t;
      if (isJsonRpcResult(t)) {
        const { result: r } = t;
        this.client.logger.trace({ type: "method", method: "onSessionProposeResponse", result: r });
        const o = this.client.proposal.get(i);
        this.client.logger.trace({ type: "method", method: "onSessionProposeResponse", proposal: o });
        const a = o.proposer.publicKey;
        this.client.logger.trace({ type: "method", method: "onSessionProposeResponse", selfPublicKey: a });
        const l = r.responderPublicKey;
        this.client.logger.trace({ type: "method", method: "onSessionProposeResponse", peerPublicKey: l });
        const p = await this.client.core.crypto.generateSharedKey(a, l);
        this.pendingSessions.set(i, { sessionTopic: p, pairingTopic: e, proposalId: i, publicKey: a });
        const h = await this.client.core.relayer.subscribe(p, { transportType: s });
        this.client.logger.trace({ type: "method", method: "onSessionProposeResponse", subscriptionId: h }), await this.client.core.pairing.activate({ topic: e });
      } else if (isJsonRpcError(t)) {
        await this.client.proposal.delete(i, Nt$1("USER_DISCONNECTED"));
        const r = xi$1("session_connect", i);
        if (this.events.listenerCount(r) === 0) throw new Error(`emitting ${r} without any listeners, 954`);
        this.events.emit(r, { error: t.error });
      }
    }), c$1(this, "onSessionSettleRequest", async (e, t) => {
      const { id: s, params: i } = t;
      try {
        this.isValidSessionSettleRequest(i);
        const { relay: r, controller: o, expiry: a, namespaces: l, sessionProperties: p, scopedProperties: h, sessionConfig: u } = t.params, d = [...this.pendingSessions.values()].find((f) => f.sessionTopic === e);
        if (!d) return this.client.logger.error(`Pending session not found for topic ${e}`);
        const w = this.client.proposal.get(d.proposalId), m = b$2(v$2(v$2(v$2({ topic: e, relay: r, expiry: a, namespaces: l, acknowledged: true, pairingTopic: d.pairingTopic, requiredNamespaces: w.requiredNamespaces, optionalNamespaces: w.optionalNamespaces, controller: o.publicKey, self: { publicKey: d.publicKey, metadata: this.client.metadata }, peer: { publicKey: o.publicKey, metadata: o.metadata } }, p && { sessionProperties: p }), h && { scopedProperties: h }), u && { sessionConfig: u }), { transportType: Q$2.relay });
        await this.client.session.set(m.topic, m), await this.setExpiry(m.topic, m.expiry), await this.client.core.pairing.updateMetadata({ topic: d.pairingTopic, metadata: m.peer.metadata }), this.client.events.emit("session_connect", { session: m }), this.events.emit(xi$1("session_connect", d.proposalId), { session: m }), this.pendingSessions.delete(d.proposalId), this.deleteProposal(d.proposalId, false), this.cleanupDuplicatePairings(m), await this.sendResult({ id: t.id, topic: e, result: true, throwOnFailedPublish: true });
      } catch (r) {
        await this.sendError({ id: s, topic: e, error: r }), this.client.logger.error(r);
      }
    }), c$1(this, "onSessionSettleResponse", async (e, t) => {
      const { id: s } = t;
      isJsonRpcResult(t) ? (await this.client.session.update(e, { acknowledged: true }), this.events.emit(xi$1("session_approve", s), {})) : isJsonRpcError(t) && (await this.client.session.delete(e, Nt$1("USER_DISCONNECTED")), this.events.emit(xi$1("session_approve", s), { error: t.error }));
    }), c$1(this, "onSessionUpdateRequest", async (e, t) => {
      const { params: s, id: i } = t;
      try {
        const r = `${e}_session_update`, o = Ra.get(r);
        if (o && this.isRequestOutOfSync(o, i)) {
          this.client.logger.warn(`Discarding out of sync request - ${i}`), this.sendError({ id: i, topic: e, error: Nt$1("INVALID_UPDATE_REQUEST") });
          return;
        }
        this.isValidUpdate(v$2({ topic: e }, s));
        try {
          Ra.set(r, i), await this.client.session.update(e, { namespaces: s.namespaces }), await this.sendResult({ id: i, topic: e, result: true, throwOnFailedPublish: true });
        } catch (a) {
          throw Ra.delete(r), a;
        }
        this.client.events.emit("session_update", { id: i, topic: e, params: s });
      } catch (r) {
        await this.sendError({ id: i, topic: e, error: r }), this.client.logger.error(r);
      }
    }), c$1(this, "isRequestOutOfSync", (e, t) => t.toString().slice(0, -3) < e.toString().slice(0, -3)), c$1(this, "onSessionUpdateResponse", (e, t) => {
      const { id: s } = t, i = xi$1("session_update", s);
      if (this.events.listenerCount(i) === 0) throw new Error(`emitting ${i} without any listeners`);
      isJsonRpcResult(t) ? this.events.emit(xi$1("session_update", s), {}) : isJsonRpcError(t) && this.events.emit(xi$1("session_update", s), { error: t.error });
    }), c$1(this, "onSessionExtendRequest", async (e, t) => {
      const { id: s } = t;
      try {
        this.isValidExtend({ topic: e }), await this.setExpiry(e, Ei$1(J$1)), await this.sendResult({ id: s, topic: e, result: true, throwOnFailedPublish: true }), this.client.events.emit("session_extend", { id: s, topic: e });
      } catch (i) {
        await this.sendError({ id: s, topic: e, error: i }), this.client.logger.error(i);
      }
    }), c$1(this, "onSessionExtendResponse", (e, t) => {
      const { id: s } = t, i = xi$1("session_extend", s);
      if (this.events.listenerCount(i) === 0) throw new Error(`emitting ${i} without any listeners`);
      isJsonRpcResult(t) ? this.events.emit(xi$1("session_extend", s), {}) : isJsonRpcError(t) && this.events.emit(xi$1("session_extend", s), { error: t.error });
    }), c$1(this, "onSessionPingRequest", async (e, t) => {
      const { id: s } = t;
      try {
        this.isValidPing({ topic: e }), await this.sendResult({ id: s, topic: e, result: true, throwOnFailedPublish: true }), this.client.events.emit("session_ping", { id: s, topic: e });
      } catch (i) {
        await this.sendError({ id: s, topic: e, error: i }), this.client.logger.error(i);
      }
    }), c$1(this, "onSessionPingResponse", (e, t) => {
      const { id: s } = t, i = xi$1("session_ping", s);
      setTimeout(() => {
        if (this.events.listenerCount(i) === 0) throw new Error(`emitting ${i} without any listeners 2176`);
        isJsonRpcResult(t) ? this.events.emit(xi$1("session_ping", s), {}) : isJsonRpcError(t) && this.events.emit(xi$1("session_ping", s), { error: t.error });
      }, 500);
    }), c$1(this, "onSessionDeleteRequest", async (e, t) => {
      const { id: s } = t;
      try {
        this.isValidDisconnect({ topic: e, reason: t.params }), Promise.all([new Promise((i) => {
          this.client.core.relayer.once(C$2.publish, async () => {
            i(await this.deleteSession({ topic: e, id: s }));
          });
        }), this.sendResult({ id: s, topic: e, result: true, throwOnFailedPublish: true }), this.cleanupPendingSentRequestsForTopic({ topic: e, error: Nt$1("USER_DISCONNECTED") })]).catch((i) => this.client.logger.error(i));
      } catch (i) {
        this.client.logger.error(i);
      }
    }), c$1(this, "onSessionRequest", async (e) => {
      var t, s, i;
      const { topic: r, payload: o, attestation: a, encryptedId: l, transportType: p } = e, { id: h, params: u } = o;
      try {
        await this.isValidRequest(v$2({ topic: r }, u));
        const d = this.client.session.get(r), w = await this.getVerifyContext({ attestationId: a, hash: kc(JSON.stringify(formatJsonRpcRequest("wc_sessionRequest", u, h))), encryptedId: l, metadata: d.peer.metadata, transportType: p }), m = { id: h, topic: r, params: u, verifyContext: w };
        await this.setPendingSessionRequest(m), p === Q$2.link_mode && (t = d.peer.metadata.redirect) != null && t.universal && this.client.core.addLinkModeSupportedApp((s = d.peer.metadata.redirect) == null ? void 0 : s.universal), (i = this.client.signConfig) != null && i.disableRequestQueue ? this.emitSessionRequest(m) : (this.addSessionRequestToSessionRequestQueue(m), this.processSessionRequestQueue());
      } catch (d) {
        await this.sendError({ id: h, topic: r, error: d }), this.client.logger.error(d);
      }
    }), c$1(this, "onSessionRequestResponse", (e, t) => {
      const { id: s } = t, i = xi$1("session_request", s);
      if (this.events.listenerCount(i) === 0) throw new Error(`emitting ${i} without any listeners`);
      isJsonRpcResult(t) ? this.events.emit(xi$1("session_request", s), { result: t.result }) : isJsonRpcError(t) && this.events.emit(xi$1("session_request", s), { error: t.error });
    }), c$1(this, "onSessionEventRequest", async (e, t) => {
      const { id: s, params: i } = t;
      try {
        const r = `${e}_session_event_${i.event.name}`, o = Ra.get(r);
        if (o && this.isRequestOutOfSync(o, s)) {
          this.client.logger.info(`Discarding out of sync request - ${s}`);
          return;
        }
        this.isValidEmit(v$2({ topic: e }, i)), this.client.events.emit("session_event", { id: s, topic: e, params: i }), Ra.set(r, s);
      } catch (r) {
        await this.sendError({ id: s, topic: e, error: r }), this.client.logger.error(r);
      }
    }), c$1(this, "onSessionAuthenticateResponse", (e, t) => {
      const { id: s } = t;
      this.client.logger.trace({ type: "method", method: "onSessionAuthenticateResponse", topic: e, payload: t }), isJsonRpcResult(t) ? this.events.emit(xi$1("session_request", s), { result: t.result }) : isJsonRpcError(t) && this.events.emit(xi$1("session_request", s), { error: t.error });
    }), c$1(this, "onSessionAuthenticateRequest", async (e) => {
      var t;
      const { topic: s, payload: i, attestation: r, encryptedId: o, transportType: a } = e;
      try {
        const { requester: l, authPayload: p, expiryTimestamp: h } = i.params, u = await this.getVerifyContext({ attestationId: r, hash: kc(JSON.stringify(i)), encryptedId: o, metadata: l.metadata, transportType: a }), d = { requester: l, pairingTopic: s, id: i.id, authPayload: p, verifyContext: u, expiryTimestamp: h };
        await this.setAuthRequest(i.id, { request: d, pairingTopic: s, transportType: a }), a === Q$2.link_mode && (t = l.metadata.redirect) != null && t.universal && this.client.core.addLinkModeSupportedApp(l.metadata.redirect.universal), this.client.events.emit("session_authenticate", { topic: s, params: i.params, id: i.id, verifyContext: u });
      } catch (l) {
        this.client.logger.error(l);
        const p = i.params.requester.publicKey, h = await this.client.core.crypto.generateKeyPair(), u = this.getAppLinkIfEnabled(i.params.requester.metadata, a), d = { type: Ft$2, receiverPublicKey: p, senderPublicKey: h };
        await this.sendError({ id: i.id, topic: s, error: l, encodeOpts: d, rpcOpts: N$1.wc_sessionAuthenticate.autoReject, appLink: u });
      }
    }), c$1(this, "addSessionRequestToSessionRequestQueue", (e) => {
      this.sessionRequestQueue.queue.push(e);
    }), c$1(this, "cleanupAfterResponse", (e) => {
      this.deletePendingSessionRequest(e.response.id, { message: "fulfilled", code: 0 }), setTimeout(() => {
        this.sessionRequestQueue.state = $$2.idle, this.processSessionRequestQueue();
      }, cjs$3.toMiliseconds(this.requestQueueDelay));
    }), c$1(this, "cleanupPendingSentRequestsForTopic", ({ topic: e, error: t }) => {
      const s = this.client.core.history.pending;
      s.length > 0 && s.filter((i) => i.topic === e && i.request.method === "wc_sessionRequest").forEach((i) => {
        const r = i.request.id, o = xi$1("session_request", r);
        if (this.events.listenerCount(o) === 0) throw new Error(`emitting ${o} without any listeners`);
        this.events.emit(xi$1("session_request", i.request.id), { error: t });
      });
    }), c$1(this, "processSessionRequestQueue", () => {
      if (this.sessionRequestQueue.state === $$2.active) {
        this.client.logger.info("session request queue is already active.");
        return;
      }
      const e = this.sessionRequestQueue.queue[0];
      if (!e) {
        this.client.logger.info("session request queue is empty.");
        return;
      }
      try {
        this.sessionRequestQueue.state = $$2.active, this.emitSessionRequest(e);
      } catch (t) {
        this.client.logger.error(t);
      }
    }), c$1(this, "emitSessionRequest", (e) => {
      this.client.events.emit("session_request", e);
    }), c$1(this, "onPairingCreated", (e) => {
      if (e.methods && this.expectedPairingMethodMap.set(e.topic, e.methods), e.active) return;
      const t = this.client.proposal.getAll().find((s) => s.pairingTopic === e.topic);
      t && this.onSessionProposeRequest({ topic: e.topic, payload: formatJsonRpcRequest("wc_sessionPropose", b$2(v$2({}, t), { requiredNamespaces: t.requiredNamespaces, optionalNamespaces: t.optionalNamespaces, relays: t.relays, proposer: t.proposer, sessionProperties: t.sessionProperties, scopedProperties: t.scopedProperties }), t.id) });
    }), c$1(this, "isValidConnect", async (e) => {
      if (!ma(e)) {
        const { message: l } = ht$2("MISSING_OR_INVALID", `connect() params: ${JSON.stringify(e)}`);
        throw new Error(l);
      }
      const { pairingTopic: t, requiredNamespaces: s, optionalNamespaces: i, sessionProperties: r, scopedProperties: o, relays: a } = e;
      if (Et$2(t) || await this.isValidPairingTopic(t), !ga(a)) {
        const { message: l } = ht$2("MISSING_OR_INVALID", `connect() relays: ${a}`);
        throw new Error(l);
      }
      if (!Et$2(s) && Oe$1(s) !== 0) {
        const l = "requiredNamespaces are deprecated and are automatically assigned to optionalNamespaces";
        ["fatal", "error", "silent"].includes(this.client.logger.level) ? console.warn(l) : this.client.logger.warn(l), this.validateNamespaces(s, "requiredNamespaces");
      }
      if (!Et$2(i) && Oe$1(i) !== 0 && this.validateNamespaces(i, "optionalNamespaces"), Et$2(r) || this.validateSessionProps(r, "sessionProperties"), !Et$2(o)) {
        this.validateSessionProps(o, "scopedProperties");
        const l = Object.keys(s || {}).concat(Object.keys(i || {}));
        if (!Object.keys(o).every((p) => l.includes(p))) throw new Error(`Scoped properties must be a subset of required/optional namespaces, received: ${JSON.stringify(o)}, required/optional namespaces: ${JSON.stringify(l)}`);
      }
    }), c$1(this, "validateNamespaces", (e, t) => {
      const s = pa(e, "connect()", t);
      if (s) throw new Error(s.message);
    }), c$1(this, "isValidApprove", async (e) => {
      if (!ma(e)) throw new Error(ht$2("MISSING_OR_INVALID", `approve() params: ${e}`).message);
      const { id: t, namespaces: s, relayProtocol: i, sessionProperties: r, scopedProperties: o } = e;
      this.checkRecentlyDeleted(t), await this.isValidProposalId(t);
      const a = this.client.proposal.get(t), l = Bo$1(s, "approve()");
      if (l) throw new Error(l.message);
      const p = No$1(a.requiredNamespaces, s, "approve()");
      if (p) throw new Error(p.message);
      if (!nt$2(i, true)) {
        const { message: h } = ht$2("MISSING_OR_INVALID", `approve() relayProtocol: ${i}`);
        throw new Error(h);
      }
      if (Et$2(r) || this.validateSessionProps(r, "sessionProperties"), !Et$2(o)) {
        this.validateSessionProps(o, "scopedProperties");
        const h = new Set(Object.keys(s));
        if (!Object.keys(o).every((u) => h.has(u))) throw new Error(`Scoped properties must be a subset of approved namespaces, received: ${JSON.stringify(o)}, approved namespaces: ${Array.from(h).join(", ")}`);
      }
    }), c$1(this, "isValidReject", async (e) => {
      if (!ma(e)) {
        const { message: i } = ht$2("MISSING_OR_INVALID", `reject() params: ${e}`);
        throw new Error(i);
      }
      const { id: t, reason: s } = e;
      if (this.checkRecentlyDeleted(t), await this.isValidProposalId(t), !wa(s)) {
        const { message: i } = ht$2("MISSING_OR_INVALID", `reject() reason: ${JSON.stringify(s)}`);
        throw new Error(i);
      }
    }), c$1(this, "isValidSessionSettleRequest", (e) => {
      if (!ma(e)) {
        const { message: l } = ht$2("MISSING_OR_INVALID", `onSessionSettleRequest() params: ${e}`);
        throw new Error(l);
      }
      const { relay: t, controller: s, namespaces: i, expiry: r } = e;
      if (!Io$1(t)) {
        const { message: l } = ht$2("MISSING_OR_INVALID", "onSessionSettleRequest() relay protocol should be a string");
        throw new Error(l);
      }
      const o = ha(s, "onSessionSettleRequest()");
      if (o) throw new Error(o.message);
      const a = Bo$1(i, "onSessionSettleRequest()");
      if (a) throw new Error(a.message);
      if (vi$1(r)) {
        const { message: l } = ht$2("EXPIRED", "onSessionSettleRequest()");
        throw new Error(l);
      }
    }), c$1(this, "isValidUpdate", async (e) => {
      if (!ma(e)) {
        const { message: a } = ht$2("MISSING_OR_INVALID", `update() params: ${e}`);
        throw new Error(a);
      }
      const { topic: t, namespaces: s } = e;
      this.checkRecentlyDeleted(t), await this.isValidSessionTopic(t);
      const i = this.client.session.get(t), r = Bo$1(s, "update()");
      if (r) throw new Error(r.message);
      const o = No$1(i.requiredNamespaces, s, "update()");
      if (o) throw new Error(o.message);
    }), c$1(this, "isValidExtend", async (e) => {
      if (!ma(e)) {
        const { message: s } = ht$2("MISSING_OR_INVALID", `extend() params: ${e}`);
        throw new Error(s);
      }
      const { topic: t } = e;
      this.checkRecentlyDeleted(t), await this.isValidSessionTopic(t);
    }), c$1(this, "isValidRequest", async (e) => {
      if (!ma(e)) {
        const { message: a } = ht$2("MISSING_OR_INVALID", `request() params: ${e}`);
        throw new Error(a);
      }
      const { topic: t, request: s, chainId: i, expiry: r } = e;
      this.checkRecentlyDeleted(t), await this.isValidSessionTopic(t);
      const { namespaces: o } = this.client.session.get(t);
      if (!xa(o, i)) {
        const { message: a } = ht$2("MISSING_OR_INVALID", `request() chainId: ${i}`);
        throw new Error(a);
      }
      if (!ba(s)) {
        const { message: a } = ht$2("MISSING_OR_INVALID", `request() ${JSON.stringify(s)}`);
        throw new Error(a);
      }
      if (!Sa(o, i, s.method)) {
        const { message: a } = ht$2("MISSING_OR_INVALID", `request() method: ${s.method}`);
        throw new Error(a);
      }
      if (r && !Ia(r, _e$1)) {
        const { message: a } = ht$2("MISSING_OR_INVALID", `request() expiry: ${r}. Expiry must be a number (in seconds) between ${_e$1.min} and ${_e$1.max}`);
        throw new Error(a);
      }
    }), c$1(this, "isValidRespond", async (e) => {
      var t;
      if (!ma(e)) {
        const { message: r } = ht$2("MISSING_OR_INVALID", `respond() params: ${e}`);
        throw new Error(r);
      }
      const { topic: s, response: i } = e;
      try {
        await this.isValidSessionTopic(s);
      } catch (r) {
        throw (t = e?.response) != null && t.id && this.cleanupAfterResponse(e), r;
      }
      if (!Ea(i)) {
        const { message: r } = ht$2("MISSING_OR_INVALID", `respond() response: ${JSON.stringify(i)}`);
        throw new Error(r);
      }
    }), c$1(this, "isValidPing", async (e) => {
      if (!ma(e)) {
        const { message: s } = ht$2("MISSING_OR_INVALID", `ping() params: ${e}`);
        throw new Error(s);
      }
      const { topic: t } = e;
      await this.isValidSessionOrPairingTopic(t);
    }), c$1(this, "isValidEmit", async (e) => {
      if (!ma(e)) {
        const { message: o } = ht$2("MISSING_OR_INVALID", `emit() params: ${e}`);
        throw new Error(o);
      }
      const { topic: t, event: s, chainId: i } = e;
      await this.isValidSessionTopic(t);
      const { namespaces: r } = this.client.session.get(t);
      if (!xa(r, i)) {
        const { message: o } = ht$2("MISSING_OR_INVALID", `emit() chainId: ${i}`);
        throw new Error(o);
      }
      if (!va(s)) {
        const { message: o } = ht$2("MISSING_OR_INVALID", `emit() event: ${JSON.stringify(s)}`);
        throw new Error(o);
      }
      if (!Oa(r, i, s.name)) {
        const { message: o } = ht$2("MISSING_OR_INVALID", `emit() event: ${JSON.stringify(s)}`);
        throw new Error(o);
      }
    }), c$1(this, "isValidDisconnect", async (e) => {
      if (!ma(e)) {
        const { message: s } = ht$2("MISSING_OR_INVALID", `disconnect() params: ${e}`);
        throw new Error(s);
      }
      const { topic: t } = e;
      await this.isValidSessionOrPairingTopic(t);
    }), c$1(this, "isValidAuthenticate", (e) => {
      const { chains: t, uri: s, domain: i, nonce: r } = e;
      if (!Array.isArray(t) || t.length === 0) throw new Error("chains is required and must be a non-empty array");
      if (!nt$2(s, false)) throw new Error("uri is required parameter");
      if (!nt$2(i, false)) throw new Error("domain is required parameter");
      if (!nt$2(r, false)) throw new Error("nonce is required parameter");
      if ([...new Set(t.map((a) => Ne$1(a).namespace))].length > 1) throw new Error("Multi-namespace requests are not supported. Please request single namespace only.");
      const { namespace: o } = Ne$1(t[0]);
      if (o !== "eip155") throw new Error("Only eip155 namespace is supported for authenticated sessions. Please use .connect() for non-eip155 chains.");
    }), c$1(this, "getVerifyContext", async (e) => {
      const { attestationId: t, hash: s, encryptedId: i, metadata: r, transportType: o } = e, a = { verified: { verifyUrl: r.verifyUrl || ue$1, validation: "UNKNOWN", origin: r.url || "" } };
      try {
        if (o === Q$2.link_mode) {
          const p = this.getAppLinkIfEnabled(r, o);
          return a.verified.validation = p && new URL(p).origin === new URL(r.url).origin ? "VALID" : "INVALID", a;
        }
        const l = await this.client.core.verify.resolve({ attestationId: t, hash: s, encryptedId: i, verifyUrl: r.verifyUrl });
        l && (a.verified.origin = l.origin, a.verified.isScam = l.isScam, a.verified.validation = l.origin === new URL(r.url).origin ? "VALID" : "INVALID");
      } catch (l) {
        this.client.logger.warn(l);
      }
      return this.client.logger.debug(`Verify context: ${JSON.stringify(a)}`), a;
    }), c$1(this, "validateSessionProps", (e, t) => {
      Object.values(e).forEach((s, i) => {
        if (s == null) {
          const { message: r } = ht$2("MISSING_OR_INVALID", `${t} must contain an existing value for each key. Received: ${s} for key ${Object.keys(e)[i]}`);
          throw new Error(r);
        }
      });
    }), c$1(this, "getPendingAuthRequest", (e) => {
      const t = this.client.auth.requests.get(e);
      return typeof t == "object" ? t : void 0;
    }), c$1(this, "addToRecentlyDeleted", (e, t) => {
      if (this.recentlyDeletedMap.set(e, t), this.recentlyDeletedMap.size >= this.recentlyDeletedLimit) {
        let s = 0;
        const i = this.recentlyDeletedLimit / 2;
        for (const r of this.recentlyDeletedMap.keys()) {
          if (s++ >= i) break;
          this.recentlyDeletedMap.delete(r);
        }
      }
    }), c$1(this, "checkRecentlyDeleted", (e) => {
      const t = this.recentlyDeletedMap.get(e);
      if (t) {
        const { message: s } = ht$2("MISSING_OR_INVALID", `Record was recently deleted - ${t}: ${e}`);
        throw new Error(s);
      }
    }), c$1(this, "isLinkModeEnabled", (e, t) => {
      var s, i, r, o, a, l, p, h, u;
      return !e || t !== Q$2.link_mode ? false : ((i = (s = this.client.metadata) == null ? void 0 : s.redirect) == null ? void 0 : i.linkMode) === true && ((o = (r = this.client.metadata) == null ? void 0 : r.redirect) == null ? void 0 : o.universal) !== void 0 && ((l = (a = this.client.metadata) == null ? void 0 : a.redirect) == null ? void 0 : l.universal) !== "" && ((p = e?.redirect) == null ? void 0 : p.universal) !== void 0 && ((h = e?.redirect) == null ? void 0 : h.universal) !== "" && ((u = e?.redirect) == null ? void 0 : u.linkMode) === true && this.client.core.linkModeSupportedApps.includes(e.redirect.universal) && typeof (globalThis == null ? void 0 : globalThis.Linking) < "u";
    }), c$1(this, "getAppLinkIfEnabled", (e, t) => {
      var s;
      return this.isLinkModeEnabled(e, t) ? (s = e?.redirect) == null ? void 0 : s.universal : void 0;
    }), c$1(this, "handleLinkModeMessage", ({ url: e }) => {
      if (!e || !e.includes("wc_ev") || !e.includes("topic")) return;
      const t = Ai$1(e, "topic") || "", s = decodeURIComponent(Ai$1(e, "wc_ev") || ""), i = this.client.session.keys.includes(t);
      i && this.client.session.update(t, { transportType: Q$2.link_mode }), this.client.core.dispatchEnvelope({ topic: t, message: s, sessionExists: i });
    }), c$1(this, "registerLinkModeListeners", async () => {
      var e;
      if (Ii$1() || pt$2() && (e = this.client.metadata.redirect) != null && e.linkMode) {
        const t = globalThis == null ? void 0 : globalThis.Linking;
        if (typeof t < "u") {
          t.addEventListener("url", this.handleLinkModeMessage, this.client.name);
          const s = await t.getInitialURL();
          s && setTimeout(() => {
            this.handleLinkModeMessage({ url: s });
          }, 50);
        }
      }
    }), c$1(this, "shouldSetTVF", (e, t) => {
      if (!t || e !== "wc_sessionRequest") return false;
      const { request: s } = t;
      return Object.keys(Ke$1).includes(s.method);
    }), c$1(this, "getTVFParams", (e, t, s) => {
      var i, r;
      try {
        const o = t.request.method, a = this.extractTxHashesFromResult(o, s);
        return b$2(v$2({ correlationId: e, rpcMethods: [o], chainId: t.chainId }, this.isValidContractData(t.request.params) && { contractAddresses: [(r = (i = t.request.params) == null ? void 0 : i[0]) == null ? void 0 : r.to] }), { txHashes: a });
      } catch (o) {
        this.client.logger.warn("Error getting TVF params", o);
      }
      return {};
    }), c$1(this, "isValidContractData", (e) => {
      var t;
      if (!e) return false;
      try {
        const s = e?.data || ((t = e?.[0]) == null ? void 0 : t.data);
        if (!s.startsWith("0x")) return false;
        const i = s.slice(2);
        return /^[0-9a-fA-F]*$/.test(i) ? i.length % 2 === 0 : false;
      } catch {
      }
      return false;
    }), c$1(this, "extractTxHashesFromResult", (e, t) => {
      try {
        const s = Ke$1[e];
        if (typeof t == "string") return [t];
        const i = t[s.key];
        if (se$2(i)) return e === "solana_signAllTransactions" ? i.map((r) => Ji(r)) : i;
        if (typeof i == "string") return [i];
      } catch (s) {
        this.client.logger.warn("Error extracting tx hashes from result", s);
      }
      return [];
    });
  }
  async processPendingMessageEvents() {
    try {
      const n = this.client.session.keys, e = this.client.core.relayer.messages.getWithoutAck(n);
      for (const [t, s] of Object.entries(e)) for (const i of s) try {
        await this.onProviderMessageEvent({ topic: t, message: i, publishedAt: Date.now() });
      } catch {
        this.client.logger.warn(`Error processing pending message event for topic: ${t}, message: ${i}`);
      }
    } catch (n) {
      this.client.logger.warn("processPendingMessageEvents failed", n);
    }
  }
  isInitialized() {
    if (!this.initialized) {
      const { message: n } = ht$2("NOT_INITIALIZED", this.name);
      throw new Error(n);
    }
  }
  async confirmOnlineStateOrThrow() {
    await this.client.core.relayer.confirmOnlineStateOrThrow();
  }
  registerRelayerEvents() {
    this.client.core.relayer.on(C$2.message, (n) => {
      this.onProviderMessageEvent(n);
    });
  }
  async onRelayMessage(n) {
    const { topic: e, message: t, attestation: s, transportType: i } = n, { publicKey: r } = this.client.auth.authKeys.keys.includes(ce$1) ? this.client.auth.authKeys.get(ce$1) : { publicKey: void 0 };
    try {
      const o = await this.client.core.crypto.decode(e, t, { receiverPublicKey: r, encoding: i === Q$2.link_mode ? xe$1 : qt$2 });
      isJsonRpcRequest(o) ? (this.client.core.history.set(e, o), await this.onRelayEventRequest({ topic: e, payload: o, attestation: s, transportType: i, encryptedId: kc(t) })) : isJsonRpcResponse(o) ? (await this.client.core.history.resolve(o), await this.onRelayEventResponse({ topic: e, payload: o, transportType: i }), this.client.core.history.delete(e, o.id)) : await this.onRelayEventUnknownPayload({ topic: e, payload: o, transportType: i }), await this.client.core.relayer.messages.ack(e, t);
    } catch (o) {
      this.client.logger.error(o);
    }
  }
  registerExpirerEvents() {
    this.client.core.expirer.on(M$2.expired, async (n) => {
      const { topic: e, id: t } = bi$1(n.target);
      if (t && this.client.pendingRequest.keys.includes(t)) return await this.deletePendingSessionRequest(t, ht$2("EXPIRED"), true);
      if (t && this.client.auth.requests.keys.includes(t)) return await this.deletePendingAuthRequest(t, ht$2("EXPIRED"), true);
      e ? this.client.session.keys.includes(e) && (await this.deleteSession({ topic: e, expirerHasDeleted: true }), this.client.events.emit("session_expire", { topic: e })) : t && (await this.deleteProposal(t, true), this.client.events.emit("proposal_expire", { id: t }));
    });
  }
  registerPairingEvents() {
    this.client.core.pairing.events.on(re$1.create, (n) => this.onPairingCreated(n)), this.client.core.pairing.events.on(re$1.delete, (n) => {
      this.addToRecentlyDeleted(n.topic, "pairing");
    });
  }
  isValidPairingTopic(n) {
    if (!nt$2(n, false)) {
      const { message: e } = ht$2("MISSING_OR_INVALID", `pairing topic should be a string: ${n}`);
      throw new Error(e);
    }
    if (!this.client.core.pairing.pairings.keys.includes(n)) {
      const { message: e } = ht$2("NO_MATCHING_KEY", `pairing topic doesn't exist: ${n}`);
      throw new Error(e);
    }
    if (vi$1(this.client.core.pairing.pairings.get(n).expiry)) {
      const { message: e } = ht$2("EXPIRED", `pairing topic: ${n}`);
      throw new Error(e);
    }
  }
  async isValidSessionTopic(n) {
    if (!nt$2(n, false)) {
      const { message: e } = ht$2("MISSING_OR_INVALID", `session topic should be a string: ${n}`);
      throw new Error(e);
    }
    if (this.checkRecentlyDeleted(n), !this.client.session.keys.includes(n)) {
      const { message: e } = ht$2("NO_MATCHING_KEY", `session topic doesn't exist: ${n}`);
      throw new Error(e);
    }
    if (vi$1(this.client.session.get(n).expiry)) {
      await this.deleteSession({ topic: n });
      const { message: e } = ht$2("EXPIRED", `session topic: ${n}`);
      throw new Error(e);
    }
    if (!this.client.core.crypto.keychain.has(n)) {
      const { message: e } = ht$2("MISSING_OR_INVALID", `session topic does not exist in keychain: ${n}`);
      throw await this.deleteSession({ topic: n }), new Error(e);
    }
  }
  async isValidSessionOrPairingTopic(n) {
    if (this.checkRecentlyDeleted(n), this.client.session.keys.includes(n)) await this.isValidSessionTopic(n);
    else if (this.client.core.pairing.pairings.keys.includes(n)) this.isValidPairingTopic(n);
    else if (nt$2(n, false)) {
      const { message: e } = ht$2("NO_MATCHING_KEY", `session or pairing topic doesn't exist: ${n}`);
      throw new Error(e);
    } else {
      const { message: e } = ht$2("MISSING_OR_INVALID", `session or pairing topic should be a string: ${n}`);
      throw new Error(e);
    }
  }
  async isValidProposalId(n) {
    if (!ya(n)) {
      const { message: e } = ht$2("MISSING_OR_INVALID", `proposal id should be a number: ${n}`);
      throw new Error(e);
    }
    if (!this.client.proposal.keys.includes(n)) {
      const { message: e } = ht$2("NO_MATCHING_KEY", `proposal id doesn't exist: ${n}`);
      throw new Error(e);
    }
    if (vi$1(this.client.proposal.get(n).expiryTimestamp)) {
      await this.deleteProposal(n);
      const { message: e } = ht$2("EXPIRED", `proposal id: ${n}`);
      throw new Error(e);
    }
  }
}
class Os extends zi {
  constructor(n, e) {
    super(n, e, pt$1, we$1), this.core = n, this.logger = e;
  }
}
let St$1 = class St extends zi {
  constructor(n, e) {
    super(n, e, ht$1, we$1), this.core = n, this.logger = e;
  }
};
class bs extends zi {
  constructor(n, e) {
    super(n, e, ut$1, we$1, (t) => t.id), this.core = n, this.logger = e;
  }
}
class As extends zi {
  constructor(n, e) {
    super(n, e, mt$1, ae$1, () => ce$1), this.core = n, this.logger = e;
  }
}
class xs extends zi {
  constructor(n, e) {
    super(n, e, _t$1, ae$1), this.core = n, this.logger = e;
  }
}
class Cs extends zi {
  constructor(n, e) {
    super(n, e, Et, ae$1, (t) => t.id), this.core = n, this.logger = e;
  }
}
var Vs = Object.defineProperty, Ds = (S, n, e) => n in S ? Vs(S, n, { enumerable: true, configurable: true, writable: true, value: e }) : S[n] = e, Ge$1 = (S, n, e) => Ds(S, typeof n != "symbol" ? n + "" : n, e);
class Ls {
  constructor(n, e) {
    this.core = n, this.logger = e, Ge$1(this, "authKeys"), Ge$1(this, "pairingTopics"), Ge$1(this, "requests"), this.authKeys = new As(this.core, this.logger), this.pairingTopics = new xs(this.core, this.logger), this.requests = new Cs(this.core, this.logger);
  }
  async init() {
    await this.authKeys.init(), await this.pairingTopics.init(), await this.requests.init();
  }
}
var ks = Object.defineProperty, Ms = (S, n, e) => n in S ? ks(S, n, { enumerable: true, configurable: true, writable: true, value: e }) : S[n] = e, E$3 = (S, n, e) => Ms(S, typeof n != "symbol" ? n + "" : n, e);
let Ee$1 = class Ee extends J$2 {
  constructor(n) {
    super(n), E$3(this, "protocol", De$1), E$3(this, "version", Le$1), E$3(this, "name", me$1.name), E$3(this, "metadata"), E$3(this, "core"), E$3(this, "logger"), E$3(this, "events", new eventsExports.EventEmitter()), E$3(this, "engine"), E$3(this, "session"), E$3(this, "proposal"), E$3(this, "pendingRequest"), E$3(this, "auth"), E$3(this, "signConfig"), E$3(this, "on", (t, s) => this.events.on(t, s)), E$3(this, "once", (t, s) => this.events.once(t, s)), E$3(this, "off", (t, s) => this.events.off(t, s)), E$3(this, "removeListener", (t, s) => this.events.removeListener(t, s)), E$3(this, "removeAllListeners", (t) => this.events.removeAllListeners(t)), E$3(this, "connect", async (t) => {
      try {
        return await this.engine.connect(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "pair", async (t) => {
      try {
        return await this.engine.pair(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "approve", async (t) => {
      try {
        return await this.engine.approve(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "reject", async (t) => {
      try {
        return await this.engine.reject(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "update", async (t) => {
      try {
        return await this.engine.update(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "extend", async (t) => {
      try {
        return await this.engine.extend(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "request", async (t) => {
      try {
        return await this.engine.request(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "respond", async (t) => {
      try {
        return await this.engine.respond(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "ping", async (t) => {
      try {
        return await this.engine.ping(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "emit", async (t) => {
      try {
        return await this.engine.emit(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "disconnect", async (t) => {
      try {
        return await this.engine.disconnect(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "find", (t) => {
      try {
        return this.engine.find(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "getPendingSessionRequests", () => {
      try {
        return this.engine.getPendingSessionRequests();
      } catch (t) {
        throw this.logger.error(t.message), t;
      }
    }), E$3(this, "authenticate", async (t, s) => {
      try {
        return await this.engine.authenticate(t, s);
      } catch (i) {
        throw this.logger.error(i.message), i;
      }
    }), E$3(this, "formatAuthMessage", (t) => {
      try {
        return this.engine.formatAuthMessage(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "approveSessionAuthenticate", async (t) => {
      try {
        return await this.engine.approveSessionAuthenticate(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), E$3(this, "rejectSessionAuthenticate", async (t) => {
      try {
        return await this.engine.rejectSessionAuthenticate(t);
      } catch (s) {
        throw this.logger.error(s.message), s;
      }
    }), this.name = n?.name || me$1.name, this.metadata = oi$1(n?.metadata), this.signConfig = n?.signConfig;
    const e = typeof n?.logger < "u" && typeof n?.logger != "string" ? n.logger : Ot$1(k$4({ level: n?.logger || me$1.logger }));
    this.core = n?.core || new Xo(n), this.logger = E$5(e, this.name), this.session = new St$1(this.core, this.logger), this.proposal = new Os(this.core, this.logger), this.pendingRequest = new bs(this.core, this.logger), this.engine = new Ns(this), this.auth = new Ls(this.core, this.logger);
  }
  static async init(n) {
    const e = new Ee(n);
    return await e.initialize(), e;
  }
  get context() {
    return y$3(this.logger);
  }
  get pairing() {
    return this.core.pairing.pairings;
  }
  async initialize() {
    this.logger.trace("Initialized");
    try {
      await this.core.start(), await this.session.init(), await this.proposal.init(), await this.pendingRequest.init(), await this.auth.init(), await this.engine.init(), this.logger.info("SignClient Initialization Success"), setTimeout(() => {
        this.engine.processRelayMessageCache();
      }, cjs$3.toMiliseconds(cjs$3.ONE_SECOND));
    } catch (n) {
      throw this.logger.info("SignClient Initialization Failure"), this.logger.error(n.message), n;
    }
  }
};

var browserPonyfill = {exports: {}};

(function (module, exports) {
	var __global__ = typeof globalThis !== "undefined" && globalThis || typeof self !== "undefined" && self || typeof globalThis !== "undefined" && globalThis;
	var __globalThis__ = function() {
	  function F() {
	    this.fetch = false;
	    this.DOMException = __global__.DOMException;
	  }
	  F.prototype = __global__;
	  return new F();
	}();
	(function(globalThis2) {
	  (function(exports2) {
	    var g = typeof globalThis2 !== "undefined" && globalThis2 || typeof self !== "undefined" && self || // eslint-disable-next-line no-undef
	    typeof globalThis2 !== "undefined" && globalThis2 || {};
	    var support = {
	      searchParams: "URLSearchParams" in g,
	      iterable: "Symbol" in g && "iterator" in Symbol,
	      blob: "FileReader" in g && "Blob" in g && function() {
	        try {
	          new Blob();
	          return true;
	        } catch (e) {
	          return false;
	        }
	      }(),
	      formData: "FormData" in g,
	      arrayBuffer: "ArrayBuffer" in g
	    };
	    function isDataView(obj) {
	      return obj && DataView.prototype.isPrototypeOf(obj);
	    }
	    if (support.arrayBuffer) {
	      var viewClasses = [
	        "[object Int8Array]",
	        "[object Uint8Array]",
	        "[object Uint8ClampedArray]",
	        "[object Int16Array]",
	        "[object Uint16Array]",
	        "[object Int32Array]",
	        "[object Uint32Array]",
	        "[object Float32Array]",
	        "[object Float64Array]"
	      ];
	      var isArrayBufferView = ArrayBuffer.isView || function(obj) {
	        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
	      };
	    }
	    function normalizeName(name) {
	      if (typeof name !== "string") {
	        name = String(name);
	      }
	      if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === "") {
	        throw new TypeError('Invalid character in header field name: "' + name + '"');
	      }
	      return name.toLowerCase();
	    }
	    function normalizeValue(value) {
	      if (typeof value !== "string") {
	        value = String(value);
	      }
	      return value;
	    }
	    function iteratorFor(items) {
	      var iterator = {
	        next: function() {
	          var value = items.shift();
	          return { done: value === void 0, value };
	        }
	      };
	      if (support.iterable) {
	        iterator[Symbol.iterator] = function() {
	          return iterator;
	        };
	      }
	      return iterator;
	    }
	    function Headers(headers) {
	      this.map = {};
	      if (headers instanceof Headers) {
	        headers.forEach(function(value, name) {
	          this.append(name, value);
	        }, this);
	      } else if (Array.isArray(headers)) {
	        headers.forEach(function(header) {
	          if (header.length != 2) {
	            throw new TypeError("Headers constructor: expected name/value pair to be length 2, found" + header.length);
	          }
	          this.append(header[0], header[1]);
	        }, this);
	      } else if (headers) {
	        Object.getOwnPropertyNames(headers).forEach(function(name) {
	          this.append(name, headers[name]);
	        }, this);
	      }
	    }
	    Headers.prototype.append = function(name, value) {
	      name = normalizeName(name);
	      value = normalizeValue(value);
	      var oldValue = this.map[name];
	      this.map[name] = oldValue ? oldValue + ", " + value : value;
	    };
	    Headers.prototype["delete"] = function(name) {
	      delete this.map[normalizeName(name)];
	    };
	    Headers.prototype.get = function(name) {
	      name = normalizeName(name);
	      return this.has(name) ? this.map[name] : null;
	    };
	    Headers.prototype.has = function(name) {
	      return this.map.hasOwnProperty(normalizeName(name));
	    };
	    Headers.prototype.set = function(name, value) {
	      this.map[normalizeName(name)] = normalizeValue(value);
	    };
	    Headers.prototype.forEach = function(callback, thisArg) {
	      for (var name in this.map) {
	        if (this.map.hasOwnProperty(name)) {
	          callback.call(thisArg, this.map[name], name, this);
	        }
	      }
	    };
	    Headers.prototype.keys = function() {
	      var items = [];
	      this.forEach(function(value, name) {
	        items.push(name);
	      });
	      return iteratorFor(items);
	    };
	    Headers.prototype.values = function() {
	      var items = [];
	      this.forEach(function(value) {
	        items.push(value);
	      });
	      return iteratorFor(items);
	    };
	    Headers.prototype.entries = function() {
	      var items = [];
	      this.forEach(function(value, name) {
	        items.push([name, value]);
	      });
	      return iteratorFor(items);
	    };
	    if (support.iterable) {
	      Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
	    }
	    function consumed(body) {
	      if (body._noBody) return;
	      if (body.bodyUsed) {
	        return Promise.reject(new TypeError("Already read"));
	      }
	      body.bodyUsed = true;
	    }
	    function fileReaderReady(reader) {
	      return new Promise(function(resolve, reject) {
	        reader.onload = function() {
	          resolve(reader.result);
	        };
	        reader.onerror = function() {
	          reject(reader.error);
	        };
	      });
	    }
	    function readBlobAsArrayBuffer(blob) {
	      var reader = new FileReader();
	      var promise = fileReaderReady(reader);
	      reader.readAsArrayBuffer(blob);
	      return promise;
	    }
	    function readBlobAsText(blob) {
	      var reader = new FileReader();
	      var promise = fileReaderReady(reader);
	      var match = /charset=([A-Za-z0-9_-]+)/.exec(blob.type);
	      var encoding = match ? match[1] : "utf-8";
	      reader.readAsText(blob, encoding);
	      return promise;
	    }
	    function readArrayBufferAsText(buf) {
	      var view = new Uint8Array(buf);
	      var chars = new Array(view.length);
	      for (var i = 0; i < view.length; i++) {
	        chars[i] = String.fromCharCode(view[i]);
	      }
	      return chars.join("");
	    }
	    function bufferClone(buf) {
	      if (buf.slice) {
	        return buf.slice(0);
	      } else {
	        var view = new Uint8Array(buf.byteLength);
	        view.set(new Uint8Array(buf));
	        return view.buffer;
	      }
	    }
	    function Body() {
	      this.bodyUsed = false;
	      this._initBody = function(body) {
	        this.bodyUsed = this.bodyUsed;
	        this._bodyInit = body;
	        if (!body) {
	          this._noBody = true;
	          this._bodyText = "";
	        } else if (typeof body === "string") {
	          this._bodyText = body;
	        } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
	          this._bodyBlob = body;
	        } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
	          this._bodyFormData = body;
	        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
	          this._bodyText = body.toString();
	        } else if (support.arrayBuffer && support.blob && isDataView(body)) {
	          this._bodyArrayBuffer = bufferClone(body.buffer);
	          this._bodyInit = new Blob([this._bodyArrayBuffer]);
	        } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
	          this._bodyArrayBuffer = bufferClone(body);
	        } else {
	          this._bodyText = body = Object.prototype.toString.call(body);
	        }
	        if (!this.headers.get("content-type")) {
	          if (typeof body === "string") {
	            this.headers.set("content-type", "text/plain;charset=UTF-8");
	          } else if (this._bodyBlob && this._bodyBlob.type) {
	            this.headers.set("content-type", this._bodyBlob.type);
	          } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
	            this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
	          }
	        }
	      };
	      if (support.blob) {
	        this.blob = function() {
	          var rejected = consumed(this);
	          if (rejected) {
	            return rejected;
	          }
	          if (this._bodyBlob) {
	            return Promise.resolve(this._bodyBlob);
	          } else if (this._bodyArrayBuffer) {
	            return Promise.resolve(new Blob([this._bodyArrayBuffer]));
	          } else if (this._bodyFormData) {
	            throw new Error("could not read FormData body as blob");
	          } else {
	            return Promise.resolve(new Blob([this._bodyText]));
	          }
	        };
	      }
	      this.arrayBuffer = function() {
	        if (this._bodyArrayBuffer) {
	          var isConsumed = consumed(this);
	          if (isConsumed) {
	            return isConsumed;
	          } else if (ArrayBuffer.isView(this._bodyArrayBuffer)) {
	            return Promise.resolve(
	              this._bodyArrayBuffer.buffer.slice(
	                this._bodyArrayBuffer.byteOffset,
	                this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
	              )
	            );
	          } else {
	            return Promise.resolve(this._bodyArrayBuffer);
	          }
	        } else if (support.blob) {
	          return this.blob().then(readBlobAsArrayBuffer);
	        } else {
	          throw new Error("could not read as ArrayBuffer");
	        }
	      };
	      this.text = function() {
	        var rejected = consumed(this);
	        if (rejected) {
	          return rejected;
	        }
	        if (this._bodyBlob) {
	          return readBlobAsText(this._bodyBlob);
	        } else if (this._bodyArrayBuffer) {
	          return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
	        } else if (this._bodyFormData) {
	          throw new Error("could not read FormData body as text");
	        } else {
	          return Promise.resolve(this._bodyText);
	        }
	      };
	      if (support.formData) {
	        this.formData = function() {
	          return this.text().then(decode);
	        };
	      }
	      this.json = function() {
	        return this.text().then(JSON.parse);
	      };
	      return this;
	    }
	    var methods = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];
	    function normalizeMethod(method) {
	      var upcased = method.toUpperCase();
	      return methods.indexOf(upcased) > -1 ? upcased : method;
	    }
	    function Request(input, options) {
	      if (!(this instanceof Request)) {
	        throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
	      }
	      options = options || {};
	      var body = options.body;
	      if (input instanceof Request) {
	        if (input.bodyUsed) {
	          throw new TypeError("Already read");
	        }
	        this.url = input.url;
	        this.credentials = input.credentials;
	        if (!options.headers) {
	          this.headers = new Headers(input.headers);
	        }
	        this.method = input.method;
	        this.mode = input.mode;
	        this.signal = input.signal;
	        if (!body && input._bodyInit != null) {
	          body = input._bodyInit;
	          input.bodyUsed = true;
	        }
	      } else {
	        this.url = String(input);
	      }
	      this.credentials = options.credentials || this.credentials || "same-origin";
	      if (options.headers || !this.headers) {
	        this.headers = new Headers(options.headers);
	      }
	      this.method = normalizeMethod(options.method || this.method || "GET");
	      this.mode = options.mode || this.mode || null;
	      this.signal = options.signal || this.signal || function() {
	        if ("AbortController" in g) {
	          var ctrl = new AbortController();
	          return ctrl.signal;
	        }
	      }();
	      this.referrer = null;
	      if ((this.method === "GET" || this.method === "HEAD") && body) {
	        throw new TypeError("Body not allowed for GET or HEAD requests");
	      }
	      this._initBody(body);
	      if (this.method === "GET" || this.method === "HEAD") {
	        if (options.cache === "no-store" || options.cache === "no-cache") {
	          var reParamSearch = /([?&])_=[^&]*/;
	          if (reParamSearch.test(this.url)) {
	            this.url = this.url.replace(reParamSearch, "$1_=" + (/* @__PURE__ */ new Date()).getTime());
	          } else {
	            var reQueryString = /\?/;
	            this.url += (reQueryString.test(this.url) ? "&" : "?") + "_=" + (/* @__PURE__ */ new Date()).getTime();
	          }
	        }
	      }
	    }
	    Request.prototype.clone = function() {
	      return new Request(this, { body: this._bodyInit });
	    };
	    function decode(body) {
	      var form = new FormData();
	      body.trim().split("&").forEach(function(bytes) {
	        if (bytes) {
	          var split = bytes.split("=");
	          var name = split.shift().replace(/\+/g, " ");
	          var value = split.join("=").replace(/\+/g, " ");
	          form.append(decodeURIComponent(name), decodeURIComponent(value));
	        }
	      });
	      return form;
	    }
	    function parseHeaders(rawHeaders) {
	      var headers = new Headers();
	      var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, " ");
	      preProcessedHeaders.split("\r").map(function(header) {
	        return header.indexOf("\n") === 0 ? header.substr(1, header.length) : header;
	      }).forEach(function(line) {
	        var parts = line.split(":");
	        var key = parts.shift().trim();
	        if (key) {
	          var value = parts.join(":").trim();
	          try {
	            headers.append(key, value);
	          } catch (error) {
	            console.warn("Response " + error.message);
	          }
	        }
	      });
	      return headers;
	    }
	    Body.call(Request.prototype);
	    function Response(bodyInit, options) {
	      if (!(this instanceof Response)) {
	        throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
	      }
	      if (!options) {
	        options = {};
	      }
	      this.type = "default";
	      this.status = options.status === void 0 ? 200 : options.status;
	      if (this.status < 200 || this.status > 599) {
	        throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].");
	      }
	      this.ok = this.status >= 200 && this.status < 300;
	      this.statusText = options.statusText === void 0 ? "" : "" + options.statusText;
	      this.headers = new Headers(options.headers);
	      this.url = options.url || "";
	      this._initBody(bodyInit);
	    }
	    Body.call(Response.prototype);
	    Response.prototype.clone = function() {
	      return new Response(this._bodyInit, {
	        status: this.status,
	        statusText: this.statusText,
	        headers: new Headers(this.headers),
	        url: this.url
	      });
	    };
	    Response.error = function() {
	      var response = new Response(null, { status: 200, statusText: "" });
	      response.ok = false;
	      response.status = 0;
	      response.type = "error";
	      return response;
	    };
	    var redirectStatuses = [301, 302, 303, 307, 308];
	    Response.redirect = function(url, status) {
	      if (redirectStatuses.indexOf(status) === -1) {
	        throw new RangeError("Invalid status code");
	      }
	      return new Response(null, { status, headers: { location: url } });
	    };
	    exports2.DOMException = g.DOMException;
	    try {
	      new exports2.DOMException();
	    } catch (err) {
	      exports2.DOMException = function(message, name) {
	        this.message = message;
	        this.name = name;
	        var error = Error(message);
	        this.stack = error.stack;
	      };
	      exports2.DOMException.prototype = Object.create(Error.prototype);
	      exports2.DOMException.prototype.constructor = exports2.DOMException;
	    }
	    function fetch(input, init) {
	      return new Promise(function(resolve, reject) {
	        var request = new Request(input, init);
	        if (request.signal && request.signal.aborted) {
	          return reject(new exports2.DOMException("Aborted", "AbortError"));
	        }
	        var xhr = new XMLHttpRequest();
	        function abortXhr() {
	          xhr.abort();
	        }
	        xhr.onload = function() {
	          var options = {
	            statusText: xhr.statusText,
	            headers: parseHeaders(xhr.getAllResponseHeaders() || "")
	          };
	          if (request.url.indexOf("file://") === 0 && (xhr.status < 200 || xhr.status > 599)) {
	            options.status = 200;
	          } else {
	            options.status = xhr.status;
	          }
	          options.url = "responseURL" in xhr ? xhr.responseURL : options.headers.get("X-Request-URL");
	          var body = "response" in xhr ? xhr.response : xhr.responseText;
	          setTimeout(function() {
	            resolve(new Response(body, options));
	          }, 0);
	        };
	        xhr.onerror = function() {
	          setTimeout(function() {
	            reject(new TypeError("Network request failed"));
	          }, 0);
	        };
	        xhr.ontimeout = function() {
	          setTimeout(function() {
	            reject(new TypeError("Network request timed out"));
	          }, 0);
	        };
	        xhr.onabort = function() {
	          setTimeout(function() {
	            reject(new exports2.DOMException("Aborted", "AbortError"));
	          }, 0);
	        };
	        function fixUrl(url) {
	          try {
	            return url === "" && g.location.href ? g.location.href : url;
	          } catch (e) {
	            return url;
	          }
	        }
	        xhr.open(request.method, fixUrl(request.url), true);
	        if (request.credentials === "include") {
	          xhr.withCredentials = true;
	        } else if (request.credentials === "omit") {
	          xhr.withCredentials = false;
	        }
	        if ("responseType" in xhr) {
	          if (support.blob) {
	            xhr.responseType = "blob";
	          } else if (support.arrayBuffer) {
	            xhr.responseType = "arraybuffer";
	          }
	        }
	        if (init && typeof init.headers === "object" && !(init.headers instanceof Headers || g.Headers && init.headers instanceof g.Headers)) {
	          var names = [];
	          Object.getOwnPropertyNames(init.headers).forEach(function(name) {
	            names.push(normalizeName(name));
	            xhr.setRequestHeader(name, normalizeValue(init.headers[name]));
	          });
	          request.headers.forEach(function(value, name) {
	            if (names.indexOf(name) === -1) {
	              xhr.setRequestHeader(name, value);
	            }
	          });
	        } else {
	          request.headers.forEach(function(value, name) {
	            xhr.setRequestHeader(name, value);
	          });
	        }
	        if (request.signal) {
	          request.signal.addEventListener("abort", abortXhr);
	          xhr.onreadystatechange = function() {
	            if (xhr.readyState === 4) {
	              request.signal.removeEventListener("abort", abortXhr);
	            }
	          };
	        }
	        xhr.send(typeof request._bodyInit === "undefined" ? null : request._bodyInit);
	      });
	    }
	    fetch.polyfill = true;
	    if (!g.fetch) {
	      g.fetch = fetch;
	      g.Headers = Headers;
	      g.Request = Request;
	      g.Response = Response;
	    }
	    exports2.Headers = Headers;
	    exports2.Request = Request;
	    exports2.Response = Response;
	    exports2.fetch = fetch;
	    Object.defineProperty(exports2, "__esModule", { value: true });
	    return exports2;
	  })({});
	})(__globalThis__);
	__globalThis__.fetch.ponyfill = true;
	delete __globalThis__.fetch.polyfill;
	var ctx = __global__.fetch ? __global__ : __globalThis__;
	exports = ctx.fetch;
	exports.default = ctx.fetch;
	exports.fetch = ctx.fetch;
	exports.Headers = ctx.Headers;
	exports.Request = ctx.Request;
	exports.Response = ctx.Response;
	module.exports = exports; 
} (browserPonyfill, browserPonyfill.exports));

var browserPonyfillExports = browserPonyfill.exports;
const o = /*@__PURE__*/getDefaultExportFromCjs(browserPonyfillExports);

var P$1=Object.defineProperty,w$1=Object.defineProperties,E$2=Object.getOwnPropertyDescriptors,c=Object.getOwnPropertySymbols,L$2=Object.prototype.hasOwnProperty,O$1=Object.prototype.propertyIsEnumerable,l$1=(r,t,e)=>t in r?P$1(r,t,{enumerable:true,configurable:true,writable:true,value:e}):r[t]=e,p$1=(r,t)=>{for(var e in t||(t={}))L$2.call(t,e)&&l$1(r,e,t[e]);if(c)for(var e of c(t))O$1.call(t,e)&&l$1(r,e,t[e]);return r},v$1=(r,t)=>w$1(r,E$2(t));const j$1={Accept:"application/json","Content-Type":"application/json"},T$1="POST",d$1={headers:j$1,method:T$1},g=10;let f$1 = class f{constructor(t,e=false){if(this.url=t,this.disableProviderPing=e,this.events=new eventsExports.EventEmitter,this.isAvailable=false,this.registering=false,!isHttpUrl(t))throw new Error(`Provided URL is not compatible with HTTP connection: ${t}`);this.url=t,this.disableProviderPing=e;}get connected(){return this.isAvailable}get connecting(){return this.registering}on(t,e){this.events.on(t,e);}once(t,e){this.events.once(t,e);}off(t,e){this.events.off(t,e);}removeListener(t,e){this.events.removeListener(t,e);}async open(t=this.url){await this.register(t);}async close(){if(!this.isAvailable)throw new Error("Connection already closed");this.onClose();}async send(t){this.isAvailable||await this.register();try{const e=safeJsonStringify(t),s=await(await o(this.url,v$1(p$1({},d$1),{body:e}))).json();this.onPayload({data:s});}catch(e){this.onError(t.id,e);}}async register(t=this.url){if(!isHttpUrl(t))throw new Error(`Provided URL is not compatible with HTTP connection: ${t}`);if(this.registering){const e=this.events.getMaxListeners();return (this.events.listenerCount("register_error")>=e||this.events.listenerCount("open")>=e)&&this.events.setMaxListeners(e+1),new Promise((s,i)=>{this.events.once("register_error",n=>{this.resetMaxListeners(),i(n);}),this.events.once("open",()=>{if(this.resetMaxListeners(),typeof this.isAvailable>"u")return i(new Error("HTTP connection is missing or invalid"));s();});})}this.url=t,this.registering=true;try{if(!this.disableProviderPing){const e=safeJsonStringify({id:1,jsonrpc:"2.0",method:"test",params:[]});await o(t,v$1(p$1({},d$1),{body:e}));}this.onOpen();}catch(e){const s=this.parseError(e);throw this.events.emit("register_error",s),this.onClose(),s}}onOpen(){this.isAvailable=true,this.registering=false,this.events.emit("open");}onClose(){this.isAvailable=false,this.registering=false,this.events.emit("close");}onPayload(t){if(typeof t.data>"u")return;const e=typeof t.data=="string"?safeJsonParse(t.data):t.data;this.events.emit("payload",e);}onError(t,e){const s=this.parseError(e),i=s.message||s.toString(),n=formatJsonRpcError(t,i);this.events.emit("payload",n);}parseError(t,e=this.url){return parseConnectionError(t,e,"HTTP")}resetMaxListeners(){this.events.getMaxListeners()>g&&this.events.setMaxListeners(g);}};

const et$1="error",St="wss://relay.walletconnect.org",Dt="wc",qt="universal_provider",U$1=`${Dt}@2:${qt}:`,st$1="https://rpc.walletconnect.org/v1/",I$1="generic",jt=`${st$1}bundler`,u={DEFAULT_CHAIN_CHANGED:"default_chain_changed"};function Rt(){}function k$1(s){return s==null||typeof s!="object"&&typeof s!="function"}function W$1(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function _t(s){if(k$1(s))return s;if(Array.isArray(s)||W$1(s)||s instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&s instanceof SharedArrayBuffer)return s.slice(0);const t=Object.getPrototypeOf(s),e=t.constructor;if(s instanceof Date||s instanceof Map||s instanceof Set)return new e(s);if(s instanceof RegExp){const i=new e(s);return i.lastIndex=s.lastIndex,i}if(s instanceof DataView)return new e(s.buffer.slice(0));if(s instanceof Error){const i=new e(s.message);return i.stack=s.stack,i.name=s.name,i.cause=s.cause,i}if(typeof File<"u"&&s instanceof File)return new e([s],s.name,{type:s.type,lastModified:s.lastModified});if(typeof s=="object"){const i=Object.create(t);return Object.assign(i,s)}return s}function it(s){return typeof s=="object"&&s!==null}function rt(s){return Object.getOwnPropertySymbols(s).filter(t=>Object.prototype.propertyIsEnumerable.call(s,t))}function nt$1(s){return s==null?s===void 0?"[object Undefined]":"[object Null]":Object.prototype.toString.call(s)}const Ut="[object RegExp]",at="[object String]",ct="[object Number]",ot="[object Boolean]",ht="[object Arguments]",Ft="[object Symbol]",Lt="[object Date]",Mt="[object Map]",xt="[object Set]",Bt="[object Array]",Gt="[object ArrayBuffer]",Jt="[object Object]",zt="[object DataView]",kt="[object Uint8Array]",Wt="[object Uint8ClampedArray]",Kt="[object Uint16Array]",Vt="[object Uint32Array]",Xt="[object Int8Array]",Yt="[object Int16Array]",Qt="[object Int32Array]",Zt="[object Float32Array]",Tt="[object Float64Array]";function te(s,t){return $$1(s,void 0,s,new Map,t)}function $$1(s,t,e,i=new Map,n=void 0){const a=n?.(s,t,e,i);if(a!=null)return a;if(k$1(s))return s;if(i.has(s))return i.get(s);if(Array.isArray(s)){const r=new Array(s.length);i.set(s,r);for(let c=0;c<s.length;c++)r[c]=$$1(s[c],c,e,i,n);return Object.hasOwn(s,"index")&&(r.index=s.index),Object.hasOwn(s,"input")&&(r.input=s.input),r}if(s instanceof Date)return new Date(s.getTime());if(s instanceof RegExp){const r=new RegExp(s.source,s.flags);return r.lastIndex=s.lastIndex,r}if(s instanceof Map){const r=new Map;i.set(s,r);for(const[c,o]of s)r.set(c,$$1(o,c,e,i,n));return r}if(s instanceof Set){const r=new Set;i.set(s,r);for(const c of s)r.add($$1(c,void 0,e,i,n));return r}if(typeof Buffer<"u"&&Buffer.isBuffer(s))return s.subarray();if(W$1(s)){const r=new(Object.getPrototypeOf(s)).constructor(s.length);i.set(s,r);for(let c=0;c<s.length;c++)r[c]=$$1(s[c],c,e,i,n);return r}if(s instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&s instanceof SharedArrayBuffer)return s.slice(0);if(s instanceof DataView){const r=new DataView(s.buffer.slice(0),s.byteOffset,s.byteLength);return i.set(s,r),y(r,s,e,i,n),r}if(typeof File<"u"&&s instanceof File){const r=new File([s],s.name,{type:s.type});return i.set(s,r),y(r,s,e,i,n),r}if(s instanceof Blob){const r=new Blob([s],{type:s.type});return i.set(s,r),y(r,s,e,i,n),r}if(s instanceof Error){const r=new s.constructor;return i.set(s,r),r.message=s.message,r.name=s.name,r.stack=s.stack,r.cause=s.cause,y(r,s,e,i,n),r}if(typeof s=="object"&&ee(s)){const r=Object.create(Object.getPrototypeOf(s));return i.set(s,r),y(r,s,e,i,n),r}return s}function y(s,t,e=s,i,n){const a=[...Object.keys(t),...rt(t)];for(let r=0;r<a.length;r++){const c=a[r],o=Object.getOwnPropertyDescriptor(s,c);(o==null||o.writable)&&(s[c]=$$1(t[c],c,e,i,n));}}function ee(s){switch(nt$1(s)){case ht:case Bt:case Gt:case zt:case ot:case Lt:case Zt:case Tt:case Xt:case Yt:case Qt:case Mt:case ct:case Jt:case Ut:case xt:case at:case Ft:case kt:case Wt:case Kt:case Vt:return  true;default:return  false}}function se(s,t){return te(s,(e,i,n,a)=>{if(typeof s=="object")switch(Object.prototype.toString.call(s)){case ct:case at:case ot:{const c=new s.constructor(s?.valueOf());return y(c,s),c}case ht:{const c={};return y(c,s),c.length=s.length,c[Symbol.iterator]=s[Symbol.iterator],c}default:return}})}function pt(s){return se(s)}function dt(s){return s!==null&&typeof s=="object"&&nt$1(s)==="[object Arguments]"}function ie(s){return W$1(s)}function re(s){if(typeof s!="object"||s==null)return  false;if(Object.getPrototypeOf(s)===null)return  true;if(Object.prototype.toString.call(s)!=="[object Object]"){const e=s[Symbol.toStringTag];return e==null||!Object.getOwnPropertyDescriptor(s,Symbol.toStringTag)?.writable?false:s.toString()===`[object ${e}]`}let t=s;for(;Object.getPrototypeOf(t)!==null;)t=Object.getPrototypeOf(t);return Object.getPrototypeOf(s)===t}function ne(s,...t){const e=t.slice(0,-1),i=t[t.length-1];let n=s;for(let a=0;a<e.length;a++){const r=e[a];n=F$1(n,r,i,new Map);}return n}function F$1(s,t,e,i){if(k$1(s)&&(s=Object(s)),t==null||typeof t!="object")return s;if(i.has(t))return _t(i.get(t));if(i.set(t,s),Array.isArray(t)){t=t.slice();for(let a=0;a<t.length;a++)t[a]=t[a]??void 0;}const n=[...Object.keys(t),...rt(t)];for(let a=0;a<n.length;a++){const r=n[a];let c=t[r],o=s[r];if(dt(c)&&(c={...c}),dt(o)&&(o={...o}),typeof Buffer<"u"&&Buffer.isBuffer(c)&&(c=pt(c)),Array.isArray(c))if(typeof o=="object"&&o!=null){const w=[],v=Reflect.ownKeys(o);for(let P=0;P<v.length;P++){const p=v[P];w[p]=o[p];}o=w;}else o=[];const m=e(o,c,r,s,t,i);m!=null?s[r]=m:Array.isArray(c)||it(o)&&it(c)?s[r]=F$1(o,c,e,i):o==null&&re(c)?s[r]=F$1({},c,e,i):o==null&&ie(c)?s[r]=pt(c):(o===void 0||c!==void 0)&&(s[r]=c);}return s}function ae(s,...t){return ne(s,...t,Rt)}var ce=Object.defineProperty,oe=Object.defineProperties,he=Object.getOwnPropertyDescriptors,ut=Object.getOwnPropertySymbols,pe=Object.prototype.hasOwnProperty,de=Object.prototype.propertyIsEnumerable,lt=(s,t,e)=>t in s?ce(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,L$1=(s,t)=>{for(var e in t||(t={}))pe.call(t,e)&&lt(s,e,t[e]);if(ut)for(var e of ut(t))de.call(t,e)&&lt(s,e,t[e]);return s},ue=(s,t)=>oe(s,he(t));function d(s,t,e){var i;const n=Ne$1(s);return ((i=t.rpcMap)==null?void 0:i[n.reference])||`${st$1}?chainId=${n.namespace}:${n.reference}&projectId=${e}`}function b$1(s){return s.includes(":")?s.split(":")[1]:s}function ft(s){return s.map(t=>`${t.split(":")[0]}:${t.split(":")[1]}`)}function le(s,t){const e=Object.keys(t.namespaces).filter(n=>n.includes(s));if(!e.length)return [];const i=[];return e.forEach(n=>{const a=t.namespaces[n].accounts;i.push(...a);}),i}function M$1(s={},t={}){const e=mt(s),i=mt(t);return ae(e,i)}function mt(s){var t,e,i,n,a;const r={};if(!Oe$1(s))return r;for(const[c,o]of Object.entries(s)){const m=yn$1(c)?[c]:o.chains,w=o.methods||[],v=o.events||[],P=o.rpcMap||{},p=yo$1(c);r[p]=ue(L$1(L$1({},r[p]),o),{chains:ot$1(m,(t=r[p])==null?void 0:t.chains),methods:ot$1(w,(e=r[p])==null?void 0:e.methods),events:ot$1(v,(i=r[p])==null?void 0:i.events)}),(Oe$1(P)||Oe$1(((n=r[p])==null?void 0:n.rpcMap)||{}))&&(r[p].rpcMap=L$1(L$1({},P),(a=r[p])==null?void 0:a.rpcMap));}return r}function vt(s){return s.includes(":")?s.split(":")[2]:s}function gt(s){const t={};for(const[e,i]of Object.entries(s)){const n=i.methods||[],a=i.events||[],r=i.accounts||[],c=yn$1(e)?[e]:i.chains?i.chains:ft(i.accounts);t[e]={chains:c,methods:n,events:a,accounts:r};}return t}function K$1(s){return typeof s=="number"?s:s.includes("0x")?parseInt(s,16):(s=s.includes(":")?s.split(":")[1]:s,isNaN(Number(s))?s:Number(s))}const Pt={},h=s=>Pt[s],V$1=(s,t)=>{Pt[s]=t;};var fe=Object.defineProperty,me=(s,t,e)=>t in s?fe(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,O=(s,t,e)=>me(s,typeof t!="symbol"?t+"":t,e);class ve{constructor(t){O(this,"name","polkadot"),O(this,"client"),O(this,"httpProviders"),O(this,"events"),O(this,"namespace"),O(this,"chainId"),this.namespace=t.namespace,this.events=h("events"),this.client=h("client"),this.chainId=this.getDefaultChain(),this.httpProviders=this.createHttpProviders();}updateNamespace(t){this.namespace=Object.assign(this.namespace,t);}requestAccounts(){return this.getAccounts()}getDefaultChain(){if(this.chainId)return this.chainId;if(this.namespace.defaultChain)return this.namespace.defaultChain;const t=this.namespace.chains[0];if(!t)throw new Error("ChainId not found");return t.split(":")[1]}request(t){return this.namespace.methods.includes(t.request.method)?this.client.request(t):this.getHttpProvider().request(t.request)}setDefaultChain(t,e){this.httpProviders[t]||this.setHttpProvider(t,e),this.chainId=t,this.events.emit(u.DEFAULT_CHAIN_CHANGED,`${this.name}:${t}`);}getAccounts(){const t=this.namespace.accounts;return t?t.filter(e=>e.split(":")[1]===this.chainId.toString()).map(e=>e.split(":")[2])||[]:[]}createHttpProviders(){const t={};return this.namespace.chains.forEach(e=>{var i;const n=b$1(e);t[n]=this.createHttpProvider(n,(i=this.namespace.rpcMap)==null?void 0:i[e]);}),t}getHttpProvider(){const t=`${this.name}:${this.chainId}`,e=this.httpProviders[t];if(typeof e>"u")throw new Error(`JSON-RPC provider for ${t} not found`);return e}setHttpProvider(t,e){const i=this.createHttpProvider(t,e);i&&(this.httpProviders[t]=i);}createHttpProvider(t,e){const i=e||d(t,this.namespace,this.client.core.projectId);if(!i)throw new Error(`No RPC url provided for chainId: ${t}`);return new o$1(new f$1(i,h("disableProviderPing")))}}var ge=Object.defineProperty,Pe=Object.defineProperties,we=Object.getOwnPropertyDescriptors,wt=Object.getOwnPropertySymbols,ye=Object.prototype.hasOwnProperty,be=Object.prototype.propertyIsEnumerable,X$1=(s,t,e)=>t in s?ge(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,yt=(s,t)=>{for(var e in t||(t={}))ye.call(t,e)&&X$1(s,e,t[e]);if(wt)for(var e of wt(t))be.call(t,e)&&X$1(s,e,t[e]);return s},bt=(s,t)=>Pe(s,we(t)),A$1=(s,t,e)=>X$1(s,typeof t!="symbol"?t+"":t,e);class Ie{constructor(t){A$1(this,"name","eip155"),A$1(this,"client"),A$1(this,"chainId"),A$1(this,"namespace"),A$1(this,"httpProviders"),A$1(this,"events"),this.namespace=t.namespace,this.events=h("events"),this.client=h("client"),this.httpProviders=this.createHttpProviders(),this.chainId=parseInt(this.getDefaultChain());}async request(t){switch(t.request.method){case "eth_requestAccounts":return this.getAccounts();case "eth_accounts":return this.getAccounts();case "wallet_switchEthereumChain":return await this.handleSwitchChain(t);case "eth_chainId":return parseInt(this.getDefaultChain());case "wallet_getCapabilities":return await this.getCapabilities(t);case "wallet_getCallsStatus":return await this.getCallStatus(t)}return this.namespace.methods.includes(t.request.method)?await this.client.request(t):this.getHttpProvider().request(t.request)}updateNamespace(t){this.namespace=Object.assign(this.namespace,t);}setDefaultChain(t,e){this.httpProviders[t]||this.setHttpProvider(parseInt(t),e),this.chainId=parseInt(t),this.events.emit(u.DEFAULT_CHAIN_CHANGED,`${this.name}:${t}`);}requestAccounts(){return this.getAccounts()}getDefaultChain(){if(this.chainId)return this.chainId.toString();if(this.namespace.defaultChain)return this.namespace.defaultChain;const t=this.namespace.chains[0];if(!t)throw new Error("ChainId not found");return t.split(":")[1]}createHttpProvider(t,e){const i=e||d(`${this.name}:${t}`,this.namespace,this.client.core.projectId);if(!i)throw new Error(`No RPC url provided for chainId: ${t}`);return new o$1(new f$1(i,h("disableProviderPing")))}setHttpProvider(t,e){const i=this.createHttpProvider(t,e);i&&(this.httpProviders[t]=i);}createHttpProviders(){const t={};return this.namespace.chains.forEach(e=>{var i;const n=parseInt(b$1(e));t[n]=this.createHttpProvider(n,(i=this.namespace.rpcMap)==null?void 0:i[e]);}),t}getAccounts(){const t=this.namespace.accounts;return t?[...new Set(t.filter(e=>e.split(":")[1]===this.chainId.toString()).map(e=>e.split(":")[2]))]:[]}getHttpProvider(){const t=this.chainId,e=this.httpProviders[t];if(typeof e>"u")throw new Error(`JSON-RPC provider for ${t} not found`);return e}async handleSwitchChain(t){var e,i;let n=t.request.params?(e=t.request.params[0])==null?void 0:e.chainId:"0x0";n=n.startsWith("0x")?n:`0x${n}`;const a=parseInt(n,16);if(this.isChainApproved(a))this.setDefaultChain(`${a}`);else if(this.namespace.methods.includes("wallet_switchEthereumChain"))await this.client.request({topic:t.topic,request:{method:t.request.method,params:[{chainId:n}]},chainId:(i=this.namespace.chains)==null?void 0:i[0]}),this.setDefaultChain(`${a}`);else throw new Error(`Failed to switch to chain 'eip155:${a}'. The chain is not approved or the wallet does not support 'wallet_switchEthereumChain' method.`);return null}isChainApproved(t){return this.namespace.chains.includes(`${this.name}:${t}`)}async getCapabilities(t){var e,i,n,a,r;const c=(i=(e=t.request)==null?void 0:e.params)==null?void 0:i[0],o=((a=(n=t.request)==null?void 0:n.params)==null?void 0:a[1])||[],m=`${c}${o.join(",")}`;if(!c)throw new Error("Missing address parameter in `wallet_getCapabilities` request");const w=this.client.session.get(t.topic),v=((r=w?.sessionProperties)==null?void 0:r.capabilities)||{};if(v!=null&&v[m])return v?.[m];const P=await this.client.request(t);try{await this.client.session.update(t.topic,{sessionProperties:bt(yt({},w.sessionProperties||{}),{capabilities:bt(yt({},v||{}),{[m]:P})})});}catch(p){console.warn("Failed to update session with capabilities",p);}return P}async getCallStatus(t){var e,i;const n=this.client.session.get(t.topic),a=(e=n.sessionProperties)==null?void 0:e.bundler_name;if(a){const c=this.getBundlerUrl(t.chainId,a);try{return await this.getUserOperationReceipt(c,t)}catch(o){console.warn("Failed to fetch call status from bundler",o,c);}}const r=(i=n.sessionProperties)==null?void 0:i.bundler_url;if(r)try{return await this.getUserOperationReceipt(r,t)}catch(c){console.warn("Failed to fetch call status from custom bundler",c,r);}if(this.namespace.methods.includes(t.request.method))return await this.client.request(t);throw new Error("Fetching call status not approved by the wallet.")}async getUserOperationReceipt(t,e){var i;const n=new URL(t),a=await fetch(n,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(formatJsonRpcRequest("eth_getUserOperationReceipt",[(i=e.request.params)==null?void 0:i[0]]))});if(!a.ok)throw new Error(`Failed to fetch user operation receipt - ${a.status}`);return await a.json()}getBundlerUrl(t,e){return `${jt}?projectId=${this.client.core.projectId}&chainId=${t}&bundler=${e}`}}var $e=Object.defineProperty,Oe=(s,t,e)=>t in s?$e(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,C$1=(s,t,e)=>Oe(s,typeof t!="symbol"?t+"":t,e);class Ae{constructor(t){C$1(this,"name","solana"),C$1(this,"client"),C$1(this,"httpProviders"),C$1(this,"events"),C$1(this,"namespace"),C$1(this,"chainId"),this.namespace=t.namespace,this.events=h("events"),this.client=h("client"),this.chainId=this.getDefaultChain(),this.httpProviders=this.createHttpProviders();}updateNamespace(t){this.namespace=Object.assign(this.namespace,t);}requestAccounts(){return this.getAccounts()}request(t){return this.namespace.methods.includes(t.request.method)?this.client.request(t):this.getHttpProvider().request(t.request)}setDefaultChain(t,e){this.httpProviders[t]||this.setHttpProvider(t,e),this.chainId=t,this.events.emit(u.DEFAULT_CHAIN_CHANGED,`${this.name}:${t}`);}getDefaultChain(){if(this.chainId)return this.chainId;if(this.namespace.defaultChain)return this.namespace.defaultChain;const t=this.namespace.chains[0];if(!t)throw new Error("ChainId not found");return t.split(":")[1]}getAccounts(){const t=this.namespace.accounts;return t?[...new Set(t.filter(e=>e.split(":")[1]===this.chainId.toString()).map(e=>e.split(":")[2]))]:[]}createHttpProviders(){const t={};return this.namespace.chains.forEach(e=>{var i;const n=b$1(e);t[n]=this.createHttpProvider(n,(i=this.namespace.rpcMap)==null?void 0:i[e]);}),t}getHttpProvider(){const t=`${this.name}:${this.chainId}`,e=this.httpProviders[t];if(typeof e>"u")throw new Error(`JSON-RPC provider for ${t} not found`);return e}setHttpProvider(t,e){const i=this.createHttpProvider(t,e);i&&(this.httpProviders[t]=i);}createHttpProvider(t,e){const i=e||d(t,this.namespace,this.client.core.projectId);if(!i)throw new Error(`No RPC url provided for chainId: ${t}`);return new o$1(new f$1(i,h("disableProviderPing")))}}var Ce=Object.defineProperty,He=(s,t,e)=>t in s?Ce(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,H$1=(s,t,e)=>He(s,typeof t!="symbol"?t+"":t,e);class Ee{constructor(t){H$1(this,"name","cosmos"),H$1(this,"client"),H$1(this,"httpProviders"),H$1(this,"events"),H$1(this,"namespace"),H$1(this,"chainId"),this.namespace=t.namespace,this.events=h("events"),this.client=h("client"),this.chainId=this.getDefaultChain(),this.httpProviders=this.createHttpProviders();}updateNamespace(t){this.namespace=Object.assign(this.namespace,t);}requestAccounts(){return this.getAccounts()}getDefaultChain(){if(this.chainId)return this.chainId;if(this.namespace.defaultChain)return this.namespace.defaultChain;const t=this.namespace.chains[0];if(!t)throw new Error("ChainId not found");return t.split(":")[1]}request(t){return this.namespace.methods.includes(t.request.method)?this.client.request(t):this.getHttpProvider().request(t.request)}setDefaultChain(t,e){this.httpProviders[t]||this.setHttpProvider(t,e),this.chainId=t,this.events.emit(u.DEFAULT_CHAIN_CHANGED,`${this.name}:${this.chainId}`);}getAccounts(){const t=this.namespace.accounts;return t?[...new Set(t.filter(e=>e.split(":")[1]===this.chainId.toString()).map(e=>e.split(":")[2]))]:[]}createHttpProviders(){const t={};return this.namespace.chains.forEach(e=>{var i;const n=b$1(e);t[n]=this.createHttpProvider(n,(i=this.namespace.rpcMap)==null?void 0:i[e]);}),t}getHttpProvider(){const t=`${this.name}:${this.chainId}`,e=this.httpProviders[t];if(typeof e>"u")throw new Error(`JSON-RPC provider for ${t} not found`);return e}setHttpProvider(t,e){const i=this.createHttpProvider(t,e);i&&(this.httpProviders[t]=i);}createHttpProvider(t,e){const i=e||d(t,this.namespace,this.client.core.projectId);if(!i)throw new Error(`No RPC url provided for chainId: ${t}`);return new o$1(new f$1(i,h("disableProviderPing")))}}var Ne=Object.defineProperty,Se=(s,t,e)=>t in s?Ne(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,E$1=(s,t,e)=>Se(s,typeof t!="symbol"?t+"":t,e);class De{constructor(t){E$1(this,"name","algorand"),E$1(this,"client"),E$1(this,"httpProviders"),E$1(this,"events"),E$1(this,"namespace"),E$1(this,"chainId"),this.namespace=t.namespace,this.events=h("events"),this.client=h("client"),this.chainId=this.getDefaultChain(),this.httpProviders=this.createHttpProviders();}updateNamespace(t){this.namespace=Object.assign(this.namespace,t);}requestAccounts(){return this.getAccounts()}request(t){return this.namespace.methods.includes(t.request.method)?this.client.request(t):this.getHttpProvider().request(t.request)}setDefaultChain(t,e){if(!this.httpProviders[t]){const i=e||d(`${this.name}:${t}`,this.namespace,this.client.core.projectId);if(!i)throw new Error(`No RPC url provided for chainId: ${t}`);this.setHttpProvider(t,i);}this.chainId=t,this.events.emit(u.DEFAULT_CHAIN_CHANGED,`${this.name}:${this.chainId}`);}getDefaultChain(){if(this.chainId)return this.chainId;if(this.namespace.defaultChain)return this.namespace.defaultChain;const t=this.namespace.chains[0];if(!t)throw new Error("ChainId not found");return t.split(":")[1]}getAccounts(){const t=this.namespace.accounts;return t?[...new Set(t.filter(e=>e.split(":")[1]===this.chainId.toString()).map(e=>e.split(":")[2]))]:[]}createHttpProviders(){const t={};return this.namespace.chains.forEach(e=>{var i;t[e]=this.createHttpProvider(e,(i=this.namespace.rpcMap)==null?void 0:i[e]);}),t}getHttpProvider(){const t=`${this.name}:${this.chainId}`,e=this.httpProviders[t];if(typeof e>"u")throw new Error(`JSON-RPC provider for ${t} not found`);return e}setHttpProvider(t,e){const i=this.createHttpProvider(t,e);i&&(this.httpProviders[t]=i);}createHttpProvider(t,e){const i=e||d(t,this.namespace,this.client.core.projectId);return typeof i>"u"?void 0:new o$1(new f$1(i,h("disableProviderPing")))}}var qe=Object.defineProperty,je=(s,t,e)=>t in s?qe(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,N=(s,t,e)=>je(s,typeof t!="symbol"?t+"":t,e);class Re{constructor(t){N(this,"name","cip34"),N(this,"client"),N(this,"httpProviders"),N(this,"events"),N(this,"namespace"),N(this,"chainId"),this.namespace=t.namespace,this.events=h("events"),this.client=h("client"),this.chainId=this.getDefaultChain(),this.httpProviders=this.createHttpProviders();}updateNamespace(t){this.namespace=Object.assign(this.namespace,t);}requestAccounts(){return this.getAccounts()}getDefaultChain(){if(this.chainId)return this.chainId;if(this.namespace.defaultChain)return this.namespace.defaultChain;const t=this.namespace.chains[0];if(!t)throw new Error("ChainId not found");return t.split(":")[1]}request(t){return this.namespace.methods.includes(t.request.method)?this.client.request(t):this.getHttpProvider().request(t.request)}setDefaultChain(t,e){this.httpProviders[t]||this.setHttpProvider(t,e),this.chainId=t,this.events.emit(u.DEFAULT_CHAIN_CHANGED,`${this.name}:${this.chainId}`);}getAccounts(){const t=this.namespace.accounts;return t?[...new Set(t.filter(e=>e.split(":")[1]===this.chainId.toString()).map(e=>e.split(":")[2]))]:[]}createHttpProviders(){const t={};return this.namespace.chains.forEach(e=>{const i=this.getCardanoRPCUrl(e),n=b$1(e);t[n]=this.createHttpProvider(n,i);}),t}getHttpProvider(){const t=`${this.name}:${this.chainId}`,e=this.httpProviders[t];if(typeof e>"u")throw new Error(`JSON-RPC provider for ${t} not found`);return e}getCardanoRPCUrl(t){const e=this.namespace.rpcMap;if(e)return e[t]}setHttpProvider(t,e){const i=this.createHttpProvider(t,e);i&&(this.httpProviders[t]=i);}createHttpProvider(t,e){const i=e||this.getCardanoRPCUrl(t);if(!i)throw new Error(`No RPC url provided for chainId: ${t}`);return new o$1(new f$1(i,h("disableProviderPing")))}}var _e=Object.defineProperty,Ue=(s,t,e)=>t in s?_e(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,S$1=(s,t,e)=>Ue(s,typeof t!="symbol"?t+"":t,e);class Fe{constructor(t){S$1(this,"name","elrond"),S$1(this,"client"),S$1(this,"httpProviders"),S$1(this,"events"),S$1(this,"namespace"),S$1(this,"chainId"),this.namespace=t.namespace,this.events=h("events"),this.client=h("client"),this.chainId=this.getDefaultChain(),this.httpProviders=this.createHttpProviders();}updateNamespace(t){this.namespace=Object.assign(this.namespace,t);}requestAccounts(){return this.getAccounts()}request(t){return this.namespace.methods.includes(t.request.method)?this.client.request(t):this.getHttpProvider().request(t.request)}setDefaultChain(t,e){this.httpProviders[t]||this.setHttpProvider(t,e),this.chainId=t,this.events.emit(u.DEFAULT_CHAIN_CHANGED,`${this.name}:${t}`);}getDefaultChain(){if(this.chainId)return this.chainId;if(this.namespace.defaultChain)return this.namespace.defaultChain;const t=this.namespace.chains[0];if(!t)throw new Error("ChainId not found");return t.split(":")[1]}getAccounts(){const t=this.namespace.accounts;return t?[...new Set(t.filter(e=>e.split(":")[1]===this.chainId.toString()).map(e=>e.split(":")[2]))]:[]}createHttpProviders(){const t={};return this.namespace.chains.forEach(e=>{var i;const n=b$1(e);t[n]=this.createHttpProvider(n,(i=this.namespace.rpcMap)==null?void 0:i[e]);}),t}getHttpProvider(){const t=`${this.name}:${this.chainId}`,e=this.httpProviders[t];if(typeof e>"u")throw new Error(`JSON-RPC provider for ${t} not found`);return e}setHttpProvider(t,e){const i=this.createHttpProvider(t,e);i&&(this.httpProviders[t]=i);}createHttpProvider(t,e){const i=e||d(t,this.namespace,this.client.core.projectId);if(!i)throw new Error(`No RPC url provided for chainId: ${t}`);return new o$1(new f$1(i,h("disableProviderPing")))}}var Le=Object.defineProperty,Me=(s,t,e)=>t in s?Le(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,D$1=(s,t,e)=>Me(s,typeof t!="symbol"?t+"":t,e);class xe{constructor(t){D$1(this,"name","multiversx"),D$1(this,"client"),D$1(this,"httpProviders"),D$1(this,"events"),D$1(this,"namespace"),D$1(this,"chainId"),this.namespace=t.namespace,this.events=h("events"),this.client=h("client"),this.chainId=this.getDefaultChain(),this.httpProviders=this.createHttpProviders();}updateNamespace(t){this.namespace=Object.assign(this.namespace,t);}requestAccounts(){return this.getAccounts()}request(t){return this.namespace.methods.includes(t.request.method)?this.client.request(t):this.getHttpProvider().request(t.request)}setDefaultChain(t,e){this.httpProviders[t]||this.setHttpProvider(t,e),this.chainId=t,this.events.emit(u.DEFAULT_CHAIN_CHANGED,`${this.name}:${t}`);}getDefaultChain(){if(this.chainId)return this.chainId;if(this.namespace.defaultChain)return this.namespace.defaultChain;const t=this.namespace.chains[0];if(!t)throw new Error("ChainId not found");return t.split(":")[1]}getAccounts(){const t=this.namespace.accounts;return t?[...new Set(t.filter(e=>e.split(":")[1]===this.chainId.toString()).map(e=>e.split(":")[2]))]:[]}createHttpProviders(){const t={};return this.namespace.chains.forEach(e=>{var i;const n=b$1(e);t[n]=this.createHttpProvider(n,(i=this.namespace.rpcMap)==null?void 0:i[e]);}),t}getHttpProvider(){const t=`${this.name}:${this.chainId}`,e=this.httpProviders[t];if(typeof e>"u")throw new Error(`JSON-RPC provider for ${t} not found`);return e}setHttpProvider(t,e){const i=this.createHttpProvider(t,e);i&&(this.httpProviders[t]=i);}createHttpProvider(t,e){const i=e||d(t,this.namespace,this.client.core.projectId);if(!i)throw new Error(`No RPC url provided for chainId: ${t}`);return new o$1(new f$1(i,h("disableProviderPing")))}}var Be=Object.defineProperty,Ge=(s,t,e)=>t in s?Be(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,q$1=(s,t,e)=>Ge(s,typeof t!="symbol"?t+"":t,e);class Je{constructor(t){q$1(this,"name","near"),q$1(this,"client"),q$1(this,"httpProviders"),q$1(this,"events"),q$1(this,"namespace"),q$1(this,"chainId"),this.namespace=t.namespace,this.events=h("events"),this.client=h("client"),this.chainId=this.getDefaultChain(),this.httpProviders=this.createHttpProviders();}updateNamespace(t){this.namespace=Object.assign(this.namespace,t);}requestAccounts(){return this.getAccounts()}getDefaultChain(){if(this.chainId)return this.chainId;if(this.namespace.defaultChain)return this.namespace.defaultChain;const t=this.namespace.chains[0];if(!t)throw new Error("ChainId not found");return t.split(":")[1]}request(t){return this.namespace.methods.includes(t.request.method)?this.client.request(t):this.getHttpProvider().request(t.request)}setDefaultChain(t,e){if(this.chainId=t,!this.httpProviders[t]){const i=e||d(`${this.name}:${t}`,this.namespace);if(!i)throw new Error(`No RPC url provided for chainId: ${t}`);this.setHttpProvider(t,i);}this.events.emit(u.DEFAULT_CHAIN_CHANGED,`${this.name}:${this.chainId}`);}getAccounts(){const t=this.namespace.accounts;return t?t.filter(e=>e.split(":")[1]===this.chainId.toString()).map(e=>e.split(":")[2])||[]:[]}createHttpProviders(){const t={};return this.namespace.chains.forEach(e=>{var i;t[e]=this.createHttpProvider(e,(i=this.namespace.rpcMap)==null?void 0:i[e]);}),t}getHttpProvider(){const t=`${this.name}:${this.chainId}`,e=this.httpProviders[t];if(typeof e>"u")throw new Error(`JSON-RPC provider for ${t} not found`);return e}setHttpProvider(t,e){const i=this.createHttpProvider(t,e);i&&(this.httpProviders[t]=i);}createHttpProvider(t,e){const i=e||d(t,this.namespace);return typeof i>"u"?void 0:new o$1(new f$1(i,h("disableProviderPing")))}}var ze=Object.defineProperty,ke=(s,t,e)=>t in s?ze(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,j=(s,t,e)=>ke(s,typeof t!="symbol"?t+"":t,e);class We{constructor(t){j(this,"name","tezos"),j(this,"client"),j(this,"httpProviders"),j(this,"events"),j(this,"namespace"),j(this,"chainId"),this.namespace=t.namespace,this.events=h("events"),this.client=h("client"),this.chainId=this.getDefaultChain(),this.httpProviders=this.createHttpProviders();}updateNamespace(t){this.namespace=Object.assign(this.namespace,t);}requestAccounts(){return this.getAccounts()}getDefaultChain(){if(this.chainId)return this.chainId;if(this.namespace.defaultChain)return this.namespace.defaultChain;const t=this.namespace.chains[0];if(!t)throw new Error("ChainId not found");return t.split(":")[1]}request(t){return this.namespace.methods.includes(t.request.method)?this.client.request(t):this.getHttpProvider().request(t.request)}setDefaultChain(t,e){if(this.chainId=t,!this.httpProviders[t]){const i=e||d(`${this.name}:${t}`,this.namespace);if(!i)throw new Error(`No RPC url provided for chainId: ${t}`);this.setHttpProvider(t,i);}this.events.emit(u.DEFAULT_CHAIN_CHANGED,`${this.name}:${this.chainId}`);}getAccounts(){const t=this.namespace.accounts;return t?t.filter(e=>e.split(":")[1]===this.chainId.toString()).map(e=>e.split(":")[2])||[]:[]}createHttpProviders(){const t={};return this.namespace.chains.forEach(e=>{t[e]=this.createHttpProvider(e);}),t}getHttpProvider(){const t=`${this.name}:${this.chainId}`,e=this.httpProviders[t];if(typeof e>"u")throw new Error(`JSON-RPC provider for ${t} not found`);return e}setHttpProvider(t,e){const i=this.createHttpProvider(t,e);i&&(this.httpProviders[t]=i);}createHttpProvider(t,e){const i=e||d(t,this.namespace);return typeof i>"u"?void 0:new o$1(new f$1(i))}}var Ke=Object.defineProperty,Ve=(s,t,e)=>t in s?Ke(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,R$1=(s,t,e)=>Ve(s,typeof t!="symbol"?t+"":t,e);class Xe{constructor(t){R$1(this,"name",I$1),R$1(this,"client"),R$1(this,"httpProviders"),R$1(this,"events"),R$1(this,"namespace"),R$1(this,"chainId"),this.namespace=t.namespace,this.events=h("events"),this.client=h("client"),this.chainId=this.getDefaultChain(),this.httpProviders=this.createHttpProviders();}updateNamespace(t){this.namespace.chains=[...new Set((this.namespace.chains||[]).concat(t.chains||[]))],this.namespace.accounts=[...new Set((this.namespace.accounts||[]).concat(t.accounts||[]))],this.namespace.methods=[...new Set((this.namespace.methods||[]).concat(t.methods||[]))],this.namespace.events=[...new Set((this.namespace.events||[]).concat(t.events||[]))],this.httpProviders=this.createHttpProviders();}requestAccounts(){return this.getAccounts()}request(t){return this.namespace.methods.includes(t.request.method)?this.client.request(t):this.getHttpProvider(t.chainId).request(t.request)}setDefaultChain(t,e){this.httpProviders[t]||this.setHttpProvider(t,e),this.chainId=t,this.events.emit(u.DEFAULT_CHAIN_CHANGED,`${this.name}:${t}`);}getDefaultChain(){if(this.chainId)return this.chainId;if(this.namespace.defaultChain)return this.namespace.defaultChain;const t=this.namespace.chains[0];if(!t)throw new Error("ChainId not found");return t.split(":")[1]}getAccounts(){const t=this.namespace.accounts;return t?[...new Set(t.filter(e=>e.split(":")[1]===this.chainId.toString()).map(e=>e.split(":")[2]))]:[]}createHttpProviders(){var t,e;const i={};return (e=(t=this.namespace)==null?void 0:t.accounts)==null||e.forEach(n=>{const a=Ne$1(n);i[`${a.namespace}:${a.reference}`]=this.createHttpProvider(n);}),i}getHttpProvider(t){const e=this.httpProviders[t];if(typeof e>"u")throw new Error(`JSON-RPC provider for ${t} not found`);return e}setHttpProvider(t,e){const i=this.createHttpProvider(t,e);i&&(this.httpProviders[t]=i);}createHttpProvider(t,e){const i=e||d(t,this.namespace,this.client.core.projectId);if(!i)throw new Error(`No RPC url provided for chainId: ${t}`);return new o$1(new f$1(i,h("disableProviderPing")))}}var Ye=Object.defineProperty,Qe=Object.defineProperties,Ze=Object.getOwnPropertyDescriptors,It=Object.getOwnPropertySymbols,Te=Object.prototype.hasOwnProperty,ts=Object.prototype.propertyIsEnumerable,Y$1=(s,t,e)=>t in s?Ye(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,x=(s,t)=>{for(var e in t||(t={}))Te.call(t,e)&&Y$1(s,e,t[e]);if(It)for(var e of It(t))ts.call(t,e)&&Y$1(s,e,t[e]);return s},Q$1=(s,t)=>Qe(s,Ze(t)),l=(s,t,e)=>Y$1(s,typeof t!="symbol"?t+"":t,e);let B$1 = class B{constructor(t){l(this,"client"),l(this,"namespaces"),l(this,"optionalNamespaces"),l(this,"sessionProperties"),l(this,"scopedProperties"),l(this,"events",new Nt$3),l(this,"rpcProviders",{}),l(this,"session"),l(this,"providerOpts"),l(this,"logger"),l(this,"uri"),l(this,"disableProviderPing",false),this.providerOpts=t,this.logger=typeof t?.logger<"u"&&typeof t?.logger!="string"?t.logger:Ot$1(k$4({level:t?.logger||et$1})),this.disableProviderPing=t?.disableProviderPing||false;}static async init(t){const e=new B(t);return await e.initialize(),e}async request(t,e,i){const[n,a]=this.validateChain(e);if(!this.session)throw new Error("Please call connect() before request()");return await this.getProvider(n).request({request:x({},t),chainId:`${n}:${a}`,topic:this.session.topic,expiry:i})}sendAsync(t,e,i,n){const a=new Date().getTime();this.request(t,i,n).then(r=>e(null,formatJsonRpcResult(a,r))).catch(r=>e(r,void 0));}async enable(){if(!this.client)throw new Error("Sign Client not initialized");return this.session||await this.connect({namespaces:this.namespaces,optionalNamespaces:this.optionalNamespaces,sessionProperties:this.sessionProperties,scopedProperties:this.scopedProperties}),await this.requestAccounts()}async disconnect(){var t;if(!this.session)throw new Error("Please call connect() before enable()");await this.client.disconnect({topic:(t=this.session)==null?void 0:t.topic,reason:Nt$1("USER_DISCONNECTED")}),await this.cleanup();}async connect(t){if(!this.client)throw new Error("Sign Client not initialized");if(this.setNamespaces(t),await this.cleanupPendingPairings(),!t.skipPairing)return await this.pair(t.pairingTopic)}async authenticate(t,e){if(!this.client)throw new Error("Sign Client not initialized");this.setNamespaces(t),await this.cleanupPendingPairings();const{uri:i,response:n}=await this.client.authenticate(t,e);i&&(this.uri=i,this.events.emit("display_uri",i));const a=await n();if(this.session=a.session,this.session){const r=gt(this.session.namespaces);this.namespaces=M$1(this.namespaces,r),await this.persist("namespaces",this.namespaces),this.onConnect();}return a}on(t,e){this.events.on(t,e);}once(t,e){this.events.once(t,e);}removeListener(t,e){this.events.removeListener(t,e);}off(t,e){this.events.off(t,e);}get isWalletConnect(){return  true}async pair(t){const{uri:e,approval:i}=await this.client.connect({pairingTopic:t,requiredNamespaces:this.namespaces,optionalNamespaces:this.optionalNamespaces,sessionProperties:this.sessionProperties,scopedProperties:this.scopedProperties});e&&(this.uri=e,this.events.emit("display_uri",e));const n=await i();this.session=n;const a=gt(n.namespaces);return this.namespaces=M$1(this.namespaces,a),await this.persist("namespaces",this.namespaces),await this.persist("optionalNamespaces",this.optionalNamespaces),this.onConnect(),this.session}setDefaultChain(t,e){try{if(!this.session)return;const[i,n]=this.validateChain(t),a=this.getProvider(i);a.name===I$1?a.setDefaultChain(`${i}:${n}`,e):a.setDefaultChain(n,e);}catch(i){if(!/Please call connect/.test(i.message))throw i}}async cleanupPendingPairings(t={}){this.logger.info("Cleaning up inactive pairings...");const e=this.client.pairing.getAll();if(se$2(e)){for(const i of e)t.deletePairings?this.client.core.expirer.set(i.topic,0):await this.client.core.relayer.subscriber.unsubscribe(i.topic);this.logger.info(`Inactive pairings cleared: ${e.length}`);}}abortPairingAttempt(){this.logger.warn("abortPairingAttempt is deprecated. This is now a no-op.");}async checkStorage(){this.namespaces=await this.getFromStore("namespaces")||{},this.optionalNamespaces=await this.getFromStore("optionalNamespaces")||{},this.session&&this.createProviders();}async initialize(){this.logger.trace("Initialized"),await this.createClient(),await this.checkStorage(),this.registerEventListeners();}async createClient(){var t,e;if(this.client=this.providerOpts.client||await Ee$1.init({core:this.providerOpts.core,logger:this.providerOpts.logger||et$1,relayUrl:this.providerOpts.relayUrl||St,projectId:this.providerOpts.projectId,metadata:this.providerOpts.metadata,storageOptions:this.providerOpts.storageOptions,storage:this.providerOpts.storage,name:this.providerOpts.name,customStoragePrefix:this.providerOpts.customStoragePrefix,telemetryEnabled:this.providerOpts.telemetryEnabled}),this.providerOpts.session)try{this.session=this.client.session.get(this.providerOpts.session.topic);}catch(i){throw this.logger.error("Failed to get session",i),new Error(`The provided session: ${(e=(t=this.providerOpts)==null?void 0:t.session)==null?void 0:e.topic} doesn't exist in the Sign client`)}else {const i=this.client.session.getAll();this.session=i[0];}this.logger.trace("SignClient Initialized");}createProviders(){if(!this.client)throw new Error("Sign Client not initialized");if(!this.session)throw new Error("Session not initialized. Please call connect() before enable()");const t=[...new Set(Object.keys(this.session.namespaces).map(e=>yo$1(e)))];V$1("client",this.client),V$1("events",this.events),V$1("disableProviderPing",this.disableProviderPing),t.forEach(e=>{if(!this.session)return;const i=le(e,this.session),n=ft(i),a=M$1(this.namespaces,this.optionalNamespaces),r=Q$1(x({},a[e]),{accounts:i,chains:n});switch(e){case "eip155":this.rpcProviders[e]=new Ie({namespace:r});break;case "algorand":this.rpcProviders[e]=new De({namespace:r});break;case "solana":this.rpcProviders[e]=new Ae({namespace:r});break;case "cosmos":this.rpcProviders[e]=new Ee({namespace:r});break;case "polkadot":this.rpcProviders[e]=new ve({namespace:r});break;case "cip34":this.rpcProviders[e]=new Re({namespace:r});break;case "elrond":this.rpcProviders[e]=new Fe({namespace:r});break;case "multiversx":this.rpcProviders[e]=new xe({namespace:r});break;case "near":this.rpcProviders[e]=new Je({namespace:r});break;case "tezos":this.rpcProviders[e]=new We({namespace:r});break;default:this.rpcProviders[I$1]?this.rpcProviders[I$1].updateNamespace(r):this.rpcProviders[I$1]=new Xe({namespace:r});}});}registerEventListeners(){if(typeof this.client>"u")throw new Error("Sign Client is not initialized");this.client.on("session_ping",t=>{var e;const{topic:i}=t;i===((e=this.session)==null?void 0:e.topic)&&this.events.emit("session_ping",t);}),this.client.on("session_event",t=>{var e;const{params:i,topic:n}=t;if(n!==((e=this.session)==null?void 0:e.topic))return;const{event:a}=i;if(a.name==="accountsChanged"){const r=a.data;r&&se$2(r)&&this.events.emit("accountsChanged",r.map(vt));}else if(a.name==="chainChanged"){const r=i.chainId,c=i.event.data,o=yo$1(r),m=K$1(r)!==K$1(c)?`${o}:${K$1(c)}`:r;this.onChainChanged(m);}else this.events.emit(a.name,a.data);this.events.emit("session_event",t);}),this.client.on("session_update",({topic:t,params:e})=>{var i,n;if(t!==((i=this.session)==null?void 0:i.topic))return;const{namespaces:a}=e,r=(n=this.client)==null?void 0:n.session.get(t);this.session=Q$1(x({},r),{namespaces:a}),this.onSessionUpdate(),this.events.emit("session_update",{topic:t,params:e});}),this.client.on("session_delete",async t=>{var e;t.topic===((e=this.session)==null?void 0:e.topic)&&(await this.cleanup(),this.events.emit("session_delete",t),this.events.emit("disconnect",Q$1(x({},Nt$1("USER_DISCONNECTED")),{data:t.topic})));}),this.on(u.DEFAULT_CHAIN_CHANGED,t=>{this.onChainChanged(t,true);});}getProvider(t){return this.rpcProviders[t]||this.rpcProviders[I$1]}onSessionUpdate(){Object.keys(this.rpcProviders).forEach(t=>{var e;this.getProvider(t).updateNamespace((e=this.session)==null?void 0:e.namespaces[t]);});}setNamespaces(t){const{namespaces:e={},optionalNamespaces:i={},sessionProperties:n,scopedProperties:a}=t;this.optionalNamespaces=M$1(e,i),this.sessionProperties=n,this.scopedProperties=a;}validateChain(t){const[e,i]=t?.split(":")||["",""];if(!this.namespaces||!Object.keys(this.namespaces).length)return [e,i];if(e&&!Object.keys(this.namespaces||{}).map(r=>yo$1(r)).includes(e))throw new Error(`Namespace '${e}' is not configured. Please call connect() first with namespace config.`);if(e&&i)return [e,i];const n=yo$1(Object.keys(this.namespaces)[0]),a=this.rpcProviders[n].getDefaultChain();return [n,a]}async requestAccounts(){const[t]=this.validateChain();return await this.getProvider(t).requestAccounts()}async onChainChanged(t,e=false){if(!this.namespaces)return;const[i,n]=this.validateChain(t);if(!n)return;this.updateNamespaceChain(i,n),this.events.emit("chainChanged",n);const a=this.getProvider(i).getDefaultChain();e||this.getProvider(i).setDefaultChain(n),this.emitAccountsChangedOnChainChange({namespace:i,previousChainId:a,newChainId:t}),await this.persist("namespaces",this.namespaces);}emitAccountsChangedOnChainChange({namespace:t,previousChainId:e,newChainId:i}){var n,a;try{if(e===i)return;const r=(a=(n=this.session)==null?void 0:n.namespaces[t])==null?void 0:a.accounts;if(!r)return;const c=r.filter(o=>o.includes(`${i}:`)).map(vt);if(!se$2(c))return;this.events.emit("accountsChanged",c);}catch(r){this.logger.warn("Failed to emit accountsChanged on chain change",r);}}updateNamespaceChain(t,e){if(!this.namespaces)return;const i=this.namespaces[t]?t:`${t}:${e}`,n={chains:[],methods:[],events:[],defaultChain:e};this.namespaces[i]?this.namespaces[i]&&(this.namespaces[i].defaultChain=e):this.namespaces[i]=n;}onConnect(){this.createProviders(),this.events.emit("connect",{session:this.session});}async cleanup(){this.namespaces=void 0,this.optionalNamespaces=void 0,this.sessionProperties=void 0,await this.deleteFromStore("namespaces"),await this.deleteFromStore("optionalNamespaces"),await this.deleteFromStore("sessionProperties"),this.session=void 0,await this.cleanupPendingPairings({deletePairings:true}),await this.cleanupStorage();}async persist(t,e){var i;const n=((i=this.session)==null?void 0:i.topic)||"";await this.client.core.storage.setItem(`${U$1}/${t}${n}`,e);}async getFromStore(t){var e;const i=((e=this.session)==null?void 0:e.topic)||"";return await this.client.core.storage.getItem(`${U$1}/${t}${i}`)}async deleteFromStore(t){var e;const i=((e=this.session)==null?void 0:e.topic)||"";await this.client.core.storage.removeItem(`${U$1}/${t}${i}`);}async cleanupStorage(){var t;try{if(((t=this.client)==null?void 0:t.session.length)>0)return;const e=await this.client.core.storage.getKeys();for(const i of e)i.startsWith(U$1)&&await this.client.core.storage.removeItem(i);}catch(e){this.logger.warn("Failed to cleanup storage",e);}}};const es=B$1;

const $="wc",k="ethereum_provider",q=`${$}@2:${k}:`,U="https://rpc.walletconnect.org/v1/",f=["eth_sendTransaction","personal_sign"],A=["eth_accounts","eth_requestAccounts","eth_sendRawTransaction","eth_sign","eth_signTransaction","eth_signTypedData","eth_signTypedData_v3","eth_signTypedData_v4","eth_sendTransaction","personal_sign","wallet_switchEthereumChain","wallet_addEthereumChain","wallet_getPermissions","wallet_requestPermissions","wallet_registerOnboarding","wallet_watchAsset","wallet_scanQRCode","wallet_sendCalls","wallet_getCapabilities","wallet_getCallsStatus","wallet_showCallsStatus"],C=["chainChanged","accountsChanged"],P=["chainChanged","accountsChanged","message","disconnect","connect"],D=async()=>{const{createAppKit:s}=await __vitePreload(() => import('./core-DTyjt6Od.js').then(n => n.X),true?__vite__mapDeps([4,1,2,3]):void 0);return s};var z=Object.defineProperty,L=Object.defineProperties,K=Object.getOwnPropertyDescriptors,M=Object.getOwnPropertySymbols,Q=Object.prototype.hasOwnProperty,V=Object.prototype.propertyIsEnumerable,_=(s,t,e)=>t in s?z(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,v=(s,t)=>{for(var e in t||(t={}))Q.call(t,e)&&_(s,e,t[e]);if(M)for(var e of M(t))V.call(t,e)&&_(s,e,t[e]);return s},w=(s,t)=>L(s,K(t)),p=(s,t,e)=>_(s,typeof t!="symbol"?t+"":t,e);function I(s){return Number(s[0].split(":")[1])}function E(s){return `0x${s.toString(16)}`}function G(s){const{chains:t,optionalChains:e,methods:n,optionalMethods:i,events:a,optionalEvents:o,rpcMap:u}=s;if(!se$2(t))throw new Error("Invalid chains");const c={chains:t,methods:n||f,events:a||C,rpcMap:v({},t.length?{[I(t)]:u[I(t)]}:{})},l=a?.filter(d=>!C.includes(d)),r=n?.filter(d=>!f.includes(d));if(!e&&!o&&!i&&!(l!=null&&l.length)&&!(r!=null&&r.length))return {required:t.length?c:void 0};const m=l?.length&&r?.length||!e,h={chains:[...new Set(m?c.chains.concat(e||[]):e)],methods:[...new Set(c.methods.concat(i!=null&&i.length?i:A))],events:[...new Set(c.events.concat(o!=null&&o.length?o:P))],rpcMap:u};return {required:t.length?c:void 0,optional:e.length?h:void 0}}class b{constructor(){p(this,"events",new eventsExports.EventEmitter),p(this,"namespace","eip155"),p(this,"accounts",[]),p(this,"signer"),p(this,"chainId",1),p(this,"modal"),p(this,"rpc"),p(this,"STORAGE_KEY",q),p(this,"on",(t,e)=>(this.events.on(t,e),this)),p(this,"once",(t,e)=>(this.events.once(t,e),this)),p(this,"removeListener",(t,e)=>(this.events.removeListener(t,e),this)),p(this,"off",(t,e)=>(this.events.off(t,e),this)),p(this,"parseAccount",t=>this.isCompatibleChainId(t)?this.parseAccountId(t).address:t),this.signer={},this.rpc={};}static async init(t){const e=new b;return await e.initialize(t),e}async request(t,e){return await this.signer.request(t,this.formatChainId(this.chainId),e)}sendAsync(t,e,n){this.signer.sendAsync(t,e,this.formatChainId(this.chainId),n);}get connected(){return this.signer.client?this.signer.client.core.relayer.connected:false}get connecting(){return this.signer.client?this.signer.client.core.relayer.connecting:false}async enable(){return this.session||await this.connect(),await this.request({method:"eth_requestAccounts"})}async connect(t){var e;if(!this.signer.client)throw new Error("Provider not initialized. Call init() first");this.loadConnectOpts(t);const{required:n,optional:i}=G(this.rpc);try{const a=await new Promise(async(u,c)=>{var l,r;this.rpc.showQrModal&&((l=this.modal)==null||l.open(),(r=this.modal)==null||r.subscribeState(h=>{!h.open&&!this.signer.session&&(this.signer.abortPairingAttempt(),c(new Error("Connection request reset. Please try again.")));}));const m=t!=null&&t.scopedProperties?{[this.namespace]:t.scopedProperties}:void 0;await this.signer.connect(w(v({namespaces:v({},n&&{[this.namespace]:n})},i&&{optionalNamespaces:{[this.namespace]:i}}),{pairingTopic:t?.pairingTopic,scopedProperties:m})).then(h=>{u(h);}).catch(h=>{var d;(d=this.modal)==null||d.showErrorMessage("Unable to connect"),c(new Error(h.message));});});if(!a)return;const o=Ko$1(a.namespaces,[this.namespace]);this.setChainIds(this.rpc.chains.length?this.rpc.chains:o),this.setAccounts(o),this.events.emit("connect",{chainId:E(this.chainId)});}catch(a){throw this.signer.logger.error(a),a}finally{(e=this.modal)==null||e.close();}}async authenticate(t,e){var n;if(!this.signer.client)throw new Error("Provider not initialized. Call init() first");this.loadConnectOpts({chains:t?.chains});try{const i=await new Promise(async(o,u)=>{var c,l;this.rpc.showQrModal&&((c=this.modal)==null||c.open(),(l=this.modal)==null||l.subscribeState(r=>{!r.open&&!this.signer.session&&(this.signer.abortPairingAttempt(),u(new Error("Connection request reset. Please try again.")));})),await this.signer.authenticate(w(v({},t),{chains:this.rpc.chains}),e).then(r=>{o(r);}).catch(r=>{var m;(m=this.modal)==null||m.showErrorMessage("Unable to connect"),u(new Error(r.message));});}),a=i.session;if(a){const o=Ko$1(a.namespaces,[this.namespace]);this.setChainIds(this.rpc.chains.length?this.rpc.chains:o),this.setAccounts(o),this.events.emit("connect",{chainId:E(this.chainId)});}return i}catch(i){throw this.signer.logger.error(i),i}finally{(n=this.modal)==null||n.close();}}async disconnect(){this.session&&await this.signer.disconnect(),this.reset();}get isWalletConnect(){return  true}get session(){return this.signer.session}registerEventListeners(){this.signer.on("session_event",t=>{const{params:e}=t,{event:n}=e;n.name==="accountsChanged"?(this.accounts=this.parseAccounts(n.data),this.events.emit("accountsChanged",this.accounts)):n.name==="chainChanged"?this.setChainId(this.formatChainId(n.data)):this.events.emit(n.name,n.data),this.events.emit("session_event",t);}),this.signer.on("accountsChanged",t=>{this.accounts=this.parseAccounts(t),this.events.emit("accountsChanged",this.accounts);}),this.signer.on("chainChanged",t=>{const e=parseInt(t);this.chainId=e,this.events.emit("chainChanged",E(this.chainId)),this.persist();}),this.signer.on("session_update",t=>{this.events.emit("session_update",t);}),this.signer.on("session_delete",t=>{this.reset(),this.events.emit("session_delete",t),this.events.emit("disconnect",w(v({},Nt$1("USER_DISCONNECTED")),{data:t.topic,name:"USER_DISCONNECTED"}));}),this.signer.on("display_uri",t=>{this.events.emit("display_uri",t);});}switchEthereumChain(t){this.request({method:"wallet_switchEthereumChain",params:[{chainId:t.toString(16)}]});}isCompatibleChainId(t){return typeof t=="string"?t.startsWith(`${this.namespace}:`):false}formatChainId(t){return `${this.namespace}:${t}`}parseChainId(t){return Number(t.split(":")[1])}setChainIds(t){const e=t.filter(n=>this.isCompatibleChainId(n)).map(n=>this.parseChainId(n));e.length&&(this.chainId=e[0],this.events.emit("chainChanged",E(this.chainId)),this.persist());}setChainId(t){if(this.isCompatibleChainId(t)){const e=this.parseChainId(t);this.chainId=e,this.switchEthereumChain(e);}}parseAccountId(t){const[e,n,i]=t.split(":");return {chainId:`${e}:${n}`,address:i}}setAccounts(t){this.accounts=t.filter(e=>this.parseChainId(this.parseAccountId(e).chainId)===this.chainId).map(e=>this.parseAccountId(e).address),this.events.emit("accountsChanged",this.accounts);}getRpcConfig(t){var e,n;const i=(e=t?.chains)!=null?e:[],a=(n=t?.optionalChains)!=null?n:[],o=i.concat(a);if(!o.length)throw new Error("No chains specified in either `chains` or `optionalChains`");const u=i.length?t?.methods||f:[],c=i.length?t?.events||C:[],l=t?.optionalMethods||[],r=t?.optionalEvents||[],m=t?.rpcMap||this.buildRpcMap(o,t.projectId),h=t?.qrModalOptions||void 0;return {chains:i?.map(d=>this.formatChainId(d)),optionalChains:a.map(d=>this.formatChainId(d)),methods:u,events:c,optionalMethods:l,optionalEvents:r,rpcMap:m,showQrModal:!!(t!=null&&t.showQrModal),qrModalOptions:h,projectId:t.projectId,metadata:t.metadata}}buildRpcMap(t,e){const n={};return t.forEach(i=>{n[i]=this.getRpcUrl(i,e);}),n}async initialize(t){if(this.rpc=this.getRpcConfig(t),this.chainId=this.rpc.chains.length?I(this.rpc.chains):I(this.rpc.optionalChains),this.signer=await es.init({projectId:this.rpc.projectId,metadata:this.rpc.metadata,disableProviderPing:t.disableProviderPing,relayUrl:t.relayUrl,storage:t.storage,storageOptions:t.storageOptions,customStoragePrefix:t.customStoragePrefix,telemetryEnabled:t.telemetryEnabled,logger:t.logger}),this.registerEventListeners(),await this.loadPersistedSession(),this.rpc.showQrModal){let e;try{const n=await D(),{convertWCMToAppKitOptions:i}=await Promise.resolve().then(function(){return nt}),a=i(w(v({},this.rpc.qrModalOptions),{chains:[...new Set([...this.rpc.chains,...this.rpc.optionalChains])],metadata:this.rpc.metadata,projectId:this.rpc.projectId}));if(!a.networks.length)throw new Error("No networks found for WalletConnect\xB7");e=n(w(v({},a),{universalProvider:this.signer,manualWCControl:!0}));}catch(n){throw console.warn(n),new Error("To use QR modal, please install @reown/appkit package")}if(e)try{this.modal=e;}catch(n){throw this.signer.logger.error(n),new Error("Could not generate WalletConnectModal Instance")}}}loadConnectOpts(t){if(!t)return;const{chains:e,optionalChains:n,rpcMap:i}=t;e&&se$2(e)&&(this.rpc.chains=e.map(a=>this.formatChainId(a)),e.forEach(a=>{this.rpc.rpcMap[a]=i?.[a]||this.getRpcUrl(a);})),n&&se$2(n)&&(this.rpc.optionalChains=[],this.rpc.optionalChains=n?.map(a=>this.formatChainId(a)),n.forEach(a=>{this.rpc.rpcMap[a]=i?.[a]||this.getRpcUrl(a);}));}getRpcUrl(t,e){var n;return ((n=this.rpc.rpcMap)==null?void 0:n[t])||`${U}?chainId=eip155:${t}&projectId=${e||this.rpc.projectId}`}async loadPersistedSession(){if(this.session)try{const t=await this.signer.client.core.storage.getItem(`${this.STORAGE_KEY}/chainId`),e=this.session.namespaces[`${this.namespace}:${t}`]?this.session.namespaces[`${this.namespace}:${t}`]:this.session.namespaces[this.namespace];this.setChainIds(t?[this.formatChainId(t)]:e?.accounts),this.setAccounts(e?.accounts);}catch(t){this.signer.logger.error("Failed to load persisted session, clearing state..."),this.signer.logger.error(t),await this.disconnect().catch(e=>this.signer.logger.warn(e));}}reset(){this.chainId=1,this.accounts=[];}persist(){this.session&&this.signer.client.core.storage.setItem(`${this.STORAGE_KEY}/chainId`,this.chainId);}parseAccounts(t){return typeof t=="string"||t instanceof String?[this.parseAccount(t)]:t.map(e=>this.parseAccount(e))}}const Y=b;var H=Object.defineProperty,B=Object.defineProperties,F=Object.getOwnPropertyDescriptors,S=Object.getOwnPropertySymbols,X=Object.prototype.hasOwnProperty,J=Object.prototype.propertyIsEnumerable,T=(s,t,e)=>t in s?H(s,t,{enumerable:true,configurable:true,writable:true,value:e}):s[t]=e,R=(s,t)=>{for(var e in t||(t={}))X.call(t,e)&&T(s,e,t[e]);if(S)for(var e of S(t))J.call(t,e)&&T(s,e,t[e]);return s},Z=(s,t)=>B(s,F(t));function tt(s){if(s)return {"--w3m-font-family":s["--wcm-font-family"],"--w3m-accent":s["--wcm-accent-color"],"--w3m-color-mix":s["--wcm-background-color"],"--w3m-z-index":s["--wcm-z-index"]?Number(s["--wcm-z-index"]):void 0,"--w3m-qr-color":s["--wcm-accent-color"],"--w3m-font-size-master":s["--wcm-text-medium-regular-size"],"--w3m-border-radius-master":s["--wcm-container-border-radius"],"--w3m-color-mix-strength":0}}const et=s=>{const[t,e]=s.split(":");return W({id:e,caipNetworkId:s,chainNamespace:t,name:"",nativeCurrency:{name:"",symbol:"",decimals:8},rpcUrls:{default:{http:["https://rpc.walletconnect.org/v1"]}}})};function st(s){var t,e,n,i,a,o,u;const c=(t=s.chains)==null?void 0:t.map(et).filter(Boolean);if(c.length===0)throw new Error("At least one chain must be specified");const l=c.find(m=>{var h;return m.id===((h=s.defaultChain)==null?void 0:h.id)}),r={projectId:s.projectId,networks:c,themeMode:s.themeMode,themeVariables:tt(s.themeVariables),chainImages:s.chainImages,connectorImages:s.walletImages,defaultNetwork:l,metadata:Z(R({},s.metadata),{name:((e=s.metadata)==null?void 0:e.name)||"WalletConnect",description:((n=s.metadata)==null?void 0:n.description)||"Connect to WalletConnect-compatible wallets",url:((i=s.metadata)==null?void 0:i.url)||"https://walletconnect.org",icons:((a=s.metadata)==null?void 0:a.icons)||["https://walletconnect.org/walletconnect-logo.png"]}),showWallets:true,featuredWalletIds:s.explorerRecommendedWalletIds==="NONE"?[]:Array.isArray(s.explorerRecommendedWalletIds)?s.explorerRecommendedWalletIds:[],excludeWalletIds:s.explorerExcludedWalletIds==="ALL"?[]:Array.isArray(s.explorerExcludedWalletIds)?s.explorerExcludedWalletIds:[],enableEIP6963:false,enableInjected:false,enableCoinbase:true,enableWalletConnect:true,features:{email:false,socials:false}};if((o=s.mobileWallets)!=null&&o.length||(u=s.desktopWallets)!=null&&u.length){const m=[...(s.mobileWallets||[]).map(g=>({id:g.id,name:g.name,links:g.links})),...(s.desktopWallets||[]).map(g=>({id:g.id,name:g.name,links:{native:g.links.native,universal:g.links.universal}}))],h=[...r.featuredWalletIds||[],...r.excludeWalletIds||[]],d=m.filter(g=>!h.includes(g.id));d.length&&(r.customWallets=d);}return r}function W(s){return R({formatters:void 0,fees:void 0,serializers:void 0},s)}var nt=Object.freeze({__proto__:null,convertWCMToAppKitOptions:st,defineChain:W});

const index_es = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    EthereumProvider: Y,
    OPTIONAL_EVENTS: P,
    OPTIONAL_METHODS: A,
    REQUIRED_EVENTS: C,
    REQUIRED_METHODS: f,
    default: b
}, Symbol.toStringTag, { value: 'Module' }));

export { f$1 as $, getLocation_1 as A, concat as B, C$4 as C, sn$2 as D, k$4 as E, A$3 as F, E$5 as G, Hash as H, IEvents as I, i$2 as J, y$3 as K, formatJsonRpcRequest as L, r$1 as M, o$1 as N, Ot$1 as O, f$3 as P, isJsonRpcRequest as Q, isJsonRpcResponse as R, formatJsonRpcResult as S, Po$1 as T, Qe$3 as U, Qo as V, getBigIntRpcId as W, formatJsonRpcError as X, isJsonRpcResult as Y, isJsonRpcError as Z, payloadId as _, aexists as a, index_es as a0, aoutput as b, createView as c, ahash as d, abytes as e, randomBytes as f, concatBytes as g, destr as h, safeJsonStringify as i, createStore as j, clear as k, keys as l, del as m, set$1 as n, get as o, getWindowMetadata_1 as p, fromString as q, rotr as r, safeJsonParse as s, toBytes as t, toString as u, cjs$3 as v, wrapConstructor as w, getDocument_1 as x, getNavigator_1 as y, detect as z };
