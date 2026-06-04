import { createServerFn } from "@tanstack/react-start";
import postgres from 'postgres';
import { getServerConfig } from "../config.server";

const config = getServerConfig();
const sql = postgres(config.databaseUrl);

export const getContactDetail = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { id: string } }) => {
    try {
      const contacts = await sql`SELECT * FROM contacts WHERE id = ${data.id}`;
      const opportunities = await sql`SELECT * FROM opportunities WHERE contact_id = ${data.id}`;
      return { 
        contact: contacts[0] || null, 
        opportunities: opportunities || [] 
      };
    } catch (error) {
      console.error("Failed to fetch contact details:", error);
      return { contact: null, opportunities: [] };
    }
  });
