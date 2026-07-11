import { ukTideStations } from './ukTideStations';
import type { TideStation } from './ukTideStations';

describe('ukTideStations dataset integrity', () => {
  it('contains at least 60 stations (README claims 60+)', () => {
    expect(ukTideStations.length).toBeGreaterThanOrEqual(60);
  });

  it('has unique station ids', () => {
    const ids = ukTideStations.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every station has a non-empty id, name and region', () => {
    for (const s of ukTideStations) {
      expect(s.id.length).toBeGreaterThan(0);
      expect(s.name.trim().length).toBeGreaterThan(0);
      expect(s.region.trim().length).toBeGreaterThan(0);
    }
  });

  it('every station has numeric latitude/longitude within UK bounds', () => {
    for (const s of ukTideStations) {
      expect(typeof s.latitude).toBe('number');
      expect(typeof s.longitude).toBe('number');
      // mainland UK + NI roughly spans these ranges.
      expect(s.latitude).toBeGreaterThanOrEqual(49);
      expect(s.latitude).toBeLessThanOrEqual(61);
      expect(s.longitude).toBeGreaterThanOrEqual(-9);
      expect(s.longitude).toBeLessThanOrEqual(2);
    }
  });

  it('ids are zero-padded 4-digit strings', () => {
    for (const s of ukTideStations) {
      expect(s.id).toMatch(/^\d{4}$/);
    }
  });

  it('contains well-known ports used elsewhere in the app', () => {
    const ids = new Set(ukTideStations.map(s => s.id));
    expect(ids.has('0032')).toBe(true); // Portsmouth
    expect(ids.has('0012')).toBe(true); // Plymouth
    expect(ids.has('0152')).toBe(true); // Aberdeen
  });

  it('exposes a TideStation with the expected shape', () => {
    const sample: TideStation = ukTideStations[0];
    expect(Object.keys(sample).sort()).toEqual(
      ['id', 'latitude', 'longitude', 'name', 'region'],
    );
  });
});
