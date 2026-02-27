import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { IDL, PROGRAM_ID } from "./idl";

export const PROGRAM_ID_PUBKEY = new PublicKey(PROGRAM_ID);

export function getProgram(provider: AnchorProvider) {
  return new Program(IDL as any, provider);
}

// ---- PDAs ----

export function getPoolPDA(admin: PublicKey, poolId: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool"), admin.toBuffer(), Buffer.from(poolId)],
    PROGRAM_ID_PUBKEY
  );
}

export function getPoolVaultPDA(pool: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pool-vault"), pool.toBuffer()],
    PROGRAM_ID_PUBKEY
  );
}

export function getPolicyPDA(pool: PublicKey, worker: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("policy"), pool.toBuffer(), worker.toBuffer()],
    PROGRAM_ID_PUBKEY
  );
}

export function getClaimPDA(pool: PublicKey, claimId: string) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("claim"), pool.toBuffer(), Buffer.from(claimId)],
    PROGRAM_ID_PUBKEY
  );
}

export function getValidatorPDA(voter: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("validator"), voter.toBuffer()],
    PROGRAM_ID_PUBKEY
  );
}

export function getValidatorVaultPDA(voter: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("val-vault"), voter.toBuffer()],
    PROGRAM_ID_PUBKEY
  );
}

export function getVotePDA(claim: PublicKey, voter: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vote"), claim.toBuffer(), voter.toBuffer()],
    PROGRAM_ID_PUBKEY
  );
}

export function getTreasuryPDA() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    PROGRAM_ID_PUBKEY
  );
}

// ---- Category helpers ----

export const GIG_CATEGORIES = [
  { label: "Ride Share", icon: "🚗", value: { rideShare: {} }, premiumSol: "0.001" },
  { label: "Delivery", icon: "📦", value: { delivery: {} }, premiumSol: "0.002" },
  { label: "Freelance", icon: "💻", value: { freelance: {} }, premiumSol: "0.003" },
  { label: "Construction", icon: "🏗️", value: { construction: {} }, premiumSol: "0.005" },
  { label: "Healthcare", icon: "🏥", value: { healthcare: {} }, premiumSol: "0.004" },
];

export function lamportsToSol(lamports: number | bigint) {
  return Number(lamports) / 1e9;
}

export function solToLamports(sol: number) {
  return new BN(Math.floor(sol * 1e9));
}

export function shortenAddress(addr: string, chars = 4) {
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

// ---- Fetch helpers ----

export async function fetchAllPools(program: Program<any>) {
  try {
    const accs = (program.account as any).insurancePool;
    return await accs.all();
  } catch {
    return [];
  }
}

export async function fetchAllClaims(program: Program<any>) {
  try {
    const accs = (program.account as any).claim;
    return await accs.all();
  } catch {
    return [];
  }
}

export async function fetchPolicy(
  program: Program<any>,
  pool: PublicKey,
  worker: PublicKey
) {
  const [policyPDA] = getPolicyPDA(pool, worker);
  try {
    return await (program.account as any).policy.fetch(policyPDA);
  } catch {
    return null;
  }
}

export async function fetchValidator(program: Program<any>, voter: PublicKey) {
  const [validatorPDA] = getValidatorPDA(voter);
  try {
    return await (program.account as any).validatorNode.fetch(validatorPDA);
  } catch {
    return null;
  }
}

export async function fetchAllValidators(program: Program<any>) {
  try {
    return await (program.account as any).validatorNode.all();
  } catch {
    return [];
  }
}

export function getClaimStatusLabel(status: any): string {
  if (status?.pending !== undefined) return "Pending";
  if (status?.approved !== undefined) return "Approved";
  if (status?.rejected !== undefined) return "Rejected";
  if (status?.paid !== undefined) return "Paid";
  return "Unknown";
}
