import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ManagedUser } from "../contexts/LocalStore";
import { useLocalStore } from "../contexts/LocalStore";

const ROLES = [
  "Legal Admin",
  "Procurement Manager",
  "Department Owner",
  "Finance Reviewer",
  "Executive Approver",
  "Compliance Officer",
  "Read-Only Stakeholder",
  "System Administrator",
];

function fmtDate(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2)
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function UsersPage() {
  const {
    managedUsers,
    inviteUser,
    updateUserRole,
    updateUserStatus,
    deleteManagedUser,
  } = useLocalStore();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    role: "",
  });
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});

  const [suspendTarget, setSuspendTarget] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  function validateInvite() {
    const errs: Record<string, string> = {};
    if (!inviteForm.email.trim()) errs.email = "Email is required.";
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(inviteForm.email))
      errs.email = "Enter a valid email.";
    if (!inviteForm.name.trim()) errs.name = "Name is required.";
    if (!inviteForm.role) errs.role = "Role is required.";
    return errs;
  }

  function handleInviteSubmit() {
    const errs = validateInvite();
    if (Object.keys(errs).length > 0) {
      setInviteErrors(errs);
      return;
    }
    const newUser: ManagedUser = {
      id: `u${Date.now()}`,
      email: inviteForm.email.trim(),
      name: inviteForm.name.trim(),
      role: inviteForm.role,
      status: "active",
      invitedAt: Date.now(),
      joinedAt: null,
    };
    inviteUser(newUser);
    toast.success(`Invitation sent to ${newUser.email}`);
    setInviteOpen(false);
    setInviteForm({ email: "", name: "", role: "" });
    setInviteErrors({});
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage team members, roles, and access.
          </p>
        </div>
        <Button
          data-ocid="users.open_modal_button"
          onClick={() => setInviteOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </Button>
      </div>

      {/* Desktop table */}
      <div
        data-ocid="users.table"
        className="hidden md:block bg-white rounded-lg border border-slate-200 overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-200">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-2.5 px-4">
                Name
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-2.5 px-4">
                Email
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-2.5 px-4">
                Role
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-2.5 px-4">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-2.5 px-4">
                Joined
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 py-2.5 px-4 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managedUsers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  data-ocid="users.empty_state"
                  className="text-center py-12 text-slate-400 text-sm"
                >
                  No users found. Invite someone to get started.
                </TableCell>
              </TableRow>
            )}
            {managedUsers.map((user, idx) => (
              <TableRow
                key={user.id}
                data-ocid={`users.item.${idx + 1}`}
                className="hover:bg-slate-50"
              >
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${avatarColor(user.name)}`}
                    >
                      {getInitials(user.name)}
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                      {user.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-slate-500">
                  {user.email}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Select
                    value={user.role}
                    onValueChange={(v) => {
                      updateUserRole(user.id, v);
                      toast.success(`Role updated to ${v}`);
                    }}
                  >
                    <SelectTrigger
                      data-ocid={`users.role_select.${idx + 1}`}
                      className="h-7 text-xs w-44 border-slate-200"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="text-xs">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="px-4 py-3">
                  {user.status === "active" ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium hover:bg-emerald-50">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-medium hover:bg-slate-100">
                      Suspended
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-xs text-slate-400">
                  {fmtDate(user.joinedAt)}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      data-ocid={`users.toggle.${idx + 1}`}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2.5 border-slate-200"
                      onClick={() => setSuspendTarget(user)}
                    >
                      {user.status === "active" ? "Suspend" : "Reactivate"}
                    </Button>
                    <Button
                      data-ocid={`users.delete_button.${idx + 1}`}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2.5 border-slate-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => setDeleteTarget(user)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {managedUsers.length === 0 && (
          <div
            data-ocid="users.empty_state"
            className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-400 text-sm"
          >
            No users found. Invite someone to get started.
          </div>
        )}
        {managedUsers.map((user, idx) => (
          <div
            key={user.id}
            data-ocid={`users.item.${idx + 1}`}
            className="bg-white rounded-lg border border-slate-200 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor(user.name)}`}
                >
                  {getInitials(user.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
              {user.status === "active" ? (
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] hover:bg-emerald-50">
                  Active
                </Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-500 border border-slate-200 text-[11px] hover:bg-slate-100">
                  Suspended
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Select
                value={user.role}
                onValueChange={(v) => {
                  updateUserRole(user.id, v);
                  toast.success(`Role updated to ${v}`);
                }}
              >
                <SelectTrigger
                  data-ocid={`users.role_select.${idx + 1}`}
                  className="h-7 text-xs w-40 border-slate-200"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1.5">
                <Button
                  data-ocid={`users.toggle.${idx + 1}`}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-2.5 border-slate-200"
                  onClick={() => setSuspendTarget(user)}
                >
                  {user.status === "active" ? "Suspend" : "Reactivate"}
                </Button>
                <Button
                  data-ocid={`users.delete_button.${idx + 1}`}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs px-2.5 border-slate-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  onClick={() => setDeleteTarget(user)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent data-ocid="users.dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Invite User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-name" className="text-xs font-medium">
                Full Name
              </Label>
              <Input
                id="invite-name"
                data-ocid="users.invite_name.input"
                placeholder="Jane Smith"
                value={inviteForm.name}
                onChange={(e) =>
                  setInviteForm((p) => ({ ...p, name: e.target.value }))
                }
                className="h-8 text-sm"
              />
              {inviteErrors.name && (
                <p
                  data-ocid="users.invite_name.error_state"
                  className="text-xs text-rose-600"
                >
                  {inviteErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-xs font-medium">
                Email Address
              </Label>
              <Input
                id="invite-email"
                data-ocid="users.invite_email.input"
                type="email"
                placeholder="jane@company.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((p) => ({ ...p, email: e.target.value }))
                }
                className="h-8 text-sm"
              />
              {inviteErrors.email && (
                <p
                  data-ocid="users.invite_email.error_state"
                  className="text-xs text-rose-600"
                >
                  {inviteErrors.email}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role" className="text-xs font-medium">
                Role
              </Label>
              <Select
                value={inviteForm.role}
                onValueChange={(v) => setInviteForm((p) => ({ ...p, role: v }))}
              >
                <SelectTrigger
                  id="invite-role"
                  data-ocid="users.invite_role.select"
                  className="h-8 text-sm"
                >
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-sm">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {inviteErrors.role && (
                <p
                  data-ocid="users.invite_role.error_state"
                  className="text-xs text-rose-600"
                >
                  {inviteErrors.role}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              data-ocid="users.invite.cancel_button"
              variant="outline"
              size="sm"
              onClick={() => {
                setInviteOpen(false);
                setInviteErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="users.invite.submit_button"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleInviteSubmit}
            >
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend / Reactivate confirmation */}
      <AlertDialog
        open={!!suspendTarget}
        onOpenChange={(o) => !o && setSuspendTarget(null)}
      >
        <AlertDialogContent data-ocid="users.suspend.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              {suspendTarget?.status === "active"
                ? "Suspend User"
                : "Reactivate User"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {suspendTarget?.status === "active"
                ? `Suspending ${suspendTarget?.name} will revoke their access immediately.`
                : `This will restore access for ${suspendTarget?.name}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="users.suspend.cancel_button"
              onClick={() => setSuspendTarget(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="users.suspend.confirm_button"
              className={
                suspendTarget?.status === "active"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
              onClick={() => {
                if (!suspendTarget) return;
                const newStatus =
                  suspendTarget.status === "active" ? "suspended" : "active";
                updateUserStatus(suspendTarget.id, newStatus);
                toast.success(
                  newStatus === "suspended"
                    ? `${suspendTarget.name} has been suspended.`
                    : `${suspendTarget.name} has been reactivated.`,
                );
                setSuspendTarget(null);
              }}
            >
              {suspendTarget?.status === "active" ? "Suspend" : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="users.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to permanently delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="users.delete.cancel_button"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="users.delete.confirm_button"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => {
                if (!deleteTarget) return;
                deleteManagedUser(deleteTarget.id);
                toast.success(`${deleteTarget.name} has been removed.`);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
