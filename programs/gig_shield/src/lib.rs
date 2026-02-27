use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};

declare_id!("4oYtnLRhL2mRfzfXpM7CaC8WUZeAnEdHcAkyDPsmyDYV");

const VOTING_PERIOD: i64 = 172_800; // 48 hours in seconds
const CLAIM_MULTIPLIER: u64 = 10; // max claim = premiums_paid * 10
const MIN_STAKE: u64 = 1_000_000_000; // 1 SOL
const UNSTAKE_COOLDOWN: i64 = 86_400; // 24 hours

#[program]
pub mod gig_shield {
    use super::*;

    /// Create an insurance pool for a gig category
    pub fn create_pool(
        ctx: Context<CreatePool>,
        pool_id: String,
        category: GigCategory,
        premium_rate_bps: u16,
        max_payout: u64,
    ) -> Result<()> {
        require!(premium_rate_bps > 0 && premium_rate_bps <= 1000, GigError::InvalidPremiumRate);
        require!(max_payout > 0, GigError::InvalidAmount);
        require!(pool_id.len() <= 32, GigError::PoolIdTooLong);

        let pool = &mut ctx.accounts.pool;
        pool.admin = ctx.accounts.admin.key();
        pool.pool_id = pool_id;
        pool.category = category;
        pool.premium_rate_bps = premium_rate_bps;
        pool.max_payout = max_payout;
        pool.total_deposits = 0;
        pool.total_claims_paid = 0;
        pool.active_policies = 0;
        pool.is_active = true;
        pool.created_at = Clock::get()?.unix_timestamp;
        pool.bump = ctx.bumps.pool;

        Ok(())
    }

