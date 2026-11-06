import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const requests = [];
const errors = [];
let progress;
page.on("request", req => {
  if (req.method() === "POST" && req.postData()?.includes('"jsonrpc"')) {
    try {
      const body = JSON.parse(req.postData());
      requests.push({ url: req.url(), method: body.method, params: body.params });
    } catch { /* non-JSON third-party protocol */ }
  }
});
page.on("pageerror", e => errors.push(e.message));
page.on("console", msg => { if (["error", "warning"].includes(msg.type())) errors.push(msg.text().slice(0, 1000)); });
try {
  await page.goto(`${process.env.TEST_URL ?? "http://127.0.0.1:3000"}/verify`, { waitUntil: "networkidle" });
  if (process.env.NETWORK) await page.getByLabel("Anonymity network").selectOption(process.env.NETWORK);
  await page.getByRole("button", { name: "Verify real worker" }).click();
  progress = setInterval(async () => {
    try {
      const state = JSON.parse(await page.getByTestId("diagnostics").innerText());
      console.log(JSON.stringify({ progress: state.status, latest: state.logs.slice(-2), rpc: state.events.map(e => ({ method: e.method, transport: e.transport, status: e.status })) }));
    } catch { /* test teardown */ }
  }, 20_000);
  await page.waitForFunction(() => document.querySelector('[data-testid="result"]')?.textContent?.trim(), undefined, { timeout: 300_000 });
  const result = JSON.parse(await page.getByTestId("result").innerText());
  const diagnostics = JSON.parse(await page.getByTestId("diagnostics").innerText());
  const investigations = requests.filter(r => ["eth_getBalance", "eth_getCode", "eth_getTransactionCount", "eth_blockNumber"].includes(r.method));
  const evidence = { testedAt: new Date().toISOString(), result, diagnostics, observedHostRpc: requests, directInvestigationRequests: investigations, browserErrors: errors,
    conclusion: result.balance && result.block && investigations.length === 0 ? "Real worker requests returned; no host direct investigation RPC observed. Does not independently verify network anonymity." : "Integration not verified; see actual error." };
  await mkdir("test-results", { recursive: true });
  await writeFile(`test-results/live-${process.env.NETWORK ?? "nym"}.json`, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence, null, 2));
  if (!result.balance || !result.block || investigations.length) process.exitCode = 1;
} finally { clearInterval(progress); await browser.close(); }
