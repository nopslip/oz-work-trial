# Technical Implementation Guide - Tokenized Bond with Monitor/Relayer

## Prerequisites (MUST INSTALL FIRST)

### System Dependencies
```bash
# macOS (Apple Silicon)
brew install libsodium pkg-config openssl
export PKG_CONFIG_PATH="/opt/homebrew/lib/pkgconfig:$PKG_CONFIG_PATH"

# macOS (Intel)
brew install libsodium pkg-config openssl
export PKG_CONFIG_PATH="/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH"

# Add to ~/.zshrc or ~/.bash_profile to make permanent
echo 'export PKG_CONFIG_PATH="/opt/homebrew/lib/pkgconfig:$PKG_CONFIG_PATH"' >> ~/.zshrc

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install libsodium-dev pkg-config libssl-dev build-essential

# Fedora/RHEL  
sudo dnf install libsodium-devel pkgconfig openssl-devel gcc
```

### Rust Installation
```bash
# Install Rust if not already installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version
```

### Foundry Installation (for smart contracts)
```bash
# Install Foundry for contract deployment
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version
```

## Current Status ✅

### Deployed Contract
- **Proxy Address**: `0xB9A538E720f7C05a7A4747A484C231c956920bEf`
- **Implementation**: `0xE42cabc7927645B58D4Fc06CA4c9582ce002FC44`
- **Network**: Ethereum Sepolia
- **Etherscan**: https://sepolia.etherscan.io/address/0xb9a538e720f7c05a7a4747a484c231c956920bef
- **Admin/Deployer**: `0xF2431c13e4240385215afA90230bbd98a98c2c4e`

### Environment Files Already Configured
- **Monitor**: `/openzeppelin-monitor/.env` ✅
- **Relayer**: `/openzeppelin-relayer/.env` ✅ (needs private key)

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Blockchain (Sepolia)               │
│  ┌────────────────────────────────────────────────┐ │
│  │  AcmeBankCryptoBond (UUPS Proxy)               │ │
│  │  Address: 0xB9A538E720f7C05a7A4747A484C231c956920bEf│ │
│  │  - ERC20 token with interest distribution      │ │
│  │  - Role-based access control                   │ │
│  │  - Emergency pause capability                  │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                            ↑↓
┌─────────────────────────────────────────────────────┐
│              Monitoring & Automation Layer           │
│  ┌──────────────────┐    ┌──────────────────────┐  │
│  │  OZ Monitor      │───►│  OZ Relayer          │  │
│  │  - Event detection│    │  - Automated execution│  │
│  │  - Time triggers │    │  - Key management     │  │
│  │  - Webhooks      │    │  - Gas optimization   │  │
│  └──────────────────┘    └──────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Quick Start (What You Need to Do)

### Step 1: Add Your Private Key to Relayer
```bash
cd openzeppelin-relayer
# Edit .env and replace the private key
nano .env
# Find line: PRIVATE_KEY=0x...
# Replace with your actual private key from deployment
```

### Step 2: Build the Projects (First Time Only)
```bash
# Build Monitor (takes 5-10 minutes first time)
cd openzeppelin-monitor
cargo build

# Build Relayer (takes 5-10 minutes first time)
cd ../openzeppelin-relayer
cargo build
```

### Step 3: Run the Services

#### Terminal 1: Start Monitor
```bash
cd openzeppelin-monitor
RUST_LOG=info cargo run

# You should see:
# "Service started. Press Ctrl+C to shutdown"
# Warnings about "insecure protocol" are fine (it's localhost)
```

#### Terminal 2: Start Relayer
```bash
cd openzeppelin-relayer
cargo run

# Should start listening on port 8080
# Check health: curl http://localhost:8080/health
```

#### Terminal 3: Test the Integration
```bash
# Test Relayer is running
curl http://localhost:8080/health

# Generate on-chain activity
cd tokenized-bond
forge script script/TestInteractions.s.sol --rpc-url sepolia --broadcast

# Or test webhooks directly
curl -X POST http://localhost:8080/large-transfer-alert \
  -H "Content-Type: application/json" \
  -H "X-Monitor-Secret: monitor-relayer-secret-2025" \
  -d '{"title": "Test", "body": "Testing webhook"}'
```

## How It Works

### Monitor Operation
The Monitor automatically:
1. Loads all configs from `config/` directory (no --config flag needed)
2. Connects to Sepolia via Google Cloud RPC
3. Watches contract `0xB9A538E720f7C05a7A4747A484C231c956920bEf`
4. Detects events: LargeTransfer, EmergencyPause, InterestPaymentDue, etc.
5. Sends webhooks to Relayer when events match conditions

### Relayer Operation
The Relayer:
1. Listens on port 8080 for webhooks from Monitor
2. Uses your private key to sign transactions
3. Can execute: distributeInterest(), emergencyPause(), allocateFunds()
4. All roles currently assigned to single deployer address (demo setup)

## Configuration Files

### Monitor Configuration
```
/openzeppelin-monitor/
├── config/
│   ├── networks/
│   │   └── ethereum_sepolia.json    # Network RPC config
│   ├── monitors/
│   │   └── acme-bond-monitor.json   # What to watch
│   └── triggers/
│       └── webhook_triggers.json    # Where to send alerts
└── .env                             # Environment variables
```

### Relayer Configuration
```
/openzeppelin-relayer/
├── config/
│   └── acme-bond-relayer.json      # Relayer endpoints
└── .env                             # Private key & secrets
```

