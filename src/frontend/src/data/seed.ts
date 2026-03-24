export type ContractStatus =
  | "active"
  | "draft"
  | "expired"
  | "terminated"
  | "underReview";
export type CounterpartyStatus = "active" | "inactive" | "blacklisted";
export type CounterpartyType =
  | "vendor"
  | "client"
  | "partner"
  | "regulator"
  | "internal";
export type ObligationStatus =
  | "pending"
  | "inProgress"
  | "completed"
  | "overdue"
  | "waived";
export type Priority = "low" | "medium" | "high" | "critical";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export type SeedContract = {
  id: string;
  title: string;
  status: ContractStatus;
  contractType: string;
  counterpartyId: string;
  value: number;
  currency: string;
  startDate: number;
  endDate: number;
  renewalDate?: number;
  autoRenew: boolean;
  riskLevel: RiskLevel;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  description: string;
  department: string;
};

export type SeedCounterparty = {
  id: string;
  name: string;
  counterpartyType: CounterpartyType;
  status: CounterpartyStatus;
  email: string;
  phone: string;
  address: string;
  country: string;
  contactName: string;
  createdAt: number;
  updatedAt: number;
  riskLevel: RiskLevel;
};

export type SeedObligation = {
  id: number;
  contractId: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: number;
  status: ObligationStatus;
  priority: Priority;
  createdAt: number;
  updatedAt: number;
};

export type SeedTimelineEvent = {
  id: number;
  contractId?: string;
  eventType: string;
  description: string;
  actor: string;
  timestamp: number;
  metadata?: string;
};

const d = (dateStr: string) => new Date(dateStr).getTime();
const now = Date.now();

export const counterparties: SeedCounterparty[] = [
  {
    id: "cp1",
    name: "Accenture",
    counterpartyType: "vendor",
    status: "active",
    email: "legal@accenture.com",
    phone: "+1 312-693-0161",
    address: "161 N Clark St, Chicago, IL",
    country: "USA",
    contactName: "James Miller",
    createdAt: d("2022-01-10"),
    updatedAt: d("2024-11-01"),
    riskLevel: "low",
  },
  {
    id: "cp2",
    name: "Microsoft",
    counterpartyType: "vendor",
    status: "active",
    email: "contracts@microsoft.com",
    phone: "+1 425-882-8080",
    address: "One Microsoft Way, Redmond, WA",
    country: "USA",
    contactName: "Sarah Chen",
    createdAt: d("2021-05-15"),
    updatedAt: d("2024-12-01"),
    riskLevel: "low",
  },
  {
    id: "cp3",
    name: "TechStartup Inc",
    counterpartyType: "partner",
    status: "active",
    email: "legal@techstartup.io",
    phone: "+1 415-555-0123",
    address: "525 Market St, San Francisco, CA",
    country: "USA",
    contactName: "Alex Rivera",
    createdAt: d("2023-03-01"),
    updatedAt: d("2024-10-15"),
    riskLevel: "medium",
  },
  {
    id: "cp4",
    name: "GlobalSupply Co",
    counterpartyType: "vendor",
    status: "active",
    email: "contracts@globalsupply.com",
    phone: "+44 20 7946 0958",
    address: "12 Bridge St, London",
    country: "UK",
    contactName: "Emma Thompson",
    createdAt: d("2020-09-01"),
    updatedAt: d("2024-09-20"),
    riskLevel: "high",
  },
  {
    id: "cp5",
    name: "Realty Partners LLC",
    counterpartyType: "vendor",
    status: "active",
    email: "leasing@realtypartners.com",
    phone: "+1 212-555-0199",
    address: "1500 Broadway, New York, NY",
    country: "USA",
    contactName: "David Kim",
    createdAt: d("2021-07-01"),
    updatedAt: d("2024-08-01"),
    riskLevel: "low",
  },
  {
    id: "cp6",
    name: "McKinsey & Co",
    counterpartyType: "vendor",
    status: "active",
    email: "contracts@mckinsey.com",
    phone: "+1 212-446-7000",
    address: "711 Third Ave, New York, NY",
    country: "USA",
    contactName: "Priya Sharma",
    createdAt: d("2022-11-01"),
    updatedAt: d("2024-11-15"),
    riskLevel: "medium",
  },
  {
    id: "cp7",
    name: "Salesforce",
    counterpartyType: "vendor",
    status: "active",
    email: "enterprise@salesforce.com",
    phone: "+1 415-901-7000",
    address: "Salesforce Tower, San Francisco, CA",
    country: "USA",
    contactName: "Michael Torres",
    createdAt: d("2021-01-15"),
    updatedAt: d("2024-10-01"),
    riskLevel: "low",
  },
  {
    id: "cp8",
    name: "Creative Agency",
    counterpartyType: "vendor",
    status: "inactive",
    email: "hello@creativeagency.co",
    phone: "+1 310-555-0145",
    address: "8721 Sunset Blvd, Los Angeles, CA",
    country: "USA",
    contactName: "Lisa Park",
    createdAt: d("2023-01-01"),
    updatedAt: d("2024-12-31"),
    riskLevel: "medium",
  },
];

