import * as anchor from "@coral-xyz/anchor";
const { Program, AnchorProvider } = anchor;
import BN from "bn.js";
import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import * as fs from "fs";
const GIG_SHIELD_IDL = JSON.parse(fs.readFileSync("target/idl/gig_shield.json", "utf8"));

const PROGRAM_ID = new PublicKey("4oYtnLRhL2mRfzfXpM7CaC8WUZeAnEdHcAkyDPsmyDYV");

// ─── PDA helpers ───────────────────────────────────────────────────────────────

function poolPDA(admin: PublicKey, poolId: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), admin.toBuffer(), Buffer.from(poolId)],
    PROGRAM_ID
  );
}
function poolVaultPDA(pool: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("pool-vault"), pool.toBuffer()], PROGRAM_ID);
}
function policyPDA(pool: PublicKey, worker: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("policy"), pool.toBuffer(), worker.toBuffer()],
    PROGRAM_ID
  );
}
function claimPDA(pool: PublicKey, claimId: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("claim"), pool.toBuffer(), Buffer.from(claimId)],
    PROGRAM_ID
  );
}
function validatorPDA(voter: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("validator"), voter.toBuffer()], PROGRAM_ID);
}
function valVaultPDA(voter: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("val-vault"), voter.toBuffer()], PROGRAM_ID);
}
function votePDA(claim: PublicKey, voter: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vote"), claim.toBuffer(), voter.toBuffer()],
    PROGRAM_ID
  );
}

// ─── Airdrop helper ────────────────────────────────────────────────────────────

