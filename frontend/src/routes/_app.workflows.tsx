import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/crm/primitives";
import { triggerN8nWorkflow } from "@/lib/api/n8n.functions";
import { showToast } from "@/lib/ui";
import { Play } from "lucide-react";

export const Route = createFileRoute("/_app/workflows")({
  head: () => ({ meta: [{ title: "Workflows · Agentic CRM" }] }),
  component: Workflows,
});

function Workflows() {
  const workflows = [
    { id: "linkedin-ingestion", name: "Run LinkedIn Ingestion" },
    { id: "whatsapp-opt-in", name: "Trigger WhatsApp Opt-In" }
  ];

  const handleTrigger = async (workflowId: string) => {
    showToast.loading(`Triggering ${workflowId}...`);
    const result = await triggerN8nWorkflow({ data: { workflowId, payload: {} } });
    if (result.success) {
      showToast.success("Workflow triggered successfully");
    } else {
      showToast.error("Failed to trigger workflow");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Module A · Automation Engine"
        title="Workflows"
        description="Manual triggers for your n8n automation workflows."
      />
      <div className="p-8">
        <div className="grid gap-4 max-w-xl">
          {workflows.map(w => (
            <div key={w.id} className="surface-card p-4 flex items-center justify-between">
              <span className="font-medium">{w.name}</span>
              <button 
                onClick={() => handleTrigger(w.id)}
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs inline-flex items-center gap-1.5 hover:bg-primary/90"
              >
                <Play className="h-3.5 w-3.5"/> Trigger
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
