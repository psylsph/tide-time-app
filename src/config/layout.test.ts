import {
  MAX_CONTENT_WIDTH,
  CONTENT_BREAKPOINT,
  TIDAL_PERIOD_MIN,
  DEFAULT_CURVE_POINTS,
  SEARCH_RESULTS_LIMIT,
} from './layout';

describe('layout constants', () => {
  it('capped content width is narrower than the desktop breakpoint', () => {
    expect(MAX_CONTENT_WIDTH).toBeLessThan(CONTENT_BREAKPOINT);
  });

  it('all dimensions are positive and finite', () => {
    for (const n of [MAX_CONTENT_WIDTH, CONTENT_BREAKPOINT, TIDAL_PERIOD_MIN, DEFAULT_CURVE_POINTS]) {
      expect(Number.isFinite(n)).toBe(true);
      expect(n).toBeGreaterThan(0);
    }
  });

  it('the tidal half-period models a semidiurnal tide (~6h12m)', () => {
    // 6h * 60 = 360, plus ~12 minutes => [360, 390)
    expect(TIDAL_PERIOD_MIN).toBeGreaterThanOrEqual(360);
    expect(TIDAL_PERIOD_MIN).toBeLessThan(390);
  });

  it('the curve is sampled with enough points to be smooth', () => {
    expect(DEFAULT_CURVE_POINTS).toBeGreaterThanOrEqual(10);
  });

  it('the search limit is a sane small number', () => {
    expect(SEARCH_RESULTS_LIMIT).toBeGreaterThanOrEqual(3);
    expect(SEARCH_RESULTS_LIMIT).toBeLessThanOrEqual(20);
  });
});
