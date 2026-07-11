import * as Location from 'expo-location';
import {
  locateNearestStation,
  LocationPermissionDeniedError,
  LocationUnavailableError,
} from './locationService';
import { ukTideStations } from '../data/ukTideStations';

const requestPerms = jest.mocked(Location.requestForegroundPermissionsAsync);
const getPosition = jest.mocked(Location.getCurrentPositionAsync);

const PORTSMOUTH = ukTideStations.find(s => s.id === '0032')!;

describe('locateNearestStation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws LocationPermissionDeniedError when permission is not granted', async () => {
    requestPerms.mockResolvedValue({ status: 'denied' } as never);

    await expect(locateNearestStation(ukTideStations)).rejects.toBeInstanceOf(
      LocationPermissionDeniedError,
    );
    // Should not attempt to read the position if we never got permission.
    expect(getPosition).not.toHaveBeenCalled();
  });

  it('resolves to the nearest station with a distance', async () => {
    requestPerms.mockResolvedValue({ status: 'granted' } as never);
    // Query from just off Portsmouth -> Portsmouth, a few hundred metres away.
    getPosition.mockResolvedValue({
      coords: { latitude: PORTSMOUTH.latitude + 0.001, longitude: PORTSMOUTH.longitude + 0.001 },
    } as never);

    const result = await locateNearestStation(ukTideStations);

    expect(result.station.id).toBe('0032');
    expect(result.distanceKm).toBeGreaterThan(0);
    // ~0.001 deg ~ 0.1 km in the UK.
    expect(result.distanceKm).toBeLessThan(1);
  });

  it('throws LocationUnavailableError when the device returns no coordinates', async () => {
    requestPerms.mockResolvedValue({ status: 'granted' } as never);
    getPosition.mockResolvedValue({ coords: {} } as never);

    await expect(locateNearestStation(ukTideStations)).rejects.toBeInstanceOf(
      LocationUnavailableError,
    );
  });

  it('throws LocationUnavailableError when there are no stations to match', async () => {
    requestPerms.mockResolvedValue({ status: 'granted' } as never);
    getPosition.mockResolvedValue({
      coords: { latitude: 50.8, longitude: -1.1 },
    } as never);

    await expect(locateNearestStation([])).rejects.toBeInstanceOf(LocationUnavailableError);
  });

  it('picks the closest of several stations across the real dataset', async () => {
    requestPerms.mockResolvedValue({ status: 'granted' } as never);
    // Query from the sea off Newquay -> Newquay (id 0019), not Plymouth.
    getPosition.mockResolvedValue({
      coords: { latitude: 50.4155, longitude: -5.0828 },
    } as never);

    const result = await locateNearestStation(ukTideStations);
    expect(result.station.id).toBe('0019');
  });
});
