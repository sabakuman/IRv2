
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

export function createMOURoutes(db) {
  const router = express.Router();

  // --- Specific routes first ---
  
  router.get('/updates/all', (req, res) => {
    db.all("SELECT u.*, m.title_ar as mou_title_ar, m.title_en as mou_title_en FROM mou_updates u JOIN mous m ON u.mou_id = m.id ORDER BY u.date DESC, u.created_at DESC", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  router.get('/actions/all', (req, res) => {
    db.all("SELECT a.*, m.title_ar as mou_title_ar, m.title_en as mou_title_en FROM mou_actions a JOIN mous m ON a.mou_id = m.id ORDER BY a.due_date ASC", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const actions = rows.map(r => ({ ...r, points: r.points ? JSON.parse(r.points) : [] }));
      res.json(actions);
    });
  });

  const addAuditLog = (mouId, actionType, changedBy, details) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    db.run(`INSERT INTO mou_audit_log (id, mou_id, action_type, changed_by, change_details, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, mouId, actionType, changedBy, details, now]);
  };

  router.put('/updates/:updateId', (req, res) => {
    const { title_ar, title_en, description_ar, description_en, update_type, date, created_by } = req.body;
    db.run(`UPDATE mou_updates SET title_ar = ?, title_en = ?, description_ar = ?, description_en = ?, update_type = ?, date = ? WHERE id = ?`,
    [title_ar, title_en, description_ar, description_en, update_type, date, req.params.updateId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Add audit log
      db.get("SELECT mou_id FROM mou_updates WHERE id = ?", [req.params.updateId], (err, row) => {
        if (row) {
          addAuditLog(row.mou_id, 'EDIT_INTERACTION', created_by || 'System', `Edited interaction: ${title_en}`);
        }
      });

      res.json({ success: true });
    });
  });

  router.put('/actions/:actionId/toggle', (req, res) => {
    db.run("UPDATE mou_actions SET status = CASE WHEN status = 'closed' THEN 'open' ELSE 'closed' END WHERE id = ?", [req.params.actionId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });


  // --- MOUs ---
  router.get('/', (req, res) => {
    db.all("SELECT * FROM mous ORDER BY updated_at DESC", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  router.get('/:id', (req, res) => {
    db.get("SELECT * FROM mous WHERE id = ?", [req.params.id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'MOU not found' });
      res.json(row);
    });
  });

  router.post('/', (req, res) => {
    const { 
      id = uuidv4(), title_ar, title_en, country_name_ar, country_name_en, 
      organization_name_ar, organization_name_en, flag_url, type, 
      type_other_text, signed_date, expiry_date, status, notes, created_by 
    } = req.body;
    
    const now = new Date().toISOString();

    db.run(`INSERT INTO mous (
      id, title_ar, title_en, country_name_ar, country_name_en, 
      organization_name_ar, organization_name_en, flag_url, type, 
      type_other_text, signed_date, expiry_date, status, notes, 
      created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [
      id, title_ar, title_en, country_name_ar, country_name_en, 
      organization_name_ar, organization_name_en, flag_url, type, 
      type_other_text, signed_date, expiry_date, status, notes, 
      created_by, now, now
    ], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id });
    });
  });

  router.put('/:id', (req, res) => {
    const { 
      title_ar, title_en, country_name_ar, country_name_en, 
      organization_name_ar, organization_name_en, flag_url, type, 
      type_other_text, signed_date, expiry_date, status, notes 
    } = req.body;
    
    const now = new Date().toISOString();

    db.run(`UPDATE mous SET 
      title_ar = ?, title_en = ?, country_name_ar = ?, country_name_en = ?, 
      organization_name_ar = ?, organization_name_en = ?, flag_url = ?, type = ?, 
      type_other_text = ?, signed_date = ?, expiry_date = ?, status = ?, notes = ?, 
      updated_at = ?
      WHERE id = ?`, 
    [
      title_ar, title_en, country_name_ar, country_name_en, 
      organization_name_ar, organization_name_en, flag_url, type, 
      type_other_text, signed_date, expiry_date, status, notes, 
      now, req.params.id
    ], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });

  // --- Attachments ---
  router.get('/:id/attachments', (req, res) => {
    db.all("SELECT * FROM mou_attachments WHERE mou_id = ? ORDER BY uploaded_at DESC", [req.params.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  router.post('/:id/attachments', (req, res) => {
    const { id = uuidv4(), file_name, file_url, file_type, uploaded_by } = req.body;
    const now = new Date().toISOString();

    db.run(`INSERT INTO mou_attachments (id, mou_id, file_name, file_url, file_type, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, req.params.id, file_name, file_url, file_type, uploaded_by, now], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id });
    });
  });

  // --- Timeline Updates ---
  router.get('/:id/updates', (req, res) => {
    db.all("SELECT * FROM mou_updates WHERE mou_id = ? ORDER BY date DESC, created_at DESC", [req.params.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  router.post('/:id/updates', (req, res) => {
    const { 
      id = uuidv4(), title_ar, title_en, description_ar, description_en, 
      update_type, date, created_by 
    } = req.body;
    const now = new Date().toISOString();

    db.run(`INSERT INTO mou_updates (id, mou_id, title_ar, title_en, description_ar, description_en, update_type, date, created_at, created_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.params.id, title_ar, title_en, description_ar, description_en, update_type, date, now, created_by], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      addAuditLog(req.params.id, 'ADD_INTERACTION', created_by || 'System', `Added new interaction: ${title_en}`);

      res.json({ success: true, id });
    });
  });

  // --- Actions ---
  router.get('/:id/actions', (req, res) => {
    db.all("SELECT * FROM mou_actions WHERE mou_id = ? ORDER BY due_date ASC", [req.params.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const actions = rows.map(r => ({ ...r, points: r.points ? JSON.parse(r.points) : [] }));
      res.json(actions);
    });
  });

  router.post('/:id/actions', (req, res) => {
    console.log(`Adding action for MOU ${req.params.id}:`, req.body);
    const { id = uuidv4(), update_id, title, assigned_to, due_date, suggested_date, status, notes, points, close_date } = req.body;

    db.run(`INSERT INTO mou_actions (id, mou_id, update_id, title, assigned_to, due_date, suggested_date, status, notes, points, close_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.params.id, update_id, title, assigned_to, due_date, suggested_date, status || 'open', notes, points ? JSON.stringify(points) : null, close_date], function(err) {
      if (err) {
        console.error('Database error adding action:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id });
    });
  });

  router.put('/actions/:actionId', (req, res) => {
    console.log(`Updating action ${req.params.actionId}:`, req.body);
    const { title, due_date, suggested_date, status, notes, points, close_date } = req.body;
    db.run(`UPDATE mou_actions SET title = ?, due_date = ?, suggested_date = ?, status = ?, notes = ?, points = ?, close_date = ? WHERE id = ?`, 
    [title, due_date, suggested_date, status, notes, points ? JSON.stringify(points) : null, close_date, req.params.actionId], function(err) {
      if (err) {
        console.error('Database error updating action:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    });
  });

  // --- Audit Log ---
  router.get('/:id/audit', (req, res) => {
    db.all("SELECT * FROM mou_audit_log WHERE mou_id = ? ORDER BY timestamp DESC", [req.params.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });

  return router;
}
