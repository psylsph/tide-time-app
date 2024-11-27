import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Searchbar, List, Surface, useTheme, Text } from 'react-native-paper';
import { ukTideStations } from '../data/ukTideStations';

interface LocationSearchProps {
  onLocationSelect: (station: typeof ukTideStations[0]) => void;
  currentStationId: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  currentStationId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const theme = useTheme();

  const filteredStations = searchQuery
    ? ukTideStations.filter(
        station =>
          station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          station.region.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleStationSelect = useCallback((station: typeof ukTideStations[0]) => {
    onLocationSelect(station);
    setSearchQuery('');
    setIsSearchFocused(false);
  }, [onLocationSelect]);

  return (
    <View style={styles.container}>
      <Surface style={[styles.searchContainer, { backgroundColor: theme.colors.elevation.level1 }]}>
        <Searchbar
          placeholder="Search for a location..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={theme.colors.primary}
          onFocus={() => setIsSearchFocused(true)}
          elevation={0}
        />
      </Surface>

      {isSearchFocused && searchQuery && (
        <Surface style={styles.resultsContainer}>
          {filteredStations.length > 0 ? (
            filteredStations.map((station) => (
              <List.Item
                key={station.id}
                title={station.name}
                description={station.region}
                onPress={() => handleStationSelect(station)}
                left={props => (
                  <List.Icon
                    {...props}
                    icon="map-marker"
                    color={station.id === currentStationId ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                )}
                style={[
                  styles.listItem,
                  station.id === currentStationId && styles.selectedItem
                ]}
                titleStyle={[
                  styles.listItemTitle,
                  station.id === currentStationId && styles.selectedItemText
                ]}
                descriptionStyle={styles.listItemDescription}
              />
            ))
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No locations found</Text>
            </View>
          )}
        </Surface>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      default: {
        elevation: 2,
      },
    }),
  },
  searchBar: {
    backgroundColor: 'transparent',
    elevation: 0,
  },
  searchInput: {
    fontSize: 17,
    letterSpacing: -0.41,
  },
  resultsContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      default: {
        elevation: 2,
      },
    }),
  },
  listItem: {
    paddingVertical: 8,
  },
  selectedItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  listItemTitle: {
    fontSize: 17,
    letterSpacing: -0.41,
    marginBottom: 2,
  },
  selectedItemText: {
    color: '#007AFF',
  },
  listItemDescription: {
    fontSize: 15,
    letterSpacing: -0.24,
  },
  noResults: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 17,
    color: '#8E8E93',
    letterSpacing: -0.41,
  },
});
