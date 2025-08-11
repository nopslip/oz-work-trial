# Money Market Fund Architecture Diagram Specification

## ASCII Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ACME BANK MMF PLATFORM                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────── USER LAYER ────────────────────────────┐  │
│  │                                                                     │  │
│  │  [Institutional]  [Retail]  [Treasury]  [Compliance]  [Auditors]   │  │
│  │       Users       Investors    Team        Team         Team       │  │
│  │         ↓             ↓          ↓           ↓            ↓        │  │
│  └─────────────────────────────────┬──────────────────────────────────┘  │
│                                     │                                     │
│  ┌──────────────────────── INTERFACE LAYER ───────────────────────────┐  │
│  │                                                                     │  │
│  │    [Web Portal]  [Mobile App]  [API Gateway]  [Admin Dashboard]    │  │
│  │         ↓             ↓             ↓               ↓              │  │
│  └─────────────────────────────────┬──────────────────────────────────┘  │
│                                     │                                     │
│  ┌─────────────────────── SMART CONTRACT LAYER ───────────────────────┐  │
│  │                                                                     │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │  │
│  │  │   MMF Token     │  │    Portfolio     │  │   Compliance    │  │  │
│  │  │   (ERC-4626)    │←→│   Management     │←→│    Registry     │  │  │
│  │  │                 │  │                  │  │                 │  │  │
│  │  │ • Mint/Redeem   │  │ • Asset Tracking │  │ • KYC/AML       │  │  │
│  │  │ • Share Price   │  │ • Rebalancing    │  │ • Freeze/Thaw   │  │  │
│  │  │ • Yield Accrual │  │ • Allocations    │  │ • Limits        │  │  │
│  │  └────────┬────────┘  └────────┬─────────┘  └────────┬────────┘  │  │
│  │           │                     │                      │           │  │
│  │           └─────────────────────┼──────────────────────┘           │  │
│  │                                 │                                  │  │
│  │  ┌──────────────────────────────┼──────────────────────────────┐  │  │
│  │  │                     NAV CALCULATOR                           │  │  │
│  │  │                         (Core Logic)                         │  │  │
│  │  └──────────────────────────────┬──────────────────────────────┘  │  │
│  └─────────────────────────────────┼──────────────────────────────────┘  │
│                                     │                                     │
│  ┌──────────────────────── ORACLE LAYER ──────────────────────────────┐  │
│  │                                                                     │  │
│  │   ┌───────────────────────────────────────────────────────────┐    │  │
│  │   │                 MULTI-ORACLE AGGREGATOR                   │    │  │
│  │   │                                                           │    │  │
│  │   │  [Chainlink 70%]    [API3 20%]    [Band 10%]            │    │  │
│  │   │        ↓                ↓             ↓                  │    │  │
│  │   │  • Treasury Rates  • Direct Feeds  • Backup Prices      │    │  │
│  │   │  • SOFR/Fed Funds  • Custody Data  • Cross-chain        │    │  │
│  │   │  • CP Rates        • Risk Metrics  • Fast Updates       │    │  │
│  │   │                                                          │    │  │
│  │   │            [Deviation Checker & Circuit Breaker]         │    │  │
│  │   └───────────────────────────┬──────────────────────────────┘    │  │
│  └───────────────────────────────┼────────────────────────────────────┘  │
│                                   │                                       │
│  ┌────────────────────── MONITORING LAYER ────────────────────────────┐  │
│  │                                                                     │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │              OpenZeppelin Monitor (OSS Tooling)              │  │  │
│  │  ├─────────────────────────────────────────────────────────────┤  │  │
│  │  │                                                               │  │  │
│  │  │  Compliance Monitor    Risk Monitor    Operational Monitor   │  │  │
│  │  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │  │  │
│  │  │  │ • KYC Status │   │ • Liquidity  │   │ • NAV Updates │   │  │  │
│  │  │  │ • Limits     │   │ • Volatility │   │ • Gas Prices  │   │  │  │
│  │  │  │ • Sanctions  │   │ • Deviation  │   │ • Failures    │   │  │  │
│  │  │  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   │  │  │
│  │  │         │                   │                   │           │  │  │
│  │  │         └───────────────────┼───────────────────┘           │  │  │
│  │  │                             │                               │  │  │
│  │  │                    [Webhook Triggers]                       │  │  │
│  │  └─────────────────────────────┬───────────────────────────────┘  │  │
│  └─────────────────────────────────┼──────────────────────────────────┘  │
│                                     │                                     │
│  ┌──────────────────────── EXECUTION LAYER ───────────────────────────┐  │
│  │                                                                     │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │              OpenZeppelin Relayer (OSS Tooling)              │  │  │
│  │  ├─────────────────────────────────────────────────────────────┤  │  │
│  │  │                                                               │  │  │
│  │  │   NAV Updates     Rebalancing    Emergency      Reporting    │  │  │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐│  │  │
│  │  │  │ Every 15m │  │ Daily     │  │ Pause     │  │ Regulatory││  │  │
│  │  │  │ Auto calc │  │ Execution │  │ Freeze    │  │ Filings   ││  │  │
│  │  │  │ Gas opt   │  │ Slippage  │  │ Circuit   │  │ Audit logs││  │  │
│  │  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘│  │  │
│  │  └───────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────── INTEGRATION LAYER ─────────────────────────┐  │
│  │                                                                     │  │
│  │   Traditional Systems              DeFi Protocols                  │  │
│  │  ┌──────────────────┐           ┌──────────────────┐             │  │
│  │  │ • Core Banking   │           │ • Uniswap V3    │             │  │
│  │  │ • Custody        │           │ • Aave          │             │  │
│  │  │ • SWIFT          │           │ • Compound      │             │  │
│  │  │ • Regulatory API │           │ • Curve         │             │  │
│  │  └──────────────────┘           └──────────────────┘             │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
                        SUBSCRIPTION & REDEMPTION FLOW
