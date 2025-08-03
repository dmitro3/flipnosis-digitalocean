import { x as commonjsGlobal, y as encodeFunctionData, z as hashMessage, F as hashTypedData } from './index-C7n_BILb.js';

const getSDKVersion = () => '9.1.0';

// i.e. 0-255 -> '00'-'ff'
const dec2hex = (dec) => dec.toString(16).padStart(2, '0');
const generateId = (len) => {
    const arr = new Uint8Array((len) / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, dec2hex).join('');
};
const generateRequestId = () => {
    if (typeof window !== 'undefined') {
        return generateId(10);
    }
    return new Date().getTime().toString(36);
};

class MessageFormatter {
}
MessageFormatter.makeRequest = (method, params) => {
    const id = generateRequestId();
    return {
        id,
        method,
        params,
        env: {
            sdkVersion: getSDKVersion(),
        },
    };
};
MessageFormatter.makeResponse = (id, data, version) => ({
    id,
    success: true,
    version,
    data,
});
MessageFormatter.makeErrorResponse = (id, error, version) => ({
    id,
    success: false,
    error,
    version,
});

var Methods;
(function (Methods) {
    Methods["sendTransactions"] = "sendTransactions";
    Methods["rpcCall"] = "rpcCall";
    Methods["getChainInfo"] = "getChainInfo";
    Methods["getSafeInfo"] = "getSafeInfo";
    Methods["getTxBySafeTxHash"] = "getTxBySafeTxHash";
    Methods["getSafeBalances"] = "getSafeBalances";
    Methods["signMessage"] = "signMessage";
    Methods["signTypedMessage"] = "signTypedMessage";
    Methods["getEnvironmentInfo"] = "getEnvironmentInfo";
    Methods["getOffChainSignature"] = "getOffChainSignature";
    Methods["requestAddressBook"] = "requestAddressBook";
    Methods["wallet_getPermissions"] = "wallet_getPermissions";
    Methods["wallet_requestPermissions"] = "wallet_requestPermissions";
})(Methods || (Methods = {}));
var RestrictedMethods;
(function (RestrictedMethods) {
    RestrictedMethods["requestAddressBook"] = "requestAddressBook";
})(RestrictedMethods || (RestrictedMethods = {}));

class PostMessageCommunicator {
    constructor(allowedOrigins = null, debugMode = false) {
        this.allowedOrigins = null;
        this.callbacks = new Map();
        this.debugMode = false;
        this.isServer = typeof window === 'undefined';
        this.isValidMessage = ({ origin, data, source }) => {
            const emptyOrMalformed = !data;
            const sentFromParentEl = !this.isServer && source === window.parent;
            const majorVersionNumber = typeof data.version !== 'undefined' && parseInt(data.version.split('.')[0]);
            const allowedSDKVersion = typeof majorVersionNumber === 'number' && majorVersionNumber >= 1;
            let validOrigin = true;
            if (Array.isArray(this.allowedOrigins)) {
                validOrigin = this.allowedOrigins.find((regExp) => regExp.test(origin)) !== undefined;
            }
            return !emptyOrMalformed && sentFromParentEl && allowedSDKVersion && validOrigin;
        };
        this.logIncomingMessage = (msg) => {
            console.info(`Safe Apps SDK v1: A message was received from origin ${msg.origin}. `, msg.data);
        };
        this.onParentMessage = (msg) => {
            if (this.isValidMessage(msg)) {
                this.debugMode && this.logIncomingMessage(msg);
                this.handleIncomingMessage(msg.data);
            }
        };
        this.handleIncomingMessage = (payload) => {
            const { id } = payload;
            const cb = this.callbacks.get(id);
            if (cb) {
                cb(payload);
                this.callbacks.delete(id);
            }
        };
        this.send = (method, params) => {
            const request = MessageFormatter.makeRequest(method, params);
            if (this.isServer) {
                throw new Error("Window doesn't exist");
            }
            window.parent.postMessage(request, '*');
            return new Promise((resolve, reject) => {
                this.callbacks.set(request.id, (response) => {
                    if (!response.success) {
                        reject(new Error(response.error));
                        return;
                    }
                    resolve(response);
                });
            });
        };
        this.allowedOrigins = allowedOrigins;
        this.debugMode = debugMode;
        if (!this.isServer) {
            window.addEventListener('message', this.onParentMessage);
        }
    }
}

const isObjectEIP712TypedData = (obj) => {
    return typeof obj === 'object' && obj != null && 'domain' in obj && 'types' in obj && 'message' in obj;
};

var dist = {};

var endpoint = {};

var utils = {};

var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(utils, "__esModule", { value: true });
utils.insertParams = insertParams;
utils.stringifyQuery = stringifyQuery;
utils.fetchData = fetchData;
utils.getData = getData;
const isErrorResponse = (data) => {
    const isObject = typeof data === 'object' && data !== null;
    return isObject && ('code' in data || 'statusCode' in data) && 'message' in data;
};
function replaceParam(str, key, value) {
    return str.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
}
function insertParams(template, params) {
    return params
        ? Object.keys(params).reduce((result, key) => {
            return replaceParam(result, key, String(params[key]));
        }, template)
        : template;
}
function stringifyQuery(query) {
    if (!query) {
        return '';
    }
    const searchParams = new URLSearchParams();
    Object.keys(query).forEach((key) => {
        if (query[key] != null) {
            searchParams.append(key, String(query[key]));
        }
    });
    const searchString = searchParams.toString();
    return searchString ? `?${searchString}` : '';
}
function parseResponse(resp) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        let json;
        try {
            json = yield resp.json();
        }
        catch (_b) {
            json = {};
        }
        if (!resp.ok) {
            const errTxt = isErrorResponse(json)
                ? `CGW error - ${(_a = json.code) !== null && _a !== void 0 ? _a : json.statusCode}: ${json.message}`
                : `CGW error - status ${resp.statusText}`;
            throw new Error(errTxt);
        }
        return json;
    });
}
function fetchData(url, method, body, headers, credentials) {
    return __awaiter(this, void 0, void 0, function* () {
        const requestHeaders = Object.assign({ 'Content-Type': 'application/json' }, headers);
        const options = {
            method: method !== null && method !== void 0 ? method : 'POST',
            headers: requestHeaders,
        };
        if (credentials) {
            options['credentials'] = credentials;
        }
        if (body != null) {
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }
        const resp = yield fetch(url, options);
        return parseResponse(resp);
    });
}
function getData(url, headers, credentials) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            method: 'GET',
        };
        if (headers) {
            options['headers'] = Object.assign(Object.assign({}, headers), { 'Content-Type': 'application/json' });
        }
        if (credentials) {
            options['credentials'] = credentials;
        }
        const resp = yield fetch(url, options);
        return parseResponse(resp);
    });
}

