// Hook personalizado para geolocalización en tiempo real
import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: Date;
}

export interface GeoError {
  code: number;
  message: string;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  autoStart?: boolean;
}

const defaultOptions: Required<UseGeolocationOptions> = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
  watchPosition: true,
  autoStart: true,
};

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  // Fusionar opciones de forma estable
  const mergedOptions = { ...defaultOptions, ...options };
  
  // EXTRAER VARIABLES PRIMITIVAS AQUÍ para evitar errores en hooks
  const { autoStart, watchPosition, enableHighAccuracy, timeout, maximumAge } = mergedOptions;

  // Inicializar estado con valor seguro (false) y ajustar luego con useEffect si es necesario
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<GeoError | null>(null);
  const [loading, setLoading] = useState<boolean>(false); 
  const [isSupported, setIsSupported] = useState<boolean>(true);
  
  const watchId = useRef<number | null>(null);
  const callbackRef = useRef<((pos: GeoPosition) => void) | null>(null);

  // Verificar soporte del navegador
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setIsSupported(false);
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      });
      setLoading(false);
    }
  }, []);

  // APLICAR autoStart DESPUÉS DEL MONTAJE
  useEffect(() => {
    if (autoStart && isSupported) {
      // Llamamos a startWatching solo cuando el efecto corre
      // Nota: startWatching debe estar definido antes o manejado cuidadosamente
      // Para simplificar, llamaremos a la lógica interna directamente aquí o usamos la función expuesta
      startWatchingInternal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, isSupported]); // Solo dependemos de estos valores primitivos

  // Limpiar watcher al desmontar
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  // Lógica interna separada para evitar dependencias circulares complejas
  const startWatchingInternal = useCallback(() => {
    if (!isSupported) return;

    setLoading(true);
    setError(null);

    const successCallback = (geoPosition: GeolocationPosition) => {
      const pos: GeoPosition = {
        latitude: geoPosition.coords.latitude,
        longitude: geoPosition.coords.longitude,
        accuracy: geoPosition.coords.accuracy,
        altitude: geoPosition.coords.altitude,
        heading: geoPosition.coords.heading,
        speed: geoPosition.coords.speed,
        timestamp: new Date(geoPosition.timestamp),
      };

      setPosition(pos);
      setError(null);
      setLoading(false);

      if (callbackRef.current) {
        callbackRef.current(pos);
      }
    };

    const errorCallback = (geoError: GeolocationPositionError) => {
      const err: GeoError = {
        code: geoError.code,
        message: (() => {
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              return 'Permission denied. Please allow location access.';
            case geoError.POSITION_UNAVAILABLE:
              return 'Position unavailable. Cannot determine your location.';
            case geoError.TIMEOUT:
              return 'Request timeout. Please try again.';
            default:
              return 'Unknown geolocation error.';
          }
        })(),
      };

      setError(err);
      setLoading(false);
    };

    const config = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    if (watchPosition) {
      watchId.current = navigator.geolocation.watchPosition(
        successCallback,
        errorCallback,
        config
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        config
      );
    }
  }, [isSupported, watchPosition, enableHighAccuracy, timeout, maximumAge]);

  // Funciones públicas
  const startWatching = useCallback(() => {
    startWatchingInternal();
  }, [startWatchingInternal]);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setLoading(false);
  }, []);

  const refreshPosition = useCallback(() => {
    stopWatching();
    setTimeout(() => {
      startWatching();
    }, 100);
  }, [startWatching, stopWatching]);

  const setCallback = useCallback((callback: (pos: GeoPosition) => void) => {
    callbackRef.current = callback;
  }, []);

  const calculateDistance = useCallback((toLatitude: number, toLongitude: number): number => {
    if (!position) return -1;

    const R = 6371e3; 
    const φ1 = (position.latitude * Math.PI) / 180;
    const φ2 = (toLatitude * Math.PI) / 180;
    const Δφ = ((toLatitude - position.latitude) * Math.PI) / 180;
    const Δλ = ((toLongitude - position.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, [position]);

  const getBearing = useCallback((): number | null => {
    if (!position || position.heading === null) return null;
    return position.heading;
  }, [position]);

  return {
    position,
    error,
    loading,
    isSupported,
    startWatching,
    stopWatching,
    refreshPosition,
    setCallback,
    calculateDistance,
    getBearing,
    latitude: position?.latitude ?? null,
    longitude: position?.longitude ?? null,
    accuracy: position?.accuracy ?? null,
    speed: position?.speed ?? null,
  };
};

export default useGeolocation;