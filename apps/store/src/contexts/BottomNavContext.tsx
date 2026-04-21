import { createContext, useContext, useState, ReactNode } from 'react';

interface BottomNavContextType {
  isVisible: boolean;
  hideNav: () => void;
  showNav: () => void;
}

const BottomNavContext = createContext<BottomNavContextType | undefined>(undefined);

export const BottomNavProvider = ({ children }: { children: ReactNode }) => {
  const [isVisible, setIsVisible] = useState(true);

  const hideNav = () => setIsVisible(false);
  const showNav = () => setIsVisible(true);

  return (
    <BottomNavContext.Provider value={{ isVisible, hideNav, showNav }}>
      {children}
    </BottomNavContext.Provider>
  );
};

export const useBottomNav = () => {
  const context = useContext(BottomNavContext);
  if (!context) {
    throw new Error('useBottomNav must be used within a BottomNavProvider');
  }
  return context;
};
