export interface Notification {
    id?: string;

    userId: string;        // 🔥 WHO will see this
    type: "issue-reported" | "task-assigned" | "task-completed" | "issue-resolved";

    title: string;
    message: string;

    issueId?: string;

    read: boolean;
    createdAt: {
        seconds: number;
        nanoseconds: number;
        toDate: () => Date;
        toMillis: () => number;
    } | Date | string;
}