import { g as getDefaultExportFromCjs } from './index-C7SCRAQW.js';
import { e as esm } from './index-CjaiLHfl.js';
import { e as eventsExports } from './events-BCcId48B.js';

function _mergeNamespaces(n, m) {
    for (var i = 0; i < m.length; i++) {
        const e = m[i];
        if (typeof e !== 'string' && !Array.isArray(e)) { for (const k in e) {
            if (k !== 'default' && !(k in n)) {
                const d = Object.getOwnPropertyDescriptor(e, k);
                if (d) {
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: () => e[k]
                    });
                }
            }
        } }
    }
    return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: 'Module' }));
}

var dist = {};

var provider = {};

var utils = {};

Object.defineProperty(utils, "__esModule", { value: true });
utils.numberToHex = utils.getLowerCase = void 0;
function getLowerCase(value) {
    if (value) {
        return value.toLowerCase();
    }
    return value;
}
utils.getLowerCase = getLowerCase;
function numberToHex(value) {
    return `0x${value.toString(16)}`;
}
utils.numberToHex = numberToHex;

Object.defineProperty(provider, "__esModule", { value: true });
provider.SafeAppProvider = void 0;
const safe_apps_sdk_1 = esm;
const events_1 = eventsExports;
const utils_1 = utils;
class SafeAppProvider extends events_1.EventEmitter {
  constructor(safe, sdk) {
    super();
    this.submittedTxs = /* @__PURE__ */ new Map();
    this.safe = safe;
    this.sdk = sdk;
  }
  async connect() {
    this.emit("connect", { chainId: this.chainId });
    return;
  }
  async disconnect() {
    return;
  }
  get chainId() {
    return this.safe.chainId;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async request(request) {
    const { method, params = [] } = request;
    switch (method) {
      case "eth_accounts":
        return [this.safe.safeAddress];
      case "net_version":
      case "eth_chainId":
        return (0, utils_1.numberToHex)(this.chainId);
      case "personal_sign": {
        const [message, address] = params;
        if (this.safe.safeAddress.toLowerCase() !== address.toLowerCase()) {
          throw new Error("The address or message hash is invalid");
        }
        const response = await this.sdk.txs.signMessage(message);
        const signature = "signature" in response ? response.signature : void 0;
        return signature || "0x";
      }
      case "eth_sign": {
        const [address, messageHash] = params;
        if (this.safe.safeAddress.toLowerCase() !== address.toLowerCase() || !messageHash.startsWith("0x")) {
          throw new Error("The address or message hash is invalid");
        }
        const response = await this.sdk.txs.signMessage(messageHash);
        const signature = "signature" in response ? response.signature : void 0;
        return signature || "0x";
      }
      case "eth_signTypedData":
      case "eth_signTypedData_v4": {
        const [address, typedData] = params;
        const parsedTypedData = typeof typedData === "string" ? JSON.parse(typedData) : typedData;
        if (this.safe.safeAddress.toLowerCase() !== address.toLowerCase()) {
          throw new Error("The address is invalid");
        }
        const response = await this.sdk.txs.signTypedMessage(parsedTypedData);
        const signature = "signature" in response ? response.signature : void 0;
        return signature || "0x";
      }
      case "eth_sendTransaction":
        const tx = {
          ...params[0],
          value: params[0].value || "0",
          data: params[0].data || "0x"
        };
        if (typeof tx.gas === "string" && tx.gas.startsWith("0x")) {
          tx.gas = parseInt(tx.gas, 16);
        }
        const resp = await this.sdk.txs.send({
          txs: [tx],
          params: { safeTxGas: tx.gas }
        });
        this.submittedTxs.set(resp.safeTxHash, {
          from: this.safe.safeAddress,
          hash: resp.safeTxHash,
          gas: 0,
          gasPrice: "0x00",
          nonce: 0,
          input: tx.data,
          value: tx.value,
          to: tx.to,
          blockHash: null,
          blockNumber: null,
          transactionIndex: null
        });
        return resp.safeTxHash;
      case "eth_blockNumber":
        const block = await this.sdk.eth.getBlockByNumber(["latest"]);
        return block.number;
      case "eth_getBalance":
        return this.sdk.eth.getBalance([(0, utils_1.getLowerCase)(params[0]), params[1]]);
      case "eth_getCode":
        return this.sdk.eth.getCode([(0, utils_1.getLowerCase)(params[0]), params[1]]);
      case "eth_getTransactionCount":
        return this.sdk.eth.getTransactionCount([(0, utils_1.getLowerCase)(params[0]), params[1]]);
      case "eth_getStorageAt":
        return this.sdk.eth.getStorageAt([(0, utils_1.getLowerCase)(params[0]), params[1], params[2]]);
      case "eth_getBlockByNumber":
        return this.sdk.eth.getBlockByNumber([params[0], params[1]]);
      case "eth_getBlockByHash":
        return this.sdk.eth.getBlockByHash([params[0], params[1]]);
      case "eth_getTransactionByHash":
        let txHash = params[0];
        try {
          const resp2 = await this.sdk.txs.getBySafeTxHash(txHash);
          txHash = resp2.txHash || txHash;
        } catch (e) {
        }
        if (this.submittedTxs.has(txHash)) {
          return this.submittedTxs.get(txHash);
        }
        return this.sdk.eth.getTransactionByHash([txHash]).then((tx2) => {
          if (tx2) {
            tx2.hash = params[0];
          }
          return tx2;
        });
      case "eth_getTransactionReceipt": {
        let txHash2 = params[0];
        try {
          const resp2 = await this.sdk.txs.getBySafeTxHash(txHash2);
          txHash2 = resp2.txHash || txHash2;
        } catch (e) {
        }
        return this.sdk.eth.getTransactionReceipt([txHash2]).then((tx2) => {
          if (tx2) {
            tx2.transactionHash = params[0];
          }
          return tx2;
        });
      }
      case "eth_estimateGas": {
        return this.sdk.eth.getEstimateGas(params[0]);
      }
      case "eth_call": {
        return this.sdk.eth.call([params[0], params[1]]);
      }
      case "eth_getLogs":
        return this.sdk.eth.getPastLogs([params[0]]);
      case "eth_gasPrice":
        return this.sdk.eth.getGasPrice();
      case "wallet_getPermissions":
        return this.sdk.wallet.getPermissions();
      case "wallet_requestPermissions":
        return this.sdk.wallet.requestPermissions(params[0]);
      case "safe_setSettings":
        return this.sdk.eth.setSafeSettings([params[0]]);
      case "wallet_sendCalls": {
        const { from, calls, chainId } = params[0];
        if (chainId !== (0, utils_1.numberToHex)(this.chainId)) {
          throw new Error(`Safe is not on chain ${chainId}`);
        }
        if (from !== this.safe.safeAddress) {
          throw Error("Invalid from address");
        }
        const txs = calls.map((call, i) => {
          if (!call.to) {
            throw new Error(`Invalid call #${i}: missing "to" field`);
          }
          return {
            to: call.to,
            data: call.data ?? "0x",
            value: call.value ?? (0, utils_1.numberToHex)(0)
          };
        });
        const { safeTxHash } = await this.sdk.txs.send({ txs });
        const result = {
          id: safeTxHash
        };
        return result;
      }
      case "wallet_getCallsStatus": {
        const safeTxHash = params[0];
        const CallStatus = {
          [safe_apps_sdk_1.TransactionStatus.AWAITING_CONFIRMATIONS]: 100,
          [safe_apps_sdk_1.TransactionStatus.AWAITING_EXECUTION]: 100,
          [safe_apps_sdk_1.TransactionStatus.SUCCESS]: 200,
          [safe_apps_sdk_1.TransactionStatus.CANCELLED]: 400,
          [safe_apps_sdk_1.TransactionStatus.FAILED]: 500
        };
        const tx2 = await this.sdk.txs.getBySafeTxHash(safeTxHash);
        const result = {
          version: "1.0",
          id: safeTxHash,
          chainId: (0, utils_1.numberToHex)(this.chainId),
          status: CallStatus[tx2.txStatus]
        };
        if (!tx2.txHash) {
          return result;
        }
        const receipt = await this.sdk.eth.getTransactionReceipt([tx2.txHash]);
        if (!receipt) {
          return result;
        }
        const calls = tx2.txData?.dataDecoded?.method !== "multiSend" ? 1 : (
          // Number of batched transactions
          tx2.txData.dataDecoded.parameters?.[0].valueDecoded?.length ?? 1
        );
        const blockNumber = Number(receipt.blockNumber);
        const gasUsed = Number(receipt.gasUsed);
        result.receipts = Array(calls).fill({
          logs: receipt.logs,
          status: (0, utils_1.numberToHex)(tx2.txStatus === safe_apps_sdk_1.TransactionStatus.SUCCESS ? 1 : 0),
          blockHash: receipt.blockHash,
          blockNumber: (0, utils_1.numberToHex)(blockNumber),
          gasUsed: (0, utils_1.numberToHex)(gasUsed),
          transactionHash: tx2.txHash
        });
        return result;
      }
      case "wallet_showCallsStatus": {
        throw new Error(`"${request.method}" not supported`);
      }
      case "wallet_getCapabilities": {
        return {
          [(0, utils_1.numberToHex)(this.chainId)]: {
            atomicBatch: {
              supported: true
            }
          }
        };
      }
      default:
        throw Error(`"${request.method}" not implemented`);
    }
  }
  // this method is needed for ethers v4
  // https://github.com/ethers-io/ethers.js/blob/427e16826eb15d52d25c4f01027f8db22b74b76c/src.ts/providers/web3-provider.ts#L41-L55
  send(request, callback) {
    if (!request)
      callback("Undefined request");
    this.request(request).then((result) => callback(null, { jsonrpc: "2.0", id: request.id, result })).catch((error) => callback(error, null));
  }
}
provider.SafeAppProvider = SafeAppProvider;

(function (exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SafeAppProvider = void 0;
	var provider_1 = provider;
	Object.defineProperty(exports, "SafeAppProvider", { enumerable: true, get: function () { return provider_1.SafeAppProvider; } });
	
} (dist));

const index = /*@__PURE__*/getDefaultExportFromCjs(dist);

const index$1 = /*#__PURE__*/_mergeNamespaces({
    __proto__: null,
    default: index
}, [dist]);

export { index$1 as i };
