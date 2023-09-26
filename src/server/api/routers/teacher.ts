import { z } from "zod";
import { createTRPCRouter, teacherProcedure } from "~/server/api/trpc";

export const teacherRouter = createTRPCRouter({
  getUsers: teacherProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        points: true,
        subjects: {
          select: {
            id: true,
            subject: {
              select: {
                spanishName: true,
              },
            },
            completed: true,
          },
          orderBy: {
            subject: {
              id: "asc",
            },
          },
        },
      },
      where: {
        role: "student",
      },
    });

    return users;
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
        },
      });

      return [
        ...questions.map((question) => ({ ...question, type: "alternative" })),
        ...complexQuestions.map((question) => ({ ...question, type: "complex" })),
      ];
    }),

  getAlternativeQuestion: teacherProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
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

  updateAlternativeQuestion: teacherProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().trim().min(1, "Título Requerido"),
        subtitle: z.string().trim(),
        dificulty: z.number().min(1, "La dificultad debe ser como minimo 1").max(10, "La dificultad debe ser como maximo 10"),
        answers: z
          .array(
            z.object({
              id: z.number(),
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

  getComplexQuestion: teacherProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
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

  updateComplexQuestion: teacherProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().trim().min(1, "Título Requerido"),
        subtitle: z.string().trim(),
        dificulty: z.number().min(1, "La dificultad debe ser como minimo 1").max(10, "La dificultad debe ser como maximo 10"),
        svg: z.string().trim().min(1, "SVG Requerido"),
        variables: z.array(
          z.object({
            id: z.number(),
            varname: z.string().trim().min(1, "Nombre Requerido"),
            min: z.number().nullish(),
            max: z.number().nullish(),
            prefix: z.string().nullish(),
            suffix: z.string().nullish(),
          }),
        ),
        codeToSolveEquation: z.string().trim().min(1, "El Código para resolver el problema es requerido"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, title, subtitle, dificulty, variables, codeToSolveEquation } = input;

      const question = await ctx.prisma.complexQuestion.update({
        include: {
          variables: true,
        },
        data: {
          title,
          subtitle,
          dificulty,
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
});