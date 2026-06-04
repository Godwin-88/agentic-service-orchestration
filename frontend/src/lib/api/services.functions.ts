import { createServerFn } from "@tanstack/react-start";
import postgres from 'postgres';
import { getServerConfig } from "../config.server";

const config = getServerConfig();
const sql = postgres(config.databaseUrl);

export const getServicesData = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const cases = await sql`SELECT * FROM cases ORDER BY created_at DESC`;
      const products = await sql`SELECT * FROM products WHERE is_active = TRUE`;
      return { cases, products };
    } catch (error) {
      console.error("Failed to fetch services data:", error);
      return { cases: [], products: [] };
    }
  });
