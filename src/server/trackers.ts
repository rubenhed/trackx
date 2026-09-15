// trackers.ts
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "../lib/auth";
import { db } from "../db";
import { trackers } from "../db/schema";

// pure logic
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

// frontend-facing wrapper
export const createTrackerServerFn = createServerFn({ method: "POST" })
  .validator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getRequestHeaders(),
    });
    if (!session?.user) throw new Error("Unauthorized");

    return createTracker(session.user.id, data.name);
  });
