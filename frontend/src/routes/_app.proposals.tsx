import { createFileRoute, useLoaderData, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, StageBadge } from "@/components/crm/primitives";
import { ProposalDialog } from "@/components/crm/ProposalDialog";
import { getProposals } from "@/lib/api/proposals.functions";
import { showToast } from "@/lib/ui";
import { fmtMoney, timeAgo } from "@/lib/crm-data";
import { Check, Eye, FileText, X } from "lucide-react";

export const Route = createFileRoute("/_app/proposals")({
  head: () => ({ meta: [{ title: "Proposals · Agentic CRM" }] }),
  loader: () => getProposals(),
  component: Proposals,
});

function Proposals() {
  const proposals = useLoaderData({ from: "/_app/proposals" });
  const router = useRouter();
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);

  return (
    <div>
      <PageHeader
        eyebrow="Module H2 · Proposal Drafting Agent"
        title="Proposals"
        description="Agent H2 drafts proposals from opportunity context and template library. Human gate on review status."
      />
      <div className="p-8 grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-3">
          {proposals.map((p: any) => (
            <div key={p.id} className="surface-card p-5 hover:border-primary/30 transition">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/30 to-teal/30 border border-border grid place-items-center">
                  <FileText className="h-5 w-5 text-primary"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{p.company}</div>
                    <StageBadge stage={p.status}/>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.contactName} · {p.template}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-semibold">{fmtMoney(p.amount)}</div>
                  <button onClick={() => setSelectedProposal(p)} className="mt-3 h-8 px-3 rounded-md border border-border bg-surface text-xs font-medium inline-flex items-center gap-1 hover:bg-surface-2">
                    <Eye className="h-3.5 w-3.5"/> View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ProposalDialog 
        proposal={selectedProposal} 
        onClose={() => setSelectedProposal(null)}
        onRefresh={() => router.invalidate()}
      />
    </div>
  );
}
