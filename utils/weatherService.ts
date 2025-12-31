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

export const fetchWeather = async (
  lat: number = DEFAULT_LAT, 
  lon: number = DEFAULT_LON,
  config: WorkConfig
): Promise<WeatherData | null> => {
  try {
    // Validate coordinates to prevent fetch errors with invalid params
    const safeLat = (typeof lat === 'number' && isFinite(lat)) ? lat : DEFAULT_LAT;
    const safeLon = (typeof lon === 'number' && isFinite(lon)) ? lon : DEFAULT_LON;
    
    // We request timezone=auto so the API returns local time for the coordinates
    const apiUrl = new URL('https://api.open-meteo.com/v1/forecast');
    apiUrl.searchParams.append('latitude', safeLat.toString());
    apiUrl.searchParams.append('longitude', safeLon.toString());
    apiUrl.searchParams.append('current', 'temperature_2m,is_day,weather_code');
    apiUrl.searchParams.append('hourly', 'temperature_2m,weather_code,is_day');
    apiUrl.searchParams.append('timezone', 'auto'); 
    apiUrl.searchParams.append('forecast_days', '2');

    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
        console.error(`Weather API Error: ${response.status}`);
        return null;
    }

    const data = await response.json();
    const current = data.current;
    const hourly = data.hourly;
    
    const now = new Date();
    const currentHour = now.getHours();

    // Open-Meteo returns hourly data starting from 00:00 of the requested day (index 0 = 00:00 today)
    // We can safely assume index matches hour for the first 24h if we are in the same day context provided by API
    // However, to be safe against timezone shifts, we find the index that matches the current hour closer
    
    // Find the index in hourly.time that matches the current hour
    let startIndex = -1;
    
    // Robust search: find the timestamp closest to now
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

    if (startIndex === -1) startIndex = 0;

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
    // Hardcoded label as we are strictly using Cordoba
    const locationLabel = "Córdoba Capital";

    // Calculate Recommendation based on current status
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
    console.error("Error fetching weather:", error);
    return null;
  }
};