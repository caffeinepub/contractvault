import { Download, Printer } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ObligationStatusBadge,
  RiskBadge,
  StatusBadge,
} from "../components/Badges";
import { contracts, counterparties, obligations } from "../data/seed";

function countBy<T>(
  items: T[],
  key: (item: T) => string,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    result[k] = (result[k] ?? 0) + 1;
  }
  return result;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const RISK_WEIGHTS: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

// Last 12 calendar months
function getLast12Months() {
  const months: { label: string; year: number; month: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return months;
}

export default function Reports() {
  const byStatus = countBy(contracts, (c) => c.status);
  const byRisk = countBy(contracts, (c) => c.riskLevel);
  const byObligationStatus = countBy(obligations, (o) => o.status);
  const byObligationPriority = countBy(obligations, (o) => o.priority);

  const totalValue = contracts.reduce((sum, c) => sum + c.value, 0);

  // Per-department contract value
  const deptValueMap: Record<string, number> = {};
  for (const c of contracts) {
    deptValueMap[c.department] = (deptValueMap[c.department] ?? 0) + c.value;
  }
  const deptValueData = Object.entries(deptValueMap)
    .map(([dept, value]) => ({ dept, value }))
    .sort((a, b) => b.value - a.value);

  // === Contract Value Trend (last 12 months) ===
  const last12 = getLast12Months();
  const monthlyValueData = last12.map(({ label, year, month }) => {
    const value = contracts
      .filter((c) => {
        const d = new Date(c.startDate);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, c) => sum + c.value, 0);
    return { label, value };
  });

  // === Obligation Completion Rate ===
  const oblCompleted = obligations.filter(
    (o) => o.status === "completed",
  ).length;
  const oblInProgress = obligations.filter(
    (o) => o.status === "inProgress",
  ).length;
  const oblOverdue = obligations.filter((o) => o.status === "overdue").length;
  const oblPending = obligations.filter((o) => o.status === "pending").length;
  const oblTotal = obligations.length;

  // === Counterparty Risk Scoring ===
  const cpRiskRows = counterparties
    .map((cp) => {
      const cpContracts = contracts.filter((c) => c.counterpartyId === cp.id);
      const activeContracts = cpContracts.filter(
        (c) => c.status === "active" || c.status === "underReview",
      ).length;
      const cpContractIds = new Set(cpContracts.map((c) => c.id));
      const overdueObligations = obligations.filter(
        (o) => cpContractIds.has(o.contractId) && o.status === "overdue",
      ).length;
      const riskValues = cpContracts.map((c) => RISK_WEIGHTS[c.riskLevel] ?? 1);
      const avgRisk =
        riskValues.length > 0
          ? riskValues.reduce((a, b) => a + b, 0) / riskValues.length
          : 1;
      const riskScore =
        overdueObligations * 2 + avgRisk * 1.5 + activeContracts * 0.5;

      let riskLabel: string;
      let riskColor: string;
      if (riskScore < 3) {
        riskLabel = "Low";
        riskColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
      } else if (riskScore <= 6) {
        riskLabel = "Medium";
        riskColor = "bg-amber-50 text-amber-700 border-amber-200";
      } else {
        riskLabel = "High";
        riskColor = "bg-red-50 text-red-700 border-red-200";
      }

      return {
        id: cp.id,
        name: cp.name,
        industry: cp.counterpartyType,
        activeContracts,
        overdueObligations,
        riskScore: Math.round(riskScore * 10) / 10,
        riskLabel,
        riskColor,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const handleExportCSV = () => {
    const rows = [
      [
        "ID",
        "Title",
        "Status",
        "Risk",
        "Counterparty",
        "Value",
        "Currency",
        "End Date",
        "Department",
      ],
      ...contracts.map((c) => [
        c.id,
        c.title,
        c.status,
        c.riskLevel,
        c.counterpartyId,
        c.value.toString(),
        c.currency,
        new Date(c.endDate).toISOString(),
        c.department,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contracts_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify({ contracts, obligations }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contractvault_export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-5 space-y-5">
      <div className="flex items-center justify-end">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            data-ocid="reports.print_pdf_button"
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
          <button
            type="button"
            data-ocid="reports.export_csv_button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            data-ocid="reports.export_json_button"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">
          Portfolio Overview
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-slate-400">Total Contracts</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {contracts.length}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Total Portfolio Value</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(totalValue)}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Total Obligations</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {obligations.length}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Overdue Obligations</div>
            <div className="text-2xl font-bold text-red-600 mt-0.5">
              {obligations.filter((o) => o.status === "overdue").length}
            </div>
          </div>
        </div>
      </div>

      {/* Status / Risk / Obligation Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">
            Contracts by Status
          </div>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(byStatus).map(([status, count]) => (
                <tr key={status} className="border-b border-slate-50">
                  <td className="py-1.5">
                    <StatusBadge status={status as never} />
                  </td>
                  <td className="py-1.5 text-right font-mono font-semibold text-slate-800">
                    {count}
                  </td>
                  <td className="py-1.5 text-right text-slate-400 pl-2">
                    {Math.round((count / contracts.length) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">
            Contracts by Risk Level
          </div>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(byRisk).map(([risk, count]) => (
                <tr key={risk} className="border-b border-slate-50">
                  <td className="py-1.5">
                    <RiskBadge risk={risk as never} />
                  </td>
                  <td className="py-1.5 text-right font-mono font-semibold text-slate-800">
                    {count}
                  </td>
                  <td className="py-1.5 text-right text-slate-400 pl-2">
                    {Math.round((count / contracts.length) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">
            Obligations by Status
          </div>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(byObligationStatus).map(([status, count]) => (
                <tr key={status} className="border-b border-slate-50">
                  <td className="py-1.5">
                    <ObligationStatusBadge status={status as never} />
                  </td>
                  <td className="py-1.5 text-right font-mono font-semibold text-slate-800">
                    {count}
                  </td>
                  <td className="py-1.5 text-right text-slate-400 pl-2">
                    {Math.round((count / obligations.length) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Obligations by Priority + Dept Value Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">
            Obligations by Priority
          </div>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(byObligationPriority).map(([priority, count]) => (
                <tr key={priority} className="border-b border-slate-50">
                  <td className="py-1.5">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium"
                      style={{ color: PRIORITY_COLORS[priority] ?? "#94a3b8" }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: PRIORITY_COLORS[priority] ?? "#94a3b8",
                        }}
                      />
                      {PRIORITY_LABELS[priority] ?? priority}
                    </span>
                  </td>
                  <td className="py-1.5 text-right font-mono font-semibold text-slate-800">
                    {count}
                  </td>
                  <td className="py-1.5 text-right text-slate-400 pl-2">
                    {Math.round((count / obligations.length) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-700 mb-3">
            Contract Value by Department
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={deptValueData}
              layout="vertical"
              margin={{ top: 0, right: 10, bottom: 0, left: 70 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) =>
                  new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    notation: "compact",
                    maximumFractionDigits: 0,
                  }).format(v)
                }
              />
              <YAxis
                type="category"
                dataKey="dept"
                tick={{ fontSize: 10 }}
                width={70}
              />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                formatter={(value: number) =>
                  new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(value)
                }
              />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {deptValueData.map((entry, i) => (
                  <Cell
                    key={entry.dept}
                    fill="#6366f1"
                    opacity={1 - i * 0.07}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* === NEW SECTION A: Contract Value Trend === */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">
          Contract Value Trend
          <span className="ml-2 text-xs font-normal text-slate-400">
            Last 12 months by start date
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={monthlyValueData}
            margin={{ top: 4, right: 10, bottom: 0, left: 60 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={60}
              tickFormatter={(v) =>
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  notation: "compact",
                  maximumFractionDigits: 0,
                }).format(v)
              }
            />
            <Tooltip
              contentStyle={{ fontSize: 12 }}
              formatter={(value: number) =>
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(value)
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#colorValue)"
              dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* === NEW SECTION B: Obligation Completion Rate === */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-700 mb-4">
          Obligation Completion Rate
        </div>
        {/* Segmented bar */}
        <div className="flex rounded-full overflow-hidden h-3 mb-4">
          {oblCompleted > 0 && (
            <div
              className="bg-emerald-500 h-full"
              style={{ width: `${(oblCompleted / oblTotal) * 100}%` }}
              title={`Completed: ${oblCompleted}`}
            />
          )}
          {oblInProgress > 0 && (
            <div
              className="bg-blue-500 h-full"
              style={{ width: `${(oblInProgress / oblTotal) * 100}%` }}
              title={`In Progress: ${oblInProgress}`}
            />
          )}
          {oblPending > 0 && (
            <div
              className="bg-slate-300 h-full"
              style={{ width: `${(oblPending / oblTotal) * 100}%` }}
              title={`Pending: ${oblPending}`}
            />
          )}
          {oblOverdue > 0 && (
            <div
              className="bg-red-500 h-full"
              style={{ width: `${(oblOverdue / oblTotal) * 100}%` }}
              title={`Overdue: ${oblOverdue}`}
            />
          )}
        </div>
        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Completed</div>
              <div className="text-lg font-bold text-slate-800 leading-tight">
                {oblCompleted}
              </div>
              <div className="text-xs text-slate-400">
                {oblTotal > 0 ? Math.round((oblCompleted / oblTotal) * 100) : 0}
                %
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-blue-500 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">In Progress</div>
              <div className="text-lg font-bold text-slate-800 leading-tight">
                {oblInProgress}
              </div>
              <div className="text-xs text-slate-400">
                {oblTotal > 0
                  ? Math.round((oblInProgress / oblTotal) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-slate-300 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Pending</div>
              <div className="text-lg font-bold text-slate-800 leading-tight">
                {oblPending}
              </div>
              <div className="text-xs text-slate-400">
                {oblTotal > 0 ? Math.round((oblPending / oblTotal) * 100) : 0}%
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-red-500 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Overdue</div>
              <div className="text-lg font-bold text-red-600 leading-tight">
                {oblOverdue}
              </div>
              <div className="text-xs text-slate-400">
                {oblTotal > 0 ? Math.round((oblOverdue / oblTotal) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === NEW SECTION C: Counterparty Risk Scoring === */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="text-sm font-semibold text-slate-700">
            Counterparty Risk Scoring
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Weighted score: overdue obligations × 2 + avg risk × 1.5 + active
            contracts × 0.5
          </div>
        </div>
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Counterparty
                </th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Type
                </th>
                <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Active Contracts
                </th>
                <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Overdue Obligations
                </th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Risk Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cpRiskRows.map((row, i) => (
                <tr
                  key={row.id}
                  data-ocid={`reports.cp_risk.row.${i + 1}`}
                  className="hover:bg-slate-50"
                >
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {row.name}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 capitalize text-xs">
                    {row.industry}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                    {row.activeContracts}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    <span
                      className={
                        row.overdueObligations > 0
                          ? "text-red-600 font-semibold"
                          : "text-slate-700"
                      }
                    >
                      {row.overdueObligations}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded border ${row.riskColor}`}
                    >
                      {row.riskLabel}
                      <span className="text-[10px] font-normal opacity-70">
                        ({row.riskScore})
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="block md:hidden divide-y divide-slate-100">
          {cpRiskRows.map((row, i) => (
            <div
              key={row.id}
              data-ocid={`reports.cp_risk.item.${i + 1}`}
              className="px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {row.name}
                  </div>
                  <div className="text-xs text-slate-500 capitalize mt-0.5">
                    {row.industry}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border ${row.riskColor}`}
                >
                  {row.riskLabel}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                <span>
                  Active: <strong>{row.activeContracts}</strong>
                </span>
                <span
                  className={row.overdueObligations > 0 ? "text-red-600" : ""}
                >
                  Overdue: <strong>{row.overdueObligations}</strong>
                </span>
                <span>
                  Score: <strong>{row.riskScore}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
