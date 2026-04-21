import { useContext } from 'react';
import { Home, ShoppingBag, ShoppingCart, Package, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { CartContext } from '@/contexts/CartContext';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/shop', icon: ShoppingBag, label: 'Shop' },
  { path: '/cart', icon: ShoppingCart, label: 'Cart' },
  { path: '/orders', icon: Package, label: 'Orders' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export const BottomNav = () => {
  const location = useLocation();
  const { isVisible } = useBottomNav();
  const cart = useContext(CartContext);
  const itemCount = cart?.itemCount ?? 0;

  if (!isVisible) return null;

  return (
    <div className="md:hidden">
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border animate-fade-in">
        <div className="flex items-center justify-around pb-safe-bottom">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const showBadge = item.path === '/cart' && itemCount > 0;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item flex-1 py-3 relative ${isActive ? 'nav-item-active' : ''}`}
              >
                <div className="relative">
                  <item.icon
                    className={`h-5 w-5 transition-transform duration-200 ${
                      isActive ? 'scale-110' : ''
                    }`}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2.5 bg-accent text-accent-foreground text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
