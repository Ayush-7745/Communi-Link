import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useUser } from "./UserContext";
import { api, notifyWorkflowUpdated, pollEvery, ApiTimestamp, WORKFLOW_UPDATED_EVENT } from "../../services/api";


export interface Notification {
    id: string;

    userId: string; // 🔥 IMPORTANT

    title: string;
    message: string;

    type: "issue-reported" | "issue-approved" | "issue-rejected" | "task-assigned" | "task-accepted" | "task-completed" | "issue-verified" | "task-reassigned";

    issueId?: string;

    createdAt: ApiTimestamp;
    read: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    notificationsLoading: boolean;
    notificationsError: string | null;
    addNotification: (data: Omit<Notification, "id" | "createdAt" | "read">) => Promise<void>;
    markNotificationRead: (id: string) => Promise<void>;
    markAllNotificationsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(true);
    const [notificationsError, setNotificationsError] = useState<string | null>(null);
    const { userProfile } = useUser();
    const requestSequence = useRef(0);

    const loadNotifications = useCallback(async () => {
        if (!userProfile?.userId) {
            setNotifications([]);
            setNotificationsLoading(false);
            return;
        }
        const sequence = ++requestSequence.current;
        try {
            const data = await api.getNotifications();
            if (sequence !== requestSequence.current) return;
            setNotifications(data.map((item) => ({
                ...item,
                id: String(item.id || item._id || ''),
                userId: String(item.userId || ''),
                createdAt: item.createdAt as ApiTimestamp,
                read: Boolean(item.read),
            })) as unknown as Notification[]);
            setNotificationsLoading(false);
            setNotificationsError(null);
        } catch (error) {
            if (sequence === requestSequence.current) {
                setNotificationsLoading(false);
                setNotificationsError(error instanceof Error ? error.message : 'Unable to load notifications.');
            }
            throw error;
        }
    }, [userProfile?.userId]);

    useEffect(() => {
        if (!userProfile?.userId) {
            setNotifications([]);
            setNotificationsLoading(false);
            setNotificationsError(null);
            return;
        }
        setNotificationsLoading(true);
        const stopPolling = pollEvery(
            loadNotifications,
            () => undefined,
            (error) => {
                setNotificationsLoading(false);
                setNotificationsError(error instanceof Error ? error.message : 'Unable to load notifications.');
                console.error('Unable to load notifications:', error);
            }
        );
        const handleWorkflowUpdated = () => {
            void loadNotifications().catch((error) => {
                console.error('Unable to refresh notifications:', error);
            });
        };
        window.addEventListener(WORKFLOW_UPDATED_EVENT, handleWorkflowUpdated);
        return () => {
            stopPolling();
            requestSequence.current += 1;
            window.removeEventListener(WORKFLOW_UPDATED_EVENT, handleWorkflowUpdated);
        };
    }, [userProfile?.userId, loadNotifications]);

    const addNotification = async (
        data: Omit<Notification, "id" | "createdAt" | "read">
    ) => {
        await api.createNotification(data as unknown as Record<string, unknown>);
        notifyWorkflowUpdated();
    };
    const markNotificationRead = async (id: string) => {
        await api.markNotificationRead(id);
        requestSequence.current += 1;
        setNotifications((current) => current.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
        ));
    };
    const markAllNotificationsRead = async () => {
        await api.markAllNotificationsRead();
        requestSequence.current += 1;
        setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    };
    const deleteNotification = async (id: string) => {
        await api.deleteNotification(id);
        requestSequence.current += 1;
        setNotifications((current) => current.filter((notification) => notification.id !== id));
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            notificationsLoading,
            notificationsError,
            addNotification,
            markNotificationRead,
            markAllNotificationsRead,
            deleteNotification,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotifications must be used inside provider");
    return context;
}