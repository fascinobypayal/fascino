import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { BottomNavigation } from "./BottomNavigation";
import { Sidebar } from "./Sidebar";
import { AdminContext } from "@/contexts/AdminContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export { useAdminContext } from "@/contexts/AdminContext";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const { loading, authenticated, profile, signOutAndRedirect } = useAdminAuth();

  if (loading || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ profile, signOutAndRedirect }}>
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col md:ml-64">
          {/* Header */}
          <header className="sticky top-0 z-40 glass border-b border-border px-4 py-4 md:px-6">
            <div className="max-w-2xl mx-auto md:mx-0">
              {title && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-xl font-serif text-foreground">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
                  )}
                </motion.div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-4 py-6 pb-28 md:pb-6 max-w-2xl mx-auto md:mx-0 md:max-w-4xl w-full">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </main>

          {/* Bottom Navigation — mobile only */}
          <BottomNavigation />
        </div>
      </div>
    </AdminContext.Provider>
  );
};
