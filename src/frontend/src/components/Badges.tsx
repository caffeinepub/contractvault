import { cn } from "@/lib/utils";
import type {
  ContractStatus,
  ObligationStatus,
  Priority,
  RiskLevel,
} from "../data/seed";

export function StatusBadge({ status }: { status: ContractStatus }) {
  const config: Record<ContractStatus, { label: string; className: string }> = {
    active: {
      label: "Active",
      className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    draft: {
      label: "Draft",
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    expired: {
      label: "Expired",
      className: "bg-red-100 text-red-700 border-red-200",
    },
    terminated: {
      label: "Terminated",
      className: "bg-zinc-100 text-zinc-600 border-zinc-200",
    },
    underReview: {
      label: "Under Review",
      className: "bg-amber-100 text-amber-800 border-amber-200",
    },
  };
  const { label, className } = config[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const config: Record<RiskLevel, { label: string; className: string }> = {
    low: {
      label: "Low",
      className: "bg-green-100 text-green-800 border-green-200",
    },
    medium: {
      label: "Medium",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    },
    high: {
      label: "High",
      className: "bg-orange-100 text-orange-800 border-orange-200",
    },
    critical: {
      label: "Critical",
      className: "bg-red-100 text-red-800 border-red-200",
    },
  };
  const { label, className } = config[risk] ?? {
    label: risk,
    className: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config: Record<Priority, { label: string; className: string }> = {
    low: {
      label: "Low",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    },
    medium: {
      label: "Medium",
      className: "bg-indigo-100 text-indigo-700 border-indigo-200",
    },
    high: {
      label: "High",
      className: "bg-orange-100 text-orange-800 border-orange-200",
    },
    critical: {
      label: "Critical",
      className: "bg-red-100 text-red-800 border-red-200",
    },
  };
  const { label, className } = config[priority] ?? {
    label: priority,
    className: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function ObligationStatusBadge({
  status,
}: { status: ObligationStatus }) {
  const config: Record<ObligationStatus, { label: string; className: string }> =
    {
      pending: {
        label: "Pending",
        className: "bg-slate-100 text-slate-700 border-slate-200",
      },
      inProgress: {
        label: "In Progress",
        className: "bg-indigo-100 text-indigo-700 border-indigo-200",
      },
      completed: {
        label: "Completed",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
      },
      overdue: {
        label: "Overdue",
        className: "bg-red-100 text-red-800 border-red-200",
      },
      waived: {
        label: "Waived",
        className: "bg-zinc-100 text-zinc-600 border-zinc-200",
      },
    };
  const { label, className } = config[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function DeadlineBadge({ endDate }: { endDate: number }) {
  const now = Date.now();
  const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) {
    return (
      <span className="text-sm text-red-600 font-medium">
        {Math.abs(daysLeft)}d ago
      </span>
    );
  }
  if (daysLeft <= 30) {
    return (
      <span className="text-sm text-red-600 font-medium">{daysLeft}d left</span>
    );
  }
  if (daysLeft <= 90) {
    return (
      <span className="text-sm text-amber-600 font-medium">
        {daysLeft}d left
      </span>
    );
  }
  return (
    <span className="text-sm text-slate-500">
      {new Date(endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}
    </span>
  );
}