Object.defineProperty(endpoint, "__esModule", { value: true });
endpoint.postEndpoint = postEndpoint;
endpoint.putEndpoint = putEndpoint;
endpoint.deleteEndpoint = deleteEndpoint;
endpoint.getEndpoint = getEndpoint;
const utils_1 = utils;
function makeUrl(baseUrl, path, pathParams, query) {
    const pathname = (0, utils_1.insertParams)(path, pathParams);
    const search = (0, utils_1.stringifyQuery)(query);
    return `${baseUrl}${pathname}${search}`;
}
function postEndpoint(baseUrl, path, params) {
    const url = makeUrl(baseUrl, path, params === null || params === void 0 ? void 0 : params.path, params === null || params === void 0 ? void 0 : params.query);
    return (0, utils_1.fetchData)(url, 'POST', params === null || params === void 0 ? void 0 : params.body, params === null || params === void 0 ? void 0 : params.headers, params === null || params === void 0 ? void 0 : params.credentials);
}
function putEndpoint(baseUrl, path, params) {
    const url = makeUrl(baseUrl, path, params === null || params === void 0 ? void 0 : params.path, params === null || params === void 0 ? void 0 : params.query);
    return (0, utils_1.fetchData)(url, 'PUT', params === null || params === void 0 ? void 0 : params.body, params === null || params === void 0 ? void 0 : params.headers, params === null || params === void 0 ? void 0 : params.credentials);
}
function deleteEndpoint(baseUrl, path, params) {
    const url = makeUrl(baseUrl, path, params === null || params === void 0 ? void 0 : params.path, params === null || params === void 0 ? void 0 : params.query);
    return (0, utils_1.fetchData)(url, 'DELETE', params === null || params === void 0 ? void 0 : params.body, params === null || params === void 0 ? void 0 : params.headers, params === null || params === void 0 ? void 0 : params.credentials);
}
function getEndpoint(baseUrl, path, params, rawUrl) {
    if (rawUrl) {
        return (0, utils_1.getData)(rawUrl, undefined, params === null || params === void 0 ? void 0 : params.credentials);
    }
    const url = makeUrl(baseUrl, path, params === null || params === void 0 ? void 0 : params.path, params === null || params === void 0 ? void 0 : params.query);
    return (0, utils_1.getData)(url, params === null || params === void 0 ? void 0 : params.headers, params === null || params === void 0 ? void 0 : params.credentials);
}

var config = {};

Object.defineProperty(config, "__esModule", { value: true });
config.DEFAULT_BASE_URL = void 0;
config.DEFAULT_BASE_URL = "https://safe-client.safe.global";

var safeInfo = {};

Object.defineProperty(safeInfo, "__esModule", { value: true });
safeInfo.ImplementationVersionState = void 0;
var ImplementationVersionState;
(function (ImplementationVersionState) {
    ImplementationVersionState["UP_TO_DATE"] = "UP_TO_DATE";
    ImplementationVersionState["OUTDATED"] = "OUTDATED";
    ImplementationVersionState["UNKNOWN"] = "UNKNOWN";
})(ImplementationVersionState || (safeInfo.ImplementationVersionState = ImplementationVersionState = {}));

var safeApps = {};

Object.defineProperty(safeApps, "__esModule", { value: true });
safeApps.SafeAppSocialPlatforms = safeApps.SafeAppFeatures = safeApps.SafeAppAccessPolicyTypes = void 0;
var SafeAppAccessPolicyTypes;
(function (SafeAppAccessPolicyTypes) {
    SafeAppAccessPolicyTypes["NoRestrictions"] = "NO_RESTRICTIONS";
    SafeAppAccessPolicyTypes["DomainAllowlist"] = "DOMAIN_ALLOWLIST";
})(SafeAppAccessPolicyTypes || (safeApps.SafeAppAccessPolicyTypes = SafeAppAccessPolicyTypes = {}));
var SafeAppFeatures;
(function (SafeAppFeatures) {
    SafeAppFeatures["BATCHED_TRANSACTIONS"] = "BATCHED_TRANSACTIONS";
})(SafeAppFeatures || (safeApps.SafeAppFeatures = SafeAppFeatures = {}));
var SafeAppSocialPlatforms;
(function (SafeAppSocialPlatforms) {
    SafeAppSocialPlatforms["TWITTER"] = "TWITTER";
    SafeAppSocialPlatforms["GITHUB"] = "GITHUB";
    SafeAppSocialPlatforms["DISCORD"] = "DISCORD";
    SafeAppSocialPlatforms["TELEGRAM"] = "TELEGRAM";
})(SafeAppSocialPlatforms || (safeApps.SafeAppSocialPlatforms = SafeAppSocialPlatforms = {}));

var transactions = {};

