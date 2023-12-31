import { z } from "zod";
import { randNumber } from "@ngneat/falso";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { Prisma } from "@prisma/client";

export const complexQuizRouter = createTRPCRouter({
  hasActiveQuiz: protectedProcedure.query(async ({ ctx }) => {
    const quiz = await ctx.prisma.complexQuiz.findFirst({
      include: {
        complexQuizQuestion: true,
      },
      where: {
        userId: ctx.session.user.id,
        completedSecondTry: false,
      },
    });

    console.log(quiz);

    return Boolean(quiz);
  }),
  get: protectedProcedure
    .input(
      z
        .object({
          subject: z
            .enum([
              "electric_charges",
              "coulombs_force_law",
              "electric_field_of_point_charges",
              "field_lines_and_equipotential_surfaces",
              "electric_dipole",
            ])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const quiz = await ctx.prisma.complexQuiz.findFirst({
        include: {
          complexQuizQuestion: true,
        },
        where: {
          userId: ctx.session.user.id,
          completedSecondTry: false,
        },
      });

      if (quiz) {
        const { id, completedFirstTry, completedSecondTry, complexQuizQuestion, answerHint } = quiz;

        return {
          id,
          completedFirstTry,
          completedSecondTry,
          answerHint,
          question: {
            id: complexQuizQuestion[0]!.id,
            title: complexQuizQuestion[0]!.title,
            subtitle: complexQuizQuestion[0]!.subtitle,
            svg: complexQuizQuestion[0]!.svg,
          },
        };
      }

      const { points: availablePointsForQuestions } = await ctx.prisma.user.findFirstOrThrow({ where: { id: ctx.session.user.id } });

      const availableQuestions = await ctx.prisma.complexQuestion.findMany({
        include: {
          variables: true,
        },
        where: {
          subject: input?.subject,
          deleted: false,
        },
      });

      availableQuestions.sort(
        (a, b) =>
          Math.abs(a.dificulty - availablePointsForQuestions) - Math.abs(b.dificulty - availablePointsForQuestions) || b.dificulty - a.dificulty,
      );

      const question = availableQuestions[0]!;

      let svg = question.svg;
      let title = question.title;
      let subtitle = question.subtitle;
      let codeToSolveEquation = question.codeToSolveEquation;

      question.variables.forEach((variable) => {
        const numericVal = randNumber({ min: variable.min ?? undefined, max: variable.max ?? undefined });
        const val = `${variable.prefix ?? ""}${numericVal}${variable.suffix ?? ""}`;

        svg = svg.replaceAll(variable.varname, val);
        title = title.replaceAll(variable.varname, val);
        if (subtitle) subtitle = subtitle.replaceAll(variable.varname, val);
        codeToSolveEquation = codeToSolveEquation.replaceAll(variable.varname, `${numericVal}`);
      });

      const answer = eval(codeToSolveEquation) as string;

      const newQuiz = await ctx.prisma.complexQuiz.create({
        include: {
          complexQuizQuestion: true,
        },
        data: {
          completedFirstTry: false,
          completedSecondTry: false,
          answerHint: question.answerHint,
          complexQuizQuestion: {
            create: [
              {
                svg,
                title,
                subtitle: subtitle ?? "",
                answer: `${answer}`,
                complexQuestionId: question.id,
              },
            ],
          },
          userId: ctx.session.user.id,
        },
      });

      return {
        id: newQuiz.id,
        completedFirstTry: newQuiz.completedFirstTry,
        completedSecondTry: newQuiz.completedSecondTry,
        answerHint: newQuiz.answerHint,
        question: {
          id: newQuiz.complexQuizQuestion[0]!.id,
          title: newQuiz.complexQuizQuestion[0]!.title,
          subtitle: newQuiz.complexQuizQuestion[0]!.subtitle,
          svg: newQuiz.complexQuizQuestion[0]!.svg,
        },
      };
    }),

  answer: protectedProcedure
    .input(
      z.object({
        id: z.coerce.number(),
        answer: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const question = await ctx.prisma.complexQuiz.findFirstOrThrow({
        include: {
          complexQuizQuestion: {
            include: {
              complexQuestion: true,
            },
          },
        },
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      const isCorrect = question.complexQuizQuestion[0]!.answer === input.answer;

      const updateData: Prisma.ComplexQuizUpdateInput = {
        completedFirstTry: true,
      };

      if (question.completedFirstTry || isCorrect) {
        updateData.completedSecondTry = true;
      }

      const updatedQuiz = await ctx.prisma.complexQuiz.update({
        include: {
          complexQuizQuestion: {
            include: {
              complexQuestion: true,
            },
          },
        },
        data: updateData,
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      const userContents = await ctx.prisma.completedUserSubjectContent.findMany({
        include: {
          contect: {
            include: {
              subject: true,
            },
          },
        },
        orderBy: {
          subjectContentId: "asc",
        },
        where: {
          userId: ctx.session.user.id,
          contect: {
            subject: {
              name: question.complexQuizQuestion[0]!.complexQuestion.subject,
            },
          },
        },
      });

      const subjectContent = await ctx.prisma.subjectContent.findMany({
        orderBy: {
          id: "asc",
        },
        where: {
          subject: {
            name: question.complexQuizQuestion[0]!.complexQuestion.subject,
          },
        },
      });

      const completeSubject =
        userContents.at(-1) === undefined || subjectContent.at(-1) === undefined
          ? false
          : userContents.at(-1)?.subjectContentId === subjectContent.at(-1)?.id;

      if (updateData.completedSecondTry && completeSubject) {
        await ctx.prisma.userSubject.updateMany({
          data: {
            completed: true,
          },
          where: {
            subject: {
              name: updatedQuiz.complexQuizQuestion[0]!.complexQuestion.subject,
            },
            userId: ctx.session.user.id,
          },
        });
      }

      return {
        isCorrect,
        completedFirstTry: updatedQuiz.completedFirstTry,
        completedSecondTry: updatedQuiz.completedSecondTry,
      };
    }),

  skip: protectedProcedure
    .input(
      z.object({
        id: z.coerce.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const question = await ctx.prisma.complexQuiz.update({
        include: {
          complexQuizQuestion: {
            include: {
              complexQuestion: true,
            },
          },
        },
        data: {
          completedFirstTry: true,
          completedSecondTry: true,
        },
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      const user = await ctx.prisma.user.findFirstOrThrow({
        where: {
          id: ctx.session.user.id,
        },
      });

      await ctx.prisma.user.update({
        data: {
          points: Math.max(0, user.points - question.complexQuizQuestion[0]!.complexQuestion.dificulty),
        },
        where: {
          id: user.id,
        },
      });

      const userContents = await ctx.prisma.completedUserSubjectContent.findMany({
        include: {
          contect: {
            include: {
              subject: true,
            },
          },
        },
        orderBy: {
          subjectContentId: "asc",
        },
        where: {
          userId: ctx.session.user.id,
          contect: {
            subject: {
              name: question.complexQuizQuestion[0]!.complexQuestion.subject,
            },
          },
        },
      });

      const subjectContent = await ctx.prisma.subjectContent.findMany({
        orderBy: {
          id: "asc",
        },
        where: {
          subject: {
            name: question.complexQuizQuestion[0]!.complexQuestion.subject,
          },
        },
      });

      const completeSubject =
        userContents.at(-1) === undefined || subjectContent.at(-1) === undefined
          ? false
          : userContents.at(-1)?.subjectContentId === subjectContent.at(-1)?.id;

      if (completeSubject) {
        await ctx.prisma.userSubject.updateMany({
          data: {
            completed: true,
          },
          where: {
            subject: {
              name: question.complexQuizQuestion[0]!.complexQuestion.subject,
            },
            userId: ctx.session.user.id,
          },
        });
      }

      return true;
    }),
});
