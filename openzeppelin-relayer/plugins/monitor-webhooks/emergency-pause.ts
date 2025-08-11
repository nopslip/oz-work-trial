import { Speed, PluginAPI } from "@openzeppelin/relayer-sdk";

const CONTRACT_ADDRESS = "0xB9A538E720f7C05a7A4747A484C231c956920bef";
const PAUSE_SELECTOR = "0x8456cb59"; // pause()

type EmergencyPauseParams = {
    title?: string;
    body?: string;
    reason?: string;
    // These come from Monitor webhook or manual trigger
};

/**
 * Plugin that executes emergency pause on the contract
 * Can be triggered by Monitor detecting risk conditions
 */
export async function handler(api: PluginAPI, params: EmergencyPauseParams): Promise<any> {
    console.log("[EMERGENCY-PAUSE] CRITICAL: Emergency pause triggered:", params);
    
    try {
        const relayer = api.useRelayer("acme-bond-sepolia");
        
        console.log("[EMERGENCY-PAUSE] Sending pause() transaction to contract:", CONTRACT_ADDRESS);
        
        // Send the pause transaction with FAST speed for emergency
        const result = await relayer.sendTransaction({
            to: CONTRACT_ADDRESS,
            data: PAUSE_SELECTOR,
            value: 0,
            gas_limit: 100000,
            speed: Speed.FAST, // Emergency = FAST
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
    } catch (error: any) {
        console.error("[EMERGENCY-PAUSE] CRITICAL FAILURE - Could not pause contract:", error);
        return {
            success: false,
            action: "emergencyPause",
            error: error?.message || String(error),
            message: "CRITICAL: Failed to execute emergency pause",
            urgent: true
        };
    }
}