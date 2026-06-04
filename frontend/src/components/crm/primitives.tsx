import { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="border-b border-border bg-gradient-to-b from-surface/40 to-transparent">
      <div className="px-8 py-7 flex items-end gap-6">
        <div className="flex-1">
          <div className="label-eyebrow">{eyebrow}</div>
          <h1 className="text-3xl font-semibold tracking-tight mt-1.5">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function StatCard({ label, value, delta, hint, accent="primary" }: { label: string; value: ReactNode; delta?: string; hint?: string; accent?: "primary" | "teal" | "coral" | "amber" }) {
  const accentMap: Record<string,string> = {
    primary: "from-primary/30 to-transparent",
    teal: "from-teal/30 to-transparent",
    coral: "from-coral/30 to-transparent",
    amber: "from-amber/30 to-transparent",
  };
  return (
    <div className="surface-card p-5 relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accentMap[accent]}`} />
      <div className="label-eyebrow">{label}</div>
      <div className="mt-2 text-3xl font-semibold font-mono tracking-tight">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta && <span className="text-teal font-medium">{delta}</span>}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

const stageColor: Record<string, string> = {
  prospect: "bg-muted text-muted-foreground",
  qualified: "bg-primary/15 text-primary border-primary/30",
  engaged: "bg-amber/15 text-amber border-amber/30",
  opportunity: "bg-teal/15 text-teal border-teal/30",
  customer: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  advocate: "bg-gradient-to-r from-primary/20 to-teal/20 text-foreground border-primary/30",
  identified: "bg-muted text-muted-foreground",
  proposal_sent: "bg-primary/15 text-primary border-primary/30",
  negotiation: "bg-amber/15 text-amber border-amber/30",
  closed_won: "bg-teal/15 text-teal border-teal/30",
  closed_lost: "bg-coral/15 text-coral border-coral/30",
  drafting: "bg-muted text-muted-foreground",
  review: "bg-amber/15 text-amber border-amber/30",
  sent: "bg-primary/15 text-primary border-primary/30",
  accepted: "bg-teal/15 text-teal border-teal/30",
  rejected: "bg-coral/15 text-coral border-coral/30",
  queued: "bg-primary/15 text-primary border-primary/30",
  executed: "bg-teal/15 text-teal border-teal/30",
  skipped: "bg-muted text-muted-foreground",
  low: "bg-teal/15 text-teal border-teal/30",
  medium: "bg-amber/15 text-amber border-amber/30",
  high: "bg-coral/15 text-coral border-coral/30",
  succeeded: "bg-teal/15 text-teal border-teal/30",
  running: "bg-primary/15 text-primary border-primary/30",
  needs_review: "bg-amber/15 text-amber border-amber/30",
  failed: "bg-coral/15 text-coral border-coral/30",
  pending: "bg-muted text-muted-foreground",
  resolved: "bg-teal/15 text-teal border-teal/30",
};

export function StageBadge({ stage }: { stage: string }) {
  const cls = stageColor[stage] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border text-[11px] font-medium capitalize ${cls}`}>
      {stage.replace(/_/g, " ")}
    </span>
  );
}

export function HealthBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-teal" : value >= 60 ? "bg-primary" : value >= 40 ? "bg-amber" : "bg-coral";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-surface-2 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground tabular-nums w-7">{value}</span>
    </div>
  );
}

export function Avatar({ name, hue }: { name: string; hue: number }) {
  const initials = name.split(" ").map(s => s[0]).slice(0,2).join("");
  return (
    <div
      className="h-8 w-8 rounded-full grid place-items-center text-[11px] font-semibold text-foreground border border-border"
      style={{
        background: `linear-gradient(135deg, oklch(0.45 0.12 ${hue}), oklch(0.32 0.08 ${(hue+40)%360}))`,
      }}
    >
      {initials}
    </div>
  );
}
