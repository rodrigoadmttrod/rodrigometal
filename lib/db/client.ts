import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// For TiDB Cloud, the SSL param in the connection string needs to be handled
const url = new URL(connectionString);
const sslParam = url.searchParams.get("ssl");
const sslConfig = sslParam ? { ssl: JSON.parse(decodeURIComponent(sslParam)) } : {};

const pool = mysql.createPool({
  host: url.hostname,
  port: Number(url.port) || 4000,
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ...sslConfig,
  connectionLimit: 10,
});

export const db = drizzle(pool, { schema, mode: "default" });
