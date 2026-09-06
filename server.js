
import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { initializeMOUDatabase } from './server/mou_init.js';
import { createMOURoutes } from './server/routes/mou.js';
import { seedInitialReport } from './server/seedReport.js';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// SQLite requires CommonJS import style in some environments
const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
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
    initializeMOUDatabase(db);
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

    seedInitialReport(db);
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

// AI Generation Proxy Route
app.post('/api/ai/generate', async (req, res) => {
  let { prompt, model, config } = req.body;
  const userApiKey = req.headers['x-user-apikey'];

  // Fallback chain for API Key: 
  // 1. Header 'x-user-apikey'
  // 2. Server Environment variables
  const apiKey = (userApiKey && userApiKey.trim() !== '') 
    ? userApiKey 
    : (process.env.GEMINI_API_KEY || process.env.API_KEY);

  if (!apiKey) {
    return res.status(400).json({ 
      error: 'No Gemini API Key is configured. Please provide your Gemini API key in the Settings > Secrets panel (add GEMINI_API_KEY) to enable bilateral intelligence reporting.' 
    });
  }

  // Rewrite model to standard gemini-3.5-flash for maximum compatibility
  if (!model || model.includes('preview') || model.includes('2.5') || model.includes('1.5') || model.includes('flash')) {
    model = 'gemini-3.5-flash';
  }

  try {
    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log(`[AI PROXY] Requesting model "${model}"`);
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config
    });

    if (response) {
      res.json({
        text: response.text,
        candidates: response.candidates || []
      });
    } else {
      res.status(500).json({ error: 'Did not receive a completion response from Gemini.' });
    }
  } catch (error) {
    console.error('[AI PROXY ERROR]:', error);
    
    // Check if it is a common invalid API key error
    const isInvalidKey = error.message?.includes('API_KEY_INVALID') || 
                         error.message?.includes('API key not valid') || 
                         error.toString().includes('API key not valid') ||
                         error.toString().includes('API_KEY_INVALID');
                         
    if (isInvalidKey) {
      res.status(400).json({
        error: 'Your Gemini API Key is invalid or expired. Please configure a valid GEMINI_API_KEY in the Settings > Secrets panel (top right) or add it to your .env file.',
        details: error.toString()
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Error occurred during generation.',
        details: error.toString()
      });
    }
  }
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
  db.all("SELECT * FROM users", [], (err, rows) => {
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

// DEBUG: Catch-all logger for /api/mou requests
app.all('/api/mou/*', (req, res, next) => {
  console.log(`[DEBUG SERVER] Incoming ${req.method} request to: ${req.url}`);
  next();
});

// Explicitly define these routes in main server.js to bypass any router issues
app.get('/api/proxy-flag', async (req, res) => {
  const { country, fullText } = req.query;
  console.log(`[PROXY FLAG] country="${country}", fullText="${fullText}"`);
  if (!country || typeof country !== 'string' || country.trim() === '') {
    return res.status(400).json({ error: 'Country parameter is required' });
  }

  try {
    const cleanCountry = country.trim();
    const url = fullText === 'true'
      ? `https://restcountries.com/v3.1/name/${encodeURIComponent(cleanCountry)}?fullText=true`
      : `https://restcountries.com/v3.1/name/${encodeURIComponent(cleanCountry)}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[PROXY FLAG] Primary fetch failed with status: ${response.status}. Trying fuzzy name search.`);
      const retryUrl = `https://restcountries.com/v3.1/name/${encodeURIComponent(cleanCountry)}`;
      const retryResponse = await fetch(retryUrl);
      if (!retryResponse.ok) {
        console.error(`[PROXY FLAG] Retry fetch failed with status: ${retryResponse.status}`);
        return res.status(200).json([]); // Return empty array gracefully instead of 400 or 500
      }
      const data = await retryResponse.json();
      return res.json(data);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(`[PROXY FLAG] Error fetching flag country="${country}":`, error.message);
    res.json([]); // return empty gracefully
  }
});

app.get('/api/debug-mou-ids', (req, res) => {
  const tables = ['mous', 'mou_updates', 'mou_actions', 'mou_attachments'];
  const results = {};
  let completed = 0;
  tables.forEach(table => {
    db.all(`SELECT id FROM ${table}`, [], (err, rows) => {
      results[table] = rows ? rows.map(r => r.id) : [];
      completed++;
      if (completed === tables.length) res.json(results);
    });
  });
});

app.post('/api/mou-delete-robust', (req, res) => {
  const { type, itemId } = req.body;
  console.log(`[ROBUST DELETE] REQUEST RECEIVED: type="${type}", id="${itemId}"`);
  console.log(`[ROBUST DELETE] Body received:`, req.body);
  
  const tableMap = {
    'updates': 'mou_updates',
    'actions': 'mou_actions',
    'attachments': 'mou_attachments'
  };
  
  const table = tableMap[type];
  if (!table) {
    console.error(`[ROBUST DELETE] INVALID TYPE: ${type}`);
    return res.status(400).json({ error: `Invalid type: ${type}` });
  }

  if (!itemId) {
    console.error(`[ROBUST DELETE] MISSING ITEM ID`);
    return res.status(400).json({ error: 'Missing itemId' });
  }

  // Use serialize to ensure operations run in order
  db.serialize(() => {
    console.log(`[ROBUST DELETE] Checking existence in ${table} for ${itemId}`);
    db.get(`SELECT id FROM ${table} WHERE id = ?`, [itemId], (err, row) => {
      if (err) {
        console.error(`[ROBUST DELETE] SELECT ERROR:`, err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        console.warn(`[ROBUST DELETE] NOT FOUND in ${table}: ${itemId}`);
        return res.status(404).json({ error: `Item ${itemId} not found in ${table}` });
      }

      if (type === 'updates') {
        console.log(`[ROBUST DELETE] Nullifying associated actions for update ${itemId}`);
        db.run(`UPDATE mou_actions SET update_id = NULL WHERE update_id = ?`, [itemId]);
      }

      console.log(`[ROBUST DELETE] Executing DELETE FROM ${table} WHERE id = ?`);
      db.run(`DELETE FROM ${table} WHERE id = ?`, [itemId], function(err) {
        if (err) {
          console.error(`[ROBUST DELETE] DELETE ERROR:`, err.message);
          return res.status(500).json({ error: err.message });
        }
        console.log(`[ROBUST DELETE] SUCCESS: Deleted ${itemId} from ${table}. Changes: ${this.changes}`);
        res.json({ success: true, changes: this.changes });
      });
    });
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
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Permission denied. Only admins can delete reports.' });
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

// MOU Tracker Module
app.use('/api/mou', createMOURoutes(db));

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
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

startServer();
