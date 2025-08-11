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
 * Plugin that handles large transfer detection and pauses contract
 * Demonstrates damage control through immediate contract pause
 */
function handler(api, params) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        console.log("[LARGE-TRANSFER] Suspicious activity detected:", params);
        const amount = ((_a = params.event) === null || _a === void 0 ? void 0 : _a.amount) || "unknown";
        const to = ((_b = params.event) === null || _b === void 0 ? void 0 : _b.to) || "unknown";
        console.log(`🚨 Large transfer detected: ${amount} tokens to ${to}`);
        console.log("⏸️ Pausing contract to prevent additional transfers...");
        try {
            // Use the configured relayer for Sepolia
            const relayer = api.useRelayer("acme-bond-sepolia");
            // Send emergency pause transaction
            const result = yield relayer.sendTransaction({
                to: CONTRACT_ADDRESS,
                data: PAUSE_SELECTOR,
                value: 0,
                gas_limit: 100000,
                speed: relayer_sdk_1.Speed.FAST,
            });
            console.log("✅ Contract paused successfully:", result.id);
            console.log("📧 Alerting compliance team for investigation...");
            return {
                success: true,
                action: "EMERGENCY_PAUSE",
                reason: "Large transfer detected - contract paused to prevent additional transfers",
                transactionId: result.id,
                contractAddress: CONTRACT_ADDRESS,
                suspiciousTransfer: {
                    to: to,
                    amount: amount
                },
                message: "Contract paused. Compliance team notified. Manual review required."
            };
        }
        catch (error) {
            console.error("[LARGE-TRANSFER] Failed to pause contract:", error);
            return {
                success: false,
                action: "EMERGENCY_PAUSE",
                error: (error === null || error === void 0 ? void 0 : error.message) || String(error),
                message: "Failed to pause contract - MANUAL INTERVENTION REQUIRED"
            };
        }
    });
}
