import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ContractTag {
    name: string;
    color: string;
    usageCount: bigint;
}
export interface Obligation {
    id: bigint;
    status: ObligationStatus;
    title: string;
    assignedTo: string;
    createdAt: bigint;
    dueDate: bigint;
    description: string;
    updatedAt: bigint;
    priority: Priority;
    contractId: string;
}
export interface ApprovalWorkflow {
    id: bigint;
    status: Variant_pending_approved_rejected_inProgress;
    createdAt: bigint;
    updatedAt: bigint;
    contractId: string;
}
export interface ApprovalStep {
    status: Variant_pending_skipped_approved_rejected;
    approverRole: string;
    stepOrder: bigint;
    comments?: string;
    decidedAt?: bigint;
    workflowId: bigint;
}
export interface TimelineEvent {
    id: bigint;
    metadata?: string;
    responsibleParty: string;
    description: string;
    timestamp: bigint;
    contractId?: string;
    eventType: string;
}
export interface Counterparty {
    id: string;
    status: CounterpartyStatus;
    contactName: string;
    country: string;
    name: string;
    createdAt: bigint;
    email: string;
    updatedAt: bigint;
    counterpartyType: CounterpartyType;
    address: string;
    phone: string;
    riskLevel: RiskLevel;
}
export interface ContractInput {
    status: ContractStatus;
    endDate: bigint;
    value: number;
    createdBy: string;
    tags: Array<string>;
    description: string;
    currency: string;
    counterpartyId: string;
    autoRenew: boolean;
    department: string;
    riskLevel: RiskLevel;
    renewalDate?: bigint;
    startDate: bigint;
}
export interface FileReference {
    id: bigint;
    blob: ExternalBlob;
    name: string;
    uploadedAt: bigint;
}
export interface Contract {
    id: string;
    status: ContractStatus;
    endDate: bigint;
    value: number;
    createdAt: bigint;
    createdBy: string;
    tags: Array<string>;
    description: string;
    updatedAt: bigint;
    currency: string;
    counterpartyId: string;
    autoRenew: boolean;
    department: string;
    riskLevel: RiskLevel;
    renewalDate?: bigint;
    startDate: bigint;
}
export interface UserProfile {
    name: string;
}
export enum ContractStatus {
    active = "active",
    terminated = "terminated",
    expired = "expired",
    underReview = "underReview",
    draft = "draft"
}
export enum CounterpartyStatus {
    active = "active",
    inactive = "inactive",
    blacklisted = "blacklisted"
}
export enum CounterpartyType {
    client = "client",
    internal = "internal",
    regulator = "regulator",
    vendor = "vendor",
    partner = "partner"
}
export enum ObligationStatus {
    pending = "pending",
    completed = "completed",
    overdue = "overdue",
    waived = "waived",
    inProgress = "inProgress"
}
export enum Priority {
    low = "low",
    high = "high",
    critical = "critical",
    medium = "medium"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_pending_approved_rejected_inProgress {
    pending = "pending",
    approved = "approved",
    rejected = "rejected",
    inProgress = "inProgress"
}
export enum Variant_pending_skipped_approved_rejected {
    pending = "pending",
    skipped = "skipped",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createApprovalStep(workflowId: bigint, stepOrder: bigint, approverRole: string): Promise<void>;
    createApprovalWorkflow(contractId: string): Promise<bigint>;
    createContract(id: string, input: ContractInput): Promise<void>;
    createCounterparty(id: string, name: string, counterpartyType: CounterpartyType, status: CounterpartyStatus, email: string, phone: string, address: string, country: string, contactName: string, riskLevel: RiskLevel): Promise<void>;
    createObligation(contractId: string, title: string, description: string, assignedTo: string, dueDate: bigint, status: ObligationStatus, priority: Priority): Promise<void>;
    createTag(name: string, color: string): Promise<void>;
    createTimelineEvent(contractId: string | null, eventType: string, description: string, responsibleParty: string, metadata: string | null): Promise<void>;
    deleteApprovalStep(workflowId: bigint): Promise<void>;
    deleteApprovalWorkflow(id: bigint): Promise<void>;
    deleteContract(id: string): Promise<void>;
    deleteCounterparty(id: string): Promise<void>;
    deleteFile(id: bigint): Promise<void>;
    deleteObligation(id: bigint): Promise<void>;
    deleteTag(name: string): Promise<void>;
    deleteTimelineEvent(id: bigint): Promise<void>;
    getAllTags(): Promise<Array<ContractTag>>;
    getApprovalStep(workflowId: bigint): Promise<ApprovalStep | null>;
    getApprovalStepsByWorkflow(workflowId: bigint): Promise<Array<ApprovalStep>>;
    getApprovalWorkflow(id: bigint): Promise<ApprovalWorkflow | null>;
    getApprovalWorkflowsByContract(contractId: string): Promise<Array<ApprovalWorkflow>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContract(id: string): Promise<Contract | null>;
    getContractsByCounterparty(counterpartyId: string): Promise<Array<Contract>>;
    getContractsByStatus(status: ContractStatus): Promise<Array<Contract>>;
    getCounterparty(id: string): Promise<Counterparty | null>;
    getEventsByContract(contractId: string): Promise<Array<TimelineEvent>>;
    getExpiringContracts(days: bigint): Promise<Array<Contract>>;
    getFile(id: bigint): Promise<FileReference | null>;
    getObligation(id: bigint): Promise<Obligation | null>;
    getObligationsByContract(contractId: string): Promise<Array<Obligation>>;
    getObligationsByStatus(status: ObligationStatus): Promise<Array<Obligation>>;
    getOverdueObligations(): Promise<Array<Obligation>>;
    getRecentEvents(limit: bigint): Promise<Array<TimelineEvent>>;
    getTag(name: string): Promise<ContractTag | null>;
    getTimelineEvent(id: bigint): Promise<TimelineEvent | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listContracts(): Promise<Array<Contract>>;
    listCounterparties(): Promise<Array<Counterparty>>;
    listFiles(): Promise<Array<FileReference>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchContracts(searchTerm: string): Promise<Array<Contract>>;
    updateApprovalStepStatus(workflowId: bigint, status: Variant_pending_skipped_approved_rejected, comments: string | null): Promise<void>;
    updateApprovalWorkflowStatus(id: bigint, status: Variant_pending_approved_rejected_inProgress): Promise<void>;
    updateContract(id: string, input: ContractInput): Promise<void>;
    updateCounterparty(id: string, name: string, counterpartyType: CounterpartyType, status: CounterpartyStatus, email: string, phone: string, address: string, country: string, contactName: string, riskLevel: RiskLevel): Promise<void>;
    updateObligation(id: bigint, title: string, description: string, assignedTo: string, dueDate: bigint, status: ObligationStatus, priority: Priority): Promise<void>;
    updateTag(name: string, color: string, usageCount: bigint): Promise<void>;
    updateTimelineEvent(id: bigint, eventType: string, description: string, responsibleParty: string, contractId: string | null, metadata: string | null): Promise<void>;
    uploadFile(name: string, blob: ExternalBlob): Promise<void>;
}
