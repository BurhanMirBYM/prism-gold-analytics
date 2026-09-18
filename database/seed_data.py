"""
PRISM Gold Analytics Data Seeder.
Fetches 1-year historical daily gold price data from Yahoo Finance API (GC=F)
and populates prism.db SQLite database tables.
"""
import json
import os
import random
import sqlite3
import urllib.request
from datetime import datetime, date, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "prism.db")
SCHEMA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")


def fetch_historical_gold():
    url = "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1y"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        res = urllib.request.urlopen(req, timeout=10)
        data = json.loads(res.read().decode("utf-8"))
        result = data["chart"]["result"][0]
        timestamps = result["timestamp"]
        quote = result["indicators"]["quote"][0]

        daily_rows = []
        for i in range(len(timestamps)):
            ts = timestamps[i]
            c_open = quote["open"][i]
            c_high = quote["high"][i]
            c_low = quote["low"][i]
            c_close = quote["close"][i]
            c_vol = quote["volume"][i] or 0

            if None in (c_open, c_high, c_low, c_close):
                continue

            dt_str = datetime.fromtimestamp(ts).strftime("%Y-%m-%d")
            daily_rows.append((
                dt_str,
                round(float(c_open), 2),
                round(float(c_high), 2),
                round(float(c_low), 2),
                round(float(c_close), 2),
                int(c_vol)
            ))
        return daily_rows
    except Exception as e:
        print(f"Warning: Could not fetch live historical data ({e}). Generating synthetic fallback.")
        return generate_synthetic_history()


def generate_synthetic_history(days=250):
    daily_rows = []
    current_date = date.today() - timedelta(days=days)
    base_price = 2400.0

    for i in range(days):
        if current_date.weekday() < 5:
            change = random.uniform(-25.0, 28.0)
            base_price = max(1800.0, base_price + change)
            high_p = round(base_price + random.uniform(5.0, 30.0), 2)
            low_p = round(base_price - random.uniform(5.0, 30.0), 2)
            open_p = round(base_price + random.uniform(-10.0, 10.0), 2)
            close_p = round(base_price, 2)
            vol = random.randint(50000, 250000)

            daily_rows.append((
                current_date.isoformat(),
                open_p, high_p, low_p, close_p, vol
            ))
        current_date += timedelta(days=1)
    return daily_rows


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript("""
        DROP TABLE IF EXISTS gold_prices;
        DROP TABLE IF EXISTS gold_daily;
    """)
    with open(SCHEMA_PATH) as f:
        conn.executescript(f.read())

    daily_data = fetch_historical_gold()
    conn.executemany("INSERT OR REPLACE INTO gold_daily VALUES (?,?,?,?,?,?)", daily_data)

    latest_close = daily_data[-1][4] if daily_data else 2650.0
    prev_close = daily_data[-2][4] if len(daily_data) > 1 else latest_close
    high_24h = daily_data[-1][2] if daily_data else latest_close + 15
    low_24h = daily_data[-1][3] if daily_data else latest_close - 15

    change_val = round(latest_close - prev_close, 2)
    change_pct = round((change_val / prev_close) * 100, 2) if prev_close else 0.0

    initial_tick = (
        datetime.now().isoformat(),
        "GC=F",
        latest_close,
        round(latest_close / 31.1035, 2),
        change_val,
        change_pct,
        high_24h,
        low_24h
    )
    conn.execute(
        "INSERT INTO gold_prices (timestamp, symbol, price, price_per_gram, change_val, change_pct, high_24h, low_24h) VALUES (?,?,?,?,?,?,?,?)",
        initial_tick
    )
    conn.commit()

    print(f"Seeded {DB_PATH} with {len(daily_data)} gold daily candles.")
    conn.close()


if __name__ == "__main__":
    main()
