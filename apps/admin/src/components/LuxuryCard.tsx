import { motion } from "framer-motion";
import { ReactNode } from "react";

interface LuxuryCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

export const LuxuryCard = ({ children, className = "", delay = 0, onClick }: LuxuryCardProps) => {
  return (
    <motion.div
      className={`luxury-card ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};
