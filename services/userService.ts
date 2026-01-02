
import { User, AuthResponse, UserPreferences } from '../types/models';
import { DEFAULT_WORK_CONFIG, DEFAULT_UI_CONFIG, VACATION_DATE_STR } from '../constants';

const DB_KEY = 'tiempont_db_users';
const SESSION_KEY = 'tiempont_active_session';

// --- MOCK DATABASE UTILS ---

const getDB = (): User[] => {
  const db = localStorage.getItem(DB_KEY);
  return db ? JSON.parse(db) : [];
};

const saveDB = (users: User[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
};

const createDefaultPreferences = (): UserPreferences => ({
  workConfig: { ...DEFAULT_WORK_CONFIG },
  uiConfig: { ...DEFAULT_UI_CONFIG },
  locationConfig: { type: 'gps', lat: -31.4201, lon: -64.1888, city: 'Córdoba' }, // Default fallback
  vacationDate: VACATION_DATE_STR,
  theme: 'system'
});

// --- SERVICE METHODS ---

export const userService = {
  // Check if a session exists on load
  getCurrentSession: (): User | null => {
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) return null;
    const users = getDB();
    return users.find(u => u.id === sessionId) || null;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  login: async (username: string, password?: string): Promise<AuthResponse> => {
    // Simulate Network Delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const users = getDB();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    if (!user.isGuest && user.password !== password) {
      return { success: false, message: 'Contraseña incorrecta.' };
    }

    // Update Last Login
    user.lastLogin = new Date().toISOString();
    saveDB(users);
    localStorage.setItem(SESSION_KEY, user.id);

    return { success: true, user };
  },

  register: async (username: string, password?: string, isGuest: boolean = false): Promise<AuthResponse> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = getDB();
    if (!isGuest && users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, message: 'El nombre de usuario ya existe.' };
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username: isGuest ? `Invitado_${Math.floor(Math.random()*1000)}` : username,
      password: password,
      isGuest,
      preferences: createDefaultPreferences(),
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    users.push(newUser);
    saveDB(users);
    localStorage.setItem(SESSION_KEY, newUser.id);

    return { success: true, user: newUser };
  },

  // Update specific parts of the user profile
  updatePreferences: async (userId: string, updates: Partial<UserPreferences>): Promise<User | null> => {
    const users = getDB();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return null;

    users[userIndex].preferences = {
      ...users[userIndex].preferences,
      ...updates
    };

    saveDB(users);
    return users[userIndex];
  }
};