    /// Gig worker deposits premium to get coverage
    pub fn deposit_premium(ctx: Context<DepositPremium>, _pool_id: String, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(pool.is_active, GigError::PoolInactive);
        require!(amount > 0, GigError::InvalidAmount);

        invoke(
            &system_instruction::transfer(
                &ctx.accounts.worker.key(),
                &ctx.accounts.pool_vault.key(),
                amount,
            ),
            &[
                ctx.accounts.worker.to_account_info(),
                ctx.accounts.pool_vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        pool.total_deposits += amount;

        let policy = &mut ctx.accounts.policy;
        if policy.created_at == 0 {
            policy.pool = pool.key();
            policy.worker = ctx.accounts.worker.key();
            policy.created_at = Clock::get()?.unix_timestamp;
            policy.is_active = true;
            pool.active_policies += 1;
            policy.bump = ctx.bumps.policy;
        }
        policy.premiums_paid += amount;
        policy.gigs_covered += 1;

        emit!(PremiumDeposited {
            pool: pool.key(),
            worker: ctx.accounts.worker.key(),
            amount,
            total_premiums: policy.premiums_paid,
        });

        Ok(())
    }

    /// Worker submits an insurance claim
    pub fn submit_claim(
        ctx: Context<SubmitClaim>,
        _pool_id: String,
        claim_id: String,
        amount: u64,
        evidence_hash: [u8; 32],
        description: String,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool;
        require!(pool.is_active, GigError::PoolInactive);
        require!(amount > 0 && amount <= pool.max_payout, GigError::ClaimExceedsMax);
        require!(description.len() <= 256, GigError::DescriptionTooLong);

        let policy = &ctx.accounts.policy;
        require!(policy.is_active, GigError::PolicyInactive);
        require!(policy.premiums_paid > 0, GigError::NoPremiumsPaid);

        // FIX: Cap claim amount against premiums paid (max 10x multiplier)
        let max_claimable = policy.premiums_paid.saturating_mul(CLAIM_MULTIPLIER);
        require!(amount <= max_claimable, GigError::ClaimExceedsPremiumCap);

        let now = Clock::get()?.unix_timestamp;

        let claim = &mut ctx.accounts.claim;
        claim.pool = pool.key();
        claim.policy = policy.key();
        claim.worker = ctx.accounts.worker.key();
        claim.claim_id = claim_id;
        claim.amount = amount;
        claim.evidence_hash = evidence_hash;
        claim.description = description;
        claim.votes_for = 0;
        claim.votes_against = 0;
        claim.status = ClaimStatus::Pending;
        claim.created_at = now;
        claim.voting_deadline = now + VOTING_PERIOD; // FIX: 48-hour voting window
        claim.bump = ctx.bumps.claim;

        emit!(ClaimSubmitted {
            pool: pool.key(),
            worker: ctx.accounts.worker.key(),
            amount,
            claim: claim.key(),
        });

        Ok(())
    }

    /// Validator votes on a claim (double-voting prevented by PDA seeds)
    pub fn vote_claim(
        ctx: Context<VoteClaim>,
        _pool_id: String,
        _claim_id: String,
        approve: bool,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        require!(claim.status == ClaimStatus::Pending, GigError::ClaimNotPending);

        // FIX: Check voting deadline
        let now = Clock::get()?.unix_timestamp;
        require!(now <= claim.voting_deadline, GigError::VotingExpired);

        let validator = &mut ctx.accounts.validator;
        require!(validator.is_active, GigError::ValidatorInactive);

        let vote = &mut ctx.accounts.vote;
        vote.claim = claim.key();
        vote.validator = ctx.accounts.voter.key();
        vote.approve = approve;
        vote.voted_at = now;
        vote.bump = ctx.bumps.vote;

        if approve {
            claim.votes_for += 1;
        } else {
            claim.votes_against += 1;
        }

        validator.claims_voted += 1;

        // Check consensus (2/3 majority with minimum 3 votes)
        let total_votes = claim.votes_for + claim.votes_against;
        if total_votes >= 3 {
            if claim.votes_for * 3 >= total_votes * 2 {
                claim.status = ClaimStatus::Approved;
                // FIX: Reward validators who voted correctly
                validator.reputation_score = validator.reputation_score.saturating_add(5);
            } else if claim.votes_against * 3 >= total_votes * 2 {
                claim.status = ClaimStatus::Rejected;
                validator.reputation_score = validator.reputation_score.saturating_add(5);
            }
        }

        emit!(VoteCasted {
            claim: claim.key(),
            validator: ctx.accounts.voter.key(),
            approve,
            votes_for: claim.votes_for,
            votes_against: claim.votes_against,
        });

        Ok(())
    }

    /// Resolve an expired claim that didn't reach consensus
    pub fn resolve_expired_claim(
        ctx: Context<ResolveExpiredClaim>,
        _pool_id: String,
        _claim_id: String,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        require!(claim.status == ClaimStatus::Pending, GigError::ClaimNotPending);

        let now = Clock::get()?.unix_timestamp;
        require!(now > claim.voting_deadline, GigError::VotingNotExpired);

        // If voting expired without consensus, reject the claim
        let total_votes = claim.votes_for + claim.votes_against;
        if total_votes >= 3 && claim.votes_for * 3 >= total_votes * 2 {
            claim.status = ClaimStatus::Approved;
        } else {
            claim.status = ClaimStatus::Rejected;
        }

        Ok(())
    }

    /// Approved claimant withdraws payout
    pub fn withdraw_payout(ctx: Context<WithdrawPayout>, _pool_id: String, _claim_id: String) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        require!(claim.status == ClaimStatus::Approved, GigError::ClaimNotApproved);
        require!(claim.worker == ctx.accounts.worker.key(), GigError::Unauthorized);

        let amount = claim.amount;
        let vault_balance = ctx.accounts.pool_vault.lamports();
        require!(vault_balance >= amount, GigError::InsufficientPoolFunds);

        **ctx.accounts.pool_vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.worker.to_account_info().try_borrow_mut_lamports()? += amount;

        claim.status = ClaimStatus::Paid;

        let pool = &mut ctx.accounts.pool;
        pool.total_claims_paid += amount;

        emit!(PayoutWithdrawn {
            pool: pool.key(),
            worker: ctx.accounts.worker.key(),
            amount,
        });

        Ok(())
    }

    /// Register as a claim validator (requires stake)
    pub fn register_validator(
        ctx: Context<RegisterValidator>,
        stake_amount: u64,
    ) -> Result<()> {
        require!(stake_amount >= MIN_STAKE, GigError::InsufficientStake);

        invoke(
            &system_instruction::transfer(
                &ctx.accounts.voter.key(),
                &ctx.accounts.validator_vault.key(),
                stake_amount,
            ),
            &[
                ctx.accounts.voter.to_account_info(),
                ctx.accounts.validator_vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        let validator = &mut ctx.accounts.validator;
        validator.authority = ctx.accounts.voter.key();
        validator.stake = stake_amount;
        validator.claims_voted = 0;
        validator.reputation_score = 100;
        validator.is_active = true;
        validator.registered_at = Clock::get()?.unix_timestamp;
        validator.bump = ctx.bumps.validator;

        Ok(())
    }

    /// FIX: Validator can unstake after cooldown period
    pub fn unstake_validator(ctx: Context<UnstakeValidator>) -> Result<()> {
        let validator = &mut ctx.accounts.validator;
        require!(validator.is_active, GigError::ValidatorInactive);

        let now = Clock::get()?.unix_timestamp;
        let time_since_register = now - validator.registered_at;
        require!(time_since_register >= UNSTAKE_COOLDOWN, GigError::UnstakeCooldownNotMet);

        let amount = validator.stake;
        let vault_balance = ctx.accounts.validator_vault.lamports();
        require!(vault_balance >= amount, GigError::InsufficientPoolFunds);

        **ctx.accounts.validator_vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.voter.to_account_info().try_borrow_mut_lamports()? += amount;

        validator.is_active = false;
        validator.stake = 0;

        Ok(())
    }
}

// ============ ACCOUNTS ============

#[derive(Accounts)]
#[instruction(pool_id: String)]
pub struct CreatePool<'info> {
    #[account(
        init, payer = admin,
        space = 8 + InsurancePool::MAX_SIZE,
        seeds = [b"pool", admin.key().as_ref(), pool_id.as_bytes()],
        bump
    )]
    pub pool: Account<'info, InsurancePool>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(pool_id: String)]
pub struct DepositPremium<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.admin.as_ref(), pool_id.as_bytes()],
        bump = pool.bump
    )]
    pub pool: Account<'info, InsurancePool>,
    #[account(
        init_if_needed, payer = worker,
        space = 8 + Policy::MAX_SIZE,
        seeds = [b"policy", pool.key().as_ref(), worker.key().as_ref()],
        bump
    )]
    pub policy: Account<'info, Policy>,
    /// CHECK: Pool vault PDA
    #[account(mut, seeds = [b"pool-vault", pool.key().as_ref()], bump)]
    pub pool_vault: UncheckedAccount<'info>,
    #[account(mut)]
    pub worker: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(pool_id: String, claim_id: String)]
