import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import type { TideStation } from '../data/ukTideStations';
import type { WeatherData } from '../types/weather';
import { getWeatherData } from '../services/weatherService';
import { elevation } from '../styles/elevation';

interface WeatherPanelProps {
  station: TideStation;
}

function describeWeather(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  return 'Thunderstorms';
}

function compassDirection(degrees: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(degrees / 45) % points.length];
}

function uvDescription(uv: number): string {
  if (uv < 3) return 'Low';
  if (uv < 6) return 'Moderate';
  if (uv < 8) return 'High';
  return 'Very high';
}

export const WeatherPanel: React.FC<WeatherPanelProps> = ({ station }) => {
  const theme = useTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setWeather(null);
    getWeatherData(station.latitude, station.longitude)
      .then(data => {
        if (!cancelled) setWeather(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [station.id, station.latitude, station.longitude]);

  const styles = StyleSheet.create({
    card: {
      width: '100%',
      marginBottom: 8,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      ...elevation(1),
    },
    loading: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    loadingText: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    currentRow: {
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    conditionGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    temperature: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 27,
      color: theme.colors.onSurface,
    },
    condition: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 12,
      color: theme.colors.onSurface,
    },
    feelsLike: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 9,
      color: theme.colors.onSurfaceVariant,
    },
    metrics: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 13,
    },
    metric: {
      alignItems: 'flex-end',
    },
    metricLabel: {
      fontFamily: 'Poppins_500Medium',
      fontSize: 9,
      letterSpacing: 0.5,
      color: theme.colors.onSurfaceVariant,
    },
    metricValue: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 12,
      color: theme.colors.onSurface,
    },
    hourlyScroll: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    hourlyContent: {
      paddingHorizontal: 8,
      gap: 6,
    },
    hour: {
      width: 66,
      paddingVertical: 4,
      paddingHorizontal: 5,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
    },
    hourTime: {
      fontFamily: 'Poppins_500Medium',
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
    },
    hourTemp: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 13,
      color: theme.colors.onSurface,
    },
    hourDetail: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 8,
      color: theme.colors.onSurfaceVariant,
    },
  });

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading local weather…</Text>
        </View>
      </View>
    );
  }

  if (failed || !weather) {
    return (
      <View style={styles.card}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Local weather is temporarily unavailable</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.currentRow}>
        <View style={styles.conditionGroup}>
          <Text style={styles.temperature}>{Math.round(weather.temperature)}°</Text>
          <View>
            <Text style={styles.condition}>{describeWeather(weather.weatherCode)}</Text>
            <Text style={styles.feelsLike}>
              Feels {Math.round(weather.apparentTemperature)}° · Open-Meteo
            </Text>
          </View>
        </View>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>WIND</Text>
            <Text style={styles.metricValue}>
              {Math.round(weather.windSpeed)} mph {compassDirection(weather.windDirection)}
            </Text>
            <Text style={styles.feelsLike}>Gust {Math.round(weather.windGust)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>UV · SOLAR</Text>
            <Text style={styles.metricValue}>{weather.uvIndex.toFixed(1)} {uvDescription(weather.uvIndex)}</Text>
            <Text style={styles.feelsLike}>{Math.round(weather.solarRadiation)} W/m²</Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        style={styles.hourlyScroll}
        contentContainerStyle={styles.hourlyContent}
        showsHorizontalScrollIndicator={false}
      >
        {weather.hourly.map(hour => (
          <View key={hour.time} style={styles.hour}>
            <Text style={styles.hourTime}>{format(parseISO(hour.time), 'HH:mm')}</Text>
            <Text style={styles.hourTemp}>{Math.round(hour.temperature)}°</Text>
            <Text style={styles.hourDetail}>Rain {Math.round(hour.rainChance)}%</Text>
            <Text style={styles.hourDetail}>{Math.round(hour.windSpeed)} mph · UV {hour.uvIndex.toFixed(1)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
