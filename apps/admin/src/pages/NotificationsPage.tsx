import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Bell, BellOff } from "lucide-react";
import { LuxuryCard } from "@/components/LuxuryCard";
import { useNotifications } from "@/hooks/useNotifications";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, isLoading, markAsRead } = useNotifications();

  const handleTap = (id: string, isRead: boolean | null) => {
    if (!isRead) {
      markAsRead.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-serif text-foreground">Notifications</h1>
          <button
            onClick={() => navigate("/more/notification-settings")}
            className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28 max-w-lg mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
              <BellOff className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-serif text-foreground text-lg">No notifications</p>
            <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LuxuryCard className="p-0 divide-y divide-border">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleTap(n.id, n.is_read)}
                  className="w-full flex items-start gap-3 p-4 text-left min-h-[72px]"
                >
                  <div className="relative mt-0.5">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-secondary" />
                    </div>
                    {!n.is_read && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-secondary border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {n.created_at
                        ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
                        : ""}
                    </p>
                  </div>
                </button>
              ))}
            </LuxuryCard>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;
