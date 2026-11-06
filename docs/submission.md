# GHOSTSCAN

**Your wallet is public. Your curiosity shouldn't be.**

GHOSTSCAN is a read-only Ethereum investigation terminal that protects the researcher's perspective. Conventional RPC infrastructure can associate requested addresses with a client's network connection. GHOSTSCAN routes account and contract reads through a genuine anonymity-network worker using Ethereum Foundation Anon-RPC.

Built with Next.js App Router, React, TypeScript, Tailwind, viem and the official `@anon-rpc/browser-harness@0.4.0`, the MVP defaults to the documented Nym mainnet specifier. The harness resolves and checks the worker's keccak256, runs it inside a null-origin sandbox and supplies the worker-backed fetch used for Ethereum reads.

The explorer returns real balances, nonces and bytecode at a common observed block. Contract inspection reports code size, hash and delegation markers without inventing source or security findings. Privacy Lab deliberately compares direct and Nym balance requests with actual durations. The RPC Observatory accounts for bootstrap, anonymous and explicit direct requests, redacts investigation details and exports reduced-content diagnostics.

Real browser tests verified worker initialization, mainnet block/balance reads, WETH bytecode, no-code classification, measured comparison, direct-mode confirmation and responsive navigation. Direct bootstrap remains visible and lowers the coverage percentage. Worker failures never silently activate ordinary RPC. The documented Tor gateway failed the initial bootstrap test; Nym is the tested default.

Successful responses establish integration, not independently verified network anonymity. Bootstrap trust, worker/specifier governance, endpoint visibility and timing correlation are documented. No wallet, signatures, analytics, application investigation backend or fabricated chain activity are required.

Future work includes independent transport instrumentation, resilient operator-run gateways, specifier-policy verification and Ethereum state-proof verification.

The source is MIT licensed with reproducible setup and verification scripts. Add the repository and live-demo URLs after publication; this local checkout has not been published and has no remote configured.
