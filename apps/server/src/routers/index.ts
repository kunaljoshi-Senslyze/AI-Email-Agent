import { z } from "zod";
import { o, protectedProcedure, publicProcedure } from "../lib/orpc";
import type { RouterClient } from "@orpc/server";

// Define the router
export const appRouter = o.router({
  // 🔹 Public endpoint: simple health check
  healthCheck: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .handler((ctx) => {
      return { email: ctx.input.email };
    }),

  // 🔹 Protected endpoint: requires authentication
  privateData: protectedProcedure.handler((ctx) => {
    return {
      message: "This is private",
      user: ctx.context.session?.user, // available only after auth
    };
  }),
});

// 🔹 Export type-safe client types
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
