const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Expose the uploads directory so the frontend can fetch images
app.use('/api/uploads', express.static(uploadDir));

// Configure Multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir); },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } });

// PostgreSQL Connection Pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgrespassword',
    database: process.env.DB_NAME || 'name_data',
    port: parseInt(process.env.DB_PORT || '5432'),
});

// Initialize Database
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS names (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                phone TEXT,
                address TEXT,
                image TEXT,
                createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Try to add columns if they don't exist
        const colsToAdd = ['phone TEXT', 'address TEXT', 'image TEXT'];
        for (const col of colsToAdd) {
            try {
                await pool.query(`ALTER TABLE names ADD COLUMN IF NOT EXISTS ${col}`);
            } catch (e) {}
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create default admin user if no users exist
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCount.rows[0].count) === 0) {
            const hashedPassword = await bcrypt.hash('password', 10);
            await pool.query(
                'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
                ['admin', hashedPassword]
            );
            console.log('Default admin user created: admin / password');
        }

        console.log('PostgreSQL Database initialized.');
    } catch (err) {
        console.error('Failed to initialize database:', err);
    }
}

initDB();

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden: Invalid token' });
        req.user = user;
        next();
    });
}

// --- Auth Routes ---

app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

        const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) return res.status(400).json({ message: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [username, hashedPassword]);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, message: 'Logged in successfully' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Names CRUD Routes (Protected) ---

// Read All
app.get('/api/names', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM names ORDER BY createdat DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create
app.post('/api/names', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const imageUrl = req.file ? `/api/uploads/${req.file.filename}` : null;
        const { name, description, phone, address, createdAt } = req.body;
        const createdat = createdAt || new Date().toISOString();

        const id = Date.now().toString();
        const result = await pool.query(
            'INSERT INTO names (id, name, description, phone, address, image, createdat) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [id, name || '', description || '', phone || '', address || '', imageUrl, createdat]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update
app.put('/api/names/:id', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await pool.query('SELECT * FROM names WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ message: 'Name not found' });

        const old = existing.rows[0];
        const imageUrl = req.file ? `/api/uploads/${req.file.filename}` : old.image;
        const { name, description, phone, address, createdAt } = req.body;

        const result = await pool.query(
            'UPDATE names SET name=$1, description=$2, phone=$3, address=$4, image=$5, createdat=$6 WHERE id=$7 RETURNING *',
            [name || old.name, description || old.description, phone || old.phone, address || old.address, imageUrl, createdAt || old.createdat, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete
app.delete('/api/names/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await pool.query('SELECT * FROM names WHERE id = $1', [id]);
        if (existing.rows.length === 0) return res.status(404).json({ message: 'Name not found' });

        await pool.query('DELETE FROM names WHERE id = $1', [id]);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
