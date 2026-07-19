export interface HourlyWeather {
  time: string;
  temperature: number;
  rainChance: number;
  windSpeed: number;
  uvIndex: number;
}

export interface WeatherData {
  temperature: number;
  apparentTemperature: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  uvIndex: number;
  solarRadiation: number;
  hourly: HourlyWeather[];
}
