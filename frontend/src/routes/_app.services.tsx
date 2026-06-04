import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { PageHeader } from "@/components/crm/primitives";
import { getServicesData } from "@/lib/api/services.functions";

export const Route = createFileRoute("/_app/services")({
  head: () => ({ meta: [{ title: "Services · Agentic CRM" }] }),
  loader: () => getServicesData(),
  component: Services,
});

function Services() {
  const { cases, products } = useLoaderData({ from: "/_app/services" });

  return (
    <div>
      <PageHeader
        eyebrow="Module S · Service Delivery"
        title="Services & Support"
        description="Manage active support cases and your product catalog."
      />
      <div className="p-8 grid grid-cols-2 gap-8">
        {/* Support Cases Section */}
        <div className="surface-card p-6">
          <h2 className="text-lg font-semibold mb-4">Active Support Cases</h2>
          <div className="space-y-3">
            {cases.map((c: any) => (
              <div key={c.id} className="p-3 border rounded-md bg-surface-2/50">
                <div className="font-medium text-sm">{c.subject}</div>
                <div className="text-xs text-muted-foreground mt-1 capitalize">Status: {c.status} · Priority: {c.priority}</div>
              </div>
            ))}
            {cases.length === 0 && <p className="text-sm text-muted-foreground">No active cases.</p>}
          </div>
        </div>

        {/* Product Catalog Section */}
        <div className="surface-card p-6">
          <h2 className="text-lg font-semibold mb-4">Product Catalog</h2>
          <div className="space-y-3">
            {products.map((p: any) => (
              <div key={p.id} className="flex justify-between items-center p-3 border rounded-md">
                <div>
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.type}</div>
                </div>
                <div className="font-mono text-sm">${p.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