export const contracts: SeedContract[] = [
  {
    id: "c1",
    title: "Master Services Agreement",
    status: "active",
    contractType: "Services",
    counterpartyId: "cp1",
    value: 250000,
    currency: "USD",
    startDate: d("2024-01-01"),
    endDate: d("2025-06-30"),
    renewalDate: d("2025-05-01"),
    autoRenew: true,
    riskLevel: "high",
    tags: ["services", "strategic"],
    createdAt: d("2024-01-01"),
    updatedAt: d("2024-11-01"),
    createdBy: "Legal Admin",
    description:
      "Master services agreement covering consulting and professional services delivery.",
    department: "Legal",
  },
  {
    id: "c2",
    title: "Software License Agreement",
    status: "active",
    contractType: "License",
    counterpartyId: "cp2",
    value: 48000,
    currency: "USD",
    startDate: d("2024-01-01"),
    endDate: d("2025-12-31"),
    autoRenew: true,
    riskLevel: "medium",
    tags: ["software", "license"],
    createdAt: d("2024-01-01"),
    updatedAt: d("2024-12-01"),
    createdBy: "Procurement Manager",
    description: "Enterprise software license for Microsoft 365 suite.",
    department: "IT",
  },
  {
    id: "c3",
    title: "Non-Disclosure Agreement",
    status: "active",
    contractType: "NDA",
    counterpartyId: "cp3",
    value: 0,
    currency: "USD",
    startDate: d("2024-01-15"),
    endDate: d("2026-01-15"),
    autoRenew: false,
    riskLevel: "low",
    tags: ["nda", "confidentiality"],
    createdAt: d("2024-01-15"),
    updatedAt: d("2024-01-15"),
    createdBy: "Legal Admin",
    description: "Mutual NDA for technology partnership discussions.",
    department: "Legal",
  },
  {
    id: "c4",
    title: "Vendor Supply Agreement",
    status: "underReview",
    contractType: "Supply",
    counterpartyId: "cp4",
    value: 1200000,
    currency: "USD",
    startDate: d("2024-04-01"),
    endDate: d("2025-03-31"),
    autoRenew: false,
    riskLevel: "high",
    tags: ["supply", "critical"],
    createdAt: d("2024-04-01"),
    updatedAt: d("2025-01-15"),
    createdBy: "Procurement Manager",
    description:
      "Annual supply agreement for critical manufacturing components.",
    department: "Procurement",
  },
  {
    id: "c5",
    title: "Office Lease Agreement",
    status: "active",
    contractType: "Lease",
    counterpartyId: "cp5",
    value: 360000,
    currency: "USD",
    startDate: d("2021-09-01"),
    endDate: d("2026-08-01"),
    autoRenew: false,
    riskLevel: "medium",
    tags: ["real-estate", "facilities"],
    createdAt: d("2021-09-01"),
    updatedAt: d("2024-08-01"),
    createdBy: "Legal Admin",
    description: "Commercial office lease for headquarters location.",
    department: "Facilities",
  },
  {
    id: "c6",
    title: "Consulting Agreement",
    status: "active",
    contractType: "Consulting",
    counterpartyId: "cp6",
    value: 500000,
    currency: "USD",
    startDate: d("2024-10-01"),
    endDate: d("2025-04-15"),
    autoRenew: false,
    riskLevel: "critical",
    tags: ["consulting", "strategic"],
    createdAt: d("2024-10-01"),
    updatedAt: d("2024-11-15"),
    createdBy: "Executive Approver",
    description: "Strategic transformation consulting engagement.",
    department: "Strategy",
  },
  {
    id: "c7",
    title: "SaaS Platform Agreement",
    status: "active",
    contractType: "SaaS",
    counterpartyId: "cp7",
    value: 84000,
    currency: "USD",
    startDate: d("2024-10-01"),
    endDate: d("2025-09-30"),
    autoRenew: true,
    riskLevel: "low",
    tags: ["saas", "crm"],
    createdAt: d("2024-10-01"),
    updatedAt: d("2024-10-01"),
    createdBy: "Procurement Manager",
    description: "Enterprise CRM platform subscription.",
    department: "Sales",
  },
  {
    id: "c8",
    title: "Data Processing Agreement",
    status: "active",
    contractType: "DPA",
    counterpartyId: "cp2",
    value: 0,
    currency: "USD",
    startDate: d("2023-01-01"),
    endDate: d("2027-01-01"),
    autoRenew: true,
    riskLevel: "medium",
    tags: ["gdpr", "compliance", "data"],
    createdAt: d("2023-01-01"),
    updatedAt: d("2024-05-01"),
    createdBy: "Compliance Officer",
    description: "GDPR-compliant data processing agreement for cloud services.",
    department: "Compliance",
  },
  {
    id: "c9",
    title: "Employment Agreement Template",
    status: "draft",
    contractType: "Employment",
    counterpartyId: "cp1",
    value: 0,
    currency: "USD",
    startDate: d("2025-01-01"),
    endDate: d("2027-01-01"),
    autoRenew: false,
    riskLevel: "low",
    tags: ["hr", "template"],
    createdAt: d("2025-01-01"),
    updatedAt: d("2025-01-10"),
    createdBy: "Legal Admin",
    description: "Standard employment agreement template for new hires.",
    department: "HR",
  },
  {
    id: "c10",
    title: "Commercial Insurance Policy",
    status: "active",
    contractType: "Insurance",
    counterpartyId: "cp5",
    value: 24000,
    currency: "USD",
    startDate: d("2024-07-01"),
    endDate: d("2025-07-01"),
    autoRenew: true,
    riskLevel: "low",
    tags: ["insurance", "risk"],
    createdAt: d("2024-07-01"),
    updatedAt: d("2024-07-01"),
    createdBy: "Finance Reviewer",
    description: "Commercial general liability and property insurance.",
    department: "Finance",
  },
  {
    id: "c11",
    title: "Marketing Services Agreement",
    status: "expired",
    contractType: "Services",
    counterpartyId: "cp8",
    value: 75000,
    currency: "USD",
    startDate: d("2024-01-01"),
    endDate: d("2024-12-31"),
    autoRenew: false,
    riskLevel: "medium",
    tags: ["marketing", "creative"],
    createdAt: d("2024-01-01"),
    updatedAt: d("2024-12-31"),
    createdBy: "Procurement Manager",
    description: "Annual marketing and creative services retainer.",
    department: "Marketing",
  },
  {
    id: "c12",
    title: "Partnership Agreement",
    status: "terminated",
    contractType: "Partnership",
    counterpartyId: "cp3",
    value: 0,
    currency: "USD",
    startDate: d("2022-01-01"),
    endDate: d("2024-12-31"),
    autoRenew: false,
    riskLevel: "high",
    tags: ["partnership"],
    createdAt: d("2022-01-01"),
    updatedAt: d("2024-06-01"),
    createdBy: "Legal Admin",
    description: "Technology partnership agreement - terminated early.",
    department: "Legal",
  },
];

