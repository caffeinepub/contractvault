import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { RiskBadge, StatusBadge } from "../components/Badges";
import { ObligationStatusBadge } from "../components/Badges";
import {
  clauses,
  contracts,
  counterparties,
  getContractById,
  getCounterpartyById,
  obligations,
} from "../data/seed";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim())
      return {
        contracts: [],
        counterparties: [],
        clauses: [],
        obligations: [],
      };
    const q = query.toLowerCase();
    return {
      contracts: contracts.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.contractType.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          getCounterpartyById(c.counterpartyId)?.name.toLowerCase().includes(q),
      ),
      counterparties: counterparties.filter(
        (cp) =>
          cp.name.toLowerCase().includes(q) ||
          cp.contactName.toLowerCase().includes(q) ||
          cp.email.toLowerCase().includes(q) ||
          cp.country.toLowerCase().includes(q),
      ),
      clauses: clauses.filter(
        (cl) =>
          cl.title.toLowerCase().includes(q) ||
          cl.body.toLowerCase().includes(q) ||
          cl.clauseType.toLowerCase().includes(q),
      ),
      obligations: obligations.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.assignedTo.toLowerCase().includes(q),
      ),
    };
  }, [query]);

  const totalResults =
    results.contracts.length +
    results.counterparties.length +
    results.clauses.length +
    results.obligations.length;

  return (
    <div className="p-4 md:p-5">
      <div className="mb-5">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            data-ocid="search.search_input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contracts, clauses, obligations, counterparties…"
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>
        {query && (
          <p className="text-sm text-slate-400 mt-2">
            {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;
            {query}&rdquo;
          </p>
        )}
      </div>

      {!query && (
        <div
          data-ocid="search.empty_state"
          className="text-center py-16 text-slate-400"
        >
          <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            Search across contracts, clauses, obligations, and counterparties
          </p>
        </div>
      )}

      {query && totalResults === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm">No results for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {results.contracts.length > 0 && (
        <div className="mb-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Contracts ({results.contracts.length})
          </div>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            {results.contracts.map((c, i) => {
              const cp = getCounterpartyById(c.counterpartyId);
              return (
                <Link
                  key={c.id}
                  to="/contracts/$contractId"
                  params={{ contractId: c.id }}
                  data-ocid={`search.contract_result.${i + 1}`}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">
                      {c.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      {cp?.name} &middot; {c.department} &middot;{" "}
                      {c.contractType}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <StatusBadge status={c.status} />
                    <RiskBadge risk={c.riskLevel} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {results.clauses.length > 0 && (
        <div className="mb-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Clauses ({results.clauses.length})
          </div>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            {results.clauses.map((cl, i) => {
              const contract = getContractById(cl.contractId);
              return (
                <Link
                  key={cl.id}
                  to="/contracts/$contractId"
                  params={{ contractId: cl.contractId }}
                  data-ocid={`search.clause_result.${i + 1}`}
                  className="flex items-start gap-3 px-4 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">
                      {cl.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      {contract?.title} &middot; {cl.clauseType}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {cl.body}
                    </div>
                  </div>
                  <RiskBadge risk={cl.riskLevel} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {results.obligations.length > 0 && (
        <div className="mb-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Obligations ({results.obligations.length})
          </div>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            {results.obligations.map((o, i) => {
              const contract = getContractById(o.contractId);
              return (
                <Link
                  key={o.id}
                  to="/contracts/$contractId"
                  params={{ contractId: o.contractId }}
                  data-ocid={`search.obligation_result.${i + 1}`}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">
                      {o.title}
                    </div>
                    <div className="text-xs text-slate-400">
                      {contract?.title} &middot; {o.assignedTo} &middot; Due{" "}
                      {new Date(o.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <ObligationStatusBadge status={o.status} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {results.counterparties.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Counterparties ({results.counterparties.length})
          </div>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            {results.counterparties.map((cp, i) => (
              <div
                key={cp.id}
                data-ocid={`search.counterparty_result.${i + 1}`}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800">
                    {cp.name}
                  </div>
                  <div className="text-xs text-slate-400 capitalize">
                    {cp.counterpartyType} &middot; {cp.country} &middot;{" "}
                    {cp.contactName}
                  </div>
                </div>
                <RiskBadge risk={cp.riskLevel} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
