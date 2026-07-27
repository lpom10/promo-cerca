import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permiso de ubicación denegado.');
          setIsLoading(false);
          return;
        }

        // Intentar obtener la última ubicación conocida para no bloquear emuladores
        let initialLocation = await Location.getLastKnownPositionAsync({});
        
        if (!initialLocation) {
          // Si no hay última, pedimos la actual con precisión balanceada
          initialLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        if (initialLocation) {
          setLocation({
            latitude: initialLocation.coords.latitude,
            longitude: initialLocation.coords.longitude,
          });
        }
        setIsLoading(false);

        // Opcional: Suscribirse a cambios si se requiere
        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 50,
          },
          (newLocation) => {
            setLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            });
          }
        );
      } catch (error: any) {
        setErrorMsg('Error obteniendo la ubicación: ' + error.message);
        setIsLoading(false);
      }
    };

    startWatching();

    return () => {
      if (subscriber) {
        subscriber.remove();
      }
    };
  }, []);

  return { location, errorMsg, isLoading };
};
