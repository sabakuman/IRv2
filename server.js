
import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// SQLite requires CommonJS import style in some environments
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4173;
const DB_FILE = path.join(__dirname, 'database.sqlite');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- DATABASE SETUP ---
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeDatabase();
  }
});

const DEFAULT_ADMIN = {
  id: 'u-admin',
  fullName: 'System Administrator',
  email: 'admin',
  role: 'admin',
  password: 'admin',
  avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff',
  apiKey: ''
};

function initializeDatabase() {
  db.serialize(() => {
    // 1. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      fullName TEXT,
      role TEXT,
      password TEXT,
      avatarUrl TEXT,
      apiKey TEXT
    )`);

    // 2. Reports Table
    db.run(`CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      userId TEXT,
      title TEXT,
      status TEXT,
      updatedAt TEXT,
      data TEXT
    )`);

    // 3. Logs Table
    db.run(`CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      action TEXT,
      user TEXT,
      timestamp TEXT,
      details TEXT
    )`);

    // 4. Bulletin Table
    db.run(`CREATE TABLE IF NOT EXISTS bulletin (
      id INTEGER PRIMARY KEY,
      content TEXT,
      authorName TEXT,
      timestamp TEXT
    )`);

    // Smart Admin Seed
    db.get("SELECT * FROM users WHERE id = ?", [DEFAULT_ADMIN.id], (err, row) => {
      if (!row) {
        const adminStmt = db.prepare("INSERT INTO users (id, email, fullName, role, password, avatarUrl, apiKey) VALUES (?, ?, ?, ?, ?, ?, ?)");
        adminStmt.run(DEFAULT_ADMIN.id, DEFAULT_ADMIN.email, DEFAULT_ADMIN.fullName, DEFAULT_ADMIN.role, DEFAULT_ADMIN.password, DEFAULT_ADMIN.avatarUrl, DEFAULT_ADMIN.apiKey);
        adminStmt.finalize();
      }
    });

    // Seed default bulletin if empty
    db.get("SELECT count(*) as count FROM bulletin", (err, row) => {
      if (row && row.count === 0) {
        db.run("INSERT INTO bulletin (id, content, authorName, timestamp) VALUES (1, 'Welcome to the UAE Labour Market Intelligence portal. Please use the wizard to generate reports for upcoming bilateral meetings.', 'System Administrator', ?)", [new Date().toISOString()]);
      }
    });
  });
}

// --- API ENDPOINTS ---

// Bulletin
app.get('/api/bulletin', (req, res) => {
  db.get("SELECT * FROM bulletin WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || { content: '', authorName: '', timestamp: '' });
  });
});

app.post('/api/bulletin', (req, res) => {
  const { content, authorName } = req.body;
  const timestamp = new Date().toISOString();
  db.run("UPDATE bulletin SET content = ?, authorName = ?, timestamp = ? WHERE id = 1", [content, authorName, timestamp], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, timestamp });
  });
});

// Users
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const safeEmail = (email || '').trim();
  const safePassword = (password || '').trim();

  db.get("SELECT * FROM users WHERE (lower(email) = lower(?) OR id = ?) AND password = ?", [safeEmail, safeEmail, safePassword], (err, row) => {
    if (row) res.json(row);
    else res.status(401).json({ error: 'Invalid credentials' });
  });
});

app.get('/api/users', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { id, email, fullName, role, password, avatarUrl, apiKey } = req.body;
  const stmt = db.prepare("INSERT INTO users (id, email, fullName, role, password, avatarUrl, apiKey) VALUES (?, ?, ?, ?, ?, ?, ?)");
  stmt.run(id, email, fullName, role, password, avatarUrl, apiKey || '', (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
  stmt.finalize();
});

app.delete('/api/users/:id', (req, res) => {
  if (req.params.id === 'u-admin') return res.status(403).send("Cannot delete admin");
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
});

// Reports
app.get('/api/reports', (req, res) => {
  db.all("SELECT * FROM reports ORDER BY updatedAt DESC", [], (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else {
      const reports = rows.map(r => {
        try { return { ...r, data: JSON.parse(r.data) }; } 
        catch (e) { return { ...r, data: {} }; }
      });
      res.json(reports);
    }
  });
});

app.get('/api/reports/:id', (req, res) => {
  db.get("SELECT * FROM reports WHERE id = ?", [req.params.id], (err, row) => {
    if (err) res.status(500).json({ error: err.message });
    else if (!row) res.status(404).send("Report not found");
    else {
      try { row.data = JSON.parse(row.data); } catch (e) { row.data = {}; }
      res.json(row);
    }
  });
});

app.post('/api/reports', (req, res) => {
  const { id, userId, title, status, updatedAt, data } = req.body;
  const dataStr = JSON.stringify(data);
  const stmt = db.prepare("INSERT OR REPLACE INTO reports (id, userId, title, status, updatedAt, data) VALUES (?, ?, ?, ?, ?, ?)");
  stmt.run(id, userId, title, status, updatedAt, dataStr, (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
  stmt.finalize();
});

app.delete('/api/reports/:id', (req, res) => {
  db.run("DELETE FROM reports WHERE id = ?", [req.params.id], (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
});

// Logs
app.get('/api/logs', (req, res) => {
  db.all("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 500", [], (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

app.post('/api/logs', (req, res) => {
  const { id, action, user, timestamp, details } = req.body;
  const stmt = db.prepare("INSERT INTO logs (id, action, user, timestamp, details) VALUES (?, ?, ?, ?, ?)");
  stmt.run(id, action, user, timestamp, details, (err) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json({ success: true });
  });
  stmt.finalize();
});

// serve frontend
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'dist', 'index.html')); });

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
