import { Download, Filter, Trash2 } from "lucide-react";
import { useState } from "react";
import { accounting, diagnosticReport, type RpcEvent } from "@/lib/telemetry";
import { humanDuration } from "./ui";
export function Observatory({ events, compact = false, clear, totals, clearedDetailRows = 0 }: { events: RpcEvent[]; compact?: boolean; clear: () => void; totals: ReturnType<typeof accounting>; clearedDetailRows?: number }) {
  const [method, setMethod] = useState("all");
  const [transport, setTransport] = useState("all");
  const [selected, setSelected] = useState<number>();
  const visible = events.filter(e => (method === "all" || e.method === method) && (transport === "all" || e.transport === transport)).slice(compact ? -5 : -100).reverse();
  const inspected = events.find(e => e.id === selected);
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(diagnosticReport(events, totals, clearedDetailRows), null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "ghostscan-diagnostics.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="panel observatory">
    <div className="panel-heading"><div><h2>{compact ? "Recent RPC activity" : "Request observatory"}</h2><p>{compact ? "Measured requests from this browser session" : "Includes direct bootstrap traffic. Parameters are redacted in memory."}</p></div><span className="small-badge">{events.length} calls</span></div>
    {!compact && <div className="filter-bar"><Filter size={14} /><label><span className="sr-only">Filter by method</span><select value={method} onChange={e => setMethod(e.target.value)}><option value="all">All methods</option>{[...new Set(events.map(e => e.method))].map(m => <option key={m}>{m}</option>)}</select></label><label><span className="sr-only">Filter by transport</span><select value={transport} onChange={e => setTransport(e.target.value)}><option value="all">All transports</option><option value="anon">Anon-RPC</option><option value="direct">Direct</option><option value="bootstrap">Bootstrap (direct)</option></select></label><div className="grow" /><button className="quiet-button" onClick={download}><Download size={14} />Export diagnostics</button><button className="quiet-button" onClick={clear}><Trash2 size={14} />Clear history</button></div>}
    <div className="table-scroll"><table><thead><tr><th>Time</th><th>RPC method</th><th>Transport</th><th>Duration</th><th>Status</th>{!compact && <><th>Network</th><th>Request</th></>}</tr></thead><tbody>
      {visible.map(e => <tr key={e.id} className={selected === e.id ? "selected-row" : ""}><td className="mono muted">{new Date(e.at).toISOString().slice(11, 19)}<small> UTC</small></td><td><button className="method-button mono" onClick={() => setSelected(selected === e.id ? undefined : e.id)}>{e.method}</button></td><td><span className={`transport-badge ${e.transport}`}>{e.transport === "anon" ? "Anon-RPC" : e.transport === "bootstrap" ? "Bootstrap" : "Direct RPC"}</span></td><td className="mono muted">{e.status === "pending" ? "In flight" : humanDuration(e.duration)}</td><td><span className={`request-status ${e.status}`}><i />{e.status}</span></td>{!compact && <><td className="muted">{e.network}</td><td className="mono muted">#{String(e.id).padStart(4, "0")}</td></>}</tr>)}
    </tbody></table></div>
    {!visible.length && <div className="table-empty"><span className="empty-pulse" /><p>{events.length ? "No calls match these filters." : clearedDetailRows ? "Detailed history cleared. Session totals retained." : "Your requests will appear here."}</p><small>Real traffic only. No sample activity.</small></div>}
    {inspected && <div className="inspected"><div className="between"><h3>Request #{inspected.id} · sanitized details</h3><button className="quiet-button" onClick={() => setSelected(undefined)}>Close</button></div><pre>{JSON.stringify(inspected, null, 2)}</pre></div>}
    <div className="panel-foot"><span><i className="tiny-dot" />{compact ? "Latest 5 calls" : "Newest 100 matching calls"} · stored in memory</span><span>{compact ? "Select a method to inspect" : `${clearedDetailRows} rows cleared · session totals retained`}</span></div>
  </section>;
}
