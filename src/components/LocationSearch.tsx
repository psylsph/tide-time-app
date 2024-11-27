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

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    searchContainer: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    searchBar: {
      elevation: 0,
      borderRadius: 12,
      backgroundColor: 'transparent',
    },
    searchInput: {
      fontFamily: 'Poppins_400Regular',
      fontSize: 16,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    resultsContainer: {
      marginTop: 8,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      ...Platform.select({
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
      }),
    },
    listItem: {
      paddingVertical: 8,
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
          placeholderTextColor={theme.colors.onSurfaceVariant}
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
                titleStyle={[
                  styles.listItemTitle,
                  station.id === currentStationId && {
                    color: theme.colors.primary,
                  }
                ]}
                descriptionStyle={[
                  styles.listItemDescription,
                  station.id === currentStationId && {
                    color: theme.colors.secondary,
                  }
                ]}
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
              />
            ))
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>
                No locations found
              </Text>
            </View>
          )}
        </Surface>
      )}
    </View>
  );
};
