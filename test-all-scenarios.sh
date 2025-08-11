#!/bin/bash

echo "======================================"
echo "Testing All 5 Demo Scenarios"
echo "======================================"
echo

# Scenario 1: Interest Payment Alert
echo "📊 Scenario 1: Missed Interest Payment Detection"
echo "------------------------------------------------"
curl -X POST http://localhost:8080/api/v1/plugins/interest-handler/call \
  -H "Authorization: Bearer A21E413E-DF82-4FFB-8525-51971CB00F70" \
  -H "Content-Type: application/json" \
  -d '{"params": {"title": "Interest Payment Due", "body": "Interest payment overdue by 3 days", "alert_level": "CRITICAL"}}' \
  2>/dev/null | jq '.' 2>/dev/null || echo "Response received"
echo
sleep 2

# Scenario 2: Large Transfer Detection
echo "💸 Scenario 2: Large Transfer Detection"
echo "---------------------------------------"
curl -X POST http://localhost:8080/api/v1/plugins/large-transfer-handler/call \
  -H "Authorization: Bearer A21E413E-DF82-4FFB-8525-51971CB00F70" \
  -H "Content-Type: application/json" \
  -d '{"params": {"title": "Large Transfer Alert", "body": "Transfer exceeds threshold", "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0fEd3", "to": "0x123...", "amount": "500000"}}' \
  2>/dev/null | jq '.' 2>/dev/null || echo "Response received"
echo
sleep 2

# Scenario 3: Concentration Risk
echo "⚖️ Scenario 3: Regulatory Threshold (Concentration Risk)"
echo "--------------------------------------------------------"
curl -X POST http://localhost:8080/api/v1/plugins/concentration-risk-handler/call \
  -H "Authorization: Bearer A21E413E-DF82-4FFB-8525-51971CB00F70" \
  -H "Content-Type: application/json" \
  -d '{"params": {"title": "Concentration Risk Alert", "body": "Entity exceeds 20% ownership", "event": {"holder": "0xABCD...Goldman", "percentage": 24}}}' \
  2>/dev/null | jq '.' 2>/dev/null || echo "Response received"
echo
sleep 2

# Scenario 4: Key Compromise Detection
echo "🔐 Scenario 4: Private Key Compromise Detection"
echo "-----------------------------------------------"
curl -X POST http://localhost:8080/api/v1/plugins/key-compromise-handler/call \
  -H "Authorization: Bearer A21E413E-DF82-4FFB-8525-51971CB00F70" \
  -H "Content-Type: application/json" \
  -d '{"params": {"title": "KEY COMPROMISE DETECTED", "body": "Unauthorized upgrade outside window", "event_time": "Tuesday 3:00 PM", "expected_window": "Sunday 2-4 AM UTC"}}' \
  2>/dev/null | jq '.' 2>/dev/null || echo "Response received"
echo
sleep 2

# Scenario 5: OFAC Sanctions Screening
echo "🚫 Scenario 5: OFAC Sanctions Screening"
echo "---------------------------------------"
curl -X POST http://localhost:8080/api/v1/plugins/ofac-screening-handler/call \
  -H "Authorization: Bearer A21E413E-DF82-4FFB-8525-51971CB00F70" \
  -H "Content-Type: application/json" \
  -d '{"params": {"title": "OFAC Screening", "body": "Pre-payment screening", "recipients": ["0xA1b2C3d4E5f6789012345678901234567890AbCd", "0x1234567890abcdef1234567890abcdef12345678", "0xB2c3D4e5F67890123456789012345678901234Ef"]}}' \
  2>/dev/null | jq '.' 2>/dev/null || echo "Response received"
echo

echo "======================================"
echo "✅ All 5 Scenarios Tested"
echo "======================================"
echo
echo "Check the terminal where Monitor and Relayer are running to see detailed logs."
echo "Each scenario demonstrates different operational risk detection and automated response."