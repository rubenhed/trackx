import { createServerFn } from "@tanstack/react-start";
import { createEntry } from "./createEntry";
import { createTracker } from "./createTracker";
import { getCurrentUser } from "@/lib/server-auth";

export const createTrackerServerFn = createServerFn({ method: "POST" })
  .validator((data: { name: string, fields: string[] }) => data)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    return createTracker(user.id, data.name, data.fields);
  });

export const createEntryServerFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      trackerId: string;
      loggedAt: string | Date;
      values: { fieldId: string; value: string }[];
    }) => data,
  )
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    return createEntry(
      user.id,
      data.trackerId,
      data.loggedAt instanceof Date ? data.loggedAt : new Date(data.loggedAt),
      data.values,
    );
  });
