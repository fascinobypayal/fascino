import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, X, ChevronRight, Check, XCircle, Loader2, Package, CreditCard } from "lucide-react";
import { LuxuryCard } from "@/components/LuxuryCard";
import { useReturns, type ReturnRequest, type ReturnStatus } from "@/hooks/useReturns";
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

const statusConfig: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: "Requested", className: "status-pending" },
  APPROVED: { label: "Approved", className: "status-processing" },
  REJECTED: { label: "Rejected", className: "status-cancelled" },
  COMPLETED: { label: "Completed", className: "status-delivered" },
};

const refundStatusLabel: Record<string, string> = {
  PENDING: "Refund pending",
  PROCESSED: "Refund processed",
};

/* ─── Return Card ─── */
const ReturnCard = ({ request, onClick }: { request: ReturnRequest; onClick: () => void }) => {
  const status = statusConfig[request.status] || statusConfig.REQUESTED;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <LuxuryCard className="active:scale-[0.98] transition-transform cursor-pointer" onClick={onClick}>
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm truncate">{request.customer_name}</h3>
                <p className="text-xs text-muted-foreground truncate">{request.product_name} × {request.quantity}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{request.order_number}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`status-chip ${status.className}`}>{status.label}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{request.type}</span>
              {request.refund_status && (
                <span className="text-[10px] text-muted-foreground italic">{refundStatusLabel[request.refund_status] || request.refund_status}</span>
              )}
            </div>
          </div>
        </div>
      </LuxuryCard>
    </motion.div>
  );
};

