export const IDL = {
  version: "0.1.0",
  name: "gig_shield",
  address: "4oYtnLRhL2mRfzfXpM7CaC8WUZeAnEdHcAkyDPsmyDYV",
  instructions: [
    {
      name: "createPool",
      accounts: [
        { name: "pool", isMut: true, isSigner: false },
        { name: "admin", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "poolId", type: "string" },
        { name: "category", type: { defined: "GigCategory" } },
        { name: "premiumRateBps", type: "u16" },
        { name: "maxPayout", type: "u64" },
      ],
    },
    {
      name: "depositPremium",
      accounts: [
        { name: "pool", isMut: true, isSigner: false },
        { name: "policy", isMut: true, isSigner: false },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "worker", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "poolId", type: "string" },
        { name: "amount", type: "u64" },
      ],
    },
    {
      name: "submitClaim",
      accounts: [
        { name: "pool", isMut: false, isSigner: false },
        { name: "policy", isMut: false, isSigner: false },
        { name: "claim", isMut: true, isSigner: false },
        { name: "worker", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "poolId", type: "string" },
        { name: "claimId", type: "string" },
        { name: "amount", type: "u64" },
        { name: "evidenceHash", type: { array: ["u8", 32] } },
        { name: "description", type: "string" },
      ],
    },
    {
      name: "voteClaim",
      accounts: [
        { name: "pool", isMut: false, isSigner: false },
        { name: "claim", isMut: true, isSigner: false },
        { name: "validator", isMut: true, isSigner: false },
        { name: "vote", isMut: true, isSigner: false },
        { name: "voter", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "poolId", type: "string" },
        { name: "claimId", type: "string" },
        { name: "approve", type: "bool" },
      ],
    },
    {
      name: "withdrawPayout",
      accounts: [
        { name: "pool", isMut: true, isSigner: false },
        { name: "claim", isMut: true, isSigner: false },
        { name: "poolVault", isMut: true, isSigner: false },
        { name: "worker", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "poolId", type: "string" },
        { name: "claimId", type: "string" },
      ],
    },
    {
      name: "registerValidator",
      accounts: [
        { name: "validator", isMut: true, isSigner: false },
        { name: "validatorVault", isMut: true, isSigner: false },
        { name: "voter", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "stakeAmount", type: "u64" }],
    },
    {
      name: "unstakeValidator",
      accounts: [
        { name: "validator", isMut: true, isSigner: false },
        { name: "validatorVault", isMut: true, isSigner: false },
        { name: "voter", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "InsurancePool",
      type: {
        kind: "struct",
        fields: [
          { name: "admin", type: "publicKey" },
          { name: "poolId", type: "string" },
          { name: "category", type: { defined: "GigCategory" } },
          { name: "premiumRateBps", type: "u16" },
          { name: "maxPayout", type: "u64" },
          { name: "totalDeposits", type: "u64" },
          { name: "totalClaimsPaid", type: "u64" },
          { name: "activePolicies", type: "u32" },
          { name: "isActive", type: "bool" },
          { name: "createdAt", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "Policy",
      type: {
        kind: "struct",
        fields: [
          { name: "pool", type: "publicKey" },
          { name: "worker", type: "publicKey" },
          { name: "premiumsPaid", type: "u64" },
          { name: "gigsCovered", type: "u32" },
          { name: "isActive", type: "bool" },
          { name: "createdAt", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "Claim",
      type: {
        kind: "struct",
        fields: [
          { name: "pool", type: "publicKey" },
          { name: "policy", type: "publicKey" },
          { name: "worker", type: "publicKey" },
          { name: "claimId", type: "string" },
          { name: "amount", type: "u64" },
          { name: "evidenceHash", type: { array: ["u8", 32] } },
          { name: "description", type: "string" },
          { name: "votesFor", type: "u16" },
          { name: "votesAgainst", type: "u16" },
          { name: "status", type: { defined: "ClaimStatus" } },
          { name: "createdAt", type: "i64" },
          { name: "votingDeadline", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "ValidatorNode",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "stake", type: "u64" },
          { name: "claimsVoted", type: "u32" },
          { name: "reputationScore", type: "u16" },
          { name: "isActive", type: "bool" },
          { name: "registeredAt", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  types: [
    {
      name: "GigCategory",
      type: {
        kind: "enum",
        variants: [
          { name: "RideShare" },
          { name: "Delivery" },
          { name: "Freelance" },
          { name: "Construction" },
          { name: "Healthcare" },
          { name: "Other" },
        ],
      },
    },
    {
      name: "ClaimStatus",
      type: {
        kind: "enum",
        variants: [
          { name: "Pending" },
          { name: "Approved" },
          { name: "Rejected" },
          { name: "Paid" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "InvalidPremiumRate", msg: "Invalid premium rate" },
    { code: 6001, name: "InvalidAmount", msg: "Invalid amount" },
    { code: 6002, name: "PoolInactive", msg: "Pool is inactive" },
    { code: 6003, name: "PolicyInactive", msg: "Policy is inactive" },
    { code: 6004, name: "NoPremiumsPaid", msg: "No premiums paid" },
    { code: 6005, name: "ClaimExceedsMax", msg: "Claim exceeds max payout" },
    { code: 6006, name: "ClaimExceedsPremiumCap", msg: "Claim exceeds premium cap (max 10x premiums paid)" },
    { code: 6007, name: "DescriptionTooLong", msg: "Description too long" },
    { code: 6008, name: "PoolIdTooLong", msg: "Pool ID too long (max 32 chars)" },
    { code: 6009, name: "ClaimNotPending", msg: "Claim is not pending" },
    { code: 6010, name: "ClaimNotApproved", msg: "Claim not approved" },
    { code: 6011, name: "VotingExpired", msg: "Voting period has expired" },
    { code: 6012, name: "VotingNotExpired", msg: "Voting period has not expired yet" },
    { code: 6013, name: "ValidatorInactive", msg: "Validator is inactive" },
    { code: 6014, name: "InsufficientStake", msg: "Insufficient stake (min 1 SOL)" },
    { code: 6015, name: "UnstakeCooldownNotMet", msg: "Unstake cooldown not met (24h)" },
    { code: 6016, name: "InsufficientPoolFunds", msg: "Insufficient pool funds" },
    { code: 6017, name: "Unauthorized", msg: "Unauthorized" },
  ],
} as const;

export const PROGRAM_ID = "4oYtnLRhL2mRfzfXpM7CaC8WUZeAnEdHcAkyDPsmyDYV";
