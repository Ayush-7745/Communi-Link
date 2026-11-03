import type { IssueStatus } from '../utils/issueStatus';

export interface Issue {
  id?: string;
  title: string;
  description: string;
  category: string;
  urgency: "Low" | "Medium" | "High";

  reportedBy: string;
  reportedByName?: string;
  assignedNgoId?: string | null;
  assignedNgoName?: string | null;
  assignedVolunteerId?: string | null;
  assignedVolunteerName?: string | null;

  status: IssueStatus;

  lat: number;
  lng: number;
  locationAddress?: string;
  geohash?: string;

  imageUrl?: string;
  imageBlob?: string;
  completionProofBlob?: string;
  proofImages?: string[];
  volunteerNotes?: string;
  deadline?: string;

  createdAt?: any;
  completedAt?: any;
  assignedAt?: any;
  verifiedBy?: string;
  verifiedAt?: any;
  updatedAt?: any;
}