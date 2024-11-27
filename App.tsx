import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { Provider as PaperProvider, Text, IconButton, MD3LightTheme, Surface } from 'react-native-paper';
import { LocationSearch } from './src/components/LocationSearch';
import { TideStation } from './src/data/ukTideStations';
import { getTideData } from './src/services/tideService';
import { format } from 'date-fns';
import { StatusBar } from 'expo-status-bar';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007AFF',
    background: '#F2F2F7',
    surface: '#FFFFFF',
  },
};

export default function App() {
  const [selectedStation, setSelectedStation] = useState<TideStation | null>(null);
  const [tideData, setTideData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const windowWidth = Dimensions.get('window').width;

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

  return (
    <PaperProvider theme={theme}>
      <View style={styles.safeArea}>
        <StatusBar style="dark" />
        
        <Surface style={styles.header} elevation={0}>
          <Text variant="headlineLarge" style={styles.headerTitle}>UK Tide Times</Text>
          {selectedStation && (
            <Text variant="titleMedium" style={styles.headerSubtitle}>{selectedStation.name}</Text>
          )}
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

            {selectedStation && (
              <View style={styles.tideInfo}>
                <Surface style={styles.dateNav} elevation={0}>
                  <IconButton
                    icon="chevron-left"
                    mode="contained"
                    containerColor="rgba(0, 122, 255, 0.1)"
                    iconColor="#007AFF"
                    size={24}
                    onPress={() => handleDateChange(-1)}
                  />
                  <Text variant="titleMedium" style={styles.dateText}>
                    {format(selectedDate, 'EEEE, d MMMM yyyy')}
                  </Text>
                  <IconButton
                    icon="chevron-right"
                    mode="contained"
                    containerColor="rgba(0, 122, 255, 0.1)"
                    iconColor="#007AFF"
                    size={24}
                    onPress={() => handleDateChange(1)}
                  />
                </Surface>

                <View style={styles.tidesGrid}>
                  {tideData.map((tide, index) => (
                    <Surface key={index} style={styles.tideCard} elevation={0}>
                      <View style={styles.tideHeader}>
                        <View style={[
                          styles.tideType,
                          { backgroundColor: tide.type === 'high' ? 'rgba(0, 122, 255, 0.1)' : 'rgba(88, 86, 214, 0.1)' }
                        ]}>
                          <Text style={[
                            styles.tideTypeText,
                            { color: tide.type === 'high' ? '#007AFF' : '#5856D6' }
                          ]}>
                            {tide.type === 'high' ? '🌊 High Tide' : '⬇️ Low Tide'}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.tideDetails}>
                        <Text variant="displaySmall" style={styles.heightText}>
                          {tide.height.toFixed(1)}m
                        </Text>
                        <Text variant="titleLarge" style={styles.timeText}>
                          {format(new Date(tide.time), 'HH:mm')}
                        </Text>
                      </View>
                    </Surface>
                  ))}
                </View>
              </View>
            )}

            {!selectedStation && (
              <Surface style={styles.welcomeCard} elevation={0}>
                <Text variant="headlineSmall" style={styles.welcomeTitle}>
                  Welcome to UK Tide Times
                </Text>
                <Text variant="bodyLarge" style={styles.welcomeText}>
                  Search for a location above to view tide times and heights.
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
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({
      ios: 60,
      android: 48,
      default: 24,
    }),
    paddingBottom: 16,
    backgroundColor: 'rgba(242, 242, 247, 0.92)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(60, 60, 67, 0.29)',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.41,
  },
  headerSubtitle: {
    fontSize: 20,
    color: '#8E8E93',
    marginTop: 4,
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
    flex: 1,
    textAlign: 'center',
    color: '#000000',
    fontSize: 17,
    letterSpacing: -0.41,
  },
  tidesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tideCard: {
    flex: 1,
    minWidth: Platform.select({ web: 300, default: '45%' }),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  tideHeader: {
    marginBottom: 16,
  },
  tideType: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tideTypeText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.24,
  },
  tideDetails: {
    alignItems: 'center',
  },
  heightText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.41,
  },
  timeText: {
    fontSize: 28,
    color: '#8E8E93',
    marginTop: 8,
  },
  welcomeCard: {
    padding: 24,
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    textAlign: 'center',
    color: '#8E8E93',
  },
});
