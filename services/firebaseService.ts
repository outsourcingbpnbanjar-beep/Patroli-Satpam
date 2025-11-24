import { UserProfile, PatrolLog, Location } from "../types";
import { ADMIN_CREDENTIALS, MOCK_LOCATIONS } from "../constants";

// This service mimics Firebase but uses LocalStorage to avoid Billing Errors.
// It effectively makes the app "Offline First" and "Local Only".

// --- KEYS ---
const KEY_USERS = 'sp_users';
const KEY_LOGS = 'sp_patrol_logs';
const KEY_LOCATIONS = 'sp_locations';
const KEY_SESSION = 'sp_session';

// --- AUTH MOCK ---

export const mapFirebaseUserToProfile = async (firebaseUser: any): Promise<UserProfile> => {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    avatarUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'U')}&background=0f172a&color=fff`,
    role: 'user',
    status: 'active'
  };
};

export const logoutUser = async () => {
  localStorage.removeItem(KEY_SESSION);
  window.dispatchEvent(new Event('auth-change'));
};

export const loginLocal = async (email: string, password: string): Promise<UserProfile> => {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 800));

  // Admin Check (Always Active)
  if (email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() && password === ADMIN_CREDENTIALS.password) {
    const adminUser: UserProfile = {
      id: 'admin-001',
      name: 'Administrator',
      email: email,
      avatarUrl: `https://ui-avatars.com/api/?name=Admin&background=0f172a&color=fff`,
      role: 'admin',
      status: 'active',
      badgeNumber: 'ADM-001'
    };
    localStorage.setItem(KEY_SESSION, JSON.stringify(adminUser));
    return adminUser;
  }

  // Check Local Users
  const users = getLocalUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  // STRICT MODE: User must be registered manually
  if (!user) {
    throw new Error('auth/user-not-found');
  }

  // Password Check
  if (user.password && user.password !== password) {
    throw new Error('auth/wrong-password');
  }

  // If status is pending, reject login (but technically auth is valid, app handles the UI block)
  
  localStorage.setItem(KEY_SESSION, JSON.stringify(user));
  return user;
};

export const registerLocal = async (email: string, password: string, name: string, badge: string): Promise<UserProfile> => {
  await new Promise(r => setTimeout(r, 800));
  
  const users = getLocalUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('auth/email-already-in-use');
  }

  const newUser: UserProfile = {
    id: Date.now().toString(),
    email,
    name,
    badgeNumber: badge,
    role: 'user',
    status: 'pending', // REQUIRE ADMIN APPROVAL
    password: password, 
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f172a&color=fff`
  };

  users.push(newUser);
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
  
  // We do NOT auto login for register in strict mode, but for the flow to work we return user
  // The UI will likely tell them to wait.
  
  // Trigger update
  window.dispatchEvent(new Event('users-change'));
  
  return newUser;
};

// --- ADMIN USER MANAGEMENT ---

export const addUserLocal = async (userData: Partial<UserProfile> & { password?: string }): Promise<void> => {
  const users = getLocalUsers();
  if (users.find(u => u.email.toLowerCase() === (userData.email || '').toLowerCase())) {
    throw new Error('Email sudah digunakan user lain.');
  }

  const newUser: UserProfile = {
    id: Date.now().toString(),
    email: userData.email || '',
    name: userData.name || '',
    badgeNumber: userData.badgeNumber || '',
    role: userData.role || 'user',
    status: userData.status || 'active',
    password: userData.password || '123456', // Default password if manually added
    avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'U')}&background=0f172a&color=fff`
  };

  users.push(newUser);
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
  window.dispatchEvent(new Event('users-change'));
};

export const updateUserLocal = async (userData: UserProfile): Promise<void> => {
  const users = getLocalUsers();
  const index = users.findIndex(u => u.id === userData.id);
  
  if (index === -1) throw new Error("User tidak ditemukan");

  // Preserve password if not passed in userData (usually UserProfile interface has optional password)
  const existingPassword = users[index].password;

  users[index] = {
    ...users[index],
    ...userData,
    password: userData.password || existingPassword 
  };

  localStorage.setItem(KEY_USERS, JSON.stringify(users));
  
  // If current session is this user, update session
  const currentSession = getSession();
  if (currentSession && currentSession.id === userData.id) {
    localStorage.setItem(KEY_SESSION, JSON.stringify(users[index]));
  }

  window.dispatchEvent(new Event('users-change'));
};

