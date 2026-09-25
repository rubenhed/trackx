import {
  sqliteTable,
  text,
  integer,
  unique,
  foreignKey,
} from "drizzle-orm/sqlite-core";
import { v7 as uuidv7 } from "uuid";
import { user } from "./auth-schema";
export * from "./auth-schema";

export const trackers = sqliteTable(
  "trackers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [unique("trackers_id_user_id_unique").on(t.id, t.userId)],
);

export const fields = sqliteTable(
  "fields",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    trackerId: text("tracker_id")
      .notNull()
      .references(() => trackers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [unique("fields_id_tracker_id_unique").on(t.id, t.trackerId)],
);

export const entries = sqliteTable(
  "entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    trackerId: text("tracker_id").notNull(),
    userId: text("user_id").notNull(), // denormalized from trackers.userId — enables the FK check below
    loggedAt: integer("logged_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    foreignKey({
      columns: [t.trackerId, t.userId],
      foreignColumns: [trackers.id, trackers.userId],
      name: "entries_tracker_user_fk",
    }).onDelete("cascade"),
  ],
);

export const entryValues = sqliteTable(
  "entry_values",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    entryId: text("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    trackerId: text("tracker_id").notNull(), // denormalized from fields.trackerId — enables the FK check below
    fieldId: text("field_id").notNull(),
    valueText: text("value_text"),
  },
  (t) => [
    foreignKey({
      columns: [t.fieldId, t.trackerId],
      foreignColumns: [fields.id, fields.trackerId],
      name: "entry_values_field_tracker_fk",
    }).onDelete("cascade"),
  ],
);
