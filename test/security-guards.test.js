import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../contracts/Suraya.sol", import.meta.url), "utf8");

function functionSource(signature, fromIndex = 0) {
  const start = source.indexOf(signature, fromIndex);
  assert.notEqual(start, -1, `missing function: ${signature}`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated function: ${signature}`);
}

test("ARZA self-service minting is admin-gated", () => {
  assert.match(functionSource("function generateBio(address entity, uint256 baseAmount)"), /public onlyAdmin/);
});

test("token transfers reject zero addresses", () => {
  assert.match(functionSource("function transferFrom(address from, address to, uint256 value)"), /from != address\(0\) && to != address\(0\)/);
  assert.match(functionSource("function _mint(address to, uint256 amount)"), /to != address\(0\)/);
});

test("balance decay remains disabled until a real activity oracle exists", () => {
  assert.match(functionSource("function applyDecay(address)"), /revert\("Activity oracle not configured/);
});

test("entities cannot be registered or created for arbitrary third parties", () => {
  assert.match(functionSource("function registerEntity(address addr"), /addr == msg.sender \|\| msg.sender == admin/);
  assert.match(functionSource("function createEntity(string memory name"), /owner == msg.sender \|\| msg.sender == admin/);
});

test("DAO votes require token-backed voting power without reputation inflation", () => {
  const vote = functionSource("function castVote(uint256 id, bool support)");
  assert.match(vote, /votingBalance >= 10\*\*8/);
  assert.match(vote, /uint256 weight = votingBalance \/ 10\*\*8/);
});

test("treasury receipts are reconciled against actual token balance changes", () => {
  const receive = functionSource("function recordReceive(uint256, string memory)");
  assert.match(receive, /currentBalance > lastRecordedBalance/);
  assert.match(receive, /actualReceived = currentBalance - lastRecordedBalance/);
  assert.doesNotMatch(receive, /totalReceived \+= amount/);
});

test("treasury spends and NFT mints reject zero recipients", () => {
  assert.match(functionSource("function requestSpend(address to"), /to != address\(0\) && amount > 0/);
  assert.match(functionSource("function mintMissionNFT(address to", source.indexOf("contract NFTIntelligence")), /to != address\(0\)/);
  assert.match(functionSource("function mintCharacter(address to"), /to != address\(0\)/);
});
