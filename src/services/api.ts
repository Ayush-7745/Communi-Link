import { auth } from '../config/firebase';
import type { Issue } from '../types/issue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  if (typeof value === 'string' && ['createdAt', 'updatedAt', 'assignedAt', 'completedAt'].includes(key)) {
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

  const response = await fetch(`${API_URL.replace(/\/$/, '')}${path}`, { ...options, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new ApiError(payload?.error || `API request failed (${response.status}).`, response.status);
  }
  if (response.status === 204) return undefined as T;
  return hydrate(await response.json()) as T;
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
  getIssues: (location?: { lat: number; lng: number }) => {
    const query = location ? `?lat=${encodeURIComponent(location.lat)}&lng=${encodeURIComponent(location.lng)}` : '';
    return request<Issue[]>(`/api/issues${query}`);
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
    request<Issue>(`/api/issues/${encodeURIComponent(id)}/assign`, json('PATCH')),
  assignVolunteer: (id: string, volunteerId: string) =>
    request<Issue>(`/api/issues/${encodeURIComponent(id)}/assign-volunteer`, json('PATCH', { volunteerId })),
  completeIssue: (id: string, details: Pick<Issue, 'completionProofBlob' | 'volunteerNotes'>) =>
    request<Issue>(`/api/issues/${encodeURIComponent(id)}/complete`, json('PATCH', details)),
  verifyIssue: (id: string) =>
    request<Issue>(`/api/issues/${encodeURIComponent(id)}/verify`, json('PATCH')),
  getNotifications: () => request<Record<string, unknown>[]>('/api/notifications'),
  createNotification: (notification: Record<string, unknown>) =>
    request<Record<string, unknown>>('/api/notifications', json('POST', notification)),
  markNotificationRead: (id: string) =>
    request<Record<string, unknown>>(`/api/notifications/${encodeURIComponent(id)}/read`, json('PATCH')),
  deleteNotification: (id: string) =>
    request<void>(`/api/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  getAnalytics: () => request<Record<string, unknown>>('/api/analytics'),
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
    if (!active || inFlight) return;
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

  void poll();
  const timer = window.setInterval(() => void poll(), intervalMs);
  return () => {
    active = false;
    window.clearInterval(timer);
  };
}
