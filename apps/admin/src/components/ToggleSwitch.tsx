import { motion } from "framer-motion";

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  label?: string;
  description?: string;
}

export const ToggleSwitch = ({ enabled, onToggle, label, description }: ToggleSwitchProps) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 mr-4">
        {label && (
          <p className="text-sm font-medium text-foreground">{label}</p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`luxury-toggle ${
          enabled ? "bg-secondary" : "bg-muted"
        }`}
      >
        <motion.span
          className="pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg"
          animate={{ x: enabled ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
};
