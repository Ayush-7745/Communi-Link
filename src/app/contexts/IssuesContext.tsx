import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { Issue } from '../../types/issue';
import { api, notifyWorkflowUpdated, pollEvery, resolveLocation } from '../../services/api';
import { useUser } from './UserContext';
import { geohashForLocation } from 'geofire-common';
import { ISSUE_STATUS } from '../../utils/issueStatus';

interface IssuesContextType {
  issues: Issue[];
  issuesLoading: boolean;
  issuesError: string | null;
  points: number;
  addIssue: (issue: Omit<Issue, 'id' | 'status' | 'createdAt'>) => Promise<boolean>;
  updateIssue: (id: string, updates: Partial<Issue>) => Promise<boolean>;
  getIssue: (id: string) => Issue | undefined;
  assignIssue: (issueId: string, volunteerId: string) => Promise<boolean>;
  refreshIssues: () => Promise<void>;
}

const IssuesContext = createContext<IssuesContextType | undefined>(undefined);

export function IssuesProvider({ children }: { children: ReactNode }) {
  const { userProfile, currentUserLocation } = useUser();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const hasLoadedIssues = useRef(false);
  const refreshSequence = useRef(0);

  const profileLocation = resolveLocation(userProfile?.location);
  const latitude = currentUserLocation?.lat ?? profileLocation?.lat;
  const longitude = currentUserLocation?.lng ?? profileLocation?.lng;

  const refreshIssues = useCallback(async () => {
    if (!userProfile?.userId) {
      setIssues([]);
      setIssuesLoading(false);
      setIssuesError(null);
      hasLoadedIssues.current = false;
      return;
    }
    if (!hasLoadedIssues.current) setIssuesLoading(true);
    const requestSequence = ++refreshSequence.current;
    try {
      const data = await api.getIssues(
        latitude !== undefined && longitude !== undefined ? { lat: latitude, lng: longitude } : undefined
      );
      if (requestSequence === refreshSequence.current) {
        setIssues(data.map((issue) => ({
          ...issue,
          id: issue.id || (issue as Issue & { _id?: string })._id,
          status: issue.status || ISSUE_STATUS.PENDING,
        })));
        hasLoadedIssues.current = true;
        setIssuesLoading(false);
        setIssuesError(null);
      }
    } catch (error) {
      if (requestSequence === refreshSequence.current) {
        setIssuesLoading(false);
        setIssuesError(error instanceof Error ? error.message : 'Unable to load issues.');
      }
      throw error;
    }
  }, [userProfile?.userId, latitude, longitude]);

  useEffect(() => {
    if (!userProfile?.userId) {
      setIssues([]);
      setIssuesLoading(false);
      setIssuesError(null);
      return;
    }

    hasLoadedIssues.current = false;
    setIssuesLoading(true);
    const stopPolling = pollEvery(
      refreshIssues,
      () => undefined,
      (error) => setIssuesError(error instanceof Error ? error.message : 'Unable to load issues.')
    );
    return () => {
      stopPolling();
      refreshSequence.current += 1;
    };
  }, [userProfile?.userId, userProfile?.role, refreshIssues]);

  const addIssue = async (issueData: Omit<Issue, 'id' | 'status' | 'createdAt'>) => {
    try {
      const saved = await api.createIssue({
        ...issueData,
        geohash: issueData.lat !== undefined && issueData.lng !== undefined
          ? geohashForLocation([issueData.lat, issueData.lng])
          : undefined,
      });
      setIssues((current) => [saved, ...current.filter((issue) => issue.id !== saved.id)]);
      notifyWorkflowUpdated();
      void refreshIssues().catch((error) => console.error('Unable to refresh issues after reporting:', error));
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
      if (updates.status === ISSUE_STATUS.APPROVED) {
        updated = await api.approveIssue(id);
      } else if (updates.status === ISSUE_STATUS.ASSIGNED) {
        const current = issues.find((issue) => issue.id === id);
        if (userProfile?.role === 'ngo' && updates.assignedVolunteerId) {
          updated = await api.assignVolunteer(id, updates.assignedVolunteerId);
        } else if (userProfile?.role === 'ngo' && current?.status === ISSUE_STATUS.COMPLETED) {
          updated = await api.rejectIssue(id);
        } else if (userProfile?.role === 'volunteer') {
          updated = await api.acceptIssue(id);
        } else {
          throw new Error('Select a volunteer before assigning this issue.');
        }
      } else if (updates.status === ISSUE_STATUS.COMPLETED) {
        updated = await api.completeIssue(id, {
          completionProofBlob: updates.completionProofBlob,
          volunteerNotes: updates.volunteerNotes,
        });
      } else if (updates.status === ISSUE_STATUS.VERIFIED) {
        updated = await api.verifyIssue(id);
      } else if (updates.status === ISSUE_STATUS.REJECTED) {
        updated = await api.rejectIssue(id);
      } else {
        throw new Error('This update is not part of the supported issue lifecycle.');
      }
      setIssues((current) => current.map((issue) => issue.id === id ? updated : issue));
      notifyWorkflowUpdated();
      await refreshIssues().catch((error) => {
        console.error('Unable to refresh issues after an update:', error);
      });
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
    return updateIssue(issueId, { status: ISSUE_STATUS.ASSIGNED, assignedVolunteerId: volunteerId });
  };

  const getIssue = (id: string) => issues.find((issue) => issue.id === id);
  const points = userProfile?.points ?? 0;
  const value = useMemo(
    () => ({
      issues,
      issuesLoading,
      issuesError,
      points,
      addIssue,
      updateIssue,
      getIssue,
      assignIssue,
      refreshIssues,
    }),
    [issues, issuesLoading, issuesError, points, userProfile?.userId, refreshIssues]
  );

  return <IssuesContext.Provider value={value}>{children}</IssuesContext.Provider>;
}

export function useIssues() {
  const context = useContext(IssuesContext);
  if (!context) throw new Error('useIssues must be used within an IssuesProvider');
  return context;
}
