import {
  char,
  boolean,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  uniqueIndex,
  varchar,
  bigint,
  json,
} from "drizzle-orm/mysql-core";

// ─── categories ───────────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: char("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  description: text("description"),
  parentId: char("parent_id", { length: 36 }),
  icon: varchar("icon", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── category_specs (dicionário de specs por categoria) ───────────────────
export const categorySpecs = mysqlTable(
  "category_specs",
  {
    id: char("id", { length: 36 }).primaryKey(),
    categoryId: char("category_id", { length: 36 }).notNull(),
    specKey: varchar("spec_key", { length: 100 }).notNull(),
    label: varchar("label", { length: 100 }).notNull(),
    unit: varchar("unit", { length: 50 }),
    isRequired: boolean("is_required").default(false).notNull(),
    sortOrder: tinyint("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("category_specs_category_idx").on(t.categoryId),
    uniqueIndex("category_specs_category_key_unique").on(t.categoryId, t.specKey),
  ]
);

// ─── users (vendedores e compradores) ─────────────────────────────────────
export const users = mysqlTable("users", {
  id: char("id", { length: 36 }).primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  phoneE164: varchar("phone_e164", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 200 }),
  companyName: varchar("company_name", { length: 200 }),
  slug: varchar("slug", { length: 220 }).unique(),
  photoUrl: text("photo_url"),
  description: text("description"),
  city: varchar("city", { length: 100 }),
  state: char("state", { length: 2 }),
  serviceArea: text("service_area"),
  role: mysqlEnum("role", ["seller", "buyer", "admin"]).default("seller").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── seller_categories ────────────────────────────────────────────────────
export const sellerCategories = mysqlTable(
  "seller_categories",
  {
    id: char("id", { length: 36 }).primaryKey(),
    userId: char("user_id", { length: 36 }).notNull(),
    categoryId: char("category_id", { length: 36 }).notNull(),
  },
  (t) => [
    uniqueIndex("seller_categories_user_category_unique").on(t.userId, t.categoryId),
    index("seller_categories_category_idx").on(t.categoryId),
  ]
);

// ─── listings ─────────────────────────────────────────────────────────────
export const listings = mysqlTable(
  "listings",
  {
    id: char("id", { length: 36 }).primaryKey(),
    userId: char("user_id", { length: 36 }).notNull(),
    categoryId: char("category_id", { length: 36 }),
    slug: varchar("slug", { length: 300 }).notNull().unique(),
    title: varchar("title", { length: 300 }).notNull(),
    description: text("description"),
    city: varchar("city", { length: 100 }),
    state: char("state", { length: 2 }),
    price: decimal("price", { precision: 12, scale: 2 }),
    priceOnRequest: boolean("price_on_request").default(false).notNull(),
    itemCondition: mysqlEnum("item_condition", ["new", "used_good", "used_fair", "scrap"]).default("used_good"),
    status: mysqlEnum("status", ["draft", "active", "sold", "paused", "expired", "archived"]).default("draft").notNull(),
    soldAt: timestamp("sold_at"),
    viewCount: int("view_count").default(0).notNull(),
    contactCount: int("contact_count").default(0).notNull(),
    source: mysqlEnum("source", ["whatsapp", "web", "telegram"]).default("web").notNull(),
    shareCount: int("share_count").default(0).notNull(),
    rawInput: text("raw_input"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    index("listings_user_status_created_idx").on(t.userId, t.status, t.createdAt),
    index("listings_category_state_city_status_idx").on(t.categoryId, t.state, t.city, t.status),
    index("listings_status_created_idx").on(t.status, t.createdAt),
  ]
);

// ─── listing_specs ────────────────────────────────────────────────────────
export const listingSpecs = mysqlTable(
  "listing_specs",
  {
    id: char("id", { length: 36 }).primaryKey(),
    listingId: char("listing_id", { length: 36 }).notNull(),
    specKey: varchar("spec_key", { length: 100 }).notNull(),
    value: varchar("value", { length: 300 }).notNull(),
    unit: varchar("unit", { length: 50 }),
  },
  (t) => [
    index("listing_specs_listing_idx").on(t.listingId),
    index("listing_specs_key_value_idx").on(t.specKey, t.value),
  ]
);

// ─── listing_images ───────────────────────────────────────────────────────
export const listingImages = mysqlTable(
  "listing_images",
  {
    id: char("id", { length: 36 }).primaryKey(),
    listingId: char("listing_id", { length: 36 }).notNull(),
    url: text("url").notNull(),
    sortOrder: tinyint("sort_order").default(0).notNull(),
    altText: text("alt_text"),
  },
  (t) => [index("listing_images_listing_idx").on(t.listingId)]
);

// ─── contact_events ───────────────────────────────────────────────────────
export const contactEvents = mysqlTable(
  "contact_events",
  {
    id: char("id", { length: 36 }).primaryKey(),
    listingId: char("listing_id", { length: 36 }),
    sellerId: char("seller_id", { length: 36 }).notNull(),
    sourcePage: varchar("source_page", { length: 500 }),
    ipHash: char("ip_hash", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("contact_events_seller_created_idx").on(t.sellerId, t.createdAt),
    index("contact_events_listing_idx").on(t.listingId),
  ]
);

// ─── whatsapp_messages ────────────────────────────────────────────────────
export const whatsappMessages = mysqlTable(
  "whatsapp_messages",
  {
    id: char("id", { length: 36 }).primaryKey(),
    phoneE164: varchar("phone_e164", { length: 20 }).notNull(),
    direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
    messageType: mysqlEnum("message_type", ["text", "image", "audio", "document", "template"]).notNull(),
    content: text("content"),
    mediaUrl: text("media_url"),
    waMessageId: varchar("wa_message_id", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("whatsapp_messages_phone_created_idx").on(t.phoneE164, t.createdAt)]
);

// ─── magic_links ──────────────────────────────────────────────────────────
export const magicLinks = mysqlTable("magic_links", {
  id: char("id", { length: 36 }).primaryKey(),
  userId: char("user_id", { length: 36 }).notNull(),
  token: char("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── social_posts_log ─────────────────────────────────────────────────────
export const socialPostsLog = mysqlTable(
  "social_posts_log",
  {
    id: char("id", { length: 36 }).primaryKey(),
    listingId: char("listing_id", { length: 36 }).notNull(),
    platform: mysqlEnum("platform", ["instagram", "facebook", "twitter"]).notNull(),
    postedAt: timestamp("posted_at"),
    externalId: varchar("external_id", { length: 200 }),
    status: mysqlEnum("status", ["pending", "posted", "failed"]).default("pending").notNull(),
    errorMsg: text("error_msg"),
  },
  (t) => [index("social_posts_log_listing_idx").on(t.listingId)]
);

// ─── audit_logs ──────────────────────────────────────────────────────────
export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: char("id", { length: 36 }).primaryKey(),
    adminId: char("admin_id", { length: 36 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    targetType: mysqlEnum("target_type", ["user", "listing", "category", "category_spec"]).notNull(),
    targetId: char("target_id", { length: 36 }).notNull(),
    targetName: varchar("target_name", { length: 300 }),
    changes: text("changes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("audit_logs_admin_created_idx").on(t.adminId, t.createdAt),
    index("audit_logs_target_idx").on(t.targetType, t.targetId),
  ]
);

// ─── Types ────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type CategorySpec = typeof categorySpecs.$inferSelect;
export type InsertCategorySpec = typeof categorySpecs.$inferInsert;
export type SellerCategory = typeof sellerCategories.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;
export type ListingSpec = typeof listingSpecs.$inferSelect;
export type ListingImage = typeof listingImages.$inferSelect;
export type ContactEvent = typeof contactEvents.$inferSelect;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type MagicLink = typeof magicLinks.$inferSelect;
export type SocialPostLog = typeof socialPostsLog.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Telegram media group buffer (serverless-safe grouping) ───────────────
export const telegramMediaGroups = mysqlTable("telegram_media_groups", {
  id: varchar("id", { length: 255 }).primaryKey(),
  chatId: bigint("chat_id", { mode: "number" }).notNull(),
  fileIds: json("file_ids").$type<string[]>().notNull(),
  caption: text("caption"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  processed: tinyint("processed").notNull().default(0),
});
export type TelegramMediaGroup = typeof telegramMediaGroups.$inferSelect;
