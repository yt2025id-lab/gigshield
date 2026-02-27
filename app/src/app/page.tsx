"use client";

const CATEGORIES = [
  { name: "Ride Share", icon: "🚗", pools: 12, tvl: "45.2K", premium: "0.001" },
  { name: "Delivery", icon: "📦", pools: 8, tvl: "23.1K", premium: "0.002" },
  { name: "Freelance", icon: "💻", pools: 15, tvl: "67.8K", premium: "0.003" },
  { name: "Construction", icon: "🏗️", pools: 5, tvl: "12.4K", premium: "0.005" },
  { name: "Healthcare", icon: "🏥", pools: 3, tvl: "8.9K", premium: "0.004" },
];

const CLAIMS = [
  { id: "CLM-001", worker: "7xKX...3nPq", amount: 2.5, status: "Pending", votes: "1/3", category: "Ride Share" },
  { id: "CLM-002", worker: "9aBC...7mDe", amount: 1.2, status: "Approved", votes: "3/3", category: "Delivery" },
  { id: "CLM-003", worker: "4fGH...2kLm", amount: 5.0, status: "Rejected", votes: "3/3", category: "Freelance" },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Micro-Insurance for the <span className="gradient-text">Gig Economy</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          Pay as little as 0.001 SOL per gig. Get covered instantly.
          Claims validated by decentralized validator nodes.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="btn-primary">Get Covered</button>
          <button className="btn-secondary">Become Validator</button>
        </div>

        <div className="grid grid-cols-4 gap-8 mt-16 max-w-2xl mx-auto">
          {[
            { label: "Total Value Locked", value: "$157K" },
            { label: "Active Policies", value: "2,431" },
            { label: "Claims Processed", value: "189" },
            { label: "Validators", value: "47" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold gradient-text">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Insurance Pools */}
      <section id="pools">
        <h2 className="text-2xl font-bold gradient-text mb-6">Insurance Pools</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <div key={cat.name} className="card">
              <div className="text-4xl mb-3">{cat.icon}</div>
              <h3 className="text-lg font-semibold mb-1">{cat.name}</h3>
              <div className="space-y-2 text-sm text-gray-400 mb-4">
                <div className="flex justify-between">
                  <span>Active Pools</span><span className="text-white">{cat.pools}</span>
                </div>
                <div className="flex justify-between">
                  <span>TVL</span><span className="text-white">{cat.tvl} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span>Min Premium</span><span className="text-white">{cat.premium} SOL/gig</span>
                </div>
              </div>
              <button className="btn-primary w-full text-sm">Join Pool</button>
            </div>
          ))}
        </div>
      </section>

      {/* Claims */}
      <section id="claims">
        <h2 className="text-2xl font-bold gradient-text mb-6">Recent Claims</h2>
        <div className="space-y-3">
          {CLAIMS.map((c) => (
            <div key={c.id} className="card flex items-center justify-between">
              <div>
                <p className="font-semibold">{c.id} - {c.category}</p>
                <p className="text-sm text-gray-500">Worker: {c.worker}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{c.amount} SOL</p>
                <p className="text-sm text-gray-500">Votes: {c.votes}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                c.status === "Approved" ? "bg-green-500/20 text-green-400" :
                c.status === "Rejected" ? "bg-red-500/20 text-red-400" :
                "bg-yellow-500/20 text-yellow-400"
              }`}>{c.status}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Validator Section */}
      <section id="validate" className="card text-center">
        <h2 className="text-2xl font-bold gradient-text mb-4">Become a Validator</h2>
        <p className="text-gray-400 mb-6">Stake 1 SOL minimum. Vote on claims. Earn reputation and rewards.</p>
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-dark-900 rounded-xl p-4">
            <p className="text-2xl font-bold gradient-text">12.5%</p>
            <p className="text-sm text-gray-500">APY Rewards</p>
          </div>
          <div className="bg-dark-900 rounded-xl p-4">
            <p className="text-2xl font-bold gradient-text">47</p>
            <p className="text-sm text-gray-500">Active Validators</p>
          </div>
          <div className="bg-dark-900 rounded-xl p-4">
            <p className="text-2xl font-bold gradient-text">98%</p>
            <p className="text-sm text-gray-500">Accuracy Rate</p>
          </div>
        </div>
        <button className="btn-primary">Register as Validator (Stake 1 SOL)</button>
      </section>

      <footer className="text-center py-8 border-t border-gray-800">
        <p className="text-gray-500">Built on <span className="text-indigo-400">Solana</span> | GigShield Hackathon 2026</p>
      </footer>
    </div>
  );
}
