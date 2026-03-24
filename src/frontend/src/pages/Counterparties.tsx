import { Button } from "@/components/ui/button";
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
import { Loader2, Pencil, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RiskBadge, StatusBadge } from "../components/Badges";
import { useLocalStore } from "../contexts/LocalStore";
import { getContractsByCounterpartyId } from "../data/seed";
import type {
  CounterpartyStatus,
  CounterpartyType,
  RiskLevel,
  SeedCounterparty,
} from "../data/seed";
import { useActor } from "../hooks/useActor";

const TYPE_OPTIONS: { value: CounterpartyType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "vendor", label: "Vendor" },
  { value: "client", label: "Client" },
  { value: "partner", label: "Partner" },
  { value: "regulator", label: "Regulator" },
  { value: "internal", label: "Internal" },
];

const STATUS_OPTIONS: { value: CounterpartyStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blacklisted", label: "Blacklisted" },
];

const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];
const CP_TYPES: CounterpartyType[] = [
  "vendor",
  "client",
  "partner",
  "regulator",
  "internal",
];
const CP_STATUSES: CounterpartyStatus[] = ["active", "inactive", "blacklisted"];

function CounterpartyStatusBadge({ status }: { status: CounterpartyStatus }) {
  const config = {
    active: "bg-emerald-100 text-emerald-800 border-emerald-200",
    inactive: "bg-slate-100 text-slate-600 border-slate-200",
    blacklisted: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${config[status]}`}
    >
      {status}
    </span>
  );
}

type CpForm = {
  name: string;
  counterpartyType: CounterpartyType;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  riskLevel: RiskLevel;
  status: CounterpartyStatus;
};

const EMPTY_FORM: CpForm = {
  name: "",
  counterpartyType: "vendor",
  contactName: "",
  email: "",
  phone: "",
  country: "",
  address: "",
  riskLevel: "low",
  status: "active",
};

function cpToForm(cp: SeedCounterparty): CpForm {
  return {
    name: cp.name,
    counterpartyType: cp.counterpartyType,
    contactName: cp.contactName,
    email: cp.email,
    phone: cp.phone,
    country: cp.country,
    address: cp.address,
    riskLevel: cp.riskLevel,
    status: cp.status,
  };
}

export default function Counterparties() {
  const { counterparties, addCounterparty, updateCounterparty } =
    useLocalStore();
  const { actor } = useActor();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<SeedCounterparty | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<SeedCounterparty | null>(null);
  const [form, setForm] = useState<CpForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CpForm, string>>>(
    {},
  );
  const [saving, setSaving] = useState(false);

  const filtered = counterparties.filter((cp) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      cp.name.toLowerCase().includes(q) ||
      cp.contactName.toLowerCase().includes(q) ||
      cp.country.toLowerCase().includes(q);
    const matchType =
      typeFilter === "all" || cp.counterpartyType === typeFilter;
    const matchStatus = statusFilter === "all" || cp.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const selectedContracts = selected
    ? getContractsByCounterpartyId(selected.id)
    : [];

  function validateForm(): boolean {
    const errs: Partial<Record<keyof CpForm, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.counterpartyType) errs.counterpartyType = "Type is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditTarget(null);
    setShowCreate(true);
  }

  function openEdit(cp: SeedCounterparty) {
    setForm(cpToForm(cp));
    setErrors({});
    setEditTarget(cp);
    setShowCreate(true);
  }

  async function handleSave() {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const now = Date.now();
      if (editTarget) {
        const updated: SeedCounterparty = {
          ...editTarget,
          name: form.name.trim(),
          counterpartyType: form.counterpartyType,
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          country: form.country.trim(),
          address: form.address.trim(),
          riskLevel: form.riskLevel,
          status: form.status,
          updatedAt: now,
        };
        updateCounterparty(updated);
        if (selected?.id === editTarget.id) setSelected(updated);
        if (actor) {
          actor
            .updateCounterparty(
              editTarget.id,
              updated.name,
              updated.counterpartyType as any,
              updated.status as any,
              updated.email,
              updated.phone,
              updated.address,
              updated.country,
              updated.contactName,
              updated.riskLevel as any,
            )
            .catch(() => {});
        }
        toast.success("Counterparty updated");
      } else {
        const id = crypto.randomUUID();
        const newCp: SeedCounterparty = {
          id,
          name: form.name.trim(),
          counterpartyType: form.counterpartyType,
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          country: form.country.trim(),
          address: form.address.trim(),
          riskLevel: form.riskLevel,
          status: form.status,
          createdAt: now,
          updatedAt: now,
        };
        addCounterparty(newCp);
        if (actor) {
          actor
            .createCounterparty(
              id,
              newCp.name,
              newCp.counterpartyType as any,
              newCp.status as any,
              newCp.email,
              newCp.phone,
              newCp.address,
              newCp.country,
              newCp.contactName,
              newCp.riskLevel as any,
            )
            .catch(() => {});
        }
        toast.success("Counterparty added");
      }
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setErrors({});
      setEditTarget(null);
    } finally {
      setSaving(false);
    }
  }

  const isEditing = !!editTarget;

  return (
    <div className="px-4 md:px-5 py-4 md:py-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {counterparties.length} total &middot; {filtered.length} shown
        </p>
        <button
          type="button"
          data-ocid="counterparties.new_button"
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3.5 py-2 h-9 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Counterparty</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 mb-4 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            data-ocid="counterparties.search_input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search counterparties..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger
              data-ocid="counterparties.type_select"
              className="flex-1 md:w-36 h-8 text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-sm">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              data-ocid="counterparties.status_select"
              className="flex-1 md:w-36 h-8 text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-sm">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || typeFilter !== "all" || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTypeFilter("all");
                setStatusFilter("all");
              }}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 min-h-[32px] px-2"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Mobile card list */}
      <div
        className="block md:hidden space-y-2"
        data-ocid="counterparties.list"
      >
        {filtered.map((cp, i) => {
          const cpContracts = getContractsByCounterpartyId(cp.id);
          return (
            <button
              type="button"
              key={cp.id}
              data-ocid={`counterparties.item.${i + 1}`}
              onClick={() => setSelected(cp)}
              className="w-full text-left bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-800 truncate">
                    {cp.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 capitalize">
                    {cp.counterpartyType} &middot; {cp.country}
                  </div>
                </div>
                <CounterpartyStatusBadge status={cp.status} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <RiskBadge risk={cp.riskLevel} />
                <span className="text-xs text-slate-400">
                  {cpContracts.length} contract
                  {cpContracts.length !== 1 ? "s" : ""}
                </span>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div
            data-ocid="counterparties.empty_state"
            className="bg-white border border-slate-200 rounded-lg px-4 py-12 text-center text-slate-400 text-sm"
          >
            No counterparties found.
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div
        data-ocid="counterparties.table"
        className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Type
              </th>
              <th className="text-left px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Risk
              </th>
              <th className="text-left px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Country
              </th>
              <th className="text-left px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="text-left px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Contracts
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((cp, i) => {
              const cpContracts = getContractsByCounterpartyId(cp.id);
              return (
                <tr
                  key={cp.id}
                  data-ocid={`counterparties.row.${i + 1}`}
                  onClick={() => setSelected(cp)}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(cp)}
                  tabIndex={0}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {cp.name}
                  </td>
                  <td className="px-4 py-2.5 capitalize text-slate-600">
                    {cp.counterpartyType}
                  </td>
                  <td className="px-4 py-2.5">
                    <CounterpartyStatusBadge status={cp.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    <RiskBadge risk={cp.riskLevel} />
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{cp.country}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {cp.contactName}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-slate-700 text-xs">
                      {cpContracts.length}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  data-ocid="counterparties.empty_state"
                  className="px-4 py-10 text-center text-slate-400 text-sm"
                >
                  No counterparties found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Sheet */}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent
          data-ocid="counterparties.sheet"
          className="w-full sm:w-[440px] overflow-y-auto"
        >
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-base">
                      {selected.name}
                    </SheetTitle>
                    <div className="flex gap-2 mt-1.5">
                      <span className="px-2 py-0.5 text-xs border rounded bg-slate-100 text-slate-600 capitalize">
                        {selected.counterpartyType}
                      </span>
                      <RiskBadge risk={selected.riskLevel} />
                    </div>
                  </div>
                  <button
                    type="button"
                    data-ocid="counterparties.edit_button"
                    onClick={() => openEdit(selected)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                </div>
              </SheetHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-slate-500 font-medium mb-2">
                    Contact Information
                  </div>
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-slate-400">Contact</span>
                    <span className="text-slate-800">
                      {selected.contactName}
                    </span>
                    <span className="text-slate-400">Email</span>
                    <span className="text-slate-800 break-all">
                      {selected.email}
                    </span>
                    <span className="text-slate-400">Phone</span>
                    <span className="text-slate-800">{selected.phone}</span>
                    <span className="text-slate-400">Country</span>
                    <span className="text-slate-800">{selected.country}</span>
                    <span className="text-slate-400">Address</span>
                    <span className="text-slate-800">{selected.address}</span>
                  </div>
                </div>
                {selectedContracts.length > 0 && (
                  <div>
                    <div className="text-slate-500 font-medium mb-2">
                      Contracts ({selectedContracts.length})
                    </div>
                    <div className="space-y-1.5">
                      {selectedContracts.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between py-1 border-b border-slate-100"
                        >
                          <span className="text-slate-800">{c.title}</span>
                          <StatusBadge status={c.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create / Edit Dialog */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreate(false);
            setEditTarget(null);
            setForm(EMPTY_FORM);
            setErrors({});
          }
        }}
      >
        <DialogContent
          data-ocid="counterparties.create.dialog"
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {isEditing ? "Edit Counterparty" : "Add Counterparty"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="cp-name"
                className="text-xs font-medium text-slate-700"
              >
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cp-name"
                data-ocid="counterparties.create.input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Accenture"
                className="h-9 text-sm"
              />
              {errors.name && (
                <p
                  data-ocid="counterparties.create.error_state"
                  className="text-xs text-red-500"
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* Type & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.counterpartyType}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      counterpartyType: v as CounterpartyType,
                    }))
                  }
                >
                  <SelectTrigger
                    data-ocid="counterparties.create.type_select"
                    className="h-9 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CP_TYPES.map((t) => (
                      <SelectItem
                        key={t}
                        value={t}
                        className="text-sm capitalize"
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Status
                </Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, status: v as CounterpartyStatus }))
                  }
                >
                  <SelectTrigger
                    data-ocid="counterparties.create.status_select"
                    className="h-9 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CP_STATUSES.map((s) => (
                      <SelectItem
                        key={s}
                        value={s}
                        className="text-sm capitalize"
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contact & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="cp-contact"
                  className="text-xs font-medium text-slate-700"
                >
                  Contact Name
                </Label>
                <Input
                  id="cp-contact"
                  data-ocid="counterparties.create.contact_input"
                  value={form.contactName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactName: e.target.value }))
                  }
                  placeholder="Full name"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="cp-email"
                  className="text-xs font-medium text-slate-700"
                >
                  Email
                </Label>
                <Input
                  id="cp-email"
                  type="email"
                  data-ocid="counterparties.create.email_input"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="email@company.com"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Phone & Country */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="cp-phone"
                  className="text-xs font-medium text-slate-700"
                >
                  Phone
                </Label>
                <Input
                  id="cp-phone"
                  data-ocid="counterparties.create.phone_input"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="+1 000-000-0000"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="cp-country"
                  className="text-xs font-medium text-slate-700"
                >
                  Country
                </Label>
                <Input
                  id="cp-country"
                  data-ocid="counterparties.create.country_input"
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                  placeholder="e.g. USA"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label
                htmlFor="cp-address"
                className="text-xs font-medium text-slate-700"
              >
                Address
              </Label>
              <Input
                id="cp-address"
                data-ocid="counterparties.create.address_input"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="Street address"
                className="h-9 text-sm"
              />
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
                  data-ocid="counterparties.create.risk_select"
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
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="counterparties.create.cancel_button"
              onClick={() => setShowCreate(false)}
              disabled={saving}
              className="h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              data-ocid="counterparties.create.submit_button"
              onClick={handleSave}
              disabled={saving}
              className="h-9 text-sm bg-indigo-600 hover:bg-indigo-700"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add Counterparty"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
