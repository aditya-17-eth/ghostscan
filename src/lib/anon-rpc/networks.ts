// Official ethereum/anon-rpc adopters.json5, commit c8980fb (reviewed 2026-11-06).
// Passthrough is deliberately excluded: a sandbox is not an anonymity network.
export const NETWORKS = {
  tor: {
    name: "Tor", chainId: 1,
    address: "0x700dA3193D35fA54Cd3fBf29B66f2a2A0385659e",
    config: { gateways: ["152.236.3.22:12298:uEiCH0VdbhryzJcMtCfB0vLA4sOvHdQ4hq5w7CopcwU59bQ"] },
    limitation: "Experimental browser Tor client. The public KPS demonstration gateway has limited capacity and may disappear. Run your own gateway for sustained use. WebRTC/UDP access is required.",
  },
  nym: {
    name: "Nym", chainId: 1,
    address: "0x3aCD9742C68F6d993066Ae25533e09b9e1f60eD0",
    config: undefined,
    limitation: "Experimental WASM mixnet client; approximately 18 MB download and variable startup and request latency. Depends on available gateways and IP Packet Routers.",
  },
} as const;
export type NetworkId = keyof typeof NETWORKS;
export const DEFAULT_RPC = "https://ethereum-rpc.publicnode.com";
export const READ_METHODS = new Set(["eth_chainId", "eth_blockNumber", "eth_getBalance", "eth_getTransactionCount", "eth_getCode", "eth_call"]);
