import { exampleRouter } from "~/server/api/routers/example";
import { createTRPCRouter } from "~/server/api/trpc";
import { quizRouter } from "~/server/api/routers/quiz";
import { complexQuizRouter } from "~/server/api/routers/complex-quiz";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  quiz: quizRouter,
  complexQuiz: complexQuizRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