export const obligations: SeedObligation[] = [
  {
    id: 1,
    contractId: "c1",
    title: "Submit Q1 Compliance Report",
    description: "Annual Q1 compliance report per MSA section 8.2.",
    assignedTo: "Compliance Officer",
    dueDate: d("2025-03-31"),
    status: "pending",
    priority: "high",
    createdAt: d("2024-01-01"),
    updatedAt: now,
  },
  {
    id: 2,
    contractId: "c2",
    title: "Renew Software Licenses",
    description: "Review and renew Microsoft 365 licenses before expiry.",
    assignedTo: "Procurement Manager",
    dueDate: d("2025-11-30"),
    status: "pending",
    priority: "medium",
    createdAt: d("2024-01-01"),
    updatedAt: now,
  },
  {
    id: 3,
    contractId: "c8",
    title: "Annual Security Audit",
    description: "Conduct annual security audit per DPA requirements.",
    assignedTo: "Compliance Officer",
    dueDate: d("2025-06-01"),
    status: "inProgress",
    priority: "high",
    createdAt: d("2023-01-01"),
    updatedAt: now,
  },
  {
    id: 4,
    contractId: "c4",
    title: "Payment: Q1 Invoice",
    description: "Process Q1 payment to GlobalSupply Co per contract schedule.",
    assignedTo: "Finance Reviewer",
    dueDate: d("2025-03-15"),
    status: "overdue",
    priority: "critical",
    createdAt: d("2024-04-01"),
    updatedAt: now,
  },
  {
    id: 5,
    contractId: "c10",
    title: "Insurance Certificate Delivery",
    description: "Deliver updated certificate of insurance to all vendors.",
    assignedTo: "Legal Admin",
    dueDate: d("2025-01-31"),
    status: "completed",
    priority: "low",
    createdAt: d("2024-07-01"),
    updatedAt: now,
  },
  {
    id: 6,
    contractId: "c6",
    title: "Quarterly Business Review",
    description: "Facilitate QBR with McKinsey engagement team.",
    assignedTo: "Executive Approver",
    dueDate: d("2025-04-01"),
    status: "pending",
    priority: "high",
    createdAt: d("2024-10-01"),
    updatedAt: now,
  },
  {
    id: 7,
    contractId: "c11",
    title: "Data Deletion Notice",
    description: "Request data deletion from Creative Agency per GDPR.",
    assignedTo: "Compliance Officer",
    dueDate: d("2025-02-28"),
    status: "pending",
    priority: "medium",
    createdAt: d("2024-12-31"),
    updatedAt: now,
  },
  {
    id: 8,
    contractId: "c1",
    title: "Renewal Decision",
    description: "Decide on MSA renewal or termination.",
    assignedTo: "Legal Admin",
    dueDate: d("2025-05-15"),
    status: "pending",
    priority: "critical",
    createdAt: d("2024-01-01"),
    updatedAt: now,
  },
  {
    id: 9,
    contractId: "c7",
    title: "License Count Audit",
    description: "Audit actual Salesforce license usage vs contracted.",
    assignedTo: "Procurement Manager",
    dueDate: d("2025-08-31"),
    status: "pending",
    priority: "medium",
    createdAt: d("2024-10-01"),
    updatedAt: now,
  },
  {
    id: 10,
    contractId: "c5",
    title: "Office Inspection",
    description: "Annual office space inspection per lease terms.",
    assignedTo: "Department Owner",
    dueDate: d("2025-05-01"),
    status: "pending",
    priority: "low",
    createdAt: d("2021-09-01"),
    updatedAt: now,
  },
  {
    id: 11,
    contractId: "c3",
    title: "Submit NDA Addendum",
    description: "Submit updated scope addendum to NDA.",
    assignedTo: "Legal Admin",
    dueDate: d("2025-03-01"),
    status: "inProgress",
    priority: "medium",
    createdAt: d("2024-01-15"),
    updatedAt: now,
  },
  {
    id: 12,
    contractId: "c2",
    title: "Budget Approval for Renewal",
    description: "Get Finance approval for Microsoft renewal budget.",
    assignedTo: "Finance Reviewer",
    dueDate: d("2025-10-31"),
    status: "pending",
    priority: "high",
    createdAt: d("2024-01-01"),
    updatedAt: now,
  },
  {
    id: 13,
    contractId: "c4",
    title: "Legal Review",
    description: "Complete legal review of supply agreement terms.",
    assignedTo: "Legal Admin",
    dueDate: d("2025-02-28"),
    status: "overdue",
    priority: "critical",
    createdAt: d("2024-04-01"),
    updatedAt: now,
  },
  {
    id: 14,
    contractId: "c8",
    title: "Update Data Processing Records",
    description: "Update ROPA entries per updated DPA terms.",
    assignedTo: "Compliance Officer",
    dueDate: d("2025-04-15"),
    status: "pending",
    priority: "medium",
    createdAt: d("2023-01-01"),
    updatedAt: now,
  },
  {
    id: 15,
    contractId: "c12",
    title: "Contract Closeout Documentation",
    description: "File all closeout documents for terminated partnership.",
    assignedTo: "Legal Admin",
    dueDate: d("2025-01-15"),
    status: "completed",
    priority: "low",
    createdAt: d("2024-06-01"),
    updatedAt: now,
  },
];

