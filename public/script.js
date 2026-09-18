'use strict';

if (typeof Chart !== 'undefined') {
  Chart.defaults.color = '#9ca3af';
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 11;
}

const gridline = { color: 'rgba(255,255,255,0.04)', drawTicks: false };
let chartInstances = {};
let currentRange = '1M';

function formatINR(v) {
  if (v === undefined || v === null) return '₹0.00';
  return '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function moneyUSD(v) {
  if (v === undefined || v === null) return '$0.00';
  return '$' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatEUR(v) {
  if (v === undefined || v === null) return '€0.00';
  return '€' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatGBP(v) {
  if (v === undefined || v === null) return '£0.00';
  return '£' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function getJSON(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ---------- API LOADERS ----------

async function loadKPIs() {
  try {
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

    const changeSign = k.change_val_inr_1g >= 0 ? '+' : '';
    const pillText = `${changeSign}${formatINR(k.change_val_inr_1g)} (${changeSign}${k.change_pct}%)`;
    
    const pill = document.getElementById('kpiChangePill');
    pill.textContent = pillText;
    pill.className = 'pill ' + (k.change_val_inr_1g >= 0 ? 'up' : 'down');

    const bannerBadge = document.getElementById('spotBannerBadge');
    bannerBadge.textContent = pillText;
    bannerBadge.className = 'pill ' + (k.change_val_inr_1g >= 0 ? 'up' : 'down');
  } catch (err) {
    console.error('Failed to load KPIs:', err);
  }
}

async function loadIntraday() {
  try {
    const ticks = await getJSON('/api/gold/intraday');
    if (!ticks.length) return;

    const labels = ticks.map(t => {
      const d = new Date(t.timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    });
    const pricesINR = ticks.map(t => t.price_inr_1g);

    const canvas = document.getElementById('intradayChart');
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
          tension: 0.2,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` Spot Rate: ₹${context.raw.toLocaleString('en-IN')} / 1g`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: gridline,
            ticks: {
              callback: (value) => '₹' + Number(value).toLocaleString('en-IN')
            }
          }
        }
      }
    });
  } catch (err) {
    console.error('Failed to load intraday chart:', err);
  }
}

async function loadHistory(range = '1M') {
  try {
    const rows = await getJSON(`/api/gold/history?range=${range}`);
    if (!rows.length) return;

    const labels = rows.map(r => r.date);
    const closePricesINR = rows.map(r => r.close_inr_1g);
    const retailPricesINR = rows.map(r => r.close_inr_1g_retail);

    const canvas = document.getElementById('historyChart');
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
    gradient.addColorStop(1, 'rgba(245, 158, 11, 0.01)');

    if (chartInstances.history) chartInstances.history.destroy();
    chartInstances.history = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Spot Rate (₹/1g)',
            data: closePricesINR,
            borderColor: '#f59e0b',
            borderWidth: 2,
            backgroundColor: gradient,
            tension: 0.1,
            fill: true,
            pointRadius: range === '5D' ? 3 : 0,
          },
          {
            label: 'Retail Rate incl. Tax (₹/1g)',
            data: retailPricesINR,
            borderColor: '#10b981',
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top', labels: { boxWidth: 10 } },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ₹${context.raw.toLocaleString('en-IN')}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: gridline,
            ticks: {
              callback: (value) => '₹' + Number(value).toLocaleString('en-IN')
            }
          }
        }
      }
    });
  } catch (err) {
    console.error('Failed to load history chart:', err);
  }
}

async function loadCurrencies() {
  try {
    const c = await getJSON('/api/gold/currencies');
    document.getElementById('spot24k_1g').textContent = formatINR(c.spot_24k_1g);
    document.getElementById('retail24k_1g').textContent = formatINR(c.retail_24k_1g);

    document.getElementById('spot22k_1g').textContent = formatINR(c.spot_22k_1g);
    document.getElementById('retail22k_1g').textContent = formatINR(c.retail_22k_1g);

    document.getElementById('spot18k_1g').textContent = formatINR(c.spot_18k_1g);
    document.getElementById('retail18k_1g').textContent = formatINR(c.retail_18k_1g);

    document.getElementById('rateUSD_OZ').textContent = moneyUSD(c.usd_oz);
    document.getElementById('rateUSD_1G').textContent = moneyUSD(c.usd_1g);
    document.getElementById('rateEUR_OZ').textContent = formatEUR(c.eur_oz);
    document.getElementById('rateGBP_OZ').textContent = formatGBP(c.gbp_oz);
  } catch (err) {
    console.error('Failed to load currency rates:', err);
  }
}

async function loadTicksTable() {
  try {
    const ticks = await getJSON('/api/gold/intraday');
    const tbody = document.getElementById('ticksTable').querySelector('tbody');
    tbody.innerHTML = '';

    const recent = ticks.slice(-10).reverse();
    recent.forEach(t => {
      const d = new Date(t.timestamp);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const changeClass = t.change_pct >= 0 ? 'up' : 'down';
      const changeSign = t.change_pct >= 0 ? '+' : '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${timeStr}</td>
        <td><strong>${formatINR(t.price_inr_1g)}</strong></td>
        <td><strong style="color: #34d1a4">${formatINR(t.price_inr_1g_retail)}</strong></td>
        <td><span class="pill ${changeClass}">${changeSign}${t.change_pct}%</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Failed to load ticks table:', err);
  }
}

// ---------- SQL PLAYGROUND ----------

function setQueryMessage(text, isError) {
  const el = document.getElementById('queryMsg');
  el.textContent = text;
  el.className = 'playground__msg' + (isError ? ' is-error' : '');
}

async function runQuery() {
  const sql = document.getElementById('sqlInput').value;
  setQueryMessage('Running live SQL...');
  try {
    const result = await getJSON('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
    });
    const table = document.getElementById('queryResultTable');
    table.querySelector('thead').innerHTML = '<tr>' + result.columns.map((c) => `<th>${c}</th>`).join('') + '</tr>';
    table.querySelector('tbody').innerHTML = result.rows
      .map((row) => '<tr>' + row.map((v) => `<td>${v === null ? '—' : (typeof v === 'number' ? v.toLocaleString('en-IN') : v)}</td>`).join('') + '</tr>')
      .join('');
    setQueryMessage(`${result.row_count} row(s) returned`);
  } catch (err) {
    setQueryMessage(err.message, true);
  }
}

document.getElementById('runQueryBtn').addEventListener('click', runQuery);

// Range selector buttons
document.querySelectorAll('.range-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRange = btn.getAttribute('data-range');
    loadHistory(currentRange);
  });
});

// ---------- LIVE POLLING ENGINE ----------

async function refreshLiveData() {
  await Promise.all([
    loadKPIs(),
    loadIntraday(),
    loadCurrencies(),
    loadTicksTable()
  ]);
}

// Initial load
refreshLiveData();
loadHistory('1M');
runQuery();

// Live polling every 5 seconds
setInterval(refreshLiveData, 5000);
