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
/**
 * Plugin that handles missed interest payment detection
 * Demonstrates operational alerting capabilities
 */
function handler(api, params) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("[MISSED-PAYMENT] Alert triggered:", params);
        // Critical alerts for missed payments
        console.log("🚨 CRITICAL: Interest payment overdue!");
        console.log("📧 Sending email to: operations@acmebank.com");
        console.log("📱 Sending SMS to: +1-555-BANK-OPS");
        console.log("💬 Posting to Slack: #bond-operations");
        // In production, would use actual notification services
        // api.notify({ channel: "email", to: "operations@acmebank.com", ... })
        return {
            success: true,
            alert: "critical",
            action: "notify_operations",
            message: "Interest payment missed - operations team notified via multiple channels",
            notifications: {
                email: "operations@acmebank.com",
                sms: "+1-555-BANK-OPS",
                slack: "#bond-operations"
            },
            timestamp: new Date().toISOString()
        };
    });
}
