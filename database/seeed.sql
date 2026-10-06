-- Insert Default User
INSERT INTO USERS (name, email, password) 
VALUES ('Student Developer', 'student@test.com', 'password123');

-- Insert Default Accounts
INSERT INTO ACCOUNTS (name, type, balance) VALUES 
('Main Checking', 'bank', 2500.00),
('Savings', 'bank', 10000.00);

-- Insert Default Categories
INSERT INTO CATEGORIES (name, type) VALUES 
('Salary', 'income'),
('Rent', 'expense'),
('Groceries', 'expense'),
('Utilities', 'expense'),
('Entertainment', 'expense');