import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const quizRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z
        .object({
          subject: z
            .enum([
              "coulombs_force_law",
              "electric_dipole",
              "electric_field_of_point_charges",
              "electrical_charges",
              "field_lines_and_equipotential_surfaces",
            ])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx }) => {
      const hasActiveQuiz = await ctx.prisma.quiz.findFirst({
        include: {
          questions: {
            include: {
              question: {
                include: {
                  answers: true,
                },
              },
            },
          },
        },
        where: {
          skipped: false,
          userId: ctx.session.user.id,
          completedSecondTry: false,
        },
      });

      if (hasActiveQuiz) {
        const { id, amountOfQuestions, completedFirstTry, questions } = hasActiveQuiz;

        const currentQuestion = questions.find(({ answeredFirstTry, answeredSecondTry }) => {
          return completedFirstTry ? !answeredSecondTry : !answeredFirstTry;
        })!;

        return {
          id,
          amountOfQuestions,
          currentQuestionIdx: questions.indexOf(currentQuestion),
          completedFirstTry,
          question: {
            id: currentQuestion.id,
            title: currentQuestion.question.title,
            subtitle: currentQuestion.question.subtitle,
            answers: currentQuestion.question.answers,
            answeredFirstTry: currentQuestion.answeredFirstTry,
            selectedAnswerFirstTry: currentQuestion.selectedAnswerFirstTry,
          },
        };
      }

      // Create Quiz
      const { points } = await ctx.prisma.user.findFirstOrThrow({ where: { id: ctx.session.user.id } });
      const amountOfQuestions = Math.random() * (5 - 3) + 3;
      const availablePointsForQuestions = Math.round(points / amountOfQuestions);

      const availableQuestions = await ctx.prisma.alternativeQuestion.findMany({
        include: {
          answers: true,
        },
        where: {
          subject: "electrical_charges",
        },
      });

      availableQuestions.sort(
        (a, b) =>
          Math.abs(a.dificulty - availablePointsForQuestions) - Math.abs(b.dificulty - availablePointsForQuestions) || b.dificulty - a.dificulty,
      );
      const selectedQuestions = availableQuestions.slice(0, amountOfQuestions);

      const newQuiz = await ctx.prisma.quiz.create({
        include: {
          questions: {
            include: {
              question: {
                include: {
                  answers: true,
                },
              },
            },
          },
        },
        data: {
          amountOfQuestions,
          completedFirstTry: false,
          completedSecondTry: false,
          skipped: false,
          questions: {
            create: selectedQuestions.map((question) => ({
              questionId: question.id,
              answeredFirstTry: false,
              answeredSecondTry: false,
            })),
          },
          userId: ctx.session.user.id,
        },
      });

      return {
        id: newQuiz.id,
        amountOfQuestions: newQuiz.amountOfQuestions,
        currentQuestionIdx: 0,
        completedFirstTry: false,
        question: {
          id: newQuiz.questions[0]!.id,
          title: newQuiz.questions[0]!.question.title,
          subtitle: newQuiz.questions[0]!.question.subtitle,
          answers: newQuiz.questions[0]!.question.answers,
          answeredFirstTry: newQuiz.questions[0]!.answeredFirstTry,
          selectedAnswerFirstTry: newQuiz.questions[0]!.selectedAnswerFirstTry,
        },
      };
    }),

  answerQuestion: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        questionId: z.string(),
        answer: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const quiz = await ctx.prisma.quiz.findFirstOrThrow({
        include: {
          questions: {
            include: {
              question: {
                include: {
                  answers: true,
                },
              },
            },
          },
        },
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      const question = quiz.questions.find(({ id }) => id === input.questionId)!;
      const questionIdx = quiz.questions.findIndex((q) => q.id === question.id);
      const isCorrect = question.question.answers[input.answer]!.isCorrect;

      let newUserPoints = 0;
      const updateData: Prisma.QuizQuestionUpdateInput = {};

      if (question.answeredFirstTry || isCorrect) {
        updateData.answeredSecondTry = true;
        updateData.selectedAnswerSecondTry = input.answer;
      }

      if (!question.answeredFirstTry) {
        updateData.answeredFirstTry = true;
        updateData.selectedAnswerFirstTry = input.answer;
      }

      if (isCorrect) {
        newUserPoints += question.answeredFirstTry ? question.question.dificulty / 2 : question.question.dificulty;
      } else {
        newUserPoints -= question.question.dificulty * 0.85;
      }

      await ctx.prisma.quizQuestion.update({
        include: {
          question: {
            include: {
              answers: true,
            },
          },
        },
        data: updateData,
        where: {
          id: input.questionId,
        },
      });

      const user = await ctx.prisma.user.findFirstOrThrow({
        where: {
          id: ctx.session.user.id,
        },
      });

      await ctx.prisma.user.update({
        data: {
          points: user.points + newUserPoints,
        },
        where: {
          id: user.id,
        },
      });

      if (!quiz.completedFirstTry && questionIdx + 1 === quiz.amountOfQuestions) {
        const allCorrect = quiz.questions.every((question) => {
          if (question.id === input.questionId && isCorrect) return true;
          return question.selectedAnswerFirstTry ? question.question.answers[question.selectedAnswerFirstTry]?.isCorrect : false;
        });

        const updateQuizData: Prisma.QuizUpdateInput = {
          completedFirstTry: true,
        };

        if (allCorrect) {
          updateQuizData.completedSecondTry = true;
        }

        await ctx.prisma.quiz.update({
          data: updateQuizData,
          where: {
            id: input.id,
          },
        });

        return {
          completed: true,
        };
      }

      if (quiz.completedFirstTry) {
        const availableQuestions = quiz.questions.filter(({ answeredSecondTry }) => !answeredSecondTry);

        if (availableQuestions.length === 1) {
          await ctx.prisma.quiz.update({
            data: {
              completedSecondTry: true,
            },
            where: {
              id: input.id,
            },
          });

          return {
            completed: true,
          };
        }
      }

      return {
        completed: false,
      };
    }),

  summary: protectedProcedure.query(async ({ ctx }) => {
    const quizes = await ctx.prisma.quiz.findMany({
      include: {
        questions: {
          include: {
            question: {
              include: {
                answers: true,
              },
            },
          },
        },
      },
      where: {
        skipped: false,
        completedFirstTry: true,
        userId: ctx.session.user.id,
      },
      orderBy: {
        id: "desc",
      },
    });

    const _quiz = quizes.find(({ completedSecondTry }) => !completedSecondTry);
    const quiz = _quiz ?? quizes[0]!;

    return {
      id: quiz.id,
      completedFirstTry: quiz.completedFirstTry,
      completedSecondTry: quiz.completedSecondTry,
      questions: quiz.questions.map((question) => ({
        id: question.id,
        title: question.question.title,
        subtitle: question.question.subtitle,
        answers: question.question.answers,
        answeredTry: quiz.completedSecondTry ? question.answeredSecondTry : question.answeredFirstTry,
        selectedAnswerTry: quiz.completedSecondTry ? question.selectedAnswerSecondTry : question.selectedAnswerFirstTry,
      })),
    };
  }),
});
