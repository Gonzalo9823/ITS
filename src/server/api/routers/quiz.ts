import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const quizRouter = createTRPCRouter({
  hasActiveQuiz: protectedProcedure.query(async ({ ctx }) => {
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
          orderBy: {
            question: {
              id: "asc",
            },
          },
        },
      },
      where: {
        userId: ctx.session.user.id,
        completedSecondTry: false,
      },
    });

    console.log(hasActiveQuiz);

    return Boolean(hasActiveQuiz);
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
          amountOfQuestions: z.coerce.number().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
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
            orderBy: {
              question: {
                id: "asc",
              },
            },
          },
        },
        where: {
          userId: ctx.session.user.id,
          completedSecondTry: false,
        },
      });

      if (hasActiveQuiz) {
        const { id, amountOfQuestions, completedFirstTry, questions } = hasActiveQuiz;

        const currentQuestion = questions.find(({ answeredFirstTry, answeredSecondTry, skipped }) => {
          if (skipped) return false;
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
      const amountOfQuestions = input?.amountOfQuestions ?? Math.random() * (5 - 3) + 3;
      const availablePointsForQuestions = Math.round(points / amountOfQuestions);

      const availableQuestions = await ctx.prisma.alternativeQuestion.findMany({
        include: {
          answers: true,
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
            orderBy: {
              question: {
                id: "asc",
              },
            },
          },
        },
        data: {
          amountOfQuestions,
          completedFirstTry: false,
          completedSecondTry: false,
          questions: {
            create: selectedQuestions.map((question) => ({
              questionId: question.id,
              answeredFirstTry: false,
              answeredSecondTry: false,
              skipped: false,
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

  updateFocusedTime: protectedProcedure
    .input(z.object({ questionId: z.coerce.number(), focusedTime: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const question = await ctx.prisma.quizQuestion.findFirst({
        where: {
          id: input.questionId,
        },
      });

      const newFocusedTime = Math.round(input.focusedTime / 1000) + (question?.focusedTime ?? 0);

      await ctx.prisma.quizQuestion.updateMany({
        data: {
          focusedTime: newFocusedTime,
        },
        where: {
          id: input.questionId,
        },
      });
    }),

  answerQuestion: protectedProcedure
    .input(
      z.object({
        id: z.coerce.number(),
        questionId: z.coerce.number(),
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
            orderBy: {
              question: {
                id: "asc",
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

        if (isCorrect) {
          updateData.answeredCorrectSecondTry = true;
        }
      }

      if (!question.answeredFirstTry) {
        updateData.answeredFirstTry = true;
        updateData.selectedAnswerFirstTry = input.answer;

        if (isCorrect) {
          updateData.answeredCorrectFirstTry = true;
        }
      }

      if (isCorrect) {
        newUserPoints += question.answeredFirstTry ? question.question.dificulty / 2 : question.question.dificulty;
      } else {
        newUserPoints -= question.question.dificulty * 0.85;
      }

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
              name: question.question.subject,
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
            name: question.question.subject,
          },
        },
      });

      const completeSubject =
        userContents.at(-1) === undefined || subjectContent.at(-1) === undefined
          ? false
          : userContents.at(-1)?.subjectContentId === subjectContent.at(-1)?.id;

      const alternativeQuestion = await ctx.prisma.quizQuestion.update({
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

      if (updateData.answeredSecondTry && completeSubject) {
        await ctx.prisma.userSubject.updateMany({
          data: {
            completed: true,
          },
          where: {
            subject: {
              name: alternativeQuestion.question.subject,
            },
            userId: ctx.session.user.id,
          },
        });
      }

      const user = await ctx.prisma.user.findFirstOrThrow({
        where: {
          id: ctx.session.user.id,
        },
      });

      await ctx.prisma.user.update({
        data: {
          points: Math.max(0, user.points + newUserPoints),
        },
        where: {
          id: user.id,
        },
      });

      if (!quiz.completedFirstTry && questionIdx + 1 === quiz.amountOfQuestions) {
        const allCorrect = quiz.questions.every((question) => {
          if (question.id === input.questionId) {
            return isCorrect;
          }

          if (question.skipped) {
            return true;
          }

          if (question.selectedAnswerFirstTry !== null) {
            return question.question.answers[question.selectedAnswerFirstTry]?.isCorrect;
          }

          return false;
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
        const availableQuestions = quiz.questions.filter(({ answeredSecondTry, skipped }) => !answeredSecondTry && !skipped);

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

  skip: protectedProcedure
    .input(
      z.object({
        id: z.coerce.number(),
        questionId: z.coerce.number(),
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
            orderBy: {
              question: {
                id: "asc",
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

      const alternativeQuiz = await ctx.prisma.quizQuestion.update({
        include: {
          question: {
            include: {
              answers: true,
            },
          },
        },
        data: {
          skipped: true,
        },
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
          points: Math.max(0, user.points - question.question.dificulty),
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
              name: question.question.subject,
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
            name: question.question.subject,
          },
        },
      });

      const completeSubject =
        userContents.at(-1) === undefined || subjectContent.at(-1) === undefined
          ? false
          : userContents.at(-1)?.subjectContentId === subjectContent.at(-1)?.id;

      if (!quiz.completedFirstTry && questionIdx + 1 === quiz.amountOfQuestions) {
        const allCorrect = quiz.questions.every((question) => {
          if (question.id === input.questionId) return true;
          if (question.skipped) return true;
          return question.selectedAnswerFirstTry !== null ? question.question.answers[question.selectedAnswerFirstTry]?.isCorrect : false;
        });

        const updateQuizData: Prisma.QuizUpdateInput = {
          completedFirstTry: true,
        };

        const skippedQuestions = quiz.questions.filter(({ skipped }) => skipped);

        if (skippedQuestions.length === quiz.amountOfQuestions - 1 || allCorrect) {
          updateQuizData.completedSecondTry = true;
        }

        await ctx.prisma.quiz.update({
          data: updateQuizData,
          where: {
            id: input.id,
          },
        });

        if (updateQuizData.completedSecondTry && completeSubject) {
          await ctx.prisma.userSubject.updateMany({
            data: {
              completed: true,
            },
            where: {
              subject: {
                name: alternativeQuiz.question.subject,
              },
              userId: ctx.session.user.id,
            },
          });
        }

        return {
          completed: true,
        };
      }

      if (quiz.completedFirstTry) {
        const availableQuestions = quiz.questions.filter(({ answeredSecondTry, skipped }) => !answeredSecondTry && !skipped);

        if (availableQuestions.length === 1) {
          await ctx.prisma.quiz.update({
            data: {
              completedSecondTry: true,
            },
            where: {
              id: input.id,
            },
          });

          if (completeSubject) {
            await ctx.prisma.userSubject.updateMany({
              data: {
                completed: true,
              },
              where: {
                subject: {
                  name: alternativeQuiz.question.subject,
                },
                userId: ctx.session.user.id,
              },
            });
          }

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
          orderBy: {
            question: {
              id: "asc",
            },
          },
        },
      },
      where: {
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
        answeredTry: question.skipped ? true : quiz.completedSecondTry ? question.answeredSecondTry : question.answeredFirstTry,
        selectedAnswerTry: question.skipped ? null : quiz.completedSecondTry ? question.selectedAnswerSecondTry : question.selectedAnswerFirstTry,
      })),
    };
  }),
});
