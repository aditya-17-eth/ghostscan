import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
const hostRpc = [];
page.on("request", req => {
  try { const body = JSON.parse(req.postData()); if (body.jsonrpc) hostRpc.push({ method: body.method, params: body.params }); } catch { /* not RPC */ }
});
try {
  await mkdir("test-results", { recursive: true });
  await page.route("https://ethereum-rpc.publicnode.com/**", route => route.fulfill({ status: 503, contentType: "text/plain", body: "Injected bootstrap outage for failure-path verification" }));
  await page.goto(`${process.env.TEST_URL ?? "http://127.0.0.1:4173"}/terminal`);
  await page.getByTestId("status").filter({ hasText: "ANON-RPC UNAVAILABLE" }).waitFor();
  assert.match(await page.getByRole("status").innerText(), /HTTP 503/);
  assert.equal(hostRpc.filter(r => r.method !== "eth_chainId").length, 0);
  await page.screenshot({ path: "test-results/bootstrap-failure.png", fullPage: true });
  console.log("PASS injected bootstrap HTTP 503 is visible with no investigation fallback");
  await page.unroute("https://ethereum-rpc.publicnode.com/**");
  await page.getByRole("button", { name: "Reconnect", exact: true }).click();
  await page.getByTestId("status").filter({ hasText: "ANON-RPC ACTIVE" }).waitFor({ timeout: 240_000 });
  await page.getByLabel("Ethereum address", { exact: true }).fill("0x00000000219ab540356cBB839Cbe05303d7705Fa");
  await page.getByRole("button", { name: "Explore privately", exact: true }).click();
  await page.getByTestId("investigation-result").waitFor({ timeout: 120_000 });
  assert.equal(hostRpc.filter(r => ["eth_getBalance", "eth_blockNumber", "eth_getCode", "eth_getTransactionCount"].includes(r.method)).length, 0);
  await writeFile("test-results/recovery.json", JSON.stringify({ testedAt: new Date().toISOString(), injectedFailure: "Bootstrap HTTP 503 (fault injection only; not evidence of network success)", visibleError: true, recovery: "Real Nym reconnect and real Ethereum address investigation succeeded", noDirectInvestigationFallbackObserved: true, hostRpc }, null, 2));
  console.log("PASS real Nym reconnect and address investigation recover without direct fallback");
} finally { await browser.close(); }
