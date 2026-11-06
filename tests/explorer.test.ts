import { test } from "node:test";
import assert from "node:assert/strict";
import { describeCode, validateAddress } from "../src/lib/ethereum/explorer";
test("address validation accepts real checksums and rejects invalid input", () => {
  assert.equal(validateAddress(" 0x00000000219ab540356cBB839Cbe05303d7705Fa "), "0x00000000219ab540356cBB839Cbe05303d7705Fa");
  for (const value of ["vitalik.eth", "0x123", "<script>", "0x00000000219ab540356cBB839Cbe05303d7705FA"]) assert.throws(() => validateAddress(value), /valid/);
});
test("code classification distinguishes no code, deployed code and EIP-7702 delegation", () => {
  assert.equal(describeCode("0x").kind, "No deployed code");
  assert.equal(describeCode("0x60016000").size, 4);
  assert.equal(describeCode("0x60016000").hash.length, 66);
  assert.equal(describeCode(`0xef0100${"11".repeat(20)}`).kind, "Delegated account (EIP-7702)");
  assert.throws(() => describeCode("0x123"), /malformed/);
});
