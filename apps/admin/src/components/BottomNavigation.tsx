import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  LayoutGrid, 
  ClipboardList, 
  BarChart3, 
  MoreHorizontal 
} from "lucide-react";
import { useBottomNav } from "@/contexts/BottomNavContext";
import { useNotifications } from "@/hooks/useNotifications";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/catalog", label: "Catalog", icon: LayoutGrid },
  { path: "/orders", label: "Orders", icon: ClipboardList },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/more", label: "More", icon: MoreHorizontal },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const { isVisible } = useBottomNav();
  const { unreadCount } = useNotifications();

  const isActive = (path: string) => {
    if (path === "/catalog") {
      return location.pathname === "/catalog" || 
             location.pathname.startsWith("/catalog/");
    }
    return location.pathname === path;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ duration: 0.2 }}
        >
      <div className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <RouterNavLink
              key={item.path}
              to={item.path}
              className="flex-1 min-h-[44px] flex items-center justify-center"
            >
              <motion.div
                className="flex flex-col items-center gap-1"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <div className="relative">
                  <Icon 
                    className={`w-5 h-5 transition-colors duration-200 ${
                      active ? "text-secondary" : "text-muted-foreground"
                    }`} 
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {item.path === "/more" && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 left-1/2 w-1 h-1 rounded-full bg-secondary"
                      style={{ x: "-50%" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors duration-200 ${
                  active ? "text-secondary" : "text-muted-foreground"
                }`}>
                  {item.label}
                </span>
              </motion.div>
            </RouterNavLink>
          );
        })}
      </div>
    </motion.nav>
      )}
    </AnimatePresence>
  );
};