Object.defineProperty(transactions, "__esModule", { value: true });
transactions.LabelValue = transactions.StartTimeValue = transactions.DurationType = transactions.DetailedExecutionInfoType = transactions.TransactionListItemType = transactions.ConflictType = transactions.TransactionInfoType = transactions.SettingsInfoType = transactions.TransactionTokenType = transactions.TransferDirection = transactions.TransactionStatus = transactions.Operation = void 0;
var Operation;
(function (Operation) {
    Operation[Operation["CALL"] = 0] = "CALL";
    Operation[Operation["DELEGATE"] = 1] = "DELEGATE";
})(Operation || (transactions.Operation = Operation = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["AWAITING_CONFIRMATIONS"] = "AWAITING_CONFIRMATIONS";
    TransactionStatus["AWAITING_EXECUTION"] = "AWAITING_EXECUTION";
    TransactionStatus["CANCELLED"] = "CANCELLED";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["SUCCESS"] = "SUCCESS";
})(TransactionStatus || (transactions.TransactionStatus = TransactionStatus = {}));
var TransferDirection;
(function (TransferDirection) {
    TransferDirection["INCOMING"] = "INCOMING";
    TransferDirection["OUTGOING"] = "OUTGOING";
    TransferDirection["UNKNOWN"] = "UNKNOWN";
})(TransferDirection || (transactions.TransferDirection = TransferDirection = {}));
var TransactionTokenType;
(function (TransactionTokenType) {
    TransactionTokenType["ERC20"] = "ERC20";
    TransactionTokenType["ERC721"] = "ERC721";
    TransactionTokenType["NATIVE_COIN"] = "NATIVE_COIN";
})(TransactionTokenType || (transactions.TransactionTokenType = TransactionTokenType = {}));
var SettingsInfoType;
(function (SettingsInfoType) {
    SettingsInfoType["SET_FALLBACK_HANDLER"] = "SET_FALLBACK_HANDLER";
    SettingsInfoType["ADD_OWNER"] = "ADD_OWNER";
    SettingsInfoType["REMOVE_OWNER"] = "REMOVE_OWNER";
    SettingsInfoType["SWAP_OWNER"] = "SWAP_OWNER";
    SettingsInfoType["CHANGE_THRESHOLD"] = "CHANGE_THRESHOLD";
    SettingsInfoType["CHANGE_IMPLEMENTATION"] = "CHANGE_IMPLEMENTATION";
    SettingsInfoType["ENABLE_MODULE"] = "ENABLE_MODULE";
    SettingsInfoType["DISABLE_MODULE"] = "DISABLE_MODULE";
    SettingsInfoType["SET_GUARD"] = "SET_GUARD";
    SettingsInfoType["DELETE_GUARD"] = "DELETE_GUARD";
})(SettingsInfoType || (transactions.SettingsInfoType = SettingsInfoType = {}));
var TransactionInfoType;
(function (TransactionInfoType) {
    TransactionInfoType["TRANSFER"] = "Transfer";
    TransactionInfoType["SETTINGS_CHANGE"] = "SettingsChange";
    TransactionInfoType["CUSTOM"] = "Custom";
    TransactionInfoType["CREATION"] = "Creation";
    TransactionInfoType["SWAP_ORDER"] = "SwapOrder";
    TransactionInfoType["TWAP_ORDER"] = "TwapOrder";
    TransactionInfoType["SWAP_TRANSFER"] = "SwapTransfer";
    TransactionInfoType["NATIVE_STAKING_DEPOSIT"] = "NativeStakingDeposit";
    TransactionInfoType["NATIVE_STAKING_VALIDATORS_EXIT"] = "NativeStakingValidatorsExit";
    TransactionInfoType["NATIVE_STAKING_WITHDRAW"] = "NativeStakingWithdraw";
})(TransactionInfoType || (transactions.TransactionInfoType = TransactionInfoType = {}));
var ConflictType;
(function (ConflictType) {
    ConflictType["NONE"] = "None";
    ConflictType["HAS_NEXT"] = "HasNext";
    ConflictType["END"] = "End";
})(ConflictType || (transactions.ConflictType = ConflictType = {}));
var TransactionListItemType;
(function (TransactionListItemType) {
    TransactionListItemType["TRANSACTION"] = "TRANSACTION";
    TransactionListItemType["LABEL"] = "LABEL";
    TransactionListItemType["CONFLICT_HEADER"] = "CONFLICT_HEADER";
    TransactionListItemType["DATE_LABEL"] = "DATE_LABEL";
})(TransactionListItemType || (transactions.TransactionListItemType = TransactionListItemType = {}));
var DetailedExecutionInfoType;
(function (DetailedExecutionInfoType) {
    DetailedExecutionInfoType["MULTISIG"] = "MULTISIG";
    DetailedExecutionInfoType["MODULE"] = "MODULE";
})(DetailedExecutionInfoType || (transactions.DetailedExecutionInfoType = DetailedExecutionInfoType = {}));
var DurationType;
(function (DurationType) {
    DurationType["AUTO"] = "AUTO";
    DurationType["LIMIT_DURATION"] = "LIMIT_DURATION";
})(DurationType || (transactions.DurationType = DurationType = {}));
var StartTimeValue;
(function (StartTimeValue) {
    StartTimeValue["AT_MINING_TIME"] = "AT_MINING_TIME";
    StartTimeValue["AT_EPOCH"] = "AT_EPOCH";
})(StartTimeValue || (transactions.StartTimeValue = StartTimeValue = {}));
var LabelValue;
(function (LabelValue) {
    LabelValue["Queued"] = "Queued";
    LabelValue["Next"] = "Next";
})(LabelValue || (transactions.LabelValue = LabelValue = {}));

var chains = {};

Object.defineProperty(chains, "__esModule", { value: true });
chains.FEATURES = chains.GAS_PRICE_TYPE = chains.RPC_AUTHENTICATION = void 0;
var RPC_AUTHENTICATION;
(function (RPC_AUTHENTICATION) {
    RPC_AUTHENTICATION["API_KEY_PATH"] = "API_KEY_PATH";
    RPC_AUTHENTICATION["NO_AUTHENTICATION"] = "NO_AUTHENTICATION";
    RPC_AUTHENTICATION["UNKNOWN"] = "UNKNOWN";
})(RPC_AUTHENTICATION || (chains.RPC_AUTHENTICATION = RPC_AUTHENTICATION = {}));
var GAS_PRICE_TYPE;
(function (GAS_PRICE_TYPE) {
    GAS_PRICE_TYPE["ORACLE"] = "ORACLE";
    GAS_PRICE_TYPE["FIXED"] = "FIXED";
    GAS_PRICE_TYPE["FIXED_1559"] = "FIXED1559";
    GAS_PRICE_TYPE["UNKNOWN"] = "UNKNOWN";
})(GAS_PRICE_TYPE || (chains.GAS_PRICE_TYPE = GAS_PRICE_TYPE = {}));
var FEATURES;
(function (FEATURES) {
    FEATURES["ERC721"] = "ERC721";
    FEATURES["SAFE_APPS"] = "SAFE_APPS";
    FEATURES["CONTRACT_INTERACTION"] = "CONTRACT_INTERACTION";
    FEATURES["DOMAIN_LOOKUP"] = "DOMAIN_LOOKUP";
    FEATURES["SPENDING_LIMIT"] = "SPENDING_LIMIT";
    FEATURES["EIP1559"] = "EIP1559";
    FEATURES["SAFE_TX_GAS_OPTIONAL"] = "SAFE_TX_GAS_OPTIONAL";
    FEATURES["TX_SIMULATION"] = "TX_SIMULATION";
    FEATURES["EIP1271"] = "EIP1271";
})(FEATURES || (chains.FEATURES = FEATURES = {}));

var common = {};

Object.defineProperty(common, "__esModule", { value: true });
common.TokenType = void 0;
var TokenType;
(function (TokenType) {
    TokenType["ERC20"] = "ERC20";
    TokenType["ERC721"] = "ERC721";
    TokenType["NATIVE_TOKEN"] = "NATIVE_TOKEN";
    TokenType["UNKNOWN"] = "UNKNOWN";
})(TokenType || (common.TokenType = TokenType = {}));

var masterCopies = {};

Object.defineProperty(masterCopies, "__esModule", { value: true });

var decodedData = {};

