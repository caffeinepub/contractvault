import type React from "react";
import { createContext, useContext, useState } from "react";
import {
  type ContractTemplate,
  type SeedContract,
  type SeedCounterparty,
  contracts as seedContractData,
  counterparties as seedCounterparties,
  contractTemplates as seedTemplates,
} from "../data/seed";

export type { ContractTemplate };

// Aliases for mutable local versions
export type LocalContract = SeedContract;
export type LocalCounterparty = SeedCounterparty;

export type Notification = {
  id: string;
  eventType: string;
  description: string;
  actor: string;
  timestamp: number;
  read: boolean;
  contractId?: string;
};

export type ContractComment = {
  id: number;
  contractId: string;
  versionRef?: string;
  author: string;
  body: string;
  timestamp: number;
  resolved: boolean;
};

export type ManagedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: "active" | "suspended";
  invitedAt: number;
  joinedAt: number | null;
};

type LocalStoreCtx = {
  contracts: (SeedContract | LocalContract)[];
  addContract: (c: LocalContract) => void;
  updateContract: (c: LocalContract | SeedContract) => void;
  updateContracts: (ids: string[], patch: Partial<SeedContract>) => void;
  deleteContracts: (ids: string[]) => void;
  counterparties: LocalCounterparty[];
  addCounterparty: (cp: LocalCounterparty) => void;
  updateCounterparty: (cp: LocalCounterparty) => void;
  templates: ContractTemplate[];
  addTemplate: (t: ContractTemplate) => void;
  updateTemplate: (t: ContractTemplate) => void;
  deleteTemplate: (id: string) => void;
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  comments: ContractComment[];
  addComment: (c: ContractComment) => void;
  resolveComment: (id: number) => void;
  deleteComment: (id: number) => void;
  managedUsers: ManagedUser[];
  inviteUser: (u: ManagedUser) => void;
  updateUserRole: (id: string, role: string) => void;
  updateUserStatus: (id: string, status: "active" | "suspended") => void;
  deleteManagedUser: (id: string) => void;
};

const LocalStoreContext = createContext<LocalStoreCtx | null>(null);

const SEED_TEMPLATE_IDS = new Set(seedTemplates.map((t) => t.id));

const SEED_COMMENTS: ContractComment[] = [
  {
    id: 1,
    contractId: "c1",
    versionRef: "v1",
    author: "Alice Johnson",
    body: "The limitation of liability cap in Section 8 seems too low given the contract value. Recommend raising to 2x annual fees.",
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    resolved: false,
  },
  {
    id: 2,
    contractId: "c1",
    versionRef: "v1",
    author: "Bob Martinez",
    body: "Agreed. Also flagging the auto-renewal clause in Section 12 — it needs a 60-day notice window, not 30.",
    timestamp: Date.now() - 1000 * 60 * 60 * 36,
    resolved: false,
  },
  {
    id: 3,
    contractId: "c2",
    versionRef: "v1",
    author: "Carol Wu",
    body: "Payment terms in Section 4 updated to Net-45 as agreed in the last negotiation call. Please confirm.",
    timestamp: Date.now() - 1000 * 60 * 60 * 12,
    resolved: true,
  },
  {
    id: 4,
    contractId: "c2",
    author: "David Kim",
    body: "Approved the updated indemnification language. Ready for legal sign-off.",
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    resolved: false,
  },
];

const SEED_USERS: ManagedUser[] = [
  {
    id: "u1",
    email: "alice@acme.com",
    name: "Alice Johnson",
    role: "Legal Admin",
    status: "active",
    invitedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 28,
  },
  {
    id: "u2",
    email: "bob@acme.com",
    name: "Bob Martinez",
    role: "Procurement Manager",
    status: "active",
    invitedAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
  },
  {
    id: "u3",
    email: "carol@acme.com",
    name: "Carol Wu",
    role: "Finance Reviewer",
    status: "suspended",
    invitedAt: Date.now() - 1000 * 60 * 60 * 24 * 15,
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
  },
  {
    id: "u4",
    email: "david@acme.com",
    name: "David Kim",
    role: "Executive Approver",
    status: "active",
    invitedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    joinedAt: null,
  },
  {
    id: "u5",
    email: "eva@acme.com",
    name: "Eva Rossi",
    role: "Compliance Officer",
    status: "active",
    invitedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    joinedAt: null,
  },
];

