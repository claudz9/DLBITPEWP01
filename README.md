# Personal Finance Dashboard (DLBITPEWP01)

Hi! Welcome to my web programming project. I built this financial analytics dashboard to simulate a user-facing web application that helps users track their spending, understand their cash flow, and manage their budget. 

As a student project, this application focuses on implementing a clean Single-Page Application (SPA) architecture using a REST API, relational database, and dynamic front-end rendering without page reloads (using AJAX).

## Features
* **Dashboard Overview:** Dynamic KPI cards showing total balance, monthly income, and expenses.
* **Interactive Charts:** A Chart.js bar chart for income vs. expenses, a line chart for spending trends, and a pie chart for category breakdowns.
* **Transaction Ledger:** A fully searchable, sortable, and paginated transaction table powered by DataTables.js.
* **AJAX Data Entry:** A modal form to add new transactions that updates the database and frontend table asynchronously without refreshing the page.

## Tech Stack & Dependencies
* **Frontend:** HTML5, Tailwind CSS (via CDN), Vanilla JavaScript, jQuery
* **Visualizations & Tables:** Chart.js, DataTables.js
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (with `pg` node package)
* **Environment Management:** `dotenv`
* **Middleware:** `cors`

## ⚙️ Setup & Installation Instructions

If you want to run this project locally on your machine, follow these steps:

**1. Clone the repository and install dependencies**

Open your terminal and run:
```bash
git clone <your-repository-url>
cd dlbitpewp01
npm install
```

This installs the packages listed in `package.json`.

**2. Set up the PostgreSQL Database**

Open PostgreSQL (via pgAdmin or psql) and create a new database called finance_dashboard.

Run the SQL queries provided in the project files to create the ACCOUNTS, CATEGORIES, BUDGETS, and TRANSACTIONS tables.

Insert the mock data to populate the charts.

**3. Configure Environment Variables**

Create a .env file in the root folder of the project and add your local database credentials:

```env
PORT=3000
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_dashboard
```

**4. Run the Application**

Start the backend server by running:
```bash
node server.js
```

When the server starts, open `http://localhost:3000` in your browser. The server also serves the frontend files.