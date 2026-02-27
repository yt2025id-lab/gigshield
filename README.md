# GigShield — Decentralized Micro-Insurance for the Gig Economy

> Built for Solana Graveyard Hack 2026 — Resurrecting Insurance on Solana

## The Problem

The gig economy employs over **2 billion workers globally**, yet the vast majority have **zero insurance coverage**. Traditional insurance is designed for full-time employment — with monthly premiums, lengthy claims, and opaque processes. Gig workers (drivers, couriers, freelancers, construction workers) are left completely exposed to:

- Accidents during deliveries or rides
- Non-payment by clients
- Equipment damage or theft
- Health emergencies with no safety net

**Insurance is a dead category on Solana.** No protocol has successfully brought micro-insurance on-chain — until now.

## The Solution

**GigShield** is a decentralized micro-insurance protocol built natively on Solana that enables:

- **Pay-per-gig coverage** — premiums as low as 0.001 SOL per gig
- **Instant policy activation** — coverage starts the moment you pay
- **Decentralized claim validation** — staked validators vote on claims using a 2/3 majority consensus
- **Automatic payouts** — approved claims are paid out directly from the pool vault, no intermediaries
- **Multi-category pools** — RideShare, Delivery, Freelance, Construction, Healthcare

## Architecture

```
┌──────────────────────────────────────────┐
│           Frontend (Next.js 14)          │
│    Wallet Connect · Pool Dashboard       │
│    Claim Submission · Validator Panel     │
└─────────────────┬────────────────────────┘
                  │
┌─────────────────▼────────────────────────┐
│        Solana Program (Anchor 0.30)      │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │ Pool Module   │  │  Claim Module    │  │
│  │ • create_pool │  │  • submit_claim  │  │
│  │ • deposit     │  │  • vote_claim    │  │
│  │ • policies    │  │  • withdraw      │  │
│  └──────┬───────┘  └───────┬──────────┘  │
│  ┌──────▼──────────────────▼──────────┐  │
│  │     Validator Network Module       │  │
│  │  • register  • stake  • reputation │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | **Solana** (Devnet) |
| Smart Contract | **Anchor Framework** 0.30.1 (Rust) |
| Frontend | **Next.js** 14, React 18, TypeScript |
| Wallet | **Solana Wallet Adapter** (Phantom, Solflare) |
| Styling | **Tailwind CSS** 3.4 |
| Deployment | **Vercel** (Frontend), **Solana Devnet** (Program) |

## Key Features

### For Gig Workers
- Browse insurance pools by category (RideShare, Delivery, Freelance, etc.)
- Pay micro-premiums (0.001+ SOL) for per-gig coverage
- Submit claims with evidence hashes stored on-chain
- Receive automatic payouts when claims are approved

### For Validators
- Stake minimum 1 SOL to register as a validator
- Vote on claims (approve/reject) with on-chain accountability
- Build reputation score based on voting accuracy
- Earn rewards for honest participation

### Protocol Mechanics
- **2/3 Majority Consensus**: Claims require supermajority validator approval
- **PDA-based Vaults**: Pool funds secured by program-derived addresses
- **Event Emissions**: All key actions emit on-chain events for indexing
- **Comprehensive Error Handling**: 13 custom error codes for security

## Smart Contract Instructions

| Instruction | Description |
|-------------|-------------|
| `create_pool` | Create an insurance pool for a gig category |
| `deposit_premium` | Worker pays premium to activate coverage |
| `submit_claim` | Worker submits an insurance claim with evidence |
| `vote_claim` | Validator votes to approve or reject a claim |
| `withdraw_payout` | Worker withdraws approved claim payout |
| `register_validator` | Register as a staked claim validator |

## How to Run Locally

### Prerequisites
- Rust & Cargo
- Solana CLI (v1.17+)
- Anchor CLI (v0.30+)
- Node.js (v18+)

### Smart Contract
```bash
git clone https://github.com/YOUR_USERNAME/gigshield.git
cd gigshield

# Build the program
anchor build

# Deploy to devnet
solana config set --url devnet
anchor deploy --provider.cluster devnet
```

### Frontend
```bash
cd app
npm install
npm run dev
# Open http://localhost:3000
```

## Screenshots

| Landing Page | Insurance Pools | Claim Submission |
|:---:|:---:|:---:|
| ![Landing](./screenshots/landing.png) | ![Pools](./screenshots/pools.png) | ![Claims](./screenshots/claims.png) |

| Validator Panel | Wallet Connected |
|:---:|:---:|
| ![Validators](./screenshots/validators.png) | ![Wallet](./screenshots/wallet.png) |

## Roadmap

- **Phase 1**: Mainnet deployment + security audit
- **Phase 2**: Oracle-based dynamic pricing + USDC support
- **Phase 3**: Mobile PWA + gig platform partnerships
- **Phase 4**: Protocol SDK + governance token launch

## Built on Solana

GigShield leverages Solana's unique advantages:
- **Sub-second finality** for instant policy activation
- **Near-zero transaction costs** making micro-premiums viable
- **Program Derived Addresses (PDAs)** for trustless fund custody
- **Anchor Framework** for secure, auditable smart contracts

## License

MIT

---

**Built for Solana Graveyard Hack 2026**
