// routes/api.js
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' }); // Temporarily stores uploaded files
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
// --- User Authentication Routes ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        //check if user exists
        const userQuery = 'SELECT id, name, email, password FROM USERS WHERE email = $1';
        const { rows } = await pool.query(userQuery, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = rows[0];

        // verify password (prototype logic - not hasehd for simplicity)
        if (password !== user.password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // return user data (excluding password)
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id, name: user.name, email: user.email
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
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
        console.error('Transaction error:', err);
        res.status(500).json({ error: 'Server error while adding transaction' });
    }
});

// --- Route: Upload and Parse CSV of Transactions ---
router.post('/transactions/upload', upload.single('csvFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const results = [];

    // Read the file and force headers to lowercase to prevent invisible character bugs
    fs.createReadStream(req.file.path)
        .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase() }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            let importedCount = 0;
            const client = await pool.connect();

            try {
                await client.query('BEGIN'); // Start transaction


                const insertQuery = `
                    INSERT INTO TRANSACTIONS (date, merchant, amount, status, account_id, category_id) 
                    VALUES ($1, $2, $3, $4, $5, $6);
                `;

                for (const row of results) {
                    // Check our newly lowercased headers
                    if (row.date && row.merchant && row.amount) {
                        await client.query(insertQuery, [
                            row.date,
                            row.merchant,
                            parseFloat(row.amount),
                            'cleared',
                            parseInt(row.accountid) || 1,
                            parseInt(row.categoryid) || 7
                        ]);
                        importedCount++;
                    }
                }

                await client.query('COMMIT'); // Save changes
                fs.unlinkSync(req.file.path); // Delete temp file

                res.status(200).json({ message: `Successfully imported ${importedCount} transactions.` });

            } catch (err) {
                await client.query('ROLLBACK'); // Undo changes if something breaks
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                console.error('Import Error Details:', err);
                res.status(500).json({ error: 'Database error during CSV import.' });
            } finally {
                client.release();
            }
        });
});

module.exports = router;