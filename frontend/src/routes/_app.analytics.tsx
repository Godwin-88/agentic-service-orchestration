import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/crm/primitives";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics · Agentic CRM" }] }),
  component: Analytics,
});

function Analytics() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        eyebrow="Module L · Unified Intelligence"
        title="Analytics & Reporting"
        description="Real-time performance metrics and business intelligence powered by Metabase."
      />
      <div className="flex-1 p-8">
        <div className="w-full h-[calc(100vh-250px)] rounded-xl border border-border bg-surface-card overflow-hidden">
          <iframe
            src="http://localhost:3001"
            className="w-full h-full border-none"
            title="Metabase Dashboard"
          />
        </div>
      </div>
    </div>
  );
}
