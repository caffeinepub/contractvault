import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileText,
  Plus,
  Shield,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  contracts,
  getCounterpartyById,
  obligations,
  timelineEvents,
} from "../data/seed";

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  draft: "#94a3b8",
  expired: "#ef4444",
  terminated: "#71717a",
  underReview: "#f59e0b",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  draft: "Draft",
  expired: "Expired",
  terminated: "Terminated",
  underReview: "Under Review",
};

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000;
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
const NOW = Date.now();

const kpis = {
  total: contracts.length,
  expiring: contracts.filter(
    (c) =>
      c.endDate > NOW &&
      c.endDate - NOW <= THIRTY_DAYS &&
      c.status === "active",
  ).length,
  overdue: obligations.filter((o) => o.status === "overdue").length,
  highRisk: contracts.filter(
    (c) =>
      (c.riskLevel === "high" || c.riskLevel === "critical") &&
      c.status === "active",
  ).length,
};

const statusData = (() => {
  const counts: Record<string, number> = {};
  for (const c of contracts) {
    counts[c.status] = (counts[c.status] ?? 0) + 1;
  }
  return Object.entries(counts).map(([status, count]) => ({
    status: STATUS_LABELS[status] ?? status,
    count,
    color: STATUS_COLORS[status] ?? "#94a3b8",
  }));
})();

const recentEvents = [...timelineEvents]
  .sort((a, b) => b.timestamp - a.timestamp)
  .slice(0, 10);

const renewalContracts = contracts
  .filter(
    (c) =>
      c.endDate > NOW &&
      c.endDate - NOW <= NINETY_DAYS &&
      c.status === "active",
  )
  .sort((a, b) => a.endDate - b.endDate);

const tier1 = renewalContracts.filter((c) => c.endDate - NOW <= THIRTY_DAYS);
const tier2 = renewalContracts.filter(
  (c) => c.endDate - NOW > THIRTY_DAYS && c.endDate - NOW <= SIXTY_DAYS,
);
const tier3 = renewalContracts.filter((c) => c.endDate - NOW > SIXTY_DAYS);

