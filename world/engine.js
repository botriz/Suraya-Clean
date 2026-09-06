/**
 * SURAYA WORLD ENGINE
 * موجودیت‌ها + مأموریت‌ها + مدیریت مراکز و زمین
 */
'use strict';

class BaseEntity {
  constructor(opts) {
    opts = opts || {};
    this.id = opts.id || ('ENT-' + Date.now() + '-' + Math.floor(Math.random() * 10000));
    this.name = opts.name || 'Unknown';
    this.type = opts.type || 'generic';
    this.owner = opts.owner || null;
    this.health = opts.health != null ? opts.health : 100;
    this.level = opts.level || 1;
    this.experience = opts.experience || 0;
    this.active = true;
    this.createdAt = Date.now();
    this.lastActive = Date.now();
    this.stats = Object.assign({
      strength: 10,
      intelligence: 10,
      creativity: 10,
      resilience: 10
    }, opts.stats || {});
  }

  gainXP(amount) {
    this.experience += amount;
    this.lastActive = Date.now();
    while (this.experience >= this.level * 100) {
      this.experience -= this.level * 100;
      this.level++;
      this.stats.strength += 2;
      this.stats.intelligence += 2;
      this.stats.creativity += 1;
      this.stats.resilience += 2;
      this.health = 100;
    }
    return this.level;
  }

  updateHealth(h) {
    this.health = Math.max(0, Math.min(100, h));
    this.lastActive = Date.now();
    if (this.health === 0) this.active = false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      owner: this.owner,
      health: this.health,
      level: this.level,
      experience: this.experience,
      active: this.active,
      stats: this.stats,
      createdAt: this.createdAt,
      lastActive: this.lastActive
    };
  }
}

class Torbaq extends BaseEntity {
  constructor(opts) {
    super(Object.assign({ name: 'ترباق', type: 'natural', stats: { strength: 12, intelligence: 8, creativity: 15, resilience: 14 } }, opts));
    this.element = 'earth';
  }
}

class AbDolat extends BaseEntity {
  constructor(opts) {
    super(Object.assign({ name: 'آبدولت', type: 'economic', stats: { strength: 8, intelligence: 14, creativity: 10, resilience: 12 } }, opts));
    this.element = 'water';
  }
}

class Kulekci extends BaseEntity {
  constructor(opts) {
    super(Object.assign({ name: 'کولکچی', type: 'governance', stats: { strength: 10, intelligence: 16, creativity: 8, resilience: 11 } }, opts));
    this.element = 'air';
  }
}

class Ates extends BaseEntity {
  constructor(opts) {
    super(Object.assign({ name: 'آتش', type: 'hybrid', stats: { strength: 16, intelligence: 10, creativity: 12, resilience: 9 } }, opts));
    this.element = 'fire';
  }
}

class Nur extends BaseEntity {
  constructor(opts) {
    super(Object.assign({ name: 'نور', type: 'player', stats: { strength: 11, intelligence: 13, creativity: 14, resilience: 12 } }, opts));
    this.element = 'light';
  }
}

class MissionSystem {
  constructor() {
    this.missions = new Map();
    this.playerMissions = new Map();
    this.completed = new Map();
  }

