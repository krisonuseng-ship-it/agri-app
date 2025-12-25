require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = "my_super_secret_key_change_this"; // กุญแจลับสำหรับ Login

// ตั้งค่า AI (อย่าลืมใส่ GEMINI_API_KEY ในไฟล์ .env ของคุณนะ!)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // รองรับรูปภาพขนาดใหญ่

// --- 1. ระบบฐานข้อมูล (SQLite) ---
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) console.error("Database Error:", err.message);
    else console.log("Connected to SQLite database.");
});

// สร้างตารางเก็บ User อัตโนมัติถ้ายังไม่มี
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'pending',
        usage_daily INTEGER DEFAULT 0,
        limit_daily INTEGER DEFAULT 5
    )`);
});

// --- 2. ระบบ Login & Register ---

// สมัครสมาชิก
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    // ทริค: ถ้าชื่อ admin ให้เป็น admin เลย, นอกนั้นเป็น user
    const role = username.toLowerCase() === 'admin' ? 'admin' : 'user';
    const status = role === 'admin' ? 'approved' : 'pending';
    
    const sql = `INSERT INTO users (username, password, role, status, limit_daily) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [username, password, role, status, 10], function(err) {
        if (err) return res.status(400).json({ error: "Username นี้มีคนใช้แล้ว" });
        res.json({ message: "สมัครสำเร็จ! รอแอดมินอนุมัติ (ถ้าไม่ใช่ Admin)" });
    });
});

// เข้าสู่ระบบ
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, user) => {
        if (err || !user) return res.status(401).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านผิด" });
        if (user.status === 'banned') return res.status(403).json({ error: "บัญชีของคุณถูกระงับ" });
        if (user.status === 'pending') return res.status(403).json({ error: "รอการอนุมัติจาก Admin" });

        // สร้าง Token
        const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, SECRET_KEY, { expiresIn: '1d' });
        res.json({ token, role: user.role, username: user.username });
    });
});

// --- Middleware ตรวจสอบตัวตน ---
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "No token provided" });
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = decoded;
        next();
    });
};

// --- 3. API หลักสำหรับ AI (Yanapanya Analysis) ---
app.post('/api/analyze', authenticate, async (req, res) => {
    const { prompt, imageBase64 } = req.body;
    const userId = req.user.id;

    // เช็คโควตา
    db.get(`SELECT usage_daily, limit_daily FROM users WHERE id = ?`, [userId], async (err, row) => {
       if (!row) return res.status(401).json({ error: "User not found, please login again" });
       if (row.usage_daily >= row.limit_daily) {
            return res.status(429).json({ error: "โควตาการใช้งานวันนี้เต็มแล้ว (Limit Exceeded)" });
        }

        try {
            // เรียก Google Gemini
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // ใช้รุ่น 1.5 Flash (เร็วและถูก)
            
            let result;
            if (imageBase64) {
                const imageParts = [{ inlineData: { data: imageBase64, mimeType: "image/jpeg" } }];
                result = await model.generateContent([prompt, ...imageParts]);
            } else {
                result = await model.generateContent(prompt);
            }

            const response = await result.response;
            const text = response.text();
            
            // ตัดเอาแค่ JSON (เผื่อ AI ตอบเกริ่นนำมา)
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonData = JSON.parse(jsonStr);

            // ตัดยอดใช้งาน +1
            db.run(`UPDATE users SET usage_daily = usage_daily + 1 WHERE id = ?`, [userId]);

            res.json(jsonData);

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "AI Error: " + error.message });
        }
    });
});

// --- 4. API สำหรับ Admin Dashboard ---

// ดึงรายชื่อ User ทั้งหมด
app.get('/api/admin/users', authenticate, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });
    db.all(`SELECT id, username, role, status, usage_daily, limit_daily FROM users`, [], (err, rows) => {
        res.json(rows);
    });
});

// อนุมัติ/แบน User
app.post('/api/admin/update-status', authenticate, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });
    const { userId, status } = req.body;
    db.run(`UPDATE users SET status = ? WHERE id = ?`, [status, userId], (err) => {
        res.json({ success: true });
    });
});

// แก้ไขโควตา (Limit) - ฟังก์ชันที่คุณขอเพิ่ม!
app.post('/api/admin/update-limit', authenticate, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Access Denied" });
    const { userId, limit } = req.body;
    db.run(`UPDATE users SET limit_daily = ? WHERE id = ?`, [limit, userId], (err) => {
        res.json({ success: true });
    });
});

// เริ่มต้น Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`- Database: users.db (Created automatically)`);
    console.log(`- Admin System: Ready`);
});
