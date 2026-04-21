import { useEffect } from 'react';
import { useBottomNav } from '@/contexts/BottomNavContext';

interface BottomActionBarProps {
  children: React.ReactNode;
}

const BottomActionBar = ({ children }: BottomActionBarProps) => {
  const { hideNav, showNav } = useBottomNav();

  useEffect(() => {
    hideNav();
    return () => {
      showNav();
    };
  }, [hideNav, showNav]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="px-4 py-3 pb-safe-bottom flex gap-3">
        {children}
      </div>
    </div>
  );
};

export default BottomActionBar;