export const timelineEvents: SeedTimelineEvent[] = [
  {
    id: 1,
    contractId: "c1",
    eventType: "contract_created",
    description: "Master Services Agreement created",
    actor: "Legal Admin",
    timestamp: d("2024-01-01"),
  },
  {
    id: 2,
    contractId: "c2",
    eventType: "contract_created",
    description: "Software License Agreement created",
    actor: "Procurement Manager",
    timestamp: d("2024-01-01"),
  },
  {
    id: 3,
    contractId: "c4",
    eventType: "status_changed",
    description: "Vendor Supply Agreement moved to Under Review",
    actor: "Legal Admin",
    timestamp: d("2025-01-15"),
  },
  {
    id: 4,
    contractId: "c6",
    eventType: "contract_created",
    description: "Consulting Agreement executed with McKinsey",
    actor: "Executive Approver",
    timestamp: d("2024-10-01"),
  },
  {
    id: 5,
    contractId: "c11",
    eventType: "status_changed",
    description: "Marketing Services Agreement expired",
    actor: "System",
    timestamp: d("2024-12-31"),
  },
  {
    id: 6,
    contractId: "c12",
    eventType: "status_changed",
    description: "Partnership Agreement terminated",
    actor: "Legal Admin",
    timestamp: d("2024-06-01"),
  },
  {
    id: 7,
    contractId: "c1",
    eventType: "obligation_created",
    description: "Obligation created: Submit Q1 Compliance Report",
    actor: "Legal Admin",
    timestamp: d("2024-01-10"),
  },
  {
    id: 8,
    contractId: "c4",
    eventType: "comment_added",
    description: "Legal review initiated for supply agreement",
    actor: "Legal Admin",
    timestamp: d("2025-01-20"),
  },
  {
    id: 9,
    contractId: "c8",
    eventType: "document_uploaded",
    description: "DPA amendment v2 uploaded",
    actor: "Compliance Officer",
    timestamp: d("2024-05-01"),
  },
  {
    id: 10,
    contractId: "c6",
    eventType: "approval_requested",
    description: "Approval requested for consulting budget",
    actor: "Procurement Manager",
    timestamp: d("2024-09-15"),
  },
  {
    id: 11,
    contractId: "c6",
    eventType: "approved",
    description: "Consulting Agreement approved by Finance",
    actor: "Finance Reviewer",
    timestamp: d("2024-09-25"),
  },
  {
    id: 12,
    contractId: "c3",
    eventType: "contract_created",
    description: "NDA executed with TechStartup Inc",
    actor: "Legal Admin",
    timestamp: d("2024-01-15"),
  },
  {
    id: 13,
    contractId: "c7",
    eventType: "contract_created",
    description: "Salesforce SaaS Agreement renewed",
    actor: "Procurement Manager",
    timestamp: d("2024-10-01"),
  },
  {
    id: 14,
    contractId: "c5",
    eventType: "comment_added",
    description: "Lease renewal discussion initiated",
    actor: "Department Owner",
    timestamp: d("2024-11-01"),
  },
  {
    id: 15,
    contractId: "c1",
    eventType: "obligation_created",
    description: "Renewal decision obligation added",
    actor: "Legal Admin",
    timestamp: d("2025-01-05"),
  },
  {
    id: 16,
    contractId: "c4",
    eventType: "status_changed",
    description: "Q1 payment obligation marked overdue",
    actor: "System",
    timestamp: d("2025-01-16"),
  },
  {
    id: 17,
    contractId: "c2",
    eventType: "document_uploaded",
    description: "License summary document uploaded",
    actor: "IT Admin",
    timestamp: d("2024-12-01"),
  },
  {
    id: 18,
    contractId: "c9",
    eventType: "contract_created",
    description: "Employment Agreement Template drafted",
    actor: "Legal Admin",
    timestamp: d("2025-01-01"),
  },
  {
    id: 19,
    contractId: "c10",
    eventType: "obligation_created",
    description: "Insurance certificate delivery obligation created",
    actor: "Finance Reviewer",
    timestamp: d("2024-07-01"),
  },
  {
    id: 20,
    contractId: "c10",
    eventType: "approved",
    description: "Insurance certificate delivered and confirmed",
    actor: "Legal Admin",
    timestamp: d("2025-01-10"),
  },
  {
    id: 21,
    eventType: "system_event",
    description: "System backup completed",
    actor: "System",
    timestamp: d("2025-01-20"),
  },
  {
    id: 22,
    contractId: "c8",
    eventType: "comment_added",
    description: "Security audit scope confirmed",
    actor: "Compliance Officer",
    timestamp: d("2025-01-22"),
  },
  {
    id: 23,
    eventType: "user_login",
    description: "Jane Doe signed in",
    actor: "Jane Doe",
    timestamp: d("2026-03-01"),
  },
  {
    id: 24,
    contractId: "c1",
    eventType: "signature_requested",
    description: "Signature requested from John Smith (john@accenture.com)",
    actor: "Jane Doe",
    timestamp: d("2026-03-10"),
  },
];

