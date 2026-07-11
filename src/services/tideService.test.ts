import { getTideData, getDemoTideData, __clearTideCacheForTests } from './tideService';
import { TIDAL_PERIOD_MIN } from '../config/layout';
import type { TideEvent } from '../types/tide';

const PORTSMOUTH = '0032';
const PLYMOUTH = '0012';
const ABERDEEN = '0152';
const DAY = new Date(2026, 6, 11);

// ---------------------------------------------------------------------------
// Demo model (the fallback): deterministic, station-specific, semidiurnal.
// ---------------------------------------------------------------------------

describe('getDemoTideData — shape', () => {
  const events = getDemoTideData(PORTSMOUTH, DAY);

  it('returns 3 or 4 events (semidiurnal tide)', () => {
    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events.length).toBeLessThanOrEqual(4);
  });

  it('every event has a valid type, height and ISO time', () => {
    for (const e of events) {
      expect(['high', 'low']).toContain(e.type);
      expect(typeof e.height).toBe('number');
      expect(e.height).toBeGreaterThanOrEqual(0);
      expect(new Date(e.time).toString()).not.toBe('Invalid Date');
    }
  });

  it('events alternate strictly between high and low', () => {
    for (let i = 1; i < events.length; i++) {
      expect(events[i].type).not.toBe(events[i - 1].type);
    }
  });

  it('events are strictly increasing in time', () => {
    for (let i = 1; i < events.length; i++) {
      expect(new Date(events[i].time).getTime()).toBeGreaterThan(
        new Date(events[i - 1].time).getTime(),
      );
    }
  });

  it('all events fall on the requested calendar day', () => {
    for (const e of events) {
      const d = new Date(e.time);
      expect(d.getFullYear()).toBe(DAY.getFullYear());
      expect(d.getMonth()).toBe(DAY.getMonth());
      expect(d.getDate()).toBe(DAY.getDate());
    }
  });

  it('the first event is within one tidal period of midnight', () => {
    const first = new Date(events[0].time);
    const firstMinutes = first.getHours() * 60 + first.getMinutes();
    expect(firstMinutes).toBeGreaterThanOrEqual(0);
    expect(firstMinutes).toBeLessThan(TIDAL_PERIOD_MIN);
  });
});

describe('getDemoTideData — heights are physically plausible', () => {
  const events = getDemoTideData(PORTSMOUTH, DAY);
  const highs = events.filter(e => e.type === 'high');
  const lows = events.filter(e => e.type === 'low');

  it('every high water is higher than every low water', () => {
    expect(Math.min(...highs.map(h => h.height))).toBeGreaterThan(
      Math.max(...lows.map(l => l.height)),
    );
  });

  it('keeps heights in a realistic UK range', () => {
    for (const h of highs) expect(h.height).toBeLessThanOrEqual(8.5);
    for (const l of lows) expect(l.height).toBeLessThanOrEqual(2.2);
  });

  it('heights are rounded to one decimal place', () => {
    for (const e of events) expect(Math.round(e.height * 10) / 10).toBe(e.height);
  });
});

describe('getDemoTideData — determinism', () => {
  it('returns identical output for the same station + day', () => {
    expect(getDemoTideData(PORTSMOUTH, DAY)).toEqual(getDemoTideData(PORTSMOUTH, DAY));
  });

  it('is independent of the time-of-day of the passed date', () => {
    expect(getDemoTideData(PORTSMOUTH, new Date(2026, 6, 11, 6, 30))).toEqual(
      getDemoTideData(PORTSMOUTH, new Date(2026, 6, 11, 23, 59)),
    );
  });

  it('produces station-specific data', () => {
    const snapshots = ['0032', '0012', '0152', '0088', '0175'].map(id =>
      JSON.stringify(getDemoTideData(id, DAY)),
    );
    expect(new Set(snapshots).size).toBeGreaterThan(1);
  });

  it('produces date-specific data for the same port', () => {
    expect(getDemoTideData(PORTSMOUTH, new Date(2026, 6, 11))).not.toEqual(
      getDemoTideData(PORTSMOUTH, new Date(2026, 6, 12)),
    );
  });
});

// ---------------------------------------------------------------------------
// Live fetch (async) with demo fallback + caching.
// ---------------------------------------------------------------------------

const LIVE_EVENTS: TideEvent[] = [
  { type: 'low', time: '2026-07-11T01:00:00+00:00', height: -1.4 },
  { type: 'high', time: '2026-07-11T08:08:00+00:00', height: 1.1 },
  { type: 'low', time: '2026-07-11T13:29:00+00:00', height: -1.4 },
  { type: 'high', time: '2026-07-11T20:33:00+00:00', height: 1.35 },
];

function mockFetchOk(body: unknown) {
  return jest
    .spyOn(global, 'fetch')
    .mockResolvedValue({ ok: true, status: 200, json: async () => body } as Response);
}

describe('getTideData — live path', () => {
  beforeEach(() => {
    __clearTideCacheForTests();
    jest.restoreAllMocks();
  });

  it('returns live events when the endpoint responds with source "live"', async () => {
    mockFetchOk({ source: 'live', events: LIVE_EVENTS });

    const result = await getTideData(PORTSMOUTH, DAY);

    expect(result.source).toBe('live');
    expect(result.events).toEqual(LIVE_EVENTS);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('passes stationId and date as query params', async () => {
    const spy = mockFetchOk({ source: 'live', events: LIVE_EVENTS });
    await getTideData(PORTSMOUTH, DAY);
    const calledUrl = spy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('stationId=0032');
    expect(calledUrl).toContain('date=2026-07-11');
  });

  it('caches successful live results for the session (no second fetch)', async () => {
    mockFetchOk({ source: 'live', events: LIVE_EVENTS });
    await getTideData(PORTSMOUTH, DAY);
    await getTideData(PORTSMOUTH, DAY); // cached
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('caches per (station, date): a different day refetches', async () => {
    mockFetchOk({ source: 'live', events: LIVE_EVENTS });
    await getTideData(PORTSMOUTH, new Date(2026, 6, 11));
    await getTideData(PORTSMOUTH, new Date(2026, 6, 12));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('getTideData — demo fallback', () => {
  beforeEach(() => {
    __clearTideCacheForTests();
    jest.restoreAllMocks();
  });

  it('falls back to demo data when fetch rejects', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
    const result = await getTideData(PORTSMOUTH, DAY);
    expect(result.source).toBe('demo');
    expect(result.events).toEqual(getDemoTideData(PORTSMOUTH, DAY));
  });

  it('falls back to demo data when the endpoint is not ok', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({}),
    } as Response);
    const result = await getTideData(PORTSMOUTH, DAY);
    expect(result.source).toBe('demo');
  });

  it('falls back to demo data when the payload is malformed', async () => {
    mockFetchOk({ source: 'unexpected', events: [] });
    const result = await getTideData(PORTSMOUTH, DAY);
    expect(result.source).toBe('demo');
  });

  it('does not cache demo fallbacks (a later live call can succeed)', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('down'));
    await getTideData(PORTSMOUTH, DAY); // demo
    mockFetchOk({ source: 'live', events: LIVE_EVENTS });
    const result = await getTideData(PORTSMOUTH, DAY); // should retry and go live
    expect(result.source).toBe('live');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
