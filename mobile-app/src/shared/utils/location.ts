export interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * Calcula la distancia entre dos coordenadas en kilómetros usando la fórmula de Haversine.
 */
export const calculateDistance = (coord1: Coords, coord2: Coords): number => {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (coord2.latitude - coord1.latitude) * (Math.PI / 180);
  const dLon = (coord2.longitude - coord1.longitude) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * (Math.PI / 180)) * Math.cos(coord2.latitude * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distancia en kilómetros
  
  return distance;
};

/**
 * Formatea la distancia a un string legible.
 */
export const formatDistance = (distanceInKm: number): string => {
  if (distanceInKm < 1) {
    // Convertir a metros si es menor a 1 km
    return `${Math.round(distanceInKm * 1000)} m`;
  }
  return `${distanceInKm.toFixed(1)} km`;
};
