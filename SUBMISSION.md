# GigShield — Graveyard Hack 2026 Submission (Solana Foundation)

---

## 1. PROJECT NAME

**GigShield** — Decentralized Micro-Insurance Protocol for Gig Workers

---

## 2. ONE-LINE DESCRIPTION

GigShield brings trustless, pay-per-gig micro-insurance to 2 billion gig workers worldwide — powered by Solana's speed, SHA-256 evidence verification, a 5% protocol treasury, and a decentralized validator network that makes insurance claims transparent, instant, and fair.

---

## 3. LINKS

| | |
|---|---|
| **Live App** | https://gigshield.vercel.app |
| **GitHub** | https://github.com/yt2025id-lab/gigshield |
| **Program ID** | `4oYtnLRhL2mRfzfXpM7CaC8WUZeAnEdHcAkyDPsmyDYV` |
| **Explorer** | https://explorer.solana.com/address/4oYtnLRhL2mRfzfXpM7CaC8WUZeAnEdHcAkyDPsmyDYV?cluster=devnet |
| **Network** | Solana Devnet |

---

## 4. GITHUB README

```markdown
# GigShield — Decentralized Micro-Insurance for the Gig Economy

> 🏆 Built for Solana Graveyard Hack 2026 — Resurrecting Insurance on Solana

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
- **SHA-256 evidence verification** — claim evidence is hashed and anchored on-chain, tamper-proof
- **Decentralized claim validation** — staked validators vote on claims using a 2/3 majority consensus
- **Automatic payouts** — approved claims pay 95% to worker; 5% to protocol treasury
- **48-hour voting window** — real-time countdown and vote progress bar for full transparency
- **Multi-category pools** — RideShare, Delivery, Freelance, Construction, Healthcare

## Architecture

```
┌──────────────────────────────────────────────────┐
│             Frontend (Next.js 14)                │
│  Pools · Claims · Validator · 📊 Stats/Leaderboard│
│  SHA-256 Evidence · Countdown Timer · Fee Display │
└─────────────────┬────────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────────┐
│          Solana Program (Anchor 0.30)            │
│  ┌─────────────────┐  ┌──────────────────────┐   │
│  │   Pool Module   │  │    Claim Module       │   │
│  │ • create_pool   │  │ • submit_claim        │   │
│  │ • deposit_prem. │  │ • vote_claim (48h)    │   │
│  │ • pool_vault PDA│  │ • withdraw_payout     │   │
│  └────────┬────────┘  │ • resolve_expired     │   │
│           │           └──────────┬────────────┘   │
│  ┌────────▼──────────────────────▼────────────┐   │
│  │          Validator Network Module          │   │
│  │  • register_validator  • unstake_validator │   │
│  │  • 1 SOL min stake     • 24h cooldown      │   │
│  │  • +5 reputation/claim • 2/3 consensus     │   │
│  └────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────┐   │
│  │         Protocol Treasury (PDA)            │   │
│  │     5% fee on every approved payout        │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
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
- Submit claims with SHA-256 evidence fingerprint stored on-chain
- See real-time vote progress (●●○) and countdown timer on each claim
- Receive automatic payouts (95% of approved claim, 5% to protocol treasury)

### For Validators
- Stake minimum 1 SOL to register as a validator
- View claim evidence before voting (approve/reject within 48h)
- Build reputation score (+5 per consensus vote)
- 24-hour cooldown enforced on unstaking (anti-flash-loan protection)

### Protocol Mechanics
- **2/3 Majority Consensus**: Claims require supermajority validator approval
- **48-hour Voting Deadline**: Enforced on-chain; expired claims auto-resolvable
- **10× Premium Cap**: Max claim = 10× total premiums paid (anti-fraud)
- **5% Protocol Fee**: Collected from each approved payout into treasury PDA
- **PDA-based Vaults**: Pool funds and validator stakes secured by PDAs
- **SHA-256 Evidence**: Claim descriptions hashed client-side; fingerprint anchored on-chain
- **Event Emissions**: All key actions emit on-chain events for indexing
- **8 Custom Instructions** + 13 custom error codes

