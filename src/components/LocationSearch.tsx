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
      <Surface style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Searchbar
          placeholder="Search for a location..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={theme.colors.primary}
          onFocus={() => setIsSearchFocused(true)}
          elevation={0}
          theme={{
            colors: {
              ...theme.colors,
              surfaceVariant: 'rgba(30, 136, 229, 0.08)',
            },
          }}
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
                    color={station.id === currentStationId ? theme.colors.primary : theme.colors.secondary}
                  />
                )}
                style={[
                  styles.listItem,
                  station.id === currentStationId && {
                    backgroundColor: 'rgba(30, 136, 229, 0.08)',
                  }
                ]}
                titleStyle={[
                  styles.listItemTitle,
                  station.id === currentStationId && {
                    color: theme.colors.primary,
                    fontWeight: '500',
                  }
                ]}
                descriptionStyle={[
                  styles.listItemDescription,
                  station.id === currentStationId && {
                    color: theme.colors.secondary,
                  }
                ]}
              />
            ))
          ) : (
            <View style={styles.noResults}>
              <Text style={[styles.noResultsText, { color: theme.colors.secondary }]}>
                No locations found
              </Text>
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
    borderRadius: 16,
    overflow: 'hidden',
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
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: 300,
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
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 136, 229, 0.1)',
  },
  listItemTitle: {
    fontSize: 17,
    letterSpacing: -0.41,
    marginBottom: 2,
    color: '#1E88E5',
  },
  listItemDescription: {
    fontSize: 15,
    letterSpacing: -0.24,
    color: '#64B5F6',
  },
  noResults: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 17,
    letterSpacing: -0.41,
  },
});