Object.defineProperty(decodedData, "__esModule", { value: true });
decodedData.NativeStakingStatus = decodedData.ConfirmationViewTypes = void 0;
var ConfirmationViewTypes;
(function (ConfirmationViewTypes) {
    ConfirmationViewTypes["GENERIC"] = "GENERIC";
    ConfirmationViewTypes["COW_SWAP_ORDER"] = "COW_SWAP_ORDER";
    ConfirmationViewTypes["COW_SWAP_TWAP_ORDER"] = "COW_SWAP_TWAP_ORDER";
    ConfirmationViewTypes["KILN_NATIVE_STAKING_DEPOSIT"] = "KILN_NATIVE_STAKING_DEPOSIT";
    ConfirmationViewTypes["KILN_NATIVE_STAKING_VALIDATORS_EXIT"] = "KILN_NATIVE_STAKING_VALIDATORS_EXIT";
    ConfirmationViewTypes["KILN_NATIVE_STAKING_WITHDRAW"] = "KILN_NATIVE_STAKING_WITHDRAW";
})(ConfirmationViewTypes || (decodedData.ConfirmationViewTypes = ConfirmationViewTypes = {}));
var NativeStakingStatus;
(function (NativeStakingStatus) {
    NativeStakingStatus["NOT_STAKED"] = "NOT_STAKED";
    NativeStakingStatus["ACTIVATING"] = "ACTIVATING";
    NativeStakingStatus["DEPOSIT_IN_PROGRESS"] = "DEPOSIT_IN_PROGRESS";
    NativeStakingStatus["ACTIVE"] = "ACTIVE";
    NativeStakingStatus["EXIT_REQUESTED"] = "EXIT_REQUESTED";
    NativeStakingStatus["EXITING"] = "EXITING";
    NativeStakingStatus["EXITED"] = "EXITED";
    NativeStakingStatus["SLASHED"] = "SLASHED";
})(NativeStakingStatus || (decodedData.NativeStakingStatus = NativeStakingStatus = {}));

var safeMessages = {};

Object.defineProperty(safeMessages, "__esModule", { value: true });
safeMessages.SafeMessageStatus = safeMessages.SafeMessageListItemType = void 0;
var SafeMessageListItemType;
(function (SafeMessageListItemType) {
    SafeMessageListItemType["DATE_LABEL"] = "DATE_LABEL";
    SafeMessageListItemType["MESSAGE"] = "MESSAGE";
})(SafeMessageListItemType || (safeMessages.SafeMessageListItemType = SafeMessageListItemType = {}));
var SafeMessageStatus;
(function (SafeMessageStatus) {
    SafeMessageStatus["NEEDS_CONFIRMATION"] = "NEEDS_CONFIRMATION";
    SafeMessageStatus["CONFIRMED"] = "CONFIRMED";
})(SafeMessageStatus || (safeMessages.SafeMessageStatus = SafeMessageStatus = {}));

var notifications = {};

Object.defineProperty(notifications, "__esModule", { value: true });
notifications.DeviceType = void 0;
var DeviceType;
(function (DeviceType) {
    DeviceType["ANDROID"] = "ANDROID";
    DeviceType["IOS"] = "IOS";
    DeviceType["WEB"] = "WEB";
})(DeviceType || (notifications.DeviceType = DeviceType = {}));

var relay = {};

Object.defineProperty(relay, "__esModule", { value: true });

