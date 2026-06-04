import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatCard, StageBadge, Avatar, HealthBar } from "@/components/crm/primitives";
import { contacts, opportunities, proposals, followUps, retentionSignals, agentRuns, fmtMoney, timeAgo } from "@/lib/crm-data";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { ArrowUpRight, Bot, ChevronRight, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: "Agentic CRM · Overview" }, { name: "description", content: "Revenue, pipeline and agent activity at a glance." }] }),
  component: Overview,
});

const revenueSeries = [
  { d: "Wk 1", booked: 38, weighted: 62 },
  { d: "Wk 2", booked: 41, weighted: 71 },
  { d: "Wk 3", booked: 52, weighted: 79 },
  { d: "Wk 4", booked: 49, weighted: 88 },
  { d: "Wk 5", booked: 64, weighted: 96 },
  { d: "Wk 6", booked: 71, weighted: 104 },
  { d: "Wk 7", booked: 83, weighted: 118 },
  { d: "Wk 8", booked: 92, weighted: 131 },
];

const lifecycleDist = [
  { name: "prospect", value: 41 },
  { name: "qualified", value: 28 },
  { name: "engaged", value: 22 },
  { name: "opportunity", value: 14 },
  { name: "customer", value: 19 },
  { name: "advocate", value: 7 },
];
const distColors = ["#475569", "oklch(0.65 0.21 280)", "oklch(0.80 0.17 80)", "oklch(0.78 0.16 180)", "oklch(0.60 0.18 320)", "oklch(0.72 0.19 25)"];

