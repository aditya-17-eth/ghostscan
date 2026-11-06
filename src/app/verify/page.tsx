"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { GhostClient } from "@/lib/anon-rpc/client";
import { NETWORKS, type NetworkId } from "@/lib/anon-rpc/networks";
const DEPOSIT = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
export default function Home() {
  const [client] = useState(() => new GhostClient());
  const state = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot);
  const [network, setNetwork] = useState<NetworkId>("nym");
  const [result, setResult] = useState<unknown>();
  useEffect(() => () => client.disconnect(), [client]);
  async function verify() {
    try {
      await client.connect(network);
      const block = await client.request("eth_blockNumber");
      const balance = await client.request("eth_getBalance", [DEPOSIT, block]);
      setResult({ network, specifier: NETWORKS[network].address, block, balance });
    } catch (e) { setResult({ error: String(e) }); }
  }
  return <main className="verification-page"><Link href="/" prefetch={false}>← Return to GHOSTSCAN</Link><h1>GHOSTSCAN</h1><p>Milestone 1 · genuine Anon-RPC verification</p>
    <select aria-label="Anonymity network" value={network} onChange={e => setNetwork(e.target.value as NetworkId)}><option value="tor">Tor</option><option value="nym">Nym</option></select>
    <button className="primary-button" onClick={verify} disabled={state.status === "connecting"}>Verify real worker</button>
    <p data-testid="status">{state.status}</p><p role="alert">{state.error}</p>
    <pre data-testid="result">{JSON.stringify(result, null, 2)}</pre>
    <pre data-testid="diagnostics">{JSON.stringify(state, null, 2)}</pre>
  </main>;
}
