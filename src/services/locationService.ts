import * as Location from 'expo-location';
import type { TideStation } from '../data/ukTideStations';
import { findNearestStation, getDistanceFromLatLonInKm } from '../utils/locationUtils';

/**
 * Thrown when the user declined (or has not granted) the location permission.
 */
export class LocationPermissionDeniedError extends Error {
  constructor(message = 'Permission to access location was denied') {
    super(message);
    this.name = 'LocationPermissionDeniedError';
    // Restore the prototype chain (lost when extending built-ins on some targets).
    Object.setPrototypeOf(this, LocationPermissionDeniedError.prototype);
  }
}

/**
 * Thrown when a position could not be obtained (services disabled, timeout,
 * or the device returned no coordinates).
 */
export class LocationUnavailableError extends Error {
  constructor(message = "Couldn't get your location right now") {
    super(message);
    this.name = 'LocationUnavailableError';
    Object.setPrototypeOf(this, LocationUnavailableError.prototype);
  }
}

export interface NearestStationResult {
  station: TideStation;
  /** Straight-line distance from the user's position to the station, in km. */
  distanceKm: number;
}

/**
 * Requests location permission (only when invoked — never on launch), reads the
 * current position once, and resolves to the nearest tide station.
 *
 * Works on both native (via the Expo modules) and web (expo-location falls back
 * to `navigator.geolocation` + `navigator.permissions`).
 *
 * @throws {LocationPermissionDeniedError} if the user did not grant permission.
 * @throws {LocationUnavailableError} if no position or no matching station.
 */
export async function locateNearestStation(
  stations: TideStation[],
): Promise<NearestStationResult> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new LocationPermissionDeniedError();
  }

  const position = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = position.coords;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new LocationUnavailableError();
  }

  const station = findNearestStation(latitude, longitude, stations);
  if (!station) {
    throw new LocationUnavailableError('No tide stations available');
  }

  return {
    station,
    distanceKm: getDistanceFromLatLonInKm(latitude, longitude, station.latitude, station.longitude),
  };
}
