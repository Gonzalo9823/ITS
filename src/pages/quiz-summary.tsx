import type { NextPage } from "next";
import { useRouter } from "next/router";
import MultipleAnswerQuestion from "~/components/MultipleAnswerQuestion";
import Navbar from "~/components/Navbar";
import { getServerAuthSession } from "../server/auth";
import { type GetServerSideProps } from "next";

import { api } from "~/utils/api";
import { useSession } from "next-auth/react";

const QuestionSummaryPage: NextPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { isLoading, data } = api.quiz.summary.useQuery();

  if (isLoading || !data) return <h1>Loading...</h1>;

  return (
    <div className="space-y-5 px-20 py-4">
      <Navbar user={{ name: session?.user.name ?? "Usuario" }} />
      <section className="space-y-4">
        <h1 className="text-xl font-bold">Quiz Summary</h1>
        {data.questions.map((question, idx) => (
          <div key={question.id} className="space-y-9 pt-9">
            <h1>Pregunta {idx + 1}</h1>
            <MultipleAnswerQuestion
              question={{
                title: question.title,
                id: question.id,
                disabled: true,
                description: question.subtitle ?? undefined,
                answers: question.answers.map((answer, jdx) => ({
                  checked: jdx === question.selectedAnswerTry,
                  hint: answer.hint ?? "",
                  isCorrect: answer.isCorrect && jdx === question.selectedAnswerTry,
                  id: answer.id,
                  isWrong: !answer.isCorrect && jdx === question.selectedAnswerTry,
                  label: answer.value,
                  value: answer.id,
                })),
              }}
            />
          </div>
        ))}
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400"
            onClick={async () => {
              await router.push(data.completedSecondTry ? "/dashboard" : "/quiz");
            }}
          >
            {data.completedSecondTry ? "Finalizar" : "Reintentar"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default QuestionSummaryPage;

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
    props: { session },
  };
};
