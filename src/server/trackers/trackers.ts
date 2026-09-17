import { db } from "@/db";
import { trackers, fields, entries, entryValues } from "@/db/schema";

function validateName(name: string) {
  const trimmed = name.trim();

  if (!trimmed) throw new Error("Name is required");
  if (trimmed.length > 100) throw new Error("Name too long");

  return trimmed;
}

export async function createTracker(
  userId: string,
  trackerName: string,
  fieldNames: string[],
) {
  trackerName = validateName(trackerName);

  return db.transaction(async (tx) => {
    const [tracker] = await tx
      .insert(trackers)
      .values({
        userId,
        name: trackerName,
      })
      .returning();

    const createdFields = await tx
      .insert(fields)
      .values(
        fieldNames.map((name) => ({
          trackerId: tracker.id,
          name: validateName(name),
        })),
      )
      .returning();

    return {
      tracker,
      fields: createdFields,
    };
  });
}

type EntryValueInput = {
  fieldId: number;
  value: string;
};

export async function createEntry(
  trackerId: number,
  loggedAt: Date,
  values: EntryValueInput[],
) {
  return db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(entries)
      .values({
        trackerId,
        loggedAt,
      })
      .returning();

    const createdValues = await tx
      .insert(entryValues)
      .values(
        values.map(({ fieldId, value }) => ({
          entryId: entry.id,
          fieldId,
          valueText: value,
        })),
      )
      .returning();

    return {
      entry,
      values: createdValues,
    };
  });
}