import { Report, AuditLog, UserProfile } from '../types';
import { MOCK_REPORTS, MOCK_AUDIT_LOGS } from '../constants';

const STORAGE_KEYS = {
  REPORTS: 'uae_lmi_reports',
  LOGS: 'uae_lmi_logs',
  USERS: 'uae_lmi_users',
  INIT: 'uae_lmi_initialized_v4' // Bumped to v4 to FORCE RESET
};

// --- Low Level Helpers ---
const getStorage = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error('LocalStorage Read Error', e);
    return null;
  }
};

const setStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage Write Error', e);
  }
};

// --- Initialization Logic ---
const initializeStorage = () => {
  // Check if this specific version has been initialized
  const isInitialized = localStorage.getItem(STORAGE_KEYS.INIT);

  if (!isInitialized) {
    console.warn("System Reset: Initializing Default Data (Admin Reset)");

    // 1. Reset Reports
    setStorage(STORAGE_KEYS.REPORTS, MOCK_REPORTS);

    // 2. Reset Logs
    setStorage(STORAGE_KEYS.LOGS, MOCK_AUDIT_LOGS);

    // 3. Reset Users - STRICT SINGLE ADMIN
    const defaultAdmin: UserProfile = {
      id: 'u-admin',
      fullName: 'System Administrator',
      email: 'admin', 
      role: 'admin',
      password: 'admin', 
      avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'
    };
    setStorage(STORAGE_KEYS.USERS, [defaultAdmin]);

    // Mark as initialized
    localStorage.setItem(STORAGE_KEYS.INIT, 'true');
    
    // Clear previous version keys if any to avoid confusion (optional cleanup)
    localStorage.removeItem('uae_lmi_initialized_v3');
    localStorage.removeItem('uae_lmi_initialized_v2');
  }
};

// Run immediately
initializeStorage();

export const MockService = {
  // --- Reports ---
  getReports: async (): Promise<Report[]> => {
    const reports = getStorage<Report[]>(STORAGE_KEYS.REPORTS) || [];
    return reports.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getReportById: async (id: string): Promise<Report | undefined> => {
    const reports = getStorage<Report[]>(STORAGE_KEYS.REPORTS) || [];
    return reports.find(r => r.id === id);
  },

  saveReport: async (report: Report): Promise<void> => {
    const reports = getStorage<Report[]>(STORAGE_KEYS.REPORTS) || [];
    const index = reports.findIndex(r => r.id === report.id);
    
    if (index >= 0) {
      reports[index] = report;
    } else {
      reports.push(report);
    }
    
    setStorage(STORAGE_KEYS.REPORTS, reports);
  },

  deleteReport: async (id: string): Promise<void> => {
    const reports = getStorage<Report[]>(STORAGE_KEYS.REPORTS) || [];
    const filtered = reports.filter(r => r.id !== id);
    setStorage(STORAGE_KEYS.REPORTS, filtered);
  },

  // --- Audit Logs ---
  getAuditLogs: async (): Promise<AuditLog[]> => {
    return getStorage<AuditLog[]>(STORAGE_KEYS.LOGS) || [];
  },

  addAuditLog: async (log: AuditLog): Promise<void> => {
    const logs = getStorage<AuditLog[]>(STORAGE_KEYS.LOGS) || [];
    logs.unshift(log);
    setStorage(STORAGE_KEYS.LOGS, logs);
  },

  // --- Users ---
  getUsers: async (): Promise<UserProfile[]> => {
    return getStorage<UserProfile[]>(STORAGE_KEYS.USERS) || [];
  },

  addUser: async (user: UserProfile): Promise<void> => {
    const users = getStorage<UserProfile[]>(STORAGE_KEYS.USERS) || [];
    users.push(user);
    setStorage(STORAGE_KEYS.USERS, users);
  },

  deleteUser: async (id: string): Promise<void> => {
    const users = getStorage<UserProfile[]>(STORAGE_KEYS.USERS) || [];
    
    // Safety check: Prevent deleting the root admin
    if (id === 'u-admin') {
      throw new Error("Cannot delete the root admin.");
    }

    const filtered = users.filter(u => u.id !== id);
    setStorage(STORAGE_KEYS.USERS, filtered);
  },

  updatePassword: async (userId: string, newPass: string): Promise<void> => {
    const users = getStorage<UserProfile[]>(STORAGE_KEYS.USERS) || [];
    const index = users.findIndex(u => u.id === userId);
    
    if (index !== -1) {
      users[index].password = newPass;
      setStorage(STORAGE_KEYS.USERS, users);
    }
  }
};