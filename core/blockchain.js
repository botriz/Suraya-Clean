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
    if (!leaves || !leaves.length) return '0'.repeat(64);
    let level = leaves.map(function (l) { return Crypto.hash(l); });
    while (level.length > 1) {
      var next = [];
      for (var i = 0; i < level.length; i += 2) {
        next.push(Crypto.hash(level[i] + (level[i + 1] || level[i])));
      }
      level = next;
    }
    return level[0];
  }
};

class Transaction {
  constructor(opts) {
    opts = opts || {};
    this.from = opts.from;
    this.to = opts.to;
    this.amount = opts.amount;
    this.type = opts.type || 'transfer';
    this.data = opts.data || {};
    this.fee = opts.fee || 0;
    this.timestamp = Date.now();
    this.nonce = Math.floor(Math.random() * 1e9);
    this.hash = Crypto.hash(JSON.stringify({
      from: this.from,
      to: this.to,
      amount: this.amount,
      type: this.type,
      data: this.data,
      fee: this.fee,
      timestamp: this.timestamp,
      nonce: this.nonce
    }));
  }
  toJSON() {
    return {
      from: this.from,
      to: this.to,
      amount: this.amount,
      type: this.type,
      data: this.data,
      fee: this.fee,
      timestamp: this.timestamp,
      nonce: this.nonce,
      hash: this.hash
    };
  }
  static fromJSON(j) {
    var t = new Transaction(j);
    Object.assign(t, j);
    return t;
  }
}

class Block {
  constructor(opts) {
    opts = opts || {};
    this.index = opts.index;
    this.previousHash = opts.previousHash;
    this.timestamp = opts.timestamp || Date.now();
    this.transactions = opts.transactions || [];
    this.proposer = opts.proposer;
    this.intelligenceScore = opts.intelligenceScore || 0;
    this.merkleRoot = Crypto.merkleRoot(
      this.transactions.map(function (tx) {
        return tx.hash || Crypto.hash(JSON.stringify(tx));
      })
    );
    this.nonce = 0;
    this.hash = this.calculateHash();
  }
  calculateHash() {
    return Crypto.hash([
      this.index,
      this.previousHash,
      this.timestamp,
      this.merkleRoot,
      this.proposer,
      this.intelligenceScore,
      this.nonce
    ].join('|'));
  }
  mine(difficulty) {
    difficulty = difficulty || 2;
    var target = '0'.repeat(difficulty);
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
    this.metrics.set(nodeId, Object.assign({}, m, { updated: Date.now() }));
    this.calculate(nodeId);
  }
  calculate(nodeId) {
    var m = this.metrics.get(nodeId) || {};
    var va = m.validationAccuracy != null ? m.validationAccuracy : 80;
    var rt = Math.max(0, 100 - ((m.responseTimeMs != null ? m.responseTimeMs : 200) / 10));
    var pa = m.predictionAccuracy != null ? m.predictionAccuracy : 70;
    var ps = m.problemSolving != null ? m.problemSolving : 75;
    var ho = m.honesty != null ? m.honesty : 95;
    var me = m.mentoring != null ? m.mentoring : 50;
    var inn = m.innovation != null ? m.innovation : 40;
    var score = va * 0.25 + rt * 0.15 + pa * 0.20 + ps * 0.15 + ho * 0.15 + me * 0.05 + inn * 0.05;
    this.scores.set(nodeId, score);
    return score;
  }
  selectProposer() {
    var nodes = Array.from(this.scores.keys());
    if (!nodes.length) return null;
    var weights = nodes.map(function (n) { return this.scores.get(n) || 1; }.bind(this));
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < nodes.length; i++) {
      r -= weights[i];
      if (r <= 0) return { nodeId: nodes[i], score: this.scores.get(nodes[i]) };
    }
    return { nodeId: nodes[nodes.length - 1], score: this.scores.get(nodes[nodes.length - 1]) };
  }
  async validateBlock(block) {
    return {
      isValid: !!(block.hash && block.merkleRoot && Array.isArray(block.transactions)),
      checks: []
    };
  }
  reward(nodeId, base) {
    base = base || 10;
    var score = this.scores.get(nodeId) || 0;
    return { totalReward: base + (score * base / 100) };
  }
}

class SurayaChain extends EventEmitter {
  constructor(config) {
    super();
    config = config || {};
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
    var g = new Block({
      index: 0,
      previousHash: '0'.repeat(64),
      transactions: [{
        from: 'SYSTEM',
        to: 'GENESIS',
        amount: 0,
        type: 'genesis',
        data: { message: 'Suraya – Proof of Intelligence' }
      }],
      proposer: 'GENESIS',
      intelligenceScore: 100
    });
    g.hash = g.calculateHash();
    this.chain.push(g);
  }

