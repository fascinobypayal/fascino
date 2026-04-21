import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Store, Bell, Shield, HelpCircle, LogOut, ChevronRight, Info, Ticket } from "lucide-react";
import { AdminLayout, useAdminContext } from "@/components/AdminLayout";
import { LuxuryCard } from "@/components/LuxuryCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  danger?: boolean;
}

const SettingItem = ({ icon, title, subtitle, onClick, danger }: SettingItemProps) => {
  return (
    <motion.button
      className="w-full flex items-center gap-4 p-4 text-left min-h-[56px]"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        danger ? "bg-destructive/10" : "bg-accent"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${danger ? "text-destructive" : "text-foreground"}`}>
          {title}
        </p>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      <ChevronRight className={`w-5 h-5 flex-shrink-0 ${danger ? "text-destructive/50" : "text-muted-foreground"}`} />
    </motion.button>
  );
};

const MorePageContent = () => {
  const navigate = useNavigate();
  const { profile, signOutAndRedirect } = useAdminContext();
  const adminName = profile?.full_name || "";
  const adminEmail = profile?.email || "";
  
  return (
    <div className="space-y-8">
      {/* Account Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">
          Account
        </p>
        <LuxuryCard className="p-0 overflow-hidden">
          {/* Profile Preview */}
          <button 
            onClick={() => navigate("/more/profile")}
            className="w-full p-4 flex items-center gap-4 border-b border-border text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <span className="text-xl font-serif text-secondary">
                {adminName ? adminName.charAt(0).toUpperCase() : "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-foreground">{adminName || adminEmail || "Admin"}</h3>
              <p className="text-sm text-muted-foreground truncate">{adminEmail || ""}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
          <SettingItem
            icon={<User className="w-5 h-5 text-secondary" />}
            title="Edit Profile"
            subtitle="Name, photo, contact"
            onClick={() => navigate("/more/profile")}
          />
        </LuxuryCard>
      </motion.div>

      {/* Store Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">
          Store
        </p>
        <LuxuryCard className="p-0 divide-y divide-border">
          <SettingItem
            icon={<Store className="w-5 h-5 text-secondary" />}
            title="Store Settings"
            subtitle="Name, address, currency"
            onClick={() => navigate("/more/store")}
          />
          <SettingItem
            icon={<Ticket className="w-5 h-5 text-secondary" />}
            title="Coupons"
            subtitle="Manage discount codes"
            onClick={() => navigate("/more/coupons")}
          />
          <SettingItem
            icon={<Bell className="w-5 h-5 text-secondary" />}
            title="Notifications"
            subtitle="Order alerts, updates"
            onClick={() => navigate("/more/notifications")}
          />
        </LuxuryCard>
      </motion.div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">
          Security
        </p>
        <LuxuryCard className="p-0 divide-y divide-border">
          <SettingItem
            icon={<Shield className="w-5 h-5 text-secondary" />}
            title="Privacy & Security"
            subtitle="Password, data protection"
            onClick={() => navigate("/more/security")}
          />
          <SettingItem
            icon={<HelpCircle className="w-5 h-5 text-secondary" />}
            title="Help & Support"
            subtitle="FAQs, contact us"
            onClick={() => navigate("/more/help")}
          />
          <SettingItem
            icon={<Info className="w-5 h-5 text-secondary" />}
            title="About"
            subtitle="App version, terms"
            onClick={() => navigate("/more/about")}
          />
        </LuxuryCard>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <LuxuryCard className="p-0">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full">
                <SettingItem
                  icon={<LogOut className="w-5 h-5 text-destructive" />}
                  title="Log Out"
                  danger
                />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log Out?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to log out of your account?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground min-h-[44px]"
                  onClick={() => signOutAndRedirect()}
                >
                  Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </LuxuryCard>
      </motion.div>

      {/* Version */}
      <motion.p
        className="text-center text-xs text-muted-foreground pt-2 pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        Fascino Admin v1.0.0
      </motion.p>
    </div>
  );
};

const MorePage = () => {
  return (
    <AdminLayout title="More" subtitle="Settings & account">
      <MorePageContent />
    </AdminLayout>
  );
};

export default MorePage;
