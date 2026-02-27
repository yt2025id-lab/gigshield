"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

// ── Demo steps ─────────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 1,
    role: "🚗 Gig Worker",
    title: "Connect Wallet",
    detail: "Phantom wallet connected on Solana Devnet",
    tx: null,
    color: "indigo",
    balance: "2.500 SOL",
    icon: "👛",
  },
  {
    id: 2,
    role: "🚗 Gig Worker",
    title: "Browse Insurance Pools",
    detail: "Found RideShare pool — 1% premium rate, max payout 5 SOL",
    tx: null,
    color: "indigo",
    balance: "2.500 SOL",
    icon: "🏊",
  },
  {
    id: 3,
    role: "🚗 Gig Worker",
    title: "Deposit Premium",
    detail: "Paid 0.010 SOL premium → coverage active for this gig",
    tx: "3xK9mP...f7Qw2r",
    color: "indigo",
    balance: "2.490 SOL",
    icon: "💳",
  },
  {
    id: 4,
    role: "🚗 Gig Worker",
    title: "Incident Occurs — Submit Claim",
    detail: "\"Client refused to pay after completed delivery. Invoice #4821 attached.\" → SHA-256 fingerprint anchored on-chain",
    tx: "7tR2nX...k3Lp9s",
    color: "yellow",
    balance: "2.489 SOL",
    icon: "📋",
  },
  {
    id: 5,
    role: "🛡️ Validator 1",
    title: "Validator Reviews Evidence",
    detail: "Read claim description, verified SHA-256 fingerprint → votes ✓ Approve",
    tx: "5gH8vY...m1Nq4t",
    color: "purple",
    balance: null,
    icon: "✅",
  },
  {
    id: 6,
    role: "🛡️ Validator 2",
    title: "Second Validator Votes",
    detail: "Independent review → votes ✓ Approve  |  Vote tally: 2/3 — consensus reached!",
    tx: "9pW4xZ...b6Cr7u",
    color: "purple",
    balance: null,
    icon: "✅",
  },
  {
    id: 7,
    role: "⚡ Protocol",
    title: "2/3 Consensus — Claim Approved",
    detail: "Supermajority reached. Claim status → Approved. Payout unlocked.",
    tx: null,
    color: "green",
    balance: null,
    icon: "🏆",
  },
  {
    id: 8,
    role: "🚗 Gig Worker",
    title: "Withdraw Payout",
    detail: "0.100 SOL approved → 0.095 SOL to wallet (5% protocol fee: 0.005 SOL to treasury)",
    tx: "2mB5wL...h9Ds3v",
    color: "green",
    balance: "2.584 SOL",
    icon: "💸",
  },
];

const STEP_DELAY = 1800; // ms between steps

function fakeTxLink(tx: string) {
  return `https://explorer.solana.com/tx/${tx}?cluster=devnet`;
}

const colorMap: Record<string, { bg: string; border: string; text: string; dot: string; badge: string }> = {
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/40",
    text: "text-indigo-300",
    dot: "bg-indigo-500",
    badge: "bg-indigo-500/20 text-indigo-300",
  },
  yellow: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/40",
    text: "text-yellow-300",
    dot: "bg-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-300",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/40",
    text: "text-purple-300",
    dot: "bg-purple-500",
    badge: "bg-purple-500/20 text-purple-300",
  },
  green: {
    bg: "bg-green-500/10",
    border: "border-green-500/40",
    text: "text-green-300",
    dot: "bg-green-500",
    badge: "bg-green-500/20 text-green-300",
  },
};

