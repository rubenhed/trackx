import { db } from "@/db";
import { entries, entryValues } from "@/db/schema";
import { v7 as uuidv7 } from "uuid";
import type { EntryValueInput } from "./schema";

// userId must come from the session — never from client-supplied input.
// trackerId/fieldIds are untrusted; ownership is enforced by composite FKs at insert time.
export async function createEntry(
  userId: string,
  trackerId: string,
  loggedAt: Date,
  values: EntryValueInput[],
) {
  const entryId = uuidv7();
  const valueRows = values.map(({ fieldId, value }) => ({
    id: uuidv7(),
    entryId,
    trackerId,
    fieldId,
    valueText: value,
  }));

  let results;
  try {
    results = await db.batch([
      db
        .insert(entries)
        .values({ id: entryId, trackerId, userId, loggedAt })
        .returning(),
      ...(valueRows.length
        ? [db.insert(entryValues).values(valueRows).returning()]
        : []),
    ]);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    throw new Error("Tracker not found, unauthorized, or invalid field");
  }

  const [entry] = results[0] ?? [];
  if (!entry) throw new Error("Failed to create entry");

  return {
    entry,
    values: valueRows.length ? (results[1] ?? []) : [],
  };
}
