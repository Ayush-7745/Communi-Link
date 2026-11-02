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
    markAllNotificationsRead: () => Promise<void>;
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
    const markAllNotificationsRead = async () => {
        const unreadNotifications = notifications.filter((notification) => !notification.read);
        await Promise.all(unreadNotifications.map((notification) => api.markNotificationRead(notification.id)));
        const unreadIds = new Set(unreadNotifications.map((notification) => notification.id));
        setNotifications((current) => current.map((notification) =>
            unreadIds.has(notification.id) ? { ...notification, read: true } : notification
        ));
    };
    const deleteNotification = async (id: string) => {
        await api.deleteNotification(id);
        setNotifications((current) => current.filter((notification) => notification.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, markAllNotificationsRead, deleteNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotifications must be used inside provider");
    return context;
}