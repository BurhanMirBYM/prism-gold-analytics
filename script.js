'use strict';

if (typeof Chart !== 'undefined') {
  Chart.defaults.color = '#9ca3af';
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 11;
}

const gridline = { color: 'rgba(255,255,255,0.04)', drawTicks: false };
let chartInstances = {};

function formatINR(v) {
  if (v === undefined || v === null) return '₹0.00';
  return '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function moneyUSD(v) {
  if (v === undefined || v === null) return '$0.00';
  return '$' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const GOLD_FALLBACK = {
  kpis: {
    price_inr_1g_spot: 11854.20,
    price_inr_10g_spot: 118542.00,
    price_inr_1g_retail: 15410.46,
    price_inr_10g_retail: 154104.60,
    high_24h_inr_1g: 11920.00,
    low_24h_inr_1g: 11780.00,
    ma30_inr_1g: 11620.50,
    volatility: "1.42",
    change_val_inr_1g: 145.20,
    change_pct: "1.24"
  },
  intraday: [
    { timestamp: '2026-09-18T09:00:00Z', price_inr_1g: 11810.00 },
    { timestamp: '2026-09-18T10:00:00Z', price_inr_1g: 11825.50 },
    { timestamp: '2026-09-18T11:00:00Z', price_inr_1g: 11840.00 },
    { timestamp: '2026-09-18T12:00:00Z', price_inr_1g: 11832.00 },
    { timestamp: '2026-09-18T13:00:00Z', price_inr_1g: 11854.20 }
  ],
  ratesTable: [
    { purity: '24K (Pure 99.9%)', unit: '1 Gram', spot_inr: 11854.20, retail_inr: 15410.46, usd_eq: 141.97 },
    { purity: '24K (Pure 99.9%)', unit: '10 Grams', spot_inr: 118542.00, retail_inr: 154104.60, usd_eq: 1419.66 },
    { purity: '22K (Jewelry 91.6%)', unit: '1 Gram', spot_inr: 10866.75, retail_inr: 14126.77, usd_eq: 130.14 },
    { purity: '22K (Jewelry 91.6%)', unit: '10 Grams', spot_inr: 108667.50, retail_inr: 141267.70, usd_eq: 1301.41 },
    { purity: '18K (Diamond 75.0%)', unit: '1 Gram', spot_inr: 8890.65, retail_inr: 11557.85, usd_eq: 106.47 },
    { purity: '18K (Diamond 75.0%)', unit: '10 Grams', spot_inr: 88906.50, retail_inr: 115578.45, usd_eq: 1064.75 }
  ],
  historical: [
    { date: '2026-08-20', price_inr_1g: 11400, price_usd_oz: 2580 },
    { date: '2026-08-25', price_inr_1g: 11520, price_usd_oz: 2610 },
    { date: '2026-08-30', price_inr_1g: 11480, price_usd_oz: 2600 },
    { date: '2026-09-05', price_inr_1g: 11650, price_usd_oz: 2635 },
    { date: '2026-09-10', price_inr_1g: 11720, price_usd_oz: 2648 },
    { date: '2026-09-18', price_inr_1g: 11854, price_usd_oz: 2650 }
  ]
};

async function getJSON(url, opts) {
  try {
    const res = await fetch(url, opts);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Using Gold fallback dataset for URL:", url);
  }
  
  if (url.includes('/api/gold/kpis')) return GOLD_FALLBACK.kpis;
  if (url.includes('/api/gold/intraday')) return GOLD_FALLBACK.intraday;
  if (url.includes('/api/gold/rates-table')) return GOLD_FALLBACK.ratesTable;
  if (url.includes('/api/gold/historical')) return GOLD_FALLBACK.historical;
  if (url.includes('/api/gold/rolling')) return GOLD_FALLBACK.historical.map(h => ({ date: h.date, price_inr_1g: h.price_inr_1g, ma7_inr_1g: h.price_inr_1g - 40, ma30_inr_1g: h.price_inr_1g - 120 }));
  
  return GOLD_FALLBACK.kpis;
}

async function loadKPIs() {
  const k = await getJSON('/api/gold/kpis');
  document.getElementById('spotBannerPrice').textContent = formatINR(k.price_inr_1g_spot);
  document.getElementById('spotBanner10g').textContent = `(${formatINR(k.price_inr_10g_spot)} / 10g)`;
  document.getElementById('retailBannerPrice').textContent = formatINR(k.price_inr_1g_retail);
  document.getElementById('retailBanner10g').textContent = `(${formatINR(k.price_inr_10g_retail)} / 10g)`;
  document.getElementById('kpiRate1g').textContent = formatINR(k.price_inr_1g_spot);
  document.getElementById('kpiRetail1g').textContent = formatINR(k.price_inr_1g_retail);
  document.getElementById('kpiHigh1g').textContent = formatINR(k.high_24h_inr_1g);
  document.getElementById('kpiLow1g').textContent = formatINR(k.low_24h_inr_1g);
  document.getElementById('kpiMA301g').textContent = formatINR(k.ma30_inr_1g);
  document.getElementById('kpiVol').textContent = `${k.volatility}%`;

  const pillText = `+${formatINR(k.change_val_inr_1g)} (+${k.change_pct}%)`;
  const pill = document.getElementById('kpiChangePill');
  if (pill) { pill.textContent = pillText; pill.className = 'pill up'; }
  const bannerBadge = document.getElementById('spotBannerBadge');
  if (bannerBadge) { bannerBadge.textContent = pillText; bannerBadge.className = 'pill up'; }
}

async function loadIntraday() {
  const ticks = await getJSON('/api/gold/intraday');
  if (!ticks || !ticks.length) return;
  const labels = ticks.map(t => new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const pricesINR = ticks.map(t => t.price_inr_1g);

  const canvas = document.getElementById('intradayChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 230);
  gradient.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
  gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

  if (chartInstances.intraday) chartInstances.intraday.destroy();
  chartInstances.intraday = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '24K Spot Rate (₹ / 1g)',
        data: pricesINR,
        borderColor: '#fbbf24',
        borderWidth: 2,
        backgroundColor: gradient,
        fill: true,
        tension: 0.3,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { grid: gridline } }
    }
  });
}

async function loadRatesTable() {
  const rows = await getJSON('/api/gold/rates-table');
  const tbody = document.querySelector('#ratesTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.purity}</strong></td>
      <td>${r.unit}</td>
      <td>${formatINR(r.spot_inr)}</td>
      <td><span class="highlight-gold">${formatINR(r.retail_inr)}</span></td>
      <td>${moneyUSD(r.usd_eq)}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadHistorical() {
  const data = await getJSON('/api/gold/historical');
  const labels = data.map(d => d.date);
  const prices = data.map(d => d.price_inr_1g);

  const canvas = document.getElementById('historyChart');
  if (!canvas) return;
  if (chartInstances.history) chartInstances.history.destroy();
  chartInstances.history = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '24K Spot Rate (₹ / 1g)',
        data: prices,
        borderColor: '#f59e0b',
        borderWidth: 2,
        tension: 0.2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: { x: { grid: { display: false } }, y: { grid: gridline } }
    }
  });
}

loadKPIs();
loadIntraday();
loadRatesTable();
loadHistorical();
