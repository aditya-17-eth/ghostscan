import { ArrowRight, FlaskConical, Globe2, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { formatEther } from "viem";
import { GhostClient, type Snapshot } from "@/lib/anon-rpc/client";
import { NETWORKS } from "@/lib/anon-rpc/networks";
import { EXAMPLES, validateAddress } from "@/lib/ethereum/explorer";
import { ExternalLink, Spinner, humanDuration } from "./ui";
type Outcome = { status: string; response: string; duration: number; error?: string };
export function PrivacyLab({ client, state, initialAddress }: { client: GhostClient; state: Snapshot; initialAddress: string }) {
  const [address, setAddress] = useState(initialAddress || EXAMPLES[0].address);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ block: string; anon: Outcome; direct: Outcome }>();
  async function compare() {
    setError(""); setResult(undefined);
    try {
      const valid = validateAddress(address);
      setBusy(true);
      const block = await client.request("eth_blockNumber") as string;
      const startId = client.getSnapshot().events.at(-1)?.id ?? 0;
      const settled = await client.compareBalance(valid, block);
      const events = client.getSnapshot().events.filter(e => e.id > startId && e.method === "eth_getBalance");
      const outcome = (i: number, mode: "anon" | "direct"): Outcome => {
        const r = settled[i];
        return { status: r.status === "fulfilled" ? "Completed" : "Failed", response: r.status === "fulfilled" ? `${formatEther(BigInt(String(r.value)))} ETH` : "No result", error: r.status === "rejected" ? String(r.reason) : undefined, duration: events.find(e => e.transport === mode)?.duration ?? 0 };
      };
      setResult({ block, anon: outcome(0, "anon"), direct: outcome(1, "direct") });
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  const destination = new URL(client.endpoints().destination).hostname;
  return <><div className="page-heading"><div><p className="section-kicker">Privacy Lab</p><h1>Same question. Different exposure.</h1><p className="heading-description">Compare one balance at one block. Measure the latency. Understand the trust.</p></div><FlaskConical size={34} className="muted" /></div>
    <section className="panel lab-controls"><label htmlFor="comparison-address">Address to compare</label><div className="lab-search"><input id="comparison-address" value={address} onChange={e => setAddress(e.target.value)} spellCheck={false} autoComplete="off" /><button className="primary-button" onClick={() => void compare()} disabled={busy || state.mode !== "anon" || state.status !== "ready"}>{busy ? <Spinner /> : <FlaskConical size={15} />}{busy ? "Comparing" : "Run comparison (also sends directly)"}<ArrowRight size={15} /></button></div><p className="comparison-consent"><Globe2 size={14} />This action shares this address with {destination} directly and through Anon-RPC.</p>{(state.status !== "ready" || state.mode !== "anon") && <p className="inline-error">Connect Anon-RPC in Settings before comparing.</p>}{error && <p className="inline-error" role="alert">{error}</p>}</section>
    <div className="comparison-grid">{(["direct", "anon"] as const).map(mode => <section key={mode} className={`panel comparison-card ${mode}`}><div className="comparison-title">{mode === "anon" ? <LockKeyhole size={22} /> : <Globe2 size={22} />}<div><h2>{mode === "anon" ? "Anon-RPC" : "Direct RPC"}</h2><p>{mode === "anon" ? `${NETWORKS[state.network].name} transport` : "Conventional HTTPS connection"}</p></div><span className={`small-badge ${result?.[mode].error ? "error-text" : ""}`}>{result?.[mode].status ?? "Not measured"}</span></div><div className="comparison-timing"><span>Measured response time</span><strong>{result ? humanDuration(result[mode].duration) : "—"}</strong></div><dl className="comparison-data"><div><dt>Method</dt><dd>eth_getBalance</dd></div><div><dt>Destination</dt><dd>{destination}</dd></div><div><dt>Block</dt><dd>{result ? BigInt(result.block).toString() : "—"}</dd></div><div><dt>Response</dt><dd>{result?.[mode].response ?? "Run a real comparison"}</dd></div></dl>{result?.[mode].error && <p className="inline-error">{result[mode].error}</p>}<div className="exposure-copy"><span>{mode === "anon" ? "Designed to reduce origin linkage" : "Provider observes your connection"}</span><p>{mode === "anon" ? "The network is designed to separate your origin from the RPC destination. The destination still sees the blockchain request. Hops and source-IP unlinkability are not measured here." : "The RPC provider can observe the query and the origin of this HTTPS connection. TLS protects transit; the provider terminates TLS."}</p></div></section>)}</div>
    <section className="panel lab-notes"><h2>What these numbers tell you</h2><div className="notes-grid"><div><span className="note-label">Measured here</span><p>Browser elapsed time, JSON-RPC success or failure, response values and which fetch function GHOSTSCAN used.</p></div><div><span className="note-label">Network design</span><p>{NETWORKS[state.network].name} supplies the routing and its own trust assumptions. A ready signal is supplied by the worker.</p></div><div><span className="note-label">Still unknown</span><p>Actual relay path, every observer, resistance to timing correlation and whether the origin can be independently linked to a query.</p></div></div><ExternalLink href="https://ethereum.github.io/anon-rpc/wallets/#the-trust-model-honestly">Read the upstream trust model</ExternalLink></section>
  </>;
}
