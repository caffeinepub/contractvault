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
import { Info, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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

const CLAUSE_TYPES = [
  "Liability",
  "Payment",
  "IP",
  "Termination",
  "Confidentiality",
  "Indemnity",
  "SLA",
  "Warranty",
  "Governing Law",
  "Other",
];

type ClauseItem = {
  title: string;
  text: string;
  clauseType: string;
  riskLevel: RiskLevel;
};

const EMPTY_CLAUSE: ClauseItem = {
  title: "",
  text: "",
  clauseType: "Other",
  riskLevel: "low",
};

const RISK_BADGE_COLORS: Record<RiskLevel, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

type Props = {
  template: ContractTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TemplateEditDialog({ template, open, onOpenChange }: Props) {
  const { updateTemplate } = useLocalStore();
  const isSeed = template?.isSeed ?? false;

  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [contractType, setContractType] = useState(
    template?.contractType ?? "",
  );
  const [department, setDepartment] = useState(template?.department ?? "");
  const [currency, setCurrency] = useState(template?.currency ?? "USD");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(
    template?.riskLevel ?? "low",
  );
  const [autoRenew, setAutoRenew] = useState(template?.autoRenew ?? false);
  const [tagsInput, setTagsInput] = useState(template?.tags.join(", ") ?? "");
  const [clauses, setClauses] = useState<ClauseItem[]>(
    template?.defaultClauses ?? [],
  );

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingClause, setEditingClause] = useState<ClauseItem | null>(null);
  const [newClause, setNewClause] = useState<ClauseItem>(EMPTY_CLAUSE);
  const [showAddClause, setShowAddClause] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!contractType.trim()) errs.contractType = "Contract type is required";
    if (!department.trim()) errs.department = "Department is required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!template) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const updated: ContractTemplate = {
      ...template,
      name: name.trim(),
      description: description.trim(),
      contractType: contractType.trim(),
      department,
      currency,
      riskLevel,
      autoRenew,
      tags,
      defaultClauses: clauses,
    };
    updateTemplate(updated);
    toast.success("Template updated");
    onOpenChange(false);
  }

  function startEditClause(idx: number) {
    setEditingIdx(idx);
    setEditingClause({ ...clauses[idx] });
  }

  function saveEditClause() {
    if (editingIdx === null || !editingClause) return;
    setClauses((prev) =>
      prev.map((c, i) => (i === editingIdx ? editingClause : c)),
    );
    setEditingIdx(null);
    setEditingClause(null);
  }

  function deleteClause(idx: number) {
    setClauses((prev) => prev.filter((_, i) => i !== idx));
  }

  function addClause() {
    if (!newClause.title.trim()) return;
    setClauses((prev) => [
      ...prev,
      {
        title: newClause.title.trim(),
        text: newClause.text.trim(),
        clauseType: newClause.clauseType,
        riskLevel: newClause.riskLevel,
      },
    ]);
    setNewClause(EMPTY_CLAUSE);
    setShowAddClause(false);
  }

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="templates.edit.dialog"
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Pencil className="w-4 h-4 text-indigo-500" />
            Edit Template
            {isSeed && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                <Lock className="w-3 h-3" /> Built-in
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              data-ocid="templates.edit.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSeed}
              placeholder="Template name"
              className="h-9 text-sm"
            />
            {errors.name && (
              <p
                data-ocid="templates.edit.error_state"
                className="text-xs text-red-500"
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">
              Description
            </Label>
            <Textarea
              data-ocid="templates.edit.textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSeed}
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {/* Type + Department */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Contract Type <span className="text-red-500">*</span>
              </Label>
              <Input
                list="edit-tmpl-type-list"
                data-ocid="templates.edit.type_input"
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                disabled={isSeed}
                placeholder="e.g. MSA, NDA"
                className="h-9 text-sm"
              />
              <datalist id="edit-tmpl-type-list">
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
                value={department}
                onValueChange={setDepartment}
                disabled={isSeed}
              >
                <SelectTrigger
                  data-ocid="templates.edit.department_select"
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

          {/* Currency + Risk */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                Currency
              </Label>
              <Select
                value={currency}
                onValueChange={setCurrency}
                disabled={isSeed}
              >
                <SelectTrigger
                  data-ocid="templates.edit.currency_select"
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
                value={riskLevel}
                onValueChange={(v) => setRiskLevel(v as RiskLevel)}
                disabled={isSeed}
              >
                <SelectTrigger
                  data-ocid="templates.edit.risk_select"
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

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">
              Tags{" "}
              <span className="text-slate-400 font-normal">
                (comma-separated)
              </span>
            </Label>
            <Input
              data-ocid="templates.edit.tags_input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              disabled={isSeed}
              placeholder="e.g. nda, legal"
              className="h-9 text-sm"
            />
          </div>

          {/* Auto-Renew */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="edit-tmpl-autorenew"
              data-ocid="templates.edit.auto_renew_checkbox"
              checked={autoRenew}
              onCheckedChange={(v) => setAutoRenew(!!v)}
              disabled={isSeed}
            />
            <Label
              htmlFor="edit-tmpl-autorenew"
              className="text-sm text-slate-700 cursor-pointer"
            >
              Auto-Renew by default
            </Label>
          </div>

          {/* Clauses section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-slate-700">
                Clauses
                <span className="ml-2 text-xs font-normal text-slate-400">
                  ({clauses.length})
                </span>
              </div>
              {!isSeed && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-ocid="templates.edit.add_clause_button"
                  onClick={() => setShowAddClause((v) => !v)}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Clause
                </Button>
              )}
            </div>

            {isSeed && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Built-in template — clauses are read-only. Duplicate this
                template to customize clauses.
              </div>
            )}

            {/* Add clause form */}
            {showAddClause && !isSeed && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3 space-y-2">
                <div className="text-xs font-semibold text-slate-600 mb-1">
                  New Clause
                </div>
                <Input
                  data-ocid="templates.edit.clause_title_input"
                  value={newClause.title}
                  onChange={(e) =>
                    setNewClause((c) => ({ ...c, title: e.target.value }))
                  }
                  placeholder="Clause title"
                  className="h-8 text-sm"
                />
                <Textarea
                  data-ocid="templates.edit.clause_text_textarea"
                  value={newClause.text}
                  onChange={(e) =>
                    setNewClause((c) => ({ ...c, text: e.target.value }))
                  }
                  placeholder="Clause text..."
                  rows={2}
                  className="text-sm resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={newClause.clauseType}
                    onValueChange={(v) =>
                      setNewClause((c) => ({ ...c, clauseType: v }))
                    }
                  >
                    <SelectTrigger
                      data-ocid="templates.edit.clause_type_select"
                      className="h-8 text-sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLAUSE_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-sm">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={newClause.riskLevel}
                    onValueChange={(v) =>
                      setNewClause((c) => ({ ...c, riskLevel: v as RiskLevel }))
                    }
                  >
                    <SelectTrigger
                      data-ocid="templates.edit.clause_risk_select"
                      className="h-8 text-sm"
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
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    data-ocid="templates.edit.clause_save_button"
                    onClick={addClause}
                    disabled={!newClause.title.trim()}
                    className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Clause
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    data-ocid="templates.edit.clause_cancel_button"
                    onClick={() => {
                      setShowAddClause(false);
                      setNewClause(EMPTY_CLAUSE);
                    }}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Clause list */}
            <div className="space-y-2">
              {clauses.length === 0 && (
                <div
                  data-ocid="templates.edit.clauses.empty_state"
                  className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg"
                >
                  No clauses defined.
                </div>
              )}
              {clauses.map((clause, idx) => {
                const isEditing = editingIdx === idx;
                return (
                  <div
                    key={`${clause.title}-${idx}`}
                    data-ocid={`templates.edit.clause.item.${idx + 1}`}
                    className="border border-slate-200 rounded-lg p-3 bg-white"
                  >
                    {isEditing && editingClause ? (
                      <div className="space-y-2">
                        <Input
                          value={editingClause.title}
                          onChange={(e) =>
                            setEditingClause((c) =>
                              c ? { ...c, title: e.target.value } : c,
                            )
                          }
                          placeholder="Clause title"
                          className="h-8 text-sm"
                        />
                        <Textarea
                          value={editingClause.text}
                          onChange={(e) =>
                            setEditingClause((c) =>
                              c ? { ...c, text: e.target.value } : c,
                            )
                          }
                          placeholder="Clause text..."
                          rows={2}
                          className="text-sm resize-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={editingClause.clauseType}
                            onValueChange={(v) =>
                              setEditingClause((c) =>
                                c ? { ...c, clauseType: v } : c,
                              )
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CLAUSE_TYPES.map((t) => (
                                <SelectItem
                                  key={t}
                                  value={t}
                                  className="text-sm"
                                >
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={editingClause.riskLevel}
                            onValueChange={(v) =>
                              setEditingClause((c) =>
                                c ? { ...c, riskLevel: v as RiskLevel } : c,
                              )
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
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
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={saveEditClause}
                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingIdx(null);
                              setEditingClause(null);
                            }}
                            className="h-7 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-slate-800">
                              {clause.title}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${RISK_BADGE_COLORS[clause.riskLevel]}`}
                            >
                              {clause.riskLevel}
                            </span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {clause.clauseType}
                            </span>
                          </div>
                          {clause.text && (
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {clause.text}
                            </p>
                          )}
                        </div>
                        {!isSeed && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              data-ocid={`templates.edit.clause.edit_button.${idx + 1}`}
                              onClick={() => startEditClause(idx)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              data-ocid={`templates.edit.clause.delete_button.${idx + 1}`}
                              onClick={() => deleteClause(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            data-ocid="templates.edit.cancel_button"
            onClick={() => onOpenChange(false)}
            className="h-9 text-sm"
          >
            Cancel
          </Button>
          {!isSeed && (
            <Button
              data-ocid="templates.edit.save_button"
              onClick={handleSave}
              className="h-9 text-sm bg-indigo-600 hover:bg-indigo-700"
            >
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
