type StatusKey = "pending" | "confirmed" | "ready" | "ready_to_ship" | "picked_up" | "in_transit" | "delivered" | "cancelled";

interface StatusChipProps {
  status: string;
}

const normalizeStatus = (status: string): StatusKey => {
  const lower = status.toLowerCase().replace(/ /g, "_") as StatusKey;
  return lower;
};

const statusLabels: Record<StatusKey, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  ready: "Ready to Ship",
  ready_to_ship: "Ready to Ship",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusClasses: Record<StatusKey, string> = {
  pending: "status-pending",
  confirmed: "status-processing",
  ready: "status-processing",
  ready_to_ship: "status-processing",
  picked_up: "status-shipped",
  in_transit: "status-shipped",
  delivered: "status-delivered",
  cancelled: "status-cancelled",
};

export const StatusChip = ({ status }: StatusChipProps) => {
  const key = normalizeStatus(status);
  return (
    <span className={`status-chip ${statusClasses[key] || "status-pending"}`}>
      {statusLabels[key] || status}
    </span>
  );
};
