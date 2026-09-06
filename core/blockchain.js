/**
 * SURAYA BLOCKCHAIN CORE
 * شامل ۴٪ خودکار به کیف پول مادر
 */
'use strict';
const crypto = require('crypto');
const EventEmitter = require('events');

const CREATOR_WALLET = 'SRY_CREATOR_MOTHER_WALLET';
const CREATOR_SHARE_PERCENT = 4;

const Crypto = {
  hash(data) {
    return crypto.createHash('sha256').update(String(data)).digest('hex');
  },
  merkleRoot(leaves) {
    if (!leaves?.length) return '0'.repeat(64);
    let level = leaves.map(l => this.hash(l));
    while (level.length > 1) {
      const next = [];
      for (let i = 0; i < level.length; i += 2) {
        next.push(this.hash(level[i] + (level[i + 1] || level[i])));
      }
      level = next;
    }
    return level[0];
  }
};

class Transaction {
  constructor({ from, to, amount, type = 'transfer', data = {}, fee = 0 }) {
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.type = type;
    this.data = data;
    this.fee = fee;
    this.timestamp = Date.now();
    this.nonce = Math.floor(Math.random() * 1e9);
    this.hash = Crypto.hash(JSON.stringify({
      from: this.from, to: this.to, amount: this.amount,
      type: this.type, data: this.data, fee: this.fee,
      timestamp: this.timestamp, nonce: this.nonce
    }));
  }
  toJSON() { return { ...this }; }
  static fromJSON(j) {
    const t = new Transaction(j);
    Object.assign(t, j);
    return t;
  }
}

class Block {
  constructor({ index, previousHash, timestamp, transactions, proposer, intelligenceScore }) {
    this.index = index;
    this.previousHash = previousHash;
    this.timestamp = timestamp || Date.now();
    this.transactions = transactions || [];
    this.proposer = proposer;
    this.intelligenceScore = intelligenceScore || 0;
    this.merkleRoot = Crypto.merkleRoot(
      this.transactions.map(tx => tx.hash || Crypto.hash(JSON.stringify(tx)))
    );
    this.nonce = 0;
    this.hash = this.calculateHash();
  }
  calculateHash() {
    return Crypto.hash([
      this.index, this.previousHash, this.timestamp,
      this.merkleRoot, this.proposer, this.intelligenceScore, this.nonce
    ].join('|'));
  }
  mine(difficulty = 2) {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    return this;
  }
}

class ProofOfIntelligence {
  constructor() {
    this.scores = new Map();
    this.metrics = new Map();
  }
  updateMetrics(nodeId, m) {
    this.metrics.set(nodeId, { ...m, updated: Date.now() });
    this.calculate(nodeId);
  }
  calculate(nodeId) {
    const m = this.metrics.get(nodeId) || {};
    const score =
      (m.validationAccuracy ?? 80) * 0.25 +
      Math.max(0, 100 - ((m.responseTimeMs ?? 200) / 10)) * 0.15 +
      (m.predictionAccuracy ?? 70) * 0.20 +
      (m.problemSolving ?? 75) * 0.15 +
      (m.honesty ?? 95) * 0.15 +
      (m.mentoring ?? 50) * 0.05 +
      (m.innovation ?? 40) * 0.05;
    this.scores.set(nodeId, score);
    return score;
  }
  selectProposer() {
    const nodes = [...this.scores.keys()];
    if (!nodes.length) return null;
    const weights = nodes.map(n => this.scores.get(n) || 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < nodes.length; i++) {
      r -= weights[i];
      if (r <= 0) return { nodeId: nodes[i], score: this.scores.get(nodes[i]) };
    }
    return { nodeId: nodes.at(-1), score: this.scores.get(nodes.at(-1)) };
  }
  async validateBlock(block) {
    return {
      isValid: !!(block.hash && block.merkleRoot && Array.isArray(block.transactions)),
      checks: []
    };
  }
  reward(nodeId, base = 10) {
    const score = this.scores.get(nodeId) || 0;
    return { totalReward: base + (score * base / 100) };
  }
}

class SurayaChain extends EventEmitter {
  constructor(config = {}) {
    super();
    this.chain = [];
    this.pending = [];
    this.difficulty = config.difficulty || 2;
    this.blockReward = config.blockReward || 50;
    this.maxTx = config.maxTxPerBlock || 1000;
    this.poi = new ProofOfIntelligence();
    this.nodes = new Map();
    this.balances = new Map();
    this._genesis();
  }

  _genesis() {
    const g = new Block({
      index: 0,
      previousHash: '0'.repeat(64),
      transactions: [{
        from: 'SYSTEM', to: 'GENESIS', amount: 0, type: 'genesis',
        data: { message: 'Suraya – Proof of Intelligence' }
      }],
      proposer: 'GENESIS',
      intelligenceScore: 100
    });
    g.hash = g.calculateHash();
    this.chain.push(g);
  }

  getLatest() { return this.chain.at(-1); }
  getBalance(addr) { return this.balances.get(addr) || 0; }

  addTransaction(tx) {
    if (!(tx instanceof Transaction)) tx = Transaction.fromJSON(tx);
    this.pending.push(tx);
    return tx.hash;
  }

  async mine(proposerId = null) {
    let proposer = proposerId;
    if (!proposer) {
      const sel = this.poi.selectProposer();
      proposer = sel?.nodeId || 'SYSTEM';
    }

    const score = this.poi.scores.get(proposer) || 50;
    const txs = this.pending.splice(0, this.maxTx);

    const totalReward = this.blockReward;
    const creatorShare = Math.floor(totalReward * CREATOR_SHARE_PERCENT / 100);
    const minerShare = totalReward - creatorShare;

    // ۹۶٪ به استخراج‌کننده
    txs.unshift(new Transaction({
      from: 'SYSTEM',
      to: proposer,
      amount: minerShare,
      type: 'block_reward',
      data: { intelligenceScore: score, note: 'پاداش استخراج موفق' }
    }));

    // ۴٪ خودکار به کیف پول مادر
    if (creatorShare > 0) {
      txs.push(new Transaction({
        from: 'SYSTEM',
        to: CREATOR_WALLET,
        amount: creatorShare,
        type: 'creator_support',
        data: {
          reason: 'پشتیبانی، تعمیر و نگهداری و به‌روزرسانی شبکه',
          percent: CREATOR_SHARE_PERCENT,
          fromMiner
