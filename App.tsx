import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { ThemeProvider, Text, IconButton, MD3DarkTheme } from 'react-native-paper';
import { LocationSearch } from './src/components/LocationSearch';
import { TideStation, ukTideStations } from './src/data/ukTideStations';
import { getTideData } from './src/services/tideService';
import { changeDate, canChangeDate } from './src/utils/dateUtils';
import { CONTENT_BREAKPOINT, MAX_CONTENT_WIDTH } from './src/config/layout';
import { elevation } from './src/styles/elevation';
import type { TideEvent } from './src/types/tide';
import { format } from 'date-fns';
import { StatusBar } from 'expo-status-bar';
import { TideGraph } from './src/components/TideGraph';
import { TideNow } from './src/components/TideNow';
import { WeatherPanel } from './src/components/WeatherPanel';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import {
  locateNearestStation,
  LocationPermissionDeniedError,
} from './src/services/locationService';

const theme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#8FC9C1',
    secondary: '#A6BBB6',
    background: '#0B1214',
    surface: '#142024',
    surfaceVariant: '#1D2B2F',
    onSurface: '#F2F6F4',
    onSurfaceVariant: '#B9C7C3',
    outline: '#405156',
    error: '#FFB4AB',
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    regular: { fontFamily: 'Poppins_400Regular' },
    medium: { fontFamily: 'Poppins_500Medium' },
    semibold: { fontFamily: 'Poppins_600SemiBold' },
    bold: { fontFamily: 'Poppins_700Bold' },
  },
};

export default function App() {
  const [selectedStation, setSelectedStation] = useState<TideStation | null>(null);
  const [tideData, setTideData] = useState<TideEvent[]>([]);
  const [tideLoading, setTideLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const { width: windowWidth } = useWindowDimensions();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
      console.error('Splash preventAutoHideAsync failed:', error);
    });
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch((error: unknown) => {
        console.error('Splash hideAsync failed:', error);
      });
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!selectedStation) {
      setTideData([]);
      setTideLoading(false);
      return;
    }

    let cancelled = false;
    setTideLoading(true);
    getTideData(selectedStation.id, selectedDate)
      .then(result => {
        if (cancelled) return;
        setTideData(result.events);
      })
      .catch(() => {
        if (cancelled) return;
        setTideData([]);
      })
      .finally(() => {
        if (!cancelled) setTideLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedStation, selectedDate]);

  const handleLocationSelect = (station: TideStation) => {
    setSelectedStation(station);
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    setLocationError(null);
    try {
      const { station } = await locateNearestStation(ukTideStations);
      handleLocationSelect(station);
    } catch (error) {
      const message =
        error instanceof LocationPermissionDeniedError
          ? 'Location access denied. Please search for a beach instead.'
          : "Couldn't get your location. Please search for a beach instead.";
      setLocationError(message);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleDateChange = (days: number) => {
    setSelectedDate(prev => changeDate(prev, days));
  };

  const canGoBack = canChangeDate(selectedDate, -1);
  const canGoForward = canChangeDate(selectedDate, 1);
  const contentWidth = windowWidth > CONTENT_BREAKPOINT ? MAX_CONTENT_WIDTH : windowWidth;
  const graphCenter = new Date(selectedDate);
  const currentTime = new Date();
  graphCenter.setHours(
    currentTime.getHours(),
    currentTime.getMinutes(),
    currentTime.getSeconds(),
    0,
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <View style={styles.safeArea}>
        <StatusBar style="light" />

        <View style={[styles.header, elevation(2)]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>UK Tide Times</Text>
            {selectedStation && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>{selectedStation.name}</Text>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, { width: contentWidth }]}>

            <LocationSearch
              onLocationSelect={handleLocationSelect}
              currentStationId={selectedStation?.id || ''}
              onDetectLocation={handleDetectLocation}
              isDetecting={isDetecting}
            />

            {locationError && (
              <View style={[styles.welcomeCard, { marginBottom: 16 }]}>
                <Text style={[styles.welcomeText, { color: theme.colors.error }]}>
                  {locationError}
                </Text>
              </View>
            )}

            {selectedStation ? (
              <View style={styles.tideInfo}>
                <TideNow tideData={tideData} loading={tideLoading} />
                <WeatherPanel station={selectedStation} />

                <View style={[styles.dateNav, elevation(1)]}>
                  <IconButton
                    icon="chevron-left"
                    mode="contained"
                    containerColor="rgba(143, 201, 193, 0.12)"
                    iconColor={theme.colors.primary}
                    size={20}
                    style={styles.dateButton}
                    disabled={!canGoBack}
                    onPress={() => handleDateChange(-1)}
                  />
                  <Text variant="titleMedium" style={styles.dateText}>
                    {format(selectedDate, 'EEEE, d MMMM yyyy')}
                  </Text>
                  <IconButton
                    icon="chevron-right"
                    mode="contained"
                    containerColor="rgba(143, 201, 193, 0.12)"
                    iconColor={theme.colors.primary}
                    size={20}
                    style={styles.dateButton}
                    disabled={!canGoForward}
                    onPress={() => handleDateChange(1)}
                  />
                </View>

                <TideGraph
                  tideData={tideData}
                  loading={tideLoading}
                  centerTime={graphCenter}
                />
              </View>
            ) : (
              <View style={[styles.welcomeCard, elevation(2)]}>
                <Text variant="headlineSmall" style={styles.welcomeTitle}>
                  Welcome to UK Tide Times
                </Text>
                <Text variant="bodyLarge" style={styles.welcomeText}>
                  Select a location to view tide information
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1214',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({
      ios: 48,
      android: 34,
      default: 10,
    }),
    paddingBottom: 7,
    backgroundColor: '#101A1D',
    borderBottomWidth: 1,
    borderBottomColor: '#29383C',
  },
  headerContent: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 28,
    color: '#F2F6F4',
  },
  headerSubtitle: {
    flexShrink: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#B9C7C3',
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 8,
  },
  content: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxWidth: '100%',
  },
  tideInfo: {
    width: '100%',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 2,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#142024',
    borderWidth: 1,
    borderColor: '#405156',
  },
  dateButton: {
    margin: 2,
  },
  dateText: {
    fontFamily: 'Poppins_500Medium',
    flex: 1,
    textAlign: 'center',
    color: '#D8E7E3',
    fontSize: 14,
    letterSpacing: 0,
  },
  welcomeCard: {
    padding: 20,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#142024',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#F2F6F4',
  },
  welcomeText: {
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    color: '#B9C7C3',
  },
});
