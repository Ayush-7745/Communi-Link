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
  updatedAt?: any;
}