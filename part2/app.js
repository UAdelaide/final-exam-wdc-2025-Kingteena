const express = require('express');
const path = require('path');
require('dotenv').config();
const db = require('./models/db');

// Import session middleware
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Set up session middleware
app.use(session({
    secret: 'defaultsecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

app.get('/api/dogs', async (req, res) => {
    try {
        // Modify the query to select the required fields
        const [rows] = await db.execute(`SELECT dog_id, name, size, owner_id FROM Dogs`);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching dogs:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Export the app instead of listening here
module.exports = app;