(function (exports) {
	var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
	    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.setBaseUrl = void 0;
	exports.relayTransaction = relayTransaction;
	exports.getRelayCount = getRelayCount;
	exports.getSafeInfo = getSafeInfo;
	exports.getIncomingTransfers = getIncomingTransfers;
	exports.getModuleTransactions = getModuleTransactions;
	exports.getMultisigTransactions = getMultisigTransactions;
	exports.getBalances = getBalances;
	exports.getFiatCurrencies = getFiatCurrencies;
	exports.getOwnedSafes = getOwnedSafes;
	exports.getAllOwnedSafes = getAllOwnedSafes;
	exports.getCollectibles = getCollectibles;
	exports.getCollectiblesPage = getCollectiblesPage;
	exports.getTransactionHistory = getTransactionHistory;
	exports.getTransactionQueue = getTransactionQueue;
	exports.getTransactionDetails = getTransactionDetails;
	exports.deleteTransaction = deleteTransaction;
	exports.postSafeGasEstimation = postSafeGasEstimation;
	exports.getNonces = getNonces;
	exports.proposeTransaction = proposeTransaction;
	exports.getConfirmationView = getConfirmationView;
	exports.getTxPreview = getTxPreview;
	exports.getChainsConfig = getChainsConfig;
	exports.getChainConfig = getChainConfig;
	exports.getSafeApps = getSafeApps;
	exports.getMasterCopies = getMasterCopies;
	exports.getDecodedData = getDecodedData;
	exports.getSafeMessages = getSafeMessages;
	exports.getSafeMessage = getSafeMessage;
	exports.proposeSafeMessage = proposeSafeMessage;
	exports.confirmSafeMessage = confirmSafeMessage;
	exports.getDelegates = getDelegates;
	exports.registerDevice = registerDevice;
	exports.unregisterSafe = unregisterSafe;
	exports.unregisterDevice = unregisterDevice;
	exports.registerEmail = registerEmail;
	exports.changeEmail = changeEmail;
	exports.resendEmailVerificationCode = resendEmailVerificationCode;
	exports.verifyEmail = verifyEmail;
	exports.getRegisteredEmail = getRegisteredEmail;
	exports.deleteRegisteredEmail = deleteRegisteredEmail;
	exports.registerRecoveryModule = registerRecoveryModule;
	exports.unsubscribeSingle = unsubscribeSingle;
	exports.unsubscribeAll = unsubscribeAll;
	exports.getSafeOverviews = getSafeOverviews;
	exports.getContract = getContract;
	exports.getAuthNonce = getAuthNonce;
	exports.verifyAuth = verifyAuth;
	exports.createAccount = createAccount;
	exports.getAccount = getAccount;
	exports.deleteAccount = deleteAccount;
	exports.getAccountDataTypes = getAccountDataTypes;
	exports.getAccountDataSettings = getAccountDataSettings;
	exports.putAccountDataSettings = putAccountDataSettings;
	exports.getIndexingStatus = getIndexingStatus;
	const endpoint_1 = endpoint;
	const config_1 = config;
	__exportStar(safeInfo, exports);
	__exportStar(safeApps, exports);
	__exportStar(transactions, exports);
	__exportStar(chains, exports);
	__exportStar(common, exports);
	__exportStar(masterCopies, exports);
	__exportStar(decodedData, exports);
	__exportStar(safeMessages, exports);
	__exportStar(notifications, exports);
	__exportStar(relay, exports);
	// Can be set externally to a different CGW host
	let baseUrl = config_1.DEFAULT_BASE_URL;
	/**
	 * Set the base CGW URL
	 */
	const setBaseUrl = (url) => {
	    baseUrl = url;
	};
	exports.setBaseUrl = setBaseUrl;
	/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
	/**
	 * Relay a transaction from a Safe
	 */
	function relayTransaction(chainId, body) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/relay', { path: { chainId }, body });
	}
	/**
	 * Get the relay limit and number of remaining relays remaining
	 */
	function getRelayCount(chainId, address) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/relay/{address}', { path: { chainId, address } });
	}
	/**
	 * Get basic information about a Safe. E.g. owners, modules, version etc
	 */
	function getSafeInfo(chainId, address) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{address}', { path: { chainId, address } });
	}
	/**
	 * Get filterable list of incoming transactions
	 */
	function getIncomingTransfers(chainId, address, query, pageUrl) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{address}/incoming-transfers/', {
	        path: { chainId, address },
	        query,
	    }, pageUrl);
	}
	/**
	 * Get filterable list of module transactions
	 */
	function getModuleTransactions(chainId, address, query, pageUrl) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{address}/module-transactions/', {
	        path: { chainId, address },
	        query,
	    }, pageUrl);
	}
	/**
	 * Get filterable list of multisig transactions
	 */
	function getMultisigTransactions(chainId, address, query, pageUrl) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{address}/multisig-transactions/', {
	        path: { chainId, address },
	        query,
	    }, pageUrl);
	}
	/**
	 * Get the total balance and all assets stored in a Safe
	 */
	function getBalances(chainId, address, currency = 'usd', query = {}) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{address}/balances/{currency}', {
	        path: { chainId, address, currency },
	        query,
	    });
	}
	/**
	 * Get a list of supported fiat currencies (e.g. USD, EUR etc)
	 */
	function getFiatCurrencies() {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/balances/supported-fiat-codes');
	}
	/**
	 * Get the addresses of all Safes belonging to an owner
	 */
	function getOwnedSafes(chainId, address) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/owners/{address}/safes', { path: { chainId, address } });
	}
	/**
	 * Get the addresses of all Safes belonging to an owner on all chains
	 */
	function getAllOwnedSafes(address) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/owners/{address}/safes', { path: { address } });
	}
	/**
	 * Get NFTs stored in a Safe
	 */
	function getCollectibles(chainId, address, query = {}) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{address}/collectibles', {
	        path: { chainId, address },
	        query,
	    });
	}
	/**
	 * Get NFTs stored in a Safe
	 */
	function getCollectiblesPage(chainId, address, query = {}, pageUrl) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v2/chains/{chainId}/safes/{address}/collectibles', { path: { chainId, address }, query }, pageUrl);
	}
	/**
	 * Get a list of past Safe transactions
	 */
	function getTransactionHistory(chainId, address, query = {}, pageUrl) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/transactions/history', { path: { chainId, safe_address: address }, query }, pageUrl);
	}
	/**
	 * Get the list of pending transactions
	 */
	function getTransactionQueue(chainId, address, query = {}, pageUrl) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/transactions/queued', { path: { chainId, safe_address: address }, query }, pageUrl);
	}
	/**
	 * Get the details of an individual transaction by its id
	 */
	function getTransactionDetails(chainId, transactionId) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/transactions/{transactionId}', {
	        path: { chainId, transactionId },
	    });
	}
	/**
	 * Delete a transaction by its safeTxHash
	 */
	function deleteTransaction(chainId, safeTxHash, signature) {
	    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/chains/{chainId}/transactions/{safeTxHash}', {
	        path: { chainId, safeTxHash },
	        body: { signature },
	    });
	}
	/**
	 * Request a gas estimate & recommmended tx nonce for a created transaction
	 */
	function postSafeGasEstimation(chainId, address, body) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v2/chains/{chainId}/safes/{safe_address}/multisig-transactions/estimations', {
	        path: { chainId, safe_address: address },
	        body,
	    });
	}
	function getNonces(chainId, address) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/nonces', {
	        path: { chainId, safe_address: address },
	    });
	}
	/**
	 * Propose a new transaction for other owners to sign/execute
	 */
	function proposeTransaction(chainId, address, body) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/transactions/{safe_address}/propose', {
	        path: { chainId, safe_address: address },
	        body,
	    });
	}
	/**
	 * Returns decoded data
	 */
	function getConfirmationView(chainId, safeAddress, operation, data, to, value) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/views/transaction-confirmation', {
	        path: { chainId, safe_address: safeAddress },
	        body: { operation, data, to, value },
	    });
	}
	/**
	 * Get a tx preview
	 */
	function getTxPreview(chainId, safeAddress, operation, data, to, value) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/transactions/{safe_address}/preview', {
	        path: { chainId, safe_address: safeAddress },
	        body: { operation, data, to, value },
	    });
	}
	/**
	 * Returns all defined chain configs
	 */
	function getChainsConfig(query) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains', {
	        query,
	    });
	}
	/**
	 * Returns a chain config
	 */
	function getChainConfig(chainId) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}', {
	        path: { chainId: chainId },
	    });
	}
	/**
	 * Returns Safe Apps List
	 */
	function getSafeApps(chainId, query = {}) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safe-apps', {
	        path: { chainId: chainId },
	        query,
	    });
	}
	/**
	 * Returns list of Master Copies
	 */
	function getMasterCopies(chainId) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/about/master-copies', {
	        path: { chainId: chainId },
	    });
	}
	/**
	 * Returns decoded data
	 */
	function getDecodedData(chainId, operation, encodedData, to) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/data-decoder', {
	        path: { chainId: chainId },
	        body: { operation, data: encodedData, to },
	    });
	}
	/**
	 * Returns list of `SafeMessage`s
	 */
	function getSafeMessages(chainId, address, pageUrl) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/messages', { path: { chainId, safe_address: address }, query: {} }, pageUrl);
	}
	/**
	 * Returns a `SafeMessage`
	 */
	function getSafeMessage(chainId, messageHash) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/messages/{message_hash}', {
	        path: { chainId, message_hash: messageHash },
	    });
	}
	/**
	 * Propose a new `SafeMessage` for other owners to sign
	 */
	function proposeSafeMessage(chainId, address, body) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/messages', {
	        path: { chainId, safe_address: address },
	        body,
	    });
	}
	/**
	 * Add a confirmation to a `SafeMessage`
	 */
	function confirmSafeMessage(chainId, messageHash, body) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/messages/{message_hash}/signatures', {
	        path: { chainId, message_hash: messageHash },
	        body,
	    });
	}
	/**
	 * Returns a list of delegates
	 */
	function getDelegates(chainId, query = {}) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v2/chains/{chainId}/delegates', {
	        path: { chainId },
	        query,
	    });
	}
	/**
	 * Registers a device/Safe for notifications
	 */
	function registerDevice(body) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/register/notifications', {
	        body,
	    });
	}
	/**
	 * Unregisters a Safe from notifications
	 */
	function unregisterSafe(chainId, address, uuid) {
	    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/chains/{chainId}/notifications/devices/{uuid}/safes/{safe_address}', {
	        path: { chainId, safe_address: address, uuid },
	    });
	}
	/**
	 * Unregisters a device from notifications
	 */
	function unregisterDevice(chainId, uuid) {
	    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/chains/{chainId}/notifications/devices/{uuid}', {
	        path: { chainId, uuid },
	    });
	}
	/**
	 * Registers a email address for a safe signer.
	 *
	 * The signer wallet has to sign a message of format: `email-register-{chainId}-{safeAddress}-{emailAddress}-{signer}-{timestamp}`
	 * The signature is valid for 5 minutes.
	 *
	 * @param chainId
	 * @param safeAddress
	 * @param body Signer address and email address
	 * @param headers Signature and Signature timestamp
	 * @returns 200 if signature matches the data
	 */
	function registerEmail(chainId, safeAddress, body, headers) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/emails', {
	        path: { chainId, safe_address: safeAddress },
	        body,
	        headers,
	    });
	}
	/**
	 * Changes an already registered email address for a safe signer. The new email address still needs to be verified.
	 *
	 * The signer wallet has to sign a message of format: `email-edit-{chainId}-{safeAddress}-{emailAddress}-{signer}-{timestamp}`
	 * The signature is valid for 5 minutes.
	 *
	 * @param chainId
	 * @param safeAddress
	 * @param signerAddress
	 * @param body New email address
	 * @param headers Signature and Signature timestamp
	 * @returns 202 if signature matches the data
	 */
	function changeEmail(chainId, safeAddress, signerAddress, body, headers) {
	    return (0, endpoint_1.putEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/emails/{signer}', {
	        path: { chainId, safe_address: safeAddress, signer: signerAddress },
	        body,
	        headers,
	    });
	}
	/**
	 * Resends an email verification code.
	 */
	function resendEmailVerificationCode(chainId, safeAddress, signerAddress) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/emails/{signer}/verify-resend', {
	        path: { chainId, safe_address: safeAddress, signer: signerAddress },
	        body: '',
	    });
	}
	/**
	 * Verifies a pending email address registration.
	 *
	 * @param chainId
	 * @param safeAddress
	 * @param signerAddress address who signed the email registration
	 * @param body Verification code
	 */
	function verifyEmail(chainId, safeAddress, signerAddress, body) {
	    return (0, endpoint_1.putEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/emails/{signer}/verify', {
	        path: { chainId, safe_address: safeAddress, signer: signerAddress },
	        body,
	    });
	}
	/**
	 * Gets the registered email address of the signer
	 *
	 * The signer wallet will have to sign a message of format: `email-retrieval-{chainId}-{safe}-{signer}-{timestamp}`
	 * The signature is valid for 5 minutes.
	 *
	 * @param chainId
	 * @param safeAddress
	 * @param signerAddress address of the owner of the Safe
	 *
	 * @returns email address and verified flag
	 */
	function getRegisteredEmail(chainId, safeAddress, signerAddress, headers) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/emails/{signer}', {
	        path: { chainId, safe_address: safeAddress, signer: signerAddress },
	        headers,
	    });
	}
	/**
	 * Delete a registered email address for the signer
	 *
	 * The signer wallet will have to sign a message of format: `email-delete-{chainId}-{safe}-{signer}-{timestamp}`
	 * The signature is valid for 5 minutes.
	 *
	 * @param chainId
	 * @param safeAddress
	 * @param signerAddress
	 * @param headers
	 */
	function deleteRegisteredEmail(chainId, safeAddress, signerAddress, headers) {
	    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/emails/{signer}', {
	        path: { chainId, safe_address: safeAddress, signer: signerAddress },
	        headers,
	    });
	}
	/**
	 * Register a recovery module for receiving alerts
	 * @param chainId
	 * @param safeAddress
	 * @param body - { moduleAddress: string }
	 */
	function registerRecoveryModule(chainId, safeAddress, body) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/chains/{chainId}/safes/{safe_address}/recovery', {
	        path: { chainId, safe_address: safeAddress },
	        body,
	    });
	}
	/**
	 * Delete email subscription for a single category
	 * @param query
	 */
	function unsubscribeSingle(query) {
	    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/subscriptions', { query });
	}
	/**
	 * Delete email subscription for all categories
	 * @param query
	 */
	function unsubscribeAll(query) {
	    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/subscriptions/all', { query });
	}
	/**
	 * Get Safe overviews per address
	 */
	function getSafeOverviews(safes, query) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/safes', {
	        query: Object.assign(Object.assign({}, query), { safes: safes.join(',') }),
	    });
	}
	function getContract(chainId, contractAddress) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/contracts/{contractAddress}', {
	        path: {
	            chainId: chainId,
	            contractAddress: contractAddress,
	        },
	    });
	}
	function getAuthNonce() {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/auth/nonce', { credentials: 'include' });
	}
	function verifyAuth(body) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/auth/verify', {
	        body,
	        credentials: 'include',
	    });
	}
	function createAccount(body) {
	    return (0, endpoint_1.postEndpoint)(baseUrl, '/v1/accounts', {
	        body,
	        credentials: 'include',
	    });
	}
	function getAccount(address) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/accounts/{address}', {
	        path: { address },
	        credentials: 'include',
	    });
	}
	function deleteAccount(address) {
	    return (0, endpoint_1.deleteEndpoint)(baseUrl, '/v1/accounts/{address}', {
	        path: { address },
	        credentials: 'include',
	    });
	}
	function getAccountDataTypes() {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/accounts/data-types');
	}
	function getAccountDataSettings(address) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/accounts/{address}/data-settings', {
	        path: { address },
	        credentials: 'include',
	    });
	}
	function putAccountDataSettings(address, body) {
	    return (0, endpoint_1.putEndpoint)(baseUrl, '/v1/accounts/{address}/data-settings', {
	        path: { address },
	        body,
	        credentials: 'include',
	    });
	}
	function getIndexingStatus(chainId) {
	    return (0, endpoint_1.getEndpoint)(baseUrl, '/v1/chains/{chainId}/about/indexing', {
	        path: { chainId },
	    });
	}
	/* eslint-enable @typescript-eslint/explicit-module-boundary-types */
	
} (dist));

