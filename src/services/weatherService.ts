import type { WeatherData } from '../types/weather';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const cache = new Map<string, WeatherData>();

interface OpenMeteoResponse {
  current?: Record<string, unknown>;
  hourly?: Record<string, unknown>;
}

function numberAt(values: unknown, index: number): number {
  if (!Array.isArray(values) || typeof values[index] !== 'number') return 0;
  return values[index];
}

export async function getWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
  const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'shortwave_radiation',
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'wind_speed_10m',
      'uv_index',
    ].join(','),
    forecast_days: '2',
    timezone: 'auto',
    wind_speed_unit: 'mph',
  });

  const response = await fetch(`${FORECAST_URL}?${params.toString()}`);
  if (!response.ok) throw new Error(`weather endpoint responded ${response.status}`);
  const body = await response.json() as OpenMeteoResponse;
  const current = body.current;
  const hourly = body.hourly;
  const times = hourly?.time;
  if (!current || !hourly || !Array.isArray(times) || times.length === 0) {
    throw new Error('unexpected weather response');
  }

  const currentTime = typeof current.time === 'string' ? current.time : '';
  let startIndex = times.findIndex(time => typeof time === 'string' && time >= currentTime);
  if (startIndex < 0) startIndex = 0;

  const upcoming = times.slice(startIndex + 1, startIndex + 7).map((time, offset) => {
    const index = startIndex + offset + 1;
    return {
      time: String(time),
      temperature: numberAt(hourly.temperature_2m, index),
      rainChance: numberAt(hourly.precipitation_probability, index),
      windSpeed: numberAt(hourly.wind_speed_10m, index),
      uvIndex: numberAt(hourly.uv_index, index),
    };
  });

  const data: WeatherData = {
    temperature: Number(current.temperature_2m),
    apparentTemperature: Number(current.apparent_temperature),
    weatherCode: Number(current.weather_code),
    windSpeed: Number(current.wind_speed_10m),
    windDirection: Number(current.wind_direction_10m),
    windGust: Number(current.wind_gusts_10m),
    uvIndex: numberAt(hourly.uv_index, startIndex),
    solarRadiation: Number(current.shortwave_radiation),
    hourly: upcoming,
  };

  if (!Number.isFinite(data.temperature) || !Number.isFinite(data.windSpeed)) {
    throw new Error('invalid weather response');
  }
  cache.set(key, data);
  return data;
}

export function __clearWeatherCacheForTests(): void {
  cache.clear();
}
