import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";

const url =
  process.env.DATABASE_URL ||
  readFileSync(new URL("../.env", import.meta.url), "utf8").match(/DATABASE_URL=(.*)/)![1].trim();
const conn = await mysql.createConnection(url);
const [rows] = await conn.query("SELECT slug, status FROM listings WHERE status='sold' LIMIT 5");
console.log(JSON.stringify(rows));
await conn.end();
process.exit(0);
