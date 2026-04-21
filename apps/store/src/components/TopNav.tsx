import { useContext } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Heart, ShoppingCart, User } from 'lucide-react';
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
    <div className="hidden md:block sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="h-8 bg-foreground text-background flex items-center justify-center">
        <p className="text-[10px] uppercase tracking-[0.2em]">
          Free shipping on orders above ₹2,999&nbsp;&nbsp;·&nbsp;&nbsp;Easy 7-day returns
        </p>
      </div>

      {/* Main header */}
      <header className="h-16 bg-card border-b border-border px-8 flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="flex flex-col leading-tight group" aria-label="Fascino by Payal — home">
          <span className="font-serif text-2xl text-foreground tracking-wider group-hover:text-foreground/80 transition-colors duration-200">
            FASCINO
          </span>
          <span className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground -mt-0.5">
            BY PAYAL
          </span>
        </Link>

        {/* Center: Nav links */}
        <nav className="flex items-center gap-10" aria-label="Primary navigation">
          {navLinks.map(({ path, label, exact }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) =>
                `text-[11px] uppercase tracking-[0.18em] transition-colors duration-200 pb-0.5 border-b-2 ${
                  isActive
                    ? 'text-foreground border-foreground'
                    : 'text-muted-foreground border-transparent hover:text-foreground hover:border-foreground/40'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Icons */}
        <div className="flex items-center gap-4">
          <NavLink
            to="/wishlist"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
          </NavLink>

          <NavLink
            to="/cart"
            className="relative p-1 text-muted-foreground hover:text-foreground transition-colors duration-200"
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
            className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label="Profile"
          >
            <User className="h-5 w-5" />
          </NavLink>
        </div>
      </header>
    </div>
  );
};

export default TopNav;