function Overview() {
  const pipelineTotal = opportunities.filter(o => !["closed_won","closed_lost"].includes(o.stage)).reduce((a,o) => a+o.amount, 0);
  const weighted = opportunities.filter(o => !["closed_won","closed_lost"].includes(o.stage)).reduce((a,o) => a + o.amount*o.probability, 0);
  const won = opportunities.filter(o => o.stage==="closed_won").reduce((a,o)=>a+o.amount,0);
  const queued = followUps.filter(f => f.status==="queued").length;
  const recentAgents = agentRuns.slice(0,4);

  return (
    <div>
      <PageHeader
        eyebrow="Module K · Revenue Dashboard"
        title="Revenue & agent fleet overview"
        description="End-to-end pulse of contact lifecycle, pipeline, and autonomous follow-up across the hub-augmented CRM."
        actions={
          <button className="h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 inline-flex items-center gap-1.5 glow-ring">
            <Sparkles className="h-4 w-4" /> Run nightly recalc
          </button>
        }
      />

      <div className="p-8 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Weighted pipeline" value={fmtMoney(weighted)} delta="+12.4%" hint="vs last 30d" accent="primary" />
          <StatCard label="Open pipeline" value={fmtMoney(pipelineTotal)} delta="+8.1%" hint="9 active deals" accent="teal" />
          <StatCard label="Won (MTD)" value={fmtMoney(won)} delta="+1 deal" hint="Soliva · retainer" accent="amber" />
          <StatCard label="Autonomous actions queued" value={queued} hint="awaiting send window" accent="coral" />
        </div>

        {/* Chart + dist */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 surface-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="label-eyebrow">Revenue forecast</div>
                <div className="text-lg font-semibold mt-1">Booked vs weighted pipeline · 8 weeks</div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary"/> Weighted</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal"/> Booked</div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={revenueSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gWeighted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.65 0.21 280)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.65 0.21 280)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gBooked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.16 180)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="oklch(0.78 0.16 180)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.03 270)" vertical={false} />
                  <XAxis dataKey="d" stroke="oklch(0.6 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.6 0.02 260)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v)=>`$${v}k`} />
                  <Tooltip contentStyle={{ background: "oklch(0.22 0.028 270)", border: "1px solid oklch(0.32 0.03 270)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="weighted" stroke="oklch(0.65 0.21 280)" fill="url(#gWeighted)" strokeWidth={2} />
                  <Area type="monotone" dataKey="booked" stroke="oklch(0.78 0.16 180)" fill="url(#gBooked)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-card p-5">
            <div className="label-eyebrow">Lifecycle distribution</div>
            <div className="text-lg font-semibold mt-1">131 contacts</div>
            <div className="h-48 mt-3">
              <ResponsiveContainer>
                <BarChart data={lifecycleDist} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} stroke="oklch(0.7 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "oklch(0.26 0.035 272)" }} contentStyle={{ background:"oklch(0.22 0.028 270)", border:"1px solid oklch(0.32 0.03 270)", borderRadius:8, fontSize:12 }} />
                  <Bar dataKey="value" radius={[0,4,4,0]}>
                    {lifecycleDist.map((_, i) => <Cell key={i} fill={distColors[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Lower row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Agent activity */}
          <div className="col-span-2 surface-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="label-eyebrow">Agent fleet · live</div>
                <div className="text-lg font-semibold mt-1">Recent autonomous runs</div>
              </div>
              <Link to="/agents" className="text-xs text-primary hover:underline inline-flex items-center gap-1">View all <ChevronRight className="h-3 w-3"/></Link>
            </div>
            <div className="space-y-2">
              {recentAgents.map(a => (
                <div key={a.id} className="flex items-center gap-4 p-3 rounded-md border border-border bg-surface-2/40 hover:bg-surface-2/70 transition">
                  <div className="h-9 w-9 rounded-md bg-gradient-to-br from-primary/30 to-teal/30 grid place-items-center border border-border">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.agent}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{a.graph} · {timeAgo(a.startedAt)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono tabular-nums">{a.duration.toFixed(1)}s</div>
                  <div className="text-xs text-muted-foreground font-mono tabular-nums">{a.tokens.toLocaleString()} tok</div>
                  <StageBadge stage={a.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Retention signals */}
          <div className="surface-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="label-eyebrow">Retention signals</div>
                <div className="text-lg font-semibold mt-1">Churn risk</div>
              </div>
              <Link to="/retention" className="text-xs text-primary hover:underline inline-flex items-center gap-1">Open <ChevronRight className="h-3 w-3"/></Link>
            </div>
            <div className="space-y-2.5">
              {retentionSignals.slice(0,4).map(r => (
                <div key={r.id} className="p-3 rounded-md border border-border bg-surface-2/40">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium truncate">{r.contactName}</div>
                    <StageBadge stage={r.severity} />
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">{r.detail}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 bg-surface-2 rounded">
                      <div className={`h-full rounded ${r.churnProbability>0.7?"bg-coral":r.churnProbability>0.4?"bg-amber":"bg-teal"}`} style={{ width: `${r.churnProbability*100}%` }} />
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground tabular-nums">{(r.churnProbability*100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top contacts */}
        <div className="surface-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <div className="label-eyebrow">Top contacts by health</div>
              <div className="text-lg font-semibold mt-1">Highest-intent relationships</div>
            </div>
            <Link to="/contacts" className="text-xs text-primary hover:underline inline-flex items-center gap-1">All contacts <ArrowUpRight className="h-3 w-3"/></Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <th className="text-left font-medium px-5 py-2">Contact</th>
                <th className="text-left font-medium px-5 py-2">Company</th>
                <th className="text-left font-medium px-5 py-2">Stage</th>
                <th className="text-left font-medium px-5 py-2">Health</th>
                <th className="text-left font-medium px-5 py-2">Last activity</th>
                <th className="text-left font-medium px-5 py-2">Owner</th>
              </tr>
            </thead>
            <tbody>
              {contacts.slice().sort((a,b)=>b.health-a.health).slice(0,6).map(c => (
                <tr key={c.id} className="border-t border-border hover:bg-surface-2/40">
                  <td className="px-5 py-2.5">
                    <Link to="/contacts/$id" params={{ id: c.id }} className="flex items-center gap-3 hover:text-primary">
                      <Avatar name={c.name} hue={c.avatarHue} />
                      <div>
                        <div className="font-medium text-foreground">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.role}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-2.5 text-muted-foreground">{c.company}</td>
                  <td className="px-5 py-2.5"><StageBadge stage={c.stage}/></td>
                  <td className="px-5 py-2.5"><HealthBar value={c.health} /></td>
                  <td className="px-5 py-2.5 text-muted-foreground text-xs">{timeAgo(c.lastInteraction)}</td>
                  <td className="px-5 py-2.5 text-muted-foreground text-xs">{c.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center text-[11px] text-muted-foreground font-mono py-2">
          <Zap className="h-3 w-3 mr-1.5 text-primary" /> LangGraph · n8n · Claude Sonnet 4 · PostgreSQL · Redis
        </div>
      </div>
    </div>
  );
}
