export type Transport = "anon" | "direct" | "bootstrap";
export type RpcEvent = {
  id: number; at: string; method: string; transport: Transport; network: string;
  status: "pending" | "success" | "error"; duration: number; sent: boolean;
  params: unknown; result?: unknown; error?: string;
};
export function redact(value: unknown): unknown {
  if (typeof value === "string") return value
    .replace(/https?:\/\/[^\s"'<>]+/g, "[endpoint]")
    .replace(/0x[0-9a-fA-F]{40,}/g, "[hex redacted]")
    .slice(0, 1500);
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v)]));
  return value;
}
export function accounting(events: RpcEvent[]) {
  const sent = events.filter(e => e.sent);
  const anon = sent.filter(e => e.transport === "anon").length;
  const finished = sent.filter(e => e.status !== "pending");
  return { total: sent.length, anon, direct: sent.filter(e => e.transport === "direct").length,
    bootstrap: sent.filter(e => e.transport === "bootstrap").length,
    failed: sent.filter(e => e.status === "error").length,
    coverage: sent.length ? anon / sent.length * 100 : 0,
    latency: finished.length ? finished.reduce((sum, e) => sum + e.duration, 0) / finished.length : 0 };
}
export function diagnosticReport(events: RpcEvent[], totals = accounting(events), clearedDetailRows = 0) {
  // Intentionally omit parameters, results, raw error messages, URLs and worker logs.
  return { schema: 1, generatedAt: new Date().toISOString(), accounting: totals, clearedDetailRows,
    note: "Application dispatch measurements only; no independently verified network hops or anonymity guarantee. Session totals include cleared detail rows. Page reload starts a new session.",
    events: events.map(({ id, at, method, transport, network, status, duration, sent }) => ({ id, at, method, transport, network, status, duration, sent })) };
}
