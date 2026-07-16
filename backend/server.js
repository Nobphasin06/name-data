const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Expose the uploads directory so the frontend can fetch images
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: function (req, file, cb) {
        // Create unique filename
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

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
        const columnsToAdd = ['phone', 'address', 'image'];
        for (const col of columnsToAdd) {
            try {
                await pool.query(`ALTER TABLE names ADD COLUMN ${col} TEXT`);
            } catch (e) {}
        }

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

// 2. Create (Supports Image Upload)
app.post('/api/names', upload.single('image'), async (req, res) => {
    try {
        const newName = {
            id: Date.now().toString(),
            name: req.body.name || '',
            description: req.body.description || '',
            phone: req.body.phone || '',
            address: req.body.address || '',
            image: req.file ? req.file.filename : null,
            createdAt: req.body.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await pool.query(
            'INSERT INTO names (id, name, description, phone, address, image, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [newName.id, newName.name, newName.description, newName.phone, newName.address, newName.image, newName.createdAt, newName.updatedAt]
        );
        
        const result = await pool.query('SELECT * FROM names WHERE id = $1', [newName.id]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Update (Supports Image Upload)
app.put('/api/names/:id', upload.single('image'), async (req, res) => {
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
        
        let updatedImage = existing.image;
        if (req.file) {
            // New image uploaded, replace the old one
            updatedImage = req.file.filename;
            
            // Delete old physical file if it exists
            if (existing.image) {
                const oldImagePath = path.join(__dirname, 'uploads', existing.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        await pool.query(
            "UPDATE names SET name = $1, description = $2, phone = $3, address = $4, image = $5, createdAt = $6, updatedAt = $7 WHERE id = $8",
            [updatedName, updatedDesc, updatedPhone, updatedAddress, updatedImage, updatedCreatedAt, new Date().toISOString(), id]
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

        const existing = existingResult.rows[0];

        // Delete from DB
        await pool.query('DELETE FROM names WHERE id = $1', [id]);
        
        // Delete physical file
        if (existing.image) {
            const imagePath = path.join(__dirname, 'uploads', existing.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
