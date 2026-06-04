import { createServerFn } from "@tanstack/react-start";
import postgres from 'postgres';
import { getServerConfig } from "../config.server";

const config = getServerConfig();
const sql = postgres(config.databaseUrl);

export const getCRMContacts = createServerFn({ method: "GET" })
  .handler(async () => {
    // Cohesion: Fetching from the unified PostgreSQL contacts table
    const contacts = await sql`
      SELECT c.*, l.source_channel 
      FROM contacts c 
      LEFT JOIN leads l ON c.lead_id = l.id 
      ORDER BY c.updated_at DESC
    `;
    return contacts;
  });

export const createContact = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { 
    email: string; 
    phone: string; 
    lifecycle_stage: string; 
    first_name: string; 
    last_name: string; 
    company: string; 
    industry: string; 
    company_size: string; 
    owner: string; 
  } }) => {
    try {
      await sql`
        INSERT INTO contacts (
          email, phone, lifecycle_stage, first_name, last_name, 
          company, industry, company_size, owner, health_score
        ) 
        VALUES (
          ${data.email}, ${data.phone}, ${data.lifecycle_stage}, 
          ${data.first_name}, ${data.last_name}, ${data.company}, 
          ${data.industry}, ${data.company_size}, ${data.owner}, 50
        )
      `;
      return { success: true };
    } catch (error) {
      console.error("Failed to create contact:", error);
      return { success: false, error: "Failed to create contact" };
    }
  });

export const triggerAgentNBA = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { contactId: string } }) => {
    // Cohesion: Calling the I1 Agent from the UI
    const response = await fetch(`${config.agentServiceUrl}/agents/crm/next-best-action`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': config.agentApiKey 
      },
      body: JSON.stringify({ contact_id: data.contactId, contact_profile: {} })
    });
    return response.json();
  });
