# Privacy threat model and known limitations

## Intended protection

Reduce the direct association between a user's network origin and Ethereum account queries at the final RPC provider, by routing supported reads through a genuine anonymity-network worker. Blockchain state itself remains public. No claim of complete anonymity, unlinkability or resistance to a global observer is made.

## Trust boundaries

| Party / boundary | Observability or trust |
| --- | --- |
| Application host | Sees page requests and serves executable application code. A compromised host could replace the application. Static export removes the need for an investigation backend; it does not remove trust in the delivered code. |
| Bootstrap RPC | Sees the client's connection and the specifier/chain reads. It supplies the expected worker hash and can lie about it. Hash verification protects against a resolver serving different bytes **relative to this supplied hash**. |
| Specifier owner | May be able to change the worker hash/resolvers. Current ownership, upgrade policy and immutability have not been independently audited by GHOSTSCAN. The recorded hash is a dated observation, not an additional immutable application pin. |
| Resolver / CDN | Sees bundle download metadata and which worker is selected. Untrusted for bundle integrity: the official harness rejects bytes with a different keccak256. |
| Sandboxed worker | Sees requests/responses and can observe, censor or falsify them. Null-origin iframe plus Web Worker isolates host DOM, cookies and application context; isolation is not a code audit or RPC-result proof. The network worker has its own persistence capability. |
| Network entry / gateways | Can learn that a client is using the network. Nym and Tor have different route construction, operator trust, gateway and exit assumptions. Browser connectivity/firewall policies may prevent connection. |
| Network exit / RPC destination | Destination sees requested addresses, methods and responses. An exit architecture and TLS placement determine what intermediaries see. The app does not independently verify TLS endpoints, relay paths or exit IPs inside the transport. |
| Browser / device | Extensions, fingerprinting, a compromised browser, local malware or device inspection are outside this protection. |
| Other services | Clicking Etherscan or documentation links contacts those services. Etherscan receives the investigated address when that link is used. The app does not automatically contact an address indexer or ENS service. |

## What was established

The published official browser harness loaded a specifier-identified Nym worker, signaled readiness, and returned real mainnet chain ID, block, balance, nonce and bytecode values. Browser instrumentation saw no host-direct investigation JSON-RPC in default anonymous mode. Explicit comparison/direct-mode actions produced the expected directly observed calls. Unit tests verify fail-closed selection and stale-response handling.

These observations **do not establish** that all network packets followed a particular relay path, that a worker could not make its own undisclosed communications, that an observer cannot correlate timings, or that RPC results are cryptographically proven Ethereum state. Independent packet capture, infrastructure instrumentation, source audits and/or state-proof verification would be needed for stronger claims.

## Network-specific limitations

**Nym (default):** official documented mainnet specifier, configuration undefined, roughly 18 MB WASM bundle. Depends on reachable gateways, routing nodes and IP Packet Routers. Startup and latency vary significantly. The tested bundle logged `nym tunnel ready` and reported that its ambient IndexedDB shim was denied and used in-memory identity storage. This may change identity behavior across starts; it is not an anonymity guarantee. The harness separately provides specifier-scoped host IndexedDB storage.

**Tor (explicit alternative):** browser Tor client using documented KPS gateway. The demonstration gateway has limited capacity and may be removed. The initial test loaded the verified bundle but could not obtain directory consensus/build circuits and hit the application's 180-second startup limit. No successful Tor blockchain request is claimed. An operator-run gateway requires reviewing/updating the documented Tor config in `src/lib/anon-rpc/networks.ts`; the MVP does not expose an arbitrary gateway editor.

Both networks rely on experimental workers and Anon-RPC's prototype-grade implementation of draft spec 0.4.0. Updates can change behavior and APIs. No per-address route isolation guarantee is claimed; the MVP does not set `anonOptions.isolationKey` because it has not verified that the selected workers implement it.

## Application safeguards

- Read-only allowlist. No transaction submission, signing, wallet connection or credential collection.
- Anon-RPC on each page load. Bootstrap is narrowly restricted to chain validation and two selected-specifier views.
- No automatic direct fallback and no automatic alternative-network selection. Failures are visible and reconnection is explicit.
- The direct-mode switch requires confirmation. The comparison action discloses direct address transmission before it runs.
- Balance, nonce and code use one fixed observed block. A result is a dated observation, not an ever-current balance.
- Reuse a worker, close it on replacement, cancel pending application requests and discard responses from superseded generations.
- Input validation before RPC; React text rendering, no unsafe HTML or URL-based searches.
- No analytics SDKs, tracking pixels, application search storage, external fonts or user-investigation API routes.
- Redacted parameters/results and a bounded worker-message buffer in browser memory. Export strips investigation content, URLs and raw logs. Exported method/timing data can still reveal usage patterns.

## Remaining engineering limits

The client times out startup after 180 seconds, direct bootstrap requests after 25 seconds, and other RPC requests after 90 seconds. Timeout ends that session, not a proof the network is globally unavailable. A reconnect can recover transient failures.

The upstream harness does not expose a single abort signal for the entire resolver/sandbox boot sequence; `close()` and application generation checks are used, including closing obsolete workers if they later report readiness. Very early closure while an upstream resolver is still fetching warrants additional lifecycle hardening upstream. Page closure also releases the browser execution context. Tests cover application cancellation and ordinary post-ready replacement; they do not exhaustively establish absence of every upstream resource race.

The route drawing is a network-design explanation, not a live hop map. Coverage concerns application-dispatched JSON-RPC, including bootstrap and failed attempts, not all browser traffic. Asset downloads, bundle fetches, network-internal bootstrap and gateway connections are excluded and uninstrumented. No privacy scores or anonymity-set estimates are generated.

There is no indexer, full address transaction history, ENS resolution, fiat valuation, verified-source retrieval or security analysis. Multiple RPC providers or Ethereum state proofs would be required to strengthen response authenticity. Public endpoint availability, rate limits and exit policies can change.
