import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const subjectRouter = createTRPCRouter({
  getMany: protectedProcedure.query(async ({ ctx }) => {
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

    return subjects.map((subject, idx) => {
      const lastSubject = subjects[idx - 1];

      return {
        ...subject,
        canView: subject.completed || (lastSubject?.completed ?? true),
      };
    });
  }),

  get: protectedProcedure.query(async ({ ctx }) => {
    const subject = ctx.prisma.subject.findFirst({
      include: {
        contents: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return subject;
  }),
});
