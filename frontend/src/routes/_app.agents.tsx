import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StageBadge } from "@/components/crm/primitives";
import { agentRuns, timeAgo } from "@/lib/crm-data";
import { Bot, ChevronRight, Cpu, Wrench } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/agents")({
  head: () => ({ meta: [{ title: "Agents · Agentic CRM" }] }),
  component: Agents,
});

function Agents() {
  const [selected, setSelected] = useState(agentRuns[0].id);
  const active = agentRuns.find(a => a.id === selected) ?? agentRuns[0];

  return (
    <div>
      <PageHeader
        eyebrow="LangGraph runtime · FastAPI"
        title="Agent reasoning traces"
        description="Every autonomous decision is logged with the LLM thought, tools invoked, and outputs. Manager audit view."
      />
      <div className="p-8 grid grid-cols-5 gap-6">
        {/* Runs list */}
        <div className="col-span-2 surface-card overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary"/>
            <div className="font-semibold text-sm">Recent runs</div>
            <span className="ml-auto text-[10px] text-muted-foreground font-mono">{agentRuns.length} entries</span>
          </div>
          <div className="overflow-y-auto">
            {agentRuns.map(a => (
              <button
                key={a.id}
                onClick={()=>setSelected(a.id)}
                className={`w-full text-left p-4 border-b border-border hover:bg-surface-2/40 transition ${a.id===selected?"bg-surface-2/60":""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary/30 to-teal/30 grid place-items-center border border-border">
                      <Bot className="h-3.5 w-3.5 text-primary"/>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{a.agent}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{a.graph}</div>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition ${a.id===selected?"text-primary translate-x-0.5":""}`}/>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <StageBadge stage={a.status}/>
                  <span className="text-muted-foreground font-mono">{timeAgo(a.startedAt)}</span>
                  <span className="text-muted-foreground font-mono ml-auto">{a.duration.toFixed(1)}s · {a.tokens.toLocaleString()} tok</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Trace */}
        <div className="col-span-3 surface-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="label-eyebrow">Trace</div>
              <div className="text-lg font-semibold mt-1">{active.agent}</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">{active.graph} · {new Date(active.startedAt).toLocaleString()}</div>
            </div>
            <StageBadge stage={active.status}/>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="p-3 rounded-md bg-surface-2/40 border border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Duration</div>
              <div className="font-mono font-semibold mt-1">{active.duration.toFixed(2)}s</div>
            </div>
            <div className="p-3 rounded-md bg-surface-2/40 border border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Tokens</div>
              <div className="font-mono font-semibold mt-1">{active.tokens.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-md bg-surface-2/40 border border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cost (est.)</div>
              <div className="font-mono font-semibold mt-1">${(active.tokens*0.000003).toFixed(3)}</div>
            </div>
          </div>

          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-4">
              {active.trace.map((t, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                  <div className="flex items-center gap-2">
                    <code className="text-xs px-1.5 py-0.5 rounded bg-surface-2 border border-border text-teal">{t.step}</code>
                    {t.tool && <code className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 border border-primary/30 text-primary inline-flex items-center gap-1"><Wrench className="h-2.5 w-2.5"/>{t.tool}</code>}
                  </div>
                  <div className="text-sm text-foreground/90 mt-1.5">{t.thought}</div>
                  {t.output && (
                    <div className="mt-1.5 text-xs font-mono p-2 rounded bg-surface-2/60 border border-border text-muted-foreground">
                      → {t.output}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {active.status === "needs_review" && (
            <div className="mt-6 p-4 rounded-md border border-amber/40 bg-amber/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-amber">Human gate engaged</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Agent self-flagged for review; awaiting manager confirmation.</div>
                </div>
                <div className="flex gap-2">
                  <button className="h-8 px-3 rounded text-xs border border-border bg-surface">Reject</button>
                  <button className="h-8 px-3 rounded text-xs bg-teal text-teal-foreground font-medium">Approve & send</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
