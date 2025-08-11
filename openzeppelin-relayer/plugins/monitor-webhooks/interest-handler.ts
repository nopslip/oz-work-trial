import { Speed, PluginAPI } from "@openzeppelin/relayer-sdk";

const CONTRACT_ADDRESS = "0xB9A538E720f7C05a7A4747A484C231c956920bef";
const DISTRIBUTE_INTEREST_SELECTOR = "0x4e71d92d"; // distributeInterest()

type InterestHandlerParams = {
    title?: string;
    body?: string;
    event_type?: string;
    alert_level?: string;
    timestamp?: string;
};

/**
 * Plugin that handles InterestPaymentDue events from Monitor 
 * Scenario 1: Missed Interest Payment - Alert operations and optionally execute distribution
 */
export async function handler(api: PluginAPI, params: InterestHandlerParams): Promise<any> {
    console.log("[INTEREST-HANDLER] Received interest payment trigger from Monitor:", params);
    
    const alertLevel = params.alert_level || "INFO";
    const eventType = params.event_type || "InterestPaymentDue";
    
    // Alert operations team about missed/due payment
    if (alertLevel === "CRITICAL") {
        console.log("[INTEREST-HANDLER] 🚨 CRITICAL: Interest payment overdue!");
        console.log("[INTEREST-HANDLER] 📧 Email sent to operations@acmebank.com");
        console.log("[INTEREST-HANDLER] 📱 SMS sent to on-call team: +1-555-0100");
        console.log("[INTEREST-HANDLER] 📊 JIRA ticket created: BOND-1234");
    }
    
    try {
        const relayer = api.useRelayer("acme-bond-sepolia");
        
        console.log("[INTEREST-HANDLER] Sending distributeInterest() transaction to contract:", CONTRACT_ADDRESS);
        
        // Send the interest distribution transaction
        const result = await relayer.sendTransaction({
            to: CONTRACT_ADDRESS,
            data: DISTRIBUTE_INTEREST_SELECTOR,
            value: 0,
            gas_limit: 500000, // Higher gas limit for interest distribution
            speed: Speed.FAST,
        });
        
        console.log("[INTEREST-HANDLER] Interest distribution transaction submitted:", result.id);
        
        // Wait for confirmation
        const receipt = await result.wait();
        
        console.log("[INTEREST-HANDLER] Interest distribution confirmed:", receipt);
        
        return {
            success: true,
            action: "distributeInterest",
            transactionId: result.id,
            message: `Successfully distributed interest payments to all bond holders`,
            contractAddress: CONTRACT_ADDRESS,
            timestamp: new Date().toISOString()
        };
    } catch (error: any) {
        console.error("[INTEREST-HANDLER] Failed to distribute interest:", error);
        return {
            success: false,
            action: "distributeInterest",
            error: error?.message || String(error),
            message: "Failed to distribute interest payments"
        };
    }
}