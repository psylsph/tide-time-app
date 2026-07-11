import { findNearestStation, getDistanceFromLatLonInKm } from './locationUtils';
import type { TideStation } from '../data/ukTideStations';

function station(id: string, lat: number, lon: number, name = id, region = 'Test'): TideStation {
  return { id, name, region, latitude: lat, longitude: lon };
}

describe('findNearestStation', () => {
  it('returns null for an empty station list', () => {
    expect(findNearestStation(0, 0, [])).toBeNull();
  });

  it('returns the only station when given a single-element list', () => {
    const only = station('1', 50, -1);
    expect(findNearestStation(10, 10, [only])).toBe(only);
  });

  it('picks the closest of two nearby stations', () => {
    const near = station('near', 50.8, -1.1); // ~Portsmouth area
    const far = station('far', 51.5, -0.08); // ~London
    // Query right next to `near`.
    const result = findNearestStation(50.8001, -1.1001, [far, near]);
    expect(result).toBe(near);
  });

  it('returns the station when the query sits exactly on it', () => {
    const target = station('target', 55.8603, -4.2517); // Glasgow
    const others = [
      station('other1', 50, -1),
      station('other2', 53, -3),
    ];
    const result = findNearestStation(target.latitude, target.longitude, [...others, target]);
    expect(result).toBe(target);
  });

  it('respects longitude direction (east vs west)', () => {
    const east = station('east', 50.8, 1.3); // ~Deal, Kent
    const west = station('west', 50.8, -1.1); // ~Portsmouth
    // Query in the English Channel near Portsmouth.
    const result = findNearestStation(50.8, -1.11, [east, west]);
    expect(result).toBe(west);
  });

  it('works across the full UK station dataset (sanity)', () => {
    // Real dataset is imported lazily to keep the synthetic tests above focused.
    const { ukTideStations } = require('../data/ukTideStations');
    const portsmouth = ukTideStations.find((s: TideStation) => s.id === '0032')!;
    const result = findNearestStation(portsmouth.latitude + 0.001, portsmouth.longitude + 0.001, ukTideStations);
    expect(result?.id).toBe('0032');
  });

  it('does not mutate the input array', () => {
    const stations = [station('a', 1, 1), station('b', 2, 2)];
    const snapshot = stations.map(s => ({ ...s }));
    findNearestStation(0, 0, stations);
    expect(stations).toEqual(snapshot);
  });
});

describe('getDistanceFromLatLonInKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(getDistanceFromLatLonInKm(50.8, -1.1, 50.8, -1.1)).toBe(0);
  });

  it('is symmetric (a->b equals b->a)', () => {
    const a = getDistanceFromLatLonInKm(50.7989, -1.1091, 51.1279, 1.3134); // Portsmouth -> Dover
    const b = getDistanceFromLatLonInKm(51.1279, 1.3134, 50.7989, -1.1091);
    expect(a).toBeCloseTo(b, 6);
  });

  it('matches a known reference distance within tolerance', () => {
    // Portsmouth (50.7989, -1.1091) -> Dover (51.1279, 1.3134) ~ 170-175 km.
    const d = getDistanceFromLatLonInKm(50.7989, -1.1091, 51.1279, 1.3134);
    expect(d).toBeGreaterThan(165);
    expect(d).toBeLessThan(180);
  });
});
