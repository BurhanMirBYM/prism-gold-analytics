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

function formatEUR(v) {
  if (v === undefined || v === null) return '€' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatGBP(v) {
  if (v === undefined || v === null) return '£' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Baseline Spot Rate: 24K Spot is ~₹11,854.20/g, 24K Indian Retail (incl. Customs Duty & GST) is ~₹15,410.46/g (15k something)
let baseSpotINR_1g = 11854.20;

function getCalculatedRates(spotINR1g) {
  const retail24k_1g = spotINR1g * 1.30; // 15% Customs + 3% GST + Jeweler margin factor
  const spotUSD_oz = (spotINR1g * 31.1035) / 83.50 * 1.666; // Scaled to global market quote
  
  return {
    spot24k_1g: spotINR1g,
    retail24k_1g: retail24k_1g,
    spot24k_10g: spotINR1g * 10,
    retail24k_10g: retail24k_1g * 10,
    
    spot22k_1g: spotINR1g * 0.9167,
    retail22k_1g: retail24k_1g * 0.9167,
    spot22k_10g: spotINR1g * 0.9167 * 10,
    retail22k_10g: retail24k_1g * 0.9167 * 10,
    
    spot18k_1g: spotINR1g * 0.75,
    retail18k_1g: retail24k_1g * 0.75,
    spot18k_10g: spotINR1g * 0.75 * 10,
    retail18k_10g: retail24k_1g * 0.75 * 10,

    spotUSD_oz: 2650.50,
    spotUSD_1g: 85.22,
    eur_oz: 2420.10,
    gbp_oz: 2045.30
  };
}

let tickHistory = [];

function updateUI() {
  const r = getCalculatedRates(baseSpotINR_1g);

  // Top Banners
  document.getElementById('spotBannerPrice').textContent = formatINR(r.spot24k_1g);
  document.getElementById('spotBanner10g').textContent = `(${formatINR(r.spot24k_10g)} / 10g)`;
  
  document.getElementById('retailBannerPrice').textContent = formatINR(r.retail24k_1g);
  document.getElementById('retailBanner10g').textContent = `(${formatINR(r.retail24k_10g)} / 10g)`;

  // Top KPI Row
  document.getElementById('kpiRate1g').textContent = formatINR(r.spot24k_1g);
  document.getElementById('kpiRetail1g').textContent = formatINR(r.retail24k_1g);
  document.getElementById('kpiHigh1g').textContent = formatINR(r.spot24k_1g * 1.008);
  document.getElementById('kpiLow1g').textContent = formatINR(r.spot24k_1g * 0.992);
  document.getElementById('kpiMA301g').textContent = formatINR(r.spot24k_1g * 0.978);
  document.getElementById('kpiVol').textContent = "1.42%";

  const pillText = `+${formatINR(145.20)} (+1.24%)`;
  const pill = document.getElementById('kpiChangePill');
  if (pill) { pill.textContent = pillText; pill.className = 'pill up'; }
  const bannerBadge = document.getElementById('spotBannerBadge');
  if (bannerBadge) { bannerBadge.textContent = pillText; bannerBadge.className = 'pill up'; }

  // Karat Cards Panel
  if (document.getElementById('spot24k_1g')) document.getElementById('spot24k_1g').textContent = formatINR(r.spot24k_1g);
  if (document.getElementById('retail24k_1g')) document.getElementById('retail24k_1g').textContent = formatINR(r.retail24k_1g);
  if (document.getElementById('spot22k_1g')) document.getElementById('spot22k_1g').textContent = formatINR(r.spot22k_1g);
  if (document.getElementById('retail22k_1g')) document.getElementById('retail22k_1g').textContent = formatINR(r.retail22k_1g);
  if (document.getElementById('spot18k_1g')) document.getElementById('spot18k_1g').textContent = formatINR(r.spot18k_1g);
  if (document.getElementById('retail18k_1g')) document.getElementById('retail18k_1g').textContent = formatINR(r.retail18k_1g);

  // Global Market Cards Panel
  if (document.getElementById('rateUSD_OZ')) document.getElementById('rateUSD_OZ').textContent = moneyUSD(r.spotUSD_oz);
  if (document.getElementById('rateUSD_1G')) document.getElementById('rateUSD_1G').textContent = moneyUSD(r.spotUSD_1g);
  if (document.getElementById('rateEUR_OZ')) document.getElementById('rateEUR_OZ').textContent = formatEUR(r.eur_oz);
  if (document.getElementById('rateGBP_OZ')) document.getElementById('rateGBP_OZ').textContent = formatGBP(r.gbp_oz);

  // Recent Market Ticks Table
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const changePct = (Math.random() * 0.4 - 0.2).toFixed(2);
  
  if (tickHistory.length === 0 || tickHistory[0].time !== timeStr) {
    tickHistory.unshift({
      time: timeStr,
      spot: r.spot24k_1g,
      retail: r.retail24k_1g,
      change: changePct
    });
    if (tickHistory.length > 5) tickHistory.pop();
  }

  const tbody = document.querySelector('#ticksTable tbody');
  if (tbody) {
    tbody.innerHTML = tickHistory.map(t => `
      <tr>
        <td>${t.time}</td>
        <td>${formatINR(t.spot)}</td>
        <td><span class="highlight-gold">${formatINR(t.retail)}</span></td>
        <td><span class="pill ${t.change >= 0 ? 'up' : 'down'}">${t.change >= 0 ? '+' : ''}${t.change}%</span></td>
      </tr>
    `).join('');
  }
}

// Intraday Chart
function loadIntradayChart() {
  const canvas = document.getElementById('intradayChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const now = new Date();
  const labels = [];
  const prices = [];

  for (let i = 12; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 5 * 60000);
    labels.push(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    prices.push(Number((baseSpotINR_1g + Math.sin(i) * 35).toFixed(2)));
  }

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
        data: prices,
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

// Historical Chart
function loadHistoricalChart(range = '1M') {
  const canvas = document.getElementById('historyChart');
  if (!canvas) return;
  
  let days = 30;
  if (range === '5D') days = 5;
  if (range === '6M') days = 180;
  if (range === '1Y') days = 365;

  const labels = [];
  const prices = [];
  let basePrice = 11200;
  const today = new Date();

  for (let i = days; i >= 0; i -= Math.max(1, Math.floor(days / 20))) {
    const d = new Date(today.getTime() - i * 86400000);
    labels.push(d.toISOString().split('T')[0]);
    basePrice += (Math.random() * 45 - 15);
    prices.push(Number(basePrice.toFixed(2)));
  }

  if (chartInstances.history) chartInstances.history.destroy();
  chartInstances.history = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `24K Spot Rate (₹ / 1g) [${range}]`,
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

// Range selector handlers
document.querySelectorAll('.range-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const range = btn.getAttribute('data-range');
    loadHistoricalChart(range);
  });
});

// SQL Playground Handler
const runQueryBtn = document.getElementById('runQueryBtn');
if (runQueryBtn) {
  runQueryBtn.addEventListener('click', () => {
    const msg = document.getElementById('queryMsg');
    msg.textContent = "Executing query...";
    msg.className = "playground__msg";

    setTimeout(() => {
      const resultTable = document.getElementById('queryResultTable');
      resultTable.querySelector('thead').innerHTML = '<tr><th>month</th><th>spot_inr_1g</th><th>retail_inr_1g</th><th>peak_spot_1g</th></tr>';
      resultTable.querySelector('tbody').innerHTML = `
        <tr><td>2026-09</td><td>₹11,854.20</td><td>₹15,410.46</td><td>₹11,920.00</td></tr>
        <tr><td>2026-08</td><td>₹11,620.50</td><td>₹15,106.65</td><td>₹11,750.00</td></tr>
        <tr><td>2026-07</td><td>₹11,410.00</td><td>₹14,833.00</td><td>₹11,580.00</td></tr>
        <tr><td>2026-06</td><td>₹11,280.00</td><td>₹14,664.00</td><td>₹11,390.00</td></tr>
      `;
      msg.textContent = "4 rows returned successfully";
    }, 200);
  });
}

// Auto-tick simulation
setInterval(() => {
  baseSpotINR_1g += (Math.random() * 4 - 2);
  updateUI();
}, 4000);

// Initial Load
updateUI();
loadIntradayChart();
loadHistoricalChart('1M');
