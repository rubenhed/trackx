import { tool } from "ai";
import { createEntry } from "./createEntry";
import { createEntrySchema } from "./schema";

export function buildCreateEntryTool(userId: string) {
  return tool({
    description: "Log a new entry for a tracker",
    inputSchema: createEntrySchema,
    execute: async ({ trackerId, loggedAt, values }) =>
      createEntry(userId, trackerId, loggedAt ?? new Date(), values),
  });
}
