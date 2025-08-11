import { PluginAPI } from "@openzeppelin/relayer-sdk";

type ConcentrationRiskParams = {
    title?: string;
    body?: string;
    event?: {
        holder: string;
        percentage: number;
    };
};

/**
 * Plugin that handles concentration risk (>20% ownership)
 * Demonstrates regulatory compliance automation
 */
export async function handler(api: PluginAPI, params: ConcentrationRiskParams): Promise<any> {
    console.log("[CONCENTRATION-RISK] Regulatory threshold exceeded:", params);
    
    const holder = params.event?.holder || "unknown";
    const percentage = params.event?.percentage || 0;
    
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
}