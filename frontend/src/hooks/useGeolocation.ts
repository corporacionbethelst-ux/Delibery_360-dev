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

const defaultOptions: UseGeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
  watchPosition: true,
  autoStart: true,
};

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const mergedOptions = { ...defaultOptions, ...options };
  
  const [position, setPosition] = useState<GeoPosition | null>(null); // State initialized to null
  const [error, setError] = useState<GeoError | null>(null); // State initialized to null
  const [loading, setLoading] = useState<boolean>(mergedOptions.autoStart);
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

  // Limpiar watcher al desmontar
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  const startWatching = useCallback(() => {
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

      // Llamar al callback externo si existe
      if (callbackRef.current) {
        callbackRef.current(pos);
      }
    };

    const errorCallback = (geoError: GeolocationPositionError) => {
      const error: GeoError = {
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

      setError(error);
      setLoading(false);
    };

    if (mergedOptions.watchPosition) {
      watchId.current = navigator.geolocation.watchPosition(
        successCallback,
        errorCallback,
        {
          enableHighAccuracy: mergedOptions.enableHighAccuracy,
          timeout: mergedOptions.timeout,
          maximumAge: mergedOptions.maximumAge,
        }
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        successCallback,
        errorCallback,
        {
          enableHighAccuracy: mergedOptions.enableHighAccuracy,
          timeout: mergedOptions.timeout,
          maximumAge: mergedOptions.maximumAge,
        }
      );
    }
  }, [isSupported, mergedOptions]);

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

    const fromLatitude = position.latitude;
    const fromLongitude = position.longitude;

    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (fromLatitude * Math.PI) / 180;
    const φ2 = (toLatitude * Math.PI) / 180;
    const Δφ = ((toLatitude - fromLatitude) * Math.PI) / 180;
    const Δλ = ((toLongitude - fromLongitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  }, [position]);

  const getBearing = useCallback((): number | null => {
    if (!position || position.heading === null) return null;
    return position.heading;
  }, [position]);

  return {
    // Estado
    position,
    error,
    loading,
    isSupported,
    
    // Acciones
    startWatching,
    stopWatching,
    refreshPosition,
    setCallback,
    
    // Utilidades
    calculateDistance,
    getBearing,
    
    // Info rápida
    latitude: position?.latitude ?? null,
    longitude: position?.longitude ?? null,
    accuracy: position?.accuracy ?? null,
    speed: position?.speed ?? null,
  };
};

export default useGeolocation;
