// routers/email-assistant.ts
import { z } from "zod";
import { o, publicProcedure } from "@/lib/orpc";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const model = google("models/gemini-2.0-flash");

export const emailAssistantRouter = o.router({
  // ----- TRIAGE -----
  triage: publicProcedure
    .input(
      z.object({
        author: z.string(),
        to: z.string(),
        subject: z.string(),
        email_thread: z.string(),
      })
    )
    .handler(async ({ input }) => {
      const systemPrompt = `
You are an email triage assistant.
Decide if an email should be: 
- RESPOND (requires a reply)
- IGNORE (safe to skip)
- NOTIFY (important but no response needed)
`;

      const userPrompt = `
Author: ${input.author}
To: ${input.to}
Subject: ${input.subject}
Thread: ${input.email_thread}
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
    }),

  // ----- RESPONSE -----
  generateResponse: publicProcedure
    .input(
      z.object({
        author: z.string(),
        to: z.string(),
        subject: z.string(),
        email_thread: z.string(),
      })
    )
    .handler(async ({ input }) => {
      const prompt = `
You are an AI email assistant. Write a polite, clear, and professional reply
based on this email thread.

Subject: ${input.subject}
From: ${input.author}
To: ${input.to}
Thread:
${input.email_thread}
`;

      const response = await streamText({
        model,
        messages: [{ role: "user", content: prompt }],
      });

      // ⚡ Returns a streaming-compatible response
      return response.toTextStreamResponse();
    }),
});
