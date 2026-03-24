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
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { LayoutTemplate, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RiskBadge } from "../components/Badges";
import { TemplateEditDialog } from "../components/TemplateEditDialog";
import type { ContractTemplate } from "../contexts/LocalStore";
import { useLocalStore } from "../contexts/LocalStore";
import type { RiskLevel } from "../data/seed";

const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];

const CONTRACT_TYPES = [
  "MSA",
  "NDA",
  "SaaS",
  "License",
  "Supply",
  "Consulting",
  "DPA",
  "Employment",
  "Lease",
  "Partnership",
  "Insurance",
  "Other",
];

const DEPARTMENTS = [
  "Legal",
  "IT",
  "Operations",
  "Procurement",
  "Finance",
  "HR",
  "Sales",
  "Marketing",
  "Compliance",
  "Strategy",
  "Facilities",
];

type CreateTemplateForm = {
  name: string;
  description: string;
  contractType: string;
  department: string;
  currency: string;
  riskLevel: RiskLevel;
  autoRenew: boolean;
  tags: string;
};

const EMPTY_FORM: CreateTemplateForm = {
  name: "",
  description: "",
  contractType: "",
  department: "",
  currency: "USD",
  riskLevel: "low",
  autoRenew: false,
  tags: "",
};

export default function Templates() {
  const { templates, addTemplate, deleteTemplate } = useLocalStore();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateTemplateForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateTemplateForm, string>>
  >({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState<ContractTemplate | null>(
    null,
  );

  function validateForm(): boolean {
    const errs: Partial<Record<keyof CreateTemplateForm, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.contractType.trim())
      errs.contractType = "Contract type is required";
    if (!form.department.trim()) errs.department = "Department is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleCreate() {
    if (!validateForm()) return;
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const tmpl: ContractTemplate = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      description: form.description.trim(),
      contractType: form.contractType.trim(),
      department: form.department.trim(),
      currency: form.currency,
      riskLevel: form.riskLevel,
      autoRenew: form.autoRenew,
      defaultClauses: [],
      tags,
      createdAt: Date.now(),
      createdBy: "current-user",
      isSeed: false,
    };
    addTemplate(tmpl);
    toast.success("Template created");
    setShowCreate(false);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  function handleDeleteConfirm() {
    if (!deleteId) return;
    deleteTemplate(deleteId);
    toast.success("Template deleted");
    setDeleteId(null);
  }

  return (
    <div className="px-4 md:px-5 py-4 md:py-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          {templates.length} template{templates.length !== 1 ? "s" : ""}
        </p>
        <Button
          data-ocid="templates.create_button"
          onClick={() => {
            setForm(EMPTY_FORM);
            setErrors({});
            setShowCreate(true);
          }}
          className="h-9 text-sm bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Create Template</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Mobile cards */}
      <div className="block md:hidden space-y-2" data-ocid="templates.list">
        {templates.length === 0 && (
          <div
            data-ocid="templates.empty_state"
            className="bg-white border border-slate-200 rounded-lg px-4 py-12 text-center text-slate-400 text-sm"
          >
            <LayoutTemplate className="w-8 h-8 mx-auto mb-3 text-slate-300" />
            No templates yet. Create one to speed up contract drafting.
          </div>
        )}
        {templates.map((tmpl, i) => (
          <div
            key={tmpl.id}
            data-ocid={`templates.item.${i + 1}`}
            className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                  {tmpl.name}
                  {tmpl.isSeed && (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {tmpl.contractType} &middot; {tmpl.department}
                </div>
              </div>
              <RiskBadge risk={tmpl.riskLevel} />
            </div>
            {tmpl.description && (
              <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                {tmpl.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {tmpl.defaultClauses.length} clause
                {tmpl.defaultClauses.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  data-ocid={`templates.edit_button.${i + 1}`}
                  onClick={() => setEditTemplate(tmpl)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                {!tmpl.isSeed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    data-ocid={`templates.delete_button.${i + 1}`}
                    onClick={() => setDeleteId(tmpl.id)}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div
        data-ocid="templates.table"
        className="hidden md:block bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Name
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Type
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Department
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Risk
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Clauses
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Created By
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {templates.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-slate-400 text-sm"
                  data-ocid="templates.empty_state"
                >
                  <div className="flex flex-col items-center gap-2">
                    <LayoutTemplate className="w-8 h-8 text-slate-300" />
                    No templates yet. Create one to speed up contract drafting.
                  </div>
                </td>
              </tr>
            )}
            {templates.map((tmpl, i) => (
              <tr
                key={tmpl.id}
                data-ocid={`templates.row.${i + 1}`}
                className="hover:bg-slate-50"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-900">
                      {tmpl.name}
                    </span>
                    {tmpl.isSeed && (
                      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                    )}
                  </div>
                  {tmpl.description && (
                    <div className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">
                      {tmpl.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant="outline" className="text-xs font-normal">
                    {tmpl.contractType}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-slate-600 text-xs">
                  {tmpl.department}
                </td>
                <td className="px-4 py-2.5">
                  <RiskBadge risk={tmpl.riskLevel} />
                </td>
                <td className="px-4 py-2.5 text-slate-600 text-xs tabular-nums">
                  {tmpl.defaultClauses.length}
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">
                  {tmpl.createdBy}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      data-ocid={`templates.edit_button.${i + 1}`}
                      onClick={() => setEditTemplate(tmpl)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {!tmpl.isSeed ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        data-ocid={`templates.delete_button.${i + 1}`}
                        onClick={() => setDeleteId(tmpl.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <span className="text-[11px] text-slate-400 px-1">
                        Built-in
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="templates.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the template. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="templates.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="templates.delete.confirm_button"
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Template Dialog */}
      <TemplateEditDialog
        key={editTemplate?.id ?? "none"}
        template={editTemplate}
        open={!!editTemplate}
        onOpenChange={(open) => {
          if (!open) setEditTemplate(null);
        }}
      />

      {/* Create Template Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent
          data-ocid="templates.create.dialog"
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              New Template
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="tmpl-name"
                className="text-xs font-medium text-slate-700"
              >
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tmpl-name"
                data-ocid="templates.create.input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Standard NDA"
                className="h-9 text-sm"
              />
              {errors.name && (
                <p
                  data-ocid="templates.create.error_state"
                  className="text-xs text-red-500"
                >
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="tmpl-description"
                className="text-xs font-medium text-slate-700"
              >
                Description
              </Label>
              <Textarea
                id="tmpl-description"
                data-ocid="templates.create.textarea"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Brief description of when to use this template..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Contract Type <span className="text-red-500">*</span>
                </Label>
                <Input
                  list="tmpl-type-list"
                  data-ocid="templates.create.type_input"
                  value={form.contractType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contractType: e.target.value }))
                  }
                  placeholder="e.g. MSA, NDA"
                  className="h-9 text-sm"
                />
                <datalist id="tmpl-type-list">
                  {CONTRACT_TYPES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                {errors.contractType && (
                  <p className="text-xs text-red-500">{errors.contractType}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.department}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, department: v }))
                  }
                >
                  <SelectTrigger
                    data-ocid="templates.create.department_select"
                    className="h-9 text-sm"
                  >
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dep) => (
                      <SelectItem key={dep} value={dep} className="text-sm">
                        {dep}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-xs text-red-500">{errors.department}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">
                  Currency
                </Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
                >
                  <SelectTrigger
                    data-ocid="templates.create.currency_select"
                    className="h-9 text-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
                      <SelectItem key={c} value={c} className="text-sm">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                    data-ocid="templates.create.risk_select"
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

            <div className="space-y-1.5">
              <Label
                htmlFor="tmpl-tags"
                className="text-xs font-medium text-slate-700"
              >
                Tags{" "}
                <span className="text-slate-400 font-normal">
                  (comma-separated)
                </span>
              </Label>
              <Input
                id="tmpl-tags"
                data-ocid="templates.create.tags_input"
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
                placeholder="e.g. nda, legal, confidentiality"
                className="h-9 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="tmpl-autorenew"
                data-ocid="templates.create.auto_renew_checkbox"
                checked={form.autoRenew}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, autoRenew: !!v }))
                }
              />
              <Label
                htmlFor="tmpl-autorenew"
                className="text-sm text-slate-700 cursor-pointer"
              >
                Auto-Renew by default
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="templates.create.cancel_button"
              onClick={() => setShowCreate(false)}
              className="h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              data-ocid="templates.create.submit_button"
              onClick={handleCreate}
              className="h-9 text-sm bg-indigo-600 hover:bg-indigo-700"
            >
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
