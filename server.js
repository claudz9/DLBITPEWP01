// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Mount External Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Start Server
app.listen(port, () => {
    console.log(`Finance API is running cleanly on http://localhost:${port}`);
});