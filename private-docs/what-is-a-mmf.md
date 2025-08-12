# What is a Money Market Fund (MMF)?

A Money Market Fund is essentially a super-safe savings account that invests in short-term, high-quality debt instruments.

## How MMFs Work

1. **You Pool Money**: When you invest in an MMF, your money is pooled with other investors' money into a large fund.

2. **Fund Buys Safe Assets**: The fund manager uses this pool to buy very safe, short-term investments like:
   - US Treasury bills (loans to the US government for <1 year)
   - Commercial paper (short-term corporate IOUs from companies like Apple or Microsoft)
   - Repurchase agreements (overnight loans backed by government securities)
   - Bank certificates of deposit

3. **$1.00 Stable Value**: MMFs try to maintain a Net Asset Value (the price per share) of exactly $1.00 per share. This means:
   - You put in $1,000, you get 1,000 shares
   - You can redeem 1,000 shares for $1,000 (plus any interest earned)
   - The value shouldn't fluctuate like stocks or regular bonds

4. **Daily Interest**: You earn interest every day, which either:
   - Gets paid out to you monthly
   - Automatically buys you more shares (compounds)

## Why Do People Use MMFs?

- **Safety**: Investing in government debt and top-rated corporate debt
- **Liquidity**: Get your money back any business day (T+1 settlement traditionally)
- **Better than Bank**: Usually higher yield than savings accounts
- **Stable Value**: No price fluctuations to worry about

## Types of MMFs

1. **Government MMFs**: Only invests in US Treasuries and government-backed securities (safest)
2. **Prime MMFs**: Can invest in corporate debt too (slightly higher yield, tiny bit more risk)
3. **Tax-Exempt MMFs**: Invests in municipal bonds (tax advantages)

## What Makes MMFs So Safe?

### Securities and Exchange Commission (SEC) Rule 2a-7 Requirements:
- **Weighted Average Maturity**: ≤ 60 days (can't buy long-term risky stuff)
- **Weighted Average Life**: ≤ 120 days
- **Daily Liquidity**: 10% of assets must be cashable same day
- **Weekly Liquidity**: 30% must be cashable within a week
- **Credit Quality**: Only top-rated securities allowed

## The "Breaking the Buck" Fear

MMFs are supposed to always be worth $1.00. If it drops below $1.00, it "breaks the buck" - this is catastrophic:
- **2008 Reserve Primary Fund**: Held Lehman Brothers debt, dropped to $0.97, caused panic
- **Result**: Massive redemptions, government had to guarantee MMFs temporarily

---

# On-Chain MMF: The Blockchain Version

## What Changes with Tokenization?

### Traditional MMF
- **Settlement**: T+1 (trade today, get money tomorrow)
- **Hours**: 9 AM - 4 PM weekdays only
- **Access**: Need brokerage account
- **Transparency**: See holdings monthly
- **Costs**: Management fees, wire fees

### Tokenized On-Chain MMF
- **Settlement**: Instant (T+0)
- **Hours**: 24/7/365
- **Access**: Just need a wallet address
- **Transparency**: See holdings real-time on blockchain
- **Costs**: Gas fees + management fees

## How Does an On-Chain MMF Work?

1. **Smart Contract as Fund**:
   ```
   MMF Token Contract = The Fund
   Your tokens = Your shares
   Contract's assets = The portfolio
   ```

2. **Investment Flow**:
   ```
   You send USDC → Smart Contract mints MMF tokens → Your wallet receives tokens
   ```

3. **Net Asset Value Calculation On-Chain**:
   ```solidity
   Net Asset Value = (Total Portfolio Value) / (Total Tokens Outstanding)
   // Should always equal $1.00
   ```

4. **Redemption**:
   ```
   You burn MMF tokens → Contract sends you USDC
   ```

## The Oracle Challenge for On-Chain MMFs

### Why Oracles Matter
The smart contract needs to know the current value of:
- Treasury bills (off-chain asset)
- Commercial paper (off-chain asset)
- Repo agreements (off-chain asset)

### The Problem
- Blockchain can't read Bloomberg or Reuters
- Need "oracles" to bring real-world prices on-chain
- Wrong price = wrong Net Asset Value = regulatory disaster

### The Solution (What We're Proposing)
- Multiple oracles (Chainlink, API3, Chronicle)
- Cross-validation (must agree within 2%)
- Circuit breakers (pause if prices suspicious)

## Benefits of On-Chain MMFs

1. **Global Access**: Anyone, anywhere can invest (with KYC)
2. **Instant Liquidity**: No waiting for settlement
3. **Programmable**: Can be used as collateral in DeFi
4. **Transparent**: Every transaction on-chain
5. **Fractional**: Can own $1 instead of $1,000 minimum

## Risks Unique to On-Chain MMFs

1. **Smart Contract Risk**: Code bugs could lock funds
2. **Oracle Risk**: Bad price data affects Net Asset Value
3. **Gas Costs**: Ethereum fees might exceed interest on small amounts
4. **Regulatory Uncertainty**: SEC still figuring out crypto rules

## Real Examples

### Traditional Money Market Funds
- **Vanguard Federal Money Market Fund**: $260B Assets Under Management, yields ~5%
- **Fidelity Government Money Market**: $280B Assets Under Management
- **JPMorgan US Government MMF**: $150B Assets Under Management

### Tokenized Money Market Funds (Emerging)
- **Franklin Templeton's FOBXX**: First tokenized MMF on Stellar/Polygon
- **Ondo Finance's OUSG**: Tokenized treasuries
- **Backed Finance's bIBTA**: Tokenized treasury ETF

## The Bottom Line

A Money Market Fund is like a checking account that earns interest by investing in super-safe, short-term loans. 

An on-chain Money Market Fund does the same thing, but:
- Lives on the blockchain
- Operates 24/7
- Settles instantly
- Needs oracles to know real-world prices
- Can interact with other blockchain applications

Think of it as taking the most boring, safe investment product (Money Market Fund) and making it work with the most exciting, risky technology (blockchain) - the challenge is keeping it boring and safe!