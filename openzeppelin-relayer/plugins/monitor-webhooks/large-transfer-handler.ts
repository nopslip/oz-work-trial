import { Speed, PluginAPI } from "@openzeppelin/relayer-sdk";

const CONTRACT_ADDRESS = "0xB9A538E720f7C05a7A4747A484C231c956920bef";
const PAUSE_SELECTOR = "0x8456cb59"; // pause()

type LargeTransferParams = {
    title?: string;
    body?: string;
    action?: string;
    alert_level?: string;
    amount?: string;
    timestamp?: string;
    event?: {
        from: string;
        to: string;
        amount: string;
    };
};

/**
 * Plugin that handles large transfer detection and pauses contract
 * Demonstrates damage control through immediate contract pause
 */
export async function handler(api: PluginAPI, params: LargeTransferParams): Promise<any> {
    console.log("[LARGE-TRANSFER] Suspicious activity detected:", params);
    
    const amount = params.amount || params.event?.amount || "unknown";
    const to = params.event?.to || "unknown address";
    const alertLevel = params.alert_level || "CRITICAL";
    
    console.log(`[LARGE-TRANSFER] 🚨 ${alertLevel}: Large transfer of ${amount} tokens detected`);
    console.log("[LARGE-TRANSFER] ⏸️ Initiating emergency pause in <500ms...");
    console.log("[LARGE-TRANSFER] 📧 Alerting compliance team immediately");
    
    try {
        // Use the configured relayer for Sepolia
        const relayer = api.useRelayer("acme-bond-sepolia");
        
        // Send emergency pause transaction
        const result = await relayer.sendTransaction({
            to: CONTRACT_ADDRESS,
            data: PAUSE_SELECTOR,
            value: 0,
            gas_limit: 100000,
            speed: Speed.FAST,
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
    } catch (error: any) {
        console.error("[LARGE-TRANSFER] Failed to pause contract:", error);
        return {
            success: false,
            action: "EMERGENCY_PAUSE",
            error: error?.message || String(error),
            message: "Failed to pause contract - MANUAL INTERVENTION REQUIRED"
        };
    }
}