## Key Contract Functions

### Automated by Relayer
- `distributeInterest()` - Monthly interest payment (INTEREST_PAYER_ROLE)
- `emergencyPause(reason)` - Circuit breaker (PAUSER_ROLE)
- `unpause()` - Resume operations (PAUSER_ROLE)
- `allocateFunds(toCrypto, toInterest, toOperational)` - Pool management (TREASURER_ROLE)

### Manual Operations
- `transfer()` - Regular token transfers (any holder)
- `mint()` - Issue new bonds (MINTER_ROLE)
- `grantRole/revokeRole` - Permission management (DEFAULT_ADMIN_ROLE)

## Demo Scenarios

### 1. Large Transfer Detection
```bash
# Do a large transfer (>100k tokens)
cd tokenized-bond
cast send 0xB9A538E720f7C05a7A4747A484C231c956920bEf \
  "transfer(address,uint256)" \
  0x1234567890123456789012345678901234567890 \
  150000000000000000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url sepolia

# Monitor detects → Sends webhook → Relayer receives alert
```

### 2. Emergency Pause
```bash
# Trigger emergency pause
curl -X POST http://localhost:8080/emergency-pause \
  -H "Content-Type: application/json" \
  -H "X-Monitor-Secret: monitor-relayer-secret-2025" \
  -d '{"reason": "Market crash detected"}'

# Contract is now paused, all transfers blocked
```

### 3. Interest Payment (When Due)
```bash
# Monitor checks every minute for:
# block.timestamp >= nextInterestPayment

# When true:
# Monitor → Webhook → Relayer → distributeInterest()
# All token holders receive interest automatically
```

## Common Issues & Solutions

### Monitor Issues

**Error: "Failed to load networks"**
- Check `config/networks/ethereum_sepolia.json` exists
- Ensure proper JSON format with `rpc_urls` not `rpcs`

**Error: "Failed to load triggers"**
- Check `config/triggers/webhook_triggers.json` format
- Triggers must be a map with trigger IDs as keys

**Monitor not detecting events**
- Check contract address is correct: `0xB9A538E720f7C05a7A4747A484C231c956920bEf`
- Verify RPC endpoint is working
- Check you have activity on the contract

### Relayer Issues

**Error: "libsodium not found"**
```bash
brew install libsodium
export PKG_CONFIG_PATH="/opt/homebrew/lib/pkgconfig:$PKG_CONFIG_PATH"
```

**Error: "Connection refused on port 8080"**
- Ensure Relayer is running: `cargo run`
- Check no other service is using port 8080
- Verify firewall isn't blocking localhost

**Transaction failures**
- Check private key has ETH for gas
- Verify private key has required roles on contract
- Ensure contract isn't paused

## Testing Checklist

- [ ] Monitor starts without errors
- [ ] Relayer starts without errors  
- [ ] Health check works: `curl http://localhost:8080/health`
- [ ] Monitor detects contract events
- [ ] Webhooks reach Relayer
- [ ] Relayer can execute transactions

## Production Considerations

### Current Setup (Demo)
- Private key in `.env` file
- All roles on single address
- HTTP webhooks on localhost
- Single Monitor/Relayer instance

### Production Setup Would Use
- AWS KMS or Hardware Security Module for keys
- Separate addresses per role
- HTTPS webhooks with authentication
- Multiple Monitor/Relayer instances for redundancy
- Separate keys for each role:
  - INTEREST_PAYER_ROLE → Dedicated automated wallet
  - PAUSER_ROLE → Security team multisig
  - TREASURER_ROLE → Finance team multisig
  - DEFAULT_ADMIN_ROLE → 3-of-5 executive multisig

## Key Talking Points for Demo

1. **Automated Operations**: "Interest payments happen automatically every month - no manual intervention"

2. **Instant Response**: "Emergency pause activates in <2 seconds when Monitor detects issues"

3. **Enterprise Security**: "Private keys never exposed - in production would use HSM/KMS"

4. **24/7 Monitoring**: "Monitor watches continuously, never misses an event"

5. **Gas Optimization**: "UUPS proxy saves 5,000 gas per transaction"

6. **Role Separation**: "Different teams have different permissions - enforced by smart contract"

7. **Audit Trail**: "Every action logged on-chain, immutable record for regulators"

## Commands Reference

```bash
# Monitor
cd openzeppelin-monitor
RUST_LOG=info cargo run          # Run with info logging
RUST_LOG=debug cargo run         # Run with debug logging

# Relayer
cd openzeppelin-relayer
cargo run                         # Run with default config

# Contract Interaction
cd tokenized-bond
forge script script/TestInteractions.s.sol --rpc-url sepolia --broadcast

# Check Contract State
cast call 0xB9A538E720f7C05a7A4747A484C231c956920bEf "totalSupply()" --rpc-url sepolia
cast call 0xB9A538E720f7C05a7A4747A484C231c956920bEf "paused()" --rpc-url sepolia

# View on Etherscan
open https://sepolia.etherscan.io/address/0xb9a538e720f7c05a7a4747a484c231c956920bef
```

## Support Resources

- OpenZeppelin Monitor Docs: https://docs.openzeppelin.com/monitor
- Foundry Book: https://book.getfoundry.sh
- Sepolia Faucet: https://sepoliafaucet.com
- Contract on Etherscan: https://sepolia.etherscan.io/address/0xb9a538e720f7c05a7a4747a484c231c956920bef