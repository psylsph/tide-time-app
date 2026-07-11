// Canonical tide domain types shared across the app.

export type TideEventType = 'high' | 'low';

export interface TideEvent {
  /** 'high' (high water) or 'low' (low water). */
  type: TideEventType;
  /** ISO-8601 timestamp of the event. */
  time: string;
  /** Predicted height in metres (relative to MSL for live Stormglass data). */
  height: number;
}

/** Where a given tide result came from. */
export type TideDataSource = 'live' | 'demo';

/** Result of fetching tide data: the events plus their provenance. */
export interface TideDataResult {
  events: TideEvent[];
  source: TideDataSource;
}
