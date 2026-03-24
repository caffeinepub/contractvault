import Text "mo:core/Text";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Map "mo:core/Map";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type ContractStatus = {
    #draft;
    #active;
    #expired;
    #terminated;
    #underReview;
  };

  type RiskLevel = { #low; #medium; #high; #critical };

  type CounterpartyType = {
    #vendor;
    #client;
    #partner;
    #regulator;
    #internal;
  };

  type CounterpartyStatus = { #active; #inactive; #blacklisted };

  type ObligationStatus = {
    #pending;
    #inProgress;
    #completed;
    #overdue;
    #waived;
  };

  type Priority = { #low; #medium; #high; #critical };

  type TimelineEvent = {
    id : Nat;
    contractId : ?Text;
    eventType : Text;
    description : Text;
    responsibleParty : Text;
    timestamp : Int;
    metadata : ?Text;
  };

  type ApprovalWorkflow = {
    id : Nat;
    contractId : Text;
    status : {
      #pending;
      #inProgress;
      #approved;
      #rejected;
    };
    createdAt : Int;
    updatedAt : Int;
  };

  type ApprovalStep = {
    workflowId : Nat;
    stepOrder : Nat;
    approverRole : Text;
    status : {
      #pending;
      #approved;
      #rejected;
      #skipped;
    };
    decidedAt : ?Int;
    comments : ?Text;
  };

  type Contract = {
    id : Text;
    status : ContractStatus;
    counterpartyId : Text;
    value : Float;
    currency : Text;
    startDate : Int;
    endDate : Int;
    renewalDate : ?Int;
    autoRenew : Bool;
    riskLevel : RiskLevel;
    tags : [Text];
    createdAt : Int;
    updatedAt : Int;
    createdBy : Text;
    description : Text;
    department : Text;
  };

  type Counterparty = {
    id : Text;
    name : Text;
    counterpartyType : CounterpartyType;
    status : CounterpartyStatus;
    email : Text;
    phone : Text;
    address : Text;
    country : Text;
    contactName : Text;
    createdAt : Int;
    updatedAt : Int;
    riskLevel : RiskLevel;
  };

  type Obligation = {
    id : Nat;
    contractId : Text;
    title : Text;
    description : Text;
    assignedTo : Text;
    dueDate : Int;
    status : ObligationStatus;
    priority : Priority;
    createdAt : Int;
    updatedAt : Int;
  };

  type ContractTag = {
    name : Text;
    color : Text;
    usageCount : Nat;
  };

  type ContractComment = {
    id : Nat;
    contractId : Text;
    versionRef : ?Text;
    author : Text;
    body : Text;
    timestamp : Int;
    resolved : Bool;
  };

  type ManagedUserStatus = { #active; #suspended };

  type ManagedUser = {
    id : Text;
    email : Text;
    name : Text;
    role : Text;
    status : ManagedUserStatus;
    invitedAt : Int;
    joinedAt : ?Int;
  };

  module ContractTag {
    public func compareByUsageCount(a : ContractTag, b : ContractTag) : Order.Order {
      Nat.compare(b.usageCount, a.usageCount);
    };
  };

  module Obligation {
    public func compareByDueDate(a : Obligation, b : Obligation) : Order.Order {
      Int.compare(a.dueDate, b.dueDate);
    };
  };

  module TimelineEvent {
    public func compareByTimestampDescending(a : TimelineEvent, b : TimelineEvent) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    };
  };

  module ContractComment {
    public func compareByTimestamp(a : ContractComment, b : ContractComment) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  // Persistent storage
  let contracts = Map.empty<Text, Contract>();
  let counterparties = Map.empty<Text, Counterparty>();
  let obligations = Map.empty<Nat, Obligation>();
  let tags = Map.empty<Text, ContractTag>();
  let timelineEvents = Map.empty<Nat, TimelineEvent>();
  let approvalWorkflows = Map.empty<Nat, ApprovalWorkflow>();
  let approvalSteps = Map.empty<Nat, ApprovalStep>();
  let contractComments = Map.empty<Nat, ContractComment>();
  let managedUsers = Map.empty<Text, ManagedUser>();

  var nextObligationId = 0;
  var nextEventId = 0;
  var nextWorkflowId = 0;
  var nextCommentId = 0;

  // Authorization System
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Storage System
  include MixinStorage();

  public type FileReference = {
    id : Nat;
    name : Text;
    blob : Storage.ExternalBlob;
    uploadedAt : Int;
  };

  let fileReferences = Map.empty<Nat, FileReference>();
  var nextFileId = 0;

  public shared ({ caller }) func uploadFile(name : Text, blob : Storage.ExternalBlob) : async () {
    let fileRef : FileReference = {
      id = nextFileId;
      name;
      blob;
      uploadedAt = Time.now();
    };
    fileReferences.add(nextFileId, fileRef);
    nextFileId += 1;
  };

  public query ({ caller }) func getFile(id : Nat) : async ?FileReference {
    fileReferences.get(id);
  };

  public query ({ caller }) func listFiles() : async [FileReference] {
    fileReferences.values().toArray();
  };

  public shared ({ caller }) func deleteFile(id : Nat) : async () {
    if (fileReferences.containsKey(id)) {
      fileReferences.remove(id);
    } else {
      Runtime.trap("Error: File with id does not exist!");
    };
  };

  // User Profile Management
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Contract CRUD
  public type ContractInput = {
    status : ContractStatus;
    counterpartyId : Text;
    value : Float;
    currency : Text;
    startDate : Int;
    endDate : Int;
    renewalDate : ?Int;
    autoRenew : Bool;
    riskLevel : RiskLevel;
    tags : [Text];
    createdBy : Text;
    description : Text;
    department : Text;
  };

  public shared ({ caller }) func createContract(id : Text, input : ContractInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create contracts");
    };
    let now = Time.now();
    let contract : Contract = {
      id;
      status = input.status;
      counterpartyId = input.counterpartyId;
      value = input.value;
      currency = input.currency;
      startDate = input.startDate;
      endDate = input.endDate;
      renewalDate = input.renewalDate;
      autoRenew = input.autoRenew;
      riskLevel = input.riskLevel;
      tags = input.tags;
      createdAt = now;
      updatedAt = now;
      createdBy = input.createdBy;
      description = input.description;
      department = input.department;
    };
    contracts.add(id, contract);
  };

  public shared ({ caller }) func updateContract(id : Text, input : ContractInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update contracts");
    };
    let existingContract = switch (contracts.get(id)) {
      case (null) { Runtime.trap("Contract not found") };
      case (?contract) { contract };
    };

    let updatedContract : Contract = {
      id;
      status = input.status;
      counterpartyId = input.counterpartyId;
      value = input.value;
      currency = input.currency;
      startDate = input.startDate;
      endDate = input.endDate;
      renewalDate = input.renewalDate;
      autoRenew = input.autoRenew;
      riskLevel = input.riskLevel;
      tags = input.tags;
      createdAt = existingContract.createdAt;
      updatedAt = Time.now();
      createdBy = input.createdBy;
      description = input.description;
      department = input.department;
    };
    contracts.add(id, updatedContract);
  };

  public shared ({ caller }) func deleteContract(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete contracts");
    };
    contracts.remove(id);
  };

  public query ({ caller }) func getContract(id : Text) : async ?Contract {
    contracts.get(id);
  };

  public query ({ caller }) func listContracts() : async [Contract] {
    contracts.values().toArray();
  };

  public query ({ caller }) func getContractsByCounterparty(counterpartyId : Text) : async [Contract] {
    contracts.values().toArray().filter(
      func(c) { c.counterpartyId == counterpartyId }
    );
  };

  public query ({ caller }) func getContractsByStatus(status : ContractStatus) : async [Contract] {
    contracts.values().toArray().filter(
      func(c) { c.status == status }
    );
  };

  public query ({ caller }) func getExpiringContracts(days : Int) : async [Contract] {
    let now = Time.now();
    let daysInNano = days * 24 * 60 * 60 * 1_000_000_000;
    contracts.values().toArray().filter(
      func(c) {
        c.endDate - now <= daysInNano and c.endDate >= now
      }
    );
  };

  public query ({ caller }) func searchContracts(searchTerm : Text) : async [Contract] {
    contracts.values().toArray().filter(
      func(c) {
        c.description.contains(#text searchTerm) or c.department.contains(#text searchTerm)
      }
    );
  };

  // Counterparty CRUD
  public shared ({ caller }) func createCounterparty(id : Text, name : Text, counterpartyType : CounterpartyType, status : CounterpartyStatus, email : Text, phone : Text, address : Text, country : Text, contactName : Text, riskLevel : RiskLevel) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create counterparties");
    };
    if (counterparties.containsKey(id)) {
      Runtime.trap("Counterparty with id " # id # " already exists");
    };

    let counterparty : Counterparty = {
      id;
      name;
      counterpartyType;
      status;
      email;
      phone;
      address;
      country;
      contactName;
      createdAt = Time.now();
      updatedAt = 0;
      riskLevel;
    };
    counterparties.add(id, counterparty);
  };

  public query ({ caller }) func getCounterparty(id : Text) : async ?Counterparty {
    counterparties.get(id);
  };

  public query ({ caller }) func listCounterparties() : async [Counterparty] {
    counterparties.values().toArray();
  };

  public shared ({ caller }) func updateCounterparty(id : Text, name : Text, counterpartyType : CounterpartyType, status : CounterpartyStatus, email : Text, phone : Text, address : Text, country : Text, contactName : Text, riskLevel : RiskLevel) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update counterparties");
    };
    let counterparty = switch (counterparties.get(id)) {
      case (null) { Runtime.trap("Counterparty not found") };
      case (?r) { r };
    };

    let updatedCounterparty : Counterparty = {
      counterparty with
      name;
      counterpartyType;
      status;
      email;
      phone;
      address;
      country;
      contactName;
      updatedAt = Time.now();
      riskLevel;
    };
    counterparties.add(id, updatedCounterparty);
  };

  public shared ({ caller }) func deleteCounterparty(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete counterparties");
    };
    if (counterparties.containsKey(id)) {
      counterparties.remove(id);
    } else {
      Runtime.trap("Counterparty does not exist");
    };
  };

  // Obligation CRUD
  public shared ({ caller }) func createObligation(contractId : Text, title : Text, description : Text, assignedTo : Text, dueDate : Int, status : ObligationStatus, priority : Priority) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create obligations");
    };
    let obligation : Obligation = {
      id = nextObligationId;
      contractId;
      title;
      description;
      assignedTo;
      dueDate;
      status;
      priority;
      createdAt = Time.now();
      updatedAt = 0;
    };
    obligations.add(nextObligationId, obligation);
    nextObligationId += 1;
  };

  public query ({ caller }) func getObligation(id : Nat) : async ?Obligation {
    obligations.get(id);
  };

  public query ({ caller }) func getObligationsByContract(contractId : Text) : async [Obligation] {
    obligations.values().toArray().filter(
      func(o) { o.contractId == contractId }
    );
  };

  public query ({ caller }) func getOverdueObligations() : async [Obligation] {
    let now = Time.now();
    obligations.values().toArray().filter(
      func(o) { o.status == #overdue and o.dueDate < now }
    );
  };

  public query ({ caller }) func getObligationsByStatus(status : ObligationStatus) : async [Obligation] {
    obligations.values().toArray().filter(
      func(o) { o.status == status }
    );
  };

  public shared ({ caller }) func updateObligation(id : Nat, title : Text, description : Text, assignedTo : Text, dueDate : Int, status : ObligationStatus, priority : Priority) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update obligations");
    };
    if (not obligations.containsKey(id)) {
      Runtime.trap("Obligation with id " # id.toText() # " does not exist");
    };

    let obligation = switch (obligations.get(id)) {
      case (null) { Runtime.trap("Obligation with id " # id.toText() # " does not exist") };
      case (?o) { o };
    };

    let updatedObligation : Obligation = {
      obligation with
      title;
      description;
      assignedTo;
      dueDate;
      status;
      priority;
      updatedAt = Time.now();
    };
    obligations.add(id, updatedObligation);
  };

  public shared ({ caller }) func deleteObligation(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete obligations");
    };
    if (obligations.containsKey(id)) {
      obligations.remove(id);
    } else {
      Runtime.trap("Obligation does not exist");
    };
  };

  // Tag CRUD
  public shared ({ caller }) func createTag(name : Text, color : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tags");
    };
    let tag : ContractTag = {
      name;
      color;
      usageCount = 0;
    };
    tags.add(name, tag);
  };

  public query ({ caller }) func getTag(name : Text) : async ?ContractTag {
    tags.get(name);
  };

  public query ({ caller }) func getAllTags() : async [ContractTag] {
    tags.values().toArray().sort(ContractTag.compareByUsageCount);
  };

  public shared ({ caller }) func updateTag(name : Text, color : Text, usageCount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tags");
    };
    let tag = switch (tags.get(name)) {
      case (null) { Runtime.trap("Tag not found") };
      case (?t) { t };
    };

    let updatedTag : ContractTag = {
      tag with color; usageCount
    };
    tags.add(name, updatedTag);
  };

  public shared ({ caller }) func deleteTag(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tags");
    };
    if (tags.containsKey(name)) {
      tags.remove(name);
    } else {
      Runtime.trap("Tag does not exist");
    };
  };

  // Timeline Event CRUD
  public shared ({ caller }) func createTimelineEvent(contractId : ?Text, eventType : Text, description : Text, responsibleParty : Text, metadata : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create timeline events");
    };
    let event : TimelineEvent = {
      id = nextEventId;
      contractId;
      eventType;
      description;
      responsibleParty;
      timestamp = Time.now();
      metadata;
    };
    timelineEvents.add(nextEventId, event);
    nextEventId += 1;
  };

  public query ({ caller }) func getTimelineEvent(id : Nat) : async ?TimelineEvent {
    timelineEvents.get(id);
  };

  public query ({ caller }) func getEventsByContract(contractId : Text) : async [TimelineEvent] {
    timelineEvents.values().toArray().filter(
      func(e) {
        switch (e.contractId) {
          case (null) { false };
          case (?cid) { cid == contractId };
        };
      }
    );
  };

  public query ({ caller }) func getRecentEvents(limit : Nat) : async [TimelineEvent] {
    let sortedEvents = timelineEvents.values().toArray().sort(TimelineEvent.compareByTimestampDescending);
    sortedEvents.sliceToArray(0, Nat.min(limit, sortedEvents.size()));
  };

  public shared ({ caller }) func updateTimelineEvent(id : Nat, eventType : Text, description : Text, responsibleParty : Text, contractId : ?Text, metadata : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update timeline events");
    };
    if (not timelineEvents.containsKey(id)) {
      Runtime.trap("Timeline event not found");
    };

    let event = switch (timelineEvents.get(id)) {
      case (null) { Runtime.trap("Timeline event not found") };
      case (?e) { e };
    };

    let updatedEvent : TimelineEvent = {
      event with
      eventType;
      description;
      responsibleParty;
      contractId;
      metadata;
      timestamp = Time.now();
    };
    timelineEvents.add(id, updatedEvent);
  };

  public shared ({ caller }) func deleteTimelineEvent(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete timeline events");
    };
    if (timelineEvents.containsKey(id)) {
      timelineEvents.remove(id);
    } else {
      Runtime.trap("Timeline event does not exist");
    };
  };

  // Approval Workflow CRUD
  public shared ({ caller }) func createApprovalWorkflow(contractId : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create approval workflows");
    };
    let workflow : ApprovalWorkflow = {
      id = nextWorkflowId;
      contractId;
      status = #pending;
      createdAt = Time.now();
      updatedAt = 0;
    };
    approvalWorkflows.add(nextWorkflowId, workflow);
    let id = nextWorkflowId;
    nextWorkflowId += 1;
    id;
  };

  public query ({ caller }) func getApprovalWorkflow(id : Nat) : async ?ApprovalWorkflow {
    approvalWorkflows.get(id);
  };

  public query ({ caller }) func getApprovalWorkflowsByContract(contractId : Text) : async [ApprovalWorkflow] {
    approvalWorkflows.values().toArray().filter(
      func(w) { w.contractId == contractId }
    );
  };

  public shared ({ caller }) func updateApprovalWorkflowStatus(id : Nat, status : { #pending; #inProgress; #approved; #rejected }) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update approval workflows");
    };
    if (not approvalWorkflows.containsKey(id)) {
      Runtime.trap("Approval workflow not found");
    };

    let workflow = switch (approvalWorkflows.get(id)) {
      case (null) { Runtime.trap("Approval workflow not found") };
      case (?w) { w };
    };

    let updatedWorkflow : ApprovalWorkflow = {
      workflow with status;
      updatedAt = Time.now();
    };
    approvalWorkflows.add(id, updatedWorkflow);
  };

  public shared ({ caller }) func deleteApprovalWorkflow(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete approval workflows");
    };
    if (approvalWorkflows.containsKey(id)) {
      approvalWorkflows.remove(id);
    } else {
      Runtime.trap("Approval workflow does not exist");
    };
  };

  // Approval Step CRUD
  public shared ({ caller }) func createApprovalStep(workflowId : Nat, stepOrder : Nat, approverRole : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create approval steps");
    };
    let step : ApprovalStep = {
      workflowId;
      stepOrder;
      approverRole;
      status = #pending;
      decidedAt = null;
      comments = null;
    };
    approvalSteps.add(workflowId, step);
  };

  public query ({ caller }) func getApprovalStep(workflowId : Nat) : async ?ApprovalStep {
    approvalSteps.get(workflowId);
  };

  public query ({ caller }) func getApprovalStepsByWorkflow(workflowId : Nat) : async [ApprovalStep] {
    let stepOption = approvalSteps.get(workflowId);
    switch (stepOption) {
      case (null) { [] };
      case (?step) { [step] };
    };
  };

  public shared ({ caller }) func updateApprovalStepStatus(workflowId : Nat, status : { #pending; #approved; #rejected; #skipped }, comments : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update approval steps");
    };
    if (not approvalSteps.containsKey(workflowId)) {
      Runtime.trap("Approval step not found");
    };

    let step = switch (approvalSteps.get(workflowId)) {
      case (null) { Runtime.trap("Approval step not found") };
      case (?s) { s };
    };

    let updatedStep : ApprovalStep = {
      step with status;
      decidedAt = ?Time.now();
      comments;
    };
    approvalSteps.add(workflowId, updatedStep);
  };

  public shared ({ caller }) func deleteApprovalStep(workflowId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete approval steps");
    };
    if (approvalSteps.containsKey(workflowId)) {
      approvalSteps.remove(workflowId);
    } else {
      Runtime.trap("Approval step does not exist");
    };
  };

  // Contract Comment CRUD
  public shared ({ caller }) func createContractComment(contractId : Text, versionRef : ?Text, author : Text, body : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create comments");
    };
    let comment : ContractComment = {
      id = nextCommentId;
      contractId;
      versionRef;
      author;
      body;
      timestamp = Time.now();
      resolved = false;
    };
    contractComments.add(nextCommentId, comment);
    let id = nextCommentId;
    nextCommentId += 1;
    id;
  };

  public query ({ caller }) func getCommentsByContract(contractId : Text) : async [ContractComment] {
    contractComments.values().toArray().filter(
      func(c) { c.contractId == contractId }
    ).sort(ContractComment.compareByTimestamp);
  };

  public shared ({ caller }) func updateCommentResolved(id : Nat, resolved : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update comments");
    };
    let comment = switch (contractComments.get(id)) {
      case (null) { Runtime.trap("Comment not found") };
      case (?c) { c };
    };
    let updated : ContractComment = { comment with resolved };
    contractComments.add(id, updated);
  };

  public shared ({ caller }) func deleteContractComment(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete comments");
    };
    if (contractComments.containsKey(id)) {
      contractComments.remove(id);
    } else {
      Runtime.trap("Comment does not exist");
    };
  };

  // Managed User CRUD
  public shared ({ caller }) func createManagedUser(id : Text, email : Text, name : Text, role : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let user : ManagedUser = {
      id;
      email;
      name;
      role;
      status = #active;
      invitedAt = Time.now();
      joinedAt = null;
    };
    managedUsers.add(id, user);
  };

  public query ({ caller }) func listManagedUsers() : async [ManagedUser] {
    managedUsers.values().toArray();
  };

  public query ({ caller }) func getManagedUser(id : Text) : async ?ManagedUser {
    managedUsers.get(id);
  };

  public shared ({ caller }) func updateManagedUserRole(id : Text, role : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let user = switch (managedUsers.get(id)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };
    managedUsers.add(id, { user with role });
  };

  public shared ({ caller }) func updateManagedUserStatus(id : Text, status : ManagedUserStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let user = switch (managedUsers.get(id)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };
    managedUsers.add(id, { user with status });
  };

  public shared ({ caller }) func deleteManagedUser(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (managedUsers.containsKey(id)) {
      managedUsers.remove(id);
    } else {
      Runtime.trap("User does not exist");
    };
  };
};
