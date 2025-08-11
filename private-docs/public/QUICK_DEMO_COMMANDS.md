# Quick Demo Commands
## Copy-paste commands for the live demo

### Pre-Demo Setup
```bash
# Set environment variables
export CONTRACT=0xB9A538E720f7C05a7A4747A484C231c956920bef
export API_KEY=A21E413E-DF82-4FFB-8525-51971CB00F70
export RELAYER_URL=http://localhost:8080

# Check services are running
ps aux | grep openzeppelin
```

### Demo Sequence

#### 1. Show Plugin Status
```bash
curl $RELAYER_URL/api/v1/plugins \
  -H "Authorization: Bearer $API_KEY" | jq
```

#### 2. Test Interest Distribution
```bash
curl -X POST $RELAYER_URL/api/v1/plugins/interest-handler/call \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"params": {"title": "Interest Payment Due", "body": "Q4 2025 - 1247 holders"}}' | jq
```

#### 3. Test Emergency Pause
```bash
curl -X POST $RELAYER_URL/api/v1/plugins/emergency-pause/call \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"params": {"reason": "Large suspicious transfer detected - $50M from unknown address"}}' | jq
```

#### 4. Test Auto-Recovery
```bash
curl -X POST $RELAYER_URL/api/v1/plugins/pause-handler/call \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"params": {"title": "Contract Paused", "body": "Emergency resolved - initiating recovery"}}' | jq
```

#### 5. Check Relayer Logs
```bash
# Show last 20 lines of activity
tail -n 20 openzeppelin-relayer/relayer.log | grep -E "PLUGIN|Transaction"
```

#### 6. Check Monitor Detection
```bash
# Show event detection
tail -n 20 openzeppelin-monitor/monitor.log | grep -E "Event detected|Webhook sent"
```

### Contract Interaction (if needed)

#### Trigger Real Pause Event
```bash
# Requires funded account with PAUSER_ROLE
cast send $CONTRACT "pause()" \
  --private-key $PRIVATE_KEY \
  --rpc-url sepolia
```

#### Check Contract State
```bash
# Is paused?
cast call $CONTRACT "paused()(bool)" --rpc-url sepolia

# Get contract balance
cast balance $CONTRACT --rpc-url sepolia
```

### Troubleshooting Commands

#### Restart Monitor
```bash
cd openzeppelin-monitor
pkill -f openzeppelin-monitor
./target/debug/openzeppelin-monitor 2>&1 | tee monitor.log &
```

#### Restart Relayer
```bash
cd openzeppelin-relayer
pkill -f openzeppelin-relayer
./target/debug/openzeppelin-relayer --config config/config.json 2>&1 | tee relayer.log &
```

#### Check Port Usage
```bash
lsof -i :8080  # Relayer
lsof -i :3000  # Monitor
```

### Key Addresses
```
Contract: 0xB9A538E720f7C05a7A4747A484C231c956920bef
Relayer Signer: 0x34bb50060ef26455c1fbcd3145545abb6e32b890
```

### Response Examples

#### Successful Interest Distribution
```json
{
  "success": true,
  "action": "distributeInterest",
  "transactionId": "a0f6dfe8-bc6c-4eb7-a137-28340236f384",
  "message": "Successfully distributed interest payments to all bond holders",
  "contractAddress": "0xB9A538E720f7C05a7A4747A484C231c956920bef",
  "timestamp": "2025-08-11T10:30:00Z"
}
```

#### Emergency Pause Executed
```json
{
  "success": true,
  "action": "emergencyPause",
  "transactionId": "b1f7efe9-cd7d-5fc8-b248-39451347f495",
  "message": "EMERGENCY PAUSE EXECUTED - Contract operations halted",
  "reason": "Large suspicious transfer detected - $50M from unknown address",
  "urgent": true
}
```