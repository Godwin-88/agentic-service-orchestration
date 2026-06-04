import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/crm/primitives";
import { createContact } from "@/lib/api/crm.functions";
import { showToast } from "@/lib/ui";

export const Route = createFileRoute("/_app/contacts/new")({
  component: NewContact,
});

function NewContact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    email: "", phone: "", lifecycle_stage: "prospect", 
    first_name: "", last_name: "", company: "", 
    industry: "", company_size: "", owner: "" 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showToast.loading("Creating contact...");
    const result = await createContact({ data: formData });
    if (result.success) {
      showToast.success("Contact created");
      navigate({ to: "/contacts" });
    } else {
      showToast.error(result.error || "Failed to create contact");
    }
  };

  const inputClass = "w-full p-2 border border-border rounded bg-surface";

  return (
    <div>
      <PageHeader 
        eyebrow="Module G · Contact Intelligence Engine" 
        title="New Contact" 
        description="Add a new lead to the CRM" 
      />
      <form onSubmit={handleSubmit} className="p-8 space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <input className={inputClass} placeholder="First Name" onChange={e => setFormData({...formData, first_name: e.target.value})} />
          <input className={inputClass} placeholder="Last Name" onChange={e => setFormData({...formData, last_name: e.target.value})} />
        </div>
        <input className={inputClass} placeholder="Email" type="email" required onChange={e => setFormData({...formData, email: e.target.value})} />
        <input className={inputClass} placeholder="Phone" onChange={e => setFormData({...formData, phone: e.target.value})} />
        <input className={inputClass} placeholder="Company" onChange={e => setFormData({...formData, company: e.target.value})} />
        <div className="grid grid-cols-2 gap-4">
          <input className={inputClass} placeholder="Industry" onChange={e => setFormData({...formData, industry: e.target.value})} />
          <select className={inputClass} onChange={e => setFormData({...formData, company_size: e.target.value})}>
            <option value="">Select Company Size</option>
            {['Micro (1-10)', 'Small (11-50)', 'Mid-market (51-200)', 'Enterprise (201-1000)', 'Major Enterprise (1000+)'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <select className={inputClass} onChange={e => setFormData({...formData, lifecycle_stage: e.target.value})}>
          {['prospect', 'qualified', 'engaged', 'opportunity', 'customer', 'advocate'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className={inputClass} placeholder="Owner" onChange={e => setFormData({...formData, owner: e.target.value})} />
        <button className="bg-primary text-primary-foreground p-2 rounded font-medium" type="submit">Create Contact</button>
      </form>
    </div>
  );
}
