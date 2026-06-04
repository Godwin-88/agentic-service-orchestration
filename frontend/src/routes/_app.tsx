import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/crm/Appshell";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});
