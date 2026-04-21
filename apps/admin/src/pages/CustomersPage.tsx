import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, X, Phone, Mail, ShoppingBag, IndianRupee, ChevronRight, Loader2 } from "lucide-react";
import { LuxuryCard } from "@/components/LuxuryCard";
import { useCustomers, Customer } from "@/hooks/useCustomers";
import { useStoreSettings } from "@/hooks/useStoreSettings";

type FilterType = "all" | "repeat";

const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case "INR": return "₹";
    case "USD": return "$";
    case "GBP": return "£";
    case "EUR": return "€";
    default: return "₹";
  }
};

const CustomerCard = ({ customer, currencySymbol, onClick }: { customer: Customer; currencySymbol: string; onClick: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <LuxuryCard 
        className="active:scale-[0.98] transition-transform cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <span className="text-lg font-serif text-secondary">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{customer.name}</h3>
                {customer.isRepeat && (
                  <span className="px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-medium">
                    Repeat
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {customer.totalOrders} orders · {currencySymbol}{customer.totalSpend >= 1000 ? `${(customer.totalSpend / 1000).toFixed(0)}K` : customer.totalSpend.toLocaleString()} spent
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </LuxuryCard>
    </motion.div>
  );
};

const CustomerDetailSheet = ({ customer, currencySymbol, onClose }: { customer: Customer | null; currencySymbol: string; onClose: () => void }) => {
  if (!customer) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-foreground/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[85vh] overflow-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 px-4 pt-4 pb-3 border-b border-border">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                <span className="text-xl font-serif text-secondary">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-serif text-lg text-foreground">{customer.name}</h2>
                <p className="text-sm text-muted-foreground">Customer since {customer.joinedDate}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-5 pb-8">
          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Contact
            </h3>
            <div className="space-y-2">
              {customer.email && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <Mail className="w-4 h-4 text-secondary" />
                  <span className="text-sm text-foreground">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <Phone className="w-4 h-4 text-secondary" />
                  <span className="text-sm text-foreground">{customer.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag className="w-4 h-4 text-secondary" />
                  <span className="text-xs text-muted-foreground">Total Orders</span>
                </div>
                <p className="text-lg font-serif text-foreground">{customer.totalOrders}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <IndianRupee className="w-4 h-4 text-secondary" />
                  <span className="text-xs text-muted-foreground">Total Spend</span>
                </div>
                <p className="text-lg font-serif text-foreground">{currencySymbol}{customer.totalSpend.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Order History */}
          {customer.orders.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Order History
              </h3>
              <div className="space-y-2">
                {customer.orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-serif text-foreground">{currencySymbol}{order.total.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const CustomersPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { customers, loading, refetch } = useCustomers();
  const { settings: storeSettings } = useStoreSettings();
  const currencySymbol = getCurrencySymbol(storeSettings?.currency || "INR");

  // Refetch on focus
  useEffect(() => {
    const onFocus = () => refetch();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetch]);

  const filteredCustomers = filter === "all" 
    ? customers 
    : customers.filter(c => c.isRepeat);

  const repeatCount = customers.filter(c => c.isRepeat).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
          <h1 className="text-lg font-serif text-foreground">Customers</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28 max-w-lg mx-auto w-full">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <LuxuryCard className="text-center">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-2xl font-serif text-foreground">{customers.length}</p>
            <p className="text-xs text-muted-foreground">Total Customers</p>
          </LuxuryCard>
          <LuxuryCard className="text-center">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-2xl font-serif text-foreground">{repeatCount}</p>
            <p className="text-xs text-muted-foreground">Repeat Customers</p>
          </LuxuryCard>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] ${
              filter === "all"
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("repeat")}
            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all min-h-[44px] ${
              filter === "repeat"
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Repeat
          </button>
        </div>

        {/* Customer List */}
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              currencySymbol={currencySymbol}
              onClick={() => setSelectedCustomer(customer)}
            />
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No customers found</p>
          </div>
        )}
      </main>

      {/* Customer Detail Sheet */}
      {selectedCustomer && (
        <CustomerDetailSheet
          customer={selectedCustomer}
          currencySymbol={currencySymbol}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};

export default CustomersPage;
