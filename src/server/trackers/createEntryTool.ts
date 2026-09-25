import { tool } from "ai";
import { z } from "zod";
import { createEntry } from "./createEntry";

export function buildCreateEntryTool(userId: string) {
  return tool({
    description: "Log a new entry for a tracker",
    inputSchema: z.object({
      trackerId: z
        .string()
        .describe("The id (UUIDv7) of the tracker to log an entry for"),
      loggedAt: z
        .string()
        .optional()
        .describe(
          "ISO date string for when the entry was logged, defaults to now",
        ),
      values: z
        .array(
          z.object({
            fieldId: z.string().describe("The id (UUIDv7) of the field"),
            value: z.string().describe("The value for the field"),
          }),
        )
        .describe("The field values for the entry"),
    }),
    execute: async ({ trackerId, loggedAt, values }) =>
      createEntry(
        userId,
        trackerId,
        loggedAt ? new Date(loggedAt) : new Date(),
        values,
      ),
  });
}
