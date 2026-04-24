import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { geohashForLocation } from "geofire-common";
import { updateDoc } from "firebase/firestore";

interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  profilePhoto?: string | null;
  points?: number;
  role?: "citizen" | "volunteer" | "ngo";
  location?: { lat: number, lng: number } | string;
  geohash?: string;
}

interface UserContextType {
  userProfile: UserProfile | null;
  authLoading: boolean;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  uploadProfilePhoto: (file: File) => void;
  currentUserLocation: { lat: number, lng: number } | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  // True until Firebase confirms auth state for the first time (prevents login flash on refresh)
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUserLocation, setCurrentUserLocation] = useState<{ lat: number, lng: number } | null>(null);

  // 🔥 AUTH LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));

        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
      // Auth state is now known — stop blocking route guards
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔥 REALTIME UPDATE (points etc.)
  useEffect(() => {
    if (!userProfile?.userId) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", userProfile?.userId),
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile((prev) => ({
            ...prev!,
            ...docSnap.data(),
          }));
        }
      }
    );

    return () => unsubscribe();
  }, [userProfile?.userId]);

  // 🔥 WATCH LOCATION AND SYNC TO FIRESTORE
  useEffect(() => {
    if (!userProfile?.userId) return;
    if (userProfile.role !== 'ngo' && userProfile.role !== 'volunteer') return;
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentUserLocation({ lat, lng });

        // Update Firestore if location changed significantly (e.g., > 100 meters)
        // For simplicity, we just update it if we don't have one, or periodically.
        // To avoid spamming Firestore on every minor GPS drift, we can compare distance.
        const R = 6371e3; // metres
        let shouldUpdate = false;
        
        if (!userProfile.location || typeof userProfile.location !== 'object') {
          shouldUpdate = true;
        } else {
          const oldLat = userProfile.location.lat;
          const oldLng = userProfile.location.lng;
          if (typeof oldLat === 'number' && typeof oldLng === 'number') {
            const φ1 = oldLat * Math.PI/180, φ2 = lat * Math.PI/180, Δλ = (lng-oldLng) * Math.PI/180;
            const d = Math.acos( Math.sin(φ1)*Math.sin(φ2) + Math.cos(φ1)*Math.cos(φ2) * Math.cos(Δλ) ) * R;
            if (d > 100) shouldUpdate = true; // moved more than 100m
          } else {
            shouldUpdate = true;
          }
        }

        if (shouldUpdate) {
          try {
            const hash = geohashForLocation([lat, lng]);
            await updateDoc(doc(db, "users", userProfile.userId), {
              location: { lat, lng },
              geohash: hash
            });
          } catch (error) {
            console.error("Error updating location:", error);
          }
        }
      },
      (error) => console.warn('Geolocation error:', error),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userProfile?.userId, userProfile?.role, userProfile?.location]);

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

  return (
    <UserContext.Provider value={{ userProfile, authLoading, updateUserProfile, uploadProfilePhoto, currentUserLocation }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}
