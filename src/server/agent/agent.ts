import { generateText, stepCountIs } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { env } from "cloudflare:workers";
import { buildTrackerTools } from "./tools";

const SYSTEM_PROMPT = `
You are the TrackX assistant.

You help the user manage their trackers, fields, and entries.

Use the available tools when the user asks you to perform an action.
Only claim that an action was completed if the corresponding tool succeeded.
If you cannot perform an action with the available tools, say so clearly.
After completing an action, briefly explain what you did.
`;

const LLM_MODEL = "@cf/zai-org/glm-4.7-flash";

const workersai = createWorkersAI({ binding: env.AI });

export async function runAgent(userId: string, userMessage: string) {
  const tools = buildTrackerTools(userId);

  const result = await generateText({
    model: workersai(LLM_MODEL),
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.text;
}
