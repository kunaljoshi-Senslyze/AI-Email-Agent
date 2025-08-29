import { z } from "zod";
import { o, publicProcedure } from "@/lib/orpc";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { StateGraph, END, START } from "@langchain/langgraph";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});
const model = google("models/gemini-2.0-flash");

// ----------------- TYPES -----------------
interface EmailState {
  author: string;
  to: string;
  subject: string;
  email_thread: string;
  classification?: "respond" | "ignore" | "notify";
  reply?: string;
  notification?: string;
}

const ProcessEmailResultSchema = z.object({
  classification: z.enum(["respond", "ignore", "notify"]).optional(),
  reply: z.string().optional(),
  notification: z.string().optional(),
});

// ----------------- NODES -----------------
type EmailNodeFunction = (state: EmailState) => Promise<Partial<EmailState>>;

const triageNode: EmailNodeFunction = async (state) => {
  const systemPrompt = `
You are an email triage assistant. Decide if an email should be:
- RESPOND
- IGNORE
- NOTIFY
Return only one word.
`;

  const userPrompt = `
Author: ${state.author}
To: ${state.to}
Subject: ${state.subject}
Thread: ${state.email_thread}
`;

  const response = await streamText({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const { text } = await response;
  const normalized = (await text).toLowerCase();

  if (normalized.includes("ignore")) return { classification: "ignore" };
  if (normalized.includes("notify")) return { classification: "notify" };
  return { classification: "respond" };
};

const respondNode: EmailNodeFunction = async (state) => {
  const prompt = `
Write a professional, polite response to this email:

Subject: ${state.subject}
From: ${state.author}
To: ${state.to}
Thread: ${state.email_thread}
`;

  const response = await streamText({
    model,
    messages: [{ role: "user", content: prompt }],
  });

  return { reply: await response.text };
};

const notifyNode: EmailNodeFunction = async (state) => {
  const prompt = `
Summarize this email and generate a suggested notification message:

Subject: ${state.subject}
From: ${state.author}
To: ${state.to}
Thread: ${state.email_thread}
also give output without # , * in it like formatted text 
`;

  const response = await streamText({
    model,
    messages: [{ role: "user", content: prompt }],
  });

  return { notification: await response.text };
};

// ----------------- ROUTING LOGIC -----------------
const routeAfterTriage = (state: EmailState): string => {
  if (state.classification === "respond") return "respond";
  if (state.classification === "notify") return "notify";
  return END;
};

// ----------------- GRAPH -----------------
const workflow = new StateGraph<EmailState>({
  channels: {
    author: null,
    to: null,
    subject: null,
    email_thread: null,
    classification: null,
    reply: null,
    notification: null,
  },
})
  .addNode("triage", triageNode)
  .addNode("respond", respondNode)
  .addNode("notify", notifyNode)
  .addEdge(START, "triage")
  .addConditionalEdges("triage", routeAfterTriage)
  .addEdge("respond", END)
  .addEdge("notify", END);

const emailWorkflow = workflow.compile();

// ----------------- ORPC ROUTER -----------------
export const emailAssistantRouter = o.router({
  // Step 1: Process initial email
  processEmail: publicProcedure
    .input(
      z.object({
        author: z.string(),
        to: z.string(),
        subject: z.string(),
        email_thread: z.string(),
      })
    )
    .output(ProcessEmailResultSchema)
    .handler(async ({ input }) => {
      const result = await emailWorkflow.invoke(input);
      return result;
    }),

  // Step 2: Refine reply (HITL support)
  refineReply: publicProcedure
    .input(
      z.object({
        originalReply: z.string(),
        editedReply: z.string(),
        author: z.string(),
        to: z.string(),
        subject: z.string(),
        email_thread: z.string(),
      })
    )
    .output(z.object({ refinedReply: z.string() }))
    .handler(async ({ input }) => {
      const prompt = `
The AI originally suggested this reply:
"${input.originalReply}"

A human edited it to:
"${input.editedReply}"

Context:
Subject: ${input.subject}
From: ${input.author}
To: ${input.to}
Thread: ${input.email_thread}

Task:
Refine the human-edited reply into a polished, professional, and context-aware email response.
Keep it concise and polite.
`;

      const response = await streamText({
        model,
        messages: [{ role: "user", content: prompt }],
      });

      return { refinedReply: await response.text };
    }),
});
