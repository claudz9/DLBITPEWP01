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

## 🏗️ Architectural Decisions
Single-Page Application (SPA): The frontend relies on native HTML/JS with Tailwind CSS, utilizing the Fetch API for asynchronous data loading. This prevents full-page reloads and creates a seamless user experience.

Unified Server: Node.js (Express) handles both API routing and static file serving natively on a single port. This eliminates complex CORS restrictions and ensures smooth communication between the frontend and backend.

## 📊 Chart State Synchronization Behaviors
Data consistency between the UI components and the database is maintained asynchronously.

When a user adds a new transaction via the UI or uploads a CSV, a POST request is sent to the Express API.

Upon a successful 201 Created response, the frontend triggers $('#table').DataTable().ajax.reload(null, false).

This allows the DataTables ledger to resynchronize its state with the PostgreSQL backend instantly without disrupting the user's current pagination or sorting view.

Chart.js components similarly rely on backend SQL aggregation to ensure visual metrics always reflect the most current, verified database state without requiring heavy client-side processing. Monthly income and expense KPIs use the current calendar month's date range.

## ⚙️ Setup & Installation Instructions

If you want to run this project locally on your machine, follow these steps:

**1. Clone the repository and install dependencies**

Open your terminal and run:
```bash
git clone <your-repository-url>
cd dlbitpewp01
npm install
```


This installs the packages listed in package.json.

2. Set up the PostgreSQL Database

You need PostgreSQL installed to run this backend.

Create a new PostgreSQL database named finance_dashboard.

Run the schema script to generate the tables:
psql -U your_username -d finance_dashboard -f database/schema.sql

Run the seed script to populate the initial mock data:
psql -U your_username -d finance_dashboard -f database/seed.sql

3. Configure Environment Variables

Create a .env file in the root folder of the project and add your local database credentials:
```
PORT=3000
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_dashboard
```

4. Run the Application

Start the backend server by running:
```bash
node server.js
```
When the server starts, open http://localhost:3000 in your browser. The server also natively serves the frontend HTML files.
