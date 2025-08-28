import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

type LanguageModelV2 = ReturnType<typeof google>
export const llm: LanguageModelV2 = google("models/gemini-2.0-flash");