
import { WorkConfig, UIConfig, BackgroundTheme } from '../constants';

export interface LocationConfig {
  type: 'gps' | 'manual';
  lat?: number;
  lon?: number;
  city?: string;
}

export interface UserPreferences {
  workConfig: WorkConfig;
  uiConfig: UIConfig;
  locationConfig: LocationConfig; // Nueva propiedad
  vacationDate: string; // ISO String
  theme: 'light' | 'dark' | 'system';
}

export interface User {
  id: string;
  username: string;
  password?: string; // Optional for guest/guest mode
  isGuest: boolean;
  preferences: UserPreferences;
  createdAt: string;
  lastLogin: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}
