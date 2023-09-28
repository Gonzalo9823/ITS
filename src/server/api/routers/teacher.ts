import { z } from "zod";
import { createTRPCRouter, teacherProcedure } from "~/server/api/trpc";

export const teacherRouter = createTRPCRouter({
  getSubjects: teacherProcedure.query(async ({ ctx }) => {
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

  getUsers: teacherProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        lastConnection: true,
      },
      where: {
        role: "student",
      },
    });

    const totalTimeFocusedByUser = await ctx.prisma.completedUserSubjectContent.groupBy({
      by: ["userId"],
      _sum: {
        totalTimeFocused: true,
      },
      where: {
        totalTimeFocused: {
          not: null,
        },
      },
    });

    return users.map((user) => {
      const totalTimeFocusedData = totalTimeFocusedByUser.find((item) => item.userId === user.id);
      const totalTime = totalTimeFocusedData ? totalTimeFocusedData._sum.totalTimeFocused : 0;

      return {
        ...user,
        totalTimeFocused: totalTime,
      };
    });
  }),

  getUser: teacherProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const totalUsers = await ctx.prisma.user.findMany({
      orderBy: {
        points: "desc",
      },
    });

    const userPosition = totalUsers.findIndex(({ id }) => id === input.id);

    const user = await ctx.prisma.user.findFirst({
      include: {
        CompletedUserSubjectContent: {
          include: {
            contect: true,
          },
          orderBy: {
            id: "asc",
          },
        },
        Quiz: {
          include: {
            questions: {
              include: {
                question: true,
              },
            },
          },
        },
        subjects: {
          include: {
            subject: true,
          },
          orderBy: {
            subjectId: "asc",
          },
        },
      },
      where: {
        id: input.id,
      },
    });

    const totalTimeFocusedByUser = await ctx.prisma.completedUserSubjectContent.groupBy({
      by: ["userId"],
      _sum: {
        totalTimeFocused: true,
      },
      where: {
        totalTimeFocused: {
          not: null,
        },
        userId: input.id,
      },
    });

    const _subjects = user!.subjects.map((subject) => {
      const userContent = user?.CompletedUserSubjectContent.find((conte) => conte.contect.subjectId === subject.subjectId);
      const totalFocusedTime = user?.CompletedUserSubjectContent.reduce((total, conte) => {
        if (conte.contect.subjectId === subject.subjectId) {
          return total + (conte.totalTimeFocused ?? 0);
        }

        return total;
      }, 0);

      const quiz = user?.Quiz.find((quiz) => Boolean(quiz.questions.find((question) => question.question.subject === subject.subject.name)));

      return {
        ...subject,
        startedAt: userContent?.startedAt,
        finishedAt: userContent?.finishedAt,
        totalFocusedTime,
        quiz,
      };
    });

    return {
      ...user,
      userPosition: userPosition + 1,
      subjects: _subjects,
      totalTimeFocused: totalTimeFocusedByUser.at(0)?._sum.totalTimeFocused ?? 0,
    };
  }),

  getQuestionsAnalytics: teacherProcedure.query(async ({ ctx }) => {
    const topSkippedQuestions = await ctx.prisma.quizQuestion.groupBy({
      by: ["questionId"],
      _count: {
        _all: true,
      },
      where: {
        skipped: true,
      },
      take: 10,
      orderBy: {
        _count: {
          questionId: "desc",
        },
      },
    });

    const topCorrectlyFirstTry = await ctx.prisma.quizQuestion.groupBy({
      by: ["questionId"],
      _count: {
        _all: true,
      },
      where: {
        skipped: false,
        answeredCorrectFirstTry: true,
      },
      take: 10,
      orderBy: {
        _count: {
          questionId: "desc",
        },
      },
    });

    let topCorrectlySecondTry: typeof topCorrectlyFirstTry = [];

    if (topCorrectlyFirstTry.length < 10) {
      const result = await ctx.prisma.quizQuestion.groupBy({
        by: ["questionId"],
        _count: {
          _all: true,
        },
        where: {
          skipped: false,
          answeredCorrectFirstTry: false,
          answeredCorrectSecondTry: true,
        },
        orderBy: {
          _count: {
            questionId: "desc",
          },
        },
      });

      topCorrectlySecondTry = result;
    }

    const topCorrectly = [...topCorrectlyFirstTry, ...topCorrectlySecondTry].reduce(
      (acc, curr) => {
        const existing = acc.find((a) => a.questionId === curr.questionId);
        if (existing) {
          existing._count._all += curr._count._all;
        } else {
          acc.push(curr);
        }
        return acc;
      },
      [] as typeof topCorrectlyFirstTry,
    );

    const topWrongQuestions = await ctx.prisma.quizQuestion.groupBy({
      by: ["questionId"],
      _count: {
        _all: true,
      },
      where: {
        skipped: false,
        answeredCorrectFirstTry: null,
        answeredCorrectSecondTry: null,
      },
      take: 10,
      orderBy: {
        _count: {
          questionId: "desc",
        },
      },
    });

    let topWrongSecond: typeof topWrongQuestions = [];
    if (topWrongQuestions.length < 10) {
      const result = await ctx.prisma.quizQuestion.groupBy({
        by: ["questionId"],
        _count: {
          _all: true,
        },
        where: {
          skipped: false,
          answeredCorrectFirstTry: null,
          answeredCorrectSecondTry: true,
        },
        take: 10,
        orderBy: {
          _count: {
            questionId: "desc",
          },
        },
      });

      topWrongSecond = result;
    }

    const topWrong = [...topWrongQuestions, ...topWrongSecond].reduce(
      (acc, curr) => {
        const existing = acc.find((a) => a.questionId === curr.questionId);
        if (existing) {
          existing._count._all += curr._count._all;
        } else {
          acc.push(curr);
        }
        return acc;
      },
      [] as typeof topCorrectlyFirstTry,
    );

    const questionDetails = await ctx.prisma.alternativeQuestion.findMany({
      where: {
        id: {
          in: [...new Set([...topSkippedQuestions, ...topCorrectly, ...topWrong].map((q) => q.questionId))],
        },
      },
    });

    return {
      skipped: topSkippedQuestions.map((r) => {
        const details = questionDetails.find((q) => q.id === r.questionId);

        return {
          questionId: r.questionId,
          title: details?.title,
          subject: (() => {
            const subject = details?.subject;

            if (subject === "electric_charges") return "Cargas Électricas";
            if (subject === "coulombs_force_law") return "Ley de Fuerzas de Coulomb";
            if (subject === "electric_field_of_point_charges") return "Campo Électrico de Cargas Puntuales";
            if (subject === "field_lines_and_equipotential_surfaces") return "Líneas de Campo y Superficies Equipotenciales";
            if (subject === "electric_dipole") return "Dipolo Eléctrico";

            return "";
          })(),
          count: r._count._all,
        };
      }),
      topCorrectly: topCorrectly.map((r) => {
        const details = questionDetails.find((q) => q.id === r.questionId);

        return {
          questionId: r.questionId,
          title: details?.title,
          subject: (() => {
            const subject = details?.subject;

            if (subject === "electric_charges") return "Cargas Électricas";
            if (subject === "coulombs_force_law") return "Ley de Fuerzas de Coulomb";
            if (subject === "electric_field_of_point_charges") return "Campo Électrico de Cargas Puntuales";
            if (subject === "field_lines_and_equipotential_surfaces") return "Líneas de Campo y Superficies Equipotenciales";
            if (subject === "electric_dipole") return "Dipolo Eléctrico";

            return "";
          })(),
          count: r._count._all,
        };
      }),
      topWrong: topWrong.map((r) => {
        const details = questionDetails.find((q) => q.id === r.questionId);

        return {
          questionId: r.questionId,
          title: details?.title,
          subject: (() => {
            const subject = details?.subject;

            if (subject === "electric_charges") return "Cargas Électricas";
            if (subject === "coulombs_force_law") return "Ley de Fuerzas de Coulomb";
            if (subject === "electric_field_of_point_charges") return "Campo Électrico de Cargas Puntuales";
            if (subject === "field_lines_and_equipotential_surfaces") return "Líneas de Campo y Superficies Equipotenciales";
            if (subject === "electric_dipole") return "Dipolo Eléctrico";

            return "";
          })(),
          count: r._count._all,
        };
      }),
    };
  }),

  getSubjectQuestions: teacherProcedure
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
      const questions = await ctx.prisma.alternativeQuestion.findMany({
        select: {
          id: true,
          title: true,
          dificulty: true,
        },
        where: {
          subject: input.subject,
          deleted: false,
        },
      });

      const complexQuestions = await ctx.prisma.complexQuestion.findMany({
        select: {
          id: true,
          title: true,
          dificulty: true,
        },
        where: {
          subject: input.subject,
          deleted: false,
        },
      });

      return [
        ...questions.map((question) => ({ ...question, type: "alternative" })),
        ...complexQuestions.map((question) => ({ ...question, type: "complex" })),
      ];
    }),

  getAlternativeQuestion: teacherProcedure.input(z.object({ id: z.number({ invalid_type_error: "Id invalido" }) })).query(async ({ ctx, input }) => {
    const question = await ctx.prisma.alternativeQuestion.findFirstOrThrow({
      include: {
        answers: true,
      },
      where: {
        id: input.id,
      },
    });

    return question;
  }),

  createAlternativeQuestion: teacherProcedure
    .input(
      z.object({
        subject: z.enum([
          "electric_charges",
          "coulombs_force_law",
          "electric_field_of_point_charges",
          "field_lines_and_equipotential_surfaces",
          "electric_dipole",
        ]),
        title: z.string().trim().min(1, "Título Requerido"),
        subtitle: z.string().trim(),
        dificulty: z
          .number({ invalid_type_error: "Dificultad invalida" })
          .min(1, "La dificultad debe ser como minimo 1")
          .max(10, "La dificultad debe ser como maximo 10"),
        answers: z
          .array(
            z.object({
              value: z.string().trim().min(1, "Respuesta requerida."),
              hint: z.string().trim().nullish(),
              isCorrect: z.boolean(),
            }),
          )
          .min(4, "Debes tener por lo menos 4 alternativas")
          .superRefine((answers, ctx) => {
            const hasCorrect = answers.filter(({ isCorrect }) => isCorrect);

            if (hasCorrect.length === 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Debes tener por lo menos una respuesta como correcta.",
              });
            }

            if (hasCorrect.length > 1) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Debes tener solo una respuesta como correcta.",
              });
            }

            for (const { isCorrect, hint } of answers) {
              if (!isCorrect && !hint) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Toda respuesta no correcta debe tener una ayuda.",
                });
              }
            }
          }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { subject, title, subtitle, dificulty, answers } = input;

      const question = await ctx.prisma.alternativeQuestion.create({
        data: {
          subject,
          title,
          subtitle,
          dificulty,
          answers: {
            create: answers.map((answer) => ({
              value: answer.value,
              hint: answer.hint,
              isCorrect: answer.isCorrect,
            })),
          },
        },
      });

      return question.id;
    }),

  updateAlternativeQuestion: teacherProcedure
    .input(
      z.object({
        id: z.number({ invalid_type_error: "Id invalido" }),
        title: z.string().trim().min(1, "Título Requerido"),
        subtitle: z.string().trim(),
        dificulty: z
          .number({ invalid_type_error: "Dificultad invalida" })
          .min(1, "La dificultad debe ser como minimo 1")
          .max(10, "La dificultad debe ser como maximo 10"),
        answers: z
          .array(
            z.object({
              id: z.number({ invalid_type_error: "Id invalido" }),
              value: z.string().trim().min(1, "Respuesta requerida."),
              hint: z.string().trim().nullish(),
              isCorrect: z.boolean(),
            }),
          )
          .min(4, "Debes tener por lo menos 4 alternativas")
          .superRefine((answers, ctx) => {
            const hasCorrect = answers.filter(({ isCorrect }) => isCorrect);

            if (hasCorrect.length === 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Debes tener por lo menos una respuesta como correcta.",
              });
            }

            if (hasCorrect.length > 1) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Debes tener solo una respuesta como correcta.",
              });
            }

            for (const { isCorrect, hint } of answers) {
              if (!isCorrect && !hint) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Toda respuesta no correcta debe tener una ayuda.",
                });
              }
            }
          }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, title, subtitle, dificulty, answers } = input;

      const question = await ctx.prisma.alternativeQuestion.update({
        include: {
          answers: true,
        },
        data: {
          title,
          subtitle,
          dificulty,
        },
        where: {
          id,
        },
      });

      for (const answer of answers) {
        const foundedAnswer = question.answers.find(({ id }) => id === answer.id);

        if (foundedAnswer) {
          await ctx.prisma.alternativeAnswer.update({
            data: {
              value: answer.value,
              hint: answer.hint,
              isCorrect: answer.isCorrect,
            },
            where: {
              id: foundedAnswer.id,
            },
          });

          continue;
        }

        await ctx.prisma.alternativeAnswer.create({
          data: {
            value: answer.value,
            hint: answer.hint,
            isCorrect: answer.isCorrect,
            alternativeQuestionId: question.id,
          },
        });
      }
    }),

  deleteAlternativeQuestion: teacherProcedure
    .input(
      z.object({
        id: z.number({ invalid_type_error: "Id invalido" }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      await ctx.prisma.alternativeQuestion.update({
        include: {
          answers: true,
        },
        data: {
          deleted: true,
        },
        where: {
          id,
        },
      });
    }),

  getComplexQuestion: teacherProcedure.input(z.object({ id: z.number({ invalid_type_error: "Id invalido" }) })).query(async ({ ctx, input }) => {
    const question = await ctx.prisma.complexQuestion.findFirstOrThrow({
      include: {
        variables: true,
      },
      where: {
        id: input.id,
      },
    });

    return question;
  }),

  createComplexQuestion: teacherProcedure
    .input(
      z.object({
        subject: z.enum([
          "electric_charges",
          "coulombs_force_law",
          "electric_field_of_point_charges",
          "field_lines_and_equipotential_surfaces",
          "electric_dipole",
        ]),
        title: z.string().trim().min(1, "Título Requerido"),
        subtitle: z.string().trim(),
        dificulty: z
          .number({ invalid_type_error: "Número invalido" })
          .min(1, "La dificultad debe ser como minimo 1")
          .max(10, "La dificultad debe ser como maximo 10"),
        svg: z.string().trim().min(1, "SVG Requerido"),
        variables: z.array(
          z
            .object({
              varname: z.string().trim().min(1, "Nombre Requerido"),
              min: z.number({ invalid_type_error: "Mínimo invalido" }).nullish(),
              max: z.number({ invalid_type_error: "Máximo invalido" }).nullish(),
              prefix: z.string().nullish(),
              suffix: z.string().nullish(),
            })
            .refine(({ min, max }) => {
              if (min && max) {
                return min < max;
              }

              return true;
            }, "Mínimo no puede ser mayor a Máximo."),
        ),
        codeToSolveEquation: z.string().trim().min(1, "El Código para resolver el problema es requerido"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { subject, title, subtitle, dificulty, svg, variables, codeToSolveEquation } = input;

      const question = await ctx.prisma.complexQuestion.create({
        data: {
          title,
          subtitle,
          dificulty,
          svg,
          codeToSolveEquation,
          subject,
          variables: {
            create: variables.map((variable) => ({
              varname: variable.varname,
              min: variable.min,
              max: variable.max,
              prefix: variable.prefix,
              suffix: variable.suffix,
            })),
          },
        },
      });

      return question.id;
    }),

  updateComplexQuestion: teacherProcedure
    .input(
      z.object({
        id: z.number({ invalid_type_error: "Id invalido" }),
        title: z.string().trim().min(1, "Título Requerido"),
        subtitle: z.string().trim(),
        dificulty: z
          .number({ invalid_type_error: "Dificultad invalido" })
          .min(1, "La dificultad debe ser como minimo 1")
          .max(10, "La dificultad debe ser como maximo 10"),
        svg: z.string().trim().min(1, "SVG Requerido"),
        variables: z.array(
          z
            .object({
              id: z.number({ invalid_type_error: "Id invalido" }),
              varname: z.string().trim().min(1, "Nombre Requerido"),
              min: z.number({ invalid_type_error: "Mínimo invalido" }).nullish(),
              max: z.number({ invalid_type_error: "Máximo invalido" }).nullish(),
              prefix: z.string().nullish(),
              suffix: z.string().nullish(),
            })
            .refine(({ min, max }) => {
              if (min && max) {
                return min < max;
              }

              return true;
            }, "Mínimo no puede ser mayor a Máximo."),
        ),
        codeToSolveEquation: z.string().trim().min(1, "El Código para resolver el problema es requerido"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, title, subtitle, dificulty, svg, variables, codeToSolveEquation } = input;

      const question = await ctx.prisma.complexQuestion.update({
        include: {
          variables: true,
        },
        data: {
          title,
          subtitle,
          dificulty,
          svg,
          codeToSolveEquation,
        },
        where: {
          id,
        },
      });

      for (const variable of variables) {
        const foundedVariable = question.variables.find(({ id }) => id === variable.id);

        if (foundedVariable) {
          await ctx.prisma.complexQuestionVariable.update({
            data: {
              varname: variable.varname,
              min: variable.min,
              max: variable.max,
              prefix: variable.prefix,
              suffix: variable.suffix,
            },
            where: {
              id: foundedVariable.id,
            },
          });

          continue;
        }

        await ctx.prisma.complexQuestionVariable.create({
          data: {
            varname: variable.varname,
            min: variable.min,
            max: variable.max,
            prefix: variable.prefix,
            suffix: variable.suffix,
            complexQuestionId: question.id,
          },
        });
      }
    }),

  deleteComplexQuestion: teacherProcedure
    .input(
      z.object({
        id: z.number({ invalid_type_error: "Id invalido" }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      await ctx.prisma.complexQuestion.update({
        data: {
          deleted: true,
        },
        where: {
          id,
        },
      });
    }),
});
