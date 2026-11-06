# Verification evidence

All blockchain results in these records were obtained from actual browser-worker requests against Ethereum mainnet. Sample addresses are public contracts/accounts selected for testing. No private user investigation is included. These are dated observations, not a live feed or independent anonymity audit.

| Record | Evidence |
| --- | --- |
| [initial-nym.json](initial-nym.json) | First working core milestone, 6 Nov 2026, 22:01:53 IST. Nym worker ready in 29.171 seconds; block 26357023; deposit balance 93115397.567313470399106838 ETH. Only three expected direct host bootstrap RPCs observed. |
| [initial-tor.json](initial-tor.json) | Tor worker bundle loaded and emitted real diagnostics. Directory consensus / circuit attempts failed; 180-second app timeout. No successful Tor RPC or fallback is claimed. |
| [production-browser.json](production-browser.json) | Full real production-browser checks: addresses, classification, comparison, filtering/export, explicit direct mode, reconnect and mobile navigation. |
| [production-export.json](production-export.json) | Actual reduced-content exported telemetry window: 20 calls, 16 anon, 3 bootstrap, 1 explicit direct, 80% coverage. No parameters or response contents. |
| [recovery.json](recovery.json) | An intentionally injected bootstrap HTTP 503 is visible with no direct investigation fallback; injection removed and real Nym reconnect/address reads pass. Fault injection is not used as evidence of network success. |
| [final-browser.json](final-browser.json) | Final production run: 13 real-browser checks, including retaining session totals after clearing details and keyboard focus containment in the explicit direct-mode confirmation. |
| [final-export.json](final-export.json) and [final-cleared-export.json](final-cleared-export.json) | Final session export before/after clearing 20 detail rows. Both retain the same totals: 16 anon, 3 bootstrap, 1 direct, 80% coverage. The cleared export contains no event detail rows. |

Production comparison observed equal balances at a shared block. One run measured 291 ms direct and 1.19 seconds through Nym. Request latency varies; do not present these as permanent performance guarantees.

The live core verifier observes host JSON-RPC POSTs and application diagnostics. It does not observe all tunnel traffic, independently establish the exit IP, audit the worker source or rule out correlation. The Nym worker's `nym tunnel ready` message is explicitly a worker diagnostic. The worker's opaque-origin IndexedDB shim warning means its identity was in memory for that run.

The browser test scripts create fresh `test-results/` files and screenshots. Unit fixtures verify application policy and lifecycle behavior; mocked responses are not evidence of real anonymity transport. Reproduce with the commands in the root README.

The earlier production export is retained unchanged as historical evidence; its note predates the detail-clearing accounting hardening. The final exports document current behavior: totals survive detail clearing. Eleven unit tests, TypeScript checks, ESLint and the static production build pass. The dependency override for the lint-only minimatch advisory yields zero reported vulnerabilities from npm audit at verification time.
