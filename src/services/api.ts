import { auth } from '../config/firebase';
import type { Issue } from '../types/issue';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000' : '');
if (!API_URL) {
  throw new Error('VITE_API_URL must be set to the backend API URL in production.');
}
const API_BASE_URL = API_URL.replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 3_000;
export const WORKFLOW_UPDATED_EVENT = 'communilink:workflow-updated';

export function notifyWorkflowUpdated() {
  window.dispatchEvent(new Event(WORKFLOW_UPDATED_EVENT));
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
  toMillis: () => number;
  valueOf: () => number;
  toJSON: () => string;
}

export interface ApiAnalytics {
  total: number;
  pending: number;
  approved: number;
  assigned: number;
  completed: number;
  verified: number;
  rejected: number;
  byStatus: Record<string, number>;
  byCategory: { category: string; count: number }[];
}

export function resolveLocation(location: unknown): { lat: number; lng: number; address?: string } | undefined {
  if (location && typeof location === 'object' && 'lat' in location && 'lng' in location) {
    const point = location as { lat: number; lng: number; address?: unknown };
    if (
      Number.isFinite(point.lat) && point.lat >= -90 && point.lat <= 90
      && Number.isFinite(point.lng) && point.lng >= -180 && point.lng <= 180
    ) {
      return {
        lat: point.lat,
        lng: point.lng,
        ...(typeof point.address === 'string' ? { address: point.address } : {}),
      };
    }
  }
  if (typeof location === 'string') {
    const parts = location.split(',').map((part) => Number.parseFloat(part.trim()));
    if (
      parts.length === 2 && parts.every(Number.isFinite)
      && parts[0] >= -90 && parts[0] <= 90 && parts[1] >= -180 && parts[1] <= 180
    ) return { lat: parts[0], lng: parts[1] };
  }
  return undefined;
}

function timestampFrom(value: string): ApiTimestamp {
  const date = new Date(value);
  const milliseconds = date.getTime();
  const seconds = Math.floor(milliseconds / 1000);
  const nanoseconds = (milliseconds - seconds * 1000) * 1_000_000;
  return {
    seconds,
    nanoseconds,
    toDate: () => new Date(milliseconds),
    toMillis: () => milliseconds,
    valueOf: () => milliseconds,
    toJSON: () => date.toISOString(),
  };
}