export default function DemoPage() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
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
      await new Promise((r) => setTimeout(r, STEP_DELAY));
      setVisibleSteps((prev) => [...prev, step.id]);

      // Special toasts
      if (step.id === 3) showToast("✅ Premium deposited — you're covered!");
      if (step.id === 4) showToast("📋 Claim submitted — evidence anchored on-chain");
      if (step.id === 7) showToast("🏆 Consensus reached — claim approved!");
      if (step.id === 8) showToast("💸 0.095 SOL received in wallet!");

      // Auto-scroll
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 100);
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
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">

      {/* Toast */}
      {toast && (
        <div className="fixed top-24 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl border bg-green-900/90 border-green-500/50 text-green-200 animate-pulse">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Image src="/logo.jpg" alt="GigShield" width={48} height={48} className="rounded-xl" />
          <h1 className="text-3xl font-bold gradient-text">GigShield Demo</h1>
        </div>
        <p className="text-gray-400 max-w-xl mx-auto">
          Watch the complete gig worker journey — from getting insured to withdrawing a payout —
          all on-chain on Solana in under 30 seconds.
        </p>

        {/* Flow summary */}
        <div className="flex items-center justify-center gap-1 flex-wrap text-xs text-gray-500 mt-2">
          {["Connect Wallet", "→", "Deposit Premium", "→", "Submit Claim", "→", "Validators Vote", "→", "Withdraw Payout 💸"].map((s, i) => (
            <span key={i} className={s === "→" ? "text-gray-700" : "text-gray-400"}>{s}</span>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      {(running || done) && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{done ? "Demo complete" : `Step ${visibleSteps.length} / ${STEPS.length}`}</span>
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

      {/* Start button */}
      {!running && !done && (
        <div className="text-center py-6">
          <button
            onClick={runDemo}
            className="btn-primary text-lg px-10 py-4 rounded-2xl shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform"
          >
            ▶ Run Full Demo
          </button>
          <p className="text-xs text-gray-600 mt-3">Simulates 8 on-chain steps · ~15 seconds</p>
        </div>
      )}

      {/* Running spinner */}
      {running && activeStep !== null && (
        <div className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
          <p className="text-sm text-indigo-300">
            Processing: <strong>{STEPS.find((s) => s.id === activeStep)?.title}</strong>
          </p>
        </div>
      )}

      {/* Steps timeline */}
      <div className="space-y-3">
        {STEPS.map((step) => {
          const visible = visibleSteps.includes(step.id);
          const active = activeStep === step.id && !visible;
          const c = colorMap[step.color];

          return (
            <div
              key={step.id}
              className={`relative transition-all duration-500 ${
                visible ? "opacity-100 translate-y-0" : active ? "opacity-60 translate-y-1" : "opacity-0 translate-y-4 pointer-events-none h-0 overflow-hidden"
              }`}
            >
              <div className={`card border ${c.border} ${c.bg} space-y-2`}>
                <div className="flex items-start gap-3">
                  {/* Step number + icon */}
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className={`w-9 h-9 rounded-full ${c.bg} border ${c.border} flex items-center justify-center text-lg`}>
                      {step.icon}
                    </div>
                    <span className="text-xs text-gray-600">#{step.id}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>
                        {step.role}
                      </span>
                      {step.balance && (
                        <span className="text-xs text-gray-500">
                          Wallet: <span className="text-white font-mono">{step.balance}</span>
                        </span>
                      )}
                    </div>
                    <p className={`font-semibold ${c.text}`}>{step.title}</p>
                    <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{step.detail}</p>
                    {step.tx && (
                      <p className="text-xs text-gray-600 mt-1.5 font-mono">
                        TX:{" "}
                        <a
                          href={fakeTxLink(step.tx)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline"
                        >
                          {step.tx}
                        </a>
                        {" "}
                        <span className="text-green-500">✓ Confirmed</span>
                      </p>
                    )}
                  </div>

                  {/* Check badge */}
                  <div className={`shrink-0 w-6 h-6 rounded-full ${c.dot} flex items-center justify-center text-white text-xs font-bold`}>
                    ✓
                  </div>
                </div>
              </div>

              {/* Connector line */}
              {step.id < STEPS.length && (
                <div className="absolute left-[28px] top-full w-0.5 h-3 bg-gray-700" />
              )}
            </div>
          );
        })}
      </div>

      {/* Final success card */}
      {done && (
        <div className="card border border-green-500/50 bg-green-500/10 text-center space-y-4 py-8">
          <p className="text-5xl">🎉</p>
          <h2 className="text-2xl font-bold text-green-400">Demo Complete!</h2>
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[
              { label: "Premium Paid", value: "0.010 SOL" },
              { label: "Claim Payout", value: "0.095 SOL" },
              { label: "Net Profit", value: "+0.085 SOL" },
            ].map((s) => (
              <div key={s.label} className="bg-green-500/10 rounded-xl p-3">
                <p className="text-lg font-bold text-white">{s.value}</p>
                <p className="text-xs text-green-400">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            The entire flow — from paying a 0.010 SOL premium to receiving a 0.095 SOL payout —
            executed trustlessly on Solana in seconds.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/" className="btn-primary px-6">
              Try the Real App →
            </Link>
            <button onClick={reset} className="btn-secondary px-6">
              ↺ Run Again
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      {!running && !done && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-sm text-gray-400">What this demo covers:</h3>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            {[
              { icon: "👛", text: "Wallet connection on Solana Devnet" },
              { icon: "💳", text: "Micro-premium deposit (0.010 SOL)" },
              { icon: "📋", text: "Claim with SHA-256 evidence fingerprint" },
              { icon: "🛡️", text: "2 validators voting via 2/3 consensus" },
              { icon: "⚡", text: "On-chain claim approval" },
              { icon: "💸", text: "Payout (95%) + 5% protocol fee" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-gray-400">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <p className="text-xs text-indigo-400">
              💡 This is a <strong>visual simulation</strong> of on-chain transactions.
              The actual app at <Link href="/" className="underline">gigshield.vercel.app</Link> runs
              live on Solana Devnet with real transactions.
            </p>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
