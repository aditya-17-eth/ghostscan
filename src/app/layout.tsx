import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "GHOSTSCAN · Public chain. Private curiosity.", description: "Your wallet is public. Your curiosity shouldn't be. Explore Ethereum through an anonymity network, without connecting a wallet.", applicationName: "GHOSTSCAN", openGraph: { title: "GHOSTSCAN · Public chain. Private curiosity.", description: "Private Ethereum intelligence. Real onchain reads through Ethereum Foundation Anon-RPC.", type: "website" }, twitter: { card: "summary", title: "GHOSTSCAN", description: "Public chain. Private curiosity." } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