## Smart Contract Instructions

| Instruction | Description |
|---|---|
| `create_pool` | Create an insurance pool for a gig category |
| `deposit_premium` | Worker deposits premium to get coverage |
| `submit_claim` | Worker submits claim with SHA-256 evidence hash |
| `vote_claim` | Validator votes approve/reject within 48h window |
| `withdraw_payout` | Worker withdraws 95% payout after approval |
| `register_validator` | Stake SOL to become a validator node |
| `unstake_validator` | Withdraw stake after 24h cooldown |
| `resolve_expired_claim` | Resolve claims past the 48h voting deadline |

## Integration Tests

**10/10 tests passing** on Solana Devnet:

1. ✅ Creates an insurance pool
2. ✅ Rejects pool creation with invalid premium rate (0)
3. ✅ Worker deposits premium and creates policy
4. ✅ Registers three validators with 1 SOL stake each
5. ✅ Worker submits an insurance claim
6. ✅ Rejects claim exceeding 10× premium cap
7. ✅ Three validators approve claim, reaching 2/3 consensus
8. ✅ Rejects double-voting from same validator
9. ✅ Worker withdraws payout (95%) with 5% fee to treasury
10. ✅ Rejects unstake before 24h cooldown

## How to Run Locally

### Prerequisites
- Rust & Cargo
- Solana CLI (v1.17+)
- Anchor CLI (v0.30+)
- Node.js (v18+)

### Smart Contract
```bash
git clone https://github.com/yt2025id-lab/gigshield.git
cd gigshield

# Build (requires platform-tools v1.53 for edition2024 support)
anchor build --no-idl -- --tools-version v1.53

# Deploy to devnet
solana config set --url devnet
anchor deploy --provider.cluster devnet
```

### Run Tests
```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
npm test
```

### Frontend
```bash
cd app
npm install
npm run dev
# Open http://localhost:3000
```

## Built on Solana

GigShield leverages Solana's unique advantages:
- **Sub-second finality** for instant policy activation
- **Near-zero transaction costs** making micro-premiums economically viable
- **Program Derived Addresses (PDAs)** for trustless fund custody
- **Anchor Framework** for secure, auditable smart contracts

## License

MIT

---

