"use client";
import { FC } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

const Navbar: FC = () => (
  <nav className="fixed top-0 w-full z-50 bg-dark-950/80 backdrop-blur-xl border-b border-gray-800">
    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Image src="/logo.jpg" alt="GigShield" width={40} height={40} className="rounded-xl" />
        <span className="text-xl font-bold gradient-text">GigShield</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <a href="#pools" className="text-gray-400 hover:text-white transition-colors">Pools</a>
        <a href="#claims" className="text-gray-400 hover:text-white transition-colors">Claims</a>
        <a href="#validate" className="text-gray-400 hover:text-white transition-colors">Validate</a>
      </div>
      <WalletMultiButton />
    </div>
  </nav>
);
export default Navbar;
