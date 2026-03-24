import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { approvalWorkflows, getContractById } from "../data/seed";
import type {
  ApprovalWorkflowStatus,
  SeedApprovalStep,
  SeedApprovalWorkflow,
} from "../data/seed";

const STATUS_CONFIG: Record<
  ApprovalWorkflowStatus,
  { label: string; classes: string }
> = {
  pending: { label: "Pending", classes: "bg-slate-100 text-slate-600" },
  inProgress: { label: "In Progress", classes: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", classes: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", classes: "bg-red-100 text-red-700" },
};

function WorkflowStatusBadge({ status }: { status: ApprovalWorkflowStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        cfg.classes,
      )}
    >
      {cfg.label}
    </span>
  );
}

function StepIcon({ status }: { status: SeedApprovalStep["status"] }) {
  if (status === "approved")
    return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  if (status === "rejected")
    return <XCircle className="w-4 h-4 text-red-500" />;
  if (status === "skipped")
    return (
      <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-slate-100" />
    );
  return <Clock className="w-4 h-4 text-slate-400" />;
}

function WorkflowCard({ workflow: wf }: { workflow: SeedApprovalWorkflow }) {
  const contract = getContractById(wf.contractId);
  const [expanded, setExpanded] = useState(false);
  const [steps, setSteps] = useState(wf.steps);

  const _activeStep = steps.find(
    (s) => s.stepNumber === wf.currentStep && s.status === "pending",
  );

  const handleApprove = (stepId: number) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, status: "approved" as const, completedAt: Date.now() }
          : s,
      ),
    );
  };

  const handleReject = (stepId: number) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, status: "rejected" as const, completedAt: Date.now() }
          : s,
      ),
    );
  };

  const progress = steps.filter(
    (s) =>
      s.status === "approved" ||
      s.status === "rejected" ||
      s.status === "skipped",
  ).length;

  return (
    <div
      data-ocid="approvals.workflow.card"
      className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden"
    >
      {/* Header */}
      <button
        type="button"
        data-ocid="approvals.workflow.toggle"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 focus:outline-none"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">
              {wf.name}
            </span>
            <WorkflowStatusBadge status={wf.status} />
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            {contract && (
              <>
                <span>{contract.title}</span>
                <span>&middot;</span>
              </>
            )}
            <span>
              Step {Math.min(progress + 1, steps.length)} of {steps.length}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${(progress / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-400">
            {progress}/{steps.length}
          </span>
        </div>
        {contract && (
          <Link
            to="/contracts/$contractId"
            params={{ contractId: wf.contractId }}
            data-ocid="approvals.workflow.contract_link"
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            Contract
          </Link>
        )}
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {/* Steps panel */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          {steps.map((step, i) => {
            const isCurrent =
              step.stepNumber === wf.currentStep && step.status === "pending";
            return (
              <div
                key={step.id}
                data-ocid={`approvals.step.${i + 1}`}
                className={cn(
                  "flex items-start gap-3 rounded-md px-3 py-2.5",
                  isCurrent
                    ? "bg-indigo-50 border border-indigo-200"
                    : "bg-slate-50",
                )}
              >
                <div className="pt-0.5">
                  <StepIcon status={step.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Step {step.stepNumber}
                    </span>
                    <span className="text-sm font-medium text-slate-800">
                      {step.role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {step.assignee}
                  </div>
                  {step.comment && (
                    <div className="text-xs text-slate-600 mt-1 italic">
                      &ldquo;{step.comment}&rdquo;
                    </div>
                  )}
                  {step.completedAt && (
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(step.completedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  )}
                  {isCurrent && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        data-ocid={`approvals.step.approve_button.${i + 1}`}
                        onClick={() => handleApprove(step.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-md hover:bg-emerald-700"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Approve
                      </button>
                      <button
                        type="button"
                        data-ocid={`approvals.step.reject_button.${i + 1}`}
                        onClick={() => handleReject(step.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700"
                      >
                        <XCircle className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const FILTER_OPTIONS: {
  value: ApprovalWorkflowStatus | "all";
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "inProgress", label: "In Progress" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function Approvals() {
  const [filter, setFilter] = useState<ApprovalWorkflowStatus | "all">("all");

  const filtered = approvalWorkflows.filter(
    (wf) => filter === "all" || wf.status === filter,
  );

  return (
    <div className="px-4 md:px-5 py-4 md:py-5">
      {/* Filter tabs */}
      <div
        data-ocid="approvals.filter.tab"
        className="flex items-center gap-1 mb-4 bg-white border border-slate-200 rounded-lg p-1 w-fit shadow-xs"
      >
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            data-ocid={`approvals.filter.${opt.value}_tab`}
            onClick={() =>
              setFilter(opt.value as ApprovalWorkflowStatus | "all")
            }
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md",
              filter === opt.value
                ? "bg-indigo-600 text-white"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((wf) => (
          <WorkflowCard key={wf.id} workflow={wf} />
        ))}
        {filtered.length === 0 && (
          <div
            data-ocid="approvals.empty_state"
            className="bg-white border border-slate-200 rounded-lg px-4 py-12 text-center text-slate-400 text-sm"
          >
            No approval workflows match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
