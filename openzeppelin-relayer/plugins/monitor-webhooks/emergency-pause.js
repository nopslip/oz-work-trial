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
const PAUSE_SELECTOR = "0x8456cb59"; // pause()
/**
 * Plugin that executes emergency pause on the contract
 * Can be triggered by Monitor detecting risk conditions
 */
function handler(api, params) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("[EMERGENCY-PAUSE] CRITICAL: Emergency pause triggered:", params);
        try {
            const relayer = api.useRelayer("acme-bond-sepolia");
            console.log("[EMERGENCY-PAUSE] Sending pause() transaction to contract:", CONTRACT_ADDRESS);
            // Send the pause transaction with FAST speed for emergency
            const result = yield relayer.sendTransaction({
                to: CONTRACT_ADDRESS,
                data: PAUSE_SELECTOR,
                value: 0,
                gas_limit: 100000,
                speed: relayer_sdk_1.Speed.FAST, // Emergency = FAST
            });
            console.log("[EMERGENCY-PAUSE] Emergency pause transaction submitted:", result.id);
            // Don't wait for confirmation in emergency - return immediately
            // The transaction is already submitted
            return {
                success: true,
                action: "emergencyPause",
                transactionId: result.id,
                message: `EMERGENCY PAUSE EXECUTED - Contract operations halted`,
                reason: params.reason || params.body || "Emergency condition detected",
                contractAddress: CONTRACT_ADDRESS,
                timestamp: new Date().toISOString(),
                urgent: true
            };
        }
        catch (error) {
            console.error("[EMERGENCY-PAUSE] CRITICAL FAILURE - Could not pause contract:", error);
            return {
                success: false,
                action: "emergencyPause",
                error: (error === null || error === void 0 ? void 0 : error.message) || String(error),
                message: "CRITICAL: Failed to execute emergency pause",
                urgent: true
            };
        }
    });
}
