
import { Report, AuditLog, UserProfile, LetterLog, LetterLogNote } from '../types';

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
    } catch (e) { return null; }
  },

  // --- Reports ---
  getReports: async (): Promise<Report[]> => {
    const res = await fetch(`${API_URL}/reports`);
    return res.ok ? await res.json() : [];
  },

  getReportById: async (id: string): Promise<Report | undefined> => {
    const res = await fetch(`${API_URL}/reports/${id}`);
    return res.ok ? await res.json() : undefined;
  },

  saveReport: async (report: Report): Promise<void> => {
    await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
    });
  },

  deleteReport: async (id: string, role: string): Promise<void> => {
    await fetch(`${API_URL}/reports/${id}`, { 
      method: 'DELETE',
      headers: { 'X-User-Role': role }
    });
  },

  // --- Letter Logs ---
  getLetters: async (): Promise<LetterLog[]> => {
    const res = await fetch(`${API_URL}/letters`);
    return res.ok ? await res.json() : [];
  },

  getLetterById: async (id: string): Promise<LetterLog | undefined> => {
    const res = await fetch(`${API_URL}/letters/${id}`);
    return res.ok ? await res.json() : undefined;
  },

  saveLetter: async (letter: LetterLog): Promise<void> => {
    await fetch(`${API_URL}/letters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(letter)
    });
  },

  deleteLetter: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/letters/${id}`, { method: 'DELETE' });
  },

  getLetterNotes: async (letterId: string): Promise<LetterLogNote[]> => {
    const res = await fetch(`${API_URL}/letters/${letterId}/notes`);
    return res.ok ? await res.json() : [];
  },

  addLetterNote: async (note: LetterLogNote): Promise<void> => {
    await fetch(`${API_URL}/letters/${note.letter_id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
    });
  },

  // --- Audit Logs ---
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await fetch(`${API_URL}/logs`);
    return res.ok ? await res.json() : [];
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
    const res = await fetch(`${API_URL}/users`);
    return res.ok ? await res.json() : [];
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
    return res.ok ? await res.json() : null;
  },

  updateUserRole: async (userId: string, role: string): Promise<void> => {
    await fetch(`${API_URL}/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
    });
  },

  // --- Announcements ---
  getAnnouncement: async (): Promise<any> => {
    const res = await fetch(`${API_URL}/announcement`);
    return res.ok ? await res.json() : {};
  },

  updateAnnouncement: async (data: any): Promise<void> => {
    await fetch(`${API_URL}/announcement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
};