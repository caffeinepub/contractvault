# ContractVault Phase 10

## Current State

ContractVault is a full-stack contract management system with:
- 13 routes: Dashboard, Contracts (list + detail), Counterparties, Obligations, Calendar, Search, Reports, Settings, Audit Log, Approvals, Templates, Login
- Backend: Contracts, Counterparties, Obligations, Tags, Timeline Events, Approval Workflows/Steps, File Storage, Authorization
- Frontend: LocalStore context for in-memory state, seed data for contracts/counterparties/templates, auth session management
- Roles: Legal Admin, Procurement Manager, Department Owner, Finance Reviewer, Executive Approver, Compliance Officer, Read-Only Stakeholder, System Administrator
- Auth: magic-link login flow with session managed in AuthContext

## Requested Changes (Diff)

### Add

1. **Contract Negotiation Workflow**
   - Comment threads on contract versions: users can leave threaded comments on any version in the Versions tab of a contract
   - Each comment has: author (current session user), timestamp, body text, and a resolved/open status
   - "Resolve" action on each thread closes it; resolved threads are collapsed by default
   - Version comparison view: side-by-side diff when two versions exist -- show version metadata (uploaded date, name, uploader) with a placeholder diff panel (since binary docs can't be diffed inline, show a structured comparison of version metadata and clause delta count)

2. **User Management UI (Admin Screen)**
   - New route: `/users` under REPORTS & ADMIN sidebar group
   - Admin-only screen (only visible/accessible when logged-in user has System Administrator role)
   - Table of current users: name, email, role, status (active/suspended), joined date
   - Invite user flow: enter email + select role → sends invite (uses existing email component)
   - Edit user role: inline role selector per row
   - Suspend/reactivate user: toggle per row with confirmation
   - Seed 5 users with different roles for demonstration

3. **Backend support**
   - ContractComment type: id, contractId, versionRef (optional label), author, body, timestamp, resolved
   - CRUD for contract comments
   - ManagedUser type: id (Principal text), email, name, role, status (active/suspended), invitedAt, joinedAt
   - CRUD for managed users: createUser, listUsers, updateUserRole, updateUserStatus, deleteUser

### Modify

- **ContractDetail.tsx** -- Versions tab: add comment thread panel below version list; add "Compare" button when 2+ versions exist that opens a comparison modal
- **AppLayout.tsx (sidebar)** -- Add "Users" nav item under REPORTS & ADMIN group
- **App.tsx** -- Register `/users` route
- **LocalStore.tsx** -- Add comments state and user management state

### Remove

- Nothing removed

## Implementation Plan

1. **Backend**: Add ContractComment and ManagedUser types + full CRUD to main.mo
2. **Frontend - Users page**: New `Users.tsx` page with invite dialog, role editor, suspend/reactivate actions, seeded user data
3. **Frontend - Comment threads**: `CommentThread.tsx` component used within ContractDetail Versions tab -- add/view/resolve comments per version
4. **Frontend - Version comparison**: "Compare Versions" modal on ContractDetail showing side-by-side version metadata and clause count delta
5. **Frontend - Wiring**: Register route, add sidebar link, extend LocalStore with comments and users state
6. **Data**: Seed 5 users across roles, seed 3–4 comments on existing contracts
