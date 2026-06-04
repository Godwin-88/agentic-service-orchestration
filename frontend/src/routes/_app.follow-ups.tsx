import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StageBadge } from "@/components/crm/primitives";
import { followUps } from "@/lib/crm-data";
import { Bot, Calendar, Check, Pause, Send } from "lucide-react";

export const Route = createFileRoute("/_app/follow-ups")({
  head: () => ({ meta: [{ title: "Follow-ups · Agentic CRM" }] }),
  component: FollowUps,
});

function FollowUps() {
  return (
    <div>
      <PageHeader
        eyebrow="Module I · Autonomous Follow-Up Engine"
        title="Autonomous follow-ups"
        description="Next-Best-Action agent decides channel, message, and timing. Frequency caps + opt-out enforced."
        actions={
          <>
            <button className="h-9 px-3 rounded-md border border-border bg-surface text-sm inline-flex items-center gap-1.5"><Pause className="h-4 w-4"/> Pause fleet</button>
            <button className="h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 glow-ring"><Send className="h-4 w-4"/> Flush queue</button>
          </>
        }
      />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { l:"Queued", v: followUps.filter(f=>f.status==="queued").length, c:"primary" },
            { l:"Executed today", v: followUps.filter(f=>f.status==="executed").length, c:"teal" },
            { l:"Skipped (caps)", v: followUps.filter(f=>f.status==="skipped").length, c:"amber" },
            { l:"Reply rate · 7d", v: "38%", c:"teal" },
          ].map(s => (
            <div key={s.l} className="surface-card p-4">
              <div className="label-eyebrow">{s.l}</div>
              <div className="mt-1.5 text-2xl font-semibold font-mono">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="surface-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary"/>
            <div className="font-semibold text-sm">Action queue</div>
            <div className="text-xs text-muted-foreground ml-auto font-mono">window opens 09:00 CET</div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface-2/50">
              <tr className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <th className="text-left font-medium px-5 py-2.5">When</th>
                <th className="text-left font-medium px-5 py-2.5">Contact</th>
                <th className="text-left font-medium px-5 py-2.5">Channel</th>
                <th className="text-left font-medium px-5 py-2.5">Message</th>
                <th className="text-left font-medium px-5 py-2.5">Reasoning</th>
                <th className="text-left font-medium px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5"/>
              </tr>
            </thead>
            <tbody>
              {followUps.map(f => (
                <tr key={f.id} className="border-t border-border hover:bg-surface-2/30">
                  <td className="px-5 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap"><Calendar className="inline h-3 w-3 mr-1"/>{new Date(f.scheduledAt).toLocaleString("en-GB",{dateStyle:"short",timeStyle:"short"})}</td>
                  <td className="px-5 py-3 font-medium">{f.contactName}</td>
                  <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded border border-border bg-surface-2 capitalize">{f.channel}</span></td>
                  <td className="px-5 py-3 text-foreground/90 max-w-sm">{f.message}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground italic max-w-sm">{f.reasoning}</td>
                  <td className="px-5 py-3"><StageBadge stage={f.status}/></td>
                  <td className="px-5 py-3 text-right">
                    {f.status === "queued" && (
                      <button className="h-7 px-2.5 rounded text-xs bg-primary/15 text-primary border border-primary/30 inline-flex items-center gap-1"><Check className="h-3 w-3"/> Approve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
