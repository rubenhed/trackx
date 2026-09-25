import { tool } from "ai";
import { z } from "zod";
import { createTracker } from "./createTracker";

export function buildCreateTrackerTool(userId: string) {
  return tool({
    description:
      "Create a new tracker for the current user, optionally with fields",
    inputSchema: z.object({
      name: z
        .string()
        .min(1)
        .max(100)
        .describe("The name of the tracker to create"),
      fields: z
        .array(z.string().min(1).max(100))
        .optional()
        .default([])
        .describe("Field names for the tracker, e.g. ['mood', 'energy']"),
    }),
    execute: async ({ name, fields }) =>
      createTracker(userId, name, fields ?? []),
  });
}
