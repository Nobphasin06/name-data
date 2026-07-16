const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend files
// เสิร์ฟไฟล์จากโฟลเดอร์ frontend เพื่อให้ผู้ใช้เปิดผ่าน http://localhost:3000 ได้เลย
app.use(express.static(path.join(__dirname, '../frontend')));

// In-memory Database
let namesData = [];

// API Routes (CRUD)

// 1. Read All (GET /api/names)
app.get('/api/names', (req, res) => {
    // Sort by newest first
    const sortedData = [...namesData].sort((a, b) => b.createdAt - a.createdAt);
    res.json(sortedData);
});

// 2. Create (POST /api/names)
app.post('/api/names', (req, res) => {
    const newName = {
        id: Date.now().toString(),
        name: req.body.name || '',
        description: req.body.description || '',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    namesData.push(newName);
    res.status(201).json(newName);
});

// 3. Update (PUT /api/names/:id)
app.put('/api/names/:id', (req, res) => {
    const id = req.params.id;
    const index = namesData.findIndex(item => item.id === id);
    
    if (index === -1) {
        return res.status(404).json({ message: 'Name not found' });
    }

    namesData[index] = {
        ...namesData[index],
        name: req.body.name || namesData[index].name,
        description: req.body.description || namesData[index].description,
        updatedAt: new Date()
    };

    res.json(namesData[index]);
});

// 4. Delete (DELETE /api/names/:id)
app.delete('/api/names/:id', (req, res) => {
    const id = req.params.id;
    const index = namesData.findIndex(item => item.id === id);
    
    if (index === -1) {
        return res.status(404).json({ message: 'Name not found' });
    }

    namesData.splice(index, 1);
    res.json({ message: 'Deleted successfully' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Frontend is accessible at http://localhost:${PORT}`);
});
