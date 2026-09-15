import { db } from "../../db";
import { trackers } from "../../db/schema";

export async function createTracker(userId: string, name: string) {
  const trimmed = name.trim();

  if (!trimmed) throw new Error("Name is required");
  if (trimmed.length > 100) throw new Error("Name too long");

  const [tracker] = await db
    .insert(trackers)
    .values({ userId, name: trimmed })
    .returning();

  return tracker;
}
