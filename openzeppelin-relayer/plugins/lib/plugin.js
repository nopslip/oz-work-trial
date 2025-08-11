"use strict";
/**
 * Plugins library.
 *
 * This library is used to create plugins for the relayer. Including a set of utilities to simplify
 * the interaction with the relayer.
 *
 * Most important components:
 * - `PluginAPI`: A class that provides a set of methods exposing the relayer API.
 * - `runPlugin`: A function that runs the plugin.
 *  - Handles the parameters passed to the plugin.
 *  - Creates a socket connection to the relayer server
 *  - Intercepts the logs, errors and return values.
 *
 * Example:
 * ```ts
 * import { runPlugin, PluginAPI } from "./lib/plugin";
 *
 * async function main(plugin: PluginAPI, args: {
 *  relayerId: string;
 *  method: string;
 *  params: any;
 * }) {
 *  const result = await plugin.useRelayer(args.relayerId).sendTransaction(args.params);
 *  return result;
 * }
 *
 * runPlugin(main);
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultPluginAPI = void 0;
exports.serializeResult = serializeResult;
exports.runPlugin = runPlugin;
exports.loadAndExecutePlugin = loadAndExecutePlugin;
exports.runUserPlugin = runUserPlugin;
const relayer_sdk_1 = require("@openzeppelin/relayer-sdk");
const logger_1 = require("./logger");
const node_net_1 = __importDefault(require("node:net"));
const uuid_1 = require("uuid");
/**
 * Smart serialization for plugin return values
 * - Objects/Arrays: JSON.stringify (need serialization)
 * - Primitives: String conversion (clean, no extra quotes)
 * - null/undefined: String representation
 */
function serializeResult(result) {
    if (result === null) {
        return 'null';
    }
    if (result === undefined) {
        return 'undefined';
    }
    if (typeof result === 'object' || Array.isArray(result)) {
        return JSON.stringify(result); // Objects need JSON serialization
    }
    return String(result); // Primitives as clean strings
}
// Global variable to capture legacy plugin function
let _legacyPluginFunction = null;
function getPluginParams() {
    const pluginParams = process.argv[3];
    if (!pluginParams) {
        throw new Error("Plugin parameters are required but not provided");
    }
    try {
        const parsed = JSON.parse(pluginParams);
        return parsed;
    }
    catch (e) {
        throw new Error(`Failed to parse plugin parameters: ${e}`);
    }
}
/**
 * Legacy runPlugin function - captures the plugin function for later execution
 * This provides backward compatibility while the new handler pattern is adopted
 */
function runPlugin(main) {
    return __awaiter(this, void 0, void 0, function* () {
        // In the new architecture, we just capture the function for later execution
        // instead of running it immediately
        if (typeof main === 'function') {
            _legacyPluginFunction = main;
            return;
        }
        // If we reach here, it means this is being called in the old direct execution mode
        // (not through the executor), so we fall back to the original behavior
        const logInterceptor = new logger_1.LogInterceptor();
        try {
            // checks if socket path is provided
            let socketPath = process.argv[2];
            if (!socketPath) {
                throw new Error("Socket path is required");
            }
            // creates plugin instance
            let plugin = new DefaultPluginAPI(socketPath);
            // Start intercepting logs
            logInterceptor.start();
            const pluginParams = getPluginParams();
            // runs main function
            const result = yield main(plugin, pluginParams);
            // adds return value to the stdout
            logInterceptor.addResult(serializeResult(result));
            plugin.close();
            // Stop intercepting logs
            logInterceptor.stop();
        }
        catch (error) {
            console.error(error);
            process.exit(1);
        }
    });
}
/**
 * Helper function that loads and executes a user plugin script
 * @param userScriptPath - Path to the user's plugin script
 * @param api - Plugin API instance
 * @param params - Plugin parameters
 */
function loadAndExecutePlugin(userScriptPath, api, params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // IMPORTANT: Path normalization required because executor is in plugins/lib/
            // but user scripts are in plugins/ (and config paths are relative to plugins/)
            // 
            // Examples:
            // - Config: "examples/example.ts" → Rust: "plugins/examples/example.ts" → Executor: "../examples/example.ts"
            // - Config: "my-plugin.ts" → Rust: "plugins/my-plugin.ts" → Executor: "../my-plugin.ts"
            let normalizedPath = userScriptPath;
            // Check if it's an absolute path (starts with / on Unix-like systems or C:\ on Windows)
            const isAbsolute = userScriptPath.startsWith('/') || /^[A-Za-z]:\\/.test(userScriptPath);
            if (isAbsolute) {
                // For absolute paths, use as-is (e.g., temporary test files)
                normalizedPath = userScriptPath;
            }
            else if (userScriptPath.startsWith('plugins/')) {
                // Remove 'plugins/' prefix and add '../' to go back from lib/ to plugins/
                normalizedPath = '../' + userScriptPath.substring('plugins/'.length);
            }
            else {
                // If path doesn't start with 'plugins/', assume it's relative to plugins/
                normalizedPath = '../' + userScriptPath;
            }
            // Clear any previous legacy plugin function
            _legacyPluginFunction = null;
            // Load user's script module
            const userModule = require(normalizedPath);
            // Try modern pattern first: look for 'handler' named export
            const handler = userModule.handler;
            if (handler && typeof handler === 'function') {
                // Modern pattern: call the exported handler
                const result = yield handler(api, params);
                return result;
            }
            // Try legacy pattern: check if runPlugin was called during module loading
            if (_legacyPluginFunction && typeof _legacyPluginFunction === 'function') {
                console.warn(`[DEPRECATED] Plugin at ${userScriptPath} uses the deprecated runPlugin pattern. Please migrate to the handler export pattern.`);
                // Legacy pattern: call the captured plugin function
                const result = yield _legacyPluginFunction(api, params);
                return result;
            }
            // If neither modern nor legacy pattern is found, assume it's a direct execution script
            // This handles simple scripts that just execute immediately (like test scripts)
            // For direct execution scripts, we don't call any function - the script already executed
            // when it was required. We just return an empty result.
            return undefined;
        }
        catch (error) {
            throw new Error(`Failed to execute user plugin ${userScriptPath}: ${error.message}`);
        }
    });
}
/**
 * The plugin API.
 *
 * @property useRelayer - Creates a relayer API for the given relayer ID.
 * @property sendTransaction - Sends a transaction to the relayer.
 * @property getTransaction - Gets a transaction by id.
 */
