import { useState } from "react";
import { Bell, CheckCheck, Package, Truck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const notifIcons: Record<AppNotification["type"], React.ReactNode> = {
  new_donation: <Package className="w-4 h-4 text-amber-500" />,
  donation_accepted: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  donation_rejected: <XCircle className="w-4 h-4 text-red-500" />,
  delivery_assigned: <Truck className="w-4 h-4 text-blue-500" />,
  delivery_picked: <Truck className="w-4 h-4 text-primary" />,
  delivery_completed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
};

const notifBg: Record<AppNotification["type"], string> = {
  new_donation: "bg-amber-50 border-amber-100",
  donation_accepted: "bg-green-50 border-green-100",
  donation_rejected: "bg-red-50 border-red-100",
  delivery_assigned: "bg-blue-50 border-blue-100",
  delivery_picked: "bg-primary/5 border-primary/10",
  delivery_completed: "bg-green-50 border-green-100",
};

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/40 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${notifBg[n.type]}`}>
                          {notifIcons[n.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {n.createdAt?.toDate
                              ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true })
                              : "Just now"}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
