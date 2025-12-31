
import { WEATHER_CODES, TIMEZONE, WorkConfig } from '../constants';

export interface HourlyForecast {
  time: string; // ISO string
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  hour: number;
  formattedTime: string;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  weatherLabel: string;
  weatherIcon: string;
  isDay: boolean;
  locationName?: string;
  workForecast: HourlyForecast[];
  afterWorkForecast: HourlyForecast[];
  // New fields for recommendation
  recommendation: {
    title: string;
    activity: string;
    icon: string;
    color: string;
  };
}

// Valores por defecto (Córdoba, Argentina)
const DEFAULT_LAT = -31.4201;
const DEFAULT_LON = -64.1888;

const getActivityRecommendation = (temp: number, code: number, isWorkTime: boolean): { title: string, activity: string, icon: string, color: string } => {
  // Bad Weather (Rain/Storm)
  if (code >= 51) {
    if (isWorkTime) {
      return { title: 'Día de Lluvia', activity: 'Ideal para Deep Work. Pon música Lo-Fi y avanza pendientes.', icon: '🎧', color: 'bg-indigo-100 text-indigo-700' };
    } else {
      return { title: 'Clima de Hogar', activity: 'Maratón de series, lectura o videojuegos.', icon: '🍿', color: 'bg-slate-200 text-slate-700' };
    }
  }

  // Extreme Heat
  if (temp > 30) {
    if (isWorkTime) {
      return { title: 'Ola de Calor', activity: 'Mantente hidratado. Evita reuniones al aire libre.', icon: '💧', color: 'bg-orange-100 text-orange-700' };
    } else {
      return { title: 'Noche Tropical', activity: 'Pileta, helado o aire acondicionado al máximo.', icon: '🍦', color: 'bg-red-100 text-red-700' };
    }
  }

  // Cold
  if (temp < 12) {
    return { title: 'Día Frío', activity: 'Ropa térmica y bebidas calientes. Buen momento para planificar.', icon: '☕', color: 'bg-blue-100 text-blue-700' };
  }

  // Nice Weather
  if (isWorkTime) {
    return { title: 'Clima Agradable', activity: 'Abre las ventanas. Intenta hacer una llamada caminando.', icon: '🚶', color: 'bg-green-100 text-green-700' };
  } else {
    return { title: 'Tiempo Perfecto', activity: 'Sal a caminar, haz deporte o cena afuera.', icon: '🚲', color: 'bg-emerald-100 text-emerald-700' };
  }
};

// Fallback Mock Data Generator
const getMockWeather = (config: WorkConfig): WeatherData => {
  const now = new Date();
  const currentHour = now.getHours();
  const isDay = currentHour >= 6 && currentHour < 20;
  
  // Create simulated forecast
  const mockForecast: HourlyForecast[] = [];
  for(let i=0; i<12; i++) {
    const h = (currentHour + i) % 24;
    mockForecast.push({
      time: new Date(now.getTime() + i * 3600000).toISOString(),
      temperature: 20 + Math.sin(i) * 5,
      weatherCode: 1,
      isDay: h >= 6 && h < 20,
      hour: h,
      formattedTime: `${h}:00`
    });
  }

  return {
    temperature: 22,
    weatherCode: 1,
    weatherLabel: 'Offline',
    weatherIcon: '⛅',
    isDay,
    locationName: 'Modo Offline',
    workForecast: mockForecast.filter(f => f.hour >= config.startHour && f.hour < config.endHour).slice(0,5),
    afterWorkForecast: mockForecast.filter(f => f.hour >= config.endHour || f.hour < config.startHour).slice(0,5),
    recommendation: {
      title: 'Sin Conexión',
      activity: 'No pudimos obtener el clima, pero aprovecha el día igual.',
      icon: '📡',
      color: 'bg-gray-100 text-gray-700'
    }
  };
};

export const fetchWeather = async (
  lat: number = DEFAULT_LAT, 
  lon: number = DEFAULT_LON,
  config: WorkConfig
): Promise<WeatherData | null> => {
  try {
    const safeLat = (typeof lat === 'number' && isFinite(lat)) ? lat : DEFAULT_LAT;
    const safeLon = (typeof lon === 'number' && isFinite(lon)) ? lon : DEFAULT_LON;
    
    // Explicit timezone provided in constants
    const apiUrl = new URL('https://api.open-meteo.com/v1/forecast');
    apiUrl.searchParams.append('latitude', safeLat.toString());
    apiUrl.searchParams.append('longitude', safeLon.toString());
    apiUrl.searchParams.append('current', 'temperature_2m,is_day,weather_code');
    apiUrl.searchParams.append('hourly', 'temperature_2m,weather_code,is_day');
    apiUrl.searchParams.append('timezone', TIMEZONE); 
    apiUrl.searchParams.append('forecast_days', '2');

    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
        throw new Error(`Weather API Error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    const hourly = data.hourly;
    
    const now = new Date();
    const currentHour = now.getHours();

    // Find the index in hourly.time that matches the current hour
    let startIndex = 0;
    const nowTime = now.getTime();
    let minDiff = Infinity;
    
    for(let i=0; i<hourly.time.length; i++) {
        const t = new Date(hourly.time[i]).getTime();
        const diff = Math.abs(t - nowTime);
        if(diff < minDiff) {
            minDiff = diff;
            startIndex = i;
        }
    }

    const workForecast: HourlyForecast[] = [];
    const afterWorkForecast: HourlyForecast[] = [];

    // Iterate next 16 hours
    for (let i = startIndex; i < startIndex + 16 && i < hourly.time.length; i++) {
        const timeStr = hourly.time[i];
        const dateObj = new Date(timeStr);
        const hour = dateObj.getHours();

        const forecastItem: HourlyForecast = {
            time: timeStr,
            temperature: hourly.temperature_2m[i],
            weatherCode: hourly.weather_code[i],
            isDay: hourly.is_day[i] === 1,
            hour: hour,
            formattedTime: `${hour}:00`
        };

        // Logic to categorize forecast
        if (hour >= config.startHour && hour < config.endHour) {
             workForecast.push(forecastItem);
        } else if (hour >= config.endHour) {
             afterWorkForecast.push(forecastItem);
        } else {
             // Morning before work (if current time is early)
             if (hour < config.startHour && i === startIndex) {
                 workForecast.push(forecastItem); 
             }
        }
    }

    const codeInfo = WEATHER_CODES[current.weather_code] || { label: 'Desconocido', icon: '❓' };
    const locationLabel = "Córdoba Capital";
    const isWorkingNow = currentHour >= config.startHour && currentHour < config.endHour;
    const recommendation = getActivityRecommendation(current.temperature_2m, current.weather_code, isWorkingNow);

    return {
      temperature: current.temperature_2m,
      weatherCode: current.weather_code,
      weatherLabel: codeInfo.label,
      weatherIcon: codeInfo.icon,
      isDay: current.is_day === 1,
      locationName: locationLabel,
      workForecast,
      afterWorkForecast,
      recommendation
    };
  } catch (error) {
    console.warn("Error fetching weather, falling back to mock data.", error);
    // Return mock data so the UI doesn't break
    return getMockWeather(config);
  }
};
