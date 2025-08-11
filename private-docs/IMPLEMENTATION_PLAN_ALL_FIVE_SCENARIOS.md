# Implementation Plan: All Five Demo Scenarios

## Overview
Based on the working pause/unpause demo, we need to implement monitoring and automated responses for all five operational risk scenarios from the Goldman Sachs tokenized bond narrative.

## The Five Scenarios to Implement

### 1. ✅ Emergency Pause/Unpause (ALREADY WORKING)
**Status**: COMPLETE
- Monitor detects `Paused` event
- Script wraps data and sends to Relayer plugin
- Plugin automatically calls `unpause()` to restore operations

### 2. 🔄 Missed Interest Payments
**Risk**: Interest payment overdue
**Response**: Automatically trigger payment distribution

### 3. 🔄 Large Transfer Detection
**Risk**: Transfers over threshold need compliance review
**Response**: Alert compliance team, potentially pause if suspicious

### 4. 🔄 Concentration Risk
**Risk**: Single holder accumulating too much supply
**Response**: Alert risk management, enforce position limits

### 5. 🔄 Compliance Violation
**Risk**: Non-KYC address attempting transfer
**Response**: Transaction already blocked by contract, but alert compliance

## Implementation Architecture

```
Contract Event → Monitor Detection → Script Trigger → Format Translation → Relayer Plugin → Response Action
```

## Step-by-Step Implementation Plan

### Phase 1: Update Smart Contract (tokenized-bond/)

#### Add Missing Events
```solidity
// Events we need to add to TokenizedBond.sol
event InterestPaymentDue(uint256 timestamp, uint256 totalAmount);
event MissedInterestPayment(uint256 dueDate, uint256 daysOverdue);
event LargeTransfer(address indexed from, address indexed to, uint256 amount);
event ConcentrationRisk(address indexed holder, uint256 percentage);
event ComplianceViolation(address indexed account, string reason);
```

#### Add Functions to Trigger Events
```solidity
// Function to check if interest is due
function checkInterestPaymentDue() public view returns (bool) {
    // Logic to check if 30 days have passed
    if (block.timestamp >= lastInterestPayment + 30 days) {
        emit InterestPaymentDue(block.timestamp, calculateTotalInterest());
        return true;
    }
    return false;
}

// Override transfer to emit LargeTransfer
function _transfer(address from, address to, uint256 amount) internal override {
    super._transfer(from, to, amount);
    
    if (amount > LARGE_TRANSFER_THRESHOLD) {
        emit LargeTransfer(from, to, amount);
    }
    
    // Check concentration after transfer
    uint256 percentage = (balanceOf(to) * 100) / totalSupply();
    if (percentage > CONCENTRATION_THRESHOLD) {
        emit ConcentrationRisk(to, percentage);
    }
}
```

### Phase 2: Monitor Configuration (openzeppelin-monitor/)

#### 1. Update Monitor Config with All Events
File: `config/monitors/demo-all-scenarios.json`

```json
{
  "name": "Goldman Sachs Bond Monitor",
  "addresses": [{
    "address": "0xb9a538e720f7c05a7a4747a484c231c956920bef",
    "contract_spec": [
      // Add all 5 event ABIs here
      {
        "name": "Paused",
        "inputs": [{"name": "account", "type": "address"}],
        "type": "event"
      },
      {
        "name": "InterestPaymentDue",
        "inputs": [
          {"name": "timestamp", "type": "uint256"},
          {"name": "totalAmount", "type": "uint256"}
        ],
        "type": "event"
      },
      {
        "name": "LargeTransfer",
        "inputs": [
          {"name": "from", "type": "address", "indexed": true},
          {"name": "to", "type": "address", "indexed": true},
          {"name": "amount", "type": "uint256"}
        ],
        "type": "event"
      },
      {
        "name": "ConcentrationRisk",
        "inputs": [
          {"name": "holder", "type": "address", "indexed": true},
          {"name": "percentage", "type": "uint256"}
        ],
        "type": "event"
      },
      {
        "name": "ComplianceViolation",
        "inputs": [
          {"name": "account", "type": "address", "indexed": true},
          {"name": "reason", "type": "string"}
        ],
        "type": "event"
      }
    ]
  }],
  "match_conditions": {
    "events": [
      {"signature": "Paused(address)"},
      {"signature": "InterestPaymentDue(uint256,uint256)"},
      {"signature": "LargeTransfer(address,address,uint256)"},
      {"signature": "ConcentrationRisk(address,uint256)"},
      {"signature": "ComplianceViolation(address,string)"}
    ]
  },
  "triggers": [
    "pause_relay_script",
    "interest_payment_script",
    "large_transfer_script",
    "concentration_risk_script",
    "compliance_violation_script"
  ]
}
```

