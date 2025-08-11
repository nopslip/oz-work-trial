import { PluginAPI } from "@openzeppelin/relayer-sdk";

type MissedPaymentParams = {
    title?: string;
    body?: string;
    paymentDue?: number;
    lastPaymentTime?: number;
};

/**
 * Plugin that handles missed interest payment detection
 * Demonstrates operational alerting capabilities
 */
export async function handler(api: PluginAPI, params: MissedPaymentParams): Promise<any> {
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
}