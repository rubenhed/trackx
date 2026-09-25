import { createServerFn } from "@tanstack/react-start";
import { createEntry } from "./createEntry/createEntry";
import { createEntrySchema } from "./createEntry/schema";
import { createTracker } from "./createTracker/createTracker";
import { createTrackerSchema } from "./createTracker/schema";
import { getCurrentUser } from "@/lib/server-auth";

export const createTrackerServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => createTrackerSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    return createTracker(user.id, data.name, data.fields);
  });

export const createEntryServerFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => createEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    return createEntry(
      user.id,
      data.trackerId,
      data.loggedAt ?? new Date(),
      data.values,
    );
  });
