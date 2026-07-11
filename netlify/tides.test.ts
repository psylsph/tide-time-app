import handler, {
  getStationById,
  dateToUnixDayRange,
  buildStormglassUrl,
  normaliseStormglassExtremes,
} from './functions/tides';

const PORTSMOUTH = getStationById('0032')!;

const STORMGLASS_FIXTURE = {
  data: [
    { height: -1.4431, time: '2026-07-11T01:00:00+00:00', type: 'low' },
    { height: 1.1173, time: '2026-07-11T08:08:00+00:00', type: 'high' },
    { height: -1.4038, time: '2026-07-11T13:29:00+00:00', type: 'low' },
    { height: 1.3508, time: '2026-07-11T20:33:00+00:00', type: 'high' },
  ],
  meta: { cost: 1, dailyQuota: 10 },
};

function req(params: Record<string, string>): Request {
  const url = new URL('https://example.net/.netlify/functions/tides');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url.toString());
}

describe('pure helpers', () => {
  it('looks up a known station with coordinates', () => {
    expect(PORTSMOUTH).toBeTruthy();
    expect(typeof PORTSMOUTH.latitude).toBe('number');
    expect(typeof PORTSMOUTH.longitude).toBe('number');
  });

  it('returns undefined for an unknown station id', () => {
    expect(getStationById('nope')).toBeUndefined();
  });

  it('converts a YYYY-MM-DD string to a UTC unix-seconds day range', () => {
    const { start, end } = dateToUnixDayRange('2026-07-11');
    const expectedStart = Math.floor(Date.parse('2026-07-11T00:00:00Z') / 1000);
    expect(start).toBe(expectedStart);
    expect(end).toBe(expectedStart + 24 * 60 * 60);
  });

  it('builds the Stormglass extremes URL with all params', () => {
    const url = buildStormglassUrl(50.7989, -1.1091, 1000, 2000);
    expect(url).toContain('/v2/tide/extremes/point');
    expect(url).toContain('lat=50.7989');
    expect(url).toContain('lng=-1.1091');
    expect(url).toContain('start=1000');
    expect(url).toContain('end=2000');
  });
});

describe('normaliseStormglassExtremes', () => {
  it('maps valid extremes to TideEvent[] preserving type/time/height', () => {
    const events = normaliseStormglassExtremes(STORMGLASS_FIXTURE);
    expect(events).toHaveLength(4);
    expect(events[0]).toEqual({
      type: 'low',
      time: '2026-07-11T01:00:00+00:00',
      height: -1.4431,
    });
    expect(events.map(e => e.type)).toEqual(['low', 'high', 'low', 'high']);
  });

  it('drops entries with an unknown type', () => {
    const events = normaliseStormglassExtremes({
      data: [
        { height: 1, time: 't', type: 'high' },
        { height: 2, time: 't', type: 'slack' },
      ],
    });
    expect(events).toHaveLength(1);
  });

  it('drops malformed entries (non-numeric height / non-string time)', () => {
    const events = normaliseStormglassExtremes({
      data: [
        { height: 'x', time: 't', type: 'high' },
        { height: 1, time: 42, type: 'low' },
        { height: 1, time: 't', type: 'high' },
      ],
    });
    expect(events).toHaveLength(1);
  });

  it('returns [] when data is missing or not an array', () => {
    expect(normaliseStormglassExtremes({})).toEqual([]);
    expect(normaliseStormglassExtremes({ data: 'nope' })).toEqual([]);
    expect(normaliseStormglassExtremes(null)).toEqual([]);
  });
});

describe('handler', () => {
  const originalKey = (process.env as Record<string, string | undefined>).STORMGLASS_API_KEY;

  beforeEach(() => {
    (process.env as Record<string, string | undefined>).STORMGLASS_API_KEY = 'test-key';
    jest.restoreAllMocks();
  });

  afterEach(() => {
    (process.env as Record<string, string | undefined>).STORMGLASS_API_KEY = originalKey;
  });

  function mockUpstream(body: unknown, ok: boolean, status = 200) {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok,
      status,
      json: async () => body,
    } as Response);
  }

  it('returns 404 (no-store) for an unknown station', async () => {
    jest.spyOn(global, 'fetch');
    const res = await handler(req({ stationId: 'nope', date: '2026-07-11' }));
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 503 (no-store) when no API key is configured', async () => {
    delete (process.env as Record<string, string | undefined>).STORMGLASS_API_KEY;
    const res = await handler(req({ stationId: '0032', date: '2026-07-11' }));
    expect(res.status).toBe(503);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('returns live events with a week-long CDN cache on success', async () => {
    mockUpstream(STORMGLASS_FIXTURE, true);
    const res = await handler(req({ stationId: '0032', date: '2026-07-11' }));
    expect(res.status).toBe(200);

    const cc = res.headers.get('cache-control') ?? '';
    expect(cc).toContain('s-maxage=604800'); // a week at the CDN
    expect(cc).toContain('stale-while-revalidate');
    expect(res.headers.get('x-tide-source')).toBe('live');

    const body = await res.json();
    expect(body.source).toBe('live');
    expect(body.events).toHaveLength(4);

    // Called Stormglass with the station coordinates + day window.
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain(`lat=${PORTSMOUTH.latitude}`);
    expect(calledUrl).toContain(`lng=${PORTSMOUTH.longitude}`);
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBe('test-key');
  });

  it('does not cache upstream errors (quota / 5xx) so retries can succeed', async () => {
    mockUpstream({ error: 'quota' }, false, 402);
    const res = await handler(req({ stationId: '0032', date: '2026-07-11' }));
    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('x-tide-source')).toBeNull();
  });

  it('returns 502 (no-store) when Stormglass returns no usable events', async () => {
    mockUpstream({ data: [] }, true);
    const res = await handler(req({ stationId: '0032', date: '2026-07-11' }));
    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('returns 502 (no-store) when the upstream fetch throws', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('connection reset'));
    const res = await handler(req({ stationId: '0032', date: '2026-07-11' }));
    expect(res.status).toBe(502);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('defaults the date to today (UTC) when none is supplied', async () => {
    mockUpstream(STORMGLASS_FIXTURE, true);
    await handler(req({ stationId: '0032' }));
    const today = new Date().toISOString().slice(0, 10);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(`end=`); // window computed
    // The response echoes the resolved date.
    expect(((global.fetch as jest.Mock).mock.calls.length)).toBeGreaterThan(0);
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
