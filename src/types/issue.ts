import { Timestamp } from "firebase/firestore";

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

  status: "pending" | "approved" | "assigned" | "completed" | "verified" | "rejected";

  lat: number;
  lng: number;
  geohash?: string;

  imageUrl?: string;
  proofImages?: string[];
  volunteerNotes?: string;
  deadline?: string;

  createdAt?: any;
  completedAt?: any;
}