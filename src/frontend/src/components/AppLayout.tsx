import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  BarChart2,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  LogIn,
  LogOut,
  Menu,
  PenLine,
  ScrollText,
  Search,
  Settings,
  Upload,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocalStore } from "../contexts/LocalStore";

const NAV_GROUPS = [
  {
    label: "CORE",
    items: [
      {
        label: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        ocid: "nav.dashboard_link",
      },
      {
        label: "Contracts",
        href: "/contracts",
        icon: FileText,
        ocid: "nav.contracts_link",
      },
      {
        label: "Counterparties",
        href: "/counterparties",
        icon: Users,
        ocid: "nav.counterparties_link",
      },
      {
        label: "Templates",
        href: "/templates",
        icon: LayoutTemplate,
        ocid: "nav.templates_link",
      },
    ],
  },
  {
    label: "WORKFLOW",
    items: [
      {
        label: "Obligations",
        href: "/obligations",
        icon: CheckSquare,
        ocid: "nav.obligations_link",
      },
      {
        label: "Approvals",
        href: "/approvals",
        icon: ClipboardList,
        ocid: "nav.approvals_link",
      },
      {
        label: "Calendar",
        href: "/calendar",
        icon: Calendar,
        ocid: "nav.calendar_link",
      },
      {
        label: "Search",
        href: "/search",
        icon: Search,
        ocid: "nav.search_link",
      },
    ],
  },
  {
    label: "REPORTS & ADMIN",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart2,
        ocid: "nav.reports_link",
      },
      {
        label: "Audit Log",
        href: "/audit",
        icon: ScrollText,
        ocid: "nav.audit_link",
      },
      {
        label: "Users",
        href: "/users",
        icon: UserCog,
        ocid: "nav.users_link",
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        ocid: "nav.settings_link",
      },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const BOTTOM_NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    ocid: "bottom_nav.dashboard_link",
  },
  {
    label: "Contracts",
    href: "/contracts",
    icon: FileText,
    ocid: "bottom_nav.contracts_link",
  },
  {
    label: "Templates",
    href: "/templates",
    icon: LayoutTemplate,
    ocid: "bottom_nav.templates_link",
  },
  {
    label: "Obligations",
    href: "/obligations",
    icon: CheckSquare,
    ocid: "bottom_nav.obligations_link",
  },
  {
    label: "Approvals",
    href: "/approvals",
    icon: ClipboardList,
    ocid: "bottom_nav.approvals_link",
  },
];

