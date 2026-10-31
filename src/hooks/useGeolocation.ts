import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface GeoLocation {
  lat: number;
  lng: number;
  address: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

function isValidCoordinates({ lat, lng }: Coordinates): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90
    && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

function coordinatesLabel({ lat, lng }: Coordinates): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function locationErrorMessage(error: GeolocationPositionError | null): string {
  if (!window.isSecureContext || !navigator.geolocation) {
    return 'Location detection requires a secure connection (HTTPS) or localhost and a supported browser.';
  }
  if (!error) return 'Unable to detect your location. You can pick it on the map instead.';
  if (error.code === error.PERMISSION_DENIED) {
    return 'Location permission was denied. Allow location access in your browser or site settings, then try again.';
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'Your location is currently unavailable. Check your device location settings or pick a point on the map.';
  }
  if (error.code === error.TIMEOUT) {
    return 'Location detection timed out. Try again or pick a point on the map.';
  }
  return 'Unable to detect your location. You can pick it on the map instead.';
}

function getCurrentPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function reverseGeocode({ lat, lng }: Coordinates): Promise<string> {
  const fallback = coordinatesLabel({ lat, lng });
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);
  try {
    const query = new URLSearchParams({
      format: 'jsonv2',
      lat: String(lat),
      lon: String(lng),
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) return fallback;
    const result = await response.json() as { display_name?: unknown };
    return typeof result.display_name === 'string' && result.display_name.trim()
      ? result.display_name
      : fallback;
  } catch {
    return fallback;
  } finally {
    window.clearTimeout(timer);
  }
}

export function useGeolocation() {
  const [location, setLocationState] = useState<GeoLocation | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const requestId = useRef(0);
  const detectionId = useRef(0);

  const commitLocation = useCallback((coordinates: Coordinates) => {
    if (!isValidCoordinates(coordinates)) {
      const message = 'Choose a valid location within the map boundaries.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    const currentRequestId = ++requestId.current;
    setLocationState({ ...coordinates, address: coordinatesLabel(coordinates) });
    setErrorMessage('');
    void reverseGeocode(coordinates).then((address) => {
      if (currentRequestId === requestId.current) {
        setLocationState({ ...coordinates, address });
      }
    });
  }, []);

  const setLocation = useCallback((coordinates: Coordinates) => {
    detectionId.current += 1;
    setIsDetecting(false);
    commitLocation(coordinates);
  }, [commitLocation]);

  const clearLocation = useCallback(() => {
    requestId.current += 1;
    detectionId.current += 1;
    setLocationState(null);
    setErrorMessage('');
    setIsDetecting(false);
  }, []);

  const detectLocation = useCallback(async () => {
    setErrorMessage('');
    if (!window.isSecureContext || !navigator.geolocation) {
      const message = locationErrorMessage(null);
      setErrorMessage(message);
      toast.error(message);
      return;
    }
    const detectionRequestId = ++detectionId.current;
    setIsDetecting(true);
    try {
      let position: GeolocationPosition;
      try {
        position = await getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 0,
        });
      } catch (firstError) {
        const geolocationError = firstError as GeolocationPositionError;
        if (
          geolocationError.code !== geolocationError.TIMEOUT
          && geolocationError.code !== geolocationError.POSITION_UNAVAILABLE
        ) throw geolocationError;

        position = await getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 15_000,
          maximumAge: 0,
        });
      }

      const coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      if (detectionRequestId !== detectionId.current) return;
      if (!isValidCoordinates(coordinates)) {
        const message = 'The browser returned invalid coordinates. Pick your location on the map instead.';
        setErrorMessage(message);
        toast.error(message);
        return;
      }
      if (detectionRequestId !== detectionId.current) return;
      commitLocation(coordinates);
    } catch (error) {
      if (detectionRequestId !== detectionId.current) return;
      const message = locationErrorMessage(error as GeolocationPositionError);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (detectionRequestId === detectionId.current) {
        setIsDetecting(false);
      }
    }
  }, [commitLocation]);

  return { location, isDetecting, errorMessage, detectLocation, setLocation, clearLocation };
}

export { isValidCoordinates };