export function LocalStoreProvider({
  children,
}: { children: React.ReactNode }) {
  const [userContracts, setUserContracts] = useState<LocalContract[]>([]);
  const [updatedContracts, setUpdatedContracts] = useState<
    Record<string, Partial<SeedContract>>
  >({});
  const [deletedContractIds, setDeletedContractIds] = useState<Set<string>>(
    new Set(),
  );

  const [userCounterparties, setUserCounterparties] = useState<
    LocalCounterparty[]
  >([]);
  const [updatedCounterparties, setUpdatedCounterparties] = useState<
    Record<string, LocalCounterparty>
  >({});

  const [userTemplates, setUserTemplates] = useState<ContractTemplate[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>(() => [
    {
      id: "n1",
      eventType: "signature_requested",
      description: "Microsoft SaaS Agreement sent to Sarah Chen for signature.",
      actor: "System",
      timestamp: Date.now() - 1000 * 60 * 30,
      read: false,
      contractId: "c2",
    },
    {
      id: "n2",
      eventType: "status_changed",
      description: "TechStartup Partnership Agreement expires in 12 days.",
      actor: "System",
      timestamp: Date.now() - 1000 * 60 * 60 * 2,
      read: false,
      contractId: "c3",
    },
    {
      id: "n3",
      eventType: "approval_requested",
      description: "Data Processing Agreement is awaiting your approval.",
      actor: "Compliance Officer",
      timestamp: Date.now() - 1000 * 60 * 60 * 5,
      read: false,
      contractId: "c6",
    },
    {
      id: "n4",
      eventType: "obligation_created",
      description: "Quarterly SLA Review is overdue on the Accenture MSA.",
      actor: "System",
      timestamp: Date.now() - 1000 * 60 * 60 * 24,
      read: true,
      contractId: "c1",
    },
    {
      id: "n5",
      eventType: "status_changed",
      description: "Insurance Policy Renewal has been moved to Active status.",
      actor: "Finance Reviewer",
      timestamp: Date.now() - 1000 * 60 * 60 * 48,
      read: true,
      contractId: "c9",
    },
  ]);

  const [comments, setComments] = useState<ContractComment[]>(SEED_COMMENTS);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>(SEED_USERS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Merge seed contracts with user contracts and patches
  const baseSeedContracts = seedContractData
    .filter((c) => !deletedContractIds.has(c.id))
    .map((c) =>
      updatedContracts[c.id] ? { ...c, ...updatedContracts[c.id] } : c,
    );
  const contracts: (SeedContract | LocalContract)[] = [
    ...baseSeedContracts,
    ...userContracts.filter((c) => !deletedContractIds.has(c.id)),
  ];

  // Merge counterparties
  const baseSeedCounterparties = seedCounterparties.map((cp) =>
    updatedCounterparties[cp.id]
      ? { ...cp, ...updatedCounterparties[cp.id] }
      : cp,
  );
  const counterparties: LocalCounterparty[] = [
    ...baseSeedCounterparties,
    ...userCounterparties.filter(
      (cp) => !baseSeedCounterparties.find((s) => s.id === cp.id),
    ),
  ];

  // Merge templates: seed templates first, then user templates
  const templates: ContractTemplate[] = [
    ...seedTemplates.map((t) => ({ ...t, isSeed: true })),
    ...userTemplates,
  ];

  function addContract(c: LocalContract) {
    setUserContracts((prev) => [c, ...prev]);
  }

  function updateContract(c: LocalContract | SeedContract) {
    const isSeed = seedContractData.find((s) => s.id === c.id);
    if (isSeed) {
      setUpdatedContracts((prev) => ({ ...prev, [c.id]: c }));
    } else {
      setUserContracts((prev) =>
        prev.map((existing) =>
          existing.id === c.id ? (c as LocalContract) : existing,
        ),
      );
    }
  }

  function updateContracts(ids: string[], patch: Partial<SeedContract>) {
    for (const id of ids) {
      const isSeed = seedContractData.find((s) => s.id === id);
      if (isSeed) {
        setUpdatedContracts((prev) => ({
          ...prev,
          [id]: { ...(prev[id] ?? {}), ...patch },
        }));
      } else {
        setUserContracts((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        );
      }
    }
  }

  function deleteContracts(ids: string[]) {
    setDeletedContractIds((prev) => new Set([...prev, ...ids]));
    setUserContracts((prev) => prev.filter((c) => !ids.includes(c.id)));
  }

  function addCounterparty(cp: LocalCounterparty) {
    setUserCounterparties((prev) => [cp, ...prev]);
  }

  function updateCounterparty(cp: LocalCounterparty) {
    const isSeed = seedCounterparties.find((s) => s.id === cp.id);
    if (isSeed) {
      setUpdatedCounterparties((prev) => ({ ...prev, [cp.id]: cp }));
    } else {
      setUserCounterparties((prev) =>
        prev.map((existing) => (existing.id === cp.id ? cp : existing)),
      );
    }
  }

  function addTemplate(t: ContractTemplate) {
    setUserTemplates((prev) => [t, ...prev]);
  }

  function updateTemplate(t: ContractTemplate) {
    if (SEED_TEMPLATE_IDS.has(t.id)) return;
    setUserTemplates((prev) =>
      prev.map((existing) => (existing.id === t.id ? t : existing)),
    );
  }

  function deleteTemplate(id: string) {
    if (SEED_TEMPLATE_IDS.has(id)) return;
    setUserTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  function markNotificationRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function clearNotifications() {
    setNotifications([]);
  }

  function addComment(c: ContractComment) {
    setComments((prev) => [...prev, c]);
  }

  function resolveComment(id: number) {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: true } : c)),
    );
  }

  function deleteComment(id: number) {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  function inviteUser(u: ManagedUser) {
    setManagedUsers((prev) => [...prev, u]);
  }

  function updateUserRole(id: string, role: string) {
    setManagedUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u)),
    );
  }

  function updateUserStatus(id: string, status: "active" | "suspended") {
    setManagedUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status } : u)),
    );
  }

  function deleteManagedUser(id: string) {
    setManagedUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <LocalStoreContext.Provider
      value={{
        contracts,
        addContract,
        updateContract,
        updateContracts,
        deleteContracts,
        counterparties,
        addCounterparty,
        updateCounterparty,
        templates,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,
        clearNotifications,
        comments,
        addComment,
        resolveComment,
        deleteComment,
        managedUsers,
        inviteUser,
        updateUserRole,
        updateUserStatus,
        deleteManagedUser,
      }}
    >
      {children}
    </LocalStoreContext.Provider>
  );
}

export function useLocalStore() {
  const ctx = useContext(LocalStoreContext);
  if (!ctx)
    throw new Error("useLocalStore must be used within LocalStoreProvider");
  return ctx;
}
