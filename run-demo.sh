#!/bin/bash

# LIVE DEMO - Triggers actual contract functions that emit events
# Monitor detects → Sends webhooks → Relayer responds

set -e

echo "================================================"
echo "🚀 OpenZeppelin Monitor + Relayer LIVE DEMO"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Create .env with PRIVATE_KEY, SEPOLIA_RPC_URL, and CONTRACT_ADDRESS"
    exit 1
fi

# Use env vars with fallbacks
CONTRACT_ADDRESS="${CONTRACT_ADDRESS:-0xB9A538E720f7C05a7A4747A484C231c956920bEf}"
RPC_URL="${SEPOLIA_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"

# Check private key
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}Error: PRIVATE_KEY not set in .env${NC}"
    exit 1
fi

echo "Setup:"
echo "  Contract: $CONTRACT_ADDRESS"
echo "  Network: Sepolia"
echo ""
echo "Make sure:"
echo "  Terminal 1: Relayer is running"
echo "  Terminal 2: Monitor is running"
echo ""
read -p "Press Enter to start..."

echo ""
echo -e "${BLUE}Demo 1: Emergency Pause Event${NC}"
echo "------------------------------"

# First check if contract is already paused
IS_PAUSED=$(cast call "$CONTRACT_ADDRESS" "paused()" --rpc-url "$RPC_URL")
if [ "$IS_PAUSED" = "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
    echo "Contract is already paused, unpausing first..."
    cast send \
        --private-key "$PRIVATE_KEY" \
        --rpc-url "$RPC_URL" \
        "$CONTRACT_ADDRESS" \
        "unpause()" > /dev/null 2>&1
    sleep 2
fi

echo "Calling emergencyPause() to trigger EmergencyPause event..."
echo ""

cast send \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL" \
    "$CONTRACT_ADDRESS" \
    "emergencyPause(string)" \
    "Demo emergency pause"

echo ""
echo -e "${YELLOW}Watch the logs:${NC}"
echo "  Monitor: Should detect EmergencyPause event"
echo "  Monitor: Sends webhook to localhost:8080/emergency-pause"
echo "  Relayer: Receives webhook"
echo ""
sleep 5

echo -e "${BLUE}Demo 2: Unpause Contract${NC}"
echo "------------------------"
echo "Calling unpause() to resume operations..."
echo ""

cast send \
    --private-key "$PRIVATE_KEY" \
    --rpc-url "$RPC_URL" \
    "$CONTRACT_ADDRESS" \
    "unpause()"

echo ""
echo "Contract unpaused for next operations"
echo ""
sleep 3

echo -e "${BLUE}Demo 3: Check Interest Status${NC}"
echo "-----------------------------"
echo "Checking if interest is due..."
echo ""

# Check if interest is due first
IS_DUE=$(cast call "$CONTRACT_ADDRESS" "isInterestDue()" --rpc-url "$RPC_URL")
if [ "$IS_DUE" = "0x0000000000000000000000000000000000000000000000000000000000000001" ]; then
    echo "Interest is due! Distributing..."
    cast send \
        --private-key "$PRIVATE_KEY" \
        --rpc-url "$RPC_URL" \
        "$CONTRACT_ADDRESS" \
        "distributeInterest()"
else
    echo -e "${YELLOW}Interest not yet due (30-day cycle not complete)${NC}"
    echo "In production, the Monitor would detect InterestPaymentDue event"
    echo "and trigger the Relayer to call distributeInterest()"
fi

echo ""
echo -e "${YELLOW}Watch the logs:${NC}"
echo "  Monitor: Should detect InterestPaid event"
echo "  Shows automated interest distribution"
echo ""

echo "================================================"
echo -e "${GREEN}Demo Complete!${NC}"
echo "================================================"
echo ""
echo "View events on Etherscan:"
echo "https://sepolia.etherscan.io/address/$CONTRACT_ADDRESS#events"
echo ""
echo "Key Points Demonstrated:"
echo "  ✓ Real-time event detection"
echo "  ✓ Native webhook integration"
echo "  ✓ Automated response capability"
echo ""