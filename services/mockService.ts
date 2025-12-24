
import { Report, AuditLog, UserProfile, Bulletin } from '../types';

const API_URL = '/api';

export const MockService = {
  // --- Auth ---
  validateUser: async (emailOrId: string, password: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrId, password })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error("Login Error", e);
      return null;
    }
  },

  // --- Bulletin ---
  getBulletin: async (): Promise<Bulletin | null> => {
    try {
      const res = await fetch(`${API_URL}/bulletin`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) { return null; }
  },

  updateBulletin: async (content: string, authorName: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/bulletin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, authorName })
      });
      return res.ok;
    } catch (e) { return false; }
  },

  // --- Reports ---
  getReports: async (): Promise<Report[]> => {
    try {
      const res = await fetch(`${API_URL}/reports`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getReportById: async (id: string): Promise<Report | undefined> => {
    try {
      const res = await fetch(`${API_URL}/reports/${id}`);
      if (!res.ok) return undefined;
      return await res.json();
    } catch (e) {
      return undefined;
    }
  },

  saveReport: async (report: Report): Promise<void> => {
    await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
    });
  },

  deleteReport: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/reports/${id}`, { method: 'DELETE' });
  },

  // --- Audit Logs ---
  getAuditLogs: async (): Promise<AuditLog[]> => {
    try {
      const res = await fetch(`${API_URL}/logs`);
      return await res.json();
    } catch (e) { return []; }
  },

  addAuditLog: async (log: AuditLog): Promise<void> => {
    await fetch(`${API_URL}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
    });
  },

  // --- Users ---
  getUsers: async (): Promise<UserProfile[]> => {
    try {
      const res = await fetch(`${API_URL}/users`);
      return await res.json();
    } catch (e) { return []; }
  },

  addUser: async (user: UserProfile): Promise<void> => {
    await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });
  },

  deleteUser: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
  },

  updatePassword: async (userId: string, newPass: string): Promise<void> => {
    await fetch(`${API_URL}/users/${userId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPass })
    });
  },

  updateApiKey: async (userId: string, apiKey: string): Promise<UserProfile | null> => {
    const res = await fetch(`${API_URL}/users/${userId}/apikey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
    });
    if (!res.ok) return null;
    return await res.json();
  }
};
