import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";
export * from "./auth-schema";

export const trackers = sqliteTable("trackers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const fields = sqliteTable("fields", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackerId: integer("tracker_id")
    .notNull()
    .references(() => trackers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackerId: integer("tracker_id")
    .notNull()
    .references(() => trackers.id, { onDelete: "cascade" }),
  loggedAt: integer("logged_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const entryValues = sqliteTable("entry_values", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryId: integer("entry_id")
    .notNull()
    .references(() => entries.id, { onDelete: "cascade" }),
  fieldId: integer("field_id")
    .notNull()
    .references(() => fields.id, { onDelete: "cascade" }),
  valueText: text("value_text"),
});
