import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { auth } from "../../config/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { geohashForLocation } from "geofire-common";
import { api, ApiError, pollEvery, resolveLocation } from "../../services/api";
import { useGeolocation } from "../../hooks/useGeolocation";
import { toast } from "sonner";

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  profilePhoto?: string | null;
  points?: number;
  role?: "citizen" | "volunteer" | "ngo";
  location?: { lat: number, lng: number, address?: string } | string;
  geohash?: string;
}

interface UserContextType {
  userProfile: UserProfile | null;
  authUser: User | null;
  authLoading: boolean;
  authProfileError: boolean;
  authProfileMissing: boolean;
  setUserProfile: (profile: UserProfile | null) => void;
  clearSessionState: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  uploadProfilePhoto: (file: File) => void;
  currentUserLocation: { lat: number, lng: number } | null;
  currentUserLocationAddress: string | null;
  isDetectingLocation: boolean;
  locationError: string;
  detectCurrentLocation: () => Promise<void>;
  selectCurrentLocation: (location: { lat: number, lng: number }) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authProfileError, setAuthProfileError] = useState(false);
  const [authProfileMissing, setAuthProfileMissing] = useState(false);
  // True until Firebase confirms auth state for the first time (prevents login flash on refresh)
  const [authLoading, setAuthLoading] = useState(true);
  const authChangeId = useRef(0);
  const geolocation = useGeolocation();

  useEffect(() => {
    let stopProfilePolling: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const currentChangeId = ++authChangeId.current;
      geolocation.clearLocation();
      stopProfilePolling?.();
      stopProfilePolling = null;
      setAuthLoading(true);
      setAuthUser(user);
      setUserProfile(null);
      setAuthProfileError(false);
      setAuthProfileMissing(false);

      if (user) {
        stopProfilePolling = pollEvery(
          api.getProfile,
          (profile) => {
            if (currentChangeId !== authChangeId.current) return;
            setUserProfile(profile as unknown as UserProfile);
            setAuthProfileError(false);
            setAuthProfileMissing(false);
            setAuthLoading(false);
          },
          (error) => {
            if (error instanceof ApiError && error.status === 403) {
              if (currentChangeId === authChangeId.current) {
                setUserProfile(null);
                setAuthProfileError(false);
                setAuthProfileMissing(true);
                setAuthLoading(false);
              }
              return;
            }
            console.error('Unable to load authenticated user profile:', error);
            if (currentChangeId === authChangeId.current) {
              setUserProfile(null);
              setAuthProfileError(true);
              setAuthProfileMissing(false);
              setAuthLoading(false);
            }
          }
        );
      } else if (currentChangeId === authChangeId.current) {
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribe();
      stopProfilePolling?.();
    };
  }, [geolocation.clearLocation]);

  const storedLocation = resolveLocation(userProfile?.location);
  const currentUserLocation = geolocation.location
    ? { lat: geolocation.location.lat, lng: geolocation.location.lng }
    : storedLocation || null;

  useEffect(() => {
    if (!userProfile?.userId) return;
    if (!geolocation.location) return;

    const { lat, lng, address } = geolocation.location;
    const previous = resolveLocation(userProfile.location);
    const R = 6371e3;
    const distance = previous
      ? R * 2 * Math.asin(Math.sqrt(
        Math.sin(((lat - previous.lat) * Math.PI / 180) / 2) ** 2
        + Math.cos(previous.lat * Math.PI / 180)
          * Math.cos(lat * Math.PI / 180)
          * Math.sin(((lng - previous.lng) * Math.PI / 180) / 2) ** 2
      ))
      : Number.POSITIVE_INFINITY;
    const previousAddress = typeof userProfile.location === 'object'
      ? userProfile.location.address
      : undefined;
    if (distance <= 100 && previousAddress === address) return;

    let active = true;
    const saveLocation = async () => {
      try {
        const geohash = geohashForLocation([lat, lng]);
        await api.updateProfile({ location: { lat, lng, address }, geohash });
        if (active) {
          setUserProfile((profile) => profile
            ? { ...profile, location: { lat, lng, address }, geohash }
            : profile);
        }
      } catch (error) {
        console.error('Unable to save detected location:', error);
        toast.error('Unable to save your location. You can still use the selected map location.');
      }
    };
    void saveLocation();
    return () => {
      active = false;
    };
  }, [userProfile?.userId, geolocation.location?.lat, geolocation.location?.lng, geolocation.location?.address]);

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => prev ? { ...prev, ...updates } : prev);
  };

  const uploadProfilePhoto = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setUserProfile((prev) =>
        prev ? { ...prev, profilePhoto: reader.result as string } : prev
      );
    };
    reader.readAsDataURL(file);
  };

  const clearSessionState = () => {
    authChangeId.current += 1;
    setUserProfile(null);
    setAuthUser(null);
    setAuthProfileError(false);
    setAuthProfileMissing(false);
    setAuthLoading(false);
    geolocation.clearLocation();
  };

  return (
    <UserContext.Provider value={{
      userProfile,
      authUser,
      authLoading,
      authProfileError,
      authProfileMissing,
      setUserProfile,
      clearSessionState,
      updateUserProfile,
      uploadProfilePhoto,
      currentUserLocation,
      currentUserLocationAddress: geolocation.location?.address
        || (typeof userProfile?.location === 'object' ? userProfile.location.address : null)
        || (currentUserLocation
          ? `${currentUserLocation.lat.toFixed(5)}, ${currentUserLocation.lng.toFixed(5)}`
          : null),
      isDetectingLocation: geolocation.isDetecting,
      locationError: geolocation.errorMessage,
      detectCurrentLocation: geolocation.detectLocation,
      selectCurrentLocation: geolocation.setLocation,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}