function hydrate(value: unknown, key = ''): unknown {
  if (typeof value === 'string' && ['createdAt', 'updatedAt', 'assignedAt', 'completedAt', 'verifiedAt'].includes(key)) {
    const time = Date.parse(value);
    if (Number.isFinite(time)) return timestampFrom(value);
  }
  if (Array.isArray(value)) return value.map((item) => hydrate(item));
  if (value && typeof value === 'object') {
    const hydrated = Object.fromEntries(
      Object.entries(value).map(([property, item]) => [property, hydrate(item, property)])
    );
    if (typeof hydrated._id === 'string' && !('id' in hydrated)) hydrated.id = hydrated._id;
    return hydrated;
  }
  return value;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('You must be signed in to access the CommuniLink API.');

  const token = await currentUser.getIdToken();
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
  let result: T | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...options, headers, signal: controller.signal });
      if (!response.ok) {
        let payload: { error?: string } | null = null;
        try {
          payload = await response.json() as { error?: string };
        } catch (error) {
          if (error instanceof TypeError) throw error;
        }
        throw new ApiError(payload?.error || `API request failed (${response.status}).`, response.status);
      }
      result = response.status === 204 ? undefined as T : hydrate(await response.json()) as T;
      break;
    } catch (error) {
      const shouldRetry = attempt === 0 && (timedOut || error instanceof TypeError);
      if (!shouldRetry) throw error;
      window.clearTimeout(timeout);
      await new Promise<void>((resolve) => window.setTimeout(resolve, RETRY_DELAY_MS));
    } finally {
      window.clearTimeout(timeout);
    }
  }

  return result as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export const api = {
  getProfile: () => request<Record<string, unknown>>('/api/users/me'),
  createProfile: (profile: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/users', json('POST', profile)),
  updateProfile: (updates: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/users/me', json('PATCH', updates)),
  getUser: (userId: string) =>
    request<Record<string, unknown>>(`/api/users/by-id/${encodeURIComponent(userId)}`),
  getDirectory: (role: 'volunteer' | 'ngo', location?: { lat: number; lng: number } | string) => {
    const query = new URLSearchParams({ role });
    const point = resolveLocation(location);
    if (point) {
      query.set('lat', String(point.lat));
      query.set('lng', String(point.lng));
    }
    return request<Record<string, unknown>[]>(`/api/users/directory?${query}`);
  },
  getVolunteers: () => request<Record<string, unknown>[]>('/api/users?role=volunteer'),
  getIssues: (filters?: {
    lat?: number;
    lng?: number;
    status?: Issue['status'] | Issue['status'][];
    mine?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (filters?.lat !== undefined) query.set('lat', String(filters.lat));
    if (filters?.lng !== undefined) query.set('lng', String(filters.lng));
    if (filters?.status) {
      query.set('status', Array.isArray(filters.status) ? filters.status.join(',') : filters.status);
    }
    if (filters?.mine !== undefined) query.set('mine', String(filters.mine));
    const queryString = query.toString();
    const suffix = queryString ? `?${queryString}` : '';
    return request<Issue[]>(`/api/issues${suffix}`);
  },
  getIssue: (id: string) => request<Issue>(`/api/issues/${encodeURIComponent(id)}`),
  uploadImage: (file: File) => {
    const body = new FormData();
    body.append('image', file);
    return request<{ blobName: string }>('/api/uploads', { method: 'POST', body });
  },
  getUploadUrl: (blobName: string) =>
    request<{ url: string; expiresInSeconds: number }>(
      `/api/uploads/${encodeURIComponent(blobName)}/url`
    ),
  createIssue: (issue: Partial<Issue>) => request<Issue>('/api/issues', json('POST', issue)),
  approveIssue: (id: string) =>
    request<Issue>(`/api/issues/${encodeURIComponent(id)}/approve`, json('PATCH')),
  assignIssue: (id: string) =>
    request<Issue>(`/api/issues/${encodeURIComponent(id)}/accept`, json('PATCH')),
  acceptIssue: (id: string) =>
    request<Issue>(`/api/issues/${encodeURIComponent(id)}/accept`, json('PATCH')),
  assignVolunteer: (id: string, volunteerId: string) =>
    request<Issue>(`/api/issues/${encodeURIComponent(id)}/assign`, json('PATCH', { volunteerId })),
  rejectIssue: (id: string) =>
    request<Issue>(`/api/issues/${encodeURIComponent(id)}/reject`, json('PATCH')),
  completeIssue: (id: string, details: Pick<Issue, 'completionProofBlob' | 'volunteerNotes'>) =>
    request<Issue>(`/api/issues/${encodeURIComponent(id)}/complete`, json('PATCH', details)),
  verifyIssue: (id: string) =>
    request<Issue>(`/api/issues/${encodeURIComponent(id)}/verify`, json('PATCH')),
  getNotifications: () => request<Record<string, unknown>[]>('/api/notifications'),
  createNotification: (notification: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/notifications', json('POST', notification)),
  markNotificationRead: (id: string) =>
    request<Record<string, unknown>>(`/api/notifications/${encodeURIComponent(id)}/read`, json('PATCH')),
  markAllNotificationsRead: () =>
    request<{ modifiedCount: number }>('/api/notifications/read-all', json('PATCH')),
  deleteNotification: (id: string) =>
    request<void>(`/api/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getAnalytics: () => request<ApiAnalytics>('/api/analytics'),
  rebuildGeohashes: () =>
    request<{ updatedUsers: number; updatedIssues: number }>('/api/users/maintenance/geohashes', json('POST')),
};

export function pollEvery<T>(
  load: () => Promise<T>,
  onData: (data: T) => void,
  onError: (error: unknown) => void = (error) => console.error('API polling failed:', error),
  intervalMs = 10_000,
): () => void {
  let active = true;
  let inFlight = false;
  const poll = async () => {
    if (!active || inFlight || document.visibilityState === 'hidden') return;
    inFlight = true;
    try {
      const result = await load();
      if (active) onData(result);
    } catch (error) {
      if (active) onError(error);
    } finally {
      inFlight = false;
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') void poll();
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  void poll();
  const timer = window.setInterval(() => void poll(), intervalMs);
  return () => {
    active = false;
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
