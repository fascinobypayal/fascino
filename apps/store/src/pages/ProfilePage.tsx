import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Heart, MapPin, Bell, HelpCircle, User, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import BrandLogo from '@/components/BrandLogo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBottomNav } from '@/contexts/BottomNavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/contexts/WishlistContext';
import { useNotifications } from '@/contexts/NotificationsContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hideNav, showNav } = useBottomNav();
  const { isAuthenticated, user, logout } = useAuth();
  const { wishlistedProductIds } = useWishlist();
  const { unreadCount } = useNotifications();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const wishlistCount = wishlistedProductIds.size;

  const menuItems = [
    { icon: Heart, label: 'Wishlist', path: '/wishlist', badge: wishlistCount > 0 ? String(wishlistCount) : undefined },
    { icon: MapPin, label: 'Addresses', path: '/addresses' },
    { icon: Bell, label: 'Notifications', path: '/notifications', badge: unreadCount > 0 ? String(unreadCount) : undefined },
    { icon: HelpCircle, label: 'Help & Support', path: '/help' },
  ];

  const userName = user?.user_metadata?.full_name || user?.email || 'Guest';
  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

  const handleOpenLogout = () => {
    hideNav();
    setShowLogoutDialog(true);
  };

  const handleCloseLogout = () => {
    showNav();
    setShowLogoutDialog(false);
  };

  const handleLogout = async () => {
    await logout();
    toast({ title: 'Logged out', description: 'See you soon!' });
    handleCloseLogout();
  };

  // Guest view
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pb-20">
        <PageHeader title="Profile" />
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-2xl mb-2">Welcome to Fascino</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-[280px]">
            Log in to access your wishlist, orders, and saved addresses
          </p>
          <button
            onClick={() => navigate('/login', { state: { from: '/profile' } })}
            className="flex items-center justify-center gap-2 bg-accent text-accent-foreground px-8 py-3.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shadow-sm"
          >
            Log In / Sign Up
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-4 border-t border-border">
          <button onClick={() => navigate('/help')} className="w-full flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">Help & Support</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-4 py-8 text-center">
          <BrandLogo size="sm" />
          <p className="text-[10px] text-muted-foreground mt-4 tracking-wider">Version 1.0.0</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Profile" />

      <div className="px-4 py-8 text-center border-b border-border">
        <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
          <span className="font-serif text-2xl text-foreground">{userInitial}</span>
        </div>
        <h2 className="font-medium text-lg">{userName}</h2>
        <p className="text-sm text-muted-foreground mt-1">{userEmail}</p>
        <button
          onClick={() => navigate('/edit-profile')}
          className="mt-4 px-6 py-2.5 text-xs uppercase tracking-wider border border-foreground/20 rounded-lg hover:border-accent hover:text-accent transition-colors"
        >
          Edit Profile
        </button>
      </div>

      <div className="px-4 py-4">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center justify-between py-4 border-b border-border last:border-b-0 group"
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
              <span className="text-sm">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-sm">{item.badge}</span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        <button onClick={handleOpenLogout} className="w-full flex items-center gap-3 py-4 text-destructive">
          <LogOut className="h-5 w-5" />
          <span className="text-sm">Log Out</span>
        </button>
      </div>

      <div className="px-4 py-8 text-center">
        <BrandLogo size="sm" />
        <p className="text-[10px] text-muted-foreground mt-4 tracking-wider">Version 1.0.0</p>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={(open) => !open && handleCloseLogout()}>
        <AlertDialogContent className="max-w-[90vw] rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg">Log Out</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to log out of your account?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3">
            <AlertDialogCancel className="flex-1 m-0 btn-premium py-3 text-sm uppercase tracking-wider">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="flex-1 m-0 bg-destructive text-destructive-foreground py-3 text-sm uppercase tracking-wider hover:bg-destructive/90"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfilePage;