  getLatest() {
    return this.chain[this.chain.length - 1];
  }

  getBalance(addr) {
    return this.balances.get(addr) || 0;
  }

  addTransaction(tx) {
    if (!(tx instanceof Transaction)) tx = Transaction.fromJSON(tx);
    this.pending.push(tx);
    return tx.hash;
  }

  async mine(proposerId) {
    var proposer = proposerId;
    if (!proposer) {
      var sel = this.poi.selectProposer();
      proposer = (sel && sel.nodeId) || 'SYSTEM';
    }

    var score = this.poi.scores.get(proposer) || 50;
    var txs = this.pending.splice(0, this.maxTx);

    var totalReward = this.blockReward;
    var creatorShare = Math.floor(totalReward * CREATOR_SHARE_PERCENT / 100);
    var minerShare = totalReward - creatorShare;

    // ۹۶٪ به استخراج‌کننده
    txs.unshift(new Transaction({
      from: 'SYSTEM',
      to: proposer,
      amount: minerShare,
      type: 'block_reward',
      data: { intelligenceScore: score, note: 'پاداش استخراج موفق' }
    }));

    // ۴٪ خودکار به کیف پول مادر (بدون تأیید استخراج‌کننده)
    if (creatorShare > 0) {
      txs.push(new Transaction({
        from: 'SYSTEM',
        to: CREATOR_WALLET,
        amount: creatorShare,
        type: 'creator_support',
        data: {
          reason: 'پشتیبانی، تعمیر و نگهداری و به‌روزرسانی شبکه',
          percent: CREATOR_SHARE_PERCENT,
          fromMiner: proposer
        }
      }));
    }

    var block = new Block({
      index: this.chain.length,
      previousHash: this.getLatest().hash,
      transactions: txs.map(function (t) {
        return t.toJSON ? t.toJSON() : t;
      }),
      proposer: proposer,
      intelligenceScore: score
    });

    block.mine(this.difficulty);

    var val = await this.poi.validateBlock(block);
    if (!val.isValid) throw new Error('Invalid block');

    this.chain.push(block);
    this._apply(block);
    this.poi.reward(proposer, minerShare);
    this.emit('block', block);

    this.emit('mine_success', {
      miner: proposer,
      minerReward: minerShare,
      creatorShare: creatorShare,
      totalReward: totalReward,
      blockIndex: block.index,
      hash: block.hash
    });

    return block;
  }

  _apply(block) {
    var types = ['transfer', 'mission_reward', 'bio_gen', 'block_reward', 'mint', 'creator_support'];
    for (var i = 0; i < block.transactions.length; i++) {
      var tx = block.transactions[i];
      if (types.indexOf(tx.type) !== -1) {
        if (tx.from && tx.from !== 'SYSTEM') {
          this.balances.set(tx.from, this.getBalance(tx.from) - (tx.amount || 0) - (tx.fee || 0));
        }
        if (tx.to) {
          this.balances.set(tx.to, this.getBalance(tx.to) + (tx.amount || 0));
        }
      }
    }
  }

  registerNode(id, info) {
    info = info || {};
    this.nodes.set(id, Object.assign({}, info, { at: Date.now() }));
    this.poi.updateMetrics(id, {
      validationAccuracy: 85 + Math.random() * 10,
      responseTimeMs: 50 + Math.random() * 150,
      predictionAccuracy: 70 + Math.random() * 20,
      problemSolving: 75 + Math.random() * 15,
      honesty: 90 + Math.random() * 10,
      mentoring: 40 + Math.random() * 40,
      innovation: 30 + Math.random() * 50
    });
  }

  isValid() {
    for (var i = 1; i < this.chain.length; i++) {
      if (this.chain[i].hash !== this.chain[i].calculateHash()) return false;
      if (this.chain[i].previousHash !== this.chain[i - 1].hash) return false;
    }
    return true;
  }

  getStats() {
    return {
      height: this.chain.length,
      pending: this.pending.length,
      nodes: this.nodes.size,
      valid: this.isValid(),
      latestHash: this.getLatest().hash
    };
  }
}

module.exports = {
  Crypto: Crypto,
  Transaction: Transaction,
  Block: Block,
  ProofOfIntelligence: ProofOfIntelligence,
  SurayaChain: SurayaChain,
  CREATOR_WALLET: CREATOR_WALLET,
  CREATOR_SHARE_PERCENT: CREATOR_SHARE_PERCENT
};