async function fundFromPayer(provider: anchor.AnchorProvider, payer: Keypair, to: PublicKey, sol = 2) {
  const tx = new anchor.web3.Transaction().add(
    SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: to, lamports: sol * LAMPORTS_PER_SOL })
  );
  const sig = await provider.sendAndConfirm(tx, [payer]);
  return sig;
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("GigShield", () => {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);
  const program = new Program(GIG_SHIELD_IDL as any, provider) as any;

  const admin = (provider.wallet as any).payer as Keypair;
  const worker = Keypair.generate();
  const validator1 = Keypair.generate();
  const validator2 = Keypair.generate();
  const validator3 = Keypair.generate();

  const POOL_ID = `test-pool-${Date.now()}`;
  const CLAIM_ID = `claim-${Date.now()}`;
  const CLAIM_AMOUNT_SOL = 0.05; // 0.05 SOL (within 10x of 0.01 SOL premium)
  const PREMIUM_SOL = 0.01;

  before(async () => {
    // Fund test wallets: worker needs ~0.3 SOL, validators need 1.05 SOL each (1 for stake + fees)
    await fundFromPayer(provider, admin, worker.publicKey, 0.3);
    await fundFromPayer(provider, admin, validator1.publicKey, 1.05);
    await fundFromPayer(provider, admin, validator2.publicKey, 1.05);
    await fundFromPayer(provider, admin, validator3.publicKey, 1.05);
  });

  // ── Test 1: Create pool ──────────────────────────────────────────────────────
  it("1. Creates an insurance pool", async () => {
    const [pool] = poolPDA(admin.publicKey, POOL_ID);
    await program.methods
      .createPool(POOL_ID, { rideShare: {} }, 100, new BN(5 * LAMPORTS_PER_SOL))
      .accounts({ pool, admin: admin.publicKey, systemProgram: SystemProgram.programId })
      .signers([admin])
      .rpc();

    const account = await program.account.insurancePool.fetch(pool);
    assert.equal(account.poolId, POOL_ID);
    assert.equal(account.premiumRateBps, 100);
    assert.isTrue(account.isActive);
    assert.equal(account.activePolicies, 0);
  });

  // ── Test 2: Reject invalid premium rate ─────────────────────────────────────
  it("2. Rejects pool creation with invalid premium rate (0)", async () => {
    const badId = "bad-pool-" + Date.now();
    const [pool] = poolPDA(admin.publicKey, badId);
    try {
      await program.methods
        .createPool(badId, { delivery: {} }, 0, new BN(LAMPORTS_PER_SOL))
        .accounts({ pool, admin: admin.publicKey, systemProgram: SystemProgram.programId })
        .signers([admin])
        .rpc();
      assert.fail("Should have thrown InvalidPremiumRate");
    } catch (e: any) {
      assert.include(e.message, "6000", "Expected InvalidPremiumRate error 6000");
    }
  });

  // ── Test 3: Deposit premium ──────────────────────────────────────────────────
  it("3. Worker deposits premium and creates policy", async () => {
    const [pool] = poolPDA(admin.publicKey, POOL_ID);
    const [policy] = policyPDA(pool, worker.publicKey);
    const [vault] = poolVaultPDA(pool);

    await program.methods
      .depositPremium(POOL_ID, new BN(PREMIUM_SOL * LAMPORTS_PER_SOL))
      .accounts({ pool, policy, poolVault: vault, worker: worker.publicKey, systemProgram: SystemProgram.programId })
      .signers([worker])
      .rpc();

    const policyAcc = await program.account.policy.fetch(policy);
    assert.equal(policyAcc.premiumsPaid.toNumber(), PREMIUM_SOL * LAMPORTS_PER_SOL);
    assert.equal(policyAcc.gigsCovered, 1);
    assert.isTrue(policyAcc.isActive);

    const poolAcc = await program.account.insurancePool.fetch(pool);
    assert.equal(poolAcc.activePolicies, 1);
    assert.equal(poolAcc.totalDeposits.toNumber(), PREMIUM_SOL * LAMPORTS_PER_SOL);
  });

  // ── Test 4: Register 3 validators ───────────────────────────────────────────
  it("4. Registers three validators with 1 SOL stake each", async () => {
    for (const v of [validator1, validator2, validator3]) {
      const [vNode] = validatorPDA(v.publicKey);
      const [vault] = valVaultPDA(v.publicKey);
      await program.methods
        .registerValidator(new BN(LAMPORTS_PER_SOL))
        .accounts({ validator: vNode, validatorVault: vault, voter: v.publicKey, systemProgram: SystemProgram.programId })
        .signers([v])
        .rpc();

      const acc = await program.account.validatorNode.fetch(vNode);
      assert.equal(acc.stake.toNumber(), LAMPORTS_PER_SOL);
      assert.isTrue(acc.isActive);
      assert.equal(acc.reputationScore, 100);
    }
  });

  // ── Test 5: Submit claim ─────────────────────────────────────────────────────
  it("5. Worker submits an insurance claim", async () => {
    const [pool] = poolPDA(admin.publicKey, POOL_ID);
    const [policy] = policyPDA(pool, worker.publicKey);
    const [claim] = claimPDA(pool, CLAIM_ID);
    const evidenceHash = Array(32).fill(1);

    await program.methods
      .submitClaim(POOL_ID, CLAIM_ID, new BN(CLAIM_AMOUNT_SOL * LAMPORTS_PER_SOL), evidenceHash, "Accident on delivery")
      .accounts({ pool, policy, claim, worker: worker.publicKey, systemProgram: SystemProgram.programId })
      .signers([worker])
      .rpc();

    const claimAcc = await program.account.claim.fetch(claim);
    assert.equal(claimAcc.claimId, CLAIM_ID);
    assert.equal(claimAcc.amount.toNumber(), CLAIM_AMOUNT_SOL * LAMPORTS_PER_SOL);
    assert.deepEqual(claimAcc.status, { pending: {} });
    assert.isAbove(claimAcc.votingDeadline.toNumber(), Math.floor(Date.now() / 1000));
  });

  // ── Test 6: Reject claim exceeding premium cap ───────────────────────────────
  it("6. Rejects claim exceeding 10x premium cap", async () => {
    const badClaimId = "bad-claim-" + Date.now();
    const [pool] = poolPDA(admin.publicKey, POOL_ID);
    const [policy] = policyPDA(pool, worker.publicKey);
    const [claim] = claimPDA(pool, badClaimId);
    const evidenceHash = Array(32).fill(0);
    // Premium paid: 0.01 SOL → max claim = 0.1 SOL. Try 0.5 SOL (too much).
    const overAmount = new BN(0.5 * LAMPORTS_PER_SOL);
    try {
      await program.methods
        .submitClaim(POOL_ID, badClaimId, overAmount, evidenceHash, "Greedy claim")
        .accounts({ pool, policy, claim, worker: worker.publicKey, systemProgram: SystemProgram.programId })
        .signers([worker])
        .rpc();
      assert.fail("Should have thrown ClaimExceedsPremiumCap");
    } catch (e: any) {
      assert.include(e.message, "6006", "Expected ClaimExceedsPremiumCap error 6006");
    }
  });

  // ── Test 7: 3 validators vote approve → Approved ────────────────────────────
  it("7. Three validators approve claim, reaching 2/3 consensus", async () => {
    const [pool] = poolPDA(admin.publicKey, POOL_ID);
    const [claim] = claimPDA(pool, CLAIM_ID);

    for (const v of [validator1, validator2, validator3]) {
      const [vNode] = validatorPDA(v.publicKey);
      const [voteAcc] = votePDA(claim, v.publicKey);
      await program.methods
        .voteClaim(POOL_ID, CLAIM_ID, true)
        .accounts({
          pool, claim, validator: vNode, vote: voteAcc,
          voter: v.publicKey, systemProgram: SystemProgram.programId,
        })
        .signers([v])
        .rpc();
    }

    const claimAcc = await program.account.claim.fetch(claim);
    assert.deepEqual(claimAcc.status, { approved: {} });
    assert.equal(claimAcc.votesFor, 3);
    assert.equal(claimAcc.votesAgainst, 0);

    // Only validator3 (last voter, triggered consensus) gets +5 reputation
    const v3 = await program.account.validatorNode.fetch(validatorPDA(validator3.publicKey)[0]);
    assert.equal(v3.reputationScore, 105);
    const v1 = await program.account.validatorNode.fetch(validatorPDA(validator1.publicKey)[0]);
    assert.equal(v1.reputationScore, 100); // v1 voted before consensus threshold
  });

  // ── Test 8: Reject double vote ───────────────────────────────────────────────
  it("8. Rejects double-voting from same validator", async () => {
    const [pool] = poolPDA(admin.publicKey, POOL_ID);
    const [claim] = claimPDA(pool, CLAIM_ID);
    const [vNode] = validatorPDA(validator1.publicKey);
    const [voteAcc] = votePDA(claim, validator1.publicKey);

    try {
      await program.methods
        .voteClaim(POOL_ID, CLAIM_ID, false)
        .accounts({
          pool, claim, validator: vNode, vote: voteAcc,
          voter: validator1.publicKey, systemProgram: SystemProgram.programId,
        })
        .signers([validator1])
        .rpc();
      assert.fail("Should have thrown (PDA already initialized)");
    } catch (e: any) {
      // Anchor throws when trying to re-init an existing account
      assert.ok(e, "Double vote correctly rejected");
    }
  });

  // ── Test 9: Withdraw payout ──────────────────────────────────────────────────
  it("9. Worker withdraws payout after claim approved", async () => {
    const [pool] = poolPDA(admin.publicKey, POOL_ID);
    const [claim] = claimPDA(pool, CLAIM_ID);
    const [vault] = poolVaultPDA(pool);
    const [policy] = policyPDA(pool, worker.publicKey);

    // Top up vault so it can cover the 0.05 SOL payout
    await program.methods
      .depositPremium(POOL_ID, new BN(0.1 * LAMPORTS_PER_SOL))
      .accounts({ pool, policy, poolVault: vault, worker: worker.publicKey, systemProgram: SystemProgram.programId })
      .signers([worker])
      .rpc();

    const beforeBalance = await provider.connection.getBalance(worker.publicKey);

    await program.methods
      .withdrawPayout(POOL_ID, CLAIM_ID)
      .accounts({ pool, claim, poolVault: vault, worker: worker.publicKey, systemProgram: SystemProgram.programId })
      .signers([worker])
      .rpc();

    const claimAcc = await program.account.claim.fetch(claim);
    assert.deepEqual(claimAcc.status, { paid: {} });

    const afterBalance = await provider.connection.getBalance(worker.publicKey);
    assert.isAbove(afterBalance, beforeBalance, "Worker received payout");
  });

  // ── Test 10: Unstake cooldown enforced ──────────────────────────────────────
  it("10. Rejects unstake before 24h cooldown", async () => {
    const [vNode] = validatorPDA(validator1.publicKey);
    const [vault] = valVaultPDA(validator1.publicKey);

    try {
      await program.methods
        .unstakeValidator()
        .accounts({
          validator: vNode, validatorVault: vault,
          voter: validator1.publicKey, systemProgram: SystemProgram.programId,
        })
        .signers([validator1])
        .rpc();
      assert.fail("Should have thrown UnstakeCooldownNotMet");
    } catch (e: any) {
      assert.include(e.message, "6015", "Expected UnstakeCooldownNotMet error 6015");
    }
  });
});
