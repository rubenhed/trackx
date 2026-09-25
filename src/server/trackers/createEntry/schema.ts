import { z } from "zod";

export const createEntrySchema = z.object({
  trackerId: z
    .string()
    .describe("The id (UUIDv7) of the tracker to log an entry for"),
  loggedAt: z.coerce
    .date()
    .optional()
    .describe("When the entry was logged, defaults to now"),
  values: z
    .array(
      z.object({
        fieldId: z.string().describe("The id (UUIDv7) of the field"),
        value: z.string().describe("The value for the field"),
      }),
    )
    .describe("The field values for the entry"),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type EntryValueInput = CreateEntryInput["values"][number];
