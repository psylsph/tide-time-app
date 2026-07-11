// Centralised layout + tide-model constants so magic numbers live in one place.

/** Maximum content width on large screens (tablets / desktop web). */
export const MAX_CONTENT_WIDTH = 680;

/** Window width (px) at which we switch from full-width to capped layout. */
export const CONTENT_BREAKPOINT = 744;

/**
 * Half of the semidiurnal tidal period, in minutes (~6h12m). Real UK tides see
 * roughly two highs and two lows per ~24h50m, with high<->low spaced about
 * 6h12m apart. Used by the demo tide model.
 */
export const TIDAL_PERIOD_MIN = 372;

/** Number of points sampled along the interpolated tide curve. */
export const DEFAULT_CURVE_POINTS = 50;

/** Maximum number of location-search results rendered in the dropdown. */
export const SEARCH_RESULTS_LIMIT = 8;
