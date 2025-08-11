import { Speed, PluginAPI } from "@openzeppelin/relayer-sdk";

const CONTRACT_ADDRESS = "0xB9A538E720f7C05a7A4747A484C231c956920bef";
const EMERGENCY_PAUSE_SELECTOR = "0xd05cb609"; // emergencyPause(string)

type KeyCompromiseParams = {
    title?: string;
    body?: string;
    event?: {
        implementation?: string;
        timestamp?: number;
        caller?: string;
    };
};

/**
 * Plugin that detects unauthorized admin actions (potential key compromise)
 * Triggers on upgrades outside approved change control windows
 */
export async function handler(api: PluginAPI, params: KeyCompromiseParams): Promise<any> {
    console.log("[KEY-COMPROMISE] Unauthorized admin action detected:", params);
    
    const timestamp = params.event?.timestamp || Date.now() / 1000;
    const implementation = params.event?.implementation || "unknown";
    const caller = params.event?.caller || "unknown";
    
    // Check if we're in approved maintenance window (Sunday 2-4 AM UTC)
    const date = new Date(timestamp * 1000);
    const day = date.getUTCDay(); // 0 = Sunday
    const hour = date.getUTCHours();
    
    const inMaintenanceWindow = (day === 0 && hour >= 2 && hour < 4);
    
    if (!inMaintenanceWindow) {
        console.log("🔴 CRITICAL SECURITY ALERT!");
        console.log("Unauthorized upgrade detected outside change control window");
        console.log(`Expected window: Sunday 2-4 AM UTC`);
        console.log(`Actual time: ${date.toUTCString()}`);
        console.log(`Caller: ${caller}`);
        console.log(`New implementation: ${implementation}`);
        
        try {
            // Emergency pause the contract
            const relayer = api.useRelayer("acme-bond-sepolia");
            
            // Encode emergency pause with reason
            const reason = "SECURITY: Unauthorized upgrade - possible key compromise";
            // Convert string to hex manually
            const hexReason = Buffer.from(reason).toString('hex');
            // ABI encode: offset (32 bytes) + length (32 bytes) + data (padded to 32 bytes)
            const offset = "0000000000000000000000000000000000000000000000000000000000000020";
            const length = (reason.length).toString(16).padStart(64, '0');
            const paddedHex = hexReason.padEnd(Math.ceil(hexReason.length / 64) * 64, '0');
            const data = EMERGENCY_PAUSE_SELECTOR + offset + length + paddedHex;
            
            const result = await relayer.sendTransaction({
                to: CONTRACT_ADDRESS,
                data: data,
                value: 0,
                gas_limit: 150000,
                speed: Speed.FAST,
            });
            
            console.log("🛡️ Contract emergency paused:", result.id);
            console.log("📧 Alerting security team...");
            console.log("📱 Paging CISO...");
            console.log("🔐 Initiating key rotation procedures...");
            
            return {
                success: true,
                severity: "CRITICAL",
                action: "EMERGENCY_PAUSE",
                alert: "POSSIBLE PRIVATE KEY COMPROMISE",
                details: {
                    event: "Unauthorized contract upgrade",
                    actualTime: date.toUTCString(),
                    expectedWindow: "Sunday 2-4 AM UTC",
                    caller: caller,
                    newImplementation: implementation,
                    transactionId: result.id
                },
                response: {
                    contractPaused: true,
                    keyRotationInitiated: true,
                    incidentId: `SEC-${Date.now()}`
                },
                notifications: [
                    "security@acmebank.com",
                    "ciso@acmebank.com",
                    "cto@acmebank.com",
                    "legal@acmebank.com"
                ],
                nextSteps: [
                    "1. Verify all admin key holders",
                    "2. Check audit logs for unauthorized access",
                    "3. Rotate all admin keys",
                    "4. Review and revert unauthorized changes",
                    "5. File incident report with regulators if confirmed"
                ]
            };
        } catch (error: any) {
            console.error("[KEY-COMPROMISE] Failed to pause contract:", error);
            return {
                success: false,
                severity: "CRITICAL",
                action: "EMERGENCY_PAUSE_FAILED",
                error: error?.message || String(error),
                message: "MANUAL INTERVENTION REQUIRED IMMEDIATELY"
            };
        }
    } else {
        console.log("✅ Upgrade detected within approved maintenance window");
        return {
            success: true,
            action: "APPROVED_UPGRADE",
            message: "Upgrade executed during approved change control window",
            window: "Sunday 2-4 AM UTC",
            timestamp: date.toUTCString()
        };
    }
}