import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { collection, onSnapshot, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useUser } from "./UserContext";
import { deleteDoc, doc } from "firebase/firestore";





export interface Notification {
    id: string;

    userId: string; // 🔥 IMPORTANT

    title: string;
    message: string;

    type: "issue-reported" | "issue-approved" | "task-assigned" | "task-accepted" | "task-completed" | "issue-verified" | "task-reassigned";

    issueId?: string;

    createdAt: Timestamp;
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
        if (!userProfile?.userId) return;
        console.log("Current user:", userProfile?.userId);

        const unsubscribe = onSnapshot(collection(db, "notifications"), (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Notification[];

            console.log("All notifications:", data);

            const userNotifications = data
                .filter((n) => n.userId === userProfile.userId)
                .sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                    return timeB - timeA;
                });

            console.log("Filtered and sorted:", userNotifications);

            setNotifications(userNotifications);
        });

        return () => unsubscribe();
    }, [userProfile?.userId]);

    const addNotification = async (
        data: Omit<Notification, "id" | "createdAt" | "read">
    ) => {
        await addDoc(collection(db, "notifications"), {
            ...data,
            createdAt: Timestamp.now(),
            read: false,
        });
    };
    const deleteNotification = async (id: string) => {
        await deleteDoc(doc(db, "notifications", id));
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