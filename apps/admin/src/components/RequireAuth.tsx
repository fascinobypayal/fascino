import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

/**
 * Route-level admin guard. Wrap any protected route element with this so
 * unauthenticated users are bounced to /login before any UI renders.
 */
export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { loading, authenticated } = useAdminAuth();

  if (loading || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};