"use client";
import { useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getProgram,
  getPoolPDA,
  getPoolVaultPDA,
  getPolicyPDA,
  getClaimPDA,
  getValidatorPDA,
  getValidatorVaultPDA,
  getVotePDA,
  fetchAllPools,
  fetchAllClaims,
  fetchPolicy,
  fetchValidator,
} from "./gigshield";

export function useGigShield() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const getProvider = useCallback(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions)
      throw new Error("Wallet not connected");
    return new AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
  }, [connection, wallet]);

  // Cast to any to avoid TS "excessively deep" instantiation errors with Anchor generics
  const pg = useCallback(() => getProgram(getProvider()) as any, [getProvider]);

  const createPool = useCallback(
    async (poolId: string, category: any, premiumRateBps: number, maxPayoutSol: number) => {
      const provider = getProvider();
      const [poolPDA] = getPoolPDA(provider.wallet.publicKey, poolId);
      const maxPayout = new BN(Math.floor(maxPayoutSol * LAMPORTS_PER_SOL));

      return pg().methods
        .createPool(poolId, category, premiumRateBps, maxPayout)
        .accounts({ pool: poolPDA, admin: provider.wallet.publicKey, systemProgram: PublicKey.default })
        .rpc();
    },
    [getProvider, pg]
  );

  const depositPremium = useCallback(
    async (poolAdmin: PublicKey, poolId: string, amountSol: number) => {
      const provider = getProvider();
      const [poolPDA] = getPoolPDA(poolAdmin, poolId);
      const [policyPDA] = getPolicyPDA(poolPDA, provider.wallet.publicKey);
      const [vaultPDA] = getPoolVaultPDA(poolPDA);
      const amount = new BN(Math.floor(amountSol * LAMPORTS_PER_SOL));

      return pg().methods
        .depositPremium(poolId, amount)
        .accounts({ pool: poolPDA, policy: policyPDA, poolVault: vaultPDA, worker: provider.wallet.publicKey, systemProgram: PublicKey.default })
        .rpc();
    },
    [getProvider, pg]
  );

  const submitClaim = useCallback(
    async (poolAdmin: PublicKey, poolId: string, claimId: string, amountSol: number, description: string, evidenceHash: Uint8Array) => {
      const provider = getProvider();
      const [poolPDA] = getPoolPDA(poolAdmin, poolId);
      const [policyPDA] = getPolicyPDA(poolPDA, provider.wallet.publicKey);
      const [claimPDA] = getClaimPDA(poolPDA, claimId);
      const amount = new BN(Math.floor(amountSol * LAMPORTS_PER_SOL));

      // Pad/truncate to exactly 32 bytes
      const hashArr = Array.from({ length: 32 }, (_, i) => evidenceHash[i] ?? 0);

      return pg().methods
        .submitClaim(poolId, claimId, amount, hashArr, description)
        .accounts({ pool: poolPDA, policy: policyPDA, claim: claimPDA, worker: provider.wallet.publicKey, systemProgram: PublicKey.default })
        .rpc();
    },
    [getProvider, pg]
  );

  const voteClaim = useCallback(
    async (poolAdmin: PublicKey, poolId: string, claimId: string, approve: boolean) => {
      const provider = getProvider();
      const [poolPDA] = getPoolPDA(poolAdmin, poolId);
      const [claimPDA] = getClaimPDA(poolPDA, claimId);
      const [validatorPDA] = getValidatorPDA(provider.wallet.publicKey);
      const [votePDA] = getVotePDA(claimPDA, provider.wallet.publicKey);

      return pg().methods
        .voteClaim(poolId, claimId, approve)
        .accounts({ pool: poolPDA, claim: claimPDA, validator: validatorPDA, vote: votePDA, voter: provider.wallet.publicKey, systemProgram: PublicKey.default })
        .rpc();
    },
    [getProvider, pg]
  );

  const withdrawPayout = useCallback(
    async (poolAdmin: PublicKey, poolId: string, claimId: string) => {
      const provider = getProvider();
      const [poolPDA] = getPoolPDA(poolAdmin, poolId);
      const [claimPDA] = getClaimPDA(poolPDA, claimId);
      const [vaultPDA] = getPoolVaultPDA(poolPDA);

      return pg().methods
        .withdrawPayout(poolId, claimId)
        .accounts({ pool: poolPDA, claim: claimPDA, poolVault: vaultPDA, worker: provider.wallet.publicKey, systemProgram: PublicKey.default })
        .rpc();
    },
    [getProvider, pg]
  );

  const registerValidator = useCallback(
    async (stakeAmountSol: number) => {
      const provider = getProvider();
      const [validatorPDA] = getValidatorPDA(provider.wallet.publicKey);
      const [vaultPDA] = getValidatorVaultPDA(provider.wallet.publicKey);
      const stake = new BN(Math.floor(stakeAmountSol * LAMPORTS_PER_SOL));

      return pg().methods
        .registerValidator(stake)
        .accounts({ validator: validatorPDA, validatorVault: vaultPDA, voter: provider.wallet.publicKey, systemProgram: PublicKey.default })
        .rpc();
    },
    [getProvider, pg]
  );

  const unstakeValidator = useCallback(async () => {
    const provider = getProvider();
    const [validatorPDA] = getValidatorPDA(provider.wallet.publicKey);
    const [vaultPDA] = getValidatorVaultPDA(provider.wallet.publicKey);

    return pg().methods
      .unstakeValidator()
      .accounts({ validator: validatorPDA, validatorVault: vaultPDA, voter: provider.wallet.publicKey, systemProgram: PublicKey.default })
      .rpc();
  }, [getProvider, pg]);

  const getPools = useCallback(async () => fetchAllPools(pg()), [pg]);
  const getClaims = useCallback(async () => fetchAllClaims(pg()), [pg]);

  const getMyPolicy = useCallback(
    async (pool: PublicKey) => {
      const provider = getProvider();
      return fetchPolicy(pg(), pool, provider.wallet.publicKey);
    },
    [getProvider, pg]
  );

  const getMyValidator = useCallback(async () => {
    const provider = getProvider();
    return fetchValidator(pg(), provider.wallet.publicKey);
  }, [getProvider, pg]);

  return {
    connected: !!wallet.publicKey,
    publicKey: wallet.publicKey,
    createPool,
    depositPremium,
    submitClaim,
    voteClaim,
    withdrawPayout,
    registerValidator,
    unstakeValidator,
    getPools,
    getClaims,
    getMyPolicy,
    getMyValidator,
  };
}
