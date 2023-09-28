import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  changeRole: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
    });

    await ctx.prisma.user.update({
      data: {
        role: user?.role === "teacher" ? "student" : "teacher",
      },
      where: {
        id: ctx.session.user.id,
      },
    });
  }),
});
