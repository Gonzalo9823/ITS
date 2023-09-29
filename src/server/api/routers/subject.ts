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
          completed: true,
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

      const userNotCompletedContents = await ctx.prisma.completedUserSubjectContent.findMany({
        include: {
          contect: true,
        },
        where: {
          completed: false,
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

      if (userNotCompletedContents.length === 1) {
        return {
          contents: [userNotCompletedContents[0]!.contect],
          completed: false,
          subject: {
            name: subject.subject.name,
            spanishName: subject.subject.spanishName,
          },
        };
      }

      if (userCompletedContents.length === 0) {
        await ctx.prisma.completedUserSubjectContent.create({
          data: {
            subjectContentId: subject.subject.contents[0]!.id,
            userId: ctx.session.user.id,
            completed: false,
            startedAt: new Date(),
          },
        });

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
        await ctx.prisma.completedUserSubjectContent.create({
          data: {
            subjectContentId: subject.subject.contents[0]!.id,
            userId: ctx.session.user.id,
            completed: false,
            startedAt: new Date(),
          },
        });

        return {
          contents: [subject.subject.contents[0]!],
          completed: false,
          subject: {
            name: subject.subject.name,
            spanishName: subject.subject.spanishName,
          },
        };
      }

      await ctx.prisma.completedUserSubjectContent.create({
        data: {
          subjectContentId: nextContent.id,
          userId: ctx.session.user.id,
          completed: false,
          startedAt: new Date(),
        },
      });

      return {
        contents: [nextContent],
        completed: false,
        subject: {
          name: subject.subject.name,
          spanishName: subject.subject.spanishName,
        },
      };
    }),

  updateFocusedTimeOnContent: protectedProcedure
    .input(z.object({ contentId: z.number(), focusedTime: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const content = await ctx.prisma.completedUserSubjectContent.findFirstOrThrow({
        where: {
          subjectContentId: input.contentId,
          userId: ctx.session.user.id,
        },
      });

      const newFocusedTime = Math.round(input.focusedTime / 1000) + (content.totalTimeFocused ?? 0);

      await ctx.prisma.completedUserSubjectContent.updateMany({
        data: {
          totalTimeFocused: newFocusedTime,
        },
        where: {
          subjectContentId: input.contentId,
          userId: ctx.session.user.id,
        },
      });
    }),

  completeContent: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.completedUserSubjectContent.updateMany({
        data: {
          completed: true,
          finishedAt: new Date(),
        },
        where: {
          completed: false,
          subjectContentId: input.contentId,
          userId: ctx.session.user.id,
        },
      });

      const content = await ctx.prisma.completedUserSubjectContent.findFirstOrThrow({
        include: {
          contect: {
            include: {
              subject: true,
            },
          },
        },
        where: {
          completed: true,
          subjectContentId: input.contentId,
          userId: ctx.session.user.id,
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

      const user = await ctx.prisma.user.findUniqueOrThrow({
        where: {
          id: ctx.session.user.id,
        },
      });

      const totalTimeFocused = content.totalTimeFocused ?? 0;
      const pointsToAdd = totalTimeFocused > 120 && totalTimeFocused < 240 ? -1 : 1;
      const totalPoints = user.points + pointsToAdd;

      await ctx.prisma.user.update({
        data: {
          points: totalPoints,
        },
        where: {
          id: ctx.session.user.id,
        },
      });

      if (subjectContents.contents.at(-1)?.id === input.contentId || parseInt(totalPoints.toFixed(0)) % 3 === 0) {
        const isComplex = Math.random() < 0.5;

        return {
          changeRoute: true,
          goTo: isComplex ? `/complex-quiz?subject=${content.contect.subject.name}` : `/quiz?subject=${content.contect.subject.name}`,
        } as const;
      }

      return { changeRoute: false } as const;
    }),
});
