-- database/seed.sql

TRUNCATE TABLE TRANSACTIONS, BUDGETS, CATEGORIES, ACCOUNTS, USERS RESTART IDENTITY CASCADE;

-- Insert Default User 
INSERT INTO USERS (name, email, password) 
VALUES ('Student Developer', 'student@test.com', 'password123');

--  Insert Accounts 
INSERT INTO ACCOUNTS (name, type, balance) VALUES 
('Main Checking', 'bank', 3450.00),
('Savings', 'bank', 10500.00),
('Credit Card', 'credit', -340.50);

-- Insert Categories 
INSERT INTO CATEGORIES (name, type) VALUES 
('Salary', 'income'),           -- 1
('Freelance', 'income'),        -- 2
('Rent', 'expense'),            -- 3
('Groceries', 'expense'),       -- 4
('Utilities', 'expense'),       -- 5
('Entertainment', 'expense'),   -- 6
('Dining Out', 'expense'),      -- 7
('Transportation', 'expense'),  -- 8
('Healthcare', 'expense');      -- 9

-- Insert Budgets
INSERT INTO BUDGETS (amount, period, category_id) VALUES 
(1200.00, 'monthly', 3), -- Rent Budget
(450.00, 'monthly', 4),  -- Groceries Budget
(200.00, 'monthly', 6);  -- Entertainment Budget

-- Insert Transactions 
INSERT INTO TRANSACTIONS (date, merchant, amount, status, account_id, category_id, user_id) VALUES 
-- August Data
('2026-08-01', 'Property Management', 1200.00, 'cleared', 1, 3, 1),
('2026-08-05', 'City Grocery', 112.50, 'cleared', 1, 4, 1),
('2026-08-12', 'TechCorp Salary', 3200.00, 'cleared', 1, 1, 1),
('2026-08-15', 'Electric Utility', 85.00, 'cleared', 1, 5, 1),
('2026-08-20', 'City Grocery', 95.20, 'cleared', 1, 4, 1),
('2026-08-25', 'Cinema & Popcorn', 45.00, 'cleared', 3, 6, 1),

-- September Data
('2026-09-01', 'Property Management', 1200.00, 'cleared', 1, 3, 1),
('2026-09-03', 'City Grocery', 130.00, 'cleared', 1, 4, 1),
('2026-09-08', 'Metro Pass', 65.00, 'cleared', 3, 8, 1),
('2026-09-12', 'TechCorp Salary', 3200.00, 'cleared', 1, 1, 1),
('2026-09-14', 'Internet Provider', 60.00, 'cleared', 3, 5, 1),
('2026-09-18', 'Pharmacy', 35.50, 'cleared', 3, 9, 1),
('2026-09-21', 'City Grocery', 105.75, 'cleared', 1, 4, 1),
('2026-09-24', 'Freelance Client', 450.00, 'cleared', 1, 2, 1),
('2026-09-28', 'Downtown Cafe', 28.00, 'cleared', 3, 7, 1),

-- October Data (Current Month)
('2026-10-01', 'Property Management', 1200.00, 'cleared', 1, 3, 1),
('2026-10-02', 'City Grocery', 145.20, 'cleared', 1, 4, 1),
('2026-10-04', 'Gas Station', 45.00, 'cleared', 3, 8, 1),
('2026-10-05', 'Spotify Subscription', 10.99, 'cleared', 3, 6, 1),
('2026-10-06', 'Downtown Cafe', 32.50, 'cleared', 3, 7, 1),
('2026-10-07', 'Transfer to Savings', 500.00, 'cleared', 1, 2, 1);