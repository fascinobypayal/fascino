import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Sparkles } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    });

    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
    });
  }

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return { isInstallable, promptInstall };
};

interface InstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export const InstallBanner = ({ onInstall, onDismiss }: InstallBannerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-20 left-4 right-4 z-50 glass rounded-2xl p-4 shadow-luxury-lg border border-border"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-secondary-foreground" />
        </div>
        <div className="flex-1">
          <h4 className="font-serif text-foreground">Install Fascino Admin</h4>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add to your home screen for the best experience
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onDismiss}
          className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-medium text-sm"
        >
          Not Now
        </button>
        <button
          onClick={onInstall}
          className="flex-1 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Install
        </button>
      </div>
    </motion.div>
  );
};
