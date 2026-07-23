const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
            phone TEXT,
            address TEXT,
            imageUrl TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create users table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            refresh_token TEXT,
            is_active BOOLEAN DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create profiles table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            display_name TEXT,
            avatar_url TEXT,
            bio TEXT,
            phone TEXT,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    // Try to alter table to add new columns just in case it was created before
    try {
        await db.exec('ALTER TABLE names ADD COLUMN phone TEXT');
    } catch (e) {} // Ignore if column already exists
    try {
        await db.exec('ALTER TABLE names ADD COLUMN address TEXT');
    } catch (e) {} // Ignore if column already exists
    try {
        await db.exec('ALTER TABLE names ADD COLUMN imageUrl TEXT');
    } catch (e) {} // Ignore if column already exists

    console.log("SQLite Database initialized.");
}

initDB().catch(err => {
    console.error('Failed to initialize database:', err);
});

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// --- Auth Routes ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, display_name } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const existingUser = await db.get('SELECT * FROM users WHERE email = ?', email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = Date.now().toString();
        
        await db.run(
            'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
            [userId, email, hashedPassword]
        );

        const profileId = Date.now().toString() + '-p';
        await db.run(
            'INSERT INTO profiles (id, user_id, display_name) VALUES (?, ?, ?)',
            [profileId, userId, display_name || email.split('@')[0]]
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await db.get('SELECT * FROM users WHERE email = ?', email);
        if (!user || !user.is_active) {
            return res.status(401).json({ message: 'Invalid credentials or inactive account' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user.id, email: user.email }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

        await db.run('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

        res.json({ accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.sendStatus(401);

        const user = await db.get('SELECT * FROM users WHERE refresh_token = ?', token);
        if (!user) return res.sendStatus(403);

        jwt.verify(token, JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) return res.sendStatus(403);
            const accessToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
            res.json({ accessToken });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        await db.run('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Profile Routes ---

app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const profile = await db.get('SELECT * FROM profiles WHERE user_id = ?', req.user.id);
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/profile', authenticateToken, async (req, res) => {
    try {
        const updates = req.body;
        const allowedFields = ['display_name', 'avatar_url', 'bio', 'phone'];
        
        let updateQuery = 'UPDATE profiles SET ';
        let updateValues = [];
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateQuery += `${key} = ?, `;
                updateValues.push(value);
            }
        }
        
        if (updateValues.length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update' });
        }
        
        updateQuery += 'updatedAt = ? WHERE user_id = ?';
        updateValues.push(new Date().toISOString(), req.user.id);
        
        await db.run(updateQuery, updateValues);
        
        const updatedProfile = await db.get('SELECT * FROM profiles WHERE user_id = ?', req.user.id);
        res.json(updatedProfile);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Routes (CRUD)

// 1. Read All
app.get('/api/names', authenticateToken, async (req, res) => {
    try {
        const sortedData = await db.all('SELECT * FROM names ORDER BY createdAt DESC');
        res.json(sortedData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Create
app.post('/api/names', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const newName = {
            id: Date.now().toString(),
            name: req.body.name || '',
            description: req.body.description || '',
            phone: req.body.phone || '',
            address: req.body.address || '',
            imageUrl: imageUrl,
            createdAt: req.body.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await db.run(
            'INSERT INTO names (id, name, description, phone, address, imageUrl, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [newName.id, newName.name, newName.description, newName.phone, newName.address, newName.imageUrl, newName.createdAt, newName.updatedAt]
        );
        
        const createdRecord = await db.get('SELECT * FROM names WHERE id = ?', newName.id);
        res.status(201).json(createdRecord);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Update
app.put('/api/names/:id', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await db.get('SELECT * FROM names WHERE id = ?', id);
        
        if (!existing) {
            return res.status(404).json({ message: 'Name not found' });
        }

        const updatedName = req.body.name || existing.name;
        const updatedDesc = req.body.description || existing.description;
        const updatedPhone = req.body.phone || existing.phone;
        const updatedAddress = req.body.address || existing.address;
        const updatedCreatedAt = req.body.createdAt || existing.createdAt;
        const updatedImageUrl = req.file ? `/uploads/${req.file.filename}` : existing.imageUrl;

        await db.run(
            "UPDATE names SET name = ?, description = ?, phone = ?, address = ?, imageUrl = ?, createdAt = ?, updatedAt = ? WHERE id = ?",
            [updatedName, updatedDesc, updatedPhone, updatedAddress, updatedImageUrl, updatedCreatedAt, new Date().toISOString(), id]
        );

        const updatedRecord = await db.get('SELECT * FROM names WHERE id = ?', id);
        res.json(updatedRecord);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Delete
app.delete('/api/names/:id', authenticateToken, async (req, res) => {
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
