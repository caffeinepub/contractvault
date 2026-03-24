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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  Download,
  LayoutTemplate,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeadlineBadge, RiskBadge, StatusBadge } from "../components/Badges";
import { ObligationStatusBadge, PriorityBadge } from "../components/Badges";
import type { ContractTemplate } from "../contexts/LocalStore";
import { useLocalStore } from "../contexts/LocalStore";
import {
  obligations as allObligations,
  getCounterpartyById,
} from "../data/seed";
import type { ContractStatus, RiskLevel, SeedContract } from "../data/seed";
import { useActor } from "../hooks/useActor";

const STATUS_OPTIONS: { value: ContractStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "expired", label: "Expired" },
  { value: "terminated", label: "Terminated" },
  { value: "underReview", label: "Under Review" },
];

const BULK_STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "expired", label: "Expired" },
  { value: "terminated", label: "Terminated" },
  { value: "underReview", label: "Under Review" },
];

const RISK_OPTIONS = [
  { value: "all", label: "All Risk Levels" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];

const CONTRACT_TYPES = [
  "MSA",
  "NDA",
  "SaaS",
  "Vendor Agreement",
  "SOW",
  "LOI",
  "License",
  "Other",
];

function fmt(v: number) {
  if (v === 0) return "\u2014";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

type NewContractForm = {
  title: string;
  counterpartyId: string;
  contractType: string;
  startDate: string;
  endDate: string;
  value: string;
  department: string;
  description: string;
  riskLevel: RiskLevel;
  autoRenew: boolean;
};

const EMPTY_FORM: NewContractForm = {
  title: "",
  counterpartyId: "",
  contractType: "",
  startDate: "",
  endDate: "",
  value: "",
  department: "",
  description: "",
  riskLevel: "low",
  autoRenew: false,
};

function exportCSV(
  rows: SeedContract[],
  counterpartiesMap: Map<string, string>,
) {
  const headers = [
    "ID",
    "Title",
    "Status",
    "Counterparty",
    "Value",
    "Start Date",
    "End Date",
    "Department",
    "Risk Level",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((c) => {
      const cp = counterpartiesMap.get(c.counterpartyId) ?? "";
      return [
        c.id,
        `"${c.title.replace(/"/g, '""')}"`,
        c.status,
        `"${cp.replace(/"/g, '""')}"`,
        c.value,
        new Date(c.startDate).toLocaleDateString(),
        new Date(c.endDate).toLocaleDateString(),
        `"${(c.department ?? "").replace(/"/g, '""')}"`,
        c.riskLevel,
      ].join(",");
    }),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contracts-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Contracts() {
  const navigate = useNavigate();
  const {
    contracts,
    addContract,
    updateContracts,
    deleteContracts,
    counterparties,
    templates,
  } = useLocalStore();
  const { actor } = useActor();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [selected, setSelected] = useState<SeedContract | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewContractForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof NewContractForm, string>>
  >({});

  // Template picker
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ContractStatus | "">("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.contractType.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchRisk = riskFilter === "all" || c.riskLevel === riskFilter;
    return matchSearch && matchStatus && matchRisk;
  });

  const counterpartiesMap = new Map(
    counterparties.map((cp) => [cp.id, cp.name]),
  );

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkStatusChange() {
    if (!bulkStatus) return;
    updateContracts([...selectedIds], { status: bulkStatus as ContractStatus });
    toast.success(`Updated ${selectedIds.size} contract(s) to ${bulkStatus}`);
    setSelectedIds(new Set());
    setBulkStatus("");
  }

  function handleBulkExport() {
    const rows = filtered.filter((c) => selectedIds.has(c.id));
    exportCSV(rows, counterpartiesMap);
    toast.success(`Exported ${rows.length} contract(s)`);
  }

  function handleBulkDelete() {
    deleteContracts([...selectedIds]);
    toast.success(`Deleted ${selectedIds.size} contract(s)`);
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
  }

  const selectedCp = selected
    ? (counterparties.find((cp) => cp.id === selected.counterpartyId) ??
      getCounterpartyById(selected.counterpartyId))
    : null;
  const selectedObligations = selected
    ? allObligations.filter((o) => o.contractId === selected.id)
    : [];

  function validateForm(): boolean {
    const errs: Partial<Record<keyof NewContractForm, string>> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.counterpartyId) errs.counterpartyId = "Counterparty is required";
    if (!form.contractType.trim())
      errs.contractType = "Contract type is required";
    if (!form.startDate) errs.startDate = "Start date is required";
    if (!form.endDate) errs.endDate = "End date is required";
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      errs.endDate = "End date must be after start date";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleCreate() {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const id = crypto.randomUUID();
      const now = Date.now();
      const startTs = new Date(form.startDate).getTime();
      const endTs = new Date(form.endDate).getTime();
      const value = Number.parseFloat(form.value) || 0;

      const newContract: SeedContract = {
        id,
        title: form.title.trim(),
        status: "draft",
        contractType: form.contractType.trim(),
        counterpartyId: form.counterpartyId,
        value,
        currency: "USD",
        startDate: startTs,
        endDate: endTs,
        autoRenew: form.autoRenew,
        riskLevel: form.riskLevel,
        tags: [],
        createdAt: now,
        updatedAt: now,
        createdBy: "current-user",
        description: form.description.trim(),
        department: form.department.trim(),
      };

      addContract(newContract);

      if (actor) {
        actor
          .createContract(id, {
            status: "draft" as any,
            endDate: BigInt(endTs),
            value,
            createdBy: "current-user",
            tags: [],
            description: newContract.description,
            currency: "USD",
            counterpartyId: form.counterpartyId,
            autoRenew: form.autoRenew,
            department: newContract.department,
            riskLevel: form.riskLevel as any,
            startDate: BigInt(startTs),
          })
          .catch(() => {
            // backend call is best-effort
          });
      }

      toast.success("Contract created");
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setErrors({});
    } finally {
      setSaving(false);
    }
  }

  function handleOpenCreate() {
    setForm(EMPTY_FORM);
    setErrors({});
    setShowCreate(true);
  }

  return (
    <div className="px-4 md:px-5 py-4 md:py-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {contracts.length} total &middot; {filtered.length} shown
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="contracts.from_template_button"
            onClick={() => setShowTemplatePicker(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 h-9 bg-white text-slate-700 text-sm font-medium rounded-md border border-slate-300 hover:bg-slate-50 shadow-xs"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">From Template</span>
            <span className="sm:hidden">Template</span>
          </button>
          <button
            type="button"
            data-ocid="contracts.new_contract_button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 h-9 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Contract</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 mb-4 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            data-ocid="contracts.search_input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contracts\u2026"
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              data-ocid="contracts.status_select"
              className="flex-1 md:w-40 h-8 text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger
              data-ocid="contracts.risk_select"
              className="flex-1 md:w-40 h-8 text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RISK_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || statusFilter !== "all" || riskFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setRiskFilter("all");
              }}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded hover:bg-slate-100"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Bulk action toolbar */}
      {someSelected && (
        <div
          data-ocid="contracts.bulk_toolbar"
          className="flex flex-wrap items-center gap-2 mb-3 bg-white border border-indigo-200 rounded-lg px-3 py-2 shadow-xs"
        >
          <span className="text-sm font-medium text-slate-700">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bulk status change */}
            <div className="flex items-center gap-1.5">
              <Select
                value={bulkStatus}
                onValueChange={(v) => setBulkStatus(v as ContractStatus)}
              >
                <SelectTrigger
                  data-ocid="contracts.bulk_status_select"
                  className="h-8 w-36 text-xs"
                >
                  <SelectValue placeholder="Change status\u2026" />
                </SelectTrigger>
                <SelectContent>
                  {BULK_STATUS_OPTIONS.map((o) => (
                    <SelectItem
                      key={o.value}
                      value={o.value}
                      className="text-xs"
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                disabled={!bulkStatus}
                onClick={handleBulkStatusChange}
                className="h-8 text-xs px-2.5"
              >
                Apply
              </Button>
            </div>

            {/* Export CSV */}
            <Button
              size="sm"
              variant="outline"
              data-ocid="contracts.bulk_export_button"
              onClick={handleBulkExport}
              className="h-8 text-xs px-2.5 gap-1.5"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </Button>

            {/* Bulk delete */}
            <Button
              size="sm"
              variant="outline"
              data-ocid="contracts.bulk_delete_button"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-8 text-xs px-2.5 gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear selection
          </button>
        </div>
      )}

      {/* Mobile card list */}
      <div className="block md:hidden space-y-2" data-ocid="contracts.list">
        {filtered.map((contract, i) => {
          const cp =
            counterparties.find((c) => c.id === contract.counterpartyId) ??
            getCounterpartyById(contract.counterpartyId);
          const isChecked = selectedIds.has(contract.id);
          return (
            <div
              key={contract.id}
              data-ocid={`contracts.item.${i + 1}`}
              className="relative bg-white border border-slate-200 rounded-lg shadow-xs"
            >
              {/* Checkbox overlay */}
              <div
                className="absolute top-2.5 left-2.5 z-10"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Checkbox
                  data-ocid={`contracts.row_checkbox.${i + 1}`}
                  checked={isChecked}
                  onCheckedChange={() => toggleSelect(contract.id)}
                  className="border-slate-300"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/contracts/$contractId",
                    params: { contractId: contract.id },
                  })
                }
                className="w-full text-left px-4 py-3 pl-9 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400 rounded-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-800 truncate">
                      {contract.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {cp?.name ?? "\u2014"}
                    </div>
                  </div>
                  <StatusBadge status={contract.status} />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <DeadlineBadge endDate={contract.endDate} />
                  <span className="text-xs text-slate-400">
                    {contract.department}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div
            data-ocid="contracts.empty_state"
            className="bg-white border border-slate-200 rounded-lg px-4 py-12 text-center text-slate-400 text-sm"
          >
            No contracts match your filters.
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div
        data-ocid="contracts.table"
        className="hidden md:block bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="pl-4 pr-2 py-2 w-10">
                <Checkbox
                  data-ocid="contracts.select_all_checkbox"
                  checked={allFilteredSelected}
                  onCheckedChange={toggleSelectAll}
                  className="border-slate-300"
                />
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Contract
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Counterparty
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Value
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Risk
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Deadline
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Department
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((contract, i) => {
              const cp =
                counterparties.find((c) => c.id === contract.counterpartyId) ??
                getCounterpartyById(contract.counterpartyId);
              const isChecked = selectedIds.has(contract.id);
              return (
                <tr
                  key={contract.id}
                  data-ocid={`contracts.row.${i + 1}`}
                  onClick={() =>
                    navigate({
                      to: "/contracts/$contractId",
                      params: { contractId: contract.id },
                    })
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    navigate({
                      to: "/contracts/$contractId",
                      params: { contractId: contract.id },
                    })
                  }
                  tabIndex={0}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td
                    className="pl-4 pr-2 py-2.5 w-10"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      data-ocid={`contracts.row_checkbox.${i + 1}`}
                      checked={isChecked}
                      onCheckedChange={() => toggleSelect(contract.id)}
                      className="border-slate-300"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900">
                      {contract.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {contract.contractType}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={contract.status} />
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 font-medium">
                    {cp?.name ?? "\u2014"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700 tabular-nums">
                    {fmt(contract.value)}
                  </td>
                  <td className="px-4 py-2.5">
                    <RiskBadge risk={contract.riskLevel} />
                  </td>
                  <td className="px-4 py-2.5">
                    <DeadlineBadge endDate={contract.endDate} />
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">
                    {contract.department}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-slate-400 text-sm"
                  data-ocid="contracts.empty_state"
                >
                  No contracts match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Side sheet */}
      {selected && (
        <Sheet
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
        >
          <SheetContent
            data-ocid="contracts.sheet"
            className="w-full sm:w-[540px] sm:max-w-[540px] overflow-y-auto"
          >
            <SheetHeader className="mb-4">
              <SheetTitle className="text-base font-semibold text-slate-900">
                {selected.title}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    [
                      "Status",
                      <StatusBadge key="s" status={selected.status} />,
                    ],
                    ["Risk", <RiskBadge key="r" risk={selected.riskLevel} />],
                    ["Counterparty", selectedCp?.name ?? "\u2014"],
                    ["Department", selected.department],
                    ["Value", fmt(selected.value)],
                    [
                      "Start",
                      new Date(selected.startDate).toLocaleDateString(),
                    ],
                    ["End", new Date(selected.endDate).toLocaleDateString()],
                    ["Auto-Renew", selected.autoRenew ? "Yes" : "No"],
                  ] as [string, React.ReactNode][]
                ).map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="bg-slate-50 rounded-md p-2.5"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                      {label}
                    </div>
                    <div className="font-medium text-slate-800">{value}</div>
                  </div>
                ))}
              </div>
              {selected.description && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                    Description
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {selected.description}
                  </p>
                </div>
              )}
              {selectedObligations.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">
                    Obligations ({selectedObligations.length})
                  </div>
                  <div className="space-y-1.5">
                    {selectedObligations.map((ob) => (
                      <div
                        key={ob.id}
                        className="flex items-center justify-between bg-slate-50 rounded px-2.5 py-2"
                      >
                        <span className="text-slate-700 text-xs">
                          {ob.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <PriorityBadge priority={ob.priority} />
                          <ObligationStatusBadge status={ob.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Bulk delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent data-ocid="contracts.bulk_delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} contract(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected contracts. Seed
              contracts cannot be removed and will be skipped. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="contracts.bulk_delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="contracts.bulk_delete.confirm_button"
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Picker Dialog */}
      <Dialog open={showTemplatePicker} onOpenChange={setShowTemplatePicker}>
        <DialogContent
          data-ocid="contracts.template_picker.dialog"
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Choose a Template
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 -mt-1 mb-2">
            Select a template to pre-fill contract details. You can still edit
            all fields before creating.
          </p>
          {templates.length === 0 ? (
            <div
              data-ocid="contracts.template_picker.empty_state"
              className="py-12 text-center text-slate-400 text-sm"
            >
              No templates available. Create one from the Templates page.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map((tmpl: ContractTemplate, i: number) => (
                <button
                  key={tmpl.id}
                  type="button"
                  data-ocid={`contracts.template_picker.item.${i + 1}`}
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      contractType: tmpl.contractType,
                      department: tmpl.department,
                      riskLevel: tmpl.riskLevel,
                      autoRenew: tmpl.autoRenew,
                    }));
                    setShowTemplatePicker(false);
                    setShowCreate(true);
                  }}
                  className="text-left p-3.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 bg-white shadow-xs group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-700">
                      {tmpl.name}
                    </span>
                    <span className="text-[11px] text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 shrink-0">
                      {tmpl.contractType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug line-clamp-2 mb-2">
                    {tmpl.description || "No description provided."}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{tmpl.department}</span>
                    <span>·</span>
                    <span className="capitalize">{tmpl.riskLevel} risk</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              data-ocid="contracts.template_picker.cancel_button"
              onClick={() => setShowTemplatePicker(false)}
              className="h-9 text-sm"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Contract Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent
          data-ocid="contracts.create.dialog"
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              New Contract
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label
                htmlFor="contract-title"
                className="text-xs font-medium text-slate-700"
              >
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contract-title"
                data-ocid="contracts.create.input"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. Microsoft Enterprise Agreement 2026"
                className="h-9 text-sm"
              />
              {errors.title && (
                <p
                  data-ocid="contracts.create.error_state"
                  className="text-xs text-red-500"
                >
                  {errors.title}
                </p>
              )}
            </div>

            {/* Counterparty */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Counterparty <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.counterpartyId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, counterpartyId: v }))
                }
              >
                <SelectTrigger
                  data-ocid="contracts.create.counterparty_select"
                  className="h-9 text-sm"
                >
                  <SelectValue placeholder="Select counterparty" />
                </SelectTrigger>
                <SelectContent>
                  {counterparties.map((cp) => (
                    <SelectItem key={cp.id} value={cp.id} className="text-sm">
                      {cp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.counterpartyId && (
                <p className="text-xs text-red-500">{errors.counterpartyId}</p>
              )}
            </div>

            {/* Contract Type */}
            <div className="space-y-1.5">
              <Label
                htmlFor="contract-type"
                className="text-xs font-medium text-slate-700"
              >
                Contract Type <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contract-type"
                list="contract-type-list"
                data-ocid="contracts.create.type_input"
                value={form.contractType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contractType: e.target.value }))
                }
                placeholder="e.g. MSA, NDA, SaaS"
                className="h-9 text-sm"
              />
              <datalist id="contract-type-list">
                {CONTRACT_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              {errors.contractType && (
                <p className="text-xs text-red-500">{errors.contractType}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="start-date"
                  className="text-xs font-medium text-slate-700"
                >
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  data-ocid="contracts.create.start_date_input"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  className="h-9 text-sm"
                />
                {errors.startDate && (
                  <p className="text-xs text-red-500">{errors.startDate}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="end-date"
                  className="text-xs font-medium text-slate-700"
                >
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  data-ocid="contracts.create.end_date_input"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  className="h-9 text-sm"
                />
                {errors.endDate && (
                  <p className="text-xs text-red-500">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Value & Department */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="contract-value"
                  className="text-xs font-medium text-slate-700"
                >
                  Value (USD)
                </Label>
                <Input
                  id="contract-value"
                  type="number"
                  min="0"
                  data-ocid="contracts.create.value_input"
                  value={form.value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, value: e.target.value }))
                  }
                  placeholder="0"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="department"
                  className="text-xs font-medium text-slate-700"
                >
                  Department
                </Label>
                <Input
                  id="department"
                  data-ocid="contracts.create.department_input"
                  value={form.department}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, department: e.target.value }))
                  }
                  placeholder="e.g. Legal, Finance"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Risk Level */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Risk Level
              </Label>
              <Select
                value={form.riskLevel}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, riskLevel: v as RiskLevel }))
                }
              >
                <SelectTrigger
                  data-ocid="contracts.create.risk_select"
                  className="h-9 text-sm"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_LEVELS.map((r) => (
                    <SelectItem
                      key={r}
                      value={r}
                      className="text-sm capitalize"
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label
                htmlFor="description"
                className="text-xs font-medium text-slate-700"
              >
                Description
              </Label>
              <Textarea
                id="description"
                data-ocid="contracts.create.textarea"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Brief description of this contract..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            {/* Auto-Renew */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="auto-renew"
                data-ocid="contracts.create.auto_renew_checkbox"
                checked={form.autoRenew}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, autoRenew: !!v }))
                }
              />
              <Label
                htmlFor="auto-renew"
                className="text-sm text-slate-700 cursor-pointer"
              >
                Auto-Renew
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="contracts.create.cancel_button"
              onClick={() => setShowCreate(false)}
              disabled={saving}
              className="h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              data-ocid="contracts.create.submit_button"
              onClick={handleCreate}
              disabled={saving}
              className="h-9 text-sm bg-indigo-600 hover:bg-indigo-700"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Creating..." : "Create Contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
