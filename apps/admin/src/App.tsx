import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { BottomNavProvider } from "@/contexts/BottomNavContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RequireAuth } from "@/components/RequireAuth";
import HomePage from "./pages/HomePage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import AddProductPage from "./pages/AddProductPage";
import CollectionDetailPage from "./pages/CollectionDetailPage";
import AddCollectionPage from "./pages/AddCollectionPage";
import OrdersPage from "./pages/OrdersPage";
import ReturnsPage from "./pages/ReturnsPage";
import CustomersPage from "./pages/CustomersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import MorePage from "./pages/MorePage";
import ProfilePage from "./pages/ProfilePage";
import StoreSettingsPage from "./pages/StoreSettingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import SecurityPage from "./pages/SecurityPage";
import HelpPage from "./pages/HelpPage";
import AboutPage from "./pages/AboutPage";
import CouponsPage from "./pages/CouponsPage";
import AddCouponPage from "./pages/AddCouponPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BottomNavProvider>
            <AnimatePresence mode="wait">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected routes */}
                <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
                <Route path="/catalog" element={<RequireAuth><CatalogPage /></RequireAuth>} />
                <Route path="/catalog/product/new" element={<RequireAuth><AddProductPage /></RequireAuth>} />
                <Route path="/catalog/product/:id" element={<RequireAuth><ProductDetailPage /></RequireAuth>} />
                <Route path="/catalog/collection/new" element={<RequireAuth><AddCollectionPage /></RequireAuth>} />
                <Route path="/catalog/collection/:id" element={<RequireAuth><CollectionDetailPage /></RequireAuth>} />
                <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
                <Route path="/orders/returns" element={<RequireAuth><ReturnsPage /></RequireAuth>} />
                <Route path="/customers" element={<RequireAuth><CustomersPage /></RequireAuth>} />
                <Route path="/analytics" element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
                <Route path="/more" element={<RequireAuth><MorePage /></RequireAuth>} />
                <Route path="/more/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                <Route path="/more/store" element={<RequireAuth><StoreSettingsPage /></RequireAuth>} />
                <Route path="/more/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
                <Route path="/more/notification-settings" element={<RequireAuth><NotificationSettingsPage /></RequireAuth>} />
                <Route path="/more/security" element={<RequireAuth><SecurityPage /></RequireAuth>} />
                <Route path="/more/help" element={<RequireAuth><HelpPage /></RequireAuth>} />
                <Route path="/more/about" element={<RequireAuth><AboutPage /></RequireAuth>} />
                <Route path="/more/coupons" element={<RequireAuth><CouponsPage /></RequireAuth>} />
                <Route path="/more/coupons/:id" element={<RequireAuth><AddCouponPage /></RequireAuth>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </BottomNavProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
