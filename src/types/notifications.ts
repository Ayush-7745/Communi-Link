import { Timestamp } from "firebase/firestore";

export interface Notification {
    id?: string;

    userId: string;        // 🔥 WHO will see this
    type: "issue-reported" | "task-assigned" | "task-completed" | "issue-resolved";

    title: string;
    message: string;

    issueId?: string;

    read: boolean;
    createdAt: Timestamp;
}