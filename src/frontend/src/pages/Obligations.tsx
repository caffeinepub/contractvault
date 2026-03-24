import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Bell, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ObligationStatusBadge, PriorityBadge } from "../components/Badges";
import { getContractById, obligations } from "../data/seed";
import type { ObligationStatus } from "../data/seed";

const STATUS_LABELS: Record<ObligationStatus, string> = {
  pending: "Pending",
  inProgress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  waived: "Waived",
};

function DueDateBadge({
  dueDate,
  status,
}: { dueDate: number; status: ObligationStatus }) {
  const now = Date.now();
  const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

  if (status === "completed" || status === "waived") return null;

  if (daysUntil < 0) {
    return (
      <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
        {Math.abs(daysUntil)}d overdue
      </span>
    );
  }
  if (daysUntil <= 7) {
    return (
      <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
        {daysUntil}d left
      </span>
    );
  }
  if (daysUntil <= 14) {
    return (
      <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
        {daysUntil}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
      {daysUntil}d left
    </span>
  );
}

export default function Obligations() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Local obligation statuses for optimistic UI
  const [obligationStatuses, setObligationStatuses] = useState<
    Record<number, ObligationStatus>
  >(() => Object.fromEntries(obligations.map((o) => [o.id, o.status])));

  const filtered = obligations.filter((o) => {
    const q = search.toLowerCase();
    const contract = getContractById(o.contractId);
    const matchSearch =
      !q ||
      o.title.toLowerCase().includes(q) ||
      o.assignedTo.toLowerCase().includes(q) ||
      contract?.title.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "all" ||
      (obligationStatuses[o.id] ?? o.status) === statusFilter;
    const matchPriority =
      priorityFilter === "all" || o.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleStatusChange = (id: number, newStatus: ObligationStatus) => {
    setObligationStatuses((prev) => ({ ...prev, [id]: newStatus }));
  };

  const handleSendReminder = (title: string, assignedTo: string) => {
    toast.success(`Reminder sent to ${assignedTo} for "${title}"`);
  };

  return (
    <div className="px-4 md:px-5 py-4 md:py-5">
      <p className="text-sm text-slate-500 mb-4">
        {obligations.length} total &middot; {filtered.length} shown
      </p>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 mb-4 bg-white border border-slate-200 rounded-lg px-3 py-2.5 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            data-ocid="obligations.search_input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search obligations..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              data-ocid="obligations.status_select"
              className="flex-1 md:w-36 h-9 text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(
                [
                  "all",
                  "pending",
                  "inProgress",
                  "completed",
                  "overdue",
                  "waived",
                ] as const
              ).map((v) => (
                <SelectItem key={v} value={v} className="text-sm">
                  {v === "all"
                    ? "All Statuses"
                    : v === "inProgress"
                      ? "In Progress"
                      : v.charAt(0).toUpperCase() + v.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger
              data-ocid="obligations.priority_select"
              className="flex-1 md:w-36 h-9 text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["all", "low", "medium", "high", "critical"] as const).map(
                (v) => (
                  <SelectItem key={v} value={v} className="text-sm">
                    {v === "all"
                      ? "All Priorities"
                      : v.charAt(0).toUpperCase() + v.slice(1)}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          {(search || statusFilter !== "all" || priorityFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPriorityFilter("all");
              }}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 min-h-[36px] px-2"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto hidden md:inline">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="block md:hidden space-y-2" data-ocid="obligations.list">
        {filtered.map((ob, i) => {
          const contract = getContractById(ob.contractId);
          const currentStatus = obligationStatuses[ob.id] ?? ob.status;
          const isOverdue =
            currentStatus === "overdue" ||
            (ob.dueDate < Date.now() &&
              currentStatus !== "completed" &&
              currentStatus !== "waived");
          const isActive =
            currentStatus === "pending" || currentStatus === "inProgress";
          return (
            <div
              key={ob.id}
              data-ocid={`obligations.item.${i + 1}`}
              className={cn(
                "bg-white border rounded-lg px-4 py-3 shadow-xs",
                isOverdue ? "border-red-200 bg-red-50/40" : "border-slate-200",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "font-semibold text-sm truncate",
                      isOverdue ? "text-red-700" : "text-slate-800",
                    )}
                  >
                    {ob.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    {ob.assignedTo}
                  </div>
                </div>
                <Select
                  value={currentStatus}
                  onValueChange={(val) =>
                    handleStatusChange(ob.id, val as ObligationStatus)
                  }
                >
                  <SelectTrigger
                    data-ocid={`obligations.status.select.${i + 1}`}
                    className="h-7 w-32 text-xs shrink-0"
                  >
                    <SelectValue>
                      {STATUS_LABELS[currentStatus] ?? currentStatus}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(STATUS_LABELS) as [
                        ObligationStatus,
                        string,
                      ][]
                    ).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <PriorityBadge priority={ob.priority} />
                <span
                  className={cn(
                    "text-xs font-medium",
                    isOverdue ? "text-red-600" : "text-slate-500",
                  )}
                >
                  {new Date(ob.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <DueDateBadge dueDate={ob.dueDate} status={currentStatus} />
                {contract && (
                  <span className="text-xs text-slate-400 truncate">
                    {contract.title}
                  </span>
                )}
              </div>
              {isActive && (
                <div className="mt-2">
                  <button
                    type="button"
                    data-ocid={`obligations.reminder_button.${i + 1}`}
                    onClick={() => handleSendReminder(ob.title, ob.assignedTo)}
                    className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <Bell className="w-3 h-3" /> Send Reminder
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div
            data-ocid="obligations.empty_state"
            className="bg-white border border-slate-200 rounded-lg px-4 py-12 text-center text-slate-400 text-sm"
          >
            No obligations match your filters.
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div
        data-ocid="obligations.table"
        className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Title
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Contract
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((ob, i) => {
              const contract = getContractById(ob.contractId);
              const currentStatus = obligationStatuses[ob.id] ?? ob.status;
              const isOverdue =
                currentStatus === "overdue" ||
                (ob.dueDate < Date.now() &&
                  currentStatus !== "completed" &&
                  currentStatus !== "waived");
              const isActive =
                currentStatus === "pending" || currentStatus === "inProgress";
              return (
                <tr
                  key={ob.id}
                  data-ocid={`obligations.row.${i + 1}`}
                  className={cn(
                    "",
                    isOverdue ? "bg-red-50/50" : "hover:bg-slate-50",
                  )}
                >
                  <td className="px-4 py-3">
                    <div
                      className={cn(
                        "font-medium",
                        isOverdue ? "text-red-700" : "text-slate-800",
                      )}
                    >
                      {ob.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate max-w-48">
                      {ob.description}
                    </div>
                    {isOverdue && (
                      <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block border border-red-100">
                        Overdue
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {contract?.title ?? ob.contractId}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{ob.assignedTo}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          "font-medium text-sm",
                          isOverdue ? "text-red-600" : "text-slate-700",
                        )}
                      >
                        {new Date(ob.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <DueDateBadge
                        dueDate={ob.dueDate}
                        status={currentStatus}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={ob.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={currentStatus}
                      onValueChange={(val) =>
                        handleStatusChange(ob.id, val as ObligationStatus)
                      }
                    >
                      <SelectTrigger
                        data-ocid={`obligations.status.select.${i + 1}`}
                        className="h-7 w-32 text-xs"
                      >
                        <SelectValue>
                          {STATUS_LABELS[currentStatus] ?? currentStatus}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(STATUS_LABELS) as [
                            ObligationStatus,
                            string,
                          ][]
                        ).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="text-xs">
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    {isActive && (
                      <button
                        type="button"
                        data-ocid={`obligations.reminder_button.${i + 1}`}
                        onClick={() =>
                          handleSendReminder(ob.title, ob.assignedTo)
                        }
                        className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50"
                        title="Send reminder"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Remind
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  data-ocid="obligations.empty_state"
                  className="px-4 py-10 text-center text-slate-400 text-sm"
                >
                  No obligations match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
