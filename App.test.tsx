import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import * as Location from 'expo-location';
import App from './App';
import { __clearTideCacheForTests } from './src/services/tideService';
import type { TideEvent } from './src/types/tide';

const requestPerms = jest.mocked(Location.requestForegroundPermissionsAsync);
const getPosition = jest.mocked(Location.getCurrentPositionAsync);

const LIVE_EVENTS: TideEvent[] = [
  { type: 'low', time: '2026-07-11T01:00:00+00:00', height: -1.4 },
  { type: 'high', time: '2026-07-11T08:08:00+00:00', height: 1.1 },
  { type: 'low', time: '2026-07-11T13:29:00+00:00', height: -1.4 },
  { type: 'high', time: '2026-07-11T20:33:00+00:00', height: 1.35 },
];

function grantLocation(lat: number, lon: number) {
  requestPerms.mockResolvedValue({ status: 'granted' } as never);
  getPosition.mockResolvedValue({ coords: { latitude: lat, longitude: lon } } as never);
}

function mockFetchLive() {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ source: 'live', events: LIVE_EVENTS }),
  } as Response);
}

function mockFetchFailure() {
  jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
}

const detectButton = () => screen.getByTestId('detect-location-button');

beforeEach(() => {
  jest.clearAllMocks();
  __clearTideCacheForTests();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText('UK Tide Times')).toBeTruthy();
  });

  it('shows the welcome card and does not auto-prompt for location on launch', () => {
    render(<App />);
    expect(screen.getByText('Welcome to UK Tide Times')).toBeTruthy();
    // Detection is now opt-in via the button: no permission request until tapped.
    expect(requestPerms).not.toHaveBeenCalled();
  });

  it('detects the nearest beach when "Use my location" is tapped', async () => {
    grantLocation(50.7989, -1.1091); // -> Portsmouth
    mockFetchLive();
    render(<App />);

    fireEvent.press(detectButton());

    await waitFor(() => {
      expect(screen.getByText('Portsmouth')).toBeTruthy();
      expect(screen.getByText('Tide Levels')).toBeTruthy();
    });
  });

  it('shows a friendly message when location permission is denied', async () => {
    requestPerms.mockResolvedValue({ status: 'denied' } as never);
    render(<App />);

    fireEvent.press(detectButton());

    expect(await screen.findByText(/Location access denied/)).toBeTruthy();
  });

  it('falls back to demo data when the live tide fetch fails', async () => {
    grantLocation(50.7989, -1.1091);
    mockFetchFailure();
    render(<App />);

    fireEvent.press(detectButton());

    await waitFor(() => {
      expect(screen.getByText('Portsmouth')).toBeTruthy();
      expect(screen.getByText('Tide Levels')).toBeTruthy();
    });
  });

  it('shows a loading state, then the graph, as data resolves', async () => {
    grantLocation(50.7989, -1.1091);
    let resolveFetch!: (value: Response) => void;
    jest.spyOn(global, 'fetch').mockImplementation(
      () => new Promise<Response>(resolve => { resolveFetch = resolve; }),
    );
    render(<App />);

    fireEvent.press(detectButton());

    // Detection resolves -> station selected -> tide fetch is in flight.
    expect(await screen.findByText('Portsmouth')).toBeTruthy();
    expect(await screen.findByText('Loading tides…')).toBeTruthy();

    resolveFetch({
      ok: true,
      status: 200,
      json: async () => ({ source: 'live', events: LIVE_EVENTS }),
    } as Response);

    await waitFor(() => expect(screen.getByText('Tide Levels')).toBeTruthy());
  });
});
