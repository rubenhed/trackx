import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "../../lib/auth";
import { createTracker } from "./trackers";

export const createTrackerServerFn = createServerFn({ method: "POST" })
  .validator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getRequestHeaders(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    return createTracker(session.user.id, data.name);
  });
