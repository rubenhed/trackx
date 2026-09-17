import { createServerFn } from "@tanstack/react-start";
import { runAgent } from "./agent";
import { getCurrentUser } from "@/lib/server-auth";

export const runAgentServerFn = createServerFn({ method: "POST" })
  .validator((data: { message: string }) => data)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    return runAgent(user.id, data.message);
  });