class DefaultPluginAPI {
    constructor(socketPath) {
        this._connectionPromise = null;
        this._connected = false;
        this.socket = node_net_1.default.createConnection(socketPath);
        this.pending = new Map();
        this._connectionPromise = new Promise((resolve, reject) => {
            this.socket.on('connect', () => {
                this._connected = true;
                resolve();
            });
            this.socket.on('error', (error) => {
                console.error("Socket ERROR:", error);
                reject(error);
            });
        });
        this.socket.on('data', data => {
            data.toString().split('\n').filter(Boolean).forEach((msg) => {
                const parsed = JSON.parse(msg);
                const { requestId, result, error } = parsed;
                const resolver = this.pending.get(requestId);
                if (resolver) {
                    error ? resolver.reject(error) : resolver.resolve(result);
                    this.pending.delete(requestId);
                }
            });
        });
    }
    /**
     * Creates a relayer API for the given relayer ID.
     * @param relayerId - The relayer ID.
     * @returns The relayer API.
     */
    useRelayer(relayerId) {
        return {
            sendTransaction: (payload) => __awaiter(this, void 0, void 0, function* () {
                const result = yield this._send(relayerId, "sendTransaction", payload);
                // Add the wait method to the result
                return Object.assign(Object.assign({}, result), { wait: (options) => this.transactionWait(result, options) });
            }),
            getTransaction: (payload) => this._send(relayerId, "getTransaction", payload),
        };
    }
    transactionWait(transaction, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const waitOptions = {
                interval: (options === null || options === void 0 ? void 0 : options.interval) || 5000,
                timeout: (options === null || options === void 0 ? void 0 : options.timeout) || 60000,
            };
            const relayer = this.useRelayer(transaction.relayer_id);
            let transactionResult = yield relayer.getTransaction({ transactionId: transaction.id });
            // timeout to avoid infinite waiting
            const timeout = setTimeout(() => {
                throw new Error(`Transaction ${transaction.id} timed out after ${waitOptions.timeout}ms`);
            }, waitOptions.timeout);
            // poll for transaction status until mined/confirmed, failed, cancelled or expired.
            while (transactionResult.status !== relayer_sdk_1.TransactionStatus.MINED &&
                transactionResult.status !== relayer_sdk_1.TransactionStatus.CONFIRMED &&
                transactionResult.status !== relayer_sdk_1.TransactionStatus.CANCELED &&
                transactionResult.status !== relayer_sdk_1.TransactionStatus.EXPIRED &&
                transactionResult.status !== relayer_sdk_1.TransactionStatus.FAILED) {
                transactionResult = yield relayer.getTransaction({ transactionId: transaction.id });
                yield new Promise(resolve => setTimeout(resolve, waitOptions.interval));
            }
            clearTimeout(timeout);
            return transactionResult;
        });
    }
    _send(relayerId, method, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestId = (0, uuid_1.v4)();
            const message = JSON.stringify({ requestId, relayerId, method, payload }) + "\n";
            if (!this._connected) {
                yield this._connectionPromise;
            }
            const result = this.socket.write(message, (error) => {
                if (error) {
                    console.error("Error sending message:", error);
                }
            });
            if (!result) {
                throw new Error(`Failed to send message to relayer: ${message}`);
            }
            return new Promise((resolve, reject) => {
                this.pending.set(requestId, { resolve, reject });
            });
        });
    }
    close() {
        this.socket.end();
    }
    closeErrored(error) {
        this.socket.destroy(error);
    }
}
exports.DefaultPluginAPI = DefaultPluginAPI;
/**
 * Main entry point for plugin execution
 *
 * This function handles the entire plugin lifecycle: loading, execution, and cleanup.
 * It receives validated parameters from the wrapper script and focuses purely on plugin execution logic.
 *
 * @param socketPath - Unix socket path for communication with relayer
 * @param pluginParams - Parsed plugin parameters object
 * @param userScriptPath - Path to the user's plugin file to execute
 */
function runUserPlugin(socketPath, pluginParams, userScriptPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Create plugin API instance
            const plugin = new DefaultPluginAPI(socketPath);
            // Use helper function to load and execute the plugin
            const result = yield loadAndExecutePlugin(userScriptPath, plugin, pluginParams);
            plugin.close();
            return result;
        }
        catch (error) {
            console.error(error);
            process.exit(1);
        }
    });
}
