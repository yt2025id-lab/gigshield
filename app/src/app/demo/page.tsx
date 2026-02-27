"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Characters ───────────────────────────────────────────────────────────────

const CHARS = {
  ahmad: {
    emoji: "🚴",
    name: "Ahmad Rizki",
    age: 28,
    role: "Delivery Driver",
    city: "Surabaya, Indonesia",
    color: "indigo",
    wallet: "7xKp...m9Wq",
  },
  siti: {
    emoji: "🛡️",
    name: "Siti Rahayu",
    age: 32,
    role: "GigShield Validator #1",
    city: "Jakarta, Indonesia",
    color: "purple",
    wallet: "3nFt...b2Hs",
    stake: "1.0 SOL",
    rep: 120,
  },
  budi: {
    emoji: "⚡",
    name: "Budi Santoso",
    age: 45,
    role: "GigShield Validator #2",
    city: "Bandung, Indonesia",
    color: "purple",
    wallet: "9pRw...v5Jd",
    stake: "1.5 SOL",
    rep: 105,
  },
};

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    actor: "ahmad",
    phase: "👤 Meet Ahmad",
    title: "A Day in the Life of a Gig Worker",
    quote: "I do 15–20 deliveries a day. Last month, a customer claimed they never received the package — and ShopeeExpress blamed me. I lost 3 days' income with zero protection. There's no insurance for people like me.",
    ui: {
      type: "profile",
      label: "Ahmad's Situation",
      lines: [
        { k: "Job", v: "Delivery driver (freelance)" },
        { k: "Income", v: "~Rp 2.5 jt / month" },
        { k: "Insurance", v: "❌ None" },
        { k: "Risk", v: "Package loss, accidents, fraud" },
        { k: "Solana Wallet", v: "5.200 SOL" },
      ],
    },
    toast: null,
    tx: null,
  },
  {
    id: 2,
    actor: "ahmad",
    phase: "🔗 Step 1",
    title: "Ahmad Discovers GigShield",
    quote: "A friend told me about GigShield. I opened the app and connected my Phantom wallet. It took 3 seconds.",
    ui: {
      type: "wallet-connect",
      label: "Connecting Wallet",
      lines: [
        { k: "App", v: "gigshield.vercel.app" },
        { k: "Wallet", v: "Phantom" },
        { k: "Network", v: "Solana Devnet" },
        { k: "Address", v: "7xKp...m9Wq" },
        { k: "Balance", v: "5.200 SOL ✓" },
      ],
    },
    toast: "✅ Wallet connected!",
    tx: null,
  },
  {
    id: 3,
    actor: "ahmad",
    phase: "🏊 Step 2",
    title: "Browse Insurance Pools",
    quote: "I saw the 📦 Delivery pool — 1% premium rate, max payout 2 SOL. 14 other delivery workers are already insured here. I found my pool.",
    ui: {
      type: "pool-card",
      label: "📦 Delivery Pool",
      lines: [
        { k: "Category", v: "📦 Delivery" },
        { k: "Premium Rate", v: "1% per gig" },
        { k: "Max Payout", v: "2.000 SOL" },
        { k: "TVL", v: "0.280 SOL" },
        { k: "Active Policies", v: "14 workers" },
        { k: "Status", v: "🟢 Active" },
      ],
    },
    toast: null,
    tx: null,
  },
  {
    id: 4,
    actor: "ahmad",
    phase: "💳 Step 3",
    title: "Pay Micro-Premium — Get Covered",
    quote: "Before starting my delivery route today, I deposited 0.002 SOL — that's less than Rp 300. My policy activated instantly. For the first time ever, I'm insured for this gig.",
    ui: {
      type: "tx",
      label: "Premium Deposited",
      lines: [
        { k: "Amount", v: "0.002 SOL" },
        { k: "Pool", v: "📦 Delivery" },
        { k: "Coverage", v: "Up to 0.020 SOL (10×)" },
        { k: "Policy Status", v: "🟢 Active" },
        { k: "TX", v: "3xK9mP...f7Qw2r ✓" },
        { k: "New Balance", v: "5.198 SOL" },
      ],
    },
    toast: "🟢 Coverage active — Ahmad is insured!",
    tx: "3xK9mP...f7Qw2r",
  },
  {
    id: 5,
    actor: "ahmad",
    phase: "⚠️ Step 4",
    title: "Incident — Package Stolen",
    quote: "At 3:47 PM, I delivered a package to Jl. Raya Gubeng No. 12. The customer opened the door, took the package, then reported it 'not received' to ShopeeExpress. I submitted a claim with full evidence.",
    ui: {
      type: "claim",
      label: "Claim Submitted",
      lines: [
        { k: "Claim ID", v: "claim-4821" },
        { k: "Amount", v: "0.010 SOL" },
        { k: "Description", v: '"Package #SP-4821 delivered at 15:47. Customer confirmed receipt but reported missing. GPS log + photo attached."' },
        { k: "Evidence SHA-256", v: "a3f2c8...9d71e4 ✓" },
        { k: "Voting Deadline", v: "48 hours" },
        { k: "TX", v: "7tR2nX...k3Lp9s ✓" },
      ],
    },
    toast: "📋 Claim anchored on-chain — evidence fingerprinted!",
    tx: "7tR2nX...k3Lp9s",
  },
  {
    id: 6,
    actor: "siti",
    phase: "🗳️ Step 5",
    title: "Validator Siti Reviews the Claim",
    quote: "I received a notification about Ahmad's claim. I read his evidence — GPS coordinates matched the delivery address, photo timestamp is consistent. This looks legitimate. I vote Approve.",
    ui: {
      type: "vote",
      label: "Siti's Vote",
      lines: [
        { k: "Validator", v: "Siti Rahayu (7xFt...b2Hs)" },
        { k: "Stake", v: "1.0 SOL" },
        { k: "Reputation", v: "120 pts" },
        { k: "Evidence Reviewed", v: "✓ GPS log + photo" },
        { k: "Decision", v: "✅ APPROVE" },
        { k: "Vote Tally", v: "1 approve / 0 reject" },
        { k: "TX", v: "5gH8vY...m1Nq4t ✓" },
      ],
    },
    toast: "🗳️ Validator 1 voted — 1/3 approvals",
    tx: "5gH8vY...m1Nq4t",
  },
  {
    id: 7,
    actor: "budi",
    phase: "🗳️ Step 6",
    title: "Validator Budi Reviews — Consensus Reached!",
    quote: "Independent of Siti, I reviewed the same evidence. The claim is credible — timestamped GPS log at the correct address. I vote Approve. 2/3 reached — consensus!",
    ui: {
      type: "vote",
      label: "Consensus Reached!",
      lines: [
        { k: "Validator", v: "Budi Santoso (9pRw...v5Jd)" },
        { k: "Stake", v: "1.5 SOL" },
        { k: "Reputation", v: "105 → 110 pts (+5)" },
        { k: "Decision", v: "✅ APPROVE" },
        { k: "Vote Tally", v: "2 approve / 0 reject" },
        { k: "Consensus", v: "🏆 2/3 REACHED!" },
        { k: "TX", v: "9pW4xZ...b6Cr7u ✓" },
      ],
    },
    toast: "🏆 2/3 consensus! Claim APPROVED on-chain!",
    tx: "9pW4xZ...b6Cr7u",
  },
  {
    id: 8,
    actor: "ahmad",
    phase: "💸 Step 7",
    title: "Ahmad Withdraws His Payout",
    quote: "I got a notification — my claim was approved! I clicked Withdraw and 0.0095 SOL hit my wallet in seconds. For the first time in my career, insurance actually worked for me.",
    ui: {
      type: "payout",
      label: "Payout Received 🎉",
      lines: [
        { k: "Claim Amount", v: "0.010 SOL" },
        { k: "Protocol Fee (5%)", v: "−0.0005 SOL → Treasury" },
        { k: "Ahmad Receives", v: "0.0095 SOL ✓" },
        { k: "New Balance", v: "5.207 SOL" },
        { k: "Net Profit vs Premium", v: "+0.0075 SOL" },
        { k: "TX", v: "2mB5wL...h9Ds3v ✓" },
      ],
    },
    toast: "💸 0.0095 SOL received — Ahmad is protected!",
    tx: "2mB5wL...h9Ds3v",
  },
];

