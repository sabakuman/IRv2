
/**
 * MOU Tracker Database Initialization
 * This script creates new tables for the MOU Tracker module.
 * No existing tables are modified.
 */
export function initializeMOUDatabase(db) {
  db.serialize(() => {
    // 1. MOUs Table
    db.run(`CREATE TABLE IF NOT EXISTS mous (
      id TEXT PRIMARY KEY,
      title_ar TEXT NOT NULL,
      title_en TEXT NOT NULL,
      country_name_ar TEXT,
      country_name_en TEXT,
      organization_name_ar TEXT,
      organization_name_en TEXT,
      flag_url TEXT,
      type TEXT, -- labour / domestic / both / other
      type_other_text TEXT,
      signed_date TEXT,
      expiry_date TEXT,
      status TEXT DEFAULT 'draft', -- active / pending / expired / draft / under_discussion
      notes TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT
    )`, (err) => {
      if (!err) {
        // Migration: Ensure necessary columns exist if table was created before
        db.run("ALTER TABLE mous ADD COLUMN close_date TEXT", () => {});
        db.run("ALTER TABLE mous ADD COLUMN closure_notes TEXT", () => {});
      }
    });

    // 2. MOU Attachments
    db.run(`CREATE TABLE IF NOT EXISTS mou_attachments (
      id TEXT PRIMARY KEY,
      mou_id TEXT,
      file_name TEXT,
      file_url TEXT,
      file_type TEXT,
      uploaded_by TEXT,
      uploaded_at TEXT,
      FOREIGN KEY(mou_id) REFERENCES mous(id)
    )`);

    // 3. MOU Updates (Timeline)
    db.run(`CREATE TABLE IF NOT EXISTS mou_updates (
      id TEXT PRIMARY KEY,
      mou_id TEXT,
      title_ar TEXT,
      title_en TEXT,
      description_ar TEXT,
      description_en TEXT,
      update_type TEXT, -- JCM / meeting / technical / renewal / dispute / general
      date TEXT,
      created_by TEXT,
      created_at TEXT,
      FOREIGN KEY(mou_id) REFERENCES mous(id)
    )`);

    // 4. MOU Actions
    db.run(`CREATE TABLE IF NOT EXISTS mou_actions (
      id TEXT PRIMARY KEY,
      mou_id TEXT,
      update_id TEXT,
      title TEXT,
      assigned_to TEXT,
      due_date TEXT,
      suggested_date TEXT,
      status TEXT DEFAULT 'open', -- open / closed / pending
      notes TEXT,
      points TEXT,
      FOREIGN KEY(mou_id) REFERENCES mous(id),
      FOREIGN KEY(update_id) REFERENCES mou_updates(id)
    )`, (err) => {
      if (!err) {
        // Migration: Ensure necessary columns exist if table was created before
        db.run("ALTER TABLE mou_actions ADD COLUMN points TEXT", () => {});
        db.run("ALTER TABLE mou_actions ADD COLUMN suggested_date TEXT", () => {});
        db.run("ALTER TABLE mou_actions ADD COLUMN close_date TEXT", () => {});
      }
    });

    // 5. MOU Audit Log
    db.run(`CREATE TABLE IF NOT EXISTS mou_audit_log (
      id TEXT PRIMARY KEY,
      mou_id TEXT,
      action_type TEXT,
      changed_by TEXT,
      change_details TEXT,
      timestamp TEXT
    )`);

    console.log('MOU Tracker tables initialized successfully.');
  });
}
