import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { Provider as PaperProvider, Text, IconButton, MD3LightTheme, Surface } from 'react-native-paper';
import { LocationSearch } from './src/components/LocationSearch';
import { TideStation, ukTideStations } from './src/data/ukTideStations';
import { getTideData } from './src/services/tideService';
import { format } from 'date-fns';
import { StatusBar } from 'expo-status-bar';
import { TideGraph } from './src/components/TideGraph';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import * as Location from 'expo-location';
import { findNearestStation } from './src/utils/locationUtils';

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
    regular: {
      fontFamily: 'Poppins_400Regular',
    },
    medium: {
      fontFamily: 'Poppins_500Medium',
    },
    bold: {
      fontFamily: 'Poppins_700Bold',
    },
  },
};

export default function App() {
  const [selectedStation, setSelectedStation] = useState<TideStation | null>(null);
  const [tideData, setTideData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [locationError, setLocationError] = useState<string | null>(null);
  const windowWidth = Dimensions.get('window').width;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
    }
    prepare();
  }, []);

  useEffect(() => {
    async function getLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const nearest = findNearestStation(
          location.coords.latitude,
          location.coords.longitude,
          ukTideStations
        );

        if (nearest) {
          setSelectedStation(nearest);
        }
      } catch (error) {
        setLocationError('Error getting location');
        console.error('Location error:', error);
      }
    }

    if (!selectedStation) {
      getLocation();
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (selectedStation) {
      const data = getTideData(selectedStation.id, selectedDate);
      setTideData(data);
    }
  }, [selectedStation, selectedDate]);

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <View style={styles.safeArea}>
        <StatusBar style="dark" />
        
        <Surface style={styles.header} elevation={0}>
          <View style={styles.headerContent}>
            <Text variant="headlineLarge" style={styles.headerTitle}>UK Tide Times</Text>
            {selectedStation && (
              <Text variant="titleMedium" style={styles.headerSubtitle}>{selectedStation.name}</Text>
            )}
          </View>
        </Surface>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, { width: windowWidth > 744 ? 680 : windowWidth }]}>

            <LocationSearch
              onLocationSelect={setSelectedStation}
              currentStationId={selectedStation?.id || ''}
            />

            {locationError && !selectedStation && (
              <Surface style={[styles.welcomeCard, { marginBottom: 16 }]} elevation={0}>
                <Text style={[styles.welcomeText, { color: theme.colors.error }]}>
                  {locationError}
                </Text>
              </Surface>
            )}

            {selectedStation ? (
              <View style={styles.tideInfo}>
                <View style={styles.dateNav}>
                  <IconButton
                    icon="chevron-left"
                    mode="contained"
                    containerColor="rgba(30, 136, 229, 0.1)"
                    iconColor={theme.colors.primary}
                    size={24}
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
                    onPress={() => handleDateChange(1)}
                  />
                </View>

                <TideGraph tideData={tideData} />
              </View>
            ) : (
              <Surface style={styles.welcomeCard} elevation={0}>
                <Text variant="headlineSmall" style={styles.welcomeTitle}>
                  Welcome to UK Tide Times
                </Text>
                <Text variant="bodyLarge" style={styles.welcomeText}>
                  Select a location to view tide information
                </Text>
              </Surface>
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
    ...Platform.select({
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(30, 136, 229, 0.1)',
      },
      ios: {
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
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
    ...Platform.select({
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(30, 136, 229, 0.1)',
      },
      ios: {
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
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
    ...Platform.select({
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(30, 136, 229, 0.1)',
      },
      ios: {
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
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
