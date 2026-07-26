import { db } from "../lib/db/client";
import { listings, categories } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";

const rows = await db
  .select({ city: listings.city, state: listings.state, catName: categories.name, catSlug: categories.slug })
  .from(listings)
  .innerJoin(categories, eq(listings.categoryId, categories.id))
  .where(and(eq(listings.status, "active"), eq(listings.city, "Campinas")));
console.log(JSON.stringify(rows, null, 2));
process.exit(0);
