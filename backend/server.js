const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

let db;

// Initialize SQLite Database
async function initDB() {
    db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });

    // Create table if it doesn't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS names (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log("SQLite Database initialized.");
}

initDB().catch(err => {
    console.error('Failed to initialize database:', err);
});

// API Routes (CRUD)

// 1. Read All (GET /api/names)
app.get('/api/names', async (req, res) => {
    try {
        // Sort by newest first
        const sortedData = await db.all('SELECT * FROM names ORDER BY createdAt DESC');
        res.json(sortedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Create (POST /api/names)
app.post('/api/names', async (req, res) => {
    try {
        const newName = {
            id: Date.now().toString(),
            name: req.body.name || '',
            description: req.body.description || ''
        };
        
        await db.run(
            'INSERT INTO names (id, name, description) VALUES (?, ?, ?)',
            [newName.id, newName.name, newName.description]
        );
        
        // Fetch the newly created record
        const createdRecord = await db.get('SELECT * FROM names WHERE id = ?', newName.id);
        res.status(201).json(createdRecord);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Update (PUT /api/names/:id)
app.put('/api/names/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await db.get('SELECT * FROM names WHERE id = ?', id);
        
        if (!existing) {
            return res.status(404).json({ message: 'Name not found' });
        }

        const updatedName = req.body.name || existing.name;
        const updatedDesc = req.body.description || existing.description;

        await db.run(
            "UPDATE names SET name = ?, description = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
            [updatedName, updatedDesc, id]
        );

        const updatedRecord = await db.get('SELECT * FROM names WHERE id = ?', id);
        res.json(updatedRecord);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Delete (DELETE /api/names/:id)
app.delete('/api/names/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await db.get('SELECT * FROM names WHERE id = ?', id);
        
        if (!existing) {
            return res.status(404).json({ message: 'Name not found' });
        }

        await db.run('DELETE FROM names WHERE id = ?', id);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Frontend is accessible at http://localhost:${PORT}`);
});
