import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Destructure Pool from CommonJS-style default import
const { Pool } = pkg;

// Set up your PostgreSQL pool connection
export const pool = new Pool({
  connectionString: "postgres://postgres:911gt3RS@0.0.0.0:5432/medivault",
});

// Initialize Drizzle with your pool and schema
export const db = drizzle(pool, { schema });
