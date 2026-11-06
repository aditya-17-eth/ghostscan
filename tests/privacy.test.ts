import { test } from "node:test";
import assert from "node:assert/strict";
import { toFunctionSelector } from "viem";
import { GhostClient, assertBootstrapCall, validateRpcUrl } from "../src/lib/anon-rpc/client";
import { NETWORKS } from "../src/lib/anon-rpc/networks";
import { accounting, diagnosticReport } from "../src/lib/telemetry";

const ADDRESS = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
const jsonResponse = (init: RequestInit | undefined, result: string) => {
  const request = JSON.parse(String(init?.body));
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: request.id, result }), { headers: { "content-type": "application/json" } });
};
function fixture(fail = false) {
  const directMethods: string[] = [];
  const anonMethods: string[] = [];
  const workers: { closed: boolean }[] = [];
  const client = new GhostClient({
    fetch: async (_url, init) => {
      const method = JSON.parse(String(init?.body)).method;
      directMethods.push(method);
      return jsonResponse(init, method === "eth_chainId" ? "0x1" : "0x1234");
    },
    createWorker: async init => {
      await init.preExisting!.rpcProvider!.request({ method: "eth_call", params: [{ to: init.address, data: toFunctionSelector("workerHash()") }, "latest"] });
      await init.preExisting!.rpcProvider!.request({ method: "eth_call", params: [{ to: init.address, data: toFunctionSelector("workerResolvers()") }, "latest"] });
      const worker = { closed: false, ready: Promise.resolve(),
        acceptLog: async () => { throw new Error("logs drained"); },
        fetch: async (_url: unknown, options?: RequestInit) => {
          const method = JSON.parse(String(options?.body)).method; anonMethods.push(method);
          if (fail && method === "eth_getBalance") throw new Error("gateway offline");
          return jsonResponse(options, method === "eth_chainId" ? "0x1" : "0x1234");
        },
        close() { this.closed = true; },
      };
      workers.push(worker); return worker;
    },
  });
  return { client, directMethods, anonMethods, workers };
}
test("bootstrap rejects investigation calls, wrong contract, selectors, and block tags", () => {
  const address = NETWORKS.tor.address;
  assert.doesNotThrow(() => assertBootstrapCall(address, "eth_call", [{ to: address, data: toFunctionSelector("workerHash()") }, "latest"]));
  for (const [method, params] of [
    ["eth_getBalance", [ADDRESS, "latest"]],
    ["eth_call", [{ to: ADDRESS, data: toFunctionSelector("workerHash()") }, "latest"]],
    ["eth_call", [{ to: address, data: "0x12345678" }, "latest"]],
    ["eth_call", [{ to: address, data: toFunctionSelector("workerHash()") }, "pending"]],
  ] as [string, unknown[]][]) assert.throws(() => assertBootstrapCall(address, method, params), /Bootstrap blocked/);
});
test("anon is default, worker handles investigations, and bootstrap lowers coverage", async () => {
  const { client, directMethods, anonMethods } = fixture();
  assert.equal(client.getSnapshot().mode, "anon");
  await assert.rejects(client.request("eth_getBalance", [ADDRESS, "latest"]), /not ready/);
  await client.connect();
  assert.equal(await client.request("eth_getBalance", [ADDRESS, "latest"]), "0x1234");
  assert.deepEqual(directMethods, ["eth_chainId", "eth_call", "eth_call"]);
  assert.deepEqual(anonMethods, ["eth_chainId", "eth_getBalance"]);
  assert.equal(accounting(client.getSnapshot().events).coverage, 40);
  await assert.rejects(client.request("eth_sendRawTransaction"), /read-only/);
  client.disconnect();
});
test("worker errors stay visible, close worker, and never trigger direct fallback", async () => {
  const { client, directMethods, workers } = fixture(true);
  await client.connect();
  await assert.rejects(client.request("eth_getBalance", [ADDRESS, "latest"]), /gateway offline/);
  assert.equal(client.getSnapshot().status, "error");
  assert.match(client.getSnapshot().error, /gateway offline/);
  assert.equal(workers[0].closed, true);
  assert.deepEqual(directMethods, ["eth_chainId", "eth_call", "eth_call"]);
  await assert.rejects(client.request("eth_getBalance", [ADDRESS, "latest"]), /not ready/);
});
test("network switching closes previous worker and reconnect restores readiness", async () => {
  const { client, workers } = fixture();
  await client.connect("tor"); await client.connect("nym");
  assert.equal(workers[0].closed, true);
  assert.equal(client.getSnapshot().network, "nym");
  assert.equal(client.getSnapshot().status, "ready");
  client.disconnect(); assert.equal(workers[1].closed, true);
});
test("direct mode must be enabled explicitly; export excludes investigation contents", async () => {
  const { client, directMethods } = fixture();
  client.enableDirect();
  await client.request("eth_getBalance", [ADDRESS, "latest"]);
  assert.deepEqual(directMethods, ["eth_getBalance"]);
  const report = JSON.stringify(diagnosticReport(client.getSnapshot().events));
  assert.equal(report.includes(ADDRESS), false);
  assert.equal(report.includes("0x1234"), false);
  assert.equal(report.includes('"params"'), false);
  const beforeClear = client.getSnapshot().accounting;
  client.clearHistory(); assert.equal(client.getSnapshot().events.length, 0);
  assert.deepEqual(client.getSnapshot().accounting, beforeClear);
  assert.equal(client.getSnapshot().clearedDetailRows, 1);
  client.disconnect();
});
test("clearing details retains direct bootstrap accounting and prevents false 100% coverage", async () => {
  const { client } = fixture();
  await client.connect();
  client.clearHistory();
  await client.request("eth_getBalance", [ADDRESS, "latest"]);
  const state = client.getSnapshot();
  assert.equal(state.events.length, 1);
  assert.equal(state.accounting.bootstrap, 3);
  assert.equal(state.accounting.coverage, 40);
  const report = diagnosticReport(state.events, state.accounting, state.clearedDetailRows);
  assert.equal(report.accounting.total, 5);
  assert.equal(report.clearedDetailRows, 4);
  client.disconnect();
});
test("RPC settings reject unsafe URL schemes and embedded credentials", () => {
  assert.equal(validateRpcUrl("https://rpc.example"), "https://rpc.example/");
  for (const url of ["http://rpc.example", "javascript:alert(1)", "https://key:secret@rpc.example", "https://rpc.example/#key"]) assert.throws(() => validateRpcUrl(url));
});
test("initialization timeout closes the worker and does not retry investigations directly", async () => {
  let closed = false;
  const direct: string[] = [];
  const client = new GhostClient({ bootTimeout: 15,
    fetch: async (_url, init) => { direct.push(JSON.parse(String(init?.body)).method); return jsonResponse(init, "0x1"); },
    createWorker: async () => ({ ready: new Promise<void>(() => {}), acceptLog: async () => { throw new Error("drained"); }, close() { closed = true; }, fetch: async () => { throw new Error("must not dispatch"); } }),
  });
  await assert.rejects(client.connect(), /startup timed out/);
  assert.equal(closed, true);
  assert.equal(client.getSnapshot().status, "error");
  assert.deepEqual(direct, ["eth_chainId"]);
});
test("an old worker response cannot update a newly selected direct session", async () => {
  let release: (() => void) | undefined;
  let count = 0;
  const client = new GhostClient({
    fetch: async (_url, init) => jsonResponse(init, "0x1"),
    createWorker: async () => ({ ready: Promise.resolve(), acceptLog: async () => { throw new Error("drained"); }, close() {},
      fetch: async (_url, init) => { count++; if (count > 1) await new Promise<void>(resolve => { release = resolve; }); return jsonResponse(init, count === 1 ? "0x1" : "0x1234"); },
    }),
  });
  await client.connect();
  const request = client.request("eth_blockNumber");
  client.enableDirect(); release!();
  await assert.rejects(request, /cancelled|stale response discarded/);
  assert.equal(client.getSnapshot().mode, "direct");
  assert.equal(client.getSnapshot().status, "ready");
  assert.equal(client.getSnapshot().block, undefined);
});