#### 2. Create Script Triggers
File: `config/triggers/script_triggers.json`

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
  },
  "interest_payment_script": {
    "name": "Interest Payment Script",
    "trigger_type": "script",
    "config": {
      "script_path": "./config/triggers/scripts/interest_payment.sh",
      "language": "Bash",
      "timeout_ms": 5000
    }
  },
  "large_transfer_script": {
    "name": "Large Transfer Script",
    "trigger_type": "script",
    "config": {
      "script_path": "./config/triggers/scripts/large_transfer.sh",
      "language": "Bash",
      "timeout_ms": 5000
    }
  },
  "concentration_risk_script": {
    "name": "Concentration Risk Script",
    "trigger_type": "script",
    "config": {
      "script_path": "./config/triggers/scripts/concentration_risk.sh",
      "language": "Bash",
      "timeout_ms": 5000
    }
  },
  "compliance_violation_script": {
    "name": "Compliance Violation Script",
    "trigger_type": "script",
    "config": {
      "script_path": "./config/triggers/scripts/compliance_violation.sh",
      "language": "Bash",
      "timeout_ms": 5000
    }
  }
}
```

### Phase 3: Create Bridge Scripts (openzeppelin-monitor/config/triggers/scripts/)

#### 1. interest_payment.sh
```bash
#!/bin/bash
input_json=$(cat)

# Extract event data and send to interest-handler plugin
curl -X POST http://localhost:8080/api/v1/plugins/interest-handler/call \
  -H "Authorization: Bearer A21E413E-DF82-4FFB-8525-51971CB00F70" \
  -H "Content-Type: application/json" \
  -d "{\"params\": {\"event\": \"InterestPaymentDue\", \"data\": $input_json}}" \
  2>/dev/null

echo '{"success": true}'
```

#### 2. large_transfer.sh
```bash
#!/bin/bash
input_json=$(cat)

# Send to compliance-handler plugin
curl -X POST http://localhost:8080/api/v1/plugins/compliance-handler/call \
  -H "Authorization: Bearer A21E413E-DF82-4FFB-8525-51971CB00F70" \
  -H "Content-Type: application/json" \
  -d "{\"params\": {\"event\": \"LargeTransfer\", \"data\": $input_json}}" \
  2>/dev/null

echo '{"success": true}'
```

#### 3. concentration_risk.sh
```bash
#!/bin/bash
input_json=$(cat)

# Send to risk-handler plugin
curl -X POST http://localhost:8080/api/v1/plugins/risk-handler/call \
  -H "Authorization: Bearer A21E413E-DF82-4FFB-8525-51971CB00F70" \
  -H "Content-Type: application/json" \
  -d "{\"params\": {\"event\": \"ConcentrationRisk\", \"data\": $input_json}}" \
  2>/dev/null

echo '{"success": true}'
```

#### 4. compliance_violation.sh
```bash
#!/bin/bash
input_json=$(cat)

# Send to compliance-handler plugin
curl -X POST http://localhost:8080/api/v1/plugins/compliance-handler/call \
  -H "Authorization: Bearer A21E413E-DF82-4FFB-8525-51971CB00F70" \
  -H "Content-Type: application/json" \
  -d "{\"params\": {\"event\": \"ComplianceViolation\", \"data\": $input_json}}" \
  2>/dev/null

