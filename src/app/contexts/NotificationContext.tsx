import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useUser } from "./UserContext";
import { api, pollEvery, ApiTimestamp } from "../../services/api";


export interface Notification {
    id: string;

    userId: string; // 🔥 IMPORTANT

    title: string;
    message: string;

    type: "issue-reported" | "issue-approved" | "task-assigned" | "task-accepted" | "task-completed" | "issue-verified" | "task-reassigned";

    issueId?: string;

    createdAt: ApiTimestamp;
    read: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (data: Omit<Notification, "id" | "createdAt" | "read">) => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { userProfile } = useUser();

    useEffect(() => {
        if (!userProfile?.userId) {
            setNotifications([]);
            return;
        }
        return pollEvery(
            api.getNotifications,
            (data) => setNotifications(data as unknown as Notification[])
        );
    }, [userProfile?.userId]);

    const addNotification = async (
        data: Omit<Notification, "id" | "createdAt" | "read">
    ) => {
        await api.createNotification(data as unknown as Record<string, unknown>);
    };
    const deleteNotification = async (id: string) => {
        await api.deleteNotification(id);
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, deleteNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotifications must be used inside provider");
    return context;
}