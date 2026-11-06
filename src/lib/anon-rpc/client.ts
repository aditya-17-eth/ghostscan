import type { AnonRpcWorker as Worker, WorkerInit } from "@anon-rpc/browser-harness";
import { toFunctionSelector } from "viem";
import { DEFAULT_RPC, NETWORKS, READ_METHODS, type NetworkId } from "./networks";
import { accounting, redact, type RpcEvent, type Transport } from "../telemetry";

type WorkerLike = Pick<Worker, "ready" | "fetch" | "acceptLog" | "close">;
export type Snapshot = {
  mode: "anon" | "direct"; network: NetworkId;
  status: "idle" | "connecting" | "ready" | "error"; error: string;
  bootMs?: number; workerHash?: string; block?: string;
  events: RpcEvent[]; logs: { at: string; level: string; message: string }[];
  accounting: ReturnType<typeof accounting>; clearedDetailRows: number;
};
const HASH = toFunctionSelector("workerHash()");
const RESOLVERS = toFunctionSelector("workerResolvers()");
export function assertBootstrapCall(address: string, method: string, params: unknown[]) {
  const call = params[0] as { to?: string; data?: string } | undefined;
  if (method !== "eth_call" || params.length !== 2 || params[1] !== "latest" ||
    call?.to?.toLowerCase() !== address.toLowerCase() || ![HASH, RESOLVERS].includes(call?.data as `0x${string}`)) {
    throw new Error("Bootstrap blocked: only workerHash() and workerResolvers() on the selected specifier are allowed.");
  }
}
export function validateRpcUrl(input: string) {
  const u = new URL(input);
  if (u.protocol !== "https:" || u.username || u.password || u.hash) throw new Error("Use an HTTPS RPC URL without embedded credentials or a fragment.");
  return u.href;
}
export class GhostClient {
  private value: Snapshot = { mode: "anon", network: "nym", status: "idle", error: "", events: [], logs: [], accounting: accounting([]), clearedDetailRows: 0 };
  private completedCount = 0;
  private totalDuration = 0;
  private listeners = new Set<() => void>();
  private worker?: WorkerLike;
  private generation = 0;
  private id = 0;
  private controllers = new Set<AbortController>();
  private settings = { bootstrap: DEFAULT_RPC, destination: DEFAULT_RPC };
  constructor(private deps?: { fetch?: typeof fetch; createWorker?: (init: WorkerInit) => Promise<WorkerLike>; bootTimeout?: number; requestTimeout?: number }) {}
  getSnapshot = () => this.value;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private patch(patch: Partial<Snapshot>) { this.value = { ...this.value, ...patch }; this.listeners.forEach(fn => fn()); }
  private note(level: string, message: unknown) {
    this.patch({ logs: [...this.value.logs, { at: new Date().toISOString(), level, message: String(redact(message)) }].slice(-200) });
  }
  clearHistory() { this.patch({ events: [], logs: [], clearedDetailRows: this.value.clearedDetailRows + this.value.events.length }); }
  endpoints() { return { ...this.settings }; }
  configure(bootstrap: string, destination: string) {
    const settings = { bootstrap: validateRpcUrl(bootstrap), destination: validateRpcUrl(destination) };
    this.disconnect(); this.settings = settings;
  }
  disconnect() {
    this.generation++;
    this.controllers.forEach(c => c.abort()); this.controllers.clear();
    this.worker?.close(); this.worker = undefined;
    this.patch({ status: "idle", error: "", bootMs: undefined, workerHash: undefined, block: undefined });
  }
  enableDirect() {
    // Called only from the explicit direct-mode confirmation in the UI.
    this.disconnect(); this.patch({ mode: "direct", status: "ready" });
    this.note("warn", "Direct mode explicitly enabled. The RPC destination receives requests directly from this browser.");
  }
  async connect(network: NetworkId = this.value.network) {
    this.disconnect();
    const generation = this.generation;
    const started = performance.now();
    const chosen = NETWORKS[network];
    this.patch({ mode: "anon", network, status: "connecting", error: "" });
    let w: WorkerLike | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const chain = await this.execute("eth_chainId", [], "bootstrap", this.deps?.fetch ?? fetch, this.settings.bootstrap);
      this.assertCurrent(generation);
      if (chain !== "0x1") throw new Error(`Bootstrap must be Ethereum mainnet (1); received ${chain}.`);
      const init: WorkerInit = { address: chosen.address, config: chosen.config ? { gateways: [...chosen.config.gateways] } : undefined,
        preExisting: { rpcProvider: { request: async ({ method, params = [] }) => {
          this.assertCurrent(generation);
          assertBootstrapCall(chosen.address, method, params);
          const result = await this.execute(method, params, "bootstrap", this.deps?.fetch ?? fetch, this.settings.bootstrap);
          this.assertCurrent(generation);
          if ((params[0] as { data: string }).data === HASH) this.patch({ workerHash: String(result) });
          return result;
        } } } };
      w = this.deps?.createWorker ? await this.deps.createWorker(init) : new (await import("@anon-rpc/browser-harness")).AnonRpcWorker(init);
      this.assertCurrent(generation); this.worker = w;
      void this.pumpLogs(w, generation);
      // Close a late-starting worker after reconnect or timeout as well.
      void w.ready.then(() => { if (generation !== this.generation || this.worker !== w) w?.close(); }, () => {});
      await Promise.race([w.ready, new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Anonymity network startup timed out. Reconnect or try the other documented network.")), this.deps?.bootTimeout ?? 180_000);
      })]);
      this.assertCurrent(generation);
      const destinationChain = await this.execute("eth_chainId", [], "anon", w.fetch, this.settings.destination);
      this.assertCurrent(generation);
      if (destinationChain !== "0x1") throw new Error(`RPC destination is not Ethereum mainnet: ${destinationChain}`);
      this.patch({ status: "ready", bootMs: Math.round(performance.now() - started) });
      this.note("info", `${chosen.name} worker ready. Hash verified by the official harness; mainnet chain ID returned through worker.fetch. Network hops are not independently observed.`);
    } catch (error) {
      w?.close();
      if (generation !== this.generation) return;
      this.worker = undefined;
      const message = error instanceof Error ? error.message : String(error);
      this.patch({ status: "error", error: String(redact(message)) });
      this.note("error", message);
      throw error;
    } finally { clearTimeout(timer); }
  }
  private assertCurrent(generation: number) {
    if (generation !== this.generation) throw new Error("Session changed; stale response discarded.");
  }
  private async pumpLogs(worker: WorkerLike, generation: number) {
    try {
      for (;;) {
        const entry = await worker.acceptLog();
        if (generation !== this.generation) return;
        this.note(entry.level, entry.args.map(arg => typeof arg === "string" ? arg : JSON.stringify(arg)).join(" "));
      }
    } catch { /* close/failure ends the documented acceptLog loop */ }
  }
  async request(method: string, params: unknown[] = []) {
    if (!READ_METHODS.has(method)) throw new Error("Only supported read-only Ethereum RPC methods are allowed.");
    if (this.value.status !== "ready") throw new Error("Transport is not ready. Connect or reconnect before investigating.");
    const generation = this.generation;
    const mode = this.value.mode;
    const selectedFetch = mode === "anon" ? this.worker?.fetch : this.deps?.fetch ?? fetch;
    if (!selectedFetch) throw new Error("Anonymizing worker unavailable. No direct fallback was attempted.");
    try {
      const result = await this.execute(method, params, mode, selectedFetch, this.settings.destination);
      this.assertCurrent(generation);
      if (method === "eth_blockNumber") this.patch({ block: String(result) });
      return result;
    } catch (error) {
      if (generation === this.generation && mode === "anon") {
        this.worker?.close(); this.worker = undefined;
        this.patch({ status: "error", error: String(redact(error instanceof Error ? error.message : error)) });
      }
      throw error;
    }
  }
  // The UI labels the comparison action as sending the address directly too.
  async compareBalance(address: string, block: string) {
    if (this.value.mode !== "anon" || this.value.status !== "ready") throw new Error("Connect Anon-RPC before comparing.");
    const generation = this.generation;
    const params = [address, block];
    const results = await Promise.allSettled([
      this.request("eth_getBalance", params),
      this.execute("eth_getBalance", params, "direct", this.deps?.fetch ?? fetch, this.settings.destination),
    ]);
    this.assertCurrent(generation);
    return results;
  }
  private async execute(method: string, params: unknown[], transport: Transport, fetcher: typeof fetch, url: string): Promise<unknown> {
    const id = ++this.id;
    const started = performance.now();
    const controller = new AbortController(); this.controllers.add(controller);
    const generation = this.generation;
    const event: RpcEvent = { id, at: new Date().toISOString(), method, params: redact(params), transport,
      network: transport === "anon" ? NETWORKS[this.value.network].name : "Ethereum mainnet", status: "pending", duration: 0, sent: true };
    const counts = this.value.accounting;
    const total = counts.total + 1;
    const anon = counts.anon + (transport === "anon" ? 1 : 0);
    this.patch({ events: [...this.value.events, event], accounting: { ...counts, total, anon,
      direct: counts.direct + (transport === "direct" ? 1 : 0), bootstrap: counts.bootstrap + (transport === "bootstrap" ? 1 : 0), coverage: anon / total * 100 } });
    const timer = setTimeout(() => controller.abort(), this.deps?.requestTimeout ?? (transport === "bootstrap" ? 25_000 : 90_000));
    const finish = (patch: Partial<RpcEvent>) => {
      const duration = Math.round(performance.now() - started);
      this.completedCount++; this.totalDuration += duration;
      this.patch({ events: this.value.events.map(e => e.id === id ? { ...e, ...patch, duration } : e),
        accounting: { ...this.value.accounting, failed: this.value.accounting.failed + (patch.status === "error" ? 1 : 0), latency: this.totalDuration / this.completedCount } });
    };
    try {
      const response = await fetcher(url, { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }), signal: controller.signal,
        credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", redirect: "error" });
      if (!response.ok) throw new Error(`RPC returned HTTP ${response.status}`);
      const json = await response.json();
      if (json?.error) throw new Error(`RPC ${json.error.code}: ${json.error.message}`);
      if (json?.jsonrpc !== "2.0" || json.id !== id || typeof json.result !== "string" || !/^0x[0-9a-f]*$/i.test(json.result)) throw new Error("Invalid Ethereum JSON-RPC response.");
      this.assertCurrent(generation);
      finish({ status: "success", result: redact(json.result) });
      return json.result;
    } catch (error) {
      const message = controller.signal.aborted ? "Request cancelled or timed out. No direct fallback was attempted." : error instanceof Error ? error.message : String(error);
      finish({ status: "error", error: String(redact(message)) });
      throw new Error(message);
    } finally { clearTimeout(timer); this.controllers.delete(controller); }
  }
}
