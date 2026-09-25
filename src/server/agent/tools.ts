import { buildCreateEntryTool } from "../trackers/createEntryTool";
import { buildCreateTrackerTool } from "../trackers/createTrackerTool";

export function buildTrackerTools(userId: string) {
  return {
    createTracker: buildCreateTrackerTool(userId),
    createEntry: buildCreateEntryTool(userId),
  };
}
