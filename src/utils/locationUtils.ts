import { TideStation } from '../data/ukTideStations';

// Haversine formula to calculate distance between two points
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function findNearestStation(latitude: number, longitude: number, stations: TideStation[]): TideStation | null {
  if (!stations.length) return null;

  let nearestStation = stations[0];
  let shortestDistance = getDistanceFromLatLonInKm(
    latitude,
    longitude,
    stations[0].latitude,
    stations[0].longitude
  );

  for (let i = 1; i < stations.length; i++) {
    const distance = getDistanceFromLatLonInKm(
      latitude,
      longitude,
      stations[i].latitude,
      stations[i].longitude
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestStation = stations[i];
    }
  }

  return nearestStation;
}
