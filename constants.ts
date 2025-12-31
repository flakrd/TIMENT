// Configuración de Zona Horaria y Fechas
export const TIMEZONE = 'America/Argentina/Cordoba';
export const VACATION_DATE_STR = "2026-01-12T00:00:00"; // ISO format for easier parsing

export interface WorkConfig {
  startHour: number;
  endHour: number;
  workDays: number[]; // 0=Sunday, 6=Saturday
}

export const DEFAULT_WORK_CONFIG: WorkConfig = {
  startHour: 9,
  endHour: 17,
  workDays: [1, 2, 3, 4, 5] // Lunes a Viernes
};

// Deprecated constants kept for backward compatibility if needed, but should use config
export const WORK_START_HOUR = 9;
export const WORK_END_HOUR = 17;

// Feriados Argentina 2025 (Confirmados e Inamovibles/Trasladables estimados)
// Formato: MM-DD
export const HOLIDAYS_2025 = [
  '01-01', // Año Nuevo
  '03-03', // Carnaval
  '03-04', // Carnaval
  '03-24', // Día de la Memoria (Lunes)
  '04-02', // Malvinas (Miércoles)
  '04-18', // Viernes Santo
  '05-01', // Día del Trabajador
  '05-25', // Revolución de Mayo
  '06-16', // Paso a la Inmortalidad de Güemes (Lunes estimado)
  '06-20', // Paso a la Inmortalidad de Belgrano
  '07-09', // Independencia
  '08-17', // Paso a la Inmortalidad de San Martín
  '10-12', // Día del Respeto a la Diversidad Cultural
  '11-20', // Día de la Soberanía Nacional
  '12-08', // Inmaculada Concepción
  '12-25', // Navidad
];

// Mapeo de códigos WMO de Open-Meteo a descripciones y emojis
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
  71: { label: 'Nieve ligera', icon: '🌨️' },
  73: { label: 'Nieve moderada', icon: '🌨️' },
  75: { label: 'Nieve fuerte', icon: '❄️' },
  95: { label: 'Tormenta eléctrica', icon: '⚡' },
  96: { label: 'Tormenta con granizo', icon: '⛈️' },
  99: { label: 'Tormenta fuerte', icon: '⛈️' },
};

export const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];