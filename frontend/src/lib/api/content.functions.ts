import { createServerFn } from "@tanstack/react-start";
import { getServerConfig } from "../config.server";

const config = getServerConfig();

export const createPost = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { channel_id: string; content: string; scheduled_at: string } }) => {
    try {
      const response = await fetch(`${config.agentServiceUrl}/agents/content/create-post`, {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': config.agentApiKey 
        },
        body: JSON.stringify(data)
      });
      return { success: response.ok, status: response.status };
    } catch (error) {
      console.error("Failed to create post:", error);
      return { success: false, error: "Failed to create" };
    }
  });