**Built with ❤️ for Solana Graveyard Hack 2026**
```

---

## 5. DEMO VIDEO SCRIPT (2-3 Minutes)

### Scene 1: Opening Hook (0:00 — 0:20)
**On screen:** Statistics overlay — "2 billion gig workers. Zero insurance."
**Narration:**
> "Two billion people work in the gig economy — driving, delivering, freelancing. And almost none of them have insurance. Traditional insurance wasn't built for them. Today, we're changing that. Meet GigShield — decentralized micro-insurance on Solana."

### Scene 2: The Problem (0:20 — 0:40)
**On screen:** Split screen — traditional insurance form vs. GigShield UI
**Narration:**
> "Traditional insurance means monthly commitments, paperwork, and opaque claims processing. Gig workers need something different — coverage that's instant, affordable, and trustless. GigShield lets you pay as little as 0.001 SOL per gig, with claims validated on-chain."

### Scene 3: Connect Wallet & Browse Pools (0:40 — 1:10)
**On screen:** Live demo — connecting Phantom wallet, Stats tab showing TVL + validator leaderboard
**Narration:**
> "After connecting my Solana wallet, I can see the protocol stats — total value locked, active policies, and our validator leaderboard ranked by reputation score. Insurance pools are available across five categories: RideShare, Delivery, Freelance, Construction, Healthcare."

### Scene 4: Deposit Premium & Get Covered (1:10 — 1:40)
**On screen:** Clicking "Deposit Premium" on RideShare pool, entering 0.001 SOL, transaction confirming
**Narration:**
> "To get covered, I deposit a micro-premium. Just 0.001 SOL — that's a fraction of a cent — for this delivery gig. The transaction confirms in under a second on Solana. My policy is active. No forms, no waiting, no middlemen."

### Scene 5: Submit a Claim with Evidence (1:40 — 2:10)
**On screen:** Filing a claim, typing evidence description, SHA-256 hash generated, transaction confirming
**Narration:**
> "When something goes wrong, I submit a claim with a full evidence description. GigShield automatically generates a SHA-256 fingerprint of my evidence and anchors it on-chain — tamper-proof, forever. The claim enters a 48-hour voting window with a real-time countdown timer and vote progress bar."

### Scene 6: Validator Voting & Payout (2:10 — 2:40)
**On screen:** Validator tab voting, vote progress dots filling, withdraw button showing 95% payout
**Narration:**
> "Validators review the evidence and vote approve or reject. Once 2 of 3 validators reach consensus, the payout is triggered. Workers receive 95% of the claim — the remaining 5% goes to the protocol treasury. Completely trustless, completely on-chain."

### Scene 7: Closing (2:40 — 3:00)
**On screen:** GigShield logo + Stats tab leaderboard
**Narration:**
> "GigShield resurrects insurance on Solana — 8 on-chain instructions, 10/10 integration tests, live on devnet today. Affordable, decentralized, and fair for the billions who need it most. GigShield — micro-insurance for the gig economy."

---

## 6. SPONSOR BOUNTIES

### Primary Track: General / Overall Prize

GigShield is positioned for the **overall prize** as it represents a completely novel use case — **resurrecting insurance as a dead category on Solana**.

**Why GigShield deserves the overall prize:**
- **Novel Category**: No existing micro-insurance protocol on Solana — true resurrection
- **Real-World Impact**: Addresses a $2B+ market of underserved gig workers
- **Complete Implementation**: 8-instruction smart contract + full-stack frontend + 10/10 integration tests
- **Economic Design**: 5% protocol fee → treasury sustainability; 10× premium cap → anti-fraud; validator reputation → honest participation
- **Technical Excellence**: SHA-256 evidence, PDA vaults, 2/3 consensus, 48h voting deadline, cooldown protection

### Potential Sponsor Alignment

| Sponsor | Relevance | Integration |
|---------|-----------|-------------|
| **Realms (DAOs)** | Validator network functions as a specialized DAO — staking, voting, governance | Claim voting uses DAO-like stake-weighted supermajority mechanics |
| **Torque (Loyalty)** | Reputation scoring rewards consistent honest participation | On-chain reputation score increases with accurate claim validation |

---

## 7. NEXT ROADMAP

### Phase 1: Post-Hackathon (Weeks 1-2)
- [ ] Deploy to Solana Mainnet-Beta
- [ ] Professional smart contract audit
- [ ] Integrate oracle feeds for dynamic premium pricing
- [ ] SPL token support (USDC premiums)

### Phase 2: Growth (Months 1-2)
- [ ] Validator reward distribution from treasury to accurate voters
- [ ] Partner with Web3 gig platforms
- [ ] Mobile-optimized PWA
- [ ] AI-assisted claim evidence verification

### Phase 3: Scale (Months 2-4)
- [ ] DAO governance for protocol parameters
- [ ] Cross-pool risk diversification engine
- [ ] Reinsurance pools for catastrophic events
- [ ] SDK for gig platforms to embed GigShield natively

### Phase 4: Ecosystem (Months 4-6)
- [ ] Token launch for protocol governance and staking rewards
- [ ] Multi-chain expansion
- [ ] Actuarial model for premium pricing

### Long-Term Vision
GigShield becomes the **universal insurance layer for the gig economy** — any platform, any gig, any worker can access trustless, affordable coverage through a single Solana-native protocol.

---

## 8. LONG DESCRIPTION (Submission Form — 200-300 words)

**GigShield — Decentralized Micro-Insurance for the Gig Economy on Solana**

The gig economy employs over 2 billion workers globally, yet the vast majority lack any insurance coverage. Traditional insurance is fundamentally incompatible with gig work — requiring monthly premiums, lengthy paperwork, and centralized claims processors. Insurance remains a "dead category" on Solana. GigShield changes that.

GigShield is a decentralized micro-insurance protocol built natively on Solana using the Anchor framework. Workers pay micro-premiums as low as 0.001 SOL per individual gig, receiving instant on-chain coverage the moment their transaction confirms. When incidents occur, workers submit claims with a SHA-256 fingerprint of their evidence description anchored immutably on-chain — tamper-proof and verifiable by anyone.

Claims enter a 48-hour voting window, displayed with a real-time countdown timer and vote progress bar. Staked validators review the evidence and vote approve or reject. A 2/3 supermajority consensus is required — approved claims trigger automatic payouts of 95% to the worker, with 5% collected into the protocol treasury PDA for long-term sustainability. Validators earn +5 reputation points for each claim resolved by consensus. An anti-fraud cap limits claims to 10× total premiums paid.

GigShield supports five insurance categories — RideShare, Delivery, Freelance, Construction, Healthcare — each with configurable premium rates and maximum payouts. The protocol features 8 custom instructions, 13 error codes, a validator leaderboard, pool analytics, and 10/10 passing integration tests deployed live on Solana Devnet.

Built with Solana's sub-second finality and near-zero transaction costs, GigShield makes micro-insurance economically viable. GigShield resurrects insurance on Solana — trustless, transparent, and accessible to the billions who need it most.

---

## 9. ARTWORK BRIEF

### Logo Design

**Concept:** A shield icon with a subtle circuit/node pattern inside, representing protection + decentralization.

**Elements:**
- Shield shape (protection/insurance) — slightly rounded, modern style
- Inside the shield: interconnected nodes forming a "G" shape (decentralized network)
- Small Solana logo accent at the bottom of the shield

**Typography:**
- Font: Bold, geometric sans-serif (Inter Bold or Space Grotesk)
- "Gig" in white, "Shield" in gradient (indigo → purple)

**Color Palette:**

| Color | Hex | Usage |
|-------|-----|-------|
| Indigo | `#6366F1` | Primary brand color |
| Purple | `#8B5CF6` | Gradient accent |
| Deep Navy | `#0A0A14` | Background |
| Dark Charcoal | `#1E1E2E` | Card backgrounds |
| Light Gray | `#E4E4E7` | Body text |
| White | `#FFFFFF` | Headings |

