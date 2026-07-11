import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { LocationSearch } from './LocationSearch';
import { ukTideStations } from '../data/ukTideStations';
import { SEARCH_RESULTS_LIMIT } from '../config/layout';

function renderWith(ui: React.ReactElement) {
  return render(<PaperProvider>{ui}</PaperProvider>);
}

const PORTSMOUTH = ukTideStations.find(s => s.id === '0032')!;

describe('LocationSearch', () => {
  it('renders the search input', () => {
    renderWith(<LocationSearch onLocationSelect={jest.fn()} currentStationId="" />);
    expect(screen.getByPlaceholderText('Search for a location...')).toBeTruthy();
  });

  it('shows matching stations by name as the user types', async () => {
    renderWith(<LocationSearch onLocationSelect={jest.fn()} currentStationId="" />);
    const input = screen.getByPlaceholderText('Search for a location...');
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'Ports');

    await waitFor(() => {
      expect(screen.getByText('Portsmouth')).toBeTruthy();
      expect(screen.queryByText('Aberdeen')).toBeNull();
    });
  });

  it('matches by region too', async () => {
    renderWith(<LocationSearch onLocationSelect={jest.fn()} currentStationId="" />);
    const input = screen.getByPlaceholderText('Search for a location...');
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'cornwall');

    await waitFor(() => {
      expect(screen.getByText('Falmouth')).toBeTruthy();
      expect(screen.getByText('Newquay')).toBeTruthy();
    });
  });

  it('shows a no-results message when nothing matches', async () => {
    renderWith(<LocationSearch onLocationSelect={jest.fn()} currentStationId="" />);
    const input = screen.getByPlaceholderText('Search for a location...');
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'zzzznotaplace');

    await waitFor(() => {
      expect(screen.getByText('No locations found')).toBeTruthy();
    });
  });

  it('calls onLocationSelect with the chosen station and clears the query', async () => {
    const onLocationSelect = jest.fn();
    renderWith(<LocationSearch onLocationSelect={onLocationSelect} currentStationId="" />);

    const input = screen.getByPlaceholderText('Search for a location...');
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'Portsmouth');

    // Press the row itself (Pressable needs the press on the row element).
    const row = await screen.findByTestId('station-0032');
    fireEvent.press(row);

    expect(onLocationSelect).toHaveBeenCalledWith(PORTSMOUTH);
    // Search field is cleared after selection.
    expect((screen.getByPlaceholderText('Search for a location...').props as { value?: string }).value ?? '').toBe('');
  });

  it('caps the rendered results to SEARCH_RESULTS_LIMIT', async () => {
    renderWith(<LocationSearch onLocationSelect={jest.fn()} currentStationId="" />);
    const input = screen.getByPlaceholderText('Search for a location...');
    fireEvent(input, 'focus');
    // 'a' matches well more than the limit across names + regions.
    fireEvent.changeText(input, 'a');

    await waitFor(() => {
      const matches = ukTideStations.filter(
        s => s.name.toLowerCase().includes('a') || s.region.toLowerCase().includes('a'),
      );
      const rendered = matches.filter(s => screen.queryAllByText(s.name).length > 0);
      expect(rendered.length).toBe(Math.min(matches.length, SEARCH_RESULTS_LIMIT));
    });
  });

  it('does not show a dropdown before the search field is focused', () => {
    renderWith(<LocationSearch onLocationSelect={jest.fn()} currentStationId="" />);
    expect(screen.queryByText('Portsmouth')).toBeNull();
  });

  describe('detect-location button', () => {
    it('is hidden when no onDetectLocation handler is provided', () => {
      renderWith(<LocationSearch onLocationSelect={jest.fn()} currentStationId="" />);
      expect(screen.queryByTestId('detect-location-button')).toBeNull();
    });

    it('renders when an onDetectLocation handler is provided', () => {
      renderWith(
        <LocationSearch
          onLocationSelect={jest.fn()}
          currentStationId=""
          onDetectLocation={jest.fn()}
        />,
      );
      expect(screen.getByTestId('detect-location-button')).toBeTruthy();
      expect(screen.getByLabelText('Use my location')).toBeTruthy();
    });

    it('calls onDetectLocation when pressed', () => {
      const onDetectLocation = jest.fn();
      renderWith(
        <LocationSearch
          onLocationSelect={jest.fn()}
          currentStationId=""
          onDetectLocation={onDetectLocation}
        />,
      );

      fireEvent.press(screen.getByTestId('detect-location-button'));
      expect(onDetectLocation).toHaveBeenCalledTimes(1);
    });

    it('shows a spinner while detecting (and not when idle)', () => {
      // Detecting -> spinner shown.
      const { rerender } = renderWith(
        <LocationSearch
          onLocationSelect={jest.fn()}
          currentStationId=""
          onDetectLocation={jest.fn()}
          isDetecting
        />,
      );
      expect(screen.getByTestId('detect-spinner')).toBeTruthy();

      // Idle -> spinner gone.
      rerender(
        <PaperProvider>
          <LocationSearch
            onLocationSelect={jest.fn()}
            currentStationId=""
            onDetectLocation={jest.fn()}
          />
        </PaperProvider>,
      );
      expect(screen.queryByTestId('detect-spinner')).toBeNull();
    });
  });
});