echo '{"success": true}'
```

### Phase 4: Create Relayer Plugins (openzeppelin-relayer/plugins/)

#### 1. interest-handler.ts
```typescript
import { Speed, PluginAPI } from "@openzeppelin/relayer-sdk";

const CONTRACT_ADDRESS = "0xB9A538E720f7C05a7A4747A484C231c956920bef";
const PAY_INTEREST_SELECTOR = "0x..."; // payInterest() selector

export async function handler(api: PluginAPI, params: any): Promise<any> {
    console.log("[INTEREST-HANDLER] Interest payment due, triggering distribution");
    
    const relayer = api.useRelayer("acme-bond-sepolia");
    
    // Get all token holders (would need to track this)
    // For demo, use hardcoded addresses
    const holders = [
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Pension Fund
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"  // Insurance Co
    ];
    
    const result = await relayer.sendTransaction({
        to: CONTRACT_ADDRESS,
        data: PAY_INTEREST_SELECTOR + encodeHolders(holders),
        value: 0,
        gas_limit: 500000,
        speed: Speed.FAST,
    });
    
    return {
        success: true,
        action: "interest_payment",
        transactionId: result.id,
        message: "Interest payment triggered for all holders"
    };
}
```

#### 2. compliance-handler.ts
```typescript
export async function handler(api: PluginAPI, params: any): Promise<any> {
    const eventType = params.event;
    const eventData = params.data;
    
    console.log(`[COMPLIANCE-HANDLER] ${eventType} detected`);
    
    if (eventType === "LargeTransfer") {
        // Log for compliance review
        // Could send email notification
        // Could pause contract if amount is extreme
        
        if (eventData.amount > EXTREME_THRESHOLD) {
            const relayer = api.useRelayer("acme-bond-sepolia");
            const result = await relayer.sendTransaction({
                to: CONTRACT_ADDRESS,
                data: PAUSE_SELECTOR,
                value: 0,
                gas_limit: 100000,
                speed: Speed.FAST,
            });
            
            return {
                success: true,
                action: "emergency_pause",
                reason: "Extreme transfer detected",
                transactionId: result.id
            };
        }
    }
    
    return {
        success: true,
        action: "logged",
        message: `${eventType} logged for compliance review`
    };
}
```

#### 3. risk-handler.ts
```typescript
export async function handler(api: PluginAPI, params: any): Promise<any> {
    const eventData = params.data;
    
    console.log("[RISK-HANDLER] Concentration risk detected");
    console.log(`Holder ${eventData.holder} owns ${eventData.percentage}% of supply`);
    
    // Could enforce position limits
    // Could notify risk management team
    // For demo, just log and alert
    
    return {
        success: true,
        action: "risk_alert",
        holder: eventData.holder,
        percentage: eventData.percentage,
        message: "Risk management team notified"
    };
}
```

### Phase 5: Update Relayer Config

File: `openzeppelin-relayer/config/config.json`

```json
{
  "plugins": [
    {
      "id": "pause-handler",
      "path": "monitor-webhooks/pause-handler.ts",
      "timeout": 30
    },
    {
      "id": "interest-handler",
      "path": "monitor-webhooks/interest-handler.ts",
      "timeout": 30
    },
    {
      "id": "compliance-handler",
      "path": "monitor-webhooks/compliance-handler.ts",
      "timeout": 30
    },
    {
      "id": "risk-handler",
      "path": "monitor-webhooks/risk-handler.ts",
      "timeout": 30
    }
  ]
}
```

### Phase 6: Testing Each Scenario

#### Test 1: Emergency Pause (Already Working)
```bash
cast send CONTRACT "pause()" --private-key KEY
# Monitor detects → Script runs → Plugin unpauses
```

#### Test 2: Interest Payment Due
```bash
cast send CONTRACT "checkInterestPaymentDue()" --private-key KEY
# Monitor detects → Script runs → Plugin triggers payInterest()
```

#### Test 3: Large Transfer
```bash
cast send CONTRACT "transfer(address,uint256)" RECIPIENT 100000000000000000000000 --private-key KEY
# Monitor detects → Script runs → Plugin logs for compliance
```

#### Test 4: Concentration Risk
```bash
# Transfer enough to trigger threshold
cast send CONTRACT "transfer(address,uint256)" WHALE_ADDRESS LARGE_AMOUNT --private-key KEY
# Monitor detects → Script runs → Plugin alerts risk team
```

#### Test 5: Compliance Violation
```bash
# Try to transfer to non-KYC address (will revert but emit event)
cast send CONTRACT "transfer(address,uint256)" NON_KYC_ADDRESS 1000 --private-key KEY
# Monitor detects → Script runs → Plugin logs violation
```

## Deployment Checklist

### Prerequisites
- [ ] Deploy updated TokenizedBond contract with all events
- [ ] Update contract address in all configs
- [ ] Fund Relayer signer account with ETH

### Monitor Setup
- [ ] Update monitor config with all 5 events
- [ ] Create all 5 script triggers in script_triggers.json
- [ ] Create all 5 bash scripts in scripts/
- [ ] Make all scripts executable (`chmod +x`)
- [ ] Test each script manually with echo

### Relayer Setup
- [ ] Create all 4 plugin TypeScript files
- [ ] Compile plugins to JavaScript
- [ ] Update config.json with all plugins
- [ ] Test each plugin endpoint with curl

### Integration Testing
- [ ] Start Monitor: `cd openzeppelin-monitor && cargo run`
- [ ] Start Relayer: `cd openzeppelin-relayer && cargo run`
- [ ] Trigger each event on-chain
- [ ] Verify Monitor detects each event
- [ ] Verify scripts execute
- [ ] Verify Relayer plugins respond
- [ ] Check transaction execution on Etherscan

## Demo Script

```bash
# 1. Show both services running
tmux new-session -d -s monitor 'cd openzeppelin-monitor && cargo run'
tmux new-session -d -s relayer 'cd openzeppelin-relayer && cargo run'

