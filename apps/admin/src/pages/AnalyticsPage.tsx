import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { IndianRupee, ShoppingBag, TrendingUp, Users, Crown, Loader2, DollarSign, PoundSterling, Euro } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { LuxuryCard } from "@/components/LuxuryCard";
import { useAnalytics } from "@/hooks/useAnalytics";

const currencyIcons: Record<string, React.ReactNode> = {
  INR: <IndianRupee className="w-5 h-5 text-secondary" />,
  USD: <DollarSign className="w-5 h-5 text-secondary" />,
  GBP: <PoundSterling className="w-5 h-5 text-secondary" />,
  EUR: <Euro className="w-5 h-5 text-secondary" />,
};

const currencySymbols: Record<string, string> = {
  INR: "₹",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  delay: number;
  onClick?: () => void;
}

const StatCard = ({ title, value, icon, delay, onClick }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    onClick={onClick}
    className={onClick ? "cursor-pointer" : ""}
  >
    <LuxuryCard>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-serif text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{title}</p>
      </div>
    </LuxuryCard>
  </motion.div>
);

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useAnalytics();

  if (isLoading || !data) {
    return (
      <AdminLayout title="Analytics" subtitle="Business overview">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const sym = currencySymbols[data.currency] || "₹";
  const cIcon = currencyIcons[data.currency] || currencyIcons.INR;

  const fmt = (v: number) => `${sym}${v.toLocaleString("en-IN")}`;

  return (
    <AdminLayout title="Analytics" subtitle="Business overview">
      <div className="space-y-4">
        <StatCard
          title="Today's Revenue"
          value={fmt(data.todayRevenue)}
          icon={cIcon}
          delay={0}
        />

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="This Month"
            value={fmt(data.monthRevenue)}
            icon={cIcon}
            delay={0.1}
          />
          <StatCard
            title="Orders"
            value={data.totalOrders.toString()}
            icon={<ShoppingBag className="w-5 h-5 text-secondary" />}
            delay={0.15}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Total Customers"
            value={data.totalCustomers.toString()}
            icon={<Users className="w-5 h-5 text-secondary" />}
            delay={0.2}
            onClick={() => navigate("/customers")}
          />
          <StatCard
            title="Repeat Customers"
            value={data.repeatCustomers.toString()}
            icon={<Users className="w-5 h-5 text-secondary" />}
            delay={0.25}
            onClick={() => navigate("/customers")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Avg. Order Value"
            value={fmt(data.avgOrderValue)}
            icon={<TrendingUp className="w-5 h-5 text-secondary" />}
            delay={0.3}
          />
          <StatCard
            title="Top Product"
            value={data.topProduct || "No Data"}
            icon={<Crown className="w-5 h-5 text-secondary" />}
            delay={0.35}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center py-4"
        >
          <p className="text-xs text-muted-foreground">
            Data updates automatically
          </p>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsPage;
