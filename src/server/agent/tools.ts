import { tool } from "ai";
import { z } from "zod";
import { createTracker } from "../trackers/trackers";

export function buildTrackerTools(userId: string) {
  return {
    createTracker: tool({
      description: "Create a new tracker for the current user",
      inputSchema: z.object({
        name: z
          .string()
          .min(1)
          .max(100)
          .describe("The name of the tracker to create"),
      }),
      execute: async ({ name }) => createTracker(userId, name)
    }),
  };
}
