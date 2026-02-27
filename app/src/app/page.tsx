"use client";
import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useGigShield } from "@/lib/useGigShield";
import { GIG_CATEGORIES, lamportsToSol, shortenAddress, getClaimStatusLabel } from "@/lib/gigshield";

type Tab = "pools" | "claims" | "validate";

export default function Home() {
  const [tab, setTab] = useState<Tab>("pools");
  const [pools, setPools] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [myValidator, setMyValidator] = useState<any>(null);

  const { connected, publicKey } = useWallet();
  const gs = useGigShield();

  const notify = (msg: string, type: "success" | "error" | "info" = "info") => {
    setTxStatus({ msg, type });
    setTimeout(() => setTxStatus(null), 5000);
  };

  const refresh = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const [p, c] = await Promise.all([gs.getPools(), gs.getClaims()]);
      setPools(p);
      setClaims(c);
      const v = await gs.getMyValidator();
      setMyValidator(v);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [connected, gs]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalTVL = pools.reduce((s, p) => s + lamportsToSol(p.account.totalDeposits.toNumber()), 0);
  const activePolicies = pools.reduce((s, p) => s + p.account.activePolicies, 0);
  const processedClaims = claims.filter((c) => getClaimStatusLabel(c.account.status) !== "Pending").length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">

      {/* Tx Status Toast */}
      {txStatus && (
        <div className={`fixed top-24 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border transition-all
          ${txStatus.type === "success" ? "bg-green-900/80 border-green-500/50 text-green-300" :
            txStatus.type === "error" ? "bg-red-900/80 border-red-500/50 text-red-300" :
            "bg-indigo-900/80 border-indigo-500/50 text-indigo-300"}`}>
          {txStatus.msg}
        </div>
      )}

      {/* Hero */}
      <section className="text-center py-12">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 text-indigo-400 text-sm mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Live on Solana Devnet
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Micro-Insurance for the{" "}
          <span className="gradient-text">Gig Economy</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          Pay as little as 0.001 SOL per gig. Get covered instantly.
          Claims validated by decentralized validator nodes on Solana.
        </p>

        {!connected && (
          <p className="text-yellow-400 text-sm mb-4">↑ Connect your wallet to interact</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-3xl mx-auto">
          {[
            { label: "Total Value Locked", value: `${totalTVL.toFixed(2)} SOL` },
            { label: "Active Policies", value: activePolicies.toLocaleString() },
            { label: "Claims Processed", value: processedClaims },
            { label: "Validator Nodes", value: myValidator ? "1+" : "0" },
          ].map((s) => (
            <div key={s.label} className="card text-center">
              <p className="text-2xl font-bold gradient-text">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-0">
        {(["pools", "claims", "validate"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-semibold capitalize border-b-2 transition-all -mb-px
              ${tab === t ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            {t === "validate" ? "Validator" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <button onClick={refresh} className="ml-auto text-gray-500 hover:text-white text-sm px-3 py-2 transition-colors">
          {loading ? "⟳ Loading..." : "⟳ Refresh"}
        </button>
      </div>

      {/* Tab Content */}
      {tab === "pools" && (
        <PoolsTab pools={pools} connected={connected} gs={gs} publicKey={publicKey} notify={notify} refresh={refresh} />
      )}
      {tab === "claims" && (
        <ClaimsTab claims={claims} pools={pools} connected={connected} gs={gs} publicKey={publicKey} myValidator={myValidator} notify={notify} refresh={refresh} />
      )}
      {tab === "validate" && (
        <ValidateTab myValidator={myValidator} connected={connected} gs={gs} notify={notify} refresh={refresh} />
      )}

      <footer className="text-center py-8 border-t border-gray-800">
        <p className="text-gray-500 text-sm">
          Built on <span className="text-indigo-400">Solana</span> ·{" "}
          <a href="https://explorer.solana.com/address/4oYtnLRhL2mRfzfXpM7CaC8WUZeAnEdHcAkyDPsmyDYV?cluster=devnet"
            className="text-purple-400 hover:underline" target="_blank" rel="noreferrer">
            View Contract
          </a>{" "}
          · GigShield Hackathon 2026
        </p>
      </footer>
    </div>
  );
}

// ======================== POOLS TAB ========================

function PoolsTab({ pools, connected, gs, notify, refresh }: any) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ poolId: "", category: 0, premiumRateBps: 100, maxPayout: 5 });
  const [depositModal, setDepositModal] = useState<any>(null);
  const [depositAmt, setDepositAmt] = useState("0.001");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!connected) return notify("Connect wallet first", "error");
    setSubmitting(true);
    try {
      const cat = GIG_CATEGORIES[form.category].value;
      const tx = await gs.createPool(form.poolId, cat, form.premiumRateBps, form.maxPayout);
      notify(`Pool created! TX: ${tx.slice(0, 16)}...`, "success");
      setShowCreate(false);
      await refresh();
    } catch (e: any) {
      notify(e.message || "Transaction failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositModal || !connected) return;
    setSubmitting(true);
    try {
      const tx = await gs.depositPremium(
        new PublicKey(depositModal.account.admin),
        depositModal.account.poolId,
        parseFloat(depositAmt)
      );
      notify(`Premium deposited! TX: ${tx.slice(0, 16)}...`, "success");
      setDepositModal(null);
      await refresh();
    } catch (e: any) {
      notify(e.message || "Transaction failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="pools" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text">Insurance Pools</h2>
        {connected && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">
            + Create Pool
          </button>
        )}
      </div>

      {/* Create Pool Form */}
      {showCreate && (
        <div className="card space-y-4 border-indigo-500/30">
          <h3 className="font-semibold text-lg">Create New Pool</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Pool ID (unique name)</label>
              <input className="input-field" placeholder="e.g. rideshare-2026" value={form.poolId}
                onChange={(e) => setForm({ ...form, poolId: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select className="input-field" value={form.category}
                onChange={(e) => setForm({ ...form, category: +e.target.value })}>
                {GIG_CATEGORIES.map((c, i) => <option key={i} value={i}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Premium Rate (bps, 100 = 1%)</label>
              <input type="number" className="input-field" value={form.premiumRateBps}
                onChange={(e) => setForm({ ...form, premiumRateBps: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Max Payout (SOL)</label>
              <input type="number" className="input-field" value={form.maxPayout}
                onChange={(e) => setForm({ ...form, maxPayout: +e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={submitting} className="btn-primary text-sm">
              {submitting ? "Creating..." : "Create Pool"}
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Pool List */}
      {pools.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">
          {connected ? "No pools yet. Create the first one!" : "Connect wallet to view pools."}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools.map((p: any) => {
            const cat = p.account.category;
            const icon = GIG_CATEGORIES.find((g) => JSON.stringify(g.value) === JSON.stringify(cat))?.icon ?? "🛡️";
            return (
              <div key={p.publicKey.toString()} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{icon}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.account.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {p.account.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className="font-semibold">{p.account.poolId}</h3>
                <div className="space-y-1 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>TVL</span>
                    <span className="text-white">{lamportsToSol(p.account.totalDeposits.toNumber()).toFixed(3)} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Policies</span>
                    <span className="text-white">{p.account.activePolicies}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Payout</span>
                    <span className="text-white">{lamportsToSol(p.account.maxPayout.toNumber()).toFixed(2)} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Admin</span>
                    <span className="text-white font-mono text-xs">{shortenAddress(p.account.admin.toString())}</span>
                  </div>
                </div>
                {connected && (
                  <button onClick={() => setDepositModal(p)} className="btn-primary w-full text-sm">
                    Deposit Premium
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Deposit Modal */}
      {depositModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-lg">Deposit Premium</h3>
            <p className="text-sm text-gray-400">Pool: <span className="text-white">{depositModal.account.poolId}</span></p>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Amount (SOL)</label>
              <input type="number" step="0.001" className="input-field" value={depositAmt}
                onChange={(e) => setDepositAmt(e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">Max claim = {(parseFloat(depositAmt || "0") * 10).toFixed(3)} SOL (10x multiplier)</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDeposit} disabled={submitting} className="btn-primary flex-1 text-sm">
                {submitting ? "Depositing..." : "Confirm Deposit"}
              </button>
              <button onClick={() => setDepositModal(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ======================== CLAIMS TAB ========================

function ClaimsTab({ claims, pools, connected, gs, publicKey, myValidator, notify, refresh }: any) {
  const [showSubmit, setShowSubmit] = useState(false);
  const [form, setForm] = useState({ poolIdx: 0, claimId: "", amountSol: "0.1", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitClaim = async () => {
    if (!connected || pools.length === 0) return notify("Connect wallet and ensure pools exist", "error");
    setSubmitting(true);
    try {
      const pool = pools[form.poolIdx];
      const evidenceHash = new Uint8Array(32);
      crypto.getRandomValues(evidenceHash);
      const tx = await gs.submitClaim(
        new PublicKey(pool.account.admin),
        pool.account.poolId,
        form.claimId || `claim-${Date.now()}`,
        parseFloat(form.amountSol),
        form.description,
        evidenceHash
      );
      notify(`Claim submitted! TX: ${tx.slice(0, 16)}...`, "success");
      setShowSubmit(false);
      await refresh();
    } catch (e: any) {
      notify(e.message?.includes("0x1796") ? "Claim exceeds 10x premium cap" : e.message || "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (claim: any, approve: boolean) => {
    if (!connected || !myValidator) return notify("You must be a registered validator to vote", "error");
    setSubmitting(true);
    try {
      const pool = pools.find((p: any) => p.publicKey.equals(claim.account.pool));
      if (!pool) return notify("Pool not found", "error");
      const tx = await gs.voteClaim(
        new PublicKey(pool.account.admin),
        pool.account.poolId,
        claim.account.claimId,
        approve
      );
      notify(`Voted ${approve ? "Approve" : "Reject"}! TX: ${tx.slice(0, 16)}...`, "success");
      await refresh();
    } catch (e: any) {
      notify(e.message || "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (claim: any) => {
    if (!connected) return notify("Connect wallet", "error");
    setSubmitting(true);
    try {
      const pool = pools.find((p: any) => p.publicKey.equals(claim.account.pool));
      if (!pool) return notify("Pool not found", "error");
      const tx = await gs.withdrawPayout(
        new PublicKey(pool.account.admin),
        pool.account.poolId,
        claim.account.claimId
      );
      notify(`Payout withdrawn! TX: ${tx.slice(0, 16)}...`, "success");
      await refresh();
    } catch (e: any) {
      notify(e.message || "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor: Record<string, string> = {
    Pending: "bg-yellow-500/20 text-yellow-400",
    Approved: "bg-green-500/20 text-green-400",
    Rejected: "bg-red-500/20 text-red-400",
    Paid: "bg-blue-500/20 text-blue-400",
  };

  return (
    <section id="claims" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text">Claims</h2>
        {connected && (
          <button onClick={() => setShowSubmit(!showSubmit)} className="btn-primary text-sm">
            + Submit Claim
          </button>
        )}
      </div>

      {/* Submit Claim Form */}
      {showSubmit && (
        <div className="card space-y-4 border-indigo-500/30">
          <h3 className="font-semibold text-lg">Submit Insurance Claim</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Pool</label>
              <select className="input-field" value={form.poolIdx}
                onChange={(e) => setForm({ ...form, poolIdx: +e.target.value })}>
                {pools.map((p: any, i: number) => (
                  <option key={i} value={i}>{p.account.poolId}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Claim ID (unique)</label>
              <input className="input-field" placeholder={`claim-${Date.now()}`} value={form.claimId}
                onChange={(e) => setForm({ ...form, claimId: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Amount (SOL)</label>
              <input type="number" step="0.01" className="input-field" value={form.amountSol}
                onChange={(e) => setForm({ ...form, amountSol: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Description (max 256 chars)</label>
              <input className="input-field" placeholder="Describe what happened..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSubmitClaim} disabled={submitting} className="btn-primary text-sm">
              {submitting ? "Submitting..." : "Submit Claim"}
            </button>
            <button onClick={() => setShowSubmit(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Claims List */}
      {claims.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">
          {connected ? "No claims yet." : "Connect wallet to view claims."}
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((c: any) => {
            const status = getClaimStatusLabel(c.account.status);
            const isMyClaimApproved = status === "Approved" && publicKey?.equals(c.account.worker);
            const isPending = status === "Pending";
            const deadline = new Date(c.account.votingDeadline.toNumber() * 1000);
            const isExpired = deadline < new Date();

            return (
              <div key={c.publicKey.toString()} className="card space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{c.account.claimId}</p>
                    <p className="text-sm text-gray-500">Worker: {shortenAddress(c.account.worker.toString())}</p>
                    <p className="text-sm text-gray-400 mt-1">{c.account.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{lamportsToSol(c.account.amount.toNumber()).toFixed(3)} SOL</p>
                    <p className="text-sm text-gray-500">
                      Votes: {c.account.votesFor}✓ / {c.account.votesAgainst}✗
                    </p>
                    <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${statusColor[status] || "bg-gray-500/20 text-gray-400"}`}>
                      {status}
                    </span>
                  </div>
                </div>

                {isPending && !isExpired && (
                  <p className="text-xs text-gray-500">Voting deadline: {deadline.toLocaleString()}</p>
                )}
                {isPending && isExpired && (
                  <p className="text-xs text-yellow-500">⚠ Voting expired</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {isPending && myValidator && (
                    <>
                      <button onClick={() => handleVote(c, true)} disabled={submitting} className="btn-primary text-xs py-1.5 px-3">
                        ✓ Approve
                      </button>
                      <button onClick={() => handleVote(c, false)} disabled={submitting} className="btn-secondary text-xs py-1.5 px-3">
                        ✗ Reject
                      </button>
                    </>
                  )}
                  {isMyClaimApproved && (
                    <button onClick={() => handleWithdraw(c)} disabled={submitting} className="btn-primary text-xs py-1.5 px-3">
                      💸 Withdraw Payout
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ======================== VALIDATE TAB ========================

function ValidateTab({ myValidator, connected, gs, notify, refresh }: any) {
  const [stakeAmt, setStakeAmt] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!connected) return notify("Connect wallet first", "error");
    setSubmitting(true);
    try {
      const tx = await gs.registerValidator(parseFloat(stakeAmt));
      notify(`Registered as validator! TX: ${tx.slice(0, 16)}...`, "success");
      await refresh();
    } catch (e: any) {
      notify(e.message || "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnstake = async () => {
    if (!connected) return notify("Connect wallet first", "error");
    setSubmitting(true);
    try {
      const tx = await gs.unstakeValidator();
      notify(`Unstaked! TX: ${tx.slice(0, 16)}...`, "success");
      await refresh();
    } catch (e: any) {
      notify(e.message?.includes("0x1790") ? "24h cooldown not met" : e.message || "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="validate" className="space-y-6">
      <h2 className="text-2xl font-bold gradient-text">Validator Node</h2>

      {/* My Validator Status */}
      {myValidator && (
        <div className="card border-green-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-lg">✓</div>
            <div>
              <p className="font-semibold text-green-400">Active Validator</p>
              <p className="text-sm text-gray-400">You are registered as a validator</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-dark-900 rounded-xl p-4 text-center">
              <p className="text-xl font-bold gradient-text">{lamportsToSol(myValidator.stake.toNumber()).toFixed(1)} SOL</p>
              <p className="text-xs text-gray-500">Staked</p>
            </div>
            <div className="bg-dark-900 rounded-xl p-4 text-center">
              <p className="text-xl font-bold gradient-text">{myValidator.reputationScore}</p>
              <p className="text-xs text-gray-500">Reputation</p>
            </div>
            <div className="bg-dark-900 rounded-xl p-4 text-center">
              <p className="text-xl font-bold gradient-text">{myValidator.claimsVoted}</p>
              <p className="text-xs text-gray-500">Claims Voted</p>
            </div>
          </div>
          <button onClick={handleUnstake} disabled={submitting} className="btn-secondary text-sm">
            {submitting ? "Unstaking..." : "Unstake (24h cooldown)"}
          </button>
        </div>
      )}

      {/* Register Form */}
      {!myValidator && (
        <div className="card space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Become a Validator</h3>
            <p className="text-gray-400 text-sm">Stake SOL to vote on claims. Earn reputation for accurate votes. Minimum 1 SOL stake.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Min Stake", value: "1 SOL" },
              { label: "Voting Power", value: "1 vote / claim" },
              { label: "Cooldown", value: "24h unstake" },
            ].map((s) => (
              <div key={s.label} className="bg-dark-900 rounded-xl p-4 text-center">
                <p className="text-lg font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Stake Amount (SOL, min 1)</label>
              <input type="number" step="0.1" min="1" className="input-field max-w-xs" value={stakeAmt}
                onChange={(e) => setStakeAmt(e.target.value)} />
            </div>
            {connected ? (
              <button onClick={handleRegister} disabled={submitting} className="btn-primary">
                {submitting ? "Registering..." : `Register as Validator (Stake ${stakeAmt} SOL)`}
              </button>
            ) : (
              <p className="text-yellow-400 text-sm">Connect wallet to register</p>
            )}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="card space-y-4">
        <h3 className="font-semibold">How Claim Validation Works</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          {[
            { step: "1", title: "Claim Submitted", desc: "Worker submits claim with evidence hash + description" },
            { step: "2", title: "Validators Vote", desc: "3+ validators vote approve/reject within 48h window" },
            { step: "3", title: "2/3 Consensus", desc: "2/3 majority determines outcome. Accurate voters gain reputation." },
          ].map((s) => (
            <div key={s.step} className="bg-dark-900 rounded-xl p-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center mb-2">{s.step}</div>
              <p className="font-semibold mb-1">{s.title}</p>
              <p className="text-gray-400 text-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
