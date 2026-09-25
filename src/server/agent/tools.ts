import { buildCreateEntryTool } from "../trackers/createEntry/tool";
import { buildCreateTrackerTool } from "../trackers/createTracker/tool";

export function buildTrackerTools(userId: string) {
  return {
    createTracker: buildCreateTrackerTool(userId),
    createEntry: buildCreateEntryTool(userId),
  };
}
