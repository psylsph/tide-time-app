import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import { ukTideStations } from '../data/ukTideStations';
import type { TideStation } from '../data/ukTideStations';
import { SEARCH_RESULTS_LIMIT } from '../config/layout';
import { elevation } from '../styles/elevation';

interface LocationSearchProps {
  onLocationSelect: (station: TideStation) => void;
  currentStationId: string;
  /** When provided, a "use my location" button is shown in the search bar. */
  onDetectLocation?: () => void;
  /** Shows a spinner and disables the detect button while a lookup is in flight. */
  isDetecting?: boolean;
}

function Magnifier({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M10 2a8 8 0 1 0 4.95 14.32l5.36 5.37 1.42-1.42-5.37-5.36A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"
      />
    </Svg>
  );
}

// Material "gps-fixed" icon — tapping this detects the user's location.
function Crosshair({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3A8.99 8.99 0 0 0 13 3.06V1h-2v2.06A8.99 8.99 0 0 0 3.06 11H1v2h2.06A8.99 8.99 0 0 0 11 20.94V23h2v-2.06A8.99 8.99 0 0 0 20.94 13H23v-2h-2.06zM12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"
      />
    </Svg>
  );
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  currentStationId,
  onDetectLocation,
  isDetecting = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const theme = useTheme();

  const filteredStations = searchQuery
    ? ukTideStations
        .filter(
          station =>
            station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            station.region.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .slice(0, SEARCH_RESULTS_LIMIT)
    : [];

  const handleStationSelect = useCallback(
    (station: TideStation) => {
      onLocationSelect(station);
      setSearchQuery('');
      setIsSearchFocused(false);
    },
    [onLocationSelect],
  );

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surface,
      ...elevation(2),
    },
    magnifier: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontFamily: 'Poppins_400Regular',
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    detectButton: {
      marginLeft: 8,
      padding: 4,
    },
    resultsContainer: {
      marginTop: 8,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      ...elevation(2),
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    marker: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 12,
    },
    stationInfo: {
      flex: 1,
    },
    listItemTitle: {
      fontFamily: 'Poppins_500Medium',
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    listItemDescription: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    noResults: {
      padding: 16,
      alignItems: 'center',
    },
    noResultsText: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.magnifier}>
          <Magnifier color={theme.colors.primary} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a location..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={searchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onChangeText={setSearchQuery}
        />
        {onDetectLocation && (
          <Pressable
            testID="detect-location-button"
            accessibilityRole="button"
            accessibilityLabel="Use my location"
            accessibilityState={{ busy: isDetecting }}
            onPress={onDetectLocation}
            disabled={isDetecting}
            style={styles.detectButton}
          >
            {isDetecting ? (
              <ActivityIndicator testID="detect-spinner" color={theme.colors.primary} size="small" />
            ) : (
              <Crosshair color={theme.colors.primary} />
            )}
          </Pressable>
        )}
      </View>

      {isSearchFocused && searchQuery && (
        <View style={styles.resultsContainer}>
          {filteredStations.length > 0 ? (
            filteredStations.map(station => {
              const selected = station.id === currentStationId;
              return (
                <Pressable
                  key={station.id}
                  testID={`station-${station.id}`}
                  onPress={() => handleStationSelect(station)}
                  style={[styles.listItem, selected && { backgroundColor: 'rgba(30, 136, 229, 0.08)' }]}
                >
                  <View
                    style={[
                      styles.marker,
                      { backgroundColor: selected ? theme.colors.primary : theme.colors.secondary },
                    ]}
                  />
                  <View style={styles.stationInfo}>
                    <Text
                      style={[styles.listItemTitle, selected && { color: theme.colors.primary }]}
                    >
                      {station.name}
                    </Text>
                    <Text
                      style={[
                        styles.listItemDescription,
                        selected && { color: theme.colors.secondary },
                      ]}
                    >
                      {station.region}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No locations found</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};
