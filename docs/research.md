# Official-resource review

Reviewed on 6 November 2026 **before writing the integration**. The empty repository was initialized after this review.

| Resource | Review and implementation consequence |
| --- | --- |
| [Homepage](https://ethereum.github.io/anon-rpc/) and [interactive balance demo](https://ethereum.github.io/anon-rpc/demo/) | Studied specifier → verified bundle → sandboxed fetch architecture. Read the actual balance-watcher implementation, not only the marketing description. |
| [Wallet/application guide](https://ethereum.github.io/anon-rpc/wallets/) | Primary initialization reference: constructor, address, opaque config, `preExisting.rpcProvider`, `ready`, bound `fetch`, `close`, failure behavior and long-lived workers. |
| [Anonymity-network guide](https://ethereum.github.io/anon-rpc/networks/) | Reviewed the capability API, `signalReady` / `signalFailed`, accept loop, KPS, optional ambient APIs, scoped storage, hash identity and ownership/upgrades. |
| [Official repository](https://github.com/ethereum/anon-rpc) | Cloned and inspected commit `c8980fb1f89d712c91595863e6f53bd63f64c56d`: `impl/site/src/demo/main.ts`, `adopters.json5`, browser-harness README/exports/host class, request normalization, core specifier implementation and spec types. |
| [Browser harness on npm](https://www.npmjs.com/package/@anon-rpc/browser-harness) | npm website returned HTTP 403 through the browser fetch. Verified the published npm registry metadata with `npm view`, then reviewed the official source README and installed package contents. Version 0.4.0, root export `AnonRpcWorker` / `RpcError`, exported types and `./iframe-boot.js`. Installed exact version. |
| [Extension harness on npm](https://www.npmjs.com/package/@anon-rpc/browser-extension-harness) | npm website also returned HTTP 403. Verified registry metadata and official package README/exports: version 0.4.0, MV3 offscreen/background DOM and packaged sandbox assets. It wraps the browser harness for extension-specific constraints. **Not installed** for this web app. |

Also reviewed the [draft specification](https://ethereum.github.io/anon-rpc/spec/), version 0.4.0 (23 October 2026), and the ETHGlobal Mumbai prize page. No claimed prize award or eligibility determination is made.

## Network selection

The official `adopters.json5` distinguishes genuine networks (`kind: network`) from passthrough (`kind: reference`). Passthrough performs ordinary fetch and is never offered as a privacy mode.

| Network | Mainnet specifier | Configuration | Observed result |
| --- | --- | --- | --- |
| Nym | `0x3aCD9742C68F6d993066Ae25533e09b9e1f60eD0` | `undefined` | Real block and balance passed; selected as default. |
| tor-js | `0x700dA3193D35fA54Cd3fBf29B66f2a2A0385659e` | `gateways` with documented KPS address below | Bundle started, directory bootstrap failed, application timed out after 180 seconds. Explicit alternative only. |

Tor's documented demonstration gateway:

```text
152.236.3.22:12298:uEiCH0VdbhryzJcMtCfB0vLA4sOvHdQ4hq5w7CopcwU59bQ
```

The official guide cautions that it has limited capacity and can disappear. Browser Tor requires a transport gateway because browsers cannot open Tor's raw TCP connections. Nym's approximately 18 MB WASM bundle uses its mixnet and IP Packet Router architecture. These are upstream design descriptions; GHOSTSCAN does not independently trace their relays.

Nox is also listed upstream, but its specifier is on Sepolia. It was not added to this MVP: supporting another bootstrap chain would add scope without improving the already working Nym path.

## Initialization verified against source

1. Validate bootstrap chain as mainnet with a recorded direct `eth_chainId`.
2. Construct the official worker with the documented mainnet address and config.
3. Allow its bootstrap provider only the two exact specifier selectors. Source `readSpecifier` performs **two** `eth_call`s, even though the guide informally describes one bootstrap read.
4. Harness fetches resolver bytes, checks keccak256, and runs them inside a Web Worker in `sandbox="allow-scripts"`, null-origin iframe.
5. Drain `acceptLog()` with a bounded, sanitized application log buffer.
6. Await `ready`; validate destination chain through `worker.fetch`.
7. Run real `eth_blockNumber` and block-pinned `eth_getBalance` through `worker.fetch`.
8. Close on failure, disconnect or replacement, and reject stale results. Keep one worker for subsequent requests.

The browser test separately observes host JSON-RPC POSTs. In anonymous investigations those contained only the three expected direct bootstrap operations. There is no silent ordinary-fetch recovery branch. The separate explicit direct comparison and direct mode are accounted for as direct calls.

See [verification records](verification/README.md) for raw test observations and the distinction between successful application routing and unverified network anonymity.
