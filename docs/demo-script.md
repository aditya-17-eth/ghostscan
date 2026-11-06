# Live demo script · 2 minutes 50 seconds

Start the local production server ahead of time with `npm run build` and `npm start`. Use public demo addresses only. Have the recorded verification files available as dated evidence, never as a substitute for a failed live request.

**0:00–0:20 — The question**

“Ethereum makes wallet state public. Investigating it shouldn't automatically let an RPC provider link your curiosity to your network connection. GHOSTSCAN focuses on the person doing the exploring.”

**0:20–0:45 — Connect**

Show the real Nym connection state. Explain that the application uses the official Anon-RPC 0.4.0 browser harness, mainnet specifier, hash verification and null-origin sandbox. Bootstrap is direct and counted. If startup is slow, narrate the route-design inspector while it connects. Do not call the session active before the UI does.

**0:45–1:15 — Investigate**

Choose Beacon deposit and Explore privately. Show the real ETH balance, code size, nonce and common observed block. Explain that the contract inspector computes a bytecode hash without pretending to know verified source or security findings.

**1:15–1:50 — Compare deliberately**

Open Privacy Lab. Point out the disclosure before clicking “Run comparison (also sends directly).” Show the same balance at the same block and actual elapsed times. Explain that the comparison intentionally reveals this public sample address to the direct RPC provider. Avoid promising that Nym is always faster/slower by a fixed amount.

**1:50–2:15 — Account for traffic**

Open RPC Observatory. Filter bootstrap traffic and inspect its sanitized calls. Show that coverage is below 100% because bootstrap and the comparison were direct. Export the reduced-content report; it includes timing/method data, not investigated addresses or response contents.

**2:15–2:40 — Bound the claim**

“The worker returned real Ethereum responses. We verified application dispatch and observed no direct investigation fallback in anonymous mode. We have not independently verified every relay or network-layer anonymity. The bootstrap provider, specifier owner, worker and anonymity network still require trust.”

Mention Nym's startup/storage limitation and that the documented Tor demo gateway failed the initial directory-bootstrap test. It is an explicit alternative, not a hidden fallback.

**2:40–2:50 — Close**

“Next we want independent transport instrumentation, operator-run gateway resilience and state-proof verification. The core is already real: Ethereum exploration through the official sandboxed anonymity worker.”

If a live request fails, show the actual error and reconnect. Describe the dated verification record honestly; do not switch to direct while claiming anonymity or play a successful state as if it were live.
