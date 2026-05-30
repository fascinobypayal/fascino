import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BottomNavProvider } from "@/contexts/BottomNavContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { StoreSettingsProvider } from "@/contexts/StoreSettingsContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import HomePage from "@/pages/HomePage";
import ShopPage from "@/pages/ShopPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import EditProfilePage from "@/pages/EditProfilePage";
import WishlistPage from "@/pages/WishlistPage";
import AddressesPage from "@/pages/AddressesPage";
import NotificationsPage from "@/pages/NotificationsPage";
import HelpSupportPage from "@/pages/HelpSupportPage";
import OrderSuccessPage from "@/pages/OrderSuccessPage";
import LoginPage from "@/pages/LoginPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import CollectionPage from "@/pages/CollectionPage";
import NewArrivalsPage from "@/pages/NewArrivalsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isRecovery, loading } = useAuth();

  if (loading) return null;

  // If recovery token detected, redirect to reset-password page
  if (isRecovery) {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/reset-password" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/new-arrivals" element={<NewArrivalsPage />} />
      <Route path="/collection/:id" element={<CollectionPage />} />
      <Route path="/product/:id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/order/:id" element={<OrderDetailPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/edit-profile" element={<EditProfilePage />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/addresses" element={<AddressesPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/help" element={<HelpSupportPage />} />
      <Route path="/order-success" element={<OrderSuccessPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <StoreSettingsProvider>
            <CartProvider>
            <WishlistProvider>
            <NotificationsProvider>
            <BottomNavProvider>
              <div className="min-h-screen bg-background">
                <TopNav />
                <AppRoutes />
                <BottomNav />
              </div>
            </BottomNavProvider>
            </NotificationsProvider>
            </WishlistProvider>
            </CartProvider>
            </StoreSettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