export default function Dashboard() {
  return (
    <div className="px-4 md:px-5 py-4 md:py-5 space-y-4 md:space-y-5">
      {/* KPI cards: 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Contracts */}
        <div
          data-ocid="dashboard.total_contracts_card"
          className="bg-white border border-slate-200 rounded-lg p-4 border-l-[3px] border-l-indigo-500"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs md:text-sm text-slate-500 font-medium">
              Total Contracts
            </span>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-slate-900">
            {kpis.total}
          </div>
          <div className="text-xs text-slate-400 mt-1">across all statuses</div>
        </div>

        {/* Expiring */}
        <div
          data-ocid="dashboard.expiring_card"
          className="bg-white border border-slate-200 rounded-lg p-4 border-l-[3px] border-l-amber-500"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs md:text-sm text-amber-600 font-medium">
              Expiring Soon
            </span>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-amber-700">
            {kpis.expiring}
          </div>
          <div className="text-xs text-amber-500 mt-1">in 30 days</div>
        </div>

        {/* Overdue */}
        <div
          data-ocid="dashboard.overdue_obligations_card"
          className="bg-white border border-slate-200 rounded-lg p-4 border-l-[3px] border-l-red-500"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs md:text-sm text-red-600 font-medium">
              Overdue
            </span>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-red-700">
            {kpis.overdue}
          </div>
          <div className="text-xs text-red-400 mt-1">obligations</div>
        </div>

        {/* High Risk */}
        <div
          data-ocid="dashboard.high_risk_card"
          className="bg-white border border-slate-200 rounded-lg p-4 border-l-[3px] border-l-orange-500"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs md:text-sm text-orange-600 font-medium">
              High Risk
            </span>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-orange-50 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-500" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-orange-700">
            {kpis.highRisk}
          </div>
          <div className="text-xs text-orange-400 mt-1">active contracts</div>
        </div>
      </div>

      {/* Renewal Alerts */}
      {renewalContracts.length > 0 && (
        <div
          data-ocid="dashboard.renewal_alerts_card"
          className="bg-white border border-slate-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">
              Renewal Alerts
            </span>
            <Link
              to="/contracts"
              data-ocid="dashboard.renewal_alerts_view_all_link"
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 0-30 days */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                  Critical &mdash; 0-30 days
                </span>
              </div>
              {tier1.length === 0 ? (
                <div className="text-xs text-slate-400">None</div>
              ) : (
                <div className="space-y-1.5">
                  {tier1.map((c) => {
                    const cp = getCounterpartyById(c.counterpartyId);
                    const days = Math.ceil(
                      (c.endDate - NOW) / (1000 * 60 * 60 * 24),
                    );
                    return (
                      <Link
                        key={c.id}
                        to="/contracts/$contractId"
                        params={{ contractId: c.id }}
                        data-ocid="dashboard.renewal_alert_item.link"
                        className="flex items-center justify-between gap-2 hover:bg-red-50 rounded px-2 py-1"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">
                            {c.title}
                          </div>
                          <div className="text-xs text-slate-400">
                            {cp?.name}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-red-600 shrink-0">
                          {days}d
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            {/* 31-60 days */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                  Warning &mdash; 31-60 days
                </span>
              </div>
              {tier2.length === 0 ? (
                <div className="text-xs text-slate-400">None</div>
              ) : (
                <div className="space-y-1.5">
                  {tier2.map((c) => {
                    const cp = getCounterpartyById(c.counterpartyId);
                    const days = Math.ceil(
                      (c.endDate - NOW) / (1000 * 60 * 60 * 24),
                    );
                    return (
                      <Link
                        key={c.id}
                        to="/contracts/$contractId"
                        params={{ contractId: c.id }}
                        data-ocid="dashboard.renewal_alert_item.link"
                        className="flex items-center justify-between gap-2 hover:bg-amber-50 rounded px-2 py-1"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">
                            {c.title}
                          </div>
                          <div className="text-xs text-slate-400">
                            {cp?.name}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-amber-600 shrink-0">
                          {days}d
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            {/* 61-90 days */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">
                  Notice &mdash; 61-90 days
                </span>
              </div>
              {tier3.length === 0 ? (
                <div className="text-xs text-slate-400">None</div>
              ) : (
                <div className="space-y-1.5">
                  {tier3.map((c) => {
                    const cp = getCounterpartyById(c.counterpartyId);
                    const days = Math.ceil(
                      (c.endDate - NOW) / (1000 * 60 * 60 * 24),
                    );
                    return (
                      <Link
                        key={c.id}
                        to="/contracts/$contractId"
                        params={{ contractId: c.id }}
                        data-ocid="dashboard.renewal_alert_item.link"
                        className="flex items-center justify-between gap-2 hover:bg-yellow-50 rounded px-2 py-1"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">
                            {c.title}
                          </div>
                          <div className="text-xs text-slate-400">
                            {cp?.name}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-yellow-600 shrink-0">
                          {days}d
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Charts & actions: stack on mobile, 3-col on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 overflow-hidden min-w-0">
          <div className="text-sm font-semibold text-slate-700 mb-3">
            Contracts by Status
          </div>
          <div className="overflow-hidden min-w-0">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={statusData}
                margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
              >
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">
              Expiring Soon
            </span>
            <Link
              to="/contracts"
              data-ocid="dashboard.view_expiring_link"
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {renewalContracts.length === 0 && (
            <div className="text-sm text-slate-400 py-4 text-center">
              No contracts expiring within 90 days
            </div>
          )}
          <div className="space-y-2">
            {renewalContracts.slice(0, 5).map((c) => {
              const cp = getCounterpartyById(c.counterpartyId);
              const daysLeft = Math.ceil(
                (c.endDate - Date.now()) / (1000 * 60 * 60 * 24),
              );
              return (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {c.title}
                    </div>
                    <div className="text-xs text-slate-400">{cp?.name}</div>
                  </div>
                  <span
                    className={`text-sm font-semibold shrink-0 ${daysLeft <= 30 ? "text-red-600" : "text-amber-600"}`}
                  >
                    {daysLeft}d
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">
            Quick Actions
          </div>
          <div className="space-y-2">
            <Link
              to="/contracts"
              data-ocid="dashboard.new_contract_button"
              className="flex items-center gap-2 w-full text-left px-3 py-2.5 min-h-[44px] text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
            >
              <Plus className="w-3.5 h-3.5" />
              New Contract
            </Link>
            <Link
              to="/approvals"
              data-ocid="dashboard.view_approvals_link"
              className="flex items-center gap-2 w-full text-left px-3 py-2.5 min-h-[44px] text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
            >
              <Clock className="w-3.5 h-3.5" />
              Review Approvals
            </Link>
            <Link
              to="/obligations"
              data-ocid="dashboard.view_obligations_link"
              className="flex items-center gap-2 w-full text-left px-3 py-2.5 min-h-[44px] text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              View Overdue Obligations
            </Link>
            <Link
              to="/reports"
              data-ocid="dashboard.reports_link"
              className="flex items-center gap-2 w-full text-left px-3 py-2.5 min-h-[44px] text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
            >
              <FileText className="w-3.5 h-3.5" />
              Generate Report
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">
          Recent Activity
        </div>
        <div className="divide-y divide-slate-100">
          {recentEvents.map((event) => (
            <div key={event.id} className="py-2.5 flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-sm text-slate-800">
                  {event.description}
                </span>
                <span className="text-sm text-slate-400 ml-2">
                  by {event.actor}
                </span>
              </div>
              <span className="text-xs text-slate-400 shrink-0">
                {new Date(event.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