### Banner Design (1200x630px — Social/Submission)

**Layout:**
- Left 60%: GigShield logo + tagline "Micro-Insurance for the Gig Economy"
- Right 40%: Stylized UI mockup of the app (pool cards, wallet button)
- Background: Deep navy (#0A0A14) with subtle gradient mesh (indigo/purple)
- Bottom bar: "Built on Solana" badge + "Graveyard Hack 2026" badge
- Tech stack icons: Solana, Anchor, Next.js, TypeScript

### Figma/Canva Guidelines:
- Use glassmorphism effects (frosted glass cards)
- Subtle glow effects behind key elements
- Maintain dark theme throughout
- Accent borders with indigo/purple gradients at 30% opacity

---

## 10. DEPLOYMENT INFO

### Smart Contract (Live on Solana Devnet)

| Field | Value |
|---|---|
| Program ID | `4oYtnLRhL2mRfzfXpM7CaC8WUZeAnEdHcAkyDPsmyDYV` |
| Network | Solana Devnet |
| Framework | Anchor 0.30.1 |
| Upgrade Authority | `52rWpvP4SeQ2n8B3ULPsYN6zTmYd6ZeQHM8VqXfjcsZ8` |

### Frontend (Live on Vercel)

| Field | Value |
|---|---|
| URL | https://gigshield.vercel.app |
| Framework | Next.js 14 |
| Hosting | Vercel |

### Build Commands

```bash
# Smart contract
anchor build --no-idl -- --tools-version v1.53
anchor deploy --provider.cluster devnet

# Integration tests (requires ~4 SOL on devnet)
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
npm test

# Frontend
cd app && npm run build
```

---

*Prepared for Solana Graveyard Hack 2026 — Submission Deadline: February 27, 2026*
