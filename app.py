"""
PRISM Gold Analytics Backend.
Runs Flask HTTP routes to expose live gold market data, intraday/historical charts,
currency conversions, and live SQL queries.
"""
import os
import sqlite3
from flask import Flask, jsonify, request, send_from_directory

import queries
from database import seed_data

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "prism.db")
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

app = Flask(__name__, static_folder=None)


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    return conn


def ensure_db():
    if not os.path.exists(DB_PATH):
        print("No database found — seeding initial gold price history.")
        seed_data.main()


# ---------- static frontend ----------

@app.route("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.route("/<path:filename>")
def public_files(filename):
    return send_from_directory(PUBLIC_DIR, filename)


# ---------- GOLD API ENDPOINTS ----------

@app.route("/api/gold/live")
def api_gold_live():
    conn = get_conn()
    try:
        return jsonify(queries.fetch_and_store_live_gold(conn))
    finally:
        conn.close()


@app.route("/api/gold/kpis")
def api_gold_kpis():
    conn = get_conn()
    try:
        return jsonify(queries.get_gold_kpis(conn))
    finally:
        conn.close()


@app.route("/api/gold/intraday")
def api_gold_intraday():
    conn = get_conn()
    try:
        return jsonify(queries.get_intraday_trend(conn))
    finally:
        conn.close()


@app.route("/api/gold/history")
def api_gold_history():
    tf = request.args.get("range", "1M")
    conn = get_conn()
    try:
        return jsonify(queries.get_historical_trend(conn, tf))
    finally:
        conn.close()


@app.route("/api/gold/currencies")
def api_gold_currencies():
    conn = get_conn()
    try:
        return jsonify(queries.get_gold_currencies(conn))
    finally:
        conn.close()


@app.route("/api/query", methods=["POST"])
def api_query():
    sql = (request.get_json(silent=True) or {}).get("sql", "")
    conn = get_conn()
    try:
        result = queries.run_custom_query(conn, sql)
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except sqlite3.Error as e:
        return jsonify({"error": f"SQL error: {e}"}), 400
    finally:
        conn.close()


if __name__ == "__main__":
    ensure_db()
    print("PRISM Gold Analytics is running -> http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
