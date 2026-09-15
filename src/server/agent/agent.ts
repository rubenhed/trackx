import { generateText, stepCountIs } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { env } from "cloudflare:workers";
import { buildTrackerTools } from "./tools";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "../../lib/auth";

const workersai = createWorkersAI({ binding: env.AI });

export async function runAgent(userId: string, userMessage: string) {
  const tools = buildTrackerTools(userId);

  const result = await generateText({
    model: workersai("@cf/zai-org/glm-4.7-flash"),
    system:
      "You are a helpful assistant that manages the user's trackers. " +
      "Use the available tools to create trackers as needed. " +
      "Confirm what you did in plain language after using a tool.",
    messages: [{ role: "user", content: userMessage }],
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.text;
}

export const runAgentServerFn = createServerFn({ method: "POST" })
  .validator((data: { message: string }) => data)
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({
      headers: getRequestHeaders(),
    });
    if (!session?.user) throw new Error("Unauthorized");

    return runAgent(session.user.id, data.message);
  });
