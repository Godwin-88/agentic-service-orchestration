import { createServerFn } from "@tanstack/react-start";
import postgres from 'postgres';
import { getServerConfig } from "../config.server";
import { proposals } from "@/lib/crm-data";

const config = getServerConfig();
const sql = postgres(config.databaseUrl);

// Proposal Data Fetcher
export const getProposals = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const props = await sql`SELECT * FROM proposals`;
      return props;
    } catch (error) {
      console.error("Failed to fetch proposals, falling back to mock:", error);
      return proposals;
    }
  });

// Approve Proposal
export const approveProposal = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { proposalId: string } }) => {
    try {
      await sql`UPDATE proposals SET status = 'approved' WHERE id = ${data.proposalId}`;
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to approve" };
    }
  });

// Reject Proposal
export const rejectProposal = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { proposalId: string } }) => {
    try {
      await sql`UPDATE proposals SET status = 'rejected' WHERE id = ${data.proposalId}`;
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to reject" };
    }
  });