export const deleteUserLocal = async (userId: string): Promise<void> => {
  let users = getLocalUsers();
  users = users.filter(u => u.id !== userId);
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
  window.dispatchEvent(new Event('users-change'));
};

export const resetPasswordLocal = async (userId: string, newPass: string): Promise<void> => {
  const users = getLocalUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index].password = newPass;
    localStorage.setItem(KEY_USERS, JSON.stringify(users));
    
    // Also update session if it's the current user
    const session = getSession();
    if (session && session.id === userId) {
        session.password = newPass;
        localStorage.setItem(KEY_SESSION, JSON.stringify(session));
    }
    
    window.dispatchEvent(new Event('users-change'));
  }
};

export const getSession = (): UserProfile | null => {
  const sess = localStorage.getItem(KEY_SESSION);
  return sess ? JSON.parse(sess) : null;
};

// --- DATA ---

const getLocalUsers = (): UserProfile[] => {
  const data = localStorage.getItem(KEY_USERS);
  return data ? JSON.parse(data) : [];
};

export const syncUserProfile = async (user: UserProfile) => {
  const users = getLocalUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = { ...users[index], ...user };
  } else {
    users.push(user);
  }
  localStorage.setItem(KEY_USERS, JSON.stringify(users));
  localStorage.setItem(KEY_SESSION, JSON.stringify(user)); // Update session too
  window.dispatchEvent(new Event('users-change'));
};

export const subscribeToUsers = (callback: (users: UserProfile[]) => void) => {
  const handler = () => {
    callback(getLocalUsers());
  };
  window.addEventListener('users-change', handler);
  // Initial call
  handler();
  return () => window.removeEventListener('users-change', handler);
};

export const updateUserStatus = async (userId: string, status: 'active' | 'pending') => {
  const users = getLocalUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.status = status;
    localStorage.setItem(KEY_USERS, JSON.stringify(users));
    window.dispatchEvent(new Event('users-change'));
  }
};

// --- LOCATIONS ---

const getLocalLocations = (): Location[] => {
  const data = localStorage.getItem(KEY_LOCATIONS);
  return data ? JSON.parse(data) : MOCK_LOCATIONS;
};

export const subscribeToLocations = (callback: (locs: Location[]) => void) => {
  const handler = () => {
    callback(getLocalLocations());
  };
  window.addEventListener('locations-change', handler);
  handler();
  return () => window.removeEventListener('locations-change', handler);
};

export const addLocationToDb = async (location: Location) => {
  const locs = getLocalLocations();
  const newLoc = { ...location, id: Date.now().toString() };
  locs.push(newLoc);
  localStorage.setItem(KEY_LOCATIONS, JSON.stringify(locs));
  window.dispatchEvent(new Event('locations-change'));
};

export const deleteLocationFromDb = async (locId: string) => {
  const locs = getLocalLocations();
  const filtered = locs.filter(l => l.id !== locId);
  localStorage.setItem(KEY_LOCATIONS, JSON.stringify(filtered));
  window.dispatchEvent(new Event('locations-change'));
};

// --- PATROL LOGS ---

const getLocalLogs = (): PatrolLog[] => {
  const data = localStorage.getItem(KEY_LOGS);
  return data ? JSON.parse(data) : [];
};

export const subscribeToPatrolLogs = (callback: (logs: PatrolLog[]) => void) => {
  const handler = () => {
    const logs = getLocalLogs();
    // Sort desc
    logs.sort((a, b) => b.timestamp - a.timestamp);
    callback(logs);
  };
  window.addEventListener('logs-change', handler);
  handler();
  return () => window.removeEventListener('logs-change', handler);
};

export const savePatrolLog = async (log: PatrolLog) => {
  const logs = getLocalLogs();
  logs.push(log);
  // Limit to last 50 logs to prevent LocalStorage full
  if (logs.length > 50) {
    logs.shift(); // Remove oldest
  }
  localStorage.setItem(KEY_LOGS, JSON.stringify(logs));
  window.dispatchEvent(new Event('logs-change'));
};

// --- STORAGE MOCK ---

export const uploadPatrolImage = async (base64Image: string, userId: string): Promise<string> => {
  // In a local-only app, we just return the base64 string.
  // Ideally, we would compress this heavily or use IndexedDB, but for a demo, this works.
  // We simulate an async upload.
  await new Promise(r => setTimeout(r, 500));
  return base64Image;
};