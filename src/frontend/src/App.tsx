import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppLayout } from "./components/AppLayout";
import { AuthGuard } from "./components/AuthGuard";
import { AuthProvider } from "./contexts/AuthContext";
import { LocalStoreProvider } from "./contexts/LocalStore";
import Approvals from "./pages/Approvals";
import AuditLog from "./pages/AuditLog";
import CalendarPage from "./pages/CalendarPage";
import ContractDetail from "./pages/ContractDetail";
import Contracts from "./pages/Contracts";
import Counterparties from "./pages/Counterparties";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import Obligations from "./pages/Obligations";
import Reports from "./pages/Reports";
import SearchPage from "./pages/SearchPage";
import Settings from "./pages/Settings";
import Templates from "./pages/Templates";
import UsersPage from "./pages/Users";

// Root: renders Outlet without any layout (login will use its own layout)
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Login route — no AppLayout, no AuthGuard
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Protected layout route — wraps all app routes in AuthGuard + AppLayout
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: () => (
    <AuthGuard>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthGuard>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: Dashboard,
});

const contractsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/contracts",
  component: Contracts,
});

const contractDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/contracts/$contractId",
  component: ContractDetail,
});

const counterpartiesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/counterparties",
  component: Counterparties,
});

const obligationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/obligations",
  component: Obligations,
});

const calendarRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/calendar",
  component: CalendarPage,
});

const searchRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/search",
  component: SearchPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/reports",
  component: Reports,
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: Settings,
});

const auditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/audit",
  component: AuditLog,
});

const approvalsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/approvals",
  component: Approvals,
});

const templatesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/templates",
  component: Templates,
});

const usersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/users",
  component: UsersPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([
    indexRoute,
    contractsRoute,
    contractDetailRoute,
    counterpartiesRoute,
    obligationsRoute,
    calendarRoute,
    searchRoute,
    reportsRoute,
    settingsRoute,
    auditRoute,
    approvalsRoute,
    templatesRoute,
    usersRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <LocalStoreProvider>
        <RouterProvider router={router} />
        <Toaster />
      </LocalStoreProvider>
    </AuthProvider>
  );
}
