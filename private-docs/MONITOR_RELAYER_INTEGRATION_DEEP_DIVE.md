# OpenZeppelin Monitor → Relayer Integration: Complete Technical Deep Dive

## The Critical Integration Challenge

The OpenZeppelin Monitor and Relayer are designed to work together, but there's a **fundamental incompatibility** in their webhook formats that isn't immediately obvious from the documentation.

### The Format Mismatch Problem

1. **Monitor Webhook Output Format**:
   ```json
   {
     "title": "Event Title",
     "body": "Event Description with ${variable} substitutions"
   }
   ```

2. **Relayer Plugin API Expected Format**:
   ```json
   {
     "params": {
       // whatever data the plugin needs
     }
   }
   ```

**THE RELAYER SDK VALIDATES THE `params` FIELD AT THE HTTP LEVEL** - before your plugin code ever runs. If `params` is missing, you get a 400 error: `"Json deserialize error: missing field params"`

## The Solution: Script Triggers as Format Adapters

Script triggers aren't just for custom logic - they're the **ESSENTIAL BRIDGE** between Monitor and Relayer formats.

### Complete Working Configuration

#### 1. Monitor Configuration (`config/monitors/demo-all-scenarios.json`)
```json
{
  "name": "Demo All Scenarios Monitor",
  "paused": false,
  "networks": ["ethereum_sepolia"],
  "addresses": [
    {
      "address": "0xb9a538e720f7c05a7a4747a484c231c956920bef",
      "contract_spec": [
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": false,
              "internalType": "address",
              "name": "account",
              "type": "address"
            }
          ],
          "name": "Paused",
          "type": "event"
        }
      ]
    }
  ],
  "match_conditions": {
    "functions": [],
    "events": [
      {
        "signature": "Paused(address)",
        "expression": null
      }
    ],
    "transactions": []
  },
  "trigger_conditions": [],
  "triggers": ["pause_relay_script"]  // MUST USE SCRIPT, NOT WEBHOOK
}
```

#### 2. Script Trigger Configuration (`config/triggers/script_triggers.json`)
```json
{
  "pause_relay_script": {
    "name": "Pause Relay Script",
    "trigger_type": "script",
    "config": {
      "script_path": "./config/triggers/scripts/pause_relay.sh",
      "language": "Bash",
      "timeout_ms": 5000
    }
  }
}
```

#### 3. The Critical Bridge Script (`config/triggers/scripts/pause_relay.sh`)
```bash
#!/bin/bash

# This script is THE BRIDGE between Monitor and Relayer formats
# Monitor passes event data via stdin as JSON
# We wrap it in the params field that Relayer requires

input_json=$(cat)

# The magic: wrap whatever Monitor sends in a params object
curl -X POST http://localhost:8080/api/v1/plugins/pause-handler/call \
  -H "Authorization: Bearer A21E413E-DF82-4FFB-8525-51971CB00F70" \
  -H "Content-Type: application/json" \
  -d "{\"params\": {\"title\": \"Pause Event Detected\", \"body\": \"Contract was paused\"}}" \
  2>/dev/null

echo '{"success": true}'
```

#### 4. Relayer Plugin (`plugins/monitor-webhooks/pause-handler.ts`)
```typescript
export async function handler(api: PluginAPI, params: any): Promise<any> {
    // params contains whatever we put in the params field in the script
    // In this case: { title: "...", body: "..." }
    
    const webhookData = params;
    
    // Use the Relayer SDK to send transactions
    const relayer = api.useRelayer("acme-bond-sepolia");
    const result = await relayer.sendTransaction({
        to: CONTRACT_ADDRESS,
        data: UNPAUSE_SELECTOR,
        value: 0,
        gas_limit: 100000,
        speed: Speed.FAST,
    });
    
    return { success: true, transactionId: result.id };
}
```

## The Complete Flow (What Actually Happens)

1. **Blockchain Event Occurs**
   - Contract emits `Paused` event at block 8963541
   - Event signature: `0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258`

