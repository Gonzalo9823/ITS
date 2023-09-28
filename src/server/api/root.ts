import { createTRPCRouter } from "~/server/api/trpc";
import { quizRouter } from "~/server/api/routers/quiz";
import { complexQuizRouter } from "~/server/api/routers/complex-quiz";
import { subjectRouter } from "~/server/api/routers/subject";
import { teacherRouter } from "~/server/api/routers/teacher";
import { userRouter } from "~/server/api/routers/user";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  quiz: quizRouter,
  complexQuiz: complexQuizRouter,
  subject: subjectRouter,
  teacher: teacherRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
