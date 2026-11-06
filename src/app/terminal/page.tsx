"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { Activity, ArrowRight, Blocks, Braces, Check, ChevronRight, CircleHelp, Code2, ExternalLink as LinkIcon, FlaskConical, Globe2, LayoutDashboard, LockKeyhole, Menu, Radio, RefreshCw, Search, Settings2, ShieldCheck, ShieldOff, Terminal, X } from "lucide-react";
import { GhostClient } from "@/lib/anon-rpc/client";
import { NETWORKS, type NetworkId } from "@/lib/anon-rpc/networks";
import { EXAMPLES, investigate, validateAddress, type Investigation } from "@/lib/ethereum/explorer";

import { CopyButton, ExternalLink, Mark, Spinner, humanDuration } from "@/components/ui";
import { Observatory } from "@/components/observatory";
import { RouteInspector } from "@/components/route-inspector";
import { Guide, SettingsPanel } from "@/components/settings";
import { PrivacyLab } from "@/components/privacy-lab";

const NAV = [
  { name: "Overview", icon: LayoutDashboard }, { name: "Address Explorer", icon: Search },
  { name: "Contract Inspector", icon: Braces }, { name: "Privacy Lab", icon: FlaskConical },
  { name: "RPC Observatory", icon: Activity }, { name: "Settings", icon: Settings2 },
] as const;
type View = typeof NAV[number]["name"] | "Documentation";
export default function Home() {
  const [client] = useState(() => new GhostClient());
  const state = useSyncExternalStore(client.subscribe, client.getSnapshot, client.getSnapshot);
  const [view, setView] = useState<View>("Overview");
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<Investigation>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [directDialog, setDirectDialog] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const queryToken = useRef(0);
  const stats = state.accounting;
  const selectedNetwork = NETWORKS[state.network];
  const label = state.mode === "direct" ? "DIRECT RPC MODE" : state.status === "ready" ? "ANON-RPC ACTIVE" : state.status === "connecting" ? "ANON-RPC CONNECTING" : state.status === "error" ? "ANON-RPC UNAVAILABLE" : "ANON-RPC DISCONNECTED";
  useEffect(() => {
    const syncView = () => { const slug = window.location.hash.slice(1); const match = [...NAV.map(item => item.name), "Documentation" as const].find(name => name.toLowerCase().replaceAll(" ", "-") === slug); if (match) setView(match); }; syncView(); window.addEventListener("hashchange", syncView);
    let active = true;
    void client.connect("nym").then(async () => { if (active && client.getSnapshot().status === "ready") await client.request("eth_blockNumber"); }).catch(() => {});
    return () => { active = false; window.removeEventListener("hashchange", syncView); client.disconnect(); };
  }, [client]);
  function invalidate() { queryToken.current++; setResult(undefined); setError(""); setBusy(false); }
  async function reconnect(network: NetworkId = state.network) {
    invalidate();
    try { await client.connect(network); if (client.getSnapshot().status === "ready") await client.request("eth_blockNumber"); }
    catch { /* transport error is rendered from the store */ }
  }
  async function search(event?: FormEvent) {
    event?.preventDefault();
    const token = ++queryToken.current;
    setError(""); setResult(undefined);
    try { validateAddress(address); } catch (e) { setError((e as Error).message); return; }
    setBusy(true);
    try {
      const data = await investigate(client, address);
      if (token === queryToken.current) setResult(data);
    } catch (e) { if (token === queryToken.current) setError((e as Error).message); }
    finally { if (token === queryToken.current) setBusy(false); }
  }
  function navigate(next: View) { setView(next); setMobileNav(false); window.history.replaceState(null, "", "#" + next.toLowerCase().replaceAll(" ", "-")); }
  return <div className="app-shell">
    <a href="#main" className="skip-link">Skip to workspace</a>
    <aside className={`sidebar ${mobileNav ? "nav-open" : ""}`} inert={directDialog}>
      <a className="brand" href="#" onClick={e => { e.preventDefault(); navigate("Overview"); }}><Mark /><div><strong>GHOSTSCAN<span>_</span></strong><small>Private Ethereum intelligence</small></div></a>
      <div className="workspace-label"><span>Workspace</span><span className="version">v0.1</span></div>
      <nav aria-label="Main navigation">{NAV.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${view === name ? "active" : ""}`} onClick={() => navigate(name)} aria-current={view === name ? "page" : undefined}><Icon size={18} strokeWidth={1.6} /><span>{name}</span>{view === name && <ChevronRight size={13} />}</button>)}</nav>
      <div className="sidebar-note"><LockKeyhole size={17} /><strong>Your research.<br />Your business.</strong><p>No wallet connection.<br />No analytics. Read-only.</p></div>
      <div className="sidebar-bottom"><Link className="nav-item" href="/">← Back to home</Link><button className="nav-item" onClick={() => navigate("Documentation")}><CircleHelp size={17} />Documentation</button><a className="nav-item" href="https://github.com/ethereum/anon-rpc" target="_blank" rel="noreferrer"><Code2 size={17} />Anon-RPC source<LinkIcon size={12} /></a><button className="sidebar-network" onClick={() => navigate("Settings")}><i className={`status-dot ${state.mode === "direct" ? "direct" : state.status}`} /><span>{state.mode === "direct" ? "Direct RPC mode" : `${selectedNetwork.name} ${state.status === "ready" ? "connected" : state.status}`}</span><ChevronRight size={12} /></button></div>
    </aside>
    <div className="main-shell" inert={directDialog}>
      <header className="topbar"><button className="icon-button mobile-toggle" aria-label="Toggle navigation" onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <X size={20} /> : <Menu size={20} />}</button><div className="chain-label"><span className="ethereum-symbol">◆</span>Ethereum Mainnet<ChevronRight size={12} className="muted" /></div><span className="topbar-divider" /><div className="topbar-block mono"><Blocks size={14} /><span>{state.block ? `#${BigInt(state.block).toLocaleString("en-US")}` : "Awaiting block"}</span></div><div className="grow" /><span className={`connection-pill ${state.mode === "direct" ? "direct" : state.status}`} data-testid="status"><i />{label}</span><button className={`privacy-toggle ${state.mode === "direct" ? "off" : state.status !== "ready" ? "unavailable" : ""}`} aria-label={state.mode === "direct" ? "Return to Anon-RPC" : "Switch to direct RPC"} title={state.mode === "direct" ? "Return to Anon-RPC" : "Switch to direct RPC"} onClick={() => state.mode === "direct" ? void reconnect() : setDirectDialog(true)}>{state.mode === "direct" ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}<span className="toggle-track"><span /></span></button></header>
      <main id="main" className="workspace">
        <div className="breadcrumb"><span>Workspace</span><ChevronRight size={12} /><span>{view}</span><div className="grow" /><span className="session-label"><i className="tiny-dot" />Local session</span></div>
        {view === "Overview" || view === "Address Explorer" || view === "Contract Inspector" ? <>
          <div className="page-heading"><div><p className="section-kicker">{view === "Overview" ? "Ethereum, without the exposure" : "Read-only investigation"}</p><h1>{view === "Overview" ? <>Your wallet is public.<br />Your curiosity shouldn’t be.</> : view === "Address Explorer" ? "Follow the address." : "Inspect what’s deployed."}</h1><p className="heading-description">{view === "Contract Inspector" ? "Read deployed bytecode and onchain state through your selected transport." : "Explore onchain state through an anonymity network. Keep your investigation yours."}</p></div><div className="heading-stamp"><LockKeyhole size={18} /><span>No signatures.<br /><strong>Just intelligence.</strong></span></div></div>
          <div className="investigation-layout"><div className="investigation-main"><section className="search-panel panel"><div className="search-panel-top"><span><Search size={15} />{view === "Contract Inspector" ? "Contract inspector" : "Address explorer"}</span><span className="read-only"><i />Read-only</span></div><form onSubmit={search}><label htmlFor="address" className="sr-only">Ethereum address</label><div className="search-field"><Search size={20} className="muted" /><input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter an Ethereum address · 0x…" autoComplete="off" spellCheck={false} /><button type="submit" className="primary-button" disabled={busy || state.status !== "ready"}>{busy ? <Spinner /> : state.mode === "direct" ? <Globe2 size={15} /> : <LockKeyhole size={15} />}{busy ? "Reading state" : state.mode === "direct" ? "Explore directly" : "Explore privately"}<ArrowRight size={15} /></button></div></form><div className="examples"><span>Try a public address</span>{EXAMPLES.map(item => <button key={item.label} onClick={() => setAddress(item.address)}>{item.label}<ChevronRight size={11} /></button>)}</div>{error && <p className="inline-error" role="alert">{error}</p>}</section>
          {state.status !== "ready" && <div className={`transport-notice ${state.status === "error" ? "has-error" : ""}`} role="status">{state.status === "connecting" ? <Spinner /> : <Radio size={18} />}<div><strong>{state.status === "connecting" ? `Connecting to ${selectedNetwork.name}` : "Private transport is unavailable"}</strong><p>{state.status === "connecting" ? "Reading the specifier, verifying the bundle and starting the network. First connection can take a minute." : state.error || "Connect a documented anonymity network to start exploring."}</p></div>{state.status !== "connecting" && <button className="quiet-button" onClick={() => void reconnect()}><RefreshCw size={14} />Reconnect</button>}</div>}
          {state.mode === "direct" && <div className="transport-notice direct-notice"><ShieldOff size={19} /><div><strong>You are using direct RPC</strong><p>Your provider can associate these queries with your network connection.</p></div><button className="quiet-button" onClick={() => void reconnect()}>Return to Anon-RPC</button></div>}
          {busy && <div className="panel loading-result" aria-label="Loading blockchain state"><div className="skeleton wide" /><div className="skeleton" /><div className="skeleton short" /><p><Spinner />Reading one consistent block snapshot…</p></div>}
          {result ? <InvestigationResult result={result} contract={view === "Contract Inspector"} /> : !busy && <div className="empty-investigation"><div className="empty-illustration"><span /><Search size={26} /><span /></div><h2>Public chain. Private perspective.</h2><p>Enter an address to inspect its balance, code and nonce.<br />Results come from Ethereum, through your selected transport.</p><div className="empty-capabilities"><span><Check size={13} />Real onchain reads</span><span><Check size={13} />No wallet needed</span><span><Check size={13} />No saved searches</span></div></div>}
          </div><RouteInspector state={state} /></div>
          <div className="metrics-strip"><Metric icon={<Terminal size={16} />} label="RPC requests" value={String(stats.total).padStart(2, "0")} detail={`${stats.anon} via Anon-RPC`} /><Metric icon={<ShieldCheck size={16} />} label="Anon-RPC coverage" value={`${stats.coverage.toFixed(1)}%`} detail="Includes bootstrap traffic" accent /><Metric icon={<Globe2 size={16} />} label="Direct traffic" value={String(stats.direct + stats.bootstrap).padStart(2, "0")} detail={`${stats.bootstrap} bootstrap · ${stats.direct} investigation`} /><Metric icon={<Activity size={16} />} label="Average latency" value={stats.latency > 0 ? humanDuration(stats.latency) : "—"} detail={`${stats.failed} failed requests`} /></div>
          <Observatory totals={state.accounting} clearedDetailRows={state.clearedDetailRows} events={state.events} compact clear={() => client.clearHistory()} /><button className="below-panel-link" onClick={() => navigate("RPC Observatory")}>Open full observatory<ArrowRight size={14} /></button>
        </> : view === "Privacy Lab" ? <PrivacyLab key={`${state.mode}-${state.network}-${state.bootMs}`} client={client} state={state} initialAddress={address} /> : view === "RPC Observatory" ? <><div className="page-heading"><div><p className="section-kicker">Nothing behind the curtain</p><h1>Every call, accounted for.</h1><p className="heading-description">Inspect measured RPC traffic. Bootstrap is direct and always counted.</p></div><Activity size={35} className="muted" /></div><div className="summary-line"><span>{stats.anon} Anon-RPC</span><span>{stats.direct} direct</span><span>{stats.bootstrap} bootstrap</span><span>{stats.failed} failed</span><strong>{stats.coverage.toFixed(1)}% coverage</strong></div><Observatory totals={state.accounting} clearedDetailRows={state.clearedDetailRows} events={state.events} clear={() => client.clearHistory()} /><WorkerLogs logs={state.logs} /></> : view === "Settings" ? <SettingsPanel client={client} state={state} reconnect={reconnect} /> : <Guide />}
        <footer className="workspace-footer"><span><Mark />GHOSTSCAN<span className="muted">/</span>Research on your terms.</span><span>Powered by Ethereum Foundation Anon-RPC<ExternalLink href="https://ethereum.github.io/anon-rpc/">Draft spec 0.4.0</ExternalLink></span></footer>
      </main>
    </div>
    {directDialog && <div className="modal-backdrop" onClick={() => setDirectDialog(false)}><div role="dialog" aria-modal="true" aria-labelledby="direct-title" className="modal" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === "Escape") setDirectDialog(false); if (e.key === "Tab") { const controls = e.currentTarget.querySelectorAll<HTMLButtonElement>("button"); const first = controls[0]; const last = controls[controls.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } }}><ShieldOff className="warning-text" size={28} /><h2 id="direct-title">Switch to direct RPC?</h2><p>The RPC provider will receive your investigation queries directly from your browser and can associate them with your network origin. This choice lasts for this page session.</p><div className="modal-actions"><button className="quiet-button" autoFocus onClick={() => setDirectDialog(false)}>Keep Anon-RPC</button><button className="danger-button" onClick={() => { invalidate(); client.enableDirect(); setDirectDialog(false); }}>Enable direct RPC</button></div></div></div>}
  </div>;
}
function Metric({ icon, label, value, detail, accent }: { icon: React.ReactNode; label: string; value: string; detail: string; accent?: boolean }) {
  return <div className="metric"><div className="metric-label">{icon}{label}</div><strong className={accent ? "accent-text" : ""}>{value}</strong><small>{detail}</small></div>;
}
function InvestigationResult({ result, contract }: { result: Investigation; contract: boolean }) {
  return <section className="panel result-panel" data-testid="investigation-result"><div className="panel-heading"><div className="result-identity"><span className="address-identicon"><Braces size={23} /></span><div><h2>{contract ? "Contract state" : "Address state"}</h2><p>{result.kind}</p></div></div><span className={`transport-badge ${result.transport}`}>{result.transport === "anon" ? `${NETWORKS[result.network].name} · Anon-RPC` : "Direct RPC"}</span></div><div className="result-address"><code>{result.address}</code><CopyButton text={result.address} /><ExternalLink href={`https://etherscan.io/address/${result.address}`}>Etherscan</ExternalLink></div><div className="balance-block"><span>ETH balance</span><strong data-testid="balance">{result.ether}<small>ETH</small></strong><p>Observed at block <code>#{Number(result.blockDecimal).toLocaleString("en-US")}</code></p></div><div className="result-data"><div><span>Account nonce</span><strong>{result.nonce}</strong></div><div><span>Deployed code</span><strong>{result.size.toLocaleString("en-US")} bytes</strong></div><div><span>State snapshot</span><strong>Block {result.blockDecimal}</strong></div></div>{(contract || result.size > 0) && <div className="bytecode-details"><div className="between"><span>Bytecode keccak256</span><CopyButton text={result.hash} label="Copy bytecode hash" /></div><code>{result.hash}</code><details><summary>Inspect bytecode ({result.size} bytes)</summary><pre>{result.code}</pre></details><p>Bytecode does not establish verified source or contract safety.</p></div>}<div className="panel-foot"><span><i className="tiny-dot" />Balance, nonce and code at the same block</span><span>{new Date(result.observedAt).toISOString().slice(11, 19)} UTC</span></div><p className="result-note">{result.size === 0 ? "No deployed code does not establish who controls this address. " : "Code may include an account delegation. "}Opening Etherscan shares this address with that service.</p></section>;
}
function WorkerLogs({ logs }: { logs: ReturnType<GhostClient["getSnapshot"]>["logs"] }) {
  return <section className="panel worker-logs"><div className="panel-heading"><div><h2>Worker diagnostics</h2><p>Sanitized messages from the worker and host. They are not independent network measurements.</p></div><Code2 size={18} /></div><div className="log-lines">{logs.length ? logs.map((line, i) => <div key={i}><time>{line.at.slice(11, 19)}</time><span className={line.level === "error" ? "error-text" : "accent-text"}>{line.level}</span><code>{line.message}</code></div>) : <p className="muted">No worker messages in this accounting window.</p>}</div></section>;
}
