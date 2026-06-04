import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Avatar, HealthBar, StageBadge, StatCard } from "@/components/crm/primitives";
import { getContactDetail } from "@/lib/api/contacts.functions";
import { fmtMoney } from "@/lib/crm-data";
import { Mail, Phone, ArrowLeft, Sparkles } from "lucide-react";
import { AgentChat } from "@/components/crm/AgentChat";

export const Route = createFileRoute("/_app/contacts/$id")({
  loader: ({ params }) => getContactDetail({ data: { id: params.id } }),
  component: ContactDetail,
});

function ContactDetail() {
  const { contact, opportunities } = useLoaderData({ from: "/_app/contacts/$id" });
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  if (!contact) return <div>Contact not found</div>;

  return (
    <div className="flex h-full">
      <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isAgentOpen ? "mr-[400px]" : "mr-0"}`}>
        <PageHeader
          eyebrow={`Module G · ${contact.id.toUpperCase()}`}
          title={`${contact.first_name} ${contact.last_name}`}
          description={`${contact.role || 'Role N/A'} at ${contact.company || 'N/A'}`}
          actions={
            <div className="flex gap-2">
              <button onClick={() => setIsAgentOpen(true)} className="h-9 px-3 rounded-md border border-primary/30 bg-primary/10 text-primary text-sm inline-flex items-center gap-1.5 hover:bg-primary/20">
                <Sparkles className="h-4 w-4"/> Ask agent
              </button>
              <Link to="/contacts" className="h-9 px-3 rounded-md border border-border bg-surface text-sm inline-flex items-center gap-1.5">
                <ArrowLeft className="h-4 w-4"/> All contacts
              </Link>
            </div>
          }
        />

        <div className="p-8 grid grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="surface-card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={`${contact.first_name} ${contact.last_name}`} hue={200} />
                <div className="font-semibold">{contact.first_name} {contact.last_name}</div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5"/> {contact.email}</div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5"/> {contact.phone}</div>
              </div>
            </div>
          </div>
          
          <div className="col-span-2 space-y-4">
             <StatCard label="Open opportunities" value={opportunities.length} hint={fmtMoney(opportunities.reduce((a:number,o:any)=>a+Number(o.estimated_value),0))} accent="primary" />
          </div>
        </div>
      </div>

      {/* Persistent Agent Side Panel */}
      {isAgentOpen && (
        <div className="w-[400px] border-l border-border bg-surface shadow-2xl flex flex-col fixed right-0 top-0 h-full">
          <AgentChat contact={contact} onClose={() => setIsAgentOpen(false)} />
        </div>
      )}
    </div>
  );
}
