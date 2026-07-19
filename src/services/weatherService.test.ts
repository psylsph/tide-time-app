import { __clearWeatherCacheForTests, getWeatherData } from './weatherService';

const BODY = {
  current: {
    time: '2026-06-10T10:00',
    temperature_2m: 18.4,
    apparent_temperature: 17.2,
    weather_code: 2,
    wind_speed_10m: 12.5,
    wind_direction_10m: 225,
    wind_gusts_10m: 20.1,
    shortwave_radiation: 540,
  },
  hourly: {
    time: [
      '2026-06-10T09:00', '2026-06-10T10:00', '2026-06-10T11:00',
      '2026-06-10T12:00', '2026-06-10T13:00', '2026-06-10T14:00',
      '2026-06-10T15:00', '2026-06-10T16:00',
    ],
    temperature_2m: [17, 18, 19, 20, 20, 19, 18, 17],
    precipitation_probability: [5, 5, 10, 20, 30, 20, 10, 5],
    wind_speed_10m: [10, 12, 13, 14, 15, 14, 12, 10],
    uv_index: [2, 3, 4, 5, 4, 3, 2, 1],
  },
};

beforeEach(() => {
  __clearWeatherCacheForTests();
  jest.restoreAllMocks();
});

describe('getWeatherData', () => {
  it('normalises current weather and the next six hours', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => BODY,
    } as Response);

    const weather = await getWeatherData(50.8, -1.1);

    expect(weather.temperature).toBe(18.4);
    expect(weather.windSpeed).toBe(12.5);
    expect(weather.uvIndex).toBe(3);
    expect(weather.solarRadiation).toBe(540);
    expect(weather.hourly).toHaveLength(6);
    expect(weather.hourly[0].time).toBe('2026-06-10T11:00');
    expect(fetchSpy.mock.calls[0][0]).toContain('wind_speed_unit=mph');
  });

  it('caches weather by location', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => BODY,
    } as Response);
    await getWeatherData(50.8, -1.1);
    await getWeatherData(50.8, -1.1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    await expect(getWeatherData(50.8, -1.1)).rejects.toThrow('unexpected weather response');
  });
});
