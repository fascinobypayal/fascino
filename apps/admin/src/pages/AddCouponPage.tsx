import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Calendar, Loader2 } from "lucide-react";
import { LuxuryCard } from "@/components/LuxuryCard";
import { Input } from "@/components/ui/input";
import { ToggleSwitch } from "@/components/ToggleSwitch";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCoupon, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, type DiscountType } from "@/hooks/useCoupons";

interface CouponForm {
  code: string;
  discount_type: DiscountType;
  discount_value: string;
  expiry_date: string;
  max_usage: string;
  allow_online: boolean;
  allow_cod: boolean;
  is_active: boolean;
}

const emptyForm: CouponForm = {
  code: "",
  discount_type: "PERCENT",
  discount_value: "",
  expiry_date: "",
  max_usage: "",
  allow_online: true,
  allow_cod: true,
  is_active: true,
};

const AddCouponPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id && id !== "new";

  const { data: existingCoupon, isLoading: isFetching } = useCoupon(isEditing ? id : undefined);
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();

  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (existingCoupon) {
      setForm({
        code: existingCoupon.code,
        discount_type: existingCoupon.discount_type as DiscountType,
        discount_value: String(existingCoupon.discount_value),
        expiry_date: existingCoupon.expiry_date
          ? new Date(existingCoupon.expiry_date).toISOString().split("T")[0]
          : "",
        max_usage: existingCoupon.max_usage != null ? String(existingCoupon.max_usage) : "",
        allow_online: existingCoupon.allow_online ?? true,
        allow_cod: existingCoupon.allow_cod ?? true,
        is_active: existingCoupon.is_active ?? true,
      });
    }
  }, [existingCoupon]);

  const handleChange = (field: keyof CouponForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const today = new Date().toISOString().split("T")[0];
  const isValid =
    form.code.trim().length > 0 &&
    Number(form.discount_value) > 0 &&
    form.expiry_date >= today &&
    Number(form.max_usage) >= 1;

  const handleSave = async () => {
    if (!isValid || isSaving) return;

    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      expiry_date: new Date(form.expiry_date).toISOString(),
      max_usage: Number(form.max_usage),
      allow_online: form.allow_online,
      allow_cod: form.allow_cod,
      is_active: form.is_active,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id, ...payload });
        toast.success("Coupon updated");
      } else {
        await createMutation.mutateAsync({ ...payload, usage_count: 0 });
        toast.success("Coupon created");
      }
      navigate("/more/coupons");
    } catch (err: any) {
      toast.error(err?.message ?? (isEditing ? "Failed to update coupon" : "Failed to create coupon"));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      toast.success("Coupon deleted");
      navigate("/more/coupons");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete coupon");
    }
  };

  if (isEditing && isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-serif text-foreground">{isEditing ? "Edit Coupon" : "New Coupon"}</h1>
          {isEditing ? (
            <button onClick={() => setShowDeleteDialog(true)} className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32 max-w-lg mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
          {/* Coupon Code */}
          <div>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">Coupon Code</h2>
            <LuxuryCard>
              <Input
                value={form.code}
                onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                placeholder="e.g., SUMMER25"
                className="min-h-[48px] font-mono uppercase"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground mt-2">Customers will enter this code at checkout</p>
            </LuxuryCard>
          </div>

          {/* Discount */}
          <div>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">Discount</h2>
            <LuxuryCard className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Type</label>
                <div className="flex gap-2">
                  {(["PERCENT", "FLAT"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleChange("discount_type", type)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all min-h-[48px] ${
                        form.discount_type === type ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {type === "PERCENT" ? "Percentage (%)" : "Flat (₹)"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Value</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {form.discount_type === "FLAT" ? "₹" : "%"}
                  </span>
                  <Input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => handleChange("discount_value", e.target.value)}
                    placeholder="0"
                    className="min-h-[48px] pl-10"
                    min={0}
                    max={form.discount_type === "PERCENT" ? 100 : undefined}
                  />
                </div>
              </div>
            </LuxuryCard>
          </div>

          {/* Validity */}
          <div>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">Validity</h2>
            <LuxuryCard className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Expiry Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => handleChange("expiry_date", e.target.value)}
                    className="min-h-[48px] pl-12"
                    min={today}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Maximum Usage</label>
                <Input
                  type="number"
                  value={form.max_usage}
                  onChange={(e) => handleChange("max_usage", e.target.value)}
                  placeholder="e.g., 100"
                  className="min-h-[48px]"
                  min={1}
                />
                <p className="text-xs text-muted-foreground mt-2">Total number of times this coupon can be used</p>
              </div>
            </LuxuryCard>
          </div>

          {/* Payment Modes */}
          <div>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">Payment Modes</h2>
            <LuxuryCard className="space-y-4">
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="font-medium text-foreground">Online Payment</p>
                  <p className="text-sm text-muted-foreground">Allow online payments with this coupon</p>
                </div>
                <ToggleSwitch enabled={form.allow_online} onToggle={() => handleChange("allow_online", !form.allow_online)} />
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="font-medium text-foreground">Cash on Delivery</p>
                  <p className="text-sm text-muted-foreground">Allow COD with this coupon</p>
                </div>
                <ToggleSwitch enabled={form.allow_cod} onToggle={() => handleChange("allow_cod", !form.allow_cod)} />
              </div>
            </LuxuryCard>
          </div>

          {/* Status */}
          <div>
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">Status</h2>
            <LuxuryCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Enable Coupon</p>
                  <p className="text-sm text-muted-foreground">Coupon is active and usable</p>
                </div>
                <ToggleSwitch enabled={form.is_active} onToggle={() => handleChange("is_active", !form.is_active)} />
              </div>
            </LuxuryCard>
          </div>
        </motion.div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="w-full luxury-button-primary min-h-[52px] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Coupon"}
          </button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon?</AlertDialogTitle>
            <AlertDialogDescription>This coupon will be permanently deleted. Usage history will be preserved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground min-h-[44px]"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AddCouponPage;