# 2. Trigger each scenario
echo "Scenario 1: Emergency Pause"
cast send $CONTRACT "pause()" --private-key $KEY

echo "Scenario 2: Interest Payment Due"
cast send $CONTRACT "checkInterestPaymentDue()" --private-key $KEY

echo "Scenario 3: Large Transfer Detection"
cast send $CONTRACT "transfer(address,uint256)" $RECIPIENT $LARGE_AMOUNT --private-key $KEY

echo "Scenario 4: Concentration Risk"
cast send $CONTRACT "transfer(address,uint256)" $WHALE $HUGE_AMOUNT --private-key $KEY

echo "Scenario 5: Compliance Violation"
cast send $CONTRACT "transfer(address,uint256)" $NON_KYC 1000 --private-key $KEY

# 3. Show the logs
tmux attach -t monitor  # Show events being detected
tmux attach -t relayer   # Show plugins responding
```

## Key Success Metrics

1. **All 5 events detected** by Monitor within 60 seconds
2. **All 5 scripts execute** successfully
3. **All 4 plugins respond** with 200 status
4. **Automated responses execute** on-chain where applicable
5. **Complete audit trail** in logs for compliance

## Timeline

- **Day 1**: Update and deploy contract with all events
- **Day 2**: Configure Monitor with all triggers
- **Day 3**: Create all bridge scripts
- **Day 4**: Implement all Relayer plugins
- **Day 5**: End-to-end testing of all scenarios
- **Day 6**: Demo preparation and practice
- **Day 7**: Live demo to stakeholders

This implementation plan builds on the working pause/unpause demo to create a comprehensive operational risk management system for the tokenized bond, demonstrating the full power of OpenZeppelin's OSS Tooling stack.