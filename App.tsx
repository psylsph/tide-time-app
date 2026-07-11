import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Provider as PaperProvider, Text, IconButton, MD3LightTheme } from 'react-native-paper';
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
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1E88E5',
    secondary: '#64B5F6',
    background: '#E3F2FD',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    error: '#B00020',
  },
  fonts: {
    ...MD3LightTheme.fonts,
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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <View style={styles.safeArea}>
        <StatusBar style="dark" />

        <View style={[styles.header, elevation(2)]}>
          <View style={styles.headerContent}>
            <Text variant="headlineLarge" style={styles.headerTitle}>UK Tide Times</Text>
            {selectedStation && (
              <Text variant="titleMedium" style={styles.headerSubtitle}>{selectedStation.name}</Text>
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
                <View style={[styles.dateNav, elevation(2)]}>
                  <IconButton
                    icon="chevron-left"
                    mode="contained"
                    containerColor="rgba(30, 136, 229, 0.1)"
                    iconColor={theme.colors.primary}
                    size={24}
                    disabled={!canGoBack}
                    onPress={() => handleDateChange(-1)}
                  />
                  <Text variant="titleMedium" style={styles.dateText}>
                    {format(selectedDate, 'EEEE, d MMMM yyyy')}
                  </Text>
                  <IconButton
                    icon="chevron-right"
                    mode="contained"
                    containerColor="rgba(30, 136, 229, 0.1)"
                    iconColor={theme.colors.primary}
                    size={24}
                    disabled={!canGoForward}
                    onPress={() => handleDateChange(1)}
                  />
                </View>

                <TideGraph tideData={tideData} loading={tideLoading} />
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
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({
      ios: 60,
      android: 48,
      default: 24,
    }),
    paddingBottom: 16,
    backgroundColor: 'rgba(227, 242, 253, 0.92)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(30, 136, 229, 0.2)',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    letterSpacing: 0.25,
    color: '#1E88E5',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 18,
    color: '#64B5F6',
    marginTop: 4,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 24,
  },
  content: {
    padding: 16,
  },
  tideInfo: {
    width: '100%',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontFamily: 'Poppins_500Medium',
    flex: 1,
    textAlign: 'center',
    color: '#1E88E5',
    fontSize: 16,
    letterSpacing: 0,
  },
  welcomeCard: {
    padding: 24,
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1E88E5',
  },
  welcomeText: {
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    color: '#64B5F6',
  },
});
