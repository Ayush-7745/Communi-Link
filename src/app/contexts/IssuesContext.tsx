import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Issue } from '../../types/issue';
import { api, pollEvery, resolveLocation } from '../../services/api';
import { useUser } from './UserContext';
import { geohashForLocation } from 'geofire-common';

interface IssuesContextType {
  issues: Issue[];
  points: number;
  addIssue: (issue: Omit<Issue, 'id' | 'status' | 'createdAt'>) => Promise<boolean>;
  updateIssue: (id: string, updates: Partial<Issue>) => Promise<boolean>;
  getIssue: (id: string) => Issue | undefined;
  assignIssue: (issueId: string, volunteerId: string) => Promise<boolean>;
}

const IssuesContext = createContext<IssuesContextType | undefined>(undefined);

export function IssuesProvider({ children }: { children: ReactNode }) {
  const { userProfile, currentUserLocation } = useUser();
  const [issues, setIssues] = useState<Issue[]>([]);

  const profileLocation = resolveLocation(userProfile?.location);
  const latitude = currentUserLocation?.lat ?? profileLocation?.lat;
  const longitude = currentUserLocation?.lng ?? profileLocation?.lng;

  useEffect(() => {
    if (!userProfile?.userId) {
      setIssues([]);
      return;
    }

    return pollEvery(
      () => api.getIssues(
        latitude !== undefined && longitude !== undefined ? { lat: latitude, lng: longitude } : undefined
      ),
      (data) => setIssues(data.map((issue) => ({
        ...issue,
        id: issue.id || (issue as Issue & { _id?: string })._id,
        status: issue.status || 'pending',
      })))
    );
  }, [userProfile?.userId, userProfile?.role, latitude, longitude]);

  const addIssue = async (issueData: Omit<Issue, 'id' | 'status' | 'createdAt'>) => {
    try {
      const saved = await api.createIssue({
        ...issueData,
        geohash: issueData.lat !== undefined && issueData.lng !== undefined
          ? geohashForLocation([issueData.lat, issueData.lng])
          : undefined,
      });
      setIssues((current) => [saved, ...current.filter((issue) => issue.id !== saved.id)]);
      return true;
    } catch (error) {
      console.error('Unable to create issue:', error);
      alert(error instanceof Error ? error.message : 'Unable to report this issue.');
      return false;
    }
  };

  const updateIssue = async (id: string, updates: Partial<Issue>) => {
    try {
      let updated: Issue;
      if (updates.status === 'approved') {
        updated = await api.approveIssue(id);
      } else if (updates.status === 'assigned') {
        updated = userProfile?.role === 'ngo' && updates.assignedVolunteerId
          ? await api.assignVolunteer(id, updates.assignedVolunteerId)
          : await api.assignIssue(id);
      } else if (updates.status === 'completed') {
        updated = await api.completeIssue(id, {
          completionProofBlob: updates.completionProofBlob,
          volunteerNotes: updates.volunteerNotes,
        });
      } else if (updates.status === 'verified') {
        updated = await api.verifyIssue(id);
      } else {
        throw new Error('This update is not part of the supported issue lifecycle.');
      }
      setIssues((current) => current.map((issue) => issue.id === id ? updated : issue));
      return true;
    } catch (error) {
      console.error('Unable to update issue:', error);
      alert(error instanceof Error ? error.message : 'Unable to update this issue.');
      return false;
    }
  };

  const assignIssue = async (issueId: string, volunteerId: string) => {
    if (volunteerId !== userProfile?.userId) {
      alert('Volunteers can only accept an issue for their own account.');
      return false;
    }
    return updateIssue(issueId, { status: 'assigned', assignedVolunteerId: volunteerId });
  };

  const getIssue = (id: string) => issues.find((issue) => issue.id === id);
  const points = userProfile?.points ?? 0;
  const value = useMemo(
    () => ({ issues, points, addIssue, updateIssue, getIssue, assignIssue }),
    [issues, points, userProfile?.userId]
  );

  return <IssuesContext.Provider value={value}>{children}</IssuesContext.Provider>;
}

export function useIssues() {
  const context = useContext(IssuesContext);
  if (!context) throw new Error('useIssues must be used within an IssuesProvider');
  return context;
}
