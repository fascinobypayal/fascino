import { createContext, useContext } from "react";

interface AdminProfile {
  full_name: string;
  email: string;
  role: string | null;
}

export interface AdminContextType {
  profile: AdminProfile | null;
  signOutAndRedirect: () => Promise<void>;
}

export const AdminContext = createContext<AdminContextType>({
  profile: null,
  signOutAndRedirect: async () => {},
});

export const useAdminContext = () => useContext(AdminContext);
