# Development Environment Setup

## ✅ Completed Setup
- Foundry installed and configured
- OpenZeppelin contracts library installed
- Project structure initialized
- Configuration files created

## 📋 Next Steps for You

### 1. Environment Variables
Copy `.env.example` to `.env` in the tokenized-bond directory:
```bash
cd tokenized-bond
cp .env.example .env
```

Then update with your actual values:
- **SEPOLIA_RPC_URL**: Get from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
- **PRIVATE_KEY**: Your wallet private key (with Sepolia ETH)
- **ETHERSCAN_API_KEY**: Get from [Etherscan](https://etherscan.io/apis)

### 2. Get Sepolia ETH
Get test ETH from these faucets:
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [Chainlink Faucet](https://faucets.chain.link/)

### 3. Verify Installation
```bash
cd tokenized-bond
forge build
```

## 📁 Project Structure
```
oz-work-trial/
├── tokenized-bond/          # Foundry project
│   ├── src/                # Smart contracts
│   ├── test/               # Tests
│   ├── script/             # Deployment scripts
│   └── lib/                # Dependencies
├── docs/                   # Documentation
└── private-docs/           # Work trial docs
```

## 🛠️ Technology Stack
- **Smart Contracts**: Solidity 0.8.20
- **Framework**: Foundry
- **Libraries**: OpenZeppelin Contracts v5.4.0
- **Network**: Sepolia Testnet
- **Monitoring**: OpenZeppelin Monitor (OSS)
- **Automation**: OpenZeppelin Relayer (OSS)