class TXs {
    constructor(communicator) {
        this.communicator = communicator;
    }
    async getBySafeTxHash(safeTxHash) {
        if (!safeTxHash) {
            throw new Error('Invalid safeTxHash');
        }
        const response = await this.communicator.send(Methods.getTxBySafeTxHash, { safeTxHash });
        return response.data;
    }
    async signMessage(message) {
        const messagePayload = {
            message,
        };
        const response = await this.communicator.send(Methods.signMessage, messagePayload);
        return response.data;
    }
    async signTypedMessage(typedData) {
        if (!isObjectEIP712TypedData(typedData)) {
            throw new Error('Invalid typed data');
        }
        const response = await this.communicator.send(Methods.signTypedMessage, { typedData });
        return response.data;
    }
    async send({ txs, params }) {
        if (!txs || !txs.length) {
            throw new Error('No transactions were passed');
        }
        const messagePayload = {
            txs,
            params,
        };
        const response = await this.communicator.send(Methods.sendTransactions, messagePayload);
        return response.data;
    }
}

const RPC_CALLS = {
    eth_call: 'eth_call',
    eth_gasPrice: 'eth_gasPrice',
    eth_getLogs: 'eth_getLogs',
    eth_getBalance: 'eth_getBalance',
    eth_getCode: 'eth_getCode',
    eth_getBlockByHash: 'eth_getBlockByHash',
    eth_getBlockByNumber: 'eth_getBlockByNumber',
    eth_getStorageAt: 'eth_getStorageAt',
    eth_getTransactionByHash: 'eth_getTransactionByHash',
    eth_getTransactionReceipt: 'eth_getTransactionReceipt',
    eth_getTransactionCount: 'eth_getTransactionCount',
    eth_estimateGas: 'eth_estimateGas',
    safe_setSettings: 'safe_setSettings',
};

