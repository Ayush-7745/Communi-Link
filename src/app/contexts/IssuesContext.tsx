import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Issue } from '../../types/issue';
import { Timestamp } from "firebase/firestore";
import { useEffect } from 'react';
import { doc, collection, onSnapshot, addDoc, updateDoc, query, where, getDocs, serverTimestamp, increment, orderBy, startAt, endAt } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useUser } from "./UserContext";
import { useNotifications } from "./NotificationContext";
import { geohashForLocation, geohashQueryBounds } from "geofire-common";


interface IssuesContextType {
  issues: Issue[];
  points: number; // ✅ ADD THIS
  addIssue: (issue: Omit<Issue, 'id' | 'status' | 'createdAt'>) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => Promise<void>;
  getIssue: (id: string) => Issue | undefined;
  assignIssue: (issueId: string, volunteerId: string) => Promise<void>;
}

const IssuesContext = createContext<IssuesContextType | undefined>(undefined);

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export function IssuesProvider({ children }: { children: ReactNode }) {

  const { userProfile, currentUserLocation } = useUser();
  const { addNotification } = useNotifications();
  // Raw issues from Firestore (fetches using geohash bounding box)
  const [rawIssues, setRawIssues] = useState<Issue[]>([]);
  const [points, setPoints] = useState<number>(0);
  // Firestore listener — fetches raw issues using geohash bounding boxes
  useEffect(() => {
    if (!userProfile?.userId) return;

    if (userProfile.role === 'citizen') {
      const q = query(collection(db, 'issues'), where('reportedBy', '==', userProfile.userId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: Issue[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Issue;
          return { id: docSnap.id, ...data, status: data.status || 'pending' };
        });
        setRawIssues(fetched);
      });
      return () => unsubscribe();
    }

    // For NGO and Volunteer, query by geohash bounds
    let loc: { lat: number; lng: number } | null = currentUserLocation || null;
    if (!loc && userProfile.location) {
      if (typeof userProfile.location === 'object' && 'lat' in userProfile.location) {
        loc = { lat: userProfile.location.lat, lng: (userProfile.location as any).lng };
      } else if (typeof userProfile.location === 'string' && userProfile.location.includes(',')) {
        const parts = userProfile.location.split(',').map((s: string) => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          loc = { lat: parts[0], lng: parts[1] };
        }
      }
    }

    if (!loc) {
      setRawIssues([]);
      return;
    }

    const radiusInM = 15 * 1000;
    const bounds = geohashQueryBounds([loc.lat, loc.lng], radiusInM);
    
    const unsubscribes: (() => void)[] = [];
    const issuesMap = new Map<string, Issue>();

    for (const b of bounds) {
      const q = query(
        collection(db, 'issues'),
        orderBy('geohash'),
        startAt(b[0]),
        endAt(b[1])
      );

      const unsub = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') {
            issuesMap.delete(change.doc.id);
          } else {
            issuesMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data(), status: change.doc.data().status || 'pending' } as Issue);
          }
        });
        setRawIssues(Array.from(issuesMap.values()));
      });
      unsubscribes.push(unsub);
    }

    return () => unsubscribes.forEach(u => u());
  }, [userProfile?.userId, userProfile?.role, currentUserLocation?.lat, currentUserLocation?.lng]);

  // Reactively derive the proximity-filtered issue list.
  // Re-runs automatically whenever rawIssues OR currentUserLocation changes.
  const RADIUS_KM = 15;

  const issues = useMemo(() => {
    if (!userProfile?.role) return rawIssues;

    if (userProfile.role === 'ngo') {
      // Determine NGO location — live GPS first, stored profile second, no hardcoded fallback
      let loc: { lat: number; lng: number } | null = currentUserLocation || null;
      if (!loc && userProfile.location) {
        if (typeof userProfile.location === 'object' && 'lat' in userProfile.location) {
          loc = { lat: userProfile.location.lat, lng: (userProfile.location as any).lng };
        } else if (typeof userProfile.location === 'string' && userProfile.location.includes(',')) {
          const parts = userProfile.location.split(',').map((s: string) => parseFloat(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            loc = { lat: parts[0], lng: parts[1] };
          }
        }
      }

      if (!loc) return rawIssues; // location not yet resolved — show all to avoid blank screen

      const { lat: nLat, lng: nLng } = loc;
      return rawIssues.filter((i) => {
        if (!i.lat || !i.lng) return false;
        return getDistance(i.lat, i.lng, nLat, nLng) <= RADIUS_KM;
      });
    }

    if (userProfile.role === 'volunteer') {
      let loc: { lat: number; lng: number } | null = currentUserLocation || null;
      if (!loc && userProfile.location) {
        if (typeof userProfile.location === 'object' && 'lat' in userProfile.location) {
          loc = { lat: userProfile.location.lat, lng: (userProfile.location as any).lng };
        } else if (typeof userProfile.location === 'string' && userProfile.location.includes(',')) {
          const parts = userProfile.location.split(',').map((s: string) => parseFloat(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            loc = { lat: parts[0], lng: parts[1] };
          }
        }
      }

      if (!loc) return rawIssues;

      const { lat: vLat, lng: vLng } = loc;
      return rawIssues.filter((i) => {
        // Only consider approved/assigned/completed/verified statuses for volunteers
        const validStatuses = ['approved', 'assigned', 'completed', 'verified'];
        if (!validStatuses.includes(i.status)) return false;

        // Always show tasks already assigned to this volunteer
        if (i.assignedVolunteerId === userProfile.userId) return true;
        if (!i.lat || !i.lng) return false;
        return getDistance(i.lat, i.lng, vLat, vLng) <= RADIUS_KM;
      });
    }

    // Citizens see their own issues (already filtered by Firestore query)
    return rawIssues;
  }, [rawIssues, currentUserLocation, userProfile?.role, userProfile?.userId, userProfile?.location]);

  const addIssue = async (issueData: Omit<Issue, 'id' | 'status' | 'createdAt'>) => {
    if (!userProfile?.userId) return;
    try {
      const newIssue = {
        ...issueData,
        reportedByName: userProfile.fullName,
        status: 'pending' as const,
        assignedVolunteerId: null,
        assignedNgoId: null,
        createdAt: Timestamp.now(),
        geohash: geohashForLocation([issueData.lat, issueData.lng]),
      };

      console.log("Issue Creation:", newIssue);
      const docRef = await addDoc(collection(db, "issues"), newIssue);

      // Notify only NGOs within 15km that have a valid stored location
      const NOTIFY_RADIUS_KM = 15;
      const qNgo = query(collection(db, "users"), where("role", "==", "ngo"));
      const querySnapshot = await getDocs(qNgo);

      querySnapshot.forEach(async (docSnap) => {
        const ngoData = docSnap.data();

        // Only proceed if the NGO has a real stored location — never use a fallback
        const hasLocation =
          ngoData.location &&
          typeof ngoData.location === 'object' &&
          typeof ngoData.location.lat === 'number' &&
          typeof ngoData.location.lng === 'number';

        if (!hasLocation) return; // skip NGOs without a stored location

        const ngoLat: number = ngoData.location.lat;
        const ngoLng: number = ngoData.location.lng;

        const distance = getDistance(issueData.lat, issueData.lng, ngoLat, ngoLng);
        console.log(`NGO ${docSnap.id} distance from issue: ${distance.toFixed(2)} km`);

        if (distance <= NOTIFY_RADIUS_KM) {
          // Send notification only to NGOs within 15 km
          await addDoc(collection(db, "notifications"), {
            userId: docSnap.id,
            title: "New Incoming Issue",
            message: "New issue reported directly in your area",
            type: "issue-reported",
            createdAt: serverTimestamp(),
            read: false
          });
        }
      });

      await addDoc(collection(db, "notifications"), {
        userId: userProfile.userId,
        title: "Issue Reported",
        message: "Your issue has been reported and is pending approval",
        type: "issue-reported",
        createdAt: serverTimestamp(),
        read: false
      });

    } catch (error) {
      console.error("Error adding issue:", error);
    }
  };

  const assignIssue = async (issueId: string, volunteerId: string) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;
    try {
      const issueRef = doc(db, "issues", issueId);
      await updateDoc(issueRef, {
        assigned: true,
        assignedVolunteerId: volunteerId,
        assignedVolunteerName: userProfile?.fullName || null,
        status: "assigned"
      });

      addNotification({
        userId: volunteerId,
        type: "task-assigned",
        title: "Task Assigned",
        message: "You have been assigned to a task.",
        issueId: issueId,
      });
      addNotification({
        userId: issue.reportedBy,
        type: "task-assigned",
        title: "Volunteer Assigned",
        message: "A volunteer has been assigned to your issue.",
        issueId: issueId,
      });
      if (issue.assignedNgoId && issue.assignedNgoId !== volunteerId) {
        addNotification({
          userId: issue.assignedNgoId,
          type: "task-accepted",
          title: "Task Accepted",
          message: "A volunteer accepted an approved task.",
          issueId: issueId,
        });
      }
    } catch (error) {
      console.error("Error assigning issue:", error);
    }
  };

  const updateIssue = async (id: string, updates: Partial<Issue>) => {
    try {
      const issue = issues.find(i => i.id === id);
      if (!issue) return;

      const finalUpdates = { ...updates };
      if (updates.lat !== undefined && updates.lng !== undefined) {
        finalUpdates.geohash = geohashForLocation([updates.lat, updates.lng]);
      } else if (updates.lat !== undefined && issue.lng !== undefined) {
        finalUpdates.geohash = geohashForLocation([updates.lat, issue.lng]);
      } else if (updates.lng !== undefined && issue.lat !== undefined) {
        finalUpdates.geohash = geohashForLocation([issue.lat, updates.lng]);
      }

      await updateDoc(doc(db, "issues", id), finalUpdates);

      if (updates.status === "approved") {
        if (!issue.assignedNgoId && userProfile?.userId) {
          updates.assignedNgoId = userProfile.userId;
          updates.assignedNgoName = userProfile.fullName || "NGO";
          await updateDoc(doc(db, "issues", id), { 
            assignedNgoId: userProfile.userId,
            assignedNgoName: userProfile.fullName || "NGO"
          });
        }

        const qVol = query(collection(db, "users"), where("role", "==", "volunteer"));
        const querySnapshot = await getDocs(qVol);

        querySnapshot.forEach((docSnap) => {
          const volData = docSnap.data();

          // Only notify volunteers within 15km of the approved task
          const NOTIFY_RADIUS_KM = 15;
          let volLat: number | null = null;
          let volLng: number | null = null;

          if (volData.location && typeof volData.location === 'object') {
            // Stored as {lat, lng} object
            if (typeof volData.location.lat === 'number' && typeof volData.location.lng === 'number') {
              volLat = volData.location.lat;
              volLng = volData.location.lng;
            }
          } else if (typeof volData.location === 'string' && volData.location.includes(',')) {
            // Stored as "lat, lng" string
            const parts = volData.location.split(',').map((s: string) => parseFloat(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              volLat = parts[0];
              volLng = parts[1];
            }
          }

          // Skip volunteers without a stored location or outside 15km
          if (volLat === null || volLng === null) return;
          const volDistance = getDistance(issue.lat, issue.lng, volLat, volLng);
          if (volDistance > NOTIFY_RADIUS_KM) return;

          addNotification({
            userId: docSnap.id,
            type: "issue-approved",
            title: "New Verified Task Nearby",
            message: `Task "${issue.title}" is approved and is ${volDistance.toFixed(1)}km away — needs a volunteer!`,
            issueId: id,
          });
        });

        addNotification({
          userId: issue.reportedBy,
          type: "issue-approved",
          title: "Issue Approved",
          message: "Your issue has been verified and is looking for volunteers.",
          issueId: id,
        });
      } else if (updates.status === "assigned" && updates.assignedVolunteerId) {
        const isReassignment = issue.assignedVolunteerId && issue.assignedVolunteerId !== updates.assignedVolunteerId;
        const oldVolunteerId = issue.assignedVolunteerId;

        if (isReassignment) {
          // Notification for old volunteer
          addDoc(collection(db, "notifications"), {
            userId: oldVolunteerId,
            type: "task-reassigned",
            title: "Your task has been reassigned",
            message: "A task previously assigned to you has been reassigned to someone else.",
            issueId: id,
            read: false,
            createdAt: Timestamp.now(),
          });

          // Notification for reporting citizen
          if (issue.reportedBy) {
            addDoc(collection(db, "notifications"), {
              userId: issue.reportedBy,
              type: "task-reassigned",
              title: "Volunteer Reassigned",
              message: "A new volunteer has been assigned to resolve your issue.",
              issueId: id,
              read: false,
              createdAt: Timestamp.now(),
            });
          }

          // Notification for new volunteer
          addDoc(collection(db, "notifications"), {
            userId: updates.assignedVolunteerId,
            type: "task-assigned",
            title: "Task Assigned",
            message: "You have been assigned to a new task by the NGO.",
            issueId: id,
            read: false,
            createdAt: Timestamp.now(),
          });
        } else {
          // Notification for assigned volunteer
          addDoc(collection(db, "notifications"), {
            userId: updates.assignedVolunteerId,
            type: "task-assigned",
            title: "Task Assigned",
            message: "You have been assigned to a new task by the NGO.",
            issueId: id,
            read: false,
            createdAt: Timestamp.now(),
          });

          // Notification for reporting citizen
          if (issue.reportedBy) {
            addDoc(collection(db, "notifications"), {
              userId: issue.reportedBy,
              type: "task-assigned",
              title: "Volunteer Assigned",
              message: "A volunteer has been assigned to resolve your issue.",
              issueId: id,
              read: false,
              createdAt: Timestamp.now(),
            });
          }
        }
      } else if (updates.status === "completed") {
        if (issue.assignedNgoId) {
          addDoc(collection(db, "notifications"), {
            userId: issue.assignedNgoId,
            type: "task-completed",
            title: "Task Completed",
            message: "A volunteer has completed their task and requires verification.",
            issueId: id,
            read: false,
            createdAt: Timestamp.now(),
          });
        }
        if (issue.reportedBy) {
          addDoc(collection(db, "notifications"), {
            userId: issue.reportedBy,
            type: "task-completed",
            title: "Issue completed from volunteer side waiting for verification",
            message: "The volunteer assigned to your issue has marked it as completed. The NGO will now verify it.",
            issueId: id,
            read: false,
            createdAt: Timestamp.now(),
          });
        }
      } else if (updates.status === "verified") {
        if (issue.assignedVolunteerId) {
          // Increment points for the volunteer!
          try {
            await updateDoc(doc(db, "users", issue.assignedVolunteerId), { points: increment(10) });
          } catch (e) {
            console.warn("Failed to increment points for volunteer. They may not exist in users collection.", e);
          }

          await addDoc(collection(db, "notifications"), {
            userId: issue.assignedVolunteerId,
            type: "issue-verified",
            title: "Task Verified",
            message: `You completed the task "${issue.title}"! 10 points have been awarded.`,
            issueId: id,
            read: false,
            createdAt: Timestamp.now(),
          });
        }
        if (issue.reportedBy) {
          await addDoc(collection(db, "notifications"), {
            userId: issue.reportedBy,
            type: "issue-verified",
            title: "Issue Resolved",
            message: `Your issue "${issue.title}" has been resolved and verified.`,
            issueId: id,
            read: false,
            createdAt: Timestamp.now(),
          });
        }
      } else if (updates.status === "assigned" && issue.status === "completed") {
        // This denotes a rejection from NGO back to the assigned pool
        if (issue.assignedVolunteerId) {
          addDoc(collection(db, "notifications"), {
            userId: issue.assignedVolunteerId,
            type: "task-rejected",
            title: "Task didn't meet expectation",
            message: "Your completed task was rejected by the NGO and needs further work.",
            issueId: id,
            read: false,
            createdAt: Timestamp.now(),
          });
        }
        if (issue.reportedBy) {
          addDoc(collection(db, "notifications"), {
            userId: issue.reportedBy,
            type: "task-rejected",
            title: "Reviewing the task once again",
            message: "The NGO rejected the volunteer's completion submission. The task is back in progress.",
            issueId: id,
            read: false,
            createdAt: Timestamp.now(),
          });
        }
      } else if (updates.status === "rejected") {
        if (issue.reportedBy) {
          // If reported by a volunteer, deduct 10 points
          try {
            const userSnap = await getDocs(query(collection(db, "users"), where("userId", "==", issue.reportedBy)));
            if (!userSnap.empty && userSnap.docs[0].data().role === "volunteer") {
              await updateDoc(doc(db, "users", issue.reportedBy), { points: increment(-10) });
              addDoc(collection(db, "notifications"), {
                userId: issue.reportedBy,
                type: "task-rejected",
                title: "Issue Rejected",
                message: `The issue "${issue.title}" you reported was rejected by an NGO. 10 points have been deducted.`,
                issueId: id,
                read: false,
                createdAt: Timestamp.now(),
              });
            } else {
              // Notification for citizen
              addDoc(collection(db, "notifications"), {
                userId: issue.reportedBy,
                type: "task-rejected",
                title: "Issue Rejected",
                message: `Your reported issue "${issue.title}" was reviewed and rejected by an NGO.`,
                issueId: id,
                read: false,
                createdAt: Timestamp.now(),
              });
            }
          } catch (e) {
            console.error("Error processing rejection:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error updating issue:", error);
    }
  };

  const getIssue = (id: string) => {
    return issues.find((issue) => issue.id === id);
  };

  return (
    <IssuesContext.Provider value={{ issues, points, addIssue, updateIssue, getIssue, assignIssue }}>
      {children}
    </IssuesContext.Provider>
  );
}

export function useIssues() {
  const context = useContext(IssuesContext);
  if (context === undefined) {
    throw new Error('useIssues must be used within an IssuesProvider');
  }
  return context;
}
