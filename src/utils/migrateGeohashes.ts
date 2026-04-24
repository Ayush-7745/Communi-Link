import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import { geohashForLocation } from "geofire-common";

export const migrateGeohashes = async () => {
  console.log("Starting geohash migration...");
  
  // 1. Migrate Issues
  const issuesSnapshot = await getDocs(collection(db, "issues"));
  let issuesUpdated = 0;
  
  for (const issueDoc of issuesSnapshot.docs) {
    const data = issueDoc.data();
    if (data.lat !== undefined && data.lng !== undefined && !data.geohash) {
      const hash = geohashForLocation([data.lat, data.lng]);
      await updateDoc(doc(db, "issues", issueDoc.id), { geohash: hash });
      issuesUpdated++;
    }
  }
  console.log(`Migrated ${issuesUpdated} issues.`);

  // 2. Migrate Users (Volunteers & NGOs)
  const usersSnapshot = await getDocs(collection(db, "users"));
  let usersUpdated = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    const data = userDoc.data();
    
    // Parse user location if it exists
    let lat: number | null = null;
    let lng: number | null = null;
    
    if (data.location && typeof data.location === 'object') {
      if (typeof data.location.lat === 'number' && typeof data.location.lng === 'number') {
        lat = data.location.lat;
        lng = data.location.lng;
      }
    } else if (typeof data.location === 'string' && data.location.includes(',')) {
      const parts = data.location.split(',').map((s: string) => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        lat = parts[0];
        lng = parts[1];
      }
    }

    if (lat !== null && lng !== null && !data.geohash) {
      const hash = geohashForLocation([lat, lng]);
      await updateDoc(doc(db, "users", userDoc.id), { 
        location: { lat, lng }, // Standardize location format
        geohash: hash 
      });
      usersUpdated++;
    }
  }
  console.log(`Migrated ${usersUpdated} users.`);
  console.log("Geohash migration complete!");
};
