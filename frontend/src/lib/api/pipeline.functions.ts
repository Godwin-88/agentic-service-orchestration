import { createServerFn } from "@tanstack/react-start";
import postgres from 'postgres';
import { getServerConfig } from "../config.server";
import { opportunities } from "@/lib/crm-data";

const config = getServerConfig();
const sql = postgres(config.databaseUrl);

// Pipeline Data Fetcher
export const getPipelineData = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const opps = await sql`SELECT * FROM opportunities`;
      return opps;
    } catch (error) {
      console.error("Failed to fetch pipeline data, falling back to mock:", error);
      return opportunities;
    }
  });

// Opportunity Stage Mutation
export const updateOpportunityStage = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { opportunityId: string, newStage: string } }) => {
    try {
      await sql`
        UPDATE opportunities 
        SET stage = ${data.newStage}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${data.opportunityId}
      `;
      return { success: true };
    } catch (error) {
      console.error("Failed to update opportunity stage:", error);
      return { success: false, error: "Failed to update" };
    }
  });
