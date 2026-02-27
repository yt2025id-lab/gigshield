"use client";
import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useGigShield } from "@/lib/useGigShield";
import { GIG_CATEGORIES, lamportsToSol, shortenAddress, getClaimStatusLabel, getPoolPDA, getClaimPDA } from "@/lib/gigshield";

type Tab = "pools" | "claims" | "validate" | "stats";

// SHA-256 evidence hash from text
async function hashEvidence(text: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(text || "no description");
  const buf = await crypto.subtle.digest("SHA-256", encoded.buffer as ArrayBuffer);
  return new Uint8Array(buf);
}

// Format countdown from timestamp (seconds)
function formatCountdown(deadlineSec: number, now: number): { text: string; color: string } {
  const ms = deadlineSec * 1000 - now;
  if (ms <= 0) return { text: "Expired", color: "text-red-400" };
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 12) return { text: `${h}h ${m}m left`, color: "text-green-400" };
  if (h > 3) return { text: `${h}h ${m}m left`, color: "text-yellow-400" };
  return { text: `${h}h ${m}m left`, color: "text-red-400" };
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("pools");
  const [pools, setPools] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [validators, setValidators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myValidator, setMyValidator] = useState<any>(null);
  const [now, setNow] = useState(Date.now());
  const [txStatus, setTxStatus] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  const { connected, publicKey } = useWallet();
  const gs = useGigShield();

  // Update "now" every 30s for countdown timers
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const notify = (msg: string, type: "success" | "error" | "info" = "info") => {
    setTxStatus({ msg, type });
    setTimeout(() => setTxStatus(null), 5000);
  };

  const refresh = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const [p, c, v] = await Promise.all([gs.getPools(), gs.getClaims(), gs.getValidators()]);
      setPools(p);
      setClaims(c);
      setValidators(v);
      const mv = await gs.getMyValidator();
      setMyValidator(mv);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [connected, gs]);

  useEffect(() => { refresh(); }, [refresh]);

  const totalTVL = pools.reduce((s, p) => s + lamportsToSol(p.account.totalDeposits.toNumber()), 0);
  const activePolicies = pools.reduce((s, p) => s + p.account.activePolicies, 0);
  const processedClaims = claims.filter((c) => getClaimStatusLabel(c.account.status) !== "Pending").length;
  const activeValidators = validators.filter((v) => v.account.isActive).length;
  const totalStaked = validators.reduce((s, v) => s + lamportsToSol(v.account.stake.toNumber()), 0);

  const tabs: { id: Tab; label: string }[] = [
    { id: "pools", label: "Pools" },
    { id: "claims", label: "Claims" },
    { id: "validate", label: "Validator" },
    { id: "stats", label: "📊 Stats" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      {/* Toast */}
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
            { label: "Validator Nodes", value: activeValidators },
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
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all -mb-px
              ${tab === t.id ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            {t.label}
          </button>
        ))}
        <button onClick={refresh} className="ml-auto text-gray-500 hover:text-white text-sm px-3 py-2 transition-colors">
          {loading ? "⟳ Loading..." : "⟳ Refresh"}
        </button>
      </div>

      {tab === "pools" && <PoolsTab pools={pools} connected={connected} gs={gs} publicKey={publicKey} notify={notify} refresh={refresh} />}
      {tab === "claims" && <ClaimsTab claims={claims} pools={pools} connected={connected} gs={gs} publicKey={publicKey} myValidator={myValidator} notify={notify} refresh={refresh} now={now} />}
      {tab === "validate" && <ValidateTab myValidator={myValidator} connected={connected} gs={gs} notify={notify} refresh={refresh} />}
      {tab === "stats" && <StatsTab pools={pools} claims={claims} validators={validators} totalTVL={totalTVL} totalStaked={totalStaked} />}

      <footer className="text-center py-8 border-t border-gray-800">
        <p className="text-gray-500 text-sm">
          Built on <span className="text-indigo-400">Solana</span> ·{" "}
          <a href="https://explorer.solana.com/address/4oYtnLRhL2mRfzfXpM7CaC8WUZeAnEdHcAkyDPsmyDYV?cluster=devnet"
            className="text-purple-400 hover:underline" target="_blank" rel="noreferrer">View Contract</a>{" "}
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
    } finally { setSubmitting(false); }
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
    } finally { setSubmitting(false); }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text">Insurance Pools</h2>
        {connected && (
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">+ Create Pool</button>
        )}
      </div>

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

      {pools.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">
          {connected ? "No pools yet. Create the first one!" : "Connect wallet to view pools."}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools.map((p: any) => {
            const cat = p.account.category;
            const icon = GIG_CATEGORIES.find((g) => JSON.stringify(g.value) === JSON.stringify(cat))?.icon ?? "🛡️";
            const claimsPaid = lamportsToSol(p.account.totalClaimsPaid?.toNumber() ?? 0);
            const tvl = lamportsToSol(p.account.totalDeposits.toNumber());
            const utilization = tvl > 0 ? Math.min((claimsPaid / tvl) * 100, 100) : 0;
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
                  <div className="flex justify-between"><span>TVL</span><span className="text-white">{tvl.toFixed(3)} SOL</span></div>
                  <div className="flex justify-between"><span>Policies</span><span className="text-white">{p.account.activePolicies}</span></div>
                  <div className="flex justify-between"><span>Max Payout</span><span className="text-white">{lamportsToSol(p.account.maxPayout.toNumber()).toFixed(2)} SOL</span></div>
                  <div className="flex justify-between"><span>Rate</span><span className="text-white">{(p.account.premiumRateBps / 100).toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>Admin</span><span className="text-white font-mono text-xs">{shortenAddress(p.account.admin.toString())}</span></div>
                </div>
                {/* Utilization bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Pool Utilization</span><span>{utilization.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${utilization}%` }} />
                  </div>
                </div>
                {connected && (
                  <button onClick={() => setDepositModal(p)} className="btn-primary w-full text-sm">Deposit Premium</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {depositModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-lg">Deposit Premium</h3>
            <p className="text-sm text-gray-400">Pool: <span className="text-white">{depositModal.account.poolId}</span></p>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Amount (SOL)</label>
              <input type="number" step="0.001" className="input-field" value={depositAmt}
                onChange={(e) => setDepositAmt(e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">
                Max claim = <span className="text-indigo-400">{(parseFloat(depositAmt || "0") * 10).toFixed(3)} SOL</span> (10x multiplier)
              </p>
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

function ClaimsTab({ claims, pools, connected, gs, publicKey, myValidator, notify, refresh, now }: any) {
  const [showSubmit, setShowSubmit] = useState(false);
  const [form, setForm] = useState({ poolIdx: 0, claimId: "", amountSol: "0.1", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitClaim = async () => {
    if (!connected || pools.length === 0) return notify("Connect wallet and ensure pools exist", "error");
    if (!form.description.trim()) return notify("Evidence description is required", "error");
    setSubmitting(true);
    try {
      const pool = pools[form.poolIdx];
      // SHA-256 hash the description — proof of evidence without revealing content on-chain
      const evidenceHash = await hashEvidence(form.description);
      const claimId = form.claimId || `claim-${Date.now()}`;

      const tx = await gs.submitClaim(
        new PublicKey(pool.account.admin),
        pool.account.poolId,
        claimId,
        parseFloat(form.amountSol),
        form.description,
        evidenceHash
      );

      // Cache evidence in localStorage so validators can view it
      const [poolPDA] = getPoolPDA(new PublicKey(pool.account.admin), pool.account.poolId);
      const [claimPDA] = getClaimPDA(poolPDA, claimId);
      localStorage.setItem(`gs:evidence:${claimPDA.toString()}`, form.description);

      notify(`Claim submitted! TX: ${tx.slice(0, 16)}...`, "success");
      setShowSubmit(false);
      setForm({ poolIdx: 0, claimId: "", amountSol: "0.1", description: "" });
      await refresh();
    } catch (e: any) {
      notify(e.message?.includes("0x1796") ? "Claim exceeds 10x premium cap" : e.message || "Failed", "error");
    } finally { setSubmitting(false); }
  };

  const handleVote = async (claim: any, approve: boolean) => {
    if (!connected || !myValidator) return notify("You must be a registered validator to vote", "error");
    setSubmitting(true);
    try {
      const pool = pools.find((p: any) => p.publicKey.equals(claim.account.pool));
      if (!pool) return notify("Pool not found", "error");
      const tx = await gs.voteClaim(new PublicKey(pool.account.admin), pool.account.poolId, claim.account.claimId, approve);
      notify(`Voted ${approve ? "✓ Approve" : "✗ Reject"}! TX: ${tx.slice(0, 16)}...`, "success");
      await refresh();
    } catch (e: any) {
      notify(e.message?.includes("already in use") ? "You already voted on this claim" : e.message || "Failed", "error");
    } finally { setSubmitting(false); }
  };

  const handleWithdraw = async (claim: any) => {
    if (!connected) return notify("Connect wallet", "error");
    setSubmitting(true);
    try {
      const pool = pools.find((p: any) => p.publicKey.equals(claim.account.pool));
      if (!pool) return notify("Pool not found", "error");
      const tx = await gs.withdrawPayout(new PublicKey(pool.account.admin), pool.account.poolId, claim.account.claimId);
      notify(`Payout withdrawn! TX: ${tx.slice(0, 16)}...`, "success");
      await refresh();
    } catch (e: any) {
      notify(e.message || "Failed", "error");
    } finally { setSubmitting(false); }
  };

  const statusColor: Record<string, string> = {
    Pending: "bg-yellow-500/20 text-yellow-400",
    Approved: "bg-green-500/20 text-green-400",
    Rejected: "bg-red-500/20 text-red-400",
    Paid: "bg-blue-500/20 text-blue-400",
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text">Claims</h2>
        {connected && (
          <button onClick={() => setShowSubmit(!showSubmit)} className="btn-primary text-sm">+ Submit Claim</button>
        )}
      </div>

      {showSubmit && (
        <div className="card space-y-4 border-indigo-500/30">
          <h3 className="font-semibold text-lg">Submit Insurance Claim</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Pool</label>
              <select className="input-field" value={form.poolIdx}
                onChange={(e) => setForm({ ...form, poolIdx: +e.target.value })}>
                {pools.map((p: any, i: number) => <option key={i} value={i}>{p.account.poolId}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Claim ID (optional, auto-generated)</label>
              <input className="input-field" placeholder={`claim-${Date.now()}`} value={form.claimId}
                onChange={(e) => setForm({ ...form, claimId: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Amount (SOL)</label>
              <input type="number" step="0.01" className="input-field" value={form.amountSol}
                onChange={(e) => setForm({ ...form, amountSol: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">
                Evidence Description <span className="text-red-400">*</span>
                <span className="ml-2 text-gray-600">(SHA-256 fingerprint stored on-chain)</span>
              </label>
              <textarea rows={3} className="input-field resize-none"
                placeholder="Describe what happened in detail. This will be hashed and verified on-chain. Validators will review this evidence before voting."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
              {form.description && (
                <p className="text-xs text-green-500 mt-1">
                  ✓ Evidence will be SHA-256 hashed and anchored on-chain
                </p>
              )}
            </div>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <p className="text-xs text-indigo-400">
              💡 <strong>5% protocol fee</strong> applies to approved payouts. Your net payout for {form.amountSol} SOL = {(parseFloat(form.amountSol || "0") * 0.95).toFixed(3)} SOL
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSubmitClaim} disabled={submitting} className="btn-primary text-sm">
              {submitting ? "Submitting..." : "Submit Claim"}
            </button>
            <button onClick={() => setShowSubmit(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

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
            const deadlineSec = c.account.votingDeadline?.toNumber() ?? 0;
            const countdown = formatCountdown(deadlineSec, now);
            const votesFor = c.account.votesFor ?? 0;
            const votesAgainst = c.account.votesAgainst ?? 0;
            const totalVotes = votesFor + votesAgainst;
            const claimAmt = lamportsToSol(c.account.amount.toNumber());

            // Try to retrieve evidence from localStorage (submitted on this browser)
            const evidenceFromStorage = typeof window !== "undefined"
              ? localStorage.getItem(`gs:evidence:${c.publicKey.toString()}`) : null;
            const evidenceText = evidenceFromStorage || c.account.description;

            return (
              <div key={c.publicKey.toString()} className="card space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{c.account.claimId}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Worker: {shortenAddress(c.account.worker.toString())}
                    </p>
                    {evidenceText && (
                      <div className="mt-2 p-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                        <p className="text-xs text-gray-500 mb-1">📋 Evidence (SHA-256 verified on-chain):</p>
                        <p className="text-sm text-gray-300 break-words">{evidenceText}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-lg">{claimAmt.toFixed(3)} SOL</p>
                    <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${statusColor[status] || "bg-gray-500/20 text-gray-400"}`}>
                      {status}
                    </span>
                  </div>
                </div>

                {/* Vote Progress + Countdown */}
                {isPending && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        Votes: <span className="text-green-400">{votesFor} approve</span>
                        {" · "}
                        <span className="text-red-400">{votesAgainst} reject</span>
                        {" · "}
                        <span className="text-gray-500">{Math.max(0, 2 - votesFor)} more needed for approval</span>
                      </span>
                      <span className={`font-medium ${countdown.color}`}>⏱ {countdown.text}</span>
                    </div>
                    {/* Visual vote dots */}
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className={`h-2 flex-1 rounded-full transition-all
                          ${i < votesFor ? "bg-green-500" :
                            i < totalVotes ? "bg-red-500" :
                            "bg-gray-700"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">Need 2/3 validator consensus to resolve</p>
                  </div>
                )}

                {/* Payout info for approved claims */}
                {status === "Approved" && (
                  <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-xs text-green-400">
                      ✓ Approved · Net payout: <strong>{(claimAmt * 0.95).toFixed(3)} SOL</strong>
                      <span className="text-gray-500 ml-1">(5% protocol fee deducted)</span>
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {isPending && myValidator && countdown.text !== "Expired" && (
                    <>
                      <button onClick={() => handleVote(c, true)} disabled={submitting}
                        className="btn-primary text-xs py-1.5 px-3">✓ Approve</button>
                      <button onClick={() => handleVote(c, false)} disabled={submitting}
                        className="btn-secondary text-xs py-1.5 px-3">✗ Reject</button>
                    </>
                  )}
                  {isMyClaimApproved && (
                    <button onClick={() => handleWithdraw(c)} disabled={submitting}
                      className="btn-primary text-xs py-1.5 px-3">
                      💸 Withdraw {(claimAmt * 0.95).toFixed(3)} SOL
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
    } finally { setSubmitting(false); }
  };

  const handleUnstake = async () => {
    if (!connected) return notify("Connect wallet first", "error");
    setSubmitting(true);
    try {
      const tx = await gs.unstakeValidator();
      notify(`Unstaked! TX: ${tx.slice(0, 16)}...`, "success");
      await refresh();
    } catch (e: any) {
      notify(e.message?.includes("6015") || e.message?.includes("0x17EF") ? "24h cooldown not met yet" : e.message || "Failed", "error");
    } finally { setSubmitting(false); }
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold gradient-text">Validator Node</h2>

      {myValidator && (
        <div className="card border-green-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-lg">✓</div>
            <div>
              <p className="font-semibold text-green-400">Active Validator</p>
              <p className="text-sm text-gray-400">You are a registered validator node</p>
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
          {/* Reputation bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Reputation Score</span><span>{myValidator.reputationScore}/200</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${Math.min((myValidator.reputationScore / 200) * 100, 100)}%` }} />
            </div>
          </div>
          <button onClick={handleUnstake} disabled={submitting} className="btn-secondary text-sm">
            {submitting ? "Unstaking..." : "Unstake (24h cooldown enforced)"}
          </button>
        </div>
      )}

      {!myValidator && (
        <div className="card space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Become a Validator</h3>
            <p className="text-gray-400 text-sm">Stake SOL to vote on claims. Gain reputation for accurate decisions. Help protect gig workers on Solana.</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Min Stake", value: "1 SOL" },
              { label: "Reputation Reward", value: "+5 / claim" },
              { label: "Consensus Needed", value: "2 of 3" },
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

      <div className="card space-y-4">
        <h3 className="font-semibold">How Claim Validation Works</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          {[
            { step: "1", title: "Claim Submitted", desc: "Worker submits claim with SHA-256 evidence fingerprint and description stored on-chain" },
            { step: "2", title: "Validators Review", desc: "3+ validators read the evidence and vote approve/reject within 48h window" },
            { step: "3", title: "2/3 Consensus", desc: "Supermajority determines outcome. Accurate voters earn +5 reputation. 5% fee funds the protocol treasury." },
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

// ======================== STATS TAB ========================

function StatsTab({ pools, claims, validators, totalTVL, totalStaked }: any) {
  const approvedClaims = claims.filter((c: any) => {
    const s = getClaimStatusLabel(c.account.status);
    return s === "Approved" || s === "Paid";
  }).length;
  const pendingClaims = claims.filter((c: any) => getClaimStatusLabel(c.account.status) === "Pending").length;
  const approvalRate = claims.length > 0 ? ((approvedClaims / claims.length) * 100).toFixed(0) : "—";

  const sortedValidators = [...validators].sort((a, b) =>
    b.account.reputationScore - a.account.reputationScore
  );
  const sortedPools = [...pools].sort((a, b) =>
    b.account.totalDeposits.toNumber() - a.account.totalDeposits.toNumber()
  );

  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold gradient-text">Protocol Statistics</h2>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Value Locked", value: `${totalTVL.toFixed(3)} SOL`, icon: "💰" },
          { label: "Validator Stakes", value: `${totalStaked.toFixed(1)} SOL`, icon: "🔒" },
          { label: "Claim Approval Rate", value: `${approvalRate}%`, icon: "✅" },
          { label: "Pending Claims", value: pendingClaims, icon: "⏳" },
        ].map((s) => (
          <div key={s.label} className="card text-center space-y-1">
            <p className="text-2xl">{s.icon}</p>
            <p className="text-xl font-bold gradient-text">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Validator Leaderboard */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">🏆 Validator Leaderboard</h3>
          <span className="text-xs text-gray-500">{validators.length} registered</span>
        </div>
        {sortedValidators.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No validators yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {sortedValidators.map((v: any, i: number) => {
              const rep = v.account.reputationScore;
              const stake = lamportsToSol(v.account.stake.toNumber());
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
              return (
                <div key={v.publicKey.toString()}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition-colors
                    ${i === 0 ? "bg-yellow-500/5 border-yellow-500/20" :
                      i === 1 ? "bg-gray-500/5 border-gray-500/20" :
                      "bg-gray-800/30 border-gray-700/30"}`}>
                  <span className="text-xl w-8 text-center">{medal}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-gray-400 truncate">{shortenAddress(v.account.authority.toString())}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 bg-gray-700 rounded-full flex-1 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          style={{ width: `${Math.min((rep / 200) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{rep} rep</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{stake.toFixed(1)} SOL</p>
                    <p className="text-xs text-gray-500">{v.account.claimsVoted} voted</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${v.account.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                    {v.account.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pool Rankings */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">🏊 Pool Rankings by TVL</h3>
          <span className="text-xs text-gray-500">{pools.length} pools</span>
        </div>
        {sortedPools.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No pools yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2 pr-4">Pool</th>
                  <th className="text-right py-2 pr-4">TVL</th>
                  <th className="text-right py-2 pr-4">Policies</th>
                  <th className="text-right py-2 pr-4">Max Payout</th>
                  <th className="text-right py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {sortedPools.map((p: any) => {
                  const cat = p.account.category;
                  const icon = GIG_CATEGORIES.find((g) => JSON.stringify(g.value) === JSON.stringify(cat))?.icon ?? "🛡️";
                  return (
                    <tr key={p.publicKey.toString()} className="hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span>{icon}</span>
                          <div>
                            <p className="font-medium">{p.account.poolId}</p>
                            <p className="text-xs text-gray-500">{(p.account.premiumRateBps / 100).toFixed(1)}% premium rate</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 pr-4 font-semibold">
                        {lamportsToSol(p.account.totalDeposits.toNumber()).toFixed(3)} SOL
                      </td>
                      <td className="text-right py-3 pr-4 text-gray-300">{p.account.activePolicies}</td>
                      <td className="text-right py-3 pr-4 text-gray-300">
                        {lamportsToSol(p.account.maxPayout.toNumber()).toFixed(2)} SOL
                      </td>
                      <td className="text-right py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.account.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {p.account.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Protocol Economics */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-lg">⚙️ Protocol Economics</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          {[
            { label: "Protocol Fee", value: "5%", desc: "Collected from each approved payout into the protocol treasury" },
            { label: "Claim Cap", value: "10×", desc: "Max payout = 10× total premiums paid by the worker" },
            { label: "Validator Stake", value: "≥ 1 SOL", desc: "Minimum stake required to participate as a validator node" },
          ].map((s) => (
            <div key={s.label} className="bg-dark-900 rounded-xl p-4">
              <p className="text-2xl font-bold gradient-text mb-1">{s.value}</p>
              <p className="font-semibold text-white mb-1">{s.label}</p>
              <p className="text-gray-400 text-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
