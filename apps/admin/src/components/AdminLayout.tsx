import { ReactNode, createContext, useContext } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { BottomNavigation } from "./BottomNavigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AdminProfile {
  full_name: string;
  email: string;
  role: string | null;
}

interface AdminContextType {
  profile: AdminProfile | null;
  signOutAndRedirect: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({ profile: null, signOutAndRedirect: async () => {} });

export const useAdminContext = () => useContext(AdminContext);

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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border px-4 py-4">
          <div className="max-w-lg mx-auto">
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
        <main className="flex-1 overflow-y-auto px-4 py-6 pb-28 max-w-lg mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </AdminContext.Provider>
  );
};
