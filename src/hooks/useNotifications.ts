import { useEffect, useState } from "react";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp, writeBatch
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface AppNotification {
  id: string;
  recipientId: string;
  recipientRole: string;
  type: "new_donation" | "donation_accepted" | "donation_rejected" | "delivery_assigned" | "delivery_picked" | "delivery_completed";
  title: string;
  message: string;
  donationId?: string;
  read: boolean;
  createdAt: any;
}

export function useNotifications() {
  const { userDoc } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userDoc) return;
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userDoc.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const notifs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as AppNotification))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);

      // Show toast for very new notifications (within last 5 seconds)
      notifs.forEach((n) => {
        if (!n.read && n.createdAt?.toDate) {
          const age = Date.now() - n.createdAt.toDate().getTime();
          if (age < 5000) {
            toast(n.title, { description: n.message });
          }
        }
      });
    });
    return () => unsub();
  }, [userDoc]);

  const markAllRead = async () => {
    if (!userDoc) return;
    const batch = writeBatch(db);
    notifications.filter((n) => !n.read).forEach((n) => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  };

  const markRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  return { notifications, unreadCount, markAllRead, markRead };
}

// Helper to send a notification — call from wherever status changes
export async function sendNotification(data: Omit<AppNotification, "id" | "read" | "createdAt">) {
  try {
    await addDoc(collection(db, "notifications"), {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("Failed to send notification:", e);
  }
}
