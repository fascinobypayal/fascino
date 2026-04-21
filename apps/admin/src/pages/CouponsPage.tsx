import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Ticket, ChevronRight, Loader2 } from "lucide-react";
import { LuxuryCard } from "@/components/LuxuryCard";
import { useCoupons, getCouponStatus, type Coupon, type CouponStatus } from "@/hooks/useCoupons";

const statusStyles: Record<CouponStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-muted text-muted-foreground",
  disabled: "bg-amber-100 text-amber-700",
};

const statusLabels: Record<CouponStatus, string> = {
  active: "Active",
  expired: "Expired",
  disabled: "Disabled",
};

const CouponStatusChip = ({ coupon }: { coupon: Coupon }) => {
  const status = getCouponStatus(coupon);
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
};

const CouponCard = ({ coupon, onClick }: { coupon: Coupon; onClick: () => void }) => {
  const discountLabel = coupon.discount_type === "FLAT"
    ? `₹${coupon.discount_value} off`
    : `${coupon.discount_value}% off`;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <LuxuryCard className="active:scale-[0.98] transition-transform cursor-pointer" onClick={onClick}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <Ticket className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-medium text-foreground">{coupon.code}</h3>
                <CouponStatusChip coupon={coupon} />
              </div>
              <p className="text-sm text-secondary mt-0.5">{discountLabel}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Used {coupon.usage_count ?? 0} / {coupon.max_usage ?? "∞"} times
          </p>
          <p className="text-xs text-muted-foreground">
            {coupon.expiry_date
              ? `Expires: ${new Date(coupon.expiry_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
              : "No expiry"}
          </p>
        </div>
      </LuxuryCard>
    </motion.div>
  );
};

const CouponsPage = () => {
  const navigate = useNavigate();
  const { data: coupons, isLoading } = useCoupons();
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredCoupons = (coupons ?? []).filter((coupon) => {
    if (filter === "all") return true;
    const status = getCouponStatus(coupon);
    return filter === "active" ? status === "active" : status !== "active";
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-serif text-foreground">Coupons</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28 max-w-lg mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4">
            {([
              { key: "all" as const, label: "All" },
              { key: "active" as const, label: "Active" },
              { key: "inactive" as const, label: "Inactive" },
            ]).map((s) => (
              <button
                key={s.key}
                onClick={() => setFilter(s.key)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[44px] ${
                  filter === s.key ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCoupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} onClick={() => navigate(`/more/coupons/${coupon.id}`)} />
              ))}
            </div>
          )}

          {!isLoading && filteredCoupons.length === 0 && (
            <div className="py-12 text-center">
              <Ticket className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No coupons found</p>
            </div>
          )}
        </motion.div>
      </main>

      <motion.button
        className="fixed bottom-24 right-4 w-14 h-14 bg-secondary text-secondary-foreground rounded-2xl shadow-lg flex items-center justify-center z-30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/more/coupons/new")}
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default CouponsPage;
