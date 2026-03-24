import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { getContractById, timelineEvents } from "../data/seed";

const PAGE_SIZE = 10;

const EVENT_TYPE_OPTIONS = [
  { value: "all", label: "All Event Types" },
  { value: "contract_created", label: "Contract Created" },
  { value: "status_changed", label: "Status Changed" },
  { value: "obligation_created", label: "Obligation Created" },
  { value: "comment_added", label: "Comment Added" },
  { value: "document_uploaded", label: "Document Uploaded" },
  { value: "approval_requested", label: "Approval Requested" },
  { value: "approved", label: "Approved" },
  { value: "system_event", label: "System Event" },
  { value: "user_login", label: "User Login" },
  { value: "signature_requested", label: "Signature Requested" },
  { value: "clause_extracted", label: "Clause Extracted" },
];

const EVENT_COLORS: Record<string, string> = {
  contract_created: "bg-blue-100 text-blue-700",
  status_changed: "bg-amber-100 text-amber-700",
  obligation_created: "bg-purple-100 text-purple-700",
  comment_added: "bg-slate-100 text-slate-600",
  document_uploaded: "bg-teal-100 text-teal-700",
  approval_requested: "bg-orange-100 text-orange-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  system_event: "bg-slate-100 text-slate-500",
  user_login: "bg-blue-100 text-blue-700",
  signature_requested: "bg-violet-100 text-violet-700",
  clause_extracted: "bg-teal-100 text-teal-700",
};

export default function AuditLog() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");

  const sorted = [...timelineEvents].sort((a, b) => b.timestamp - a.timestamp);
  const filtered =
    typeFilter === "all"
      ? sorted
      : sorted.filter((e) => e.eventType === typeFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{filtered.length} events</p>
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger
            data-ocid="audit.event_type_select"
            className="w-44 h-8 text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-sm">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        data-ocid="audit.table"
        className="bg-white border border-slate-200 rounded-lg overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Event Type
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Description
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actor
              </th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Contract
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map((event, i) => {
              const contract = event.contractId
                ? getContractById(event.contractId)
                : null;
              return (
                <tr
                  key={event.id}
                  data-ocid={`audit.row.${i + 1}`}
                  className="hover:bg-slate-50"
                >
                  <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${EVENT_COLORS[event.eventType] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {event.eventType.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    {event.description}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{event.actor}</td>
                  <td className="px-3 py-2.5 text-slate-500">
                    {contract?.title ?? event.contractId ?? "\u2014"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-sm text-slate-400">
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}-
          {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            data-ocid="audit.pagination_prev"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1 hover:bg-slate-100 rounded disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-sm text-slate-600 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            data-ocid="audit.pagination_next"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1 hover:bg-slate-100 rounded disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
