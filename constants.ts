
export const TIMEZONE = 'America/Argentina/Cordoba';
export const VACATION_DATE_STR = "2026-01-12T00:00:00"; // Restaurado a 12/01/2026

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
export type ModuleId = 'week' | 'tracker' | 'month' | 'year' | 'countdown' | 'ai' | 'nano' | 'maps';
export type ModuleSize = 'normal' | 'wide'; // normal = 1 col, wide = 2 cols (full width)

export interface UIConfig {
  leftColumn: ModuleId[];
  rightColumn: ModuleId[];
  titles: Record<ModuleId, string>;
  sizes: Record<ModuleId, ModuleSize>;
  minimized: ModuleId[]; // Nuevo: Lista de módulos colapsados
}

export const DEFAULT_UI_CONFIG: UIConfig = {
  leftColumn: ['week', 'tracker'],
  rightColumn: ['maps', 'month', 'year', 'countdown', 'ai', 'nano'],
  titles: {
    week: 'Esta Semana',
    tracker: 'Rastreador',
    month: 'Este Mes',
    year: 'Año 2026',
    countdown: 'Vacaciones 2026',
    ai: 'Chatbot Gemini 3',
    nano: 'Nano Banana Studio',
    maps: 'Ruta de Salida'
  },
  sizes: {
    week: 'wide',
    tracker: 'wide',
    month: 'wide', 
    year: 'normal',
    countdown: 'normal',
    ai: 'wide',
    nano: 'wide',
    maps: 'wide'
  },
  minimized: [] // Por defecto ninguno minimizado
};

// Feriados Argentina 2026 (Estimados / Fijos)
export const HOLIDAYS_2026 = [
  '01-01', // Año Nuevo
  '02-16', // Carnaval (Lunes)
  '02-17', // Carnaval (Martes)
  '03-24', // Día de la Memoria
  '04-02', // Malvinas
  '04-03', // Viernes Santo
  '05-01', // Día del Trabajador
  '05-25', // Revolución de Mayo
  '06-17', // Güemes
  '06-20', // Día de la Bandera
  '07-09', // Independencia
  '08-17', // San Martín
  '10-12', // Diversidad Cultural
  '11-20', // Soberanía Nacional
  '12-08', // Inmaculada Concepción
  '12-25', // Navidad
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
