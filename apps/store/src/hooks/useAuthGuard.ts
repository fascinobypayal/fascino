import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useAuthGuard = () => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (isAuthenticated) {
        action();
      } else {
        setShowAuthModal(true);
      }
    },
    [isAuthenticated]
  );

  const closeAuthModal = useCallback(() => setShowAuthModal(false), []);

  return { showAuthModal, closeAuthModal, requireAuth };
};
