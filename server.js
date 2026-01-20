
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

    // 2. Reports Table (Data stored as JSON string)
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

    // 4. Announcements Table
    db.run(`CREATE TABLE IF NOT EXISTS app_announcements (
      id TEXT PRIMARY KEY,
      message_en TEXT,
      message_ar TEXT,
      updatedAt TEXT,
      updatedBy TEXT
    )`);

    // 5. Letter Logs Table
    db.run(`CREATE TABLE IF NOT EXISTS letter_logs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      internal_ref TEXT,
      topic TEXT,
      external_ref TEXT,
      status TEXT DEFAULT 'open',
      label TEXT,
      label_color TEXT,
      notes TEXT,
      attachment_url TEXT,
      created_by TEXT,
      created_by_id TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);

    // 6. Letter Log Notes Table
    db.run(`CREATE TABLE IF NOT EXISTS letter_log_notes (
      id TEXT PRIMARY KEY,
      letter_id TEXT,
      note TEXT,
      created_by TEXT,
      created_by_id TEXT,
      created_at TEXT,
      FOREIGN KEY(letter_id) REFERENCES letter_logs(id)
    )`);

    // --- SEEDING ---
    db.get("SELECT * FROM users WHERE id = ?", [DEFAULT_ADMIN.id], (err, row) => {
      if (!row) {
        const adminStmt = db.prepare("INSERT INTO users (id, email, fullName, role, password, avatarUrl, apiKey) VALUES (?, ?, ?, ?, ?, ?, ?)");
        adminStmt.run(DEFAULT_ADMIN.id, DEFAULT_ADMIN.email, DEFAULT_ADMIN.fullName, DEFAULT_ADMIN.role, DEFAULT_ADMIN.password, DEFAULT_ADMIN.avatarUrl, DEFAULT_ADMIN.apiKey);
        adminStmt.finalize();
      }
    });
  });
}

// --- API ENDPOINTS ---

// Announcement
app.get('/api/announcement', (req, res) => {
  db.get("SELECT * FROM app_announcements WHERE id = 'current'", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

app.post('/api/announcement', (req, res) => {
  const { message_en, message_ar, updatedAt, updatedBy } = req.body;
  db.run("INSERT OR REPLACE INTO app_announcements (id, message_en, message_ar, updatedAt, updatedBy) VALUES (?, ?, ?, ?, ?)", 
    ['current', message_en, message_ar, updatedAt, updatedBy], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE (lower(email) = lower(?) OR id = ?) AND password = ?", [email, email, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) res.json(row);
    else res.status(401).json({ error: 'Invalid credentials' });
  });
});

app.get('/api/users', (req, res) => {
  // Ensure we select all columns to avoid missing metadata in UI
  db.all("SELECT id, email, fullName, role, avatarUrl, apiKey FROM users ORDER BY fullName ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { id, email, fullName, role, password, avatarUrl } = req.body;
  db.run("INSERT INTO users (id, email, fullName, role, password, avatarUrl) VALUES (?, ?, ?, ?, ?, ?)", 
    [id, email, fullName, role, password, avatarUrl], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/users/:id', (req, res) => {
  if (req.params.id === 'u-admin') return res.status(403).send("Cannot delete root admin");
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Reports
app.get('/api/reports', (req, res) => {
  db.all("SELECT * FROM reports ORDER BY updatedAt DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const reports = rows.map(r => ({ ...r, data: JSON.parse(r.data) }));
    res.json(reports);
  });
});

app.get('/api/reports/:id', (req, res) => {
  db.get("SELECT * FROM reports WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).send("Not found");
    row.data = JSON.parse(row.data);
    res.json(row);
  });
});

app.post('/api/reports', (req, res) => {
  const { id, userId, title, status, updatedAt, data } = req.body;
  db.run("INSERT OR REPLACE INTO reports (id, userId, title, status, updatedAt, data) VALUES (?, ?, ?, ?, ?, ?)", 
    [id, userId, title, status, updatedAt, JSON.stringify(data)], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/reports/:id', (req, res) => {
  const userRole = req.headers['x-user-role'];
  // Tightened security: Strictly enforce admin role for deletion
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Permission denied. Only administrators can delete reports.' });
  }
  db.run("DELETE FROM reports WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- LETTER LOG API ---
app.get('/api/letters', (req, res) => {
  db.all("SELECT * FROM letter_logs ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/letters/:id', (req, res) => {
  db.get("SELECT * FROM letter_logs WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

app.post('/api/letters', (req, res) => {
  const { id, title, internal_ref, topic, external_ref, status, label, label_color, notes, attachment_url, created_by, created_by_id, created_at, updated_at } = req.body;
  db.run(`INSERT OR REPLACE INTO letter_logs 
    (id, title, internal_ref, topic, external_ref, status, label, label_color, notes, attachment_url, created_by, created_by_id, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [id, title, internal_ref, topic, external_ref, status, label, label_color, notes, attachment_url, created_by, created_by_id, created_at, updated_at], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/letters/:id', (req, res) => {
  db.run("DELETE FROM letter_logs WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- LETTER LOG NOTES API ---
app.get('/api/letters/:id/notes', (req, res) => {
  db.all("SELECT * FROM letter_log_notes WHERE letter_id = ? ORDER BY created_at ASC", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/letters/:id/notes', (req, res) => {
  const { id, letter_id, note, created_by, created_by_id, created_at } = req.body;
  db.run("INSERT INTO letter_log_notes (id, letter_id, note, created_by, created_by_id, created_at) VALUES (?, ?, ?, ?, ?, ?)", 
    [id, letter_id, note, created_by, created_by_id, created_at], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Logs
app.get('/api/logs', (req, res) => {
  db.all("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 500", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/logs', (req, res) => {
  const { id, action, user, timestamp, details } = req.body;
  db.run("INSERT INTO logs (id, action, user, timestamp, details) VALUES (?, ?, ?, ?, ?)", 
    [id, action, user, timestamp, details], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// User API Updates
app.post('/api/users/:id/password', (req, res) => {
  db.run("UPDATE users SET password = ? WHERE id = ?", [req.body.password, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/users/:id/apikey', (req, res) => {
  db.run("UPDATE users SET apiKey = ? WHERE id = ?", [req.body.apiKey, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (e, row) => res.json(row));
  });
});

app.post('/api/users/:id/role', (req, res) => {
  db.run("UPDATE users SET role = ? WHERE id = ?", [req.body.role, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Frontend
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
