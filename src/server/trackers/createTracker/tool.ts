import { tool } from "ai";
import { createTracker } from "./createTracker";
import { createTrackerSchema } from "./schema";

export function buildCreateTrackerTool(userId: string) {
  return tool({
    description:
      "Create a new tracker for the current user, optionally with fields",
    inputSchema: createTrackerSchema,
    execute: async ({ name, fields }) =>
      createTracker(userId, name, fields),
  });
}
