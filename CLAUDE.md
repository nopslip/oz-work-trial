# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## WORK TRIAL GOAL - CRITICAL TO UNDERSTAND

**This is an OpenZeppelin Solution Architect work trial (Exercise 1: 80% focus)**

**THE GOAL**: Demonstrate how OpenZeppelin's OSS Tooling (Monitors + Relayers) provides operational security for financial institutions with tokenized bonds.

**WHAT MATTERS**:
1. **Monitor Configuration** - Detecting operational risks (missed payments, unauthorized transfers, regulatory thresholds)
2. **Event Detection** - Showing the Monitor catches events in real-time
3. **Webhook Integration** - Monitor triggers webhooks to Relayer for automated responses
4. **Detection-Response Strategy** - Clear documentation of how risks are handled

**WHAT DOESN'T MATTER**:
- Whether interest actually gets transferred (events are sufficient)
- Perfect contract implementation (it's a demo/prototype)
- Actual token distribution mechanics

**THE DEMONSTRATION**: Show a financial institution how OpenZeppelin's tools detect risks and can trigger automated responses. The value is in the MONITORING and AUTOMATION infrastructure, not in building a production bond system.

## Project Overview

**Scenario**: A financial institution (e.g., Goldman Sachs) has issued a tokenized bond and needs OSS Tooling for operational risk monitoring.

**Key Components:**
- **Tokenized Bond Contract**: Demo contract with events for operational risks (deployed to Sepolia at `0xE8bc7ff409dD6DceA77b3A948AF2c6a18E97327f`)
- **OpenZeppelin Monitor**: Configured to detect all operational risk events
- **OpenZeppelin Relayer**: Ready to receive webhooks and execute automated responses

## Essential Commands

### Tokenized Bond (Foundry/Solidity)
```bash
# Build contracts
cd tokenized-bond
forge build

# Run tests
forge test

# Deploy to Sepolia
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify

# Format Solidity code
forge fmt
```

### OpenZeppelin Monitor (Rust)
```bash
cd openzeppelin-monitor
cargo build                           # Build the project
RUST_TEST_THREADS=1 cargo test      # Run tests
cargo make docker-compose-up         # Start with Docker
cargo make docker-compose-down       # Stop Docker services
```

### OpenZeppelin Relayer (Rust)
```bash
cd openzeppelin-relayer
cargo build                          # Build the project
cargo test                          # Run tests
cargo run                           # Run locally
cargo make docker-compose-up        # Start with Docker
cargo make docker-compose-down      # Stop Docker services

# Create signing keys
cargo run --example create_key -- --password YOUR_PASSWORD --output-dir config/keys --filename local-signer.json
```

## Architecture

### Contract Structure
The tokenized bond contract (`tokenized-bond/src/TokenizedBond.sol`) implements:
- ERC20 token standard with OpenZeppelin libraries
- Access control for KYC/compliance management
- Pausable functionality for emergency response
- Interest payment mechanisms
- Comprehensive event emissions for monitoring

### Monitoring Flow
```
Blockchain Events → OpenZeppelin Monitor → Event Processing → Webhook Triggers → Relayer Actions
```

The OpenZeppelin Monitor is configured to track:
- Interest payment events
- Large transfers (>100,000 tokens)
- Compliance violations
- Administrative actions

### Tech Stack
- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin Contracts, Foundry
- **OpenZeppelin Monitor**: Rust 1.86+, Actix-web, Alloy, multi-chain support (EVM, Stellar)
- **OpenZeppelin Relayer**: Rust 1.86+, Actix-web, multi-chain support (EVM, Solana, Stellar)
- **RPC Provider**: Infura for Sepolia (primary) with Google Cloud as fallback

## Configuration Files

### Environment Variables
- `SEPOLIA_RPC_URL`: Primary RPC is Infura (`https://sepolia.infura.io/v3/2AfMtoHKBq2zRKqLfG9E1cAiMMF`), with Google Cloud as fallback
- `CONTRACT_ADDRESS`: Deployed tokenized bond address
- `ETHERSCAN_API_KEY`: For contract verification
- `KEYSTORE_PASSPHRASE`: For relayer signer keystore
- `WEBHOOK_SIGNING_KEY`: For webhook payload signing
- `API_KEY`: For API authentication

### Key Configuration Locations
- Tokenized Bond: `/tokenized-bond/foundry.toml`, `/tokenized-bond/.env`
- OpenZeppelin Monitor: `/openzeppelin-monitor/config/monitors/tokenized-bond-monitor.json`
- OpenZeppelin Monitor Network: `/openzeppelin-monitor/config/networks/ethereum_sepolia.json`
- OpenZeppelin Monitor Triggers: `/openzeppelin-monitor/config/triggers/`
- OpenZeppelin Relayer: `/openzeppelin-relayer/config/config.json`

## Testing Strategy

### Contract Testing
- Unit tests in `/tokenized-bond/test/`
- Run with `forge test` for all tests
- Use `forge test --match-test testSpecificFunction` for targeted testing

### Rust Project Testing
- Run tests with thread safety: `RUST_TEST_THREADS=1 cargo test`
- Property tests: `cargo test properties`
- Integration tests: `cargo test integration`

## MCP Integration

The project includes OpenZeppelin's Model Context Protocol (MCP) server for AI-powered contract generation. Commands available:
- `mcp__OpenZeppelinSolidityContracts__solidity-erc20`: Generate ERC20 contracts
- `mcp__OpenZeppelinSolidityContracts__solidity-erc721`: Generate NFT contracts
- `mcp__OpenZeppelinSolidityContracts__solidity-governor`: Generate governance contracts

## Work Trial Deliverables & Presentation Focus

### What to Show in the Demo (10-15 minutes):

1. **Live Contract on Sepolia** - "Here's the tokenized bond at 0xE8bc..."
2. **Monitor Configuration** - "We're monitoring these 5 operational risks..."
3. **Event Detection Demo** - "When interest is due, the Monitor detects it..."
4. **Webhook to Relayer** - "The Monitor sends a webhook to trigger automated response..."
5. **Risk Mitigation** - "Compliance violations are caught instantly..."

### Key Talking Points:

- "OpenZeppelin's OSS Tooling provides real-time operational risk detection"
- "Events trigger automated responses through the Monitor-Relayer pipeline"
- "Financial institutions get enterprise-grade monitoring without vendor lock-in"
- "The open-source stack costs $0 in licensing"

### What NOT to Focus On:

- Don't explain how interest payments work internally
- Don't worry about actual token transfers
- Don't get into contract implementation details
- Focus on the MONITORING and AUTOMATION value

## Critical Integration Issues - MUST READ

### Monitor-Relayer Webhook Integration
**THE PROBLEM**: Monitor sends webhooks with a `message` field, but Relayer plugins expect a `params` field.

**WORKING CONFIGURATION**:
1. **Monitor webhook trigger format** (`config/triggers/webhook_triggers.json`):
```json
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
        "body": "Contract was paused at block ${block.number}"
      }
    }
  }
}
```

2. **Relayer Plugin Handler**: Must handle the format the Monitor sends. The Relayer SDK wraps the webhook payload in a `params` object.

3. **Running the Monitor**: MUST run from the monitor directory:
```bash
cd /Users/zak/projects/oz-work-trial/openzeppelin-monitor
cargo run
```

**DO NOT**:
- Try to use `body` field directly in webhook triggers - it will fail to parse
- Try to nest `params` inside `message` - the format is fixed
- Run monitor from wrong directory - it needs access to config/ folder

**KNOWN WORKING FLOW**: 
- Monitor detects Paused/Unpaused events → Sends webhook with `message` → Relayer receives at `/api/v1/plugins/{id}/call` → Plugin handler gets `params` object

## Important Notes

1. **Documentation**: ALL documentation MUST go in the `/docs` folder. Do not create documentation files in the root directory or scattered throughout the project.

2. **Contract Deployment**: The tokenized bond is already deployed on Sepolia at `0xE8bc7ff409dD6DceA77b3A948AF2c6a18E97327f`. Any modifications require redeployment.

3. **Monitor Configuration**: The OpenZeppelin Monitor is fully configured with:
   - Contract-specific events (InterestPaymentDue, ComplianceViolation, etc.)
   - Webhook triggers for automated relayer integration
   - Infura RPC for reliable blockchain access (with Google Cloud as fallback)

4. **Production Architecture**: This setup demonstrates enterprise-grade monitoring:
   - Email notifications for compliance teams (configurable in triggers)
   - Webhook integration for automated responses
   - Multi-notification channel support (webhooks, email, custom scripts)

5. **Rust Development**: Both Monitor and Relayer projects require Rust 1.86+ and use cargo-make for task automation.

6. **Security**: Never commit private keys or sensitive credentials. Use environment variables and secure key management.

7. **Testing**: Always run tests before deployment. Use thread-safe testing for Rust projects: `RUST_TEST_THREADS=1 cargo test`