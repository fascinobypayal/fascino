import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { LuxuryCard } from "@/components/LuxuryCard";
import fascinoLogo from "@/assets/logo.svg";

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-serif text-foreground">About</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* App Info */}
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <img src={fascinoLogo} alt="Fascino logo" className="w-14 h-14 object-contain" />
            </div>
            <h2 className="text-xl font-serif text-foreground">Fascino Admin</h2>
            <p className="text-sm text-muted-foreground mt-1">By Payal</p>
            <p className="text-xs text-muted-foreground mt-4">Version 1.0.0</p>
          </div>

          {/* Links */}
          <LuxuryCard className="p-0 divide-y divide-border">
            <a
              href="#"
              className="flex items-center justify-between p-4 min-h-[56px]"
            >
              <span className="font-medium text-foreground">Terms of Service</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>

            <a
              href="#"
              className="flex items-center justify-between p-4 min-h-[56px]"
            >
              <span className="font-medium text-foreground">Privacy Policy</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>

            <a
              href="#"
              className="flex items-center justify-between p-4 min-h-[56px]"
            >
              <span className="font-medium text-foreground">Open Source Licenses</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </LuxuryCard>

          {/* Credits */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Made with ❤️ for boutique owners
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              © 2025 Fascino – By Payal. All rights reserved.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AboutPage;
