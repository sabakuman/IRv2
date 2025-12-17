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

// Default Data (Same as constants.ts)
const DEFAULT_REPORT = {
    id: 'r-101',
    userId: 'u-1',
    title: 'Bilateral Meeting Prep: India',
    status: 'completed',
    updatedAt: '2023-10-24T10:00:00Z',
    data: {
      reportDate: '2023-11-15',
      country: 'India',
      capital: 'New Delhi',
      officialLanguage: 'Hindi, English',
      population: '1.4B',
      currency: 'Indian Rupee (INR)',
      gdp: '3.5 Trillion USD',
      hdi: '0.633',
      directFlight: true,
      uaeEmbassyLocation: 'New Delhi',
      foreignEmbassyLocation: 'Abu Dhabi',
      workforceMinistry: 'Ministry of Skill Development',
      uaeWorkforceStats: {
        mohre: {
          totalPrivate: { value: '3,200,000', date: 'Sept 2023' },
          totalDomestic: { value: '800,000', date: 'Sept 2023' },
          byEmirate: [
             { name: 'Abu Dhabi', value: 1200000 },
             { name: 'Dubai', value: 1800000 },
             { name: 'Sharjah', value: 500000 },
             { name: 'Ajman', value: 200000 },
             { name: 'Umm Al Quwain', value: 50000 },
             { name: 'Ras Al Khaimah', value: 150000 },
             { name: 'Fujairah', value: 100000 },
          ],
          bySector: []
        },
        icp: {
          byEmirate: [],
          bySector: []
        },
        custom: []
      },
      workforceStats: {
        totalWorkforce: '580 Million',
        participationMale: 76,
        participationFemale: 24,
        migrationDestinations: [],
        topSectors: [],
        availableSkills: []
      },
      economicStats: {
        inflation: '5.5%',
        totalExportsToUAE: '30 Billion USD',
        totalImportsFromUAE: '50 Billion USD',
        topExportProducts: [],
        topImportProducts: [],
        mainEconomicPartners: [],
        customStats: []
      },
      educationStats: {
        topUniversities: [],
        primaryEnrollment: '99%',
        higherEducationEnrollment: '27%'
      },
      recentInteractions: [],
      pointsOfDiscussion: [],
      relatedNews: [],
      customSections: [],
      bilateralAgreements: [],
      delegations: { uae: [], partner: [] }
    }
};

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

    // Seed Defaults if empty
    db.get("SELECT count(*) as count FROM users", (err, row) => {
      if (row && row.count === 0) {
        console.log("Seeding default admin...");
        const stmt = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)");
        stmt.run(DEFAULT_ADMIN.id, DEFAULT_ADMIN.email, DEFAULT_ADMIN.fullName, DEFAULT_ADMIN.role, DEFAULT_ADMIN.password, DEFAULT_ADMIN.avatarUrl, DEFAULT_ADMIN.apiKey);
        stmt.finalize();
      }
    });

    db.get("SELECT count(*) as count FROM reports", (err, row) => {
      if (row && row.count === 0) {
        console.log("Seeding default report...");
        const stmt = db.prepare("INSERT INTO reports VALUES (?, ?, ?, ?, ?, ?)");
        stmt.run(DEFAULT_REPORT.id, DEFAULT_REPORT.userId, DEFAULT_REPORT.title, DEFAULT_REPORT.status, DEFAULT_REPORT.updatedAt, JSON.stringify(DEFAULT_REPORT.data));
        stmt.finalize();
      }
    });
  });
}

// --- API ENDPOINTS ---

// 1. Users
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  // Allow login by email OR username (simple logic)
  db.get("SELECT * FROM users WHERE (email = ? OR id = ?) AND password = ?", [email, email, password], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

app.get('/api/users', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { id, email, fullName, role, password, avatarUrl, apiKey } = req.body;
  
  db.get("SELECT id FROM users WHERE email = ?", [email], (err, row) => {
     if (row) return res.status(400).json({ error: "User already exists" });

     const stmt = db.prepare("INSERT INTO users (id, email, fullName, role, password, avatarUrl, apiKey) VALUES (?, ?, ?, ?, ?, ?, ?)");
     stmt.run(id, email, fullName, role, password, avatarUrl, apiKey || '', (err) => {
       if (err) return res.status(500).json({ error: err.message });
       res.json({ success: true });
     });
     stmt.finalize();
  });
});

app.delete('/api/users/:id', (req, res) => {
  if (req.params.id === 'u-admin') return res.status(403).send("Cannot delete admin");
  db.run("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/users/:id/password', (req, res) => {
  db.run("UPDATE users SET password = ? WHERE id = ?", [req.body.password, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).send("User not found");
    res.json({ success: true });
  });
});

app.post('/api/users/:id/apikey', (req, res) => {
  db.run("UPDATE users SET apiKey = ? WHERE id = ?", [req.body.apiKey, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // Return updated user object
    db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
       res.json(row);
    });
  });
});

// 2. Reports
app.get('/api/reports', (req, res) => {
  db.all("SELECT * FROM reports ORDER BY updatedAt DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Parse the 'data' JSON string back to an object
    const reports = rows.map(r => {
      try {
        return { ...r, data: JSON.parse(r.data) };
      } catch (e) {
        return { ...r, data: {} };
      }
    });
    res.json(reports);
  });
});

app.get('/api/reports/:id', (req, res) => {
  db.get("SELECT * FROM reports WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).send("Report not found");
    
    try {
      row.data = JSON.parse(row.data);
    } catch (e) { row.data = {}; }
    
    res.json(row);
  });
});

app.post('/api/reports', (req, res) => {
  const { id, userId, title, status, updatedAt, data } = req.body;
  const dataStr = JSON.stringify(data);
  
  // INSERT OR REPLACE handles both creation and updates if ID exists
  const stmt = db.prepare("INSERT OR REPLACE INTO reports (id, userId, title, status, updatedAt, data) VALUES (?, ?, ?, ?, ?, ?)");
  stmt.run(id, userId, title, status, updatedAt, dataStr, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
  stmt.finalize();
});

app.delete('/api/reports/:id', (req, res) => {
  db.run("DELETE FROM reports WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// 3. Logs
app.get('/api/logs', (req, res) => {
  db.all("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 500", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/logs', (req, res) => {
  const { id, action, user, timestamp, details } = req.body;
  const stmt = db.prepare("INSERT INTO logs (id, action, user, timestamp, details) VALUES (?, ?, ?, ?, ?)");
  stmt.run(id, action, user, timestamp, details, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
  stmt.finalize();
});


// --- SERVE FRONTEND ---
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Database: ${DB_FILE}`);
});