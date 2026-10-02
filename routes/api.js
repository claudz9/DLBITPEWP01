// routes/api.js
const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// --- Summary Routes ---
router.get('/summary/kpi', async (req, res) => {
    try {
        const query = `
            SELECT 
                (SELECT SUM(balance) FROM ACCOUNTS) AS total_balance,
                (SELECT SUM(amount) FROM TRANSACTIONS t JOIN CATEGORIES c ON t.category_id = c.id WHERE c.type = 'income' AND EXTRACT(MONTH FROM t.date) = EXTRACT(MONTH FROM CURRENT_DATE)) AS monthly_income,
                (SELECT SUM(amount) FROM TRANSACTIONS t JOIN CATEGORIES c ON t.category_id = c.id WHERE c.type = 'expense' AND EXTRACT(MONTH FROM t.date) = EXTRACT(MONTH FROM CURRENT_DATE)) AS monthly_expenses
        `;
        const { rows } = await pool.query(query);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching KPIs' });
    }
});

let categoryCache = { data: null, lastFetch: 0 };
router.get('/summary/categories', async (req, res) => {
    try {
        const now = Date.now();
        if (categoryCache.data && (now - categoryCache.lastFetch < 60000)) {
            return res.json(categoryCache.data);
        }
        const query = `
            SELECT c.name AS category, SUM(t.amount) AS total
            FROM TRANSACTIONS t JOIN CATEGORIES c ON t.category_id = c.id
            WHERE c.type = 'expense' GROUP BY c.name;
        `;
        const { rows } = await pool.query(query);
        categoryCache = { data: rows, lastFetch: now };
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching category summary' });
    }
});

router.get('/summary/monthly', async (req, res) => {
    try {
        const query = `
            SELECT TO_CHAR(t.date, 'Mon') AS month, EXTRACT(MONTH FROM t.date) AS month_num,
                SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE 0 END) AS income,
                SUM(CASE WHEN c.type = 'expense' THEN t.amount ELSE 0 END) AS expense
            FROM TRANSACTIONS t JOIN CATEGORIES c ON t.category_id = c.id
            GROUP BY month, month_num ORDER BY month_num ASC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching monthly summary' });
    }
});

router.get('/summary/cashflow', async (req, res) => {
    try {
        const query = `
            SELECT TO_CHAR(t.date, 'Mon') AS month, EXTRACT(MONTH FROM t.date) AS month_num,
                SUM(CASE WHEN c.type = 'income' THEN t.amount ELSE -t.amount END) AS net_balance
            FROM TRANSACTIONS t JOIN CATEGORIES c ON t.category_id = c.id
            GROUP BY month, month_num ORDER BY month_num ASC;
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching cash flow summary' });
    }
});

// --- Transaction Routes ---
router.get('/transactions', async (req, res) => {
    try {
        const query = `
            SELECT t.id, t.date, t.merchant, t.amount, t.status, c.name AS category, a.name AS account
            FROM TRANSACTIONS t
            LEFT JOIN CATEGORIES c ON t.category_id = c.id
            LEFT JOIN ACCOUNTS a ON t.account_id = a.id
            ORDER BY t.date DESC LIMIT 500;
        `;
        const { rows } = await pool.query(query);
        res.json({ data: rows });
    } catch (err) {
        res.status(500).json({ error: 'Server error while fetching transactions' });
    }
});

router.post('/transactions', async (req, res) => {
    try {
        let { date, merchant, amount, status, account_id, category_id } = req.body;

        //check for missing fields
        if (!date || !merchant || amount == undefined || !account_id || !category_id) {
            return res.status(400).json({ error: 'All fields (date, merchant, amount, account, category) are required' });
        }

        // sanitize and validate text ( remove accidental spaces, check length)
        merchant = merchant.trim();
        if (merchant.length === 0) {
            return res.status(400).json({ error: 'Merchant name cannot be empty.' });
        }

        // validate numbers ( ensure amount is valid positive number)
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ error: 'Amount must be a valid positive number.' });
        }

        // validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format.' });
        }

        // if it passes all security checks, insert into database
        const query = `
            INSERT INTO TRANSACTIONS (date, merchant, amount, status, account_id, category_id)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const values = [date, merchant, numericAmount, status || 'cleared', account_id, category_id];

        const { rows } = await pool.query(query, values);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while adding transaction' });
    }
});

module.exports = router;