export const getCounterpartyById = (id: string) =>
  counterparties.find((c) => c.id === id);
export const getContractById = (id: string) =>
  contracts.find((c) => c.id === id);
export const getObligationsByContractId = (id: string) =>
  obligations.filter((o) => o.contractId === id);
export const getContractsByCounterpartyId = (id: string) =>
  contracts.filter((c) => c.counterpartyId === id);

export type ClauseType =
  | "Liability"
  | "Indemnity"
  | "Termination"
  | "Payment"
  | "Confidentiality"
  | "Governing Law"
  | "SLA"
  | "IP";

export type SeedClause = {
  id: number;
  contractId: string;
  title: string;
  body: string;
  clauseType: ClauseType;
  riskLevel: RiskLevel;
  isAiExtracted?: boolean;
};

export const clauses: SeedClause[] = [
  {
    id: 1,
    contractId: "c1",
    title: "Limitation of Liability",
    body: "Neither party shall be liable for indirect, incidental, or consequential damages arising out of or related to this Agreement, even if advised of the possibility of such damages.",
    clauseType: "Liability",
    riskLevel: "high",
  },
  {
    id: 2,
    contractId: "c1",
    title: "Indemnification",
    body: "Each party agrees to indemnify and hold harmless the other party from any claims, losses, or damages arising from its own negligence or willful misconduct.",
    clauseType: "Indemnity",
    riskLevel: "high",
  },
  {
    id: 3,
    contractId: "c1",
    title: "Termination for Convenience",
    body: "Either party may terminate this Agreement upon 30 days written notice without cause.",
    clauseType: "Termination",
    riskLevel: "medium",
  },
  {
    id: 4,
    contractId: "c2",
    title: "License Scope",
    body: "Licensor grants a non-exclusive, non-transferable license to use the software solely for internal business purposes.",
    clauseType: "IP",
    riskLevel: "low",
  },
  {
    id: 5,
    contractId: "c2",
    title: "Service Level Agreement",
    body: "Vendor guarantees 99.9% uptime measured monthly. Downtime credits apply at 10% of monthly fee per hour of excess downtime.",
    clauseType: "SLA",
    riskLevel: "medium",
  },
  {
    id: 6,
    contractId: "c3",
    title: "Confidentiality Obligations",
    body: "Each party agrees to keep confidential all proprietary information disclosed by the other party and not to disclose it to any third party without prior written consent.",
    clauseType: "Confidentiality",
    riskLevel: "low",
  },
  {
    id: 7,
    contractId: "c3",
    title: "Governing Law",
    body: "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.",
    clauseType: "Governing Law",
    riskLevel: "low",
  },
  {
    id: 8,
    contractId: "c4",
    title: "Payment Terms",
    body: "Payment is due within 30 days of invoice receipt. Late payments accrue interest at 1.5% per month.",
    clauseType: "Payment",
    riskLevel: "medium",
  },
  {
    id: 9,
    contractId: "c4",
    title: "Limitation of Liability",
    body: "Supplier's aggregate liability shall not exceed the total fees paid in the 12 months preceding the claim.",
    clauseType: "Liability",
    riskLevel: "critical",
  },
  {
    id: 10,
    contractId: "c4",
    title: "Termination for Default",
    body: "Either party may terminate immediately upon written notice if the other party materially breaches and fails to cure within 15 days.",
    clauseType: "Termination",
    riskLevel: "high",
  },
  {
    id: 11,
    contractId: "c6",
    title: "Intellectual Property",
    body: "All work product, deliverables and inventions created under this Agreement are work-for-hire and become sole property of Client.",
    clauseType: "IP",
    riskLevel: "high",
  },
  {
    id: 12,
    contractId: "c6",
    title: "Payment Schedule",
    body: "Client shall pay monthly retainer of $125,000 due on the 1st of each month. Expense reimbursement within 15 days of submission.",
    clauseType: "Payment",
    riskLevel: "low",
  },
  {
    id: 13,
    contractId: "c7",
    title: "Service Levels",
    body: "Platform availability target is 99.95% excluding scheduled maintenance windows communicated 48 hours in advance.",
    clauseType: "SLA",
    riskLevel: "low",
  },
  {
    id: 14,
    contractId: "c7",
    title: "Data Confidentiality",
    body: "Vendor shall not use customer data for any purpose other than providing the contracted services.",
    clauseType: "Confidentiality",
    riskLevel: "medium",
  },
  {
    id: 15,
    contractId: "c8",
    title: "Data Processing Restrictions",
    body: "Processor may only process personal data on documented instructions from Controller and for the purposes set out in Annex A.",
    clauseType: "Confidentiality",
    riskLevel: "medium",
  },
  {
    id: 16,
    contractId: "c8",
    title: "Governing Law",
    body: "This DPA is governed by EU General Data Protection Regulation (GDPR) and the laws of Germany.",
    clauseType: "Governing Law",
    riskLevel: "low",
  },
];