┌──────────┐
│ Investor │
└────┬─────┘
     │ 1. Subscribe/Redeem Request
     ↓
┌──────────────┐     2. KYC Check      ┌─────────────────┐
│ Web Interface├───────────────────────→│ Compliance      │
└──────┬───────┘                       │ Registry        │
       │                               └────────┬────────┘
       │ 3. If Approved                        │
       ↓                                        │
┌──────────────┐     4. Check NAV     ┌────────▼────────┐
│ MMF Token    ├───────────────────────→│ NAV Calculator  │
│ Contract     │                       └────────┬────────┘
└──────┬───────┘                               │
       │                               ┌────────▼────────┐
       │ 5. Get Prices                │ Oracle          │
       │                              │ Aggregator      │
       │                              └────────┬────────┘
       │                                       │
       │ 6. Calculate Shares                  │
       ↓                                       │
┌──────────────┐                              │
│ Mint/Burn    │←──────────────────────────────┘
│ Shares       │
└──────┬───────┘
       │ 7. Update Portfolio
       ↓
┌──────────────┐     8. Monitor       ┌─────────────────┐
│ Portfolio    ├───────────────────────→│ OZ Monitor      │
│ Management   │                       └────────┬────────┘
└──────┬───────┘                               │
       │                               ┌────────▼────────┐
       │ 9. If Rebalance Needed       │ OZ Relayer      │
       │                              │ (Execute Trade)  │
       │                              └─────────────────┘
       │ 10. Confirmation
       ↓
┌──────────────┐
│ Investor     │
│ Dashboard    │
└──────────────┘
```

## Security Zone Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PUBLIC ZONE (DMZ)                        │
│  • Web Portal                                               │
│  • Mobile Apps                                              │
│  • Public APIs                                              │
└──────────────────────────┬──────────────────────────────────┘
                          │ [WAF + DDoS Protection]
┌──────────────────────────┼──────────────────────────────────┐
│                   APPLICATION ZONE                           │
│  • API Gateway (Rate Limiting)                              │
│  • Business Logic Services                                  │
│  • Cache Layer                                              │
└──────────────────────────┬──────────────────────────────────┘
                          │ [Firewall + IDS]
┌──────────────────────────┼──────────────────────────────────┐
│                    BLOCKCHAIN ZONE                           │
│  • Smart Contracts (Ethereum Mainnet)                       │
│  • OpenZeppelin Monitor                                     │
│  • OpenZeppelin Relayer                                     │
│  • RPC Endpoints (Google Cloud)                             │
└──────────────────────────┬──────────────────────────────────┘
                          │ [VPN + Encryption]
┌──────────────────────────┼──────────────────────────────────┐
│                     SECURE ZONE                              │
│  • Private Keys (HSM)                                       │
│  • Admin Functions                                          │
│  • Backup Systems                                           │
│  • Audit Logs                                               │
└──────────────────────────────────────────────────────────────┘
```

## Oracle Deviation Detection Flow

```
                  ORACLE PRICE AGGREGATION
    
    Chainlink          API3            Band Protocol
       │                │                    │
       │ $1.0001       │ $1.0002           │ $1.0003
       └────────────────┼────────────────────┘
                       │
                ┌──────▼──────┐
                │  Deviation  │
                │   Checker   │
                └──────┬──────┘
                       │
            Max Deviation < 2%?
                    /     \
                  Yes      No
                  /         \
        ┌────────▼───┐   ┌───▼──────────┐
        │  Calculate │   │    PAUSE     │
        │  Weighted  │   │  Trading &   │
        │   Average  │   │ Alert Team   │
        └────────┬───┘   └──────────────┘
                 │
         NAV = $1.00017
                 │
        ┌────────▼────────┐
        │  Update MMF     │
        │  Share Price    │
        └─────────────────┘
```

## Liquidity Management Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   LIQUIDITY POOLS                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   PRIMARY   │  │  SECONDARY  │  │  EMERGENCY  │     │
│  │    (40%)    │  │    (50%)    │  │    (10%)    │     │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤     │
│  │ • T-Bills   │  │ • Corp Bonds│  │ • USDC      │     │
│  │ • Overnight │  │ • CP        │  │ • DAI       │     │
│  │ • Repo      │  │ • Time Dep  │  │ • Cash      │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                 │                 │            │
│         └─────────────────┼─────────────────┘            │
│                           │                              │
│                   ┌───────▼────────┐                     │
│                   │   Liquidity    │                     │
│                   │    Monitor     │                     │
│                   └───────┬────────┘                     │
│                           │                              │
│              Redemption Pressure > 5%?                   │
│                        /     \                           │
│                      No       Yes                        │
│                      │         │                         │
│                 Normal Op  ┌───▼────────┐               │
│                           │  Activate   │               │
│                           │  Emergency  │               │
│                           │  Liquidity  │               │
│                           └─────────────┘               │
└──────────────────────────────────────────────────────────┘
```