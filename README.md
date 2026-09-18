## Author
Developed by **Burhan Mir** — Data Analyst / Software Developer

### My Key Learnings & Architecture Decisions
- Designed a star-schema relational database in SQLite (`customers`, `products`, `orders`, `order_items`).
- Implemented `NTILE(4)` window functions for RFM customer segmentation.
- Built a live multi-source API connector (GoldAPI & Yahoo Finance) auto-polling live XAU spot rates into SQLite ticks.
# PRISM Gold — Live Gold Price Analytics & SQL Tracking Dashboard

A real-time, working Gold Price Analytics tool & SQL Tracking dashboard built with Python/Flask, SQLite, Chart.js, and Live Market API Feeds (GoldAPI & Google / Yahoo Finance).

---

## Key Features

- **Live Market Feed Integration**: Real-time XAU/USD spot prices from GoldAPI & Yahoo Finance API.
- **Dual Gold Rates Display**:
  - **Live XAU Spot Market Rate**: Un-taxed global spot rate (USD & INR per 1g, 10g & Troy Oz).
  - **Indian Retail Rate**: Duty-adjusted retail rates including 15% Customs Duty, 3% GST, bank bullion import premiums, and jeweler baseline margins.
- **Karat-wise Gold Rates**: Rates per 1 Gram and 10 Grams for **24K**, **22K (Jewelry Standard)**, and **18K** Gold.
- **Interactive Live Charting**:
  - **Real-time Intraday Graph**: Auto-polls live market ticks every 5 seconds.
  - **Multi-Timeframe Historical Graph**: Timeframe selector (`5D`, `1M`, `6M`, `1Y`) for 1-year daily OHLC candles.
- **Live SQL Analytics Playground**: Execute read-only SQL queries on live tick logs (`gold_prices`) and historical candles (`gold_daily`).

---

## How to Run

```bash
cd prism-gold-analytics
pip install -r requirements.txt
python app.py
```

Open **http://localhost:5000** in your browser. On first run, it automatically fetches historical market candles and seeds `prism.db`.

---

## Project Structure

```
prism-gold-analytics/
├── app.py               # Flask REST backend
├── queries.py           # Multi-source live fetcher, price calculators, SQL queries
├── database/
│   ├── schema.sql       # CREATE TABLE statements for gold_prices and gold_daily
│   └── seed_data.py     # Fetches 1-year daily gold history and initializes database
├── public/              # Frontend: index.html, style.css, script.js, chart.umd.min.js
└── requirements.txt     # Flask dependency
```
