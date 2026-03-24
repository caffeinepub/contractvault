export default function Settings() {
  const ROLE_PERMISSIONS = [
    {
      role: "Legal Admin",
      read: true,
      write: true,
      approve: false,
      admin: false,
    },
    {
      role: "Procurement Manager",
      read: true,
      write: true,
      approve: false,
      admin: false,
    },
    {
      role: "Department Owner",
      read: true,
      write: false,
      approve: false,
      admin: false,
    },
    {
      role: "Finance Reviewer",
      read: true,
      write: false,
      approve: true,
      admin: false,
    },
    {
      role: "Executive Approver",
      read: true,
      write: false,
      approve: true,
      admin: false,
    },
    {
      role: "Compliance Officer",
      read: true,
      write: true,
      approve: false,
      admin: false,
    },
    {
      role: "Read-Only Stakeholder",
      read: true,
      write: false,
      approve: false,
      admin: false,
    },
    {
      role: "System Administrator",
      read: true,
      write: true,
      approve: true,
      admin: true,
    },
  ];

  const ORG_FIELDS = [
    { label: "Organization Name", id: "org-name", value: "Acme Corp" },
    { label: "Default Currency", id: "org-currency", value: "USD" },
    { label: "Timezone", id: "org-timezone", value: "UTC-5 (Eastern Time)" },
    { label: "Fiscal Year Start", id: "org-fiscal", value: "January" },
    { label: "Contract ID Prefix", id: "org-prefix", value: "ACM" },
  ];

  const PERM_KEYS = ["read", "write", "approve", "admin"] as const;

  return (
    <div className="p-5 space-y-5">
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">
          Organization
        </div>
        <div className="space-y-3">
          {ORG_FIELDS.map(({ label, id, value }) => (
            <div key={id} className="flex items-center gap-4">
              <label htmlFor={id} className="text-sm text-slate-500 w-40">
                {label}
              </label>
              <input
                id={id}
                readOnly
                value={value}
                className="text-sm border border-slate-200 rounded px-2 py-1.5 text-slate-800 bg-slate-50 w-48"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">
          Role Permissions
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Role
              </th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Read
              </th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Write
              </th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Approve
              </th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Admin
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ROLE_PERMISSIONS.map((rp) => (
              <tr key={rp.role}>
                <td className="px-3 py-2.5 font-medium text-slate-700">
                  {rp.role}
                </td>
                {PERM_KEYS.map((key) => (
                  <td key={key} className="px-3 py-2.5 text-center">
                    {rp[key] ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-100 rounded-full text-emerald-700 text-xs">
                        ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-100 rounded-full text-slate-400 text-xs">
                        –
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
