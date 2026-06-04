import { createFileRoute, useLoaderData, useRouter } from "@tanstack/react-router";
import { PageHeader, StageBadge } from "@/components/crm/primitives";
import { getPipelineData, updateOpportunityStage } from "@/lib/api/pipeline.functions";
import { showToast } from "@/lib/ui";
import { fmtMoney } from "@/lib/crm-data";
import { GripVertical, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_app/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline · Agentic CRM" }] }),
  loader: () => getPipelineData(),
  component: Pipeline,
});

function Pipeline() {
  const opportunities = useLoaderData({ from: "/_app/pipeline" });
  const router = useRouter();

  const handleStageChange = async (opportunityId: string, newStage: string) => {
    const toastId = showToast.loading("Moving opportunity...");
    const result = await updateOpportunityStage({ data: { opportunityId, newStage } });
    if (result.success) {
      showToast.success("Opportunity moved successfully", { id: toastId });
      router.invalidate();
    } else {
      showToast.error("Failed to move opportunity", { id: toastId });
    }
  };

  const pipelineStages = [
    { key: "identified", label: "Identified" },
    { key: "qualified", label: "Qualified" },
    { key: "proposal_sent", label: "Proposal Sent" },
    { key: "negotiation", label: "Negotiation" },
    { key: "closed_won", label: "Closed Won" },
    { key: "closed_lost", label: "Closed Lost" }
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Module H · Opportunity & Pipeline Manager"
        title="Deal pipeline"
        description="Stage progression governed by Agent H1. Human gates on stage moves into Negotiation and Closed-Won."
      />
      <div className="p-8">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map(stage => {
            const items = opportunities.filter((o: any) => o.stage === stage.key);
            const total = items.reduce((a: number, o: any) => a + Number(o.estimated_value || 0), 0);
            return (
              <div key={stage.key} className="w-[300px] shrink-0 surface-card flex flex-col">
                <div className="p-3.5 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        stage.key==="closed_won"?"bg-teal":stage.key==="negotiation"?"bg-amber":"bg-primary"
                      }`} />
                      {stage.label}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">{fmtMoney(total)}</div>
                </div>
                <div className="p-2 space-y-2 flex-1 min-h-[200px]">
                  {items.map((o: any) => (
                    <div
                      key={o.id}
                      className="block p-3 rounded-md bg-surface-2/60 border border-border hover:border-primary/40 hover:bg-surface-2 transition group"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 opacity-0 group-hover:opacity-100"/>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">{o.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{fmtMoney(Number(o.estimated_value || 0))}</div>
                          <div className="mt-3">
                            <select 
                              className="text-[11px] w-full px-2 py-1.5 bg-surface border border-border rounded hover:bg-surface-2 focus:outline-none focus:ring-1 focus:ring-primary"
                              value={o.stage}
                              onChange={(e) => handleStageChange(o.id, e.target.value)}
                            >
                              {pipelineStages.map(s => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
