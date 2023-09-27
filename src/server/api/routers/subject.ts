import { TRPCError } from "@trpc/server";
import { z } from "zod";
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

  get: protectedProcedure
    .input(
      z.object({
        subject: z.enum([
          "electric_charges",
          "coulombs_force_law",
          "electric_field_of_point_charges",
          "field_lines_and_equipotential_surfaces",
          "electric_dipole",
        ]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const subjects = await ctx.prisma.userSubject.findMany({
        include: {
          subject: {
            include: {
              contents: {
                orderBy: {
                  id: "asc",
                },
              },
            },
          },
        },
        where: {
          userId: ctx.session.user.id,
        },
        orderBy: {
          subjectId: "asc",
        },
      });

      const parsedSubjects = subjects.map((subject, idx) => {
        const lastSubject = subjects[idx - 1];

        return {
          ...subject,
          canView: subject.completed || (lastSubject?.completed ?? true),
        };
      });

      const subject = parsedSubjects.find(({ subject: { name } }) => name === input.subject);

      if (!subject?.canView) {
        throw new TRPCError({
          code: "FORBIDDEN",
        });
      }

      const userCompletedContents = await ctx.prisma.completedUserSubjectContent.findMany({
        where: {
          userId: ctx.session.user.id,
          contect: {
            subject: {
              name: input.subject,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      });

      if (userCompletedContents.length === subject.subject.contents.length) {
        return {
          contents: subject.subject.contents,
          completed: true,
          subject: {
            name: subject.subject.name,
            spanishName: subject.subject.spanishName,
          },
        };
      }

      if (userCompletedContents.length === 0) {
        return {
          contents: [subject.subject.contents[0]!],
          completed: false,
          subject: {
            name: subject.subject.name,
            spanishName: subject.subject.spanishName,
          },
        };
      }

      const lastCompletedContent = userCompletedContents.at(-1);
      const lastCompletedContentIdx = subject.subject.contents.findIndex(({ id }) => id === lastCompletedContent?.subjectContentId);
      const nextContent = subject.subject.contents[lastCompletedContentIdx + 1];

      if (!nextContent) {
        return {
          contents: [subject.subject.contents[0]!],
          completed: false,
          subject: {
            name: subject.subject.name,
            spanishName: subject.subject.spanishName,
          },
        };
      }

      return {
        contents: [nextContent],
        completed: false,
        subject: {
          name: subject.subject.name,
          spanishName: subject.subject.spanishName,
        },
      };
    }),

  completeContent: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const alreadyCompletedContent = await ctx.prisma.completedUserSubjectContent.findFirst({
        where: {
          userId: ctx.session.user.id,
          subjectContentId: input.contentId,
        },
      });

      if (alreadyCompletedContent) return false;

      const content = await ctx.prisma.completedUserSubjectContent.create({
        include: {
          contect: true,
        },
        data: {
          userId: ctx.session.user.id,
          subjectContentId: input.contentId,
        },
      });

      const subjectContents = await ctx.prisma.subject.findFirstOrThrow({
        include: {
          contents: {
            orderBy: {
              id: "asc",
            },
          },
        },
        where: {
          id: content.contect.subjectId,
        },
      });

      if (subjectContents.contents.at(-1)?.id === input.contentId) {
        await ctx.prisma.userSubject.updateMany({
          data: {
            completed: true,
          },
          where: {
            subjectId: content.contect.subjectId,
            userId: ctx.session.user.id,
          },
        });

        return true;
      }

      return false;
    }),
});