function getPageTitle(pathname: string): string {
  const exact = ALL_NAV_ITEMS.find((n) => n.href === pathname);
  if (exact) return exact.label;
  const prefix = ALL_NAV_ITEMS.filter((n) => n.href !== "/").find((n) =>
    pathname.startsWith(n.href),
  );
  if (prefix) return prefix.label;
  return "ContractVault";
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function EventIcon({ eventType }: { eventType: string }) {
  const cls = "w-3.5 h-3.5 shrink-0";
  if (eventType === "contract_created")
    return <FileText className={`${cls} text-indigo-500`} />;
  if (eventType === "approved")
    return <CheckCircle2 className={`${cls} text-green-500`} />;
  if (eventType === "status_changed")
    return <AlertCircle className={`${cls} text-amber-500`} />;
  if (eventType === "document_uploaded")
    return <Upload className={`${cls} text-blue-500`} />;
  if (eventType === "signature_requested")
    return <PenLine className={`${cls} text-purple-500`} />;
  if (eventType === "user_login")
    return <LogIn className={`${cls} text-slate-400`} />;
  return <Bell className={`${cls} text-slate-400`} />;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function dateGroup(ts: number): "Today" | "Yesterday" | "Earlier" {
  const now = new Date();
  const d = new Date(ts);
  const diffDays = Math.floor(
    (now.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) / 86400000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return "Earlier";
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const location = useLocation();
  return (
    <>
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 px-2.5 pt-3 pb-1.5 font-semibold">
              {group.label}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  data-ocid={item.ocid}
                  onClick={onNavClick}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2.5 rounded-md text-sm font-medium mb-0.5 border-l-2 min-h-[44px]",
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 border-l-indigo-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-l-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      isActive ? "text-indigo-400" : "",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-slate-700/60">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 text-xs">Acme Corp</span>
        </div>
      </div>
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifSheetOpen, setNotifSheetOpen] = useState(false);
  const auth = useAuth();
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useLocalStore();

  // Group notifications by date
  const groups: Record<string, typeof notifications> = {};
  for (const n of notifications) {
    const g = dateGroup(n.timestamp);
    if (!groups[g]) groups[g] = [];
    groups[g].push(n);
  }
  const groupOrder = ["Today", "Yesterday", "Earlier"] as const;

  const initials = auth.user ? getInitials(auth.user.name) : "?";

  const handleSignOut = () => {
    auth.logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-60 bg-slate-900 flex-col shrink-0">
        <div className="h-14 shrink-0 px-4 flex items-center border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-500 rounded-md flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">
              ContractVault
            </span>
          </div>
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-60 p-0 bg-slate-900 border-r border-slate-700/60"
        >
          <div className="h-14 shrink-0 px-4 flex items-center border-b border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-500 rounded-md flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white font-semibold text-sm tracking-tight">
                ContractVault
              </span>
            </div>
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <SidebarContent onNavClick={() => setMobileNavOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center gap-3 px-4 md:px-5 shadow-xs">
          <button
            type="button"
            data-ocid="header.menu_button"
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden flex items-center justify-center w-9 h-9 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="text-sm font-semibold text-slate-800">
            {pageTitle}
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 md:gap-3">
            {/* Notification bell */}
            <button
              type="button"
              data-ocid="header.notifications_button"
              onClick={() => setNotifSheetOpen(true)}
              className="relative p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-0.5 leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Sheet */}
            <Sheet open={notifSheetOpen} onOpenChange={setNotifSheetOpen}>
              <SheetContent
                side="right"
                data-ocid="header.notifications_sheet"
                className="w-[360px] p-0 flex flex-col"
              >
                <SheetHeader className="px-4 py-3 border-b border-slate-200 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SheetTitle className="text-sm font-semibold text-slate-900">
                        Notifications
                      </SheetTitle>
                      {unreadCount > 0 && (
                        <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full px-2 py-0.5">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        data-ocid="header.mark_all_read_button"
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100"
                      >
                        Mark all read
                      </button>
                      <button
                        type="button"
                        data-ocid="header.clear_notifications_button"
                        onClick={clearNotifications}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                        aria-label="Clear all notifications"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                  {notifications.length === 0 ? (
                    <div
                      data-ocid="header.notifications.empty_state"
                      className="flex flex-col items-center justify-center py-16 text-slate-400"
                    >
                      <Bell className="w-8 h-8 mb-3 text-slate-300" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {groupOrder.map((group) => {
                        const items = groups[group];
                        if (!items || items.length === 0) return null;
                        return (
                          <div key={group}>
                            <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold bg-slate-50 border-b border-slate-100">
                              {group}
                            </div>
                            {items.map((notif, idx) => (
                              <button
                                type="button"
                                key={notif.id}
                                data-ocid={`header.notification_item.${idx + 1}`}
                                onClick={() => markNotificationRead(notif.id)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  markNotificationRead(notif.id)
                                }
                                className={cn(
                                  "w-full text-left flex items-start gap-2.5 px-4 py-2.5 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50",
                                  !notif.read && "bg-indigo-50/40",
                                )}
                              >
                                <div className="mt-0.5 shrink-0">
                                  <EventIcon eventType={notif.eventType} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] text-slate-700 leading-snug">
                                    {notif.description}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[11px] text-slate-400">
                                      {notif.actor}
                                    </span>
                                    <span className="text-[11px] text-slate-300">
                                      ·
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                      {relativeTime(notif.timestamp)}
                                    </span>
                                  </div>
                                </div>
                                {/* Unread indicator dot */}
                                <div className="mt-1.5 shrink-0">
                                  <div
                                    className={cn(
                                      "w-2 h-2 rounded-full",
                                      notif.read
                                        ? "bg-transparent border border-slate-300"
                                        : "bg-indigo-500",
                                    )}
                                  />
                                </div>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger
                data-ocid="header.avatar_button"
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold shrink-0 ring-2 ring-indigo-200">
                  {initials}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {auth.user && (
                  <div className="px-3 py-2.5">
                    <div className="text-sm font-semibold text-slate-900">
                      {auth.user.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {auth.user.email}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {auth.user.role}
                    </div>
                  </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-ocid="header.sign_out_button"
                  onClick={handleSignOut}
                  className="text-sm text-slate-600 cursor-pointer gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      </div>

      {/* Bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex z-40">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              data-ocid={item.ocid}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-xs font-medium",
                isActive
                  ? "text-indigo-600"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  isActive ? "text-indigo-600" : "text-slate-400",
                )}
              />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
