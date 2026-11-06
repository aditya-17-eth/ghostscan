import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "GHOSTSCAN · Private Ethereum intelligence", description: "Read-only Ethereum investigation through the official Anon-RPC browser harness. No wallet connection required." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
