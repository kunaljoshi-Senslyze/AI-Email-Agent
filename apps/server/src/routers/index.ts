import { o, protectedProcedure, publicProcedure } from "@/lib/orpc";
import type { RouterClient } from "@orpc/server";
import { z } from "zod";
import { emailAssistantRouter } from "./email-assistant";

export const appRouter = o.router({
  healthCheck: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .handler((ctx) => ({ email: ctx.input.email })),

  privateData: protectedProcedure.handler((ctx) => ({
    message: "This is private",
    user: ctx.context.session?.user,
  })),

  // ✅ Mount email assistant
  emailAssistant: emailAssistantRouter,
});

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
