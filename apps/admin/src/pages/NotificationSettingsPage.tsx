import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, Package, MessageSquare, Users, Bell, Loader2 } from "lucide-react";
import { LuxuryCard } from "@/components/LuxuryCard";
import { useNotificationSettings, NotificationSettingsData } from "@/hooks/useNotificationSettings";

interface SettingRow {
  key: keyof NotificationSettingsData;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const settingRows: SettingRow[] = [
  { key: "new_orders", title: "New Orders", description: "Get notified when you receive a new order", icon: <ShoppingBag className="w-5 h-5 text-secondary" /> },
  { key: "order_updates", title: "Order Updates", description: "Status changes, cancellations, and refunds", icon: <Package className="w-5 h-5 text-secondary" /> },
  { key: "customer_messages", title: "Customer Messages", description: "Notes and inquiries from customers", icon: <MessageSquare className="w-5 h-5 text-secondary" /> },
  { key: "new_customers", title: "New Customers", description: "When someone creates an account", icon: <Users className="w-5 h-5 text-secondary" /> },
  { key: "low_stock", title: "Low Stock Alerts", description: "When product inventory is running low", icon: <Bell className="w-5 h-5 text-secondary" /> },
];

const NotificationSettingsPage = () => {
  const navigate = useNavigate();
  const { settings, isLoading, updateSetting } = useNotificationSettings();

  const handleToggle = (key: keyof NotificationSettingsData) => {
    updateSetting.mutate({ [key]: !settings[key] });
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
          <h1 className="text-lg font-serif text-foreground">Notification Settings</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28 max-w-lg mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LuxuryCard className="p-0 divide-y divide-border">
              {settingRows.map((row) => (
                <div key={row.key} className="flex items-center gap-4 p-4 min-h-[72px]">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    {row.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{row.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(row.key)}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      settings[row.key] ? "bg-secondary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-card shadow-sm transition-transform ${
                        settings[row.key] ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </LuxuryCard>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Push notifications require browser permission
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default NotificationSettingsPage;