  create(opts) {
    var id = 'MIS-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    var mission = {
      id: id,
      player: opts.player,
      type: opts.type || 'general',
      title: opts.title || 'مأموریت',
      description: opts.description || '',
      difficulty: opts.difficulty || 1,
      rewardARZA: opts.rewardARZA || 10,
      rewardXP: opts.rewardXP || 50,
      duration: (opts.days || 3) * 86400000,
      status: 'available',
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null
    };
    this.missions.set(id, mission);
    if (!this.playerMissions.has(opts.player)) this.playerMissions.set(opts.player, []);
    this.playerMissions.get(opts.player).push(id);
    return mission;
  }

  start(id, player) {
    var m = this.missions.get(id);
    if (!m || m.player !== player || m.status !== 'available') return null;
    m.status = 'active';
    m.startedAt = Date.now();
    return m;
  }

  complete(id, player) {
    var m = this.missions.get(id);
    if (!m || m.player !== player || m.status !== 'active') return null;
    if (Date.now() > m.startedAt + m.duration) {
      m.status = 'expired';
      return null;
    }
    m.status = 'completed';
    m.completedAt = Date.now();
    var count = (this.completed.get(player) || 0) + 1;
    this.completed.set(player, count);
    return {
      mission: m,
      rewards: { arza: m.rewardARZA, xp: m.rewardXP },
      playerLevel: 1 + Math.floor(count / 5)
    };
  }

  listForPlayer(player) {
    var ids = this.playerMissions.get(player) || [];
    return ids.map(function (id) { return this.missions.get(id); }.bind(this)).filter(Boolean);
  }
}

class WorldManagement {
  constructor(adminAddress) {
    this.admin = adminAddress || 'ADMIN';
    this.globalCenter = {
      name: 'مرکزیت اصلی ثریا',
      owner: this.admin,
      landId: 'LAND-GLOBAL-CENTER',
      active: true,
      establishedAt: Date.now()
    };
    this.cities = new Map();
    this.lands = new Map();
    this.decrees = [];
    this.entities = new Map();

    this.lands.set(this.globalCenter.landId, {
      id: this.globalCenter.landId,
      cityId: null,
      owner: this.admin,
      title: 'مرکزیت اصلی جهان ثریا',
      isCentral: true,
      isDeeded: true,
      valueScore: 10000,
      deededAt: Date.now(),
      active: true
    });
  }

  registerCity(name, country, lat, lng, pop) {
    var cityId = 'CITY-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    var centralLandId = 'LAND-CENTER-' + cityId;
    this.lands.set(centralLandId, {
      id: centralLandId,
      cityId: cityId,
      owner: this.admin,
      title: 'مرکز مدیریتی شهر ' + name,
      isCentral: true,
      isDeeded: true,
      valueScore: 5000,
      deededAt: Date.now(),
      active: true
    });
    this.cities.set(cityId, {
      id: cityId,
      name: name,
      country: country || '',
      lat: lat || 0,
      lng: lng || 0,
      population: pop || 0,
      prosperity: 50,
      active: true,
      registeredAt: Date.now(),
      centralLandId: centralLandId
    });
    return { cityId: cityId, centralLandId: centralLandId };
  }

  deedLand(cityId, player, title, valueScore) {
    var landId = 'LAND-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    this.lands.set(landId, {
      id: landId,
      cityId: cityId || null,
      owner: player,
      title: title || 'زمین',
      isCentral: false,
      isDeeded: true,
      valueScore: valueScore || 100,
      deededAt: Date.now(),
      active: true
    });
    return landId;
  }

  issueDecree(title, content, originCenter) {
    var decree = {
      id: this.decrees.length + 1,
      title: title,
      content: content,
      originCenter: originCenter || this.globalCenter.landId,
      issuedAt: Date.now(),
      active: true
    };
    this.decrees.push(decree);
    return decree;
  }

  registerEntity(entity) {
    this.entities.set(entity.id, entity);
    return entity.id;
  }

  getCityCount() { return this.cities.size; }
  getLandCount() { return this.lands.size; }
  getEntityCount() { return this.entities.size; }

  getStats() {
    return {
      cities: this.cities.size,
      lands: this.lands.size,
      entities: this.entities.size,
      decrees: this.decrees.filter(function (d) { return d.active; }).length,
      globalCenter: this.globalCenter.name
    };
  }
}

module.exports = {
  BaseEntity: BaseEntity,
  Torbaq: Torbaq,
  AbDolat: AbDolat,
  Kulekci: Kulekci,
  Ates: Ates,
  Nur: Nur,
  MissionSystem: MissionSystem,
  WorldManagement: WorldManagement
};