pub struct SubmitClaim<'info> {
    #[account(seeds = [b"pool", pool.admin.as_ref(), pool_id.as_bytes()], bump = pool.bump)]
    pub pool: Account<'info, InsurancePool>,
    #[account(seeds = [b"policy", pool.key().as_ref(), worker.key().as_ref()], bump = policy.bump)]
    pub policy: Account<'info, Policy>,
    #[account(
        init, payer = worker,
        space = 8 + Claim::MAX_SIZE,
        seeds = [b"claim", pool.key().as_ref(), claim_id.as_bytes()],
        bump
    )]
    pub claim: Account<'info, Claim>,
    #[account(mut)]
    pub worker: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(pool_id: String, claim_id: String)]
pub struct VoteClaim<'info> {
    #[account(seeds = [b"pool", pool.admin.as_ref(), pool_id.as_bytes()], bump = pool.bump)]
    pub pool: Account<'info, InsurancePool>,
    #[account(
        mut,
        seeds = [b"claim", pool.key().as_ref(), claim_id.as_bytes()],
        bump = claim.bump
    )]
    pub claim: Account<'info, Claim>,
    #[account(
        mut,
        seeds = [b"validator", voter.key().as_ref()],
        bump = validator.bump
    )]
    pub validator: Account<'info, ValidatorNode>,
    #[account(
        init, payer = voter,
        space = 8 + Vote::MAX_SIZE,
        seeds = [b"vote", claim.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(pool_id: String, claim_id: String)]
pub struct ResolveExpiredClaim<'info> {
    #[account(seeds = [b"pool", pool.admin.as_ref(), pool_id.as_bytes()], bump = pool.bump)]
    pub pool: Account<'info, InsurancePool>,
    #[account(
        mut,
        seeds = [b"claim", pool.key().as_ref(), claim_id.as_bytes()],
        bump = claim.bump
    )]
    pub claim: Account<'info, Claim>,
}

#[derive(Accounts)]
#[instruction(pool_id: String, claim_id: String)]
pub struct WithdrawPayout<'info> {
    #[account(
        mut,
        seeds = [b"pool", pool.admin.as_ref(), pool_id.as_bytes()],
        bump = pool.bump
    )]
    pub pool: Account<'info, InsurancePool>,
    #[account(
        mut,
        seeds = [b"claim", pool.key().as_ref(), claim_id.as_bytes()],
        bump = claim.bump
    )]
    pub claim: Account<'info, Claim>,
    /// CHECK: Pool vault
    #[account(mut, seeds = [b"pool-vault", pool.key().as_ref()], bump)]
    pub pool_vault: UncheckedAccount<'info>,
    #[account(mut)]
    pub worker: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterValidator<'info> {
    #[account(
        init, payer = voter,
        space = 8 + ValidatorNode::MAX_SIZE,
        seeds = [b"validator", voter.key().as_ref()],
        bump
    )]
    pub validator: Account<'info, ValidatorNode>,
    /// CHECK: Validator vault
    #[account(mut, seeds = [b"val-vault", voter.key().as_ref()], bump)]
    pub validator_vault: UncheckedAccount<'info>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnstakeValidator<'info> {
    #[account(
        mut,
        seeds = [b"validator", voter.key().as_ref()],
        bump = validator.bump,
        constraint = validator.authority == voter.key() @ GigError::Unauthorized,
    )]
    pub validator: Account<'info, ValidatorNode>,
    /// CHECK: Validator vault
    #[account(mut, seeds = [b"val-vault", voter.key().as_ref()], bump)]
    pub validator_vault: UncheckedAccount<'info>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ============ STATE ============

