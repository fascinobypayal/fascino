import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingCart, User } from 'lucide-react';
import { CartContext } from '@/contexts/CartContext';

const navLinks = [
  { path: '/', label: 'Home', exact: true },
  { path: '/shop', label: 'Shop', exact: false },
  { path: '/orders', label: 'Orders', exact: false },
  { path: '/wishlist', label: 'Wishlist', exact: false },
];

const TopNav = () => {
  const cart = useContext(CartContext);
  const itemCount = cart?.itemCount ?? 0;

  return (
    <header className="hidden md:flex relative z-50 bg-card border-b border-border px-6 h-14 items-center justify-between">
      {/* Left: Brand */}
      <div className="flex flex-col leading-tight">
        <span className="font-serif text-xl text-foreground tracking-wide">Fascino</span>
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground -mt-0.5">By Payal</span>
      </div>

      {/* Center: Nav links */}
      <nav className="flex items-center gap-6" aria-label="Primary navigation">
        {navLinks.map(({ path, label, exact }) => (
          <NavLink
            key={path}
            to={path}
            end={exact}
            className={({ isActive }) =>
              `text-xs uppercase tracking-widest transition-colors duration-200 ${
                isActive
                  ? 'text-accent border-b border-accent pb-0.5'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Right: Cart + Profile */}
      <div className="flex items-center gap-4">
        <NavLink
          to="/cart"
          className="relative p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Shopping cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1.5 bg-accent text-accent-foreground text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </NavLink>
        <NavLink
          to="/profile"
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Profile"
        >
          <User className="h-5 w-5" />
        </NavLink>
      </div>
    </header>
  );
};

export default TopNav;
