-- PRISM Gold Analytics Schema
-- Tracks live tick market data and 1-year historical daily OHLC prices for Gold (XAU/USD).

CREATE TABLE IF NOT EXISTS gold_prices (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp      TEXT NOT NULL,    -- ISO format timestamp
    symbol         TEXT NOT NULL,    -- e.g. GC=F / XAUUSD
    price          REAL NOT NULL,    -- USD per troy ounce
    price_per_gram REAL NOT NULL,    -- USD per gram (price / 31.1035)
    change_val     REAL NOT NULL,    -- USD price change
    change_pct     REAL NOT NULL,    -- Percentage change
    high_24h       REAL NOT NULL,    -- 24h high
    low_24h        REAL NOT NULL     -- 24h low
);

CREATE TABLE IF NOT EXISTS gold_daily (
    date        TEXT PRIMARY KEY,  -- YYYY-MM-DD
    open_price  REAL NOT NULL,
    high_price  REAL NOT NULL,
    low_price   REAL NOT NULL,
    close_price REAL NOT NULL,
    volume      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gold_prices_ts ON gold_prices(timestamp);
CREATE INDEX IF NOT EXISTS idx_gold_daily_date ON gold_daily(date);
