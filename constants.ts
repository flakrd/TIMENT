
export const TIMEZONE = 'America/Argentina/Cordoba';
export const VACATION_DATE_STR = "2026-01-12T00:00:00";

export type BackgroundTheme = 'minimal' | 'dynamic' | 'geometric' | 'custom';

export interface WorkConfig {
  startHour: number;
  endHour: number;
  workDays: number[]; // 0=Domingo, 6=Sábado
  sleepGoal: number; // Horas de sueño deseadas
  // Horarios por día de semana (Indice 0-6 -> {start, end})
  customSchedule?: Record<number, { start: number, end: number }>;
  // Nuevo: Horarios por fecha específica ("YYYY-MM-DD" -> {start, end})
  dateExceptions?: Record<string, { start: number, end: number }>;
  // Nuevo: Tema de fondo
  backgroundTheme: BackgroundTheme;
  // Nuevo: Imagen de fondo personalizada (base64)
  customBackgroundImage?: string;
}

export const DEFAULT_WORK_CONFIG: WorkConfig = {
  startHour: 9,
  endHour: 17,
  workDays: [1, 2, 3, 4, 5], // Lunes a Viernes
  sleepGoal: 8,
  customSchedule: {},
  dateExceptions: {},
  backgroundTheme: 'minimal',
  customBackgroundImage: undefined
};

// Configuración de Módulos (UI)
export type ModuleId = 'week' | 'tracker' | 'month' | 'year' | 'countdown' | 'ai' | 'nano';
export type ModuleSize = 'normal' | 'wide'; // normal = 1 col, wide = 2 cols (full width)

export interface UIConfig {
  leftColumn: ModuleId[];
  rightColumn: ModuleId[];
  titles: Record<ModuleId, string>;
  sizes: Record<ModuleId, ModuleSize>;
}

export const DEFAULT_UI_CONFIG: UIConfig = {
  leftColumn: ['week', 'tracker'],
  rightColumn: ['month', 'year', 'countdown', 'ai', 'nano'],
  titles: {
    week: 'Esta Semana',
    tracker: 'Rastreador',
    month: 'Este Mes',
    year: 'Año 2025',
    countdown: 'Vacaciones',
    ai: 'Chatbot Gemini 3',
    nano: 'Nano Banana Studio'
  },
  sizes: {
    week: 'wide',
    tracker: 'wide',
    month: 'wide', 
    year: 'normal',
    countdown: 'normal',
    ai: 'wide',
    nano: 'wide'
  }
};

export const HOLIDAYS_2025 = [
  '01-01', '03-03', '03-04', '03-24', '04-02', '04-18', '05-01', '05-25', 
  '06-16', '06-20', '07-09', '08-17', '10-12', '11-20', '12-08', '12-25',
];

export const WEATHER_CODES: Record<number, { label: string, icon: string }> = {
  0: { label: 'Despejado', icon: '☀️' },
  1: { label: 'Mayormente despejado', icon: '🌤️' },
  2: { label: 'Parcialmente nublado', icon: '⛅' },
  3: { label: 'Nublado', icon: '☁️' },
  45: { label: 'Niebla', icon: '🌫️' },
  48: { label: 'Niebla escarchada', icon: '🌫️' },
  51: { label: 'Llovizna ligera', icon: '🌦️' },
  53: { label: 'Llovizna moderada', icon: '🌦️' },
  55: { label: 'Llovizna densa', icon: '🌧️' },
  61: { label: 'Lluvia ligera', icon: '🌧️' },
  63: { label: 'Lluvia moderada', icon: '🌧️' },
  65: { label: 'Lluvia fuerte', icon: '⛈️' },
  95: { label: 'Tormenta eléctrica', icon: '⚡' },
};

export const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