const inputFormatters = {
    defaultBlockParam: (arg = 'latest') => arg,
    returnFullTxObjectParam: (arg = false) => arg,
    blockNumberToHex: (arg) => Number.isInteger(arg) ? `0x${arg.toString(16)}` : arg,
};
class Eth {
    constructor(communicator) {
        this.communicator = communicator;
        this.call = this.buildRequest({
            call: RPC_CALLS.eth_call,
            formatters: [null, inputFormatters.defaultBlockParam],
        });
        this.getBalance = this.buildRequest({
            call: RPC_CALLS.eth_getBalance,
            formatters: [null, inputFormatters.defaultBlockParam],
        });
        this.getCode = this.buildRequest({
            call: RPC_CALLS.eth_getCode,
            formatters: [null, inputFormatters.defaultBlockParam],
        });
        this.getStorageAt = this.buildRequest({
            call: RPC_CALLS.eth_getStorageAt,
            formatters: [null, inputFormatters.blockNumberToHex, inputFormatters.defaultBlockParam],
        });
        this.getPastLogs = this.buildRequest({
            call: RPC_CALLS.eth_getLogs,
        });
        this.getBlockByHash = this.buildRequest({
            call: RPC_CALLS.eth_getBlockByHash,
            formatters: [null, inputFormatters.returnFullTxObjectParam],
        });
        this.getBlockByNumber = this.buildRequest({
            call: RPC_CALLS.eth_getBlockByNumber,
            formatters: [inputFormatters.blockNumberToHex, inputFormatters.returnFullTxObjectParam],
        });
        this.getTransactionByHash = this.buildRequest({
            call: RPC_CALLS.eth_getTransactionByHash,
        });
        this.getTransactionReceipt = this.buildRequest({
            call: RPC_CALLS.eth_getTransactionReceipt,
        });
        this.getTransactionCount = this.buildRequest({
            call: RPC_CALLS.eth_getTransactionCount,
            formatters: [null, inputFormatters.defaultBlockParam],
        });
        this.getGasPrice = this.buildRequest({
            call: RPC_CALLS.eth_gasPrice,
        });
        this.getEstimateGas = (transaction) => this.buildRequest({
            call: RPC_CALLS.eth_estimateGas,
        })([transaction]);
        this.setSafeSettings = this.buildRequest({
            call: RPC_CALLS.safe_setSettings,
        });
    }
    buildRequest(args) {
        const { call, formatters } = args;
        return async (params) => {
            if (formatters && Array.isArray(params)) {
                formatters.forEach((formatter, i) => {
                    if (formatter) {
                        params[i] = formatter(params[i]);
                    }
                });
            }
            const payload = {
                call,
                params: params || [],
            };
            const response = await this.communicator.send(Methods.rpcCall, payload);
            return response.data;
        };
    }
}

const MAGIC_VALUE = '0x1626ba7e';
const MAGIC_VALUE_BYTES = '0x20c13b0b';

const PERMISSIONS_REQUEST_REJECTED = 4001;
class PermissionsError extends Error {
    constructor(message, code, data) {
        super(message);
        this.code = code;
        this.data = data;
        // Should adjust prototype manually because how TS handles the type extension compilation
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, PermissionsError.prototype);
    }
}

class Wallet {
    constructor(communicator) {
        this.communicator = communicator;
    }
    async getPermissions() {
        const response = await this.communicator.send(Methods.wallet_getPermissions, undefined);
        return response.data;
    }
    async requestPermissions(permissions) {
        if (!this.isPermissionRequestValid(permissions)) {
            throw new PermissionsError('Permissions request is invalid', PERMISSIONS_REQUEST_REJECTED);
        }
        try {
            const response = await this.communicator.send(Methods.wallet_requestPermissions, permissions);
            return response.data;
        }
        catch {
            throw new PermissionsError('Permissions rejected', PERMISSIONS_REQUEST_REJECTED);
        }
    }
    isPermissionRequestValid(permissions) {
        return permissions.every((pr) => {
            if (typeof pr === 'object') {
                return Object.keys(pr).every((method) => {
                    if (Object.values(RestrictedMethods).includes(method)) {
                        return true;
                    }
                    return false;
                });
            }
            return false;
        });
    }
}

const hasPermission = (required, permissions) => permissions.some((permission) => permission.parentCapability === required);
const requirePermission = () => (_, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = async function () {
        // @ts-expect-error accessing private property from decorator. 'this' context is the class instance
        const wallet = new Wallet(this.communicator);
        let currentPermissions = await wallet.getPermissions();
        if (!hasPermission(propertyKey, currentPermissions)) {
            currentPermissions = await wallet.requestPermissions([{ [propertyKey]: {} }]);
        }
        if (!hasPermission(propertyKey, currentPermissions)) {
            throw new PermissionsError('Permissions rejected', PERMISSIONS_REQUEST_REJECTED);
        }
        return originalMethod.apply(this);
    };
    return descriptor;
};

