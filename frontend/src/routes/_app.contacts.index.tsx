import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { PageHeader, StageBadge, Avatar, HealthBar } from "@/components/crm/primitives";
import { getCRMContacts } from "@/lib/api/crm.functions";
import { useState } from "react";
import { Filter, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/contacts/")({
  head: () => ({ meta: [{ title: "Contacts · Agentic CRM" }] }),
  loader: () => getCRMContacts(),
  component: Contacts,
});

function Contacts() {
  const contacts = useLoaderData({ from: "/_app/contacts/" });
  const [stage, setStage] = useState<string>("all");

  const filtered = stage === "all" ? contacts : contacts.filter(c => c.lifecycle_stage === stage);
  const stages = ['all', 'prospect', 'qualified', 'engaged', 'opportunity', 'customer', 'advocate'];

  return (
    <div>
      <PageHeader
      eyebrow="Module G · Contact Intelligence Engine"
      title="Contacts"
      description="Persistent profiles enriched from every channel. Lifecycle and health computed by Agent G1."
      actions={
        <>
          <button className="h-9 px-3 rounded-md border border-border bg-surface text-sm inline-flex items-center gap-1.5"><Filter className="h-4 w-4"/> Filter</button>
          <Link to="/contacts/new" className="h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 glow-ring"><Plus className="h-4 w-4"/> New contact</Link>
        </>
      }
      />
      <div className="p-8 space-y-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {stages.map(s => (
            <button 
              key={s} 
              onClick={()=>setStage(s)} 
              className={`px-3 py-1 rounded-md text-xs capitalize border ${stage===s?"bg-primary/15 border-primary/40 text-foreground":"border-border text-muted-foreground hover:text-foreground"}`}
            >
              {s} · {s === "all" ? contacts.length : contacts.filter((c: any) => c.lifecycle_stage === s).length}
            </button>
          ))}
        </div>

        <div className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2/50">
              <tr className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <th className="text-left font-medium px-5 py-2.5">Contact</th>
                <th className="text-left font-medium px-5 py-2.5">Stage</th>
                <th className="text-left font-medium px-5 py-2.5">Health</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-t border-border hover:bg-surface-2/40 transition">
                  <td className="px-5 py-3">
                    <Link to="/contacts/$id" params={{id:c.id}} className="flex items-center gap-3 hover:text-primary">
                      <div>
                        <div className="font-medium text-foreground">{c.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3"><StageBadge stage={c.lifecycle_stage}/></td>
                  <td className="px-5 py-3"><HealthBar value={c.health_score}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
