import { createFileRoute } from "@tanstack/react-router";
import { ContentCommandCenter } from "@/components/crm/ContentCommandCenter";

export const Route = createFileRoute("/_app/content")({
  component: ContentCommandCenter,
});