var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
class Safe {
    constructor(communicator) {
        this.communicator = communicator;
    }
    async getChainInfo() {
        const response = await this.communicator.send(Methods.getChainInfo, undefined);
        return response.data;
    }
    async getInfo() {
        const response = await this.communicator.send(Methods.getSafeInfo, undefined);
        return response.data;
    }
    // There is a possibility that this method will change because we may add pagination to the endpoint
    async experimental_getBalances({ currency = 'usd' } = {}) {
        const response = await this.communicator.send(Methods.getSafeBalances, {
            currency,
        });
        return response.data;
    }
    async check1271Signature(messageHash, signature = '0x') {
        const safeInfo = await this.getInfo();
        const encodedIsValidSignatureCall = encodeFunctionData({
            abi: [
                {
                    constant: false,
                    inputs: [
                        {
                            name: '_dataHash',
                            type: 'bytes32',
                        },
                        {
                            name: '_signature',
                            type: 'bytes',
                        },
                    ],
                    name: 'isValidSignature',
                    outputs: [
                        {
                            name: '',
                            type: 'bytes4',
                        },
                    ],
                    payable: false,
                    stateMutability: 'nonpayable',
                    type: 'function',
                },
            ],
            functionName: 'isValidSignature',
            args: [messageHash, signature],
        });
        const payload = {
            call: RPC_CALLS.eth_call,
            params: [
                {
                    to: safeInfo.safeAddress,
                    data: encodedIsValidSignatureCall,
                },
                'latest',
            ],
        };
        try {
            const response = await this.communicator.send(Methods.rpcCall, payload);
            return response.data.slice(0, 10).toLowerCase() === MAGIC_VALUE;
        }
        catch (err) {
            return false;
        }
    }
    async check1271SignatureBytes(messageHash, signature = '0x') {
        const safeInfo = await this.getInfo();
        const encodedIsValidSignatureCall = encodeFunctionData({
            abi: [
                {
                    constant: false,
                    inputs: [
                        {
                            name: '_data',
                            type: 'bytes',
                        },
                        {
                            name: '_signature',
                            type: 'bytes',
                        },
                    ],
                    name: 'isValidSignature',
                    outputs: [
                        {
                            name: '',
                            type: 'bytes4',
                        },
                    ],
                    payable: false,
                    stateMutability: 'nonpayable',
                    type: 'function',
                },
            ],
            functionName: 'isValidSignature',
            args: [messageHash, signature],
        });
        const payload = {
            call: RPC_CALLS.eth_call,
            params: [
                {
                    to: safeInfo.safeAddress,
                    data: encodedIsValidSignatureCall,
                },
                'latest',
            ],
        };
        try {
            const response = await this.communicator.send(Methods.rpcCall, payload);
            return response.data.slice(0, 10).toLowerCase() === MAGIC_VALUE_BYTES;
        }
        catch (err) {
            return false;
        }
    }
    calculateMessageHash(message) {
        return hashMessage(message);
    }
    calculateTypedMessageHash(typedMessage) {
        const chainId = typeof typedMessage.domain.chainId === 'object'
            ? typedMessage.domain.chainId.toNumber()
            : Number(typedMessage.domain.chainId);
        let primaryType = typedMessage.primaryType;
        if (!primaryType) {
            const fields = Object.values(typedMessage.types);
            // We try to infer primaryType (simplified ether's version)
            const primaryTypes = Object.keys(typedMessage.types).filter((typeName) => fields.every((dataTypes) => dataTypes.every(({ type }) => type.replace('[', '').replace(']', '') !== typeName)));
            if (primaryTypes.length === 0 || primaryTypes.length > 1)
                throw new Error('Please specify primaryType');
            primaryType = primaryTypes[0];
        }
        return hashTypedData({
            message: typedMessage.message,
            domain: {
                ...typedMessage.domain,
                chainId,
                verifyingContract: typedMessage.domain.verifyingContract,
                salt: typedMessage.domain.salt,
            },
            types: typedMessage.types,
            primaryType,
        });
    }
    async getOffChainSignature(messageHash) {
        const response = await this.communicator.send(Methods.getOffChainSignature, messageHash);
        return response.data;
    }
    async isMessageSigned(message, signature = '0x') {
        let check;
        if (typeof message === 'string') {
            check = async () => {
                const messageHash = this.calculateMessageHash(message);
                const messageHashSigned = await this.isMessageHashSigned(messageHash, signature);
                return messageHashSigned;
            };
        }
        if (isObjectEIP712TypedData(message)) {
            check = async () => {
                const messageHash = this.calculateTypedMessageHash(message);
                const messageHashSigned = await this.isMessageHashSigned(messageHash, signature);
                return messageHashSigned;
            };
        }
        if (check) {
            const isValid = await check();
            return isValid;
        }
        throw new Error('Invalid message type');
    }
    async isMessageHashSigned(messageHash, signature = '0x') {
        const checks = [this.check1271Signature.bind(this), this.check1271SignatureBytes.bind(this)];
        for (const check of checks) {
            const isValid = await check(messageHash, signature);
            if (isValid) {
                return true;
            }
        }
        return false;
    }
    async getEnvironmentInfo() {
        const response = await this.communicator.send(Methods.getEnvironmentInfo, undefined);
        return response.data;
    }
    async requestAddressBook() {
        const response = await this.communicator.send(Methods.requestAddressBook, undefined);
        return response.data;
    }
}
__decorate([
    requirePermission()
], Safe.prototype, "requestAddressBook", null);

class SafeAppsSDK {
    constructor(opts = {}) {
        const { allowedDomains = null, debug = false } = opts;
        this.communicator = new PostMessageCommunicator(allowedDomains, debug);
        this.eth = new Eth(this.communicator);
        this.txs = new TXs(this.communicator);
        this.safe = new Safe(this.communicator);
        this.wallet = new Wallet(this.communicator);
    }
}

const esm = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    MessageFormatter,
    get Methods () { return Methods; },
    Operation: dist.Operation,
    RPC_CALLS,
    get RestrictedMethods () { return RestrictedMethods; },
    TokenType: dist.TokenType,
    TransactionStatus: dist.TransactionStatus,
    TransferDirection: dist.TransferDirection,
    default: SafeAppsSDK,
    getSDKVersion,
    isObjectEIP712TypedData
}, Symbol.toStringTag, { value: 'Module' }));

export { esm as e };
