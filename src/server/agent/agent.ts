import { generateText, stepCountIs } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { env } from "cloudflare:workers";
import { buildTrackerTools } from "./tools";

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