/* ─── Detail Sheet ─── */
const ReturnDetailSheet = ({
  request,
  onClose,
  onApprove,
  onReject,
  onMarkReceived,
  onMarkRefundProcessed,
  onCompleteExchange,
  isProcessing,
}: {
  request: ReturnRequest | null;
  onClose: () => void;
  onApprove: (r: ReturnRequest) => void;
  onReject: (r: ReturnRequest) => void;
  onMarkReceived: (r: ReturnRequest) => void;
  onMarkRefundProcessed: (r: ReturnRequest) => void;
  onCompleteExchange: (r: ReturnRequest) => void;
  isProcessing: boolean;
}) => {
  if (!request) return null;
  const status = statusConfig[request.status] || statusConfig.REQUESTED;
  const isReturn = request.type === "RETURN";

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 bg-foreground/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[85vh] overflow-auto"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 px-4 pt-4 pb-3 border-b border-border">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-lg text-foreground capitalize">{request.type.toLowerCase()} Request</h2>
              <p className="text-sm text-muted-foreground">{request.order_number}</p>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={`status-chip ${status.className}`}>{status.label}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{request.type}</span>
            {request.refund_status && (
              <span className="text-[10px] text-muted-foreground italic">{refundStatusLabel[request.refund_status] || request.refund_status}</span>
            )}
          </div>
        </div>

        <div className="p-4 space-y-5 pb-8">
          {/* Product */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Product</h3>
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-sm font-medium text-foreground">{request.product_name}</p>
              <p className="text-xs text-muted-foreground mt-1">Qty: {request.quantity} · ₹{Number(request.product_price).toLocaleString()}</p>
            </div>
          </div>

          {/* Customer */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Customer</h3>
            <p className="text-sm text-foreground">{request.customer_name}</p>
            {request.created_at && <p className="text-xs text-muted-foreground mt-0.5">Requested {new Date(request.created_at).toLocaleDateString()}</p>}
          </div>

          {/* Reason */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Reason</h3>
            <div className="p-3 bg-muted/50 rounded-xl"><p className="text-sm text-foreground">{request.reason}</p></div>
          </div>

          {/* Note */}
          {request.requested_note && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Customer Note</h3>
              <div className="p-3 bg-muted/50 rounded-xl"><p className="text-sm text-foreground">{request.requested_note}</p></div>
            </div>
          )}

          {/* ── Actions ── */}

          {/* Stage 1: REQUESTED → Approve / Reject */}
          {request.status === "REQUESTED" && (
            <div className="space-y-3 pt-2">
              <button onClick={() => onApprove(request)} disabled={isProcessing}
                className="w-full luxury-button bg-status-delivered/10 text-status-delivered min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Approve {isReturn ? "Return" : "Exchange"}
              </button>
              <button onClick={() => onReject(request)} disabled={isProcessing}
                className="w-full luxury-button bg-destructive/10 text-destructive min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject Request
              </button>
            </div>
          )}

          {/* Stage 2 (RETURN): APPROVED + no refund_status → Mark Item Received */}
          {isReturn && request.status === "APPROVED" && !request.refund_status && (
            <button onClick={() => onMarkReceived(request)} disabled={isProcessing}
              className="w-full luxury-button-primary min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              Mark Item Received
            </button>
          )}

          {/* Stage 3 (RETURN): refund_status = PENDING → Mark Refund Processed */}
          {isReturn && request.refund_status === "PENDING" && request.status === "APPROVED" && (
            <button onClick={() => onMarkRefundProcessed(request)} disabled={isProcessing}
              className="w-full luxury-button-primary min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Mark Refund Processed
            </button>
          )}

          {/* Exchange: APPROVED → Complete Exchange */}
          {!isReturn && request.status === "APPROVED" && (
            <button onClick={() => onCompleteExchange(request)} disabled={isProcessing}
              className="w-full luxury-button-primary min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50">
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              Mark as Completed
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ─── Page ─── */
const ReturnsPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ReturnStatus | "ALL">("ALL");
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [exchangeConfirmReturn, setExchangeConfirmReturn] = useState<ReturnRequest | null>(null);

  const { returns, isLoading, approveReturn, rejectReturn, markItemReceived, markRefundProcessed, completeExchange } = useReturns(filter);

  const isProcessing = approveReturn.isPending || rejectReturn.isPending || markItemReceived.isPending || markRefundProcessed.isPending || completeExchange.isPending;

  const handleApprove = (r: ReturnRequest) => {
    approveReturn.mutate(r, { onSuccess: () => setSelectedReturn(null) });
  };
  const handleReject = (r: ReturnRequest) => {
    rejectReturn.mutate(r, { onSuccess: () => setSelectedReturn(null) });
  };
  const handleMarkReceived = (r: ReturnRequest) => {
    markItemReceived.mutate(r, { onSuccess: () => setSelectedReturn(null) });
  };
  const handleMarkRefundProcessed = (r: ReturnRequest) => {
    markRefundProcessed.mutate(r, { onSuccess: () => setSelectedReturn(null) });
  };
  const handleCompleteExchange = (r: ReturnRequest) => {
    setExchangeConfirmReturn(r);
  };

  const confirmExchangeComplete = () => {
    if (!exchangeConfirmReturn) return;
    completeExchange.mutate(exchangeConfirmReturn, {
      onSuccess: () => { setExchangeConfirmReturn(null); setSelectedReturn(null); },
    });
  };

  const filters: { key: ReturnStatus | "ALL"; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "REQUESTED", label: "Requested" },
    { key: "APPROVED", label: "Approved" },
    { key: "COMPLETED", label: "Completed" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-serif text-foreground">Returns & Exchanges</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 pb-28 max-w-lg mx-auto w-full">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 mb-4">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[44px] ${
                filter === f.key ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        )}

        {!isLoading && (
          <div className="space-y-3">
            {returns.map((request) => (
              <ReturnCard key={request.id} request={request} onClick={() => setSelectedReturn(request)} />
            ))}
          </div>
        )}

        {!isLoading && returns.length === 0 && (
          <div className="py-12 text-center">
            <RotateCcw className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No return requests</p>
          </div>
        )}
      </main>

      {selectedReturn && (
        <ReturnDetailSheet
          request={selectedReturn}
          onClose={() => setSelectedReturn(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onMarkReceived={handleMarkReceived}
          onMarkRefundProcessed={handleMarkRefundProcessed}
          onCompleteExchange={handleCompleteExchange}
          isProcessing={isProcessing}
        />
      )}

      <AlertDialog open={!!exchangeConfirmReturn} onOpenChange={(open) => !open && setExchangeConfirmReturn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Exchange</AlertDialogTitle>
            <AlertDialogDescription>Have you created the replacement order for this exchange? This will mark the exchange as completed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExchangeComplete} disabled={completeExchange.isPending}>
              {completeExchange.isPending ? "Processing..." : "Yes, Complete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReturnsPage;
