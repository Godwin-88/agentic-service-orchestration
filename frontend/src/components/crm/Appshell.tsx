import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, GitBranch, FileText, Activity, Bot, Bell, Search, Sparkles, ShieldCheck, Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard, mod: "K" },
  { to: "/contacts", label: "Contacts", icon: Users, mod: "G" },
  { to: "/pipeline", label: "Pipeline", icon: GitBranch, mod: "H" },
  { to: "/proposals", label: "Proposals", icon: FileText, mod: "H2" },
  { to: "/content", label: "Content", icon: Calendar, mod: "C" },
  { to: "/workflows", label: "Workflows", icon: GitBranch, mod: "A" },
  { to: "/follow-ups", label: "Follow-ups", icon: Activity, mod: "I" },
  { to: "/retention", label: "Retention", icon: ShieldCheck, mod: "J" },
  { to: "/agents", label: "Agents", icon: Bot, mod: "Λ" },
];

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen w-full flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-sidebar/80 backdrop-blur-md flex flex-col">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-teal grid place-items-center glow-ring">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Agentic CRM</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">v1.0 · Hub Augment</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <div className="label-eyebrow px-3 mb-2">Modules</div>
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="navActive"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-primary"
                    transition={{ type:"spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                <span className="flex-1">{item.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground/70">{item.mod}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="surface-card p-3 text-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
              <span className="font-medium text-foreground">Agent fleet healthy</span>
            </div>
            <div className="text-muted-foreground">4 graphs online · 1 needs review</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-border bg-background/60 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="text-primary">DICM-1</span>
            <span>·</span>
            <span>Digital Service Orchestration</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                placeholder="Search contacts, accounts, agents…"
                className="h-9 w-80 pl-8 pr-3 rounded-md bg-surface border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <button className="h-9 w-9 grid place-items-center rounded-md border border-border bg-surface hover:bg-surface-2 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-coral" />
            </button>
            <div className="h-9 px-2 flex items-center gap-2 rounded-md border border-border bg-surface">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-teal grid place-items-center text-[10px] font-semibold">MR</div>
              <div className="text-xs leading-tight">
                <div className="font-medium">Maya R.</div>
                <div className="text-muted-foreground text-[10px]">Revenue Ops</div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
