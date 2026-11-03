import type { ApiTimestamp } from "../services/api";

export interface Notification {
    id?: string;

    userId: string;        // 🔥 WHO will see this
    type:
        | "issue-reported"
        | "issue-approved"
        | "issue-rejected"
        | "task-assigned"
        | "task-accepted"
        | "task-completed"
        | "issue-verified"
        | "task-reassigned";

    title: string;
    message: string;

    issueId?: string;

    read: boolean;
    createdAt: ApiTimestamp | Date | string;
}