# MCP Prompt for JP Morgan Tokenized Bond Contract

## Contract Generation Request

Create an ERC-20 token contract for JP Morgan's tokenized corporate bond platform with the following specifications:

### Basic Information
- **Name**: "JP Morgan Corporate Bond Token"
- **Symbol**: "JPMCB"
- **License**: "MIT"
- **Security Contact**: "security@jpmorgan.com"

### Core Requirements

#### 1. Token Features
- **Mintable**: Yes - Only authorized roles can mint new bonds
- **Burnable**: Yes - Allow bond redemption through burning
- **Pausable**: Yes - Emergency pause capability for compliance
- **Permit**: Yes - Gasless approvals for better UX
- **Upgradeable**: UUPS - Allow contract upgrades with proper governance
- **Flash Mint**: No - Not needed for bonds

#### 2. Access Control
- **Type**: Roles (not Ownable) - Need multiple roles for different departments
- **Required Roles**:
  - ADMIN_ROLE - Overall administration
  - COMPLIANCE_ROLE - KYC/AML enforcement  
  - INTEREST_PAYER_ROLE - Automated interest distribution
  - TRANSFER_AGENT_ROLE - Authorized transfer management
  - AUDITOR_ROLE - Read-only access to all data

#### 3. Compliance Features

The contract must emit detailed events for operational monitoring:

**Critical Compliance Events**:
```solidity
event ComplianceViolation(address indexed violator, string reason, uint256 severity);
event KYCStatusUpdated(address indexed account, bool status, uint256 timestamp);
event TransferRestricted(address indexed from, address indexed to, uint256 amount, string reason);
event SuspiciousActivity(address indexed account, string activityType, uint256 timestamp);
```

**Operational Events**:
```solidity
event InterestPaymentDue(uint256 amount, uint256 paymentDate);
event InterestPaid(address indexed recipient, uint256 amount, uint256 timestamp);
event LargeTransfer(address indexed from, address indexed to, uint256 amount);
event BondMatured(uint256 totalSupply, uint256 maturityDate);
event EmergencyActionTaken(string action, address indexed initiator, string reason);
```

**Audit Events**:
```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
event ContractUpgraded(address indexed implementation, uint256 version);
```

#### 4. Business Logic Functions

**KYC/Compliance Management**:
```solidity
function updateKYCStatus(address account, bool status) external onlyRole(COMPLIANCE_ROLE);
function checkCompliance(address from, address to, uint256 amount) internal returns (bool);
function reportSuspiciousActivity(address account, string memory reason) external onlyRole(COMPLIANCE_ROLE);
```

**Interest Management**:
```solidity
function scheduleInterestPayment(uint256 amount, uint256 paymentDate) external onlyRole(INTEREST_PAYER_ROLE);
function distributeInterest(address[] memory recipients, uint256[] memory amounts) external onlyRole(INTEREST_PAYER_ROLE);
function accrueInterest() external;
```

**Transfer Restrictions**:
```solidity
function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
    // Check KYC status
    require(kycStatus[from] && kycStatus[to], "KYC required");
    
    // Check for large transfers (>10% of supply)
    if (amount > totalSupply() / 10) {
        emit LargeTransfer(from, to, amount);
    }
    
    // Check concentration limits
    require(balanceOf(to) + amount <= maxHoldingAmount, "Exceeds holding limit");
    
    // Additional compliance checks
    require(checkCompliance(from, to, amount), "Compliance check failed");
}
```

**Emergency Functions**:
```solidity
function emergencyPause(string memory reason) external onlyRole(ADMIN_ROLE);
function emergencyUnpause(string memory reason) external onlyRole(ADMIN_ROLE);
function freezeAccount(address account, string memory reason) external onlyRole(COMPLIANCE_ROLE);
function unfreezeAccount(address account, string memory reason) external onlyRole(COMPLIANCE_ROLE);
```

#### 5. State Variables

```solidity
mapping(address => bool) public kycStatus;
mapping(address => bool) public frozenAccounts;
mapping(address => uint256) public lastTransferTimestamp;
mapping(address => uint256) public accruedInterest;

uint256 public maxHoldingAmount;
uint256 public minTransferAmount;
uint256 public interestRate;
uint256 public lastInterestAccrual;
uint256 public maturityDate;
uint256 public issuanceDate;

struct InterestPayment {
    uint256 amount;
    uint256 scheduledDate;
    bool paid;
}
InterestPayment[] public interestSchedule;
```

#### 6. Monitor Integration Points

The contract should be optimized for monitoring with:
- Rich event emissions with indexed parameters
- Severity levels in compliance events
- Timestamps in critical events
- Clear reason strings for automated parsing
- Structured data that can be easily filtered

#### 7. Relayer Integration Points

Functions designed for automated execution:
- Batch operations for efficiency
- Clear role separation for secure automation
- Gas-optimized for automated transactions
- Return values suitable for plugin processing

### Additional Specifications

1. **Initial Supply**: No premint - bonds are minted when issued
2. **Decimals**: 18 (standard ERC-20)
3. **Network**: Ethereum Mainnet (with Sepolia testnet deployment first)
4. **Votes**: Not needed for bonds

### Security Considerations

1. All administrative functions must emit events
2. Multi-role approval for critical operations
3. Time delays for sensitive changes
4. Rate limiting on transfers
5. Reentrancy protection on all external calls

### Documentation Requirements

Generate comprehensive NatSpec comments for:
- All public and external functions
- All events with parameter descriptions
- All custom errors with explanations
- Contract-level documentation explaining the bond token purpose

### Testing Considerations

The contract should include:
- Comprehensive event emissions for testing
- View functions for monitoring state
- Clear error messages for debugging
- Deterministic behavior for automated testing

### Integration Requirements

The contract must work seamlessly with:
- OpenZeppelin Monitor for event detection
- OpenZeppelin Relayer for automated transactions
- Standard ERC-20 infrastructure
- Block explorers and wallets
- DeFi protocols (with restrictions)

Please generate a production-ready contract that demonstrates enterprise-grade security and operational excellence for JP Morgan's tokenized bond platform.