// ---- Approval Workflows ----

export type ApprovalStepStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "skipped";
export type ApprovalWorkflowStatus =
  | "pending"
  | "inProgress"
  | "approved"
  | "rejected";

export type SeedApprovalStep = {
  id: number;
  workflowId: number;
  stepNumber: number;
  role: string;
  assignee: string;
  status: ApprovalStepStatus;
  comment?: string;
  completedAt?: number;
};

export type SeedApprovalWorkflow = {
  id: number;
  contractId: string;
  name: string;
  status: ApprovalWorkflowStatus;
  currentStep: number;
  createdAt: number;
  updatedAt: number;
  steps: SeedApprovalStep[];
};

export const approvalWorkflows: SeedApprovalWorkflow[] = [
  {
    id: 1,
    contractId: "c1",
    name: "IT Services Contract Approval",
    status: "inProgress",
    currentStep: 2,
    createdAt: d("2025-11-01"),
    updatedAt: d("2025-11-10"),
    steps: [
      {
        id: 1,
        workflowId: 1,
        stepNumber: 1,
        role: "Legal Admin",
        assignee: "Sarah Chen",
        status: "approved",
        comment: "Legal terms reviewed and approved.",
        completedAt: d("2025-11-05"),
      },
      {
        id: 2,
        workflowId: 1,
        stepNumber: 2,
        role: "Finance Reviewer",
        assignee: "David Park",
        status: "pending",
      },
      {
        id: 3,
        workflowId: 1,
        stepNumber: 3,
        role: "Executive Approver",
        assignee: "Margaret Wilson",
        status: "pending",
      },
    ],
  },
  {
    id: 2,
    contractId: "c3",
    name: "NDA Renewal Approval",
    status: "approved",
    currentStep: 3,
    createdAt: d("2025-09-01"),
    updatedAt: d("2025-09-20"),
    steps: [
      {
        id: 4,
        workflowId: 2,
        stepNumber: 1,
        role: "Legal Admin",
        assignee: "Sarah Chen",
        status: "approved",
        comment: "Standard NDA, approved.",
        completedAt: d("2025-09-05"),
      },
      {
        id: 5,
        workflowId: 2,
        stepNumber: 2,
        role: "Compliance Officer",
        assignee: "James Torres",
        status: "approved",
        comment: "Compliant with data policy.",
        completedAt: d("2025-09-12"),
      },
      {
        id: 6,
        workflowId: 2,
        stepNumber: 3,
        role: "Executive Approver",
        assignee: "Margaret Wilson",
        status: "approved",
        comment: "Approved for signature.",
        completedAt: d("2025-09-20"),
      },
    ],
  },
  {
    id: 3,
    contractId: "c5",
    name: "Facilities Lease Approval",
    status: "pending",
    currentStep: 1,
    createdAt: d("2026-01-15"),
    updatedAt: d("2026-01-15"),
    steps: [
      {
        id: 7,
        workflowId: 3,
        stepNumber: 1,
        role: "Procurement Manager",
        assignee: "Alex Rivera",
        status: "pending",
      },
      {
        id: 8,
        workflowId: 3,
        stepNumber: 2,
        role: "Finance Reviewer",
        assignee: "David Park",
        status: "pending",
      },
      {
        id: 9,
        workflowId: 3,
        stepNumber: 3,
        role: "Legal Admin",
        assignee: "Sarah Chen",
        status: "pending",
      },
      {
        id: 10,
        workflowId: 3,
        stepNumber: 4,
        role: "Executive Approver",
        assignee: "Margaret Wilson",
        status: "pending",
      },
    ],
  },
  {
    id: 4,
    contractId: "c7",
    name: "SaaS Platform Contract Review",
    status: "inProgress",
    currentStep: 2,
    createdAt: d("2026-02-01"),
    updatedAt: d("2026-02-10"),
    steps: [
      {
        id: 11,
        workflowId: 4,
        stepNumber: 1,
        role: "Legal Admin",
        assignee: "Sarah Chen",
        status: "approved",
        comment: "IP and SLA clauses are acceptable.",
        completedAt: d("2026-02-08"),
      },
      {
        id: 12,
        workflowId: 4,
        stepNumber: 2,
        role: "Compliance Officer",
        assignee: "James Torres",
        status: "pending",
      },
      {
        id: 13,
        workflowId: 4,
        stepNumber: 3,
        role: "Executive Approver",
        assignee: "Margaret Wilson",
        status: "pending",
      },
    ],
  },
  {
    id: 5,
    contractId: "c9",
    name: "Employment Template Approval",
    status: "rejected",
    currentStep: 2,
    createdAt: d("2025-12-01"),
    updatedAt: d("2025-12-15"),
    steps: [
      {
        id: 14,
        workflowId: 5,
        stepNumber: 1,
        role: "Legal Admin",
        assignee: "Sarah Chen",
        status: "approved",
        completedAt: d("2025-12-05"),
      },
      {
        id: 15,
        workflowId: 5,
        stepNumber: 2,
        role: "Finance Reviewer",
        assignee: "David Park",
        status: "rejected",
        comment: "Compensation terms exceed approved bands. Requires revision.",
        completedAt: d("2025-12-15"),
      },
      {
        id: 16,
        workflowId: 5,
        stepNumber: 3,
        role: "Executive Approver",
        assignee: "Margaret Wilson",
        status: "skipped",
      },
    ],
  },
];