#[account]
pub struct InsurancePool {
    pub admin: Pubkey,
    pub pool_id: String,
    pub category: GigCategory,
    pub premium_rate_bps: u16,
    pub max_payout: u64,
    pub total_deposits: u64,
    pub total_claims_paid: u64,
    pub active_policies: u32,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl InsurancePool {
    pub const MAX_SIZE: usize = 32 + (4 + 32) + 1 + 2 + 8 + 8 + 8 + 4 + 1 + 8 + 1;
}

#[account]
pub struct Policy {
    pub pool: Pubkey,
    pub worker: Pubkey,
    pub premiums_paid: u64,
    pub gigs_covered: u32,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl Policy {
    pub const MAX_SIZE: usize = 32 + 32 + 8 + 4 + 1 + 8 + 1;
}

#[account]
pub struct Claim {
    pub pool: Pubkey,
    pub policy: Pubkey,
    pub worker: Pubkey,
    pub claim_id: String,
    pub amount: u64,
    pub evidence_hash: [u8; 32],
    pub description: String,
    pub votes_for: u16,
    pub votes_against: u16,
    pub status: ClaimStatus,
    pub created_at: i64,
    pub voting_deadline: i64, // NEW: voting expires after 48h
    pub bump: u8,
}

impl Claim {
    pub const MAX_SIZE: usize = 32 + 32 + 32 + (4 + 32) + 8 + 32 + (4 + 256) + 2 + 2 + 1 + 8 + 8 + 1;
}

#[account]
pub struct ValidatorNode {
    pub authority: Pubkey,
    pub stake: u64,
    pub claims_voted: u32,
    pub reputation_score: u16,
    pub is_active: bool,
    pub registered_at: i64,
    pub bump: u8,
}

impl ValidatorNode {
    pub const MAX_SIZE: usize = 32 + 8 + 4 + 2 + 1 + 8 + 1;
}

#[account]
pub struct Vote {
    pub claim: Pubkey,
    pub validator: Pubkey,
    pub approve: bool,
    pub voted_at: i64,
    pub bump: u8,
}

impl Vote {
    pub const MAX_SIZE: usize = 32 + 32 + 1 + 8 + 1;
}

// ============ ENUMS ============

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GigCategory {
    RideShare,
    Delivery,
    Freelance,
    Construction,
    Healthcare,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ClaimStatus {
    Pending,
    Approved,
    Rejected,
    Paid,
}

// ============ EVENTS ============

#[event]
pub struct PremiumDeposited {
    pub pool: Pubkey,
    pub worker: Pubkey,
    pub amount: u64,
    pub total_premiums: u64,
}

#[event]
pub struct ClaimSubmitted {
    pub pool: Pubkey,
    pub worker: Pubkey,
    pub amount: u64,
    pub claim: Pubkey,
}

#[event]
pub struct VoteCasted {
    pub claim: Pubkey,
    pub validator: Pubkey,
    pub approve: bool,
    pub votes_for: u16,
    pub votes_against: u16,
}

#[event]
pub struct PayoutWithdrawn {
    pub pool: Pubkey,
    pub worker: Pubkey,
    pub amount: u64,
}

// ============ ERRORS ============

#[error_code]
pub enum GigError {
    #[msg("Invalid premium rate")]
    InvalidPremiumRate,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Pool is inactive")]
    PoolInactive,
    #[msg("Policy is inactive")]
    PolicyInactive,
    #[msg("No premiums paid")]
    NoPremiumsPaid,
    #[msg("Claim exceeds max payout")]
    ClaimExceedsMax,
    #[msg("Claim exceeds premium cap (max 10x premiums paid)")]
    ClaimExceedsPremiumCap,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("Pool ID too long (max 32 chars)")]
    PoolIdTooLong,
    #[msg("Claim is not pending")]
    ClaimNotPending,
    #[msg("Claim not approved")]
    ClaimNotApproved,
    #[msg("Voting period has expired")]
    VotingExpired,
    #[msg("Voting period has not expired yet")]
    VotingNotExpired,
    #[msg("Validator is inactive")]
    ValidatorInactive,
    #[msg("Insufficient stake (min 1 SOL)")]
    InsufficientStake,
    #[msg("Unstake cooldown not met (24h)")]
    UnstakeCooldownNotMet,
    #[msg("Insufficient pool funds")]
    InsufficientPoolFunds,
    #[msg("Unauthorized")]
    Unauthorized,
}
