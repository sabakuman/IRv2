import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

// Setup paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4173; // Using the same port you used before for convenience
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// --- DATABASE INITIALIZATION ---
// Default Data matching constants.ts
const DEFAULT_DATA = {
  reports: [
    {
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
    }
  ],
  users: [
    {
      id: 'u-admin',
      fullName: 'System Administrator',
      email: 'admin', 
      role: 'admin',
      password: 'admin', 
      avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'
    }
  ],
  logs: []
};

// Initialize DB if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  console.log('Database initialized.');
}

// Helper to read/write
const readDb = () => {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return DEFAULT_DATA;
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- API ENDPOINTS ---

// 1. Auth / Users
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find(u => (u.email === email || u.email.split('@')[0] === email) && u.password === password);
  
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/users', (req, res) => {
  const db = readDb();
  res.json(db.users);
});

app.post('/api/users', (req, res) => {
  const db = readDb();
  const newUser = req.body;
  // Basic dupe check
  if (db.users.find(u => u.email === newUser.email)) {
      return res.status(400).json({error: "User already exists"});
  }
  db.users.push(newUser);
  writeDb(db);
  res.json({ success: true });
});

app.delete('/api/users/:id', (req, res) => {
  const db = readDb();
  if (req.params.id === 'u-admin') return res.status(403).send("Cannot delete admin");
  db.users = db.users.filter(u => u.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

app.post('/api/users/:id/password', (req, res) => {
    const db = readDb();
    const idx = db.users.findIndex(u => u.id === req.params.id);
    if (idx >= 0) {
        db.users[idx].password = req.body.password;
        writeDb(db);
        res.json({ success: true });
    } else {
        res.status(404).send("User not found");
    }
});

app.post('/api/users/:id/apikey', (req, res) => {
    const db = readDb();
    const idx = db.users.findIndex(u => u.id === req.params.id);
    if (idx >= 0) {
        db.users[idx].apiKey = req.body.apiKey;
        writeDb(db);
        res.json(db.users[idx]);
    } else {
        res.status(404).send("User not found");
    }
});

// 2. Reports
app.get('/api/reports', (req, res) => {
  const db = readDb();
  // Return sorted
  const reports = db.reports.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(reports);
});

app.get('/api/reports/:id', (req, res) => {
  const db = readDb();
  const report = db.reports.find(r => r.id === req.params.id);
  if (report) res.json(report);
  else res.status(404).send("Report not found");
});

app.post('/api/reports', (req, res) => {
  const db = readDb();
  const report = req.body;
  const index = db.reports.findIndex(r => r.id === report.id);
  
  if (index >= 0) {
    db.reports[index] = report;
  } else {
    db.reports.push(report);
  }
  writeDb(db);
  res.json({ success: true });
});

app.delete('/api/reports/:id', (req, res) => {
  const db = readDb();
  db.reports = db.reports.filter(r => r.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

// 3. Logs
app.get('/api/logs', (req, res) => {
  const db = readDb();
  res.json(db.logs);
});

app.post('/api/logs', (req, res) => {
  const db = readDb();
  db.logs.unshift(req.body);
  // Keep logs manageable
  if (db.logs.length > 500) db.logs = db.logs.slice(0, 500);
  writeDb(db);
  res.json({ success: true });
});


// --- SERVE FRONTEND ---
// Serve static files from 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing, return all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Database File: ${DB_FILE}`);
});