const STEP_DELAY = 3200;

const COLOR: Record<string, { ring: string; bg: string; border: string; badge: string; text: string }> = {
  indigo: {
    ring: "ring-indigo-500/50",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    badge: "bg-indigo-500/20 text-indigo-300",
    text: "text-indigo-300",
  },
  purple: {
    ring: "ring-purple-500/50",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    badge: "bg-purple-500/20 text-purple-300",
    text: "text-purple-300",
  },
  green: {
    ring: "ring-green-500/50",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    badge: "bg-green-500/20 text-green-300",
    text: "text-green-300",
  },
};

function UICard({ ui }: { ui: (typeof STEPS)[0]["ui"] }) {
  const isPayout = ui.type === "payout";
  const borderCls = isPayout ? "border-green-500/40" : "border-gray-700/60";
  return (
    <div className={`rounded-xl border ${borderCls} bg-gray-900/60 overflow-hidden`}>
      <div className={`px-4 py-2 text-xs font-semibold border-b ${borderCls} ${isPayout ? "text-green-400 bg-green-500/10" : "text-gray-400 bg-gray-800/40"}`}>
        {ui.label}
      </div>
      <div className="p-4 space-y-1.5">
        {ui.lines.map((l) => (
          <div key={l.k} className="flex gap-2 text-xs">
            <span className="text-gray-500 shrink-0 w-28">{l.k}</span>
            <span className={`text-gray-200 ${l.v.includes("APPROVE") ? "text-green-400 font-bold" : ""} ${l.v.includes("REACHED") ? "text-yellow-400 font-bold" : ""}`}>
              {l.v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [speed, setSpeed] = useState<1 | 2>(1); // 1 = normal, 2 = fast
  const bottomRef = useRef<HTMLDivElement>(null);

  const delay = STEP_DELAY / speed;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const runDemo = async () => {
    if (running) return;
    setRunning(true);
    setDone(false);
    setVisibleSteps([]);
    setActiveStep(null);

    for (let i = 0; i < STEPS.length; i++) {
      const step = STEPS[i];
      setActiveStep(step.id);
      await new Promise((r) => setTimeout(r, delay));
      setVisibleSteps((prev) => [...prev, step.id]);
      if (step.toast) showToast(step.toast);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 150);
    }

    setActiveStep(null);
    setRunning(false);
    setDone(true);
  };

  const reset = () => {
    setRunning(false);
    setDone(false);
    setVisibleSteps([]);
    setActiveStep(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const progress = Math.round((visibleSteps.length / STEPS.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

      {/* Toast */}
      {toast && (
        <div className="fixed top-24 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl border bg-gray-900 border-indigo-500/50 text-white max-w-xs">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Image src="/logo.jpg" alt="GigShield" width={52} height={52} className="rounded-xl shadow-lg" />
          <div className="text-left">
            <h1 className="text-3xl font-bold gradient-text">GigShield Demo</h1>
            <p className="text-xs text-gray-500">Decentralized Micro-Insurance on Solana</p>
          </div>
        </div>
        <p className="text-gray-300 text-lg max-w-xl mx-auto leading-relaxed">
          Follow <strong className="text-white">Ahmad Rizki</strong>, a delivery driver from Surabaya,
          as he gets insured, files a claim, and receives his payout — all on-chain on Solana.
        </p>
      </div>

      {/* Character introductions — always visible */}
      <div className="grid grid-cols-3 gap-3">
        {Object.values(CHARS).map((c) => {
          const col = COLOR[c.color];
          return (
            <div key={c.name} className={`card border ${col.border} ${col.bg} text-center space-y-2 py-4`}>
              <div className={`w-12 h-12 rounded-full ring-2 ${col.ring} bg-gray-800 flex items-center justify-center text-2xl mx-auto`}>
                {c.emoji}
              </div>
              <div>
                <p className="font-semibold text-sm">{c.name}</p>
                <p className={`text-xs ${col.text}`}>{c.role}</p>
                <p className="text-xs text-gray-600">{c.city}</p>
              </div>
              {"stake" in c && (
                <div className="flex justify-center gap-3 text-xs text-gray-500">
                  <span>Stake: <span className="text-white">{c.stake}</span></span>
                  <span>Rep: <span className="text-white">{c.rep}</span></span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {(running || done) && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{done ? "Story complete ✓" : `Step ${visibleSteps.length} of ${STEPS.length}`}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                background: done
                  ? "linear-gradient(90deg, #10b981, #34d399)"
                  : "linear-gradient(90deg, #6366f1, #8b5cf6)",
              }}
            />
          </div>
        </div>
      )}

      {/* Start controls */}
      {!running && !done && (
        <div className="text-center space-y-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setSpeed(1)}
              className={`px-4 py-2 rounded-lg text-sm border transition-all ${speed === 1 ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-gray-700 text-gray-500 hover:border-gray-500"}`}
            >
              Normal Speed
            </button>
            <button
              onClick={() => setSpeed(2)}
              className={`px-4 py-2 rounded-lg text-sm border transition-all ${speed === 2 ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-gray-700 text-gray-500 hover:border-gray-500"}`}
            >
              ⚡ Fast
            </button>
          </div>
          <button
            onClick={runDemo}
            className="btn-primary text-lg px-12 py-4 rounded-2xl shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform"
          >
            ▶ Start Ahmad's Story
          </button>
          <p className="text-xs text-gray-600">7 steps · {speed === 1 ? "~25 seconds" : "~13 seconds"} · Follow Ahmad from uninsured to protected</p>
        </div>
      )}

      {/* Active step indicator */}
      {running && activeStep !== null && (
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/60 border border-gray-700/60 rounded-xl">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
          <p className="text-sm text-gray-300">
            {STEPS.find((s) => s.id === activeStep)?.phase} — <span className="text-white font-medium">{STEPS.find((s) => s.id === activeStep)?.title}</span>
          </p>
        </div>
      )}

      {/* Story steps */}
      <div className="space-y-6">
        {STEPS.map((step) => {
          const visible = visibleSteps.includes(step.id);
          const char = CHARS[step.actor as keyof typeof CHARS];
          const col = COLOR[char.color];

          return (
            <div
              key={step.id}
              className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none h-0 overflow-hidden"}`}
            >
              <div className={`card border ${col.border} space-y-4`}>
                {/* Step header */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ring-2 ${col.ring} bg-gray-800 flex items-center justify-center text-xl shrink-0`}>
                    {char.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${col.badge}`}>{step.phase}</span>
                      <span className="text-xs text-gray-500">{char.name} · {char.role}</span>
                    </div>
                    <h3 className="font-semibold text-white mt-0.5">{step.title}</h3>
                  </div>
                </div>

                {/* Quote / speech bubble */}
                <div className={`relative ml-12 p-4 rounded-xl ${col.bg} border ${col.border}`}>
                  <div className="absolute -left-3 top-4 w-3 h-3 rotate-45 border-l border-b" style={{ background: "inherit", borderColor: "inherit" }} />
                  <p className="text-sm text-gray-200 leading-relaxed italic">"{step.quote}"</p>
                  <p className={`text-xs mt-2 font-medium ${col.text}`}>— {char.name}, {char.age}, {char.city}</p>
                </div>

                {/* UI card mockup */}
                <div className="ml-12">
                  <UICard ui={step.ui} />
                </div>

                {step.tx && (
                  <p className="ml-12 text-xs text-gray-600 font-mono">
                    On-chain TX:{" "}
                    <a href={`https://explorer.solana.com/tx/${step.tx}?cluster=devnet`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      {step.tx}
                    </a>
                    {" "}<span className="text-green-500">✓ Confirmed on Solana</span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Final outcome */}
      {done && (
        <div className="card border border-green-500/40 bg-green-500/5 space-y-6 text-center py-8">
          <p className="text-5xl">🎉</p>
          <div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">Ahmad is Protected.</h2>
            <p className="text-gray-400 max-w-lg mx-auto text-sm leading-relaxed">
              For the first time in his career, Ahmad filed an insurance claim and actually got paid.
              No forms. No office visits. No waiting weeks. <strong className="text-white">Just Solana.</strong>
            </p>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mx-auto">
            {[
              { label: "Premium Paid", value: "0.002 SOL", sub: "≈ Rp 290", color: "text-indigo-400" },
              { label: "Claim Approved", value: "0.010 SOL", sub: "by 2/3 validators", color: "text-yellow-400" },
              { label: "Ahmad Received", value: "0.0095 SOL", sub: "95% payout", color: "text-green-400" },
              { label: "Time to Payout", value: "< 48 hrs", sub: "trustless on Solana", color: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-800/60 rounded-xl p-3">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-white font-medium">{s.label}</p>
                <p className="text-xs text-gray-500">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* What happened on-chain */}
          <div className="text-left max-w-lg mx-auto space-y-2 text-sm">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">What happened on Solana</p>
            {[
              "✓ Premium stored in pool_vault PDA — no intermediary holds funds",
              "✓ Claim evidence SHA-256 fingerprint anchored immutably on-chain",
              "✓ 2 independent validators voted — no single point of control",
              "✓ Payout auto-transferred from vault to Ahmad's wallet",
              "✓ 5% fee collected to protocol treasury for sustainability",
              "✓ Siti & Budi's reputation scores increased (+5 each)",
            ].map((line) => (
              <p key={line} className="text-gray-400 text-xs">{line}</p>
            ))}
          </div>

          <div className="flex gap-3 justify-center flex-wrap pt-2">
            <Link href="/" className="btn-primary px-8">
              Try the Real App on Solana →
            </Link>
            <button onClick={reset} className="btn-secondary px-6">
              ↺ Watch Again
            </button>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
