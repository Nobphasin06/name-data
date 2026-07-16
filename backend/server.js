const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize PostgreSQL Database connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'name_data',
    port: process.env.DB_PORT || 5432,
});

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS names (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                phone TEXT,
                address TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Try to add columns if they don't exist
        try {
            await pool.query('ALTER TABLE names ADD COLUMN phone TEXT');
        } catch (e) {}
        try {
            await pool.query('ALTER TABLE names ADD COLUMN address TEXT');
        } catch (e) {}

        console.log("PostgreSQL Database initialized.");
    } catch (err) {
        console.error('Failed to initialize database:', err);
    }
}

initDB();

// API Routes (CRUD)

// 1. Read All
app.get('/api/names', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM names ORDER BY createdAt DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Create
app.post('/api/names', async (req, res) => {
    try {
        const newName = {
            id: Date.now().toString(),
            name: req.body.name || '',
            description: req.body.description || '',
            phone: req.body.phone || '',
            address: req.body.address || '',
            createdAt: req.body.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await pool.query(
            'INSERT INTO names (id, name, description, phone, address, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [newName.id, newName.name, newName.description, newName.phone, newName.address, newName.createdAt, newName.updatedAt]
        );
        
        const result = await pool.query('SELECT * FROM names WHERE id = $1', [newName.id]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Update
app.put('/api/names/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const existingResult = await pool.query('SELECT * FROM names WHERE id = $1', [id]);
        
        if (existingResult.rows.length === 0) {
            return res.status(404).json({ message: 'Name not found' });
        }

        const existing = existingResult.rows[0];
        const updatedName = req.body.name || existing.name;
        const updatedDesc = req.body.description || existing.description;
        const updatedPhone = req.body.phone || existing.phone;
        const updatedAddress = req.body.address || existing.address;
        const updatedCreatedAt = req.body.createdAt || existing.createdat;

        await pool.query(
            "UPDATE names SET name = $1, description = $2, phone = $3, address = $4, createdAt = $5, updatedAt = $6 WHERE id = $7",
            [updatedName, updatedDesc, updatedPhone, updatedAddress, updatedCreatedAt, new Date().toISOString(), id]
        );

        const updatedRecord = await pool.query('SELECT * FROM names WHERE id = $1', [id]);
        res.json(updatedRecord.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Delete
app.delete('/api/names/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const existingResult = await pool.query('SELECT * FROM names WHERE id = $1', [id]);
        
        if (existingResult.rows.length === 0) {
            return res.status(404).json({ message: 'Name not found' });
        }

        await pool.query('DELETE FROM names WHERE id = $1', [id]);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
