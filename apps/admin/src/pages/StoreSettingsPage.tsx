import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { LuxuryCard } from "@/components/LuxuryCard";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const currencies = ["INR", "USD", "EUR", "GBP"];

const StoreSettingsPage = () => {
  const navigate = useNavigate();
  const { settings, loading, saving, updateField, saveSettings } = useStoreSettings();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <h1 className="text-lg font-serif text-foreground">Store Settings</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28 max-w-lg mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Basic Info */}
          <LuxuryCard>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Store Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Store Name
                </label>
                <input
                  type="text"
                  value={settings?.store_name ?? ""}
                  onChange={(e) => updateField("store_name", e.target.value)}
                  className="luxury-input mt-2"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Address
                </label>
                <textarea
                  value={settings?.address ?? ""}
                  onChange={(e) => updateField("address", e.target.value)}
                  className="luxury-input mt-2 min-h-[80px] resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Currency
                </label>
                <select
                  value={settings?.currency ?? "INR"}
                  onChange={(e) => updateField("currency", e.target.value)}
                  className="luxury-input mt-2"
                >
                  {currencies.map((cur) => (
                    <option key={cur} value={cur}>{cur}</option>
                  ))}
                </select>
              </div>
            </div>
          </LuxuryCard>

          {/* Support Info */}
          <LuxuryCard>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Support Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings?.support_email ?? ""}
                  onChange={(e) => updateField("support_email", e.target.value)}
                  className="luxury-input mt-2"
                  placeholder="support@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Support Phone
                </label>
                <input
                  type="tel"
                  value={settings?.support_phone ?? ""}
                  onChange={(e) => updateField("support_phone", e.target.value)}
                  className="luxury-input mt-2"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={settings?.support_whatsapp ?? ""}
                  onChange={(e) => updateField("support_whatsapp", e.target.value)}
                  className="luxury-input mt-2"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </LuxuryCard>

          {/* Payment */}
          <LuxuryCard>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Payment
            </h3>
            <ToggleSwitch
              label="Cash on Delivery"
              description="Allow customers to pay on delivery"
              enabled={settings?.cod_enabled ?? true}
              onToggle={() => updateField("cod_enabled", !(settings?.cod_enabled ?? true))}
            />
          </LuxuryCard>

          {/* Policies */}
          <LuxuryCard>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Policies
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Return Policy
                </label>
                <textarea
                  value={settings?.return_policy ?? ""}
                  onChange={(e) => updateField("return_policy", e.target.value)}
                  className="luxury-input mt-2 min-h-[100px] resize-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Exchange Policy
                </label>
                <textarea
                  value={settings?.exchange_policy ?? ""}
                  onChange={(e) => updateField("exchange_policy", e.target.value)}
                  className="luxury-input mt-2 min-h-[100px] resize-none"
                  rows={4}
                />
              </div>
            </div>
          </LuxuryCard>

          {/* Save Button */}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full luxury-button-primary min-h-[48px] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default StoreSettingsPage;
