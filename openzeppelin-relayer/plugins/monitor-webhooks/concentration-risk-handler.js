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
 * Plugin that handles concentration risk (>20% ownership)
 * Demonstrates regulatory compliance automation
 */
function handler(api, params) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        console.log("[CONCENTRATION-RISK] Regulatory threshold exceeded:", params);
        const holder = ((_a = params.event) === null || _a === void 0 ? void 0 : _a.holder) || "unknown";
        const percentage = ((_b = params.event) === null || _b === void 0 ? void 0 : _b.percentage) || 0;
        console.log(`⚠️ Concentration risk detected: ${holder} owns ${percentage}%`);
        console.log("📊 SEC threshold exceeded (>20% ownership)");
        // Alert compliance team
        console.log("📧 Sending alert to: compliance@acmebank.com");
        console.log("📄 Generating SEC Form N-Q draft...");
        console.log("🚫 Adding holder to restricted purchase list...");
        // Generate compliance recommendations
        const recommendations = [
            `Block further purchases by ${holder}`,
            "File SEC Form N-Q within 10 business days",
            "Review for potential forced partial redemption",
            "Update quarterly investor disclosures",
            "Schedule compliance committee review"
        ];
        console.log("\n📋 Compliance Recommendations:");
        recommendations.forEach((rec, i) => {
            console.log(`   ${i + 1}. ${rec}`);
        });
        return {
            success: true,
            action: "COMPLIANCE_ALERT",
            alert: "regulatory_threshold",
            entity: holder,
            ownership: `${percentage}%`,
            threshold: "20%",
            exceeded_by: `${percentage - 20}%`,
            recommendations: recommendations,
            required_actions: {
                immediate: "Block further purchases by entity",
                within_10_days: "File SEC Form N-Q",
                within_30_days: "Complete compliance review"
            },
            notifications_sent: {
                compliance_team: "compliance@acmebank.com",
                legal_team: "legal@acmebank.com",
                cfo: "cfo@acmebank.com"
            },
            message: `Entity ${holder} exceeds 20% ownership threshold. Compliance team notified.`
        };
    });
}
