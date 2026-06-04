import { createServerFn } from "@tanstack/react-start";
import { getServerConfig } from "../config.server";

const config = getServerConfig();

export const triggerN8nWorkflow = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { workflowId: string; payload: any } }) => {
    try {
      const response = await fetch(`${config.agentServiceUrl}/agents/n8n-trigger/${data.workflowId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': config.agentApiKey 
        },
        body: JSON.stringify(data.payload)
      });
      return { success: response.ok, status: response.status };
    } catch (error) {
      console.error("Failed to trigger N8n workflow:", error);
      return { success: false, error: "Failed to trigger" };
    }
  });
