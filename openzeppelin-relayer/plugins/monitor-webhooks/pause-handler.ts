import { Speed, PluginAPI } from "@openzeppelin/relayer-sdk";

const CONTRACT_ADDRESS = "0xB9A538E720f7C05a7A4747A484C231c956920bef";
const UNPAUSE_SELECTOR = "0x3f4ba83a"; // unpause()

/**
 * Plugin that handles Pause events from Monitor and executes unpause() transaction
 * This demonstrates automated response to contract events
 */
export async function handler(api: PluginAPI, params: any): Promise<any> {
    console.log("[PAUSE-HANDLER] Received webhook from Monitor - raw params:", JSON.stringify(params));
    
    // The Monitor sends the webhook with 'message' field, but Relayer wraps it in 'params'
    // So we receive: params = { message: { title: "...", body: "..." } } or just the message directly
    const webhookData = params?.message || params;
    
    console.log("[PAUSE-HANDLER] Extracted webhook data:", JSON.stringify(webhookData));
    
    try {
        // Use the configured relayer for Sepolia
        const relayer = api.useRelayer("acme-bond-sepolia");
        
        console.log("[PAUSE-HANDLER] Sending unpause() transaction to contract:", CONTRACT_ADDRESS);
        
        // Send the unpause transaction
        const result = await relayer.sendTransaction({
            to: CONTRACT_ADDRESS,
            data: UNPAUSE_SELECTOR,
            value: 0,
            gas_limit: 100000,
            speed: Speed.FAST,
        });
        
        console.log("[PAUSE-HANDLER] Transaction submitted:", result.id);
        
        return {
            success: true,
            action: "unpause",
            transactionId: result.id,
            message: `Successfully sent unpause() transaction in response to pause event`,
            contractAddress: CONTRACT_ADDRESS,
            webhookReceived: webhookData
        };
    } catch (error: any) {
        console.error("[PAUSE-HANDLER] Failed to send transaction:", error);
        return {
            success: false,
            action: "unpause",
            error: error?.message || String(error),
            message: "Failed to send unpause transaction",
            webhookReceived: webhookData
        };
    }
}