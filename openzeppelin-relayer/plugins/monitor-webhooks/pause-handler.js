"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const relayer_sdk_1 = require("@openzeppelin/relayer-sdk");
const CONTRACT_ADDRESS = "0xB9A538E720f7C05a7A4747A484C231c956920bef";
const UNPAUSE_SELECTOR = "0x3f4ba83a"; // unpause()
/**
 * Plugin that handles Pause events from Monitor and executes unpause() transaction
 * This demonstrates automated response to contract events
 */
function handler(api, params) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        // Handle both direct params and nested message format
        const title = params.title || ((_a = params.message) === null || _a === void 0 ? void 0 : _a.title) || "Pause Event";
        const body = params.body || ((_b = params.message) === null || _b === void 0 ? void 0 : _b.body) || "Contract paused";
        console.log("[PAUSE-HANDLER] Received webhook from Monitor:", { title, body, rawParams: params });
        try {
            // Use the configured relayer for Sepolia
            const relayer = api.useRelayer("acme-bond-sepolia");
            console.log("[PAUSE-HANDLER] Sending unpause() transaction to contract:", CONTRACT_ADDRESS);
            // Send the unpause transaction
            const result = yield relayer.sendTransaction({
                to: CONTRACT_ADDRESS,
                data: UNPAUSE_SELECTOR,
                value: 0,
                gas_limit: 100000,
                speed: relayer_sdk_1.Speed.FAST,
            });
            console.log("[PAUSE-HANDLER] Transaction submitted:", result.id);
            // Wait for confirmation (optional - remove for faster response)
            const receipt = yield result.wait();
            console.log("[PAUSE-HANDLER] Transaction confirmed:", receipt);
            return {
                success: true,
                action: "unpause",
                transactionId: result.id,
                message: `Successfully sent unpause() transaction in response to pause event`,
                contractAddress: CONTRACT_ADDRESS
            };
        }
        catch (error) {
            console.error("[PAUSE-HANDLER] Failed to send transaction:", error);
            return {
                success: false,
                action: "unpause",
                error: (error === null || error === void 0 ? void 0 : error.message) || String(error),
                message: "Failed to send unpause transaction"
            };
        }
    });
}
