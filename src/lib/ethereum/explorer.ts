import { formatEther, getAddress, isAddress, keccak256, type Hex } from "viem";
import type { GhostClient } from "../anon-rpc/client";
export const EXAMPLES = [
  { label: "Beacon deposit", address: "0x00000000219ab540356cBB839Cbe05303d7705Fa" },
  { label: "Wrapped Ether", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
] as const;
export function validateAddress(input: string): Hex {
  const value = input.trim();
  if (!isAddress(value, { strict: true })) throw new Error("Enter a valid 42-character Ethereum address. Mixed-case addresses must have a valid checksum. ENS is not enabled.");
  return getAddress(value);
}
export function describeCode(code: Hex) {
  if (!/^0x(?:[a-f0-9]{2})*$/i.test(code)) throw new Error("RPC returned malformed bytecode.");
  const size = (code.length - 2) / 2;
  return { size, hash: keccak256(code), kind: size === 0 ? "No deployed code" : size === 23 && code.startsWith("0xef0100") ? "Delegated account (EIP-7702)" : "Smart contract / code-bearing account" };
}
export type Investigation = Awaited<ReturnType<typeof investigate>>;
export async function investigate(client: GhostClient, input: string) {
  const address = validateAddress(input);
  const block = await client.request("eth_blockNumber") as Hex;
  const [balance, nonce, code] = await Promise.all([
    client.request("eth_getBalance", [address, block]),
    client.request("eth_getTransactionCount", [address, block]),
    client.request("eth_getCode", [address, block]),
  ]) as [Hex, Hex, Hex];
  return { address, block, blockDecimal: BigInt(block).toString(), balance, ether: formatEther(BigInt(balance)),
    nonce: BigInt(nonce).toString(), code, ...describeCode(code), observedAt: new Date().toISOString(),
    transport: client.getSnapshot().mode, network: client.getSnapshot().network };
}
