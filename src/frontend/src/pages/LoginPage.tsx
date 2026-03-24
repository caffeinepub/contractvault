import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { FileText, Zap } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const DEMO_USERS = [
  { name: "Jane Doe", email: "jane.doe@acmecorp.com", role: "Legal Admin" },
  {
    name: "Tom Walsh",
    email: "tom.walsh@acmecorp.com",
    role: "Procurement Manager",
  },
  {
    name: "Sarah Chen",
    email: "sarah.chen@acmecorp.com",
    role: "Executive Approver",
  },
  {
    name: "Marcus Hill",
    email: "marcus.hill@acmecorp.com",
    role: "Finance Reviewer",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setTimeout(() => {
      setStatus("sent");
      login(email);
      navigate({ to: "/" });
    }, 500);
  };

  const handleDemoLogin = (demoUser: (typeof DEMO_USERS)[0]) => {
    login(demoUser.email, demoUser);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              ContractVault
            </span>
          </div>
        </div>

        {/* Demo Login */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">
              Quick Demo Access
            </span>
          </div>
          <p className="text-xs text-amber-700 mb-3">
            Sign in instantly as a demo user to explore the app.
          </p>
          <div className="space-y-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                data-ocid="login.demo_button"
                onClick={() => handleDemoLogin(u)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-left"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    {u.name}
                  </div>
                  <div className="text-xs text-slate-500">{u.role}</div>
                </div>
                <span className="text-xs text-amber-600 font-medium">
                  Enter →
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Magic Link Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-8 py-6">
          <h1 className="text-base font-semibold text-slate-900 mb-1">
            Or sign in with email
          </h1>
          <p className="text-xs text-slate-500 mb-4">
            Enter your work email to receive a sign-in link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="jane.doe@acmecorp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-ocid="login.email_input"
              className="h-9 text-sm"
              disabled={status === "sending"}
            />
            <Button
              type="submit"
              data-ocid="login.submit_button"
              disabled={status === "sending" || !email.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-sm font-medium"
            >
              {status === "sending" ? (
                <span data-ocid="login.loading_state">Sending...</span>
              ) : (
                "Send Magic Link"
              )}
            </Button>
          </form>

          {status === "sent" && (
            <div
              data-ocid="login.success_state"
              className="mt-3 text-center text-xs text-emerald-600 font-medium"
            >
              ✓ Link sent! Redirecting…
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Secure, sovereignty-first contract management.
        </p>
      </div>
    </div>
  );
}
