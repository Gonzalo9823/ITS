import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const subjectRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const subjects = await ctx.prisma.userSubject.findMany({
      include: {
        subject: true,
      },
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        subjectId: "asc",
      },
    });

    return subjects;
  }),
});
