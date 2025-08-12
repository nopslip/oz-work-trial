# MMF Security Architecture - Detailed Technical Diagram

## Complete System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL DATA SOURCES                              │
├────────────────┬─────────────────┬──────────────────┬────────────────────┤
│   Chainlink    │      API3       │    Chronicle     │   Proof of Reserve │
│  Price Feeds   │  Money Market   │  Crypto Prices   │    Attestation     │
│                │     Rates       │                  │                    │
│ • US Treasury  │ • SOFR/LIBOR    │ • BTC/ETH       │ • Custodian API    │
│ • EUR Bonds    │ • Fed Funds     │ • Stablecoins   │ • Bank Statements  │
│ • Corp Bonds   │ • Repo Rates    │ • Forex         │ • Audit Reports    │
└───────┬────────┴────────┬────────┴────────┬─────────┴─────────┬──────────┘
        │                 │                 │                   │
        ▼                 ▼                 ▼                   ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        ORACLE AGGREGATOR LAYER                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Oracle Validation Contract                        │  │
│  │                                                                      │  │
│  │  • getPriceWithValidation()  - Returns validated price              │  │
│  │  • checkOracleHealth()       - Monitor oracle status                │  │
│  │  • emergencyPause()          - Circuit breaker                      │  │
│  │  • updateThresholds()        - Adjust deviation limits              │  │
│  │                                                                      │  │
│  │  Validation Logic:                                                   │  │
│  │  1. Fetch prices from all oracles                                   │  │
│  │  2. Check staleness (< 3600 seconds)                               │  │
│  │  3. Calculate standard deviation                                    │  │
│  │  4. Reject outliers (> 2σ)                                         │  │
│  │  5. Return weighted average                                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬───────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────────────┐
        ▼                    ▼                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         SMART CONTRACT LAYER                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    MMF Token Contract (ERC-20)                     │  │
│  │                                                                     │  │
│  │  Core Functions:                                                    │  │
│  │  • mint(user, amount)         - Issue new shares                   │  │
│  │  • burn(user, amount)         - Redeem shares                      │  │
│  │  • calculateNAV()             - Real-time NAV calculation          │  │
│  │  • distributeYield()          - Daily interest distribution        │  │
│  │                                                                     │  │
│  │  Access Control:                                                    │  │
│  │  • MINTER_ROLE      → Subscription processor                       │  │
│  │  • REDEEMER_ROLE    → Redemption processor                        │  │
│  │  • TREASURER_ROLE   → Yield distributor                           │  │
│  │  • PAUSER_ROLE      → Emergency response                          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    Portfolio Management Contract                    │  │
│  │                                                                     │  │
│  │  • allocateToTreasuries(amount)  - Buy T-bills                    │  │
│  │  • allocateToRepos(amount)       - Overnight repos                │  │
│  │  • rebalancePortfolio()          - Maintain target allocation     │  │
│  │  • calculateWAM()                - Weighted Average Maturity      │  │
│  │  • calculateWAL()                - Weighted Average Life          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    Compliance & Control Contract                    │  │
│  │                                                                     │  │
│  │  • enforceInvestorLimits()     - Max investment caps              │  │
│  │  • checkAccreditation()        - Verify investor status            │  │
│  │  • freezeAccount()             - Regulatory freeze                 │  │
│  │  • generateReports()           - SEC reporting                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────────────┐
        ▼                    ▼                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     OPENZEPPELIN MONITOR (24/7)                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Event Detection:                     Threshold Monitoring:              │
│  • OracleUpdate                      • NAV deviation > $0.0005          │
│  • LargeRedemption                   • Oracle spread > 2%               │
│  • ComplianceViolation               • Gas price > 500 gwei             │
│  • YieldDistribution                 • Liquidity < 10%                  │
│  • PortfolioRebalance                • Concentration > 25%              │
│                                                                           │
│  Alert Channels:                                                         │
│  ┌──────────────┬────────────────┬─────────────────┬────────────────┐  │
│  │   Webhook    │     Email      │    PagerDuty    │     Slack      │  │
│  │              │                │                 │                │  │
│  │ → Relayer    │ → Compliance   │ → Operations    │ → Trading Desk │  │
│  └──────────────┴────────────────┴─────────────────┴────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     OPENZEPPELIN RELAYER                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Automated Actions:                                                       │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Daily Operations:                                                 │  │
│  │  • 09:00 UTC - Calculate and update NAV                           │  │
│  │  • 10:00 UTC - Distribute daily yield                             │  │
│  │  • 14:00 UTC - Process redemption queue                           │  │
│  │  • 16:00 UTC - Rebalance portfolio if needed                      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Emergency Response:                                               │  │
│  │  • Oracle failure     → Pause NAV updates                         │  │
│  │  • Liquidity crisis   → Implement gates                           │  │
│  │  • Compliance issue   → Freeze accounts                           │  │
│  │  • Market crash       → Activate circuit breakers                 │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  Key Management:                                                          │
│  • AWS KMS for production keys                                           │
│  • Multi-sig for admin functions                                         │
│  • Hardware wallet for treasury operations                               │
└──────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequences

### 1. Subscription Flow (User Buys MMF Shares)
```
User → Web Interface → MMF Contract → Oracle Aggregator → Calculate NAV
                           ↓
                    Mint Tokens @ NAV
                           ↓
                    Update Portfolio
                           ↓
                    Monitor Logs Event
                           ↓
                    Compliance Check
```

### 2. Redemption Flow (User Sells MMF Shares)
```
User Request → Check Liquidity → Queue if Needed → Process Redemption
                                        ↓
                              Calculate Current NAV
                                        ↓
                              Burn Tokens & Send Funds
                                        ↓
                              Monitor Logs & Reports
```

### 3. Oracle Failure Response
```
Oracle Timeout/Error → Monitor Detects → Alert Triggered
                              ↓
                    Relayer Receives Webhook
                              ↓
                    Pause NAV Updates
                              ↓
                    Switch to Backup Oracle
                              ↓
                    Resume Operations
```

## Security Layers

### Layer 1: Smart Contract Security
- Role-based access control (OpenZeppelin AccessControl)
- Pausable operations (OpenZeppelin Pausable)
- Reentrancy guards
- Integer overflow protection

### Layer 2: Oracle Security
- Multiple independent oracles
- Cross-validation logic
- Staleness checks
- Circuit breakers

### Layer 3: Operational Security
- 24/7 monitoring via OpenZeppelin Monitor
- Automated responses via Relayer
- Multi-signature admin functions
- Time-locked upgrades

### Layer 4: Compliance & Regulatory
- KYC/AML integration
- Investment limits enforcement
- Automated SEC reporting
- Audit trails on-chain

## Integration Points

### External Systems
1. **Banking Partners**
   - Custody accounts for underlying assets
   - Wire transfer integration for subscriptions/redemptions
   - Account verification APIs

2. **Regulatory Reporting**
   - SEC EDGAR integration
   - Daily NAV reporting
   - Portfolio composition updates
   - Form N-MFP filing

3. **Trading Systems**
   - Treasury Direct for T-bill purchases
   - Repo market access
   - Commercial paper platforms

### Internal Systems
1. **Risk Management**
   - VAR calculations
   - Stress testing models
   - Liquidity forecasting

2. **Operations**
   - Customer service dashboard
   - Portfolio management interface
   - Compliance monitoring tools

3. **Finance**
   - Accounting system integration
   - Fee calculation and collection
   - Yield distribution tracking