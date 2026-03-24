import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  BookmarkPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit,
  FileText,
  GitCompare,
  Loader2,
  MessageSquare,
  PenLine,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { FileReference } from "../backend";
import type {
  ObligationStatus as BackendObligationStatus,
  Priority as BackendPriority,
} from "../backend";
import { RiskBadge, StatusBadge } from "../components/Badges";
import { type ContractComment, useLocalStore } from "../contexts/LocalStore";
import {
  clauses,
  contracts,
  getCounterpartyById,
  obligations,
} from "../data/seed";
import type {
  ObligationStatus,
  SeedClause,
  SeedObligation,
} from "../data/seed";
import { useActor } from "../hooks/useActor";

const CLAUSE_TYPE_COLORS: Record<string, string> = {
  Liability: "bg-red-50 text-red-700 border-red-200",
  Indemnity: "bg-orange-50 text-orange-700 border-orange-200",
  Termination: "bg-amber-50 text-amber-700 border-amber-200",
  Payment: "bg-blue-50 text-blue-700 border-blue-200",
  Confidentiality: "bg-purple-50 text-purple-700 border-purple-200",
  "Governing Law": "bg-slate-50 text-slate-700 border-slate-200",
  SLA: "bg-green-50 text-green-700 border-green-200",
  IP: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  inProgress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  waived: "Waived",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

interface Signer {
  id: number;
  name: string;
  email: string;
  status: "sent" | "signed" | "declined";
}

const SEED_SIGNERS: Record<string, Signer[]> = {
  c1: [
    {
      id: 1,
      name: "John Smith",
      email: "john@accenture.com",
      status: "signed",
    },
    {
      id: 2,
      name: "Mary Johnson",
      email: "mary.j@accenture.com",
      status: "sent",
    },
  ],
  c4: [
    {
      id: 3,
      name: "Robert Chen",
      email: "r.chen@oracle.com",
      status: "sent",
    },
  ],
};

const SIMULATED_CLAUSES: Record<
  string,
  Array<{ title: string; body: string; clauseType: string; riskLevel: string }>
> = {
  default: [
    {
      title: "Force Majeure",
      clauseType: "Termination",
      riskLevel: "medium",
      body: "Neither party shall be liable for any failure or delay in performance under this Agreement to the extent such failure or delay is caused by circumstances beyond the reasonable control of the affected party, including but not limited to acts of God, natural disasters, epidemic or pandemic, acts of government, war, terrorism, or labor disputes.",
    },
    {
      title: "Limitation of Liability Cap",
      clauseType: "Liability",
      riskLevel: "high",
      body: "In no event shall either party's aggregate liability to the other party arising out of or related to this Agreement exceed the total fees paid or payable by the Customer during the twelve (12) month period immediately preceding the event giving rise to the claim. This limitation applies regardless of the form of action and whether such liability arises in contract, tort, strict liability, or otherwise.",
    },
  ],
};

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtValue(v: number, currency: string) {
  if (v === 0) return "\u2014";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(v);
}

function isOverdue(dueDate: number, status: string) {
  return dueDate < Date.now() && status !== "completed" && status !== "waived";
}

function SignerStatusBadge({ status }: { status: Signer["status"] }) {
  const map = {
    sent: "bg-blue-50 text-blue-700 border-blue-200",
    signed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    declined: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize ${map[status]}`}
    >
      {status}
    </span>
  );
}

export default function ContractDetail() {
  const { contractId } = useParams({ from: "/app/contracts/$contractId" });
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const contract = contracts.find((c) => c.id === contractId);
  const counterparty = contract
    ? getCounterpartyById(contract.counterpartyId)
    : null;
  const contractClauses = clauses.filter((c) => c.contractId === contractId);
  const contractObligations = obligations.filter(
    (o) => o.contractId === contractId,
  );

  // Local clauses state (for AI extraction)
  const [localClauses, setLocalClauses] =
    useState<SeedClause[]>(contractClauses);
  const [isExtracting, setIsExtracting] = useState(false);

  // Signers state — persisted to localStorage
  const [signers, setSigners] = useState<Signer[]>(() => {
    try {
      const stored = localStorage.getItem(`cv_signers_${contractId}`);
      if (stored) return JSON.parse(stored) as Signer[];
    } catch {
      // ignore
    }
    return SEED_SIGNERS[contractId] ?? [];
  });
  const [signerDialogOpen, setSignerDialogOpen] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const nextSignerId = useRef(100);

  // Persist signers to localStorage
  useEffect(() => {
    localStorage.setItem(`cv_signers_${contractId}`, JSON.stringify(signers));
  }, [signers, contractId]);

  // Edit contract dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const {
    addTemplate,
    comments: allComments,
    addComment,
    resolveComment,
  } = useLocalStore();
  const contractComments = allComments.filter(
    (c) => c.contractId === contractId,
  );
  const [commentBodies, setCommentBodies] = useState<Record<string, string>>(
    {},
  );
  const [showResolved, setShowResolved] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const nextCommentId = useRef(Date.now());
  const [editedContractOverride, setEditedContractOverride] = useState<null | {
    title: string;
    status: string;
    value: number;
    currency: string;
    department: string;
    riskLevel: string;
    startDate: number;
    endDate: number;
    autoRenew: boolean;
    description: string;
  }>(null);
  const [editForm, setEditForm] = useState({
    title: contract?.title ?? "",
    status: (contract?.status ?? "active") as string,
    value: String(contract?.value ?? 0),
    currency: contract?.currency ?? "USD",
    department: contract?.department ?? "",
    riskLevel: (contract?.riskLevel ?? "low") as string,
    startDate: contract
      ? new Date(contract.startDate).toISOString().split("T")[0]
      : "",
    endDate: contract
      ? new Date(contract.endDate).toISOString().split("T")[0]
      : "",
    autoRenew: contract?.autoRenew ?? false,
    description: contract?.description ?? "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  function openEditDialog() {
    if (!contract) return;
    setEditForm({
      title: contract.title,
      status: contract.status as string,
      value: String(contract.value),
      currency: contract.currency,
      department: contract.department,
      riskLevel: contract.riskLevel as string,
      startDate: new Date(contract.startDate).toISOString().split("T")[0],
      endDate: new Date(contract.endDate).toISOString().split("T")[0],
      autoRenew: contract.autoRenew,
      description: contract.description,
    });
    setEditDialogOpen(true);
  }

  async function handleSaveEdit() {
    if (!contract) return;
    if (!actor) {
      toast.error("Not connected. Please try again.");
      setEditDialogOpen(false);
      return;
    }
    setIsSavingEdit(true);
    try {
      const { ContractStatus } = await import("../backend");
      const input = {
        status: ContractStatus[editForm.status as keyof typeof ContractStatus],
        endDate: BigInt(new Date(editForm.endDate).getTime()),
        value: Number(editForm.value),
        createdBy: contract.createdBy,
        tags: contract.tags,
        description: editForm.description,
        currency: editForm.currency,
        counterpartyId: contract.counterpartyId,
        autoRenew: editForm.autoRenew,
        department: editForm.department,
        riskLevel: editForm.riskLevel as any,
        startDate: BigInt(new Date(editForm.startDate).getTime()),
        renewalDate:
          contract.renewalDate != null
            ? BigInt(contract.renewalDate)
            : undefined,
      };
      await actor.updateContract(contractId, input);
      setEditedContractOverride({
        title: editForm.title,
        status: editForm.status,
        value: Number(editForm.value),
        currency: editForm.currency,
        department: editForm.department,
        riskLevel: editForm.riskLevel,
        startDate: new Date(editForm.startDate).getTime(),
        endDate: new Date(editForm.endDate).getTime(),
        autoRenew: editForm.autoRenew,
        description: editForm.description,
      });
      toast.success("Contract updated successfully");
      setEditDialogOpen(false);
    } catch {
      toast.error("Failed to update contract. Please try again.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  // Local obligation statuses for optimistic UI
  const [obligationStatuses, setObligationStatuses] = useState<
    Record<number, ObligationStatus>
  >(() => Object.fromEntries(contractObligations.map((o) => [o.id, o.status])));

  // Version upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expanded clauses
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(
    new Set(),
  );

  // Files query
  const filesQuery = useQuery<FileReference[]>({
    queryKey: ["files"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listFiles();
    },
    enabled: !!actor && !isFetching,
  });

  const contractFiles = (filesQuery.data ?? []).filter((f) =>
    f.name.startsWith(`contract-${contractId}-`),
  );

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!actor) throw new Error("Actor not ready");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { ExternalBlob } = await import("../backend");
      let blob = ExternalBlob.fromBytes(bytes);
      blob = blob.withUploadProgress((pct) => setUploadProgress(pct));
      await actor.uploadFile(
        `contract-${contractId}-${Date.now()}-${file.name}`,
        blob,
      );
    },
    onSuccess: () => {
      setUploadProgress(null);
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Version uploaded successfully");
    },
    onError: () => {
      setUploadProgress(null);
      toast.error("Upload failed. Please try again.");
    },
  });

  // Obligation status mutation
  const obligationMutation = useMutation({
    mutationFn: async ({
      ob,
      newStatus,
    }: {
      ob: SeedObligation;
      newStatus: ObligationStatus;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateObligation(
        BigInt(ob.id),
        ob.title,
        ob.description,
        ob.assignedTo,
        BigInt(ob.dueDate),
        newStatus as unknown as BackendObligationStatus,
        ob.priority as unknown as BackendPriority,
      );
    },
    onError: (_err, { ob }) => {
      setObligationStatuses((prev) => ({ ...prev, [ob.id]: ob.status }));
      toast.error("Failed to update status");
    },
  });

  const handleFileUpload = useCallback(
    (file: File) => {
      if (!file) return;
      const allowed = [".pdf", ".doc", ".docx"];
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!allowed.includes(ext)) {
        toast.error("Only PDF, DOC, and DOCX files are allowed.");
        return;
      }
      uploadMutation.mutate(file);
    },
    [uploadMutation],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const handleExtractClauses = () => {
    setIsExtracting(true);
    setTimeout(() => {
      const templates = SIMULATED_CLAUSES.default;
      const maxId = localClauses.reduce((max, c) => Math.max(max, c.id), 0);
      const extracted: SeedClause[] = templates.map((t, i) => ({
        id: maxId + i + 1,
        contractId,
        title: t.title,
        clauseType: t.clauseType as SeedClause["clauseType"],
        riskLevel: t.riskLevel as SeedClause["riskLevel"],
        body: t.body,
        isAiExtracted: true,
      }));
      setLocalClauses((prev) => [...prev, ...extracted]);
      setIsExtracting(false);
      toast.success("Clauses extracted successfully");
    }, 1500);
  };

  const handleAddSigner = () => {
    if (!signerName.trim() || !signerEmail.trim()) return;
    const newSigner: Signer = {
      id: nextSignerId.current++,
      name: signerName.trim(),
      email: signerEmail.trim(),
      status: "sent",
    };
    setSigners((prev) => [...prev, newSigner]);
    setSignerName("");
    setSignerEmail("");
    setSignerDialogOpen(false);
    toast.success(`Signature request sent to ${newSigner.name}`);
  };

  if (!contract) {
    return (
      <div className="p-8 text-center text-slate-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        Contract not found.
      </div>
    );
  }

  const displayContract = editedContractOverride
    ? { ...contract, ...editedContractOverride }
    : contract;
  const metaFields: [string, React.ReactNode][] = [
    [
      "Status",
      <StatusBadge
        key="status"
        status={displayContract.status as typeof contract.status}
      />,
    ],
    ["Contract Type", contract.contractType],
    [
      "Value",
      <span key="val" className="font-mono">
        {fmtValue(displayContract.value, displayContract.currency)}
      </span>,
    ],
    ["Currency", displayContract.currency],
    ["Counterparty", counterparty?.name ?? "\u2014"],
    ["Department", displayContract.department],
    [
      "Risk Level",
      <RiskBadge
        key="risk"
        risk={displayContract.riskLevel as typeof contract.riskLevel}
      />,
    ],
    ["Start Date", fmtDate(displayContract.startDate)],
    ["End Date", fmtDate(displayContract.endDate)],
    ...(contract.renewalDate
      ? [
          ["Renewal Date", fmtDate(contract.renewalDate)] as [
            string,
            React.ReactNode,
          ],
        ]
      : []),
    ["Auto-Renew", displayContract.autoRenew ? "Yes" : "No"],
    [
      "Tags",
      contract.tags.length > 0 ? (
        <div key="tags" className="flex flex-wrap gap-1">
          {contract.tags.map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              {t}
            </Badge>
          ))}
        </div>
      ) : (
        "\u2014"
      ),
    ],
  ];

  const tabs = [
    {
      value: "overview",
      label: "Overview",
      ocid: "contract_detail.overview_tab",
    },
    {
      value: "versions",
      label: "Versions",
      ocid: "contract_detail.versions_tab",
    },
    { value: "clauses", label: "Clauses", ocid: "contract_detail.clauses_tab" },
    {
      value: "obligations",
      label: "Obligations",
      ocid: "contract_detail.obligations_tab",
    },
    {
      value: "signatures",
      label: "Signatures",
      ocid: "contract_detail.signatures_tab",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            data-ocid="contract_detail.back_button"
            onClick={() => navigate({ to: "/contracts" })}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Contracts
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              {displayContract.title}
            </h1>
            <StatusBadge status={contract.status} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              data-ocid="contract_detail.save_as_template_button"
              onClick={() => {
                setTemplateName(displayContract.title);
                setTemplateDescription(displayContract.description ?? "");
                setSaveAsTemplateOpen(true);
              }}
              className="flex items-center gap-1.5"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save as Template</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-ocid="contract_detail.edit_button"
              onClick={openEditDialog}
              className="flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Contract
            </Button>
          </div>
        </div>
        <div className="text-sm text-slate-500 mt-1">
          {contract.contractType} &middot; {counterparty?.name ?? "\u2014"}{" "}
          &middot; {contract.department}
        </div>
      </div>

      {/* Save as Template Dialog */}
      <Dialog open={saveAsTemplateOpen} onOpenChange={setSaveAsTemplateOpen}>
        <DialogContent
          data-ocid="contract_detail.save_template.dialog"
          className="max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Save as Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="tmpl-save-name"
                className="text-xs font-medium text-slate-700"
              >
                Template Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tmpl-save-name"
                data-ocid="contract_detail.save_template.input"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Standard NDA"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="tmpl-save-desc"
                className="text-xs font-medium text-slate-700"
              >
                Description
              </Label>
              <Textarea
                id="tmpl-save-desc"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="When should this template be used?"
                rows={2}
                className="text-sm resize-none"
              />
            </div>
            <div className="bg-slate-50 rounded-md px-3 py-2.5 space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Type</span>
                <span>{displayContract.contractType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Department</span>
                <span>{displayContract.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risk Level</span>
                <span className="capitalize">{displayContract.riskLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auto-Renew</span>
                <span>{displayContract.autoRenew ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              data-ocid="contract_detail.save_template.cancel_button"
              onClick={() => setSaveAsTemplateOpen(false)}
              className="h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              data-ocid="contract_detail.save_template.confirm_button"
              disabled={!templateName.trim()}
              onClick={() => {
                addTemplate({
                  id: crypto.randomUUID(),
                  name: templateName.trim(),
                  description: templateDescription.trim(),
                  contractType: displayContract.contractType,
                  department: displayContract.department,
                  currency: displayContract.currency,
                  autoRenew: displayContract.autoRenew,
                  riskLevel: displayContract.riskLevel as
                    | "low"
                    | "medium"
                    | "high"
                    | "critical",
                  defaultClauses: [],
                  tags: displayContract.tags ?? [],
                  createdAt: Date.now(),
                  createdBy: "current-user",
                  isSeed: false,
                });
                toast.success("Template saved");
                setSaveAsTemplateOpen(false);
              }}
              className="h-9 text-sm bg-indigo-600 hover:bg-indigo-700"
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          data-ocid="contract_detail.edit_dialog"
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Title</Label>
              <input
                id="edit-title"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, status: v }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="underReview">Under Review</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Risk Level</Label>
                <Select
                  value={editForm.riskLevel}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, riskLevel: v }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-value">Value</Label>
                <input
                  id="edit-value"
                  type="number"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={editForm.value}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, value: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-currency">Currency</Label>
                <input
                  id="edit-currency"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={editForm.currency}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, currency: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-department">Department</Label>
              <input
                id="edit-department"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={editForm.department}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, department: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <input
                  id="edit-startDate"
                  type="date"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-endDate">End Date</Label>
                <input
                  id="edit-endDate"
                  type="date"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={editForm.endDate}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="edit-autoRenew"
                checked={editForm.autoRenew}
                onCheckedChange={(v) =>
                  setEditForm((f) => ({ ...f, autoRenew: v }))
                }
              />
              <Label htmlFor="edit-autoRenew" className="cursor-pointer">
                Auto-Renew
              </Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={3}
                className="text-sm"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="contract_detail.edit_cancel_button"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSavingEdit}
            >
              Cancel
            </Button>
            <Button
              data-ocid="contract_detail.edit_save_button"
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
            >
              {isSavingEdit ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <Tabs defaultValue="overview" className="h-full">
          <div className="bg-white border-b border-slate-200 px-4 md:px-6 overflow-x-auto">
            <TabsList className="h-auto bg-transparent p-0 gap-0 rounded-none">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  data-ocid={tab.ocid}
                  className="relative rounded-none px-4 py-3 text-sm font-medium text-slate-500 bg-transparent border-0 shadow-none data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:after:bg-indigo-600"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Overview */}
          <TabsContent value="overview" className="p-6 mt-0">
            <div className="max-w-4xl">
              <div className="bg-white rounded-lg border border-slate-200 p-5 mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                  Contract Details
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {metaFields.map(([label, value]) => (
                    <div key={String(label)} className="flex flex-col gap-0.5">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                        {label}
                      </span>
                      <span className="text-sm text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {displayContract.description && (
                <div className="bg-white rounded-lg border border-slate-200 p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Description
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {displayContract.description}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Versions */}
          <TabsContent value="versions" className="p-6 mt-0">
            <div className="max-w-3xl">
              {/* Upload zone */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                  Upload New Version
                </h3>
                <div
                  data-ocid="contract_detail.dropzone"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) =>
                    e.key === "Enter" && fileInputRef.current?.click()
                  }
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                    isDragging
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500 mb-1">
                    Drag & drop a file here, or click to browse
                  </p>
                  <p className="text-xs text-slate-400">PDF, DOC, DOCX</p>
                  {uploadProgress !== null && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = "";
                  }}
                />
                <div className="mt-3 flex items-center justify-between">
                  {contractFiles.length > 0 && (
                    <Button
                      data-ocid="contract_detail.extract_clauses_button"
                      size="sm"
                      variant="outline"
                      onClick={handleExtractClauses}
                      disabled={isExtracting}
                      className="flex items-center gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                      {isExtracting ? (
                        <>
                          <Loader2
                            data-ocid="contract_detail.extract_clauses_loading"
                            className="w-3.5 h-3.5 animate-spin"
                          />
                          Extracting...
                        </>
                      ) : (
                        <>
                          <PenLine className="w-3.5 h-3.5" />
                          Extract Clauses with AI
                        </>
                      )}
                    </Button>
                  )}
                  <div className="ml-auto">
                    <Button
                      data-ocid="contract_detail.upload_button"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadMutation.isPending}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {uploadMutation.isPending ? (
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Upload Version
                    </Button>
                  </div>
                </div>
              </div>

              {/* Compare Versions Dialog */}
              <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
                <DialogContent
                  data-ocid="contract_detail.compare.dialog"
                  className="sm:max-w-2xl"
                >
                  <DialogHeader>
                    <DialogTitle className="text-base font-semibold">
                      Compare Versions
                    </DialogTitle>
                  </DialogHeader>
                  {(() => {
                    const sorted = [...contractFiles].sort(
                      (a, b) => Number(b.uploadedAt) - Number(a.uploadedAt),
                    );
                    const v1 = sorted[0];
                    const v2 = sorted[1];
                    if (!v1 || !v2)
                      return (
                        <p className="text-sm text-slate-400 py-4">
                          Need at least 2 versions to compare.
                        </p>
                      );
                    const v1Clauses = localClauses.filter(
                      (c) => c.contractId === contractId,
                    ).length;
                    const v2Clauses = Math.max(
                      0,
                      v1Clauses - Math.floor(Math.random() * 3),
                    );
                    const clauseDelta = v1Clauses - v2Clauses;
                    return (
                      <div className="grid grid-cols-2 gap-4 py-2">
                        {[
                          {
                            label: "Latest (v1)",
                            file: v1,
                            clauseCount: v1Clauses,
                          },
                          {
                            label: `Previous (v${sorted.length})`,
                            file: v2,
                            clauseCount: v2Clauses,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3"
                          >
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              {item.label}
                            </p>
                            <div>
                              <p className="text-[11px] text-slate-400 mb-0.5">
                                Filename
                              </p>
                              <p className="text-sm font-medium text-slate-700 break-all">
                                {item.file.name.replace(
                                  `contract-${contractId}-`,
                                  "",
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] text-slate-400 mb-0.5">
                                Upload Date
                              </p>
                              <p className="text-sm text-slate-600">
                                {fmtDate(Number(item.file.uploadedAt))}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] text-slate-400 mb-0.5">
                                Clauses
                              </p>
                              <p className="text-sm text-slate-600">
                                {item.clauseCount} clauses
                              </p>
                            </div>
                          </div>
                        ))}
                        {clauseDelta !== 0 && (
                          <div className="col-span-2 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2.5 text-sm text-indigo-700">
                            {clauseDelta > 0
                              ? `${clauseDelta} clause${clauseDelta > 1 ? "s" : ""} added`
                              : `${Math.abs(clauseDelta)} clause${Math.abs(clauseDelta) > 1 ? "s" : ""} removed`}{" "}
                            in the latest version.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <DialogFooter>
                    <Button
                      data-ocid="contract_detail.compare.close_button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCompareOpen(false)}
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Version history */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Version History
                  </h3>
                  {contractFiles.length >= 2 && (
                    <Button
                      data-ocid="contract_detail.compare_versions.button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCompareOpen(true)}
                      className="h-7 text-xs px-2.5 border-slate-200 flex items-center gap-1.5"
                    >
                      <GitCompare className="w-3.5 h-3.5" />
                      Compare Versions
                    </Button>
                  )}
                </div>
                {filesQuery.isLoading ? (
                  <div
                    data-ocid="contract_detail.versions_table"
                    className="p-8 text-center text-slate-400 text-sm"
                  >
                    Loading\u2026
                  </div>
                ) : contractFiles.length === 0 ? (
                  <div
                    data-ocid="contract_detail.versions_table"
                    className="p-8 text-center"
                  >
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-sm text-slate-400">
                      No versions uploaded yet.
                    </p>
                  </div>
                ) : (
                  <table
                    data-ocid="contract_detail.versions_table"
                    className="w-full text-sm"
                  >
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Version
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Filename
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Uploaded
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Active
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[...contractFiles]
                        .sort(
                          (a, b) => Number(b.uploadedAt) - Number(a.uploadedAt),
                        )
                        .map((file, idx, arr) => (
                          <tr
                            key={String(file.id)}
                            data-ocid={`contract_detail.versions.item.${idx + 1}`}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-4 py-3 text-slate-700 font-medium">
                              v{arr.length - idx}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {file.name.replace(`contract-${contractId}-`, "")}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs">
                              {fmtDate(Number(file.uploadedAt))}
                            </td>
                            <td className="px-4 py-3">
                              {idx === 0 && (
                                <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                                  <CheckCircle2 className="w-3 h-3" /> Active
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Comment Threads */}
              <div className="mt-5 bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Negotiation Comments
                    </h3>
                    <span className="text-xs text-slate-400">
                      ({contractComments.filter((c) => !c.resolved).length}{" "}
                      open)
                    </span>
                  </div>
                  <button
                    data-ocid="contract_detail.show_resolved.toggle"
                    type="button"
                    onClick={() => setShowResolved((p) => !p)}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    {showResolved ? "Hide resolved" : "Show resolved"}
                  </button>
                </div>

                <div className="divide-y divide-slate-50">
                  {contractComments.filter((c) => showResolved || !c.resolved)
                    .length === 0 && (
                    <div
                      data-ocid="contract_detail.comments.empty_state"
                      className="px-5 py-8 text-center text-slate-400 text-sm"
                    >
                      No comments yet. Start the negotiation thread below.
                    </div>
                  )}
                  {contractComments
                    .filter((c) => showResolved || !c.resolved)
                    .map((comment, idx) => (
                      <div
                        key={comment.id}
                        data-ocid={`contract_detail.comments.item.${idx + 1}`}
                        className={`px-5 py-4 ${comment.resolved ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs font-semibold text-slate-700">
                                {comment.author}
                              </span>
                              {comment.versionRef && (
                                <span className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                  {comment.versionRef}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400">
                                {(() => {
                                  const diff = Date.now() - comment.timestamp;
                                  const mins = Math.floor(diff / 60000);
                                  if (mins < 1) return "just now";
                                  if (mins < 60) return `${mins}m ago`;
                                  const hrs = Math.floor(mins / 60);
                                  if (hrs < 24) return `${hrs}h ago`;
                                  return `${Math.floor(hrs / 24)}d ago`;
                                })()}
                              </span>
                              {comment.resolved && (
                                <span className="text-[11px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">
                                  Resolved
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {comment.body}
                            </p>
                          </div>
                          {!comment.resolved && (
                            <button
                              data-ocid={`contract_detail.comments.resolve_button.${idx + 1}`}
                              type="button"
                              onClick={() => resolveComment(comment.id)}
                              className="shrink-0 text-xs text-slate-400 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 px-2 py-1 rounded transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Add comment */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                  <Textarea
                    data-ocid="contract_detail.add_comment.textarea"
                    placeholder="Add a negotiation comment..."
                    className="text-sm resize-none h-20 border-slate-200 bg-white"
                    value={commentBodies.commentNew ?? ""}
                    onChange={(e) =>
                      setCommentBodies((p) => ({
                        ...p,
                        commentNew: e.target.value,
                      }))
                    }
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      data-ocid="contract_detail.add_comment.button"
                      size="sm"
                      disabled={!commentBodies.commentNew?.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => {
                        const body = commentBodies.commentNew?.trim();
                        if (!body) return;
                        const newComment: ContractComment = {
                          id: nextCommentId.current++,
                          contractId,
                          author: "You",
                          body,
                          timestamp: Date.now(),
                          resolved: false,
                        };
                        addComment(newComment);
                        setCommentBodies((p) => ({ ...p, commentNew: "" }));
                      }}
                    >
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Clauses */}
          <TabsContent value="clauses" className="p-6 mt-0">
            <div className="max-w-3xl">
              {localClauses.length === 0 ? (
                <div
                  data-ocid="contract_detail.clauses_list"
                  className="bg-white rounded-lg border border-slate-200 p-12 text-center"
                >
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm text-slate-400">
                    No clauses found for this contract.
                  </p>
                </div>
              ) : (
                <div
                  data-ocid="contract_detail.clauses_list"
                  className="space-y-2"
                >
                  {localClauses.map((clause, idx) => {
                    const isExpanded = expandedClauses.has(clause.id);
                    return (
                      <div
                        key={clause.id}
                        data-ocid={`contract_detail.clauses.item.${idx + 1}`}
                        className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                CLAUSE_TYPE_COLORS[clause.clauseType] ??
                                "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              {clause.clauseType}
                            </span>
                            <span className="text-sm font-medium text-slate-800">
                              {clause.title}
                            </span>
                            {clause.isAiExtracted && (
                              <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded-full font-medium">
                                AI
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <RiskBadge risk={clause.riskLevel} />
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedClauses((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(clause.id)) {
                                    next.delete(clause.id);
                                  } else {
                                    next.add(clause.id);
                                  }
                                  return next;
                                })
                              }
                              className="p-1 text-slate-400 hover:text-slate-600"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div
                          className={`overflow-hidden ${
                            isExpanded ? "max-h-96" : "max-h-12"
                          }`}
                        >
                          <p
                            className={`px-4 pb-3 text-sm text-slate-600 leading-relaxed ${
                              !isExpanded ? "line-clamp-2" : ""
                            }`}
                          >
                            {clause.body}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Obligations */}
          <TabsContent value="obligations" className="p-6 mt-0">
            <div className="max-w-4xl">
              {contractObligations.length === 0 ? (
                <div
                  data-ocid="contract_detail.obligations_table"
                  className="bg-white rounded-lg border border-slate-200 p-12 text-center"
                >
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm text-slate-400">
                    No obligations for this contract.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <table
                    data-ocid="contract_detail.obligations_table"
                    className="w-full text-sm"
                  >
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Title
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Assignee
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Due Date
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Priority
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contractObligations.map((ob, idx) => {
                        const currentStatus =
                          obligationStatuses[ob.id] ?? ob.status;
                        const overdue = isOverdue(ob.dueDate, currentStatus);
                        return (
                          <tr
                            key={ob.id}
                            data-ocid={`contract_detail.obligations.item.${idx + 1}`}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800">
                                {ob.title}
                              </div>
                              {overdue && (
                                <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block">
                                  Overdue
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {ob.assignedTo}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm ${
                                overdue
                                  ? "text-red-600 font-medium"
                                  : "text-slate-600"
                              }`}
                            >
                              {fmtDate(ob.dueDate)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                  PRIORITY_COLORS[ob.priority] ??
                                  "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {PRIORITY_LABELS[ob.priority] ?? ob.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Select
                                value={currentStatus}
                                onValueChange={(val) => {
                                  const newStatus = val as ObligationStatus;
                                  setObligationStatuses((prev) => ({
                                    ...prev,
                                    [ob.id]: newStatus,
                                  }));
                                  obligationMutation.mutate({
                                    ob,
                                    newStatus,
                                  });
                                }}
                              >
                                <SelectTrigger
                                  data-ocid={`contract_detail.obligation_status.select.${idx + 1}`}
                                  className="h-7 w-32 text-xs"
                                >
                                  <SelectValue>
                                    {STATUS_LABELS[currentStatus] ??
                                      currentStatus}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(STATUS_LABELS).map(
                                    ([k, v]) => (
                                      <SelectItem
                                        key={k}
                                        value={k}
                                        className="text-xs"
                                      >
                                        {v}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Signatures */}
          <TabsContent value="signatures" className="p-6 mt-0">
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Signers
                </h3>
                <Dialog
                  open={signerDialogOpen}
                  onOpenChange={setSignerDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      data-ocid="contract_detail.send_signature_button"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      Send for Signature
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    data-ocid="contract_detail.signature_dialog"
                    className="sm:max-w-md"
                  >
                    <DialogHeader>
                      <DialogTitle>Send for Signature</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div>
                        <Label
                          htmlFor="signer-name"
                          className="text-sm font-medium text-slate-700 mb-1.5 block"
                        >
                          Signer Name
                        </Label>
                        <Input
                          id="signer-name"
                          data-ocid="contract_detail.signer_name_input"
                          placeholder="Full name"
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="signer-email"
                          className="text-sm font-medium text-slate-700 mb-1.5 block"
                        >
                          Signer Email
                        </Label>
                        <Input
                          id="signer-email"
                          type="email"
                          data-ocid="contract_detail.signer_email_input"
                          placeholder="email@company.com"
                          value={signerEmail}
                          onChange={(e) => setSignerEmail(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        data-ocid="contract_detail.signature_cancel_button"
                        onClick={() => setSignerDialogOpen(false)}
                        className="text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        data-ocid="contract_detail.signature_submit_button"
                        onClick={handleAddSigner}
                        disabled={!signerName.trim() || !signerEmail.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                      >
                        Send Request
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {signers.length === 0 ? (
                <div
                  data-ocid="contract_detail.signatures_empty_state"
                  className="bg-white rounded-lg border border-slate-200 p-12 text-center"
                >
                  <PenLine className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm text-slate-400">
                    No signature requests sent yet.
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Use &ldquo;Send for Signature&rdquo; to request signatures
                    from counterparties.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Name
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Email
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {signers.map((signer, idx) => (
                        <tr
                          key={signer.id}
                          data-ocid={`contract_detail.signatures.item.${idx + 1}`}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 text-slate-800 font-medium">
                            {signer.name}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {signer.email}
                          </td>
                          <td className="px-4 py-3">
                            <SignerStatusBadge status={signer.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
