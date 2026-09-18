# 📌 PRISM Analytics — Quick Study Notes & Cheat Sheet
> **Author: Burhan Mir** | Keep this cheat sheet handy before technical interviews!

---

## 🛍️ Project 1: PRISM Retail Analytics (Quick Notes)

### 1. Key Metrics & Business Concepts
- **Revenue**: Total sales amount ($\sum \text{sales}$).
- **Profit Margin %**: $(\text{Total Profit} / \text{Total Sales}) \times 100$.
- **Average Order Value (AOV)**: $\text{Total Revenue} / \text{Distinct Order Count}$.
- **RFM Segmentation**:
  - **Recency (R)**: Days since last purchase (Lower = Better).
  - **Frequency (F)**: Total number of completed orders (Higher = Better).
  - **Monetary (M)**: Total lifetime monetary spend (Higher = Better).
  - **Segments**: *Champions*, *Loyal Customers*, *At Risk*, *Hibernating*.

### 2. Database Schema (Star Schema)
```
[customers]  ──┐
               ├──> [orders] ──> [order_items] (FACT TABLE)
[products]   ──┘
```
- **Fact Table**: `order_items` (`quantity`, `discount`, `sales`, `profit`).
- **Dimensions**: `customers`, `products`, `orders`.

### 3. Core SQL Snippets to Remember
- **Month Truncation**: `strftime('%Y-%m', order_date)`
- **Quartile Window Function**: `NTILE(4) OVER (ORDER BY monetary DESC)`
- **Date Difference**: `JULIANDAY('2024-12-31') - JULIANDAY(MAX(order_date))`

---

## 🟡 Project 2: PRISM Gold Analytics (Quick Notes)

### 1. Key Gold Rate Formulas (India Market)
- **1 Troy Ounce** = `31.1035 grams`.
- **Raw INR/gram** = `(Spot USD per oz / 31.1035) * 83.50 (USD/INR)`.
- **Indian Retail Multiplier (`1.30`)**:
  - `15%` Customs Import Duty
  - `3%` GST
  - `12%` Bank import fees & jeweler baseline making charges
  - **Result**: ~₹15,400 per 1 gram for 24K gold.
- **Purity Factors**:
  - **24K**: $100\%$ Purity ($\times 1.00$)
  - **22K**: $91.67\%$ Purity ($\times 0.9167$)
  - **18K**: $75.00\%$ Purity ($\times 0.7500$)

### 2. Time-Series Window Function Snippet
- **7-Day Rolling Average**:
```sql
AVG(price_inr_24k_1g) OVER (
    ORDER BY date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
) AS rolling_7d_avg
```

---

## 🔒 Security & Tech Stack Summary

| Layer | Tech Used | Key Technical Detail |
| :--- | :--- | :--- |
| **Database** | SQLite3 | Embedded, transactional, zero-config relational DB |
| **Backend** | Python 3 / Flask | REST API endpoints, connection pooling per request |
| **Security** | Regex Allow-List | Rejects `DROP`, `DELETE`, `UPDATE`, allows `SELECT` / `WITH` |
| **Frontend** | Vanilla JS & Chart.js | Dynamic Canvas charts, CSS Grid Dark UI |

---

## 💡 Quick Interview Q&A Flashcards

1. **Q: Why Star Schema over 3NF?**
   - *A: Star Schema reduces JOIN depth and optimizes aggregations for OLAP analytics.*
2. **Q: How to protect against SQL Injection in open SQL playgrounds?**
   - *A: Regex pattern filtering for DML/DDL keywords + strict start-with `SELECT`/`WITH` validation.*
3. **Q: Difference between `WHERE` and `HAVING`?**
   - *A: `WHERE` filters rows BEFORE grouping; `HAVING` filters aggregated values AFTER `GROUP BY`.*
4. **Q: What is `NTILE(4)`?**
   - *A: A SQL window function that divides an ordered dataset into 4 equal quartiles (1 = Top 25%).*
5. **Q: How is Gold Rate calculated in India?**
   - *A: International Spot Price ($/oz) $\div$ 31.1035 $\times$ USD/INR Exchange Rate $\times$ 1.30 (Duty + GST + Margins).*

---
*Quick Reference Notes by Burhan Mir*