2. **Monitor Detection (every 60 seconds via cron)**
   - Monitor's cron job runs: `0 */1 * * * *`
   - Fetches blocks from last processed to current
   - Filters for matching events based on `match_conditions`
   - Finds Paused event in block 8963541

3. **Trigger Execution**
   - Monitor looks up trigger `pause_relay_script` 
   - Executes script at `./config/triggers/scripts/pause_relay.sh`
   - Passes match data via stdin (JSON format)

4. **Format Translation (THE CRITICAL STEP)**
   - Script receives Monitor's data
   - Wraps it in `{"params": {...}}` structure
   - Makes HTTP POST to Relayer plugin endpoint

5. **Relayer Plugin Processing**
   - Relayer validates `params` field exists (SDK requirement)
   - Routes to plugin based on URL path
   - Plugin receives `params` object
   - Plugin uses Relayer SDK to send transaction

6. **Transaction Execution**
   - Relayer signs transaction with configured key
   - Sends to blockchain via configured RPC
   - Returns success/failure to plugin
   - Plugin returns response to script

## Why Direct Webhooks Don't Work

### The Failed Approach
```json
// Monitor webhook trigger configuration
{
  "emergency_pause_webhook": {
    "name": "Pause Event Detected",
    "trigger_type": "webhook",
    "config": {
      "url": {
        "type": "plain",
        "value": "http://localhost:8080/api/v1/plugins/pause-handler/call"
      },
      "method": "POST",
      "headers": {
        "Authorization": "Bearer A21E413E-DF82-4FFB-8525-51971CB00F70",
        "Content-Type": "application/json"
      },
      "message": {
        "title": "Pause Event Detected",
        "body": "Contract was paused"
      }
    }
  }
}
```

**This ALWAYS fails with**: `Json deserialize error: missing field params`

The Monitor sends exactly what's in the `message` field as the HTTP body. The Relayer SDK expects `params` at the root level. There's NO WAY to configure the Monitor to wrap its output in a `params` field directly.

## Key Insights

1. **Scripts aren't optional** - They're the integration layer between Monitor and Relayer
2. **The format mismatch is by design** - Monitor is generic, Relayer plugins are specific
3. **Debugging tip**: Always test your script manually first with `echo '{}' | ./script.sh`
4. **Monitor processes blocks in batches** - Events may take up to 60 seconds to be detected
5. **Both tools MUST be running** - Monitor detects, Relayer executes

## Common Pitfalls

1. **Using webhook triggers directly** - Will always fail with params error
2. **Wrong script path** - Must be relative to Monitor's working directory
3. **Script not executable** - Remember `chmod +x`
4. **Rate limiting** - Use reliable RPCs, Monitor makes many requests
5. **Block processing delays** - Monitor uses cron, not real-time subscriptions

## Testing the Integration

### Manual Script Test
```bash
echo '{"event": "Paused", "block": 8963541}' | \
  /Users/zak/projects/oz-work-trial/openzeppelin-monitor/config/triggers/scripts/pause_relay.sh
```

### Trigger Event on Blockchain
```bash
# Pause the contract
cast send 0xB9A538E720f7C05a7A4747A484C231c956920bef "pause()" \
  --rpc-url "https://sepolia.infura.io/v3/YOUR_KEY" \
  --private-key YOUR_PRIVATE_KEY
```

### Verify in Logs
- Monitor: Look for "Processed X blocks" including your event block
- Relayer: Look for "POST /api/v1/plugins/pause-handler/call HTTP/1.1" 200

## The Architecture That Works

```
Blockchain → Monitor → Script Trigger → Format Translation → Relayer Plugin → Transaction
           ↑         ↑                ↑                   ↑               ↑
    Event Detection  Executes Script  Wraps in params   Validates params  Signs & Sends
```

This architecture allows Monitor to remain generic (supporting emails, webhooks, scripts) while Relayer plugins get exactly the format they expect.