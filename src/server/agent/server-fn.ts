import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "../../lib/auth";
import { runAgent } from "./agent";

export const runAgentServerFn = createServerFn({ method: "POST" })
  .validator((data: { message: string }) => data)
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getRequestHeaders(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    return runAgent(session.user.id, data.message);
  });
