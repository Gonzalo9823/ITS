import type { NextPage } from "next";
import { useSession } from "next-auth/react";
import Navbar from "~/components/Navbar";

import Link from "next/link";
import { useState } from "react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";

const ComplexQuizPage: NextPage = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean>();
  const [isEnabled, setIsEnabled] = useState(true);

  const trpcContext = api.useContext();
  const { isLoading, data } = api.complexQuiz.get.useQuery(undefined, { enabled: isEnabled });
  const { isLoading: isLoadingSkip, mutateAsync: skipQuestion } = api.complexQuiz.skip.useMutation();
  const { isLoading: isLoadingAnswer, mutateAsync: answerQuestion } = api.complexQuiz.answer.useMutation();

  if (isLoading || !data) return <h1>Loading...</h1>;

  return (
    <div className="space-y-5 px-20 py-4">
      <Navbar user={{ name: session?.user.name ?? "Usuario" }} />
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
        <div className="space-y-9">
          <div>
            <h1 className="text-lg font-bold">{data.question.title}</h1>
            {data.question.subtitle ? <p>{data.question.subtitle}</p> : null}
          </div>
          <div className="flex w-full items-center justify-center">
            <div className="w-80" dangerouslySetInnerHTML={{ __html: data.question.svg }} />
          </div>
        </div>

        {!data.completedSecondTry && (
          <div>
            <label htmlFor="answer" className="block text-sm font-medium leading-6 text-gray-900">
              Respuesta
            </label>
            <div className="mt-2 space-y-2">
              <input
                type="text"
                name="text"
                id="text"
                className={`block w-full rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${
                  isCorrect === true ? "!ring-green-500" : ""
                } ${isCorrect === false ? "!ring-red-500" : ""}`}
                value={selectedAnswer}
                disabled={isLoadingSkip || isLoadingAnswer}
                onChange={(evt) => setSelectedAnswer(evt.currentTarget.value)}
              />
              {data.answerHint ? <p>{data.answerHint}</p> : null}
            </div>
          </div>
        )}
        {data.completedSecondTry && isCorrect ? <p className="font-bold text-green-500">Correcto!</p> : null}
        <div className="flex justify-end space-x-5">
          <button
            type="button"
            disabled={isLoadingSkip || isLoadingAnswer || data.completedSecondTry}
            onClick={async () => {
              try {
                await skipQuestion({ id: data.id });
                await router.push("/dashboard");
              } catch (err) {
                alert("Hubo un error.");
              }
            }}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400"
          >
            Saltar
          </button>
          <button
            type="button"
            disabled={(!data.completedSecondTry && !selectedAnswer) || isLoadingSkip || isLoadingAnswer}
            onClick={async () => {
              try {
                if (data.completedSecondTry) {
                  await router.push("/dashboard");
                } else {
                  const { isCorrect, completedFirstTry, completedSecondTry } = await answerQuestion({ id: data.id, answer: selectedAnswer });

                  setIsCorrect(isCorrect);
                  setSelectedAnswer("");
                  trpcContext.complexQuiz.get.setData(undefined, {
                    ...data,
                    completedFirstTry,
                    completedSecondTry,
                  });

                  if (completedSecondTry) {
                    setIsEnabled(false);
                  }
                }
              } catch (err) {
                alert("Hubo un error.");
              }
            }}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400"
          >
            {data.completedSecondTry ? "Finalizar" : "Envíar Respuesta"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ComplexQuizPage;
