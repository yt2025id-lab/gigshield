import type { Metadata } from "next";
import "./globals.css";
import WalletProvider from "@/components/WalletProvider";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "GigShield - DePIN Freelancer Insurance on Solana",
  description: "Micro-insurance for the gig economy, powered by decentralized validators",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-dark-950">
        <WalletProvider>
          <Navbar />
          <main className="pt-20">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
