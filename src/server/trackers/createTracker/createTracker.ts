import { db } from "@/db";
import { fields, trackers } from "@/db/schema";
import { v7 as uuidv7 } from "uuid";
import { validateName } from "./validate";

export async function createTracker(
  userId: string,
  trackerName: string,
  fieldNames: string[],
) {
  trackerName = validateName(trackerName);
  const cleanFields = fieldNames.map(validateName);

  const trackerId = uuidv7();
  const fieldRows = cleanFields.map((name) => ({
    id: uuidv7(),
    trackerId,
    name,
  }));

  const [trackerRows, fieldRowsResult] = await db.batch([
    db
      .insert(trackers)
      .values({ id: trackerId, userId, name: trackerName })
      .returning(),
    ...(fieldRows.length
      ? [db.insert(fields).values(fieldRows).returning()]
      : []),
  ]);

  const [tracker] = trackerRows ?? [];
  if (!tracker) throw new Error("Failed to create tracker");

  return {
    tracker,
    fields: fieldRows.length ? (fieldRowsResult ?? []) : [],
  };
}
