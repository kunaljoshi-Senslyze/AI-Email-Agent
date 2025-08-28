import { z } from "better-auth";
import { protectedProcedure, publicProcedure } from "../lib/orpc";
import type { RouterClient } from "@orpc/server";

export const appRouter = {
	healthCheck: publicProcedure.input(z.object({name: z.string()})).handler(({
		input
	}) => {

		return {"name": input.name};
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
