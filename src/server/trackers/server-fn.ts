import { createServerFn } from "@tanstack/react-start";
import { createTracker } from "./trackers";
import { getCurrentUser } from "@/lib/server-auth";

export const createTrackerServerFn = createServerFn({ method: "POST" })
  .validator((data: { name: string, fields: string[] }) => data)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    return createTracker(user.id, data.name, data.fields);
  });