export type ContractTemplate = {
  id: string;
  name: string;
  description: string;
  contractType: string;
  department: string;
  currency: string;
  autoRenew: boolean;
  riskLevel: RiskLevel;
  defaultClauses: {
    title: string;
    text: string;
    clauseType: string;
    riskLevel: RiskLevel;
  }[];
  tags: string[];
  createdAt: number;
  createdBy: string;
  isSeed?: boolean;
};

export const contractTemplates: ContractTemplate[] = [
  {
    id: "tmpl1",
    name: "Non-Disclosure Agreement",
    description:
      "Standard mutual NDA for partnerships, vendor engagements, and technology discussions.",
    contractType: "NDA",
    department: "Legal",
    currency: "USD",
    autoRenew: false,
    riskLevel: "low",
    defaultClauses: [
      {
        title: "Confidentiality Obligations",
        text: "Each party agrees to keep confidential all Confidential Information received from the other party.",
        clauseType: "Confidentiality",
        riskLevel: "low",
      },
      {
        title: "Exclusions from Confidentiality",
        text: "Confidentiality obligations do not apply to information that is publicly available or was known prior to disclosure.",
        clauseType: "Confidentiality",
        riskLevel: "low",
      },
    ],
    tags: ["nda", "confidentiality", "legal"],
    createdAt: new Date("2024-01-01").getTime(),
    createdBy: "Legal Admin",
    isSeed: true,
  },
  {
    id: "tmpl2",
    name: "Software License Agreement",
    description:
      "Enterprise software license template covering grant of license, usage restrictions, and payment terms.",
    contractType: "License",
    department: "IT",
    currency: "USD",
    autoRenew: true,
    riskLevel: "medium",
    defaultClauses: [
      {
        title: "License Grant",
        text: "Licensor grants Licensee a non-exclusive, non-transferable, limited license to use the software solely for internal business purposes.",
        clauseType: "IP",
        riskLevel: "medium",
      },
      {
        title: "Restrictions on Use",
        text: "Licensee shall not sublicense, sell, resell, transfer, or otherwise commercially exploit the software or service.",
        clauseType: "IP",
        riskLevel: "medium",
      },
    ],
    tags: ["software", "license", "it"],
    createdAt: new Date("2024-01-01").getTime(),
    createdBy: "Procurement Manager",
    isSeed: true,
  },
  {
    id: "tmpl3",
    name: "Master Service Agreement",
    description:
      "Comprehensive MSA template for professional services engagements with liability caps and termination rights.",
    contractType: "MSA",
    department: "Operations",
    currency: "USD",
    autoRenew: false,
    riskLevel: "medium",
    defaultClauses: [
      {
        title: "Limitation of Liability",
        text: "Neither party shall be liable for indirect, incidental, or consequential damages arising out of or relating to this agreement.",
        clauseType: "Liability",
        riskLevel: "high",
      },
      {
        title: "Termination for Convenience",
        text: "Either party may terminate this agreement upon thirty (30) days written notice to the other party without cause or penalty.",
        clauseType: "Termination",
        riskLevel: "medium",
      },
    ],
    tags: ["msa", "services", "operations"],
    createdAt: new Date("2024-01-01").getTime(),
    createdBy: "Legal Admin",
    isSeed: true,
  },
  {
    id: "tmpl4",
    name: "Procurement Framework Agreement",
    description:
      "Standard procurement framework for vendor supply relationships covering delivery, quality, and force majeure.",
    contractType: "Supply",
    department: "Procurement",
    currency: "USD",
    autoRenew: false,
    riskLevel: "low",
    defaultClauses: [
      {
        title: "Delivery Obligations",
        text: "Vendor shall deliver all goods in accordance with the agreed delivery schedule. Time is of the essence.",
        clauseType: "SLA",
        riskLevel: "medium",
      },
      {
        title: "Force Majeure",
        text: "Neither party shall be liable for delays resulting from causes beyond their reasonable control.",
        clauseType: "Liability",
        riskLevel: "low",
      },
    ],
    tags: ["procurement", "supply", "vendor"],
    createdAt: new Date("2024-01-01").getTime(),
    createdBy: "Procurement Manager",
    isSeed: true,
  },
];
