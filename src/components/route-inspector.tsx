import { ArrowDown, Box, Globe2, Monitor, Network, ShieldCheck } from "lucide-react";
import { NETWORKS } from "@/lib/anon-rpc/networks";
import type { Snapshot } from "@/lib/anon-rpc/client";
import { humanDuration, shorten } from "./ui";
export function RouteInspector({ state }: { state: Snapshot }) {
  const selected = NETWORKS[state.network];
  const direct = state.mode === "direct";
  return <section className="panel route-panel"><div className="panel-heading"><div><h2>Privacy route</h2><p>Transport design · not observed hops</p></div><ShieldCheck size={18} className={direct ? "warning-text" : "accent-text"} /></div>
    <div className={`route-diagram ${direct ? "direct-route" : ""}`}>
      <div className="route-node"><span className="node-icon"><Monitor size={17} /></span><div><strong>Your browser</strong><small>No application-server proxy</small></div><span className="route-tag">Local</span></div>
      <div className="route-connector"><span /><ArrowDown size={13} /></div>
      {!direct && <><div className="route-node"><span className="node-icon"><Box size={17} /></span><div><strong>Sandboxed worker</strong><small>Hash pinned · null-origin isolation</small></div></div><div className="route-connector"><span /><ArrowDown size={13} /></div><div className="route-node network-node"><span className="node-icon"><Network size={17} /></span><div><strong>{selected.name} {state.network === "nym" ? "mixnet" : "network"}</strong><small>{state.status === "ready" ? "Worker-reported readiness" : state.status === "connecting" ? "Establishing transport…" : "Awaiting connection"}</small></div><i className={`status-dot ${state.status}`} /></div><div className="route-connector"><span /><ArrowDown size={13} /></div></>}
      <div className="route-node"><span className="node-icon"><Globe2 size={17} /></span><div><strong>Ethereum RPC</strong><small>Destination can see the query</small></div></div>
    </div><div className="route-details"><div><span>Specifier chain</span><strong>Ethereum mainnet · 1</strong></div><div><span>Specifier</span><code title={selected.address}>{shorten(selected.address)}</code></div><div><span>Worker startup</span><code>{state.bootMs === undefined ? "—" : humanDuration(state.bootMs)}</code></div><div><span>Bundle integrity</span><code>{state.workerHash ? shorten(state.workerHash) : "Not resolved"}</code></div></div>
    <p className="route-disclaimer">{direct ? "Direct mode exposes the connection origin and queries to the RPC provider." : "Bootstrap reads are direct. Routing, timing correlation and endpoint trust remain network-dependent."}</p>
  </section>;
}
