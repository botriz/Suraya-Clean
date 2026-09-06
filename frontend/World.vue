<template>
  <div class="suraya-world" dir="rtl">
    <header class="header">
      <h1>🌟 جهان ثریا</h1>
      <p class="subtitle">بلاکچین با Proof of Intelligence</p>
    </header>

    <section class="stats" v-if="stats">
      <div class="stat-card">
        <span class="label">ارتفاع زنجیره</span>
        <span class="value">{{ stats.height }}</span>
      </div>
      <div class="stat-card">
        <span class="label">گره‌ها</span>
        <span class="value">{{ stats.nodes }}</span>
      </div>
      <div class="stat-card">
        <span class="label">وضعیت</span>
        <span class="value" :class="stats.valid ? 'ok' : 'bad'">
          {{ stats.valid ? 'معتبر' : 'نامعتبر' }}
        </span>
      </div>
    </section>

    <section class="wallet">
      <h2>کیف پول</h2>
      <p>موجودی ARZA: <strong>{{ balance }}</strong></p>
    </section>

    <section class="missions">
      <h2>مأموریت‌ها</h2>
      <div v-if="missions.length === 0" class="empty">هنوز مأموریتی نیست</div>
      <div v-for="m in missions" :key="m.id" class="mission-card">
        <h3>{{ m.title }}</h3>
        <p>{{ m.description }}</p>
        <p class="meta">سختی: {{ m.difficulty }} | پاداش: {{ m.rewardARZA }} ARZA</p>
        <span class="status">{{ statusText(m.status) }}</span>
      </div>
    </section>

    <section class="mine">
      <h2>استخراج</h2>
      <button @click="doMine" :disabled="mining">
        {{ mining ? 'در حال استخراج...' : 'استخراج بلاک' }}
      </button>
    </section>

    <!-- پنجره تقدیر بعد از استخراج موفق -->
    <div v-if="showThanks" class="modal-overlay" @click.self="showThanks = false">
      <div class="modal">
        <h2>از همراهی شما سپاسگزاریم</h2>
        <p>
          با تشکر صمیمانه از اینکه در ساخت و رشد شبکهٔ ثریا سهیم هستید.
          تلاش شما به پیشرفت این جهان دیجیتال و ساختن آینده‌ای بهتر کمک می‌کند.
        </p>
        <p>
          ۴٪ از پاداش استخراج به‌صورت خودکار برای پشتیبانی، نگهداری و به‌روزرسانی شبکه اختصاص یافته است.
        </p>
        <p>
          اگر مایلید بیش از این از پروژه حمایت کنید، می‌توانید به دلخواه خود مبلغی به کیف پول مادر ارسال کنید.
          هر حمایت شما، انرژی و انگیزهٔ ما را برای ادامهٔ مسیر چند برابر می‌کند.
        </p>
        <p class="sign">با احترام و قدردانی،<br />تیم ثریا</p>
        <div class="modal-actions">
          <button class="secondary" @click="showThanks = false">بستن</button>
          <button class="primary" @click="showDonate = true">می‌خواهم حمایت داوطلبانه کنم</button>
        </div>
        <div v-if="showDonate" class="donate-box">
          <p>آدرس کیف پول مادر:</p>
          <code>{{ creatorWallet }}</code>
          <input v-model="donateAmount" type="number" min="1" placeholder="مبلغ (اختیاری)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SurayaWorld',
  data() {
    return {
      stats: null,
      balance: 0,
      missions: [],
      mining: false,
      showThanks: false,
      showDonate: false,
      donateAmount: null,
      creatorWallet: 'SRY_CREATOR_MOTHER_WALLET',
      lastMine: null
    };
  },
  methods: {
    statusText(s) {
      var map = {
        available: 'در دسترس',
        active: 'فعال',
        completed: 'تکمیل‌شده',
        expired: 'منقضی'
      };
      return map[s] || s;
    },
    async doMine() {
      this.mining = true;
      try {
        // در نسخه واقعی به API/زنجیره وصل می‌شود
        await new Promise(function (r) { setTimeout(r, 800); });
        this.lastMine = {
          minerReward: 48,
          creatorShare: 2,
          totalReward: 50
        };
        this.balance += this.lastMine.minerReward;
        this.showThanks = true;
        this.showDonate = false;
        if (this.stats) this.stats.height = (this.stats.height || 0) + 1;
      } finally {
        this.mining = false;
      }
    }
  },
  mounted() {
    this.stats = { height: 1, nodes: 1, valid: true };
  }
};
</script>

<style scoped>
.suraya-world {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem;
  font-family: system-ui, sans-serif;
  color: #1a1a1a;
}
.header {
  text-align: center;
  margin-bottom: 2rem;
}
.header h1 { margin: 0; font-size: 1.75rem; }
.subtitle { color: #666; margin-top: 0.25rem; }
.stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.stat-card {
  flex: 1;
  min-width: 100px;
  background: #f5f7fa;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}
.stat-card .label { display: block; font-size: 0.85rem; color: #666; }
.stat-card .value { font-size: 1.25rem; font-weight: 700; }
.stat-card .ok { color: #0a7; }
.stat-card .bad { color: #c33; }
.wallet, .missions, .mine {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}
.mission-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-top: 0.75rem;
}
.mission-card .meta { font-size: 0.85rem; color: #666; }
.status {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.2rem 0.5rem;
  background: #eef;
  border-radius: 4px;
  font-size: 0.8rem;
}
.empty { color: #999; }
button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  background: #0d6efd;
  color: #fff;
}
button:disabled { opacity: 0.6; cursor: not-allowed; }
button.secondary { background: #6c757d; }
button.primary { background: #198754; }
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}
.modal {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  max-width: 420px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}
.modal h2 { margin-top: 0; }
.modal .sign { margin-top: 1rem; color: #555; }
.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
  flex-wrap: wrap;
}
.donate-box {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}
.donate-box code {
  display: block;
  word-break: break-all;
  background: #f5f5f5;
  padding: 0.5rem;
  border-radius: 6px;
  margin: 0.5rem 0;
  font-size: 0.85rem;
}
.donate-box input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
}
</style>
