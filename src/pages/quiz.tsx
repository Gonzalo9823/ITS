import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import MultipleAnswerQuestion from "~/components/MultipleAnswerQuestion";
import Navbar from "~/components/Navbar";
import ProgressBar from "~/components/ProgressBar";
import { getServerAuthSession } from "../server/auth";
import { type GetServerSideProps } from "next";

import { api } from "~/utils/api";
import Link from "next/link";
import { useSession } from "next-auth/react";

const QuestionPage: NextPage<{
  query: {
    subject:
      | "electric_charges"
      | "coulombs_force_law"
      | "electric_field_of_point_charges"
      | "field_lines_and_equipotential_surfaces"
      | "electric_dipole";
    amountOfQuestions: number;
  };
}> = ({ query }) => {
  const { data: session } = useSession();
  const router = useRouter();

  const [selectedAnswer, setSelectedAnswer] = useState("");
  const { isLoading, data, refetch } = api.quiz.get.useQuery({ subject: query.subject, amountOfQuestions: query.amountOfQuestions });
  const { isLoading: isLoadingAnswer, mutateAsync: answerQuestion } = api.quiz.answerQuestion.useMutation();
  const { isLoading: isLoadingSkip, mutateAsync: skipQuestion } = api.quiz.skip.useMutation();

  if (isLoading || !data) return <h1>Loading...</h1>;

  return (
    <div className="space-y-5 px-20 py-4">
      <Navbar user={{ name: session?.user.name ?? "", role: session?.user.role ?? "student" }} />
      <section className="space-y-4">
        <div className="flex justify-start">
          <Link
            href="/dashboard"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400"
          >
            Volver a Dashboard
          </Link>
        </div>
        <h1 className="text-xl font-bold">Quiz</h1>
        <ProgressBar steps={data.amountOfQuestions} currentStep={data.currentQuestionIdx + 1} />
        <div className="space-y-9 pt-10">
          <MultipleAnswerQuestion
            state={[selectedAnswer, setSelectedAnswer]}
            question={{
              title: data.question.title,
              id: data.question.id,
              disabled: isLoadingAnswer || isLoadingSkip,
              description: data.question.subtitle ?? undefined,
              answers: data.question.answers.map((answer) => ({
                checked: selectedAnswer === `${answer.id}`,
                hint: answer.hint ?? "",
                isCorrect: false,
                id: answer.id,
                isWrong: false,
                label: answer.value,
                value: answer.id,
              })),
            }}
          />
        </div>
        <div className="flex justify-end space-x-5">
          <button
            type="button"
            disabled={isLoadingAnswer || isLoadingSkip}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400"
            onClick={async () => {
              try {
                const { completed } = await skipQuestion({
                  id: data.id,
                  questionId: data.question.id,
                });

                if (completed) {
                  await router.push("/quiz-summary");
                } else {
                  await refetch();
                }
              } catch (err) {
                alert("Hubo un error.");
              }
            }}
          >
            Saltar
          </button>
          <button
            type="button"
            disabled={!selectedAnswer || isLoadingAnswer || isLoadingSkip}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400"
            onClick={async () => {
              try {
                const { completed } = await answerQuestion({
                  id: data.id,
                  questionId: data.question.id,
                  answer: data.question.answers.findIndex(({ id }) => `${id}` === selectedAnswer),
                });

                if (completed) {
                  await router.push("/quiz-summary");
                } else {
                  setSelectedAnswer("");
                  await refetch();
                }
              } catch (err) {
                alert("Hubo un error.");
              }
            }}
          >
            Envíar Respuesta
          </button>
        </div>
      </section>
    </div>
  );
};

export default QuestionPage;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerAuthSession(ctx);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: { session, query: ctx.query },
  };
};
