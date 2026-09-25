import { z } from "zod";

export const createTrackerSchema = z.object({
  name: z.string().min(1).max(100).describe("The name of the tracker to create"),
  fields: z
    .array(z.string().min(1).max(100))
    .optional()
    .default([])
    .describe("Field names for the tracker, e.g. ['mood', 'energy']"),
});

export type CreateTrackerInput = z.infer<typeof createTrackerSchema>;
