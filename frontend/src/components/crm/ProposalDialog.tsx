import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtMoney, timeAgo } from "@/lib/crm-data";
import { StageBadge } from "./primitives";
import { showToast } from "@/lib/ui";
import { approveProposal, rejectProposal } from "@/lib/api/proposals.functions";
import { Bot, Check, FileText, Send, X } from "lucide-react";

export function ProposalDialog({ proposal, onClose, onRefresh }: { proposal: any | null; onClose: () => void, onRefresh: () => void }) {
  if (!proposal) return null;

  async function act(action: "approved" | "rejected" | "sent", msg: string) {
    const toastId = showToast.loading(msg);
    let result;
    if (action === "approved") {
        result = await approveProposal({ data: { proposalId: proposal.id } });
    } else {
        result = await rejectProposal({ data: { proposalId: proposal.id } });
    }
    
    if (result.success) {
      showToast.success(msg, { id: toastId });
      onRefresh();
      onClose();
    } else {
      showToast.error("Failed to perform action", { id: toastId });
    }
  }

  return (
    <Dialog open={!!proposal} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-surface border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-primary/30 to-teal/30 border border-border grid place-items-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {proposal.company}
                <StageBadge stage={proposal.status} />
              </DialogTitle>
              <DialogDescription>
                {proposal.contactName} · {proposal.template} · {fmtMoney(proposal.amount)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <div className="p-3 rounded-md border border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 text-xs">
              <Bot className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary font-medium">Agent H2 · drafting trace</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground italic">
              "Selected template {proposal.template}. Pricing derived from tiered model."
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          {proposal.status === "review" ? (
            <>
              <button onClick={() => act("rejected", "Proposal rejected")} className="h-9 px-3 rounded-md border border-coral/40 bg-coral/10 text-coral text-sm inline-flex items-center gap-1.5">
                <X className="h-4 w-4" /> Reject
              </button>
              <button onClick={() => act("approved", "Proposal approved")} className="h-9 px-4 rounded-md bg-teal text-teal-foreground text-sm font-medium inline-flex items-center gap-1.5">
                <Check className="h-4 w-4" /> Approve
              </button>
            </>
          ) : (
            <button onClick={onClose} className="h-9 px-4 rounded-md border border-border bg-surface text-sm">Close</button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
