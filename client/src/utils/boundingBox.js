const EARTH_RADIUS_KM = 6371;

export const getBoundingBox = (lat, lng, radiusKm) => {
  const latDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos((lat * Math.PI) / 180);
  return {
    swLat: lat - latDelta,
    swLng: lng - lngDelta,
    neLat: lat + latDelta,
    neLng: lng + lngDelta,
  };
};
