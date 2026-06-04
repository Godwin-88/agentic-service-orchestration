import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StageBadge } from "@/components/crm/primitives";
import { retentionSignals, contacts } from "@/lib/crm-data";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_app/retention")({
  head: () => ({ meta: [{ title: "Retention · Agentic CRM" }] }),
  component: Retention,
});

// RFM grid 5x5 → segment
function segmentFor(r:number, f:number) {
  if (r>=4 && f>=4) return { name:"Champions", color:"oklch(0.78 0.16 180)" };
  if (r>=4 && f>=2) return { name:"Loyal", color:"oklch(0.65 0.21 280)" };
  if (r>=3 && f<=2) return { name:"Potential", color:"oklch(0.80 0.17 80)" };
  if (r<=2 && f>=3) return { name:"At risk", color:"oklch(0.72 0.19 25)" };
  if (r<=2 && f<=2) return { name:"Hibernating", color:"oklch(0.45 0.04 270)" };
  return { name:"Needs nurture", color:"oklch(0.60 0.18 320)" };
}

function Retention() {
  // count contacts per cell
  const counts: number[][] = Array.from({length:5},()=>Array(5).fill(0));
  contacts.forEach(c => { if (c.rfm) counts[5-c.rfm.f][c.rfm.r-1] += 1; });

  return (
    <div>
      <PageHeader
        eyebrow="Module J · Retention & Loyalty Agent"
        title="Retention intelligence"
        description="RFM segmentation, churn signals, and autonomous re-engagement plays."
      />
      <div className="p-8 grid grid-cols-3 gap-6">
        {/* RFM Grid */}
        <div className="col-span-2 surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="label-eyebrow">RFM segmentation · 5×5</div>
              <div className="text-lg font-semibold mt-1">Recency × Frequency</div>
            </div>
            <div className="flex gap-3 text-[11px]">
              {["Champions","Loyal","Potential","At risk","Hibernating","Needs nurture"].map(s => {
                const seg = segmentFor(s==="Champions"?5:s==="Loyal"?4:s==="Potential"?3:s==="At risk"?2:s==="Hibernating"?1:3, s==="Champions"?5:s==="Loyal"?3:s==="Potential"?1:s==="At risk"?4:s==="Hibernating"?1:1);
                return <div key={s} className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{background: seg.color}}/> <span className="text-muted-foreground">{s}</span></div>;
              })}
            </div>
          </div>
          <div className="flex">
            <div className="flex flex-col-reverse justify-around pr-2 text-[10px] font-mono text-muted-foreground">
              {[1,2,3,4,5].map(n => <div key={n}>F{n}</div>)}
            </div>
            <div className="grid grid-cols-5 gap-1.5 flex-1">
              {counts.map((row, ri) => row.map((cell, ci) => {
                const f = 5 - ri;
                const r = ci + 1;
                const seg = segmentFor(r, f);
                const intensity = Math.min(0.9, 0.25 + cell*0.18);
                return (
                  <div
                    key={`${ri}-${ci}`}
                    className="aspect-square rounded-md border border-border grid place-items-center text-sm font-mono font-semibold relative group cursor-pointer"
                    style={{ background: `color-mix(in oklab, ${seg.color} ${intensity*100}%, oklch(0.22 0.028 270))` }}
                  >
                    <span className={cell>0?"text-foreground":"text-muted-foreground/40"}>{cell}</span>
                    <div className="absolute opacity-0 group-hover:opacity-100 transition pointer-events-none -top-9 left-1/2 -translate-x-1/2 bg-popover border border-border rounded px-2 py-1 text-[10px] whitespace-nowrap z-10">
                      R{r} F{f} · {seg.name}
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
          <div className="flex gap-1.5 mt-2 pl-6">
            {[1,2,3,4,5].map(n => <div key={n} className="flex-1 text-center text-[10px] font-mono text-muted-foreground">R{n}</div>)}
          </div>
        </div>

        {/* Churn signals */}
        <div className="surface-card p-5">
          <div className="label-eyebrow">Churn signals</div>
          <div className="text-lg font-semibold mt-1">Active interventions</div>
          <div className="mt-4 space-y-3">
            {retentionSignals.map(r => (
              <div key={r.id} className="p-3 rounded-md border border-border bg-surface-2/40">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{r.contactName}</div>
                  <StageBadge stage={r.severity}/>
                </div>
                <div className="text-[11px] text-muted-foreground">{r.company} · {r.signalType}</div>
                <div className="mt-2 text-xs text-foreground/80">{r.detail}</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-surface-2 rounded">
                    <div className={`h-full rounded ${r.churnProbability>0.7?"bg-coral":r.churnProbability>0.4?"bg-amber":"bg-teal"}`} style={{width:`${r.churnProbability*100}%`}} />
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-muted-foreground">{(r.churnProbability*100).toFixed(0)}%</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Intervention</span>
                  <StageBadge stage={r.intervention}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plays */}
        <div className="col-span-3 surface-card p-5">
          <div className="label-eyebrow">Retention play library</div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[
              { name:"Value recap", trigger:"Engagement decay > 7d", confidence:0.84 },
              { name:"Soft check-in", trigger:"Sentiment dip", confidence:0.71 },
              { name:"Advocacy invite", trigger:"NPS ≥ 9", confidence:0.93 },
              { name:"Win-back offer", trigger:"Churn risk ≥ 0.7", confidence:0.62 },
            ].map(p => (
              <div key={p.name} className="p-4 rounded-md border border-border bg-surface-2/40">
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Trigger · {p.trigger}</div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-mono font-semibold text-teal">{(p.confidence*100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
