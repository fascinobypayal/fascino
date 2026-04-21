import { NavLink } from "react-router-dom";
import { Home, LayoutGrid, ClipboardList, BarChart3, MoreHorizontal, LogOut } from "lucide-react";
import { useAdminContext } from "@/contexts/AdminContext";
import { useNotifications } from "@/hooks/useNotifications";

const navItems = [
  { path: "/", label: "Home", icon: Home, exact: true },
  { path: "/catalog", label: "Catalog", icon: LayoutGrid, exact: false },
  { path: "/orders", label: "Orders", icon: ClipboardList, exact: false },
  { path: "/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { path: "/more", label: "More", icon: MoreHorizontal, exact: false },
];

export const Sidebar = () => {
  const { signOutAndRedirect } = useAdminContext();
  const { unreadCount } = useNotifications();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-card border-r border-border px-3 py-6 fixed top-0 left-0 z-40">
      {/* Brand */}
      <div className="px-3 mb-8">
        <p className="font-serif text-lg text-foreground tracking-wide">Fascino Admin</p>
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-0.5">Management</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1" aria-label="Admin navigation">
        {navItems.map(({ path, label, icon: Icon, exact }) => (
          <NavLink
            key={path}
            to={path}
            end={exact}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-secondary/10 text-secondary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
            {path === "/more" && unreadCount > 0 && (
              <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="mt-auto pt-4 border-t border-border">
        <button
          onClick={signOutAndRedirect}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
