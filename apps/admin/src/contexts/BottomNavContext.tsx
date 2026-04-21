import { createContext, useContext, useState, ReactNode } from "react";

interface BottomNavContextType {
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
}

const BottomNavContext = createContext<BottomNavContextType>({
  isVisible: true,
  setVisible: () => {},
});

export const useBottomNav = () => useContext(BottomNavContext);

export const BottomNavProvider = ({ children }: { children: ReactNode }) => {
  const [isVisible, setVisible] = useState(true);

  return (
    <BottomNavContext.Provider value={{ isVisible, setVisible }}>
      {children}
    </BottomNavContext.Provider>
  );
};
