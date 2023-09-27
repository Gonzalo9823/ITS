import type { NextPage } from "next";
import Navbar from "~/components/Navbar";
import { type GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { getServerAuthSession } from "~/server/auth";
import { api } from "~/utils/api";
import { Children, useRef, useState } from "react";
import { Switch } from "@headlessui/react";
import { useRouter } from "next/router";

const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(" ");
};

const AlternativeQuestionPage: NextPage<{ id: string }> = ({ id }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const hasData = useRef<boolean>(false);

  const { isLoading: isLoadingUpdate, mutateAsync: updateQuestion, error, isSuccess } = api.teacher.updateAlternativeQuestion.useMutation();

  const { isLoading, data: question } = api.teacher.getAlternativeQuestion.useQuery(
    { id: parseInt(id) },
    {
      onSuccess: ({ title, subtitle, dificulty, answers }) => {
        if (!hasData.current) {
          setTitle(title);
          setSubtitle(subtitle ?? "");
          setDificulty(`${dificulty}`);
          setAlternatives(answers);
          hasData.current = true;
        }
      },
    },
  );

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [dificulty, setDificulty] = useState("");
  const [alternatives, setAlternatives] = useState<
    {
      id: number;
      value: string;
      hint: string | null;
      isCorrect: boolean;
      alternativeQuestionId: number;
    }[]
  >([]);

  const handleUpdate = async () => {
    try {
      await updateQuestion({
        id: parseInt(id),
        title,
        subtitle,
        dificulty: parseInt(dificulty),
        answers: alternatives,
      });
    } catch (err) {
      // error
    }
  };

  if (isLoading || !question) return <h1>Loading...</h1>;

  return (
    <div className="space-y-5 px-20 py-4">
      <Navbar user={{ name: session?.user.name ?? "", role: session?.user.role ?? "student" }} />
      <section className="space-y-5">
        {error?.data?.zodError ? (
          <div className="rounded-md bg-red-500 p-6">
            <ul>
              {Children.toArray(Object.values(error.data.zodError.fieldErrors).flatMap((error) => <li className="text-white">&#8226; {error}</li>))}
            </ul>
          </div>
        ) : null}
        {isSuccess ? (
          <div className="rounded-md bg-green-500 p-6">
            <h1 className="font-bold text-white">¡Actualizada!</h1>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Pregunta de Alternativa</h1>
          <button
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-100"
            onClick={() => router.back()}
          >
            Volver
          </button>
        </div>
        <div className="space-y-2">
          <div>
            <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
              Título
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="title"
                id="title"
                disabled={isLoadingUpdate}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
                value={title}
                onChange={(evt) => setTitle(evt.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="sub_title" className="block text-sm font-medium leading-6 text-gray-900">
              Sub Título
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="sub_title"
                id="sub_title"
                disabled={isLoadingUpdate}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
                value={subtitle}
                onChange={(evt) => setSubtitle(evt.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="dificulty" className="block text-sm font-medium leading-6 text-gray-900">
              Dificultad
            </label>
            <div className="mt-2">
              <input
                type="number"
                name="dificulty"
                id="dificulty"
                disabled={isLoadingUpdate}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
                value={dificulty}
                onChange={(evt) => setDificulty(evt.target.value)}
              />
            </div>
          </div>

          <div className="pt-10">
            <div className="flex items-center justify-between">
              <h1 className="block text-sm font-medium leading-6 text-gray-900">Alternativas ({alternatives.length})</h1>
              <button
                disabled={isLoadingUpdate}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-100"
                onClick={() =>
                  setAlternatives((alternatives) => [
                    {
                      id: new Date().getTime(),
                      value: "",
                      hint: "",
                      isCorrect: false,
                      alternativeQuestionId: 0,
                    },
                    ...alternatives,
                  ])
                }
              >
                Agregar
              </button>
            </div>
            <div className="space-y-4">
              {alternatives.map((alternative) => (
                <div key={alternative.id} className="mt-2 flex flex-col space-y-4 rounded-md border border-gray-300 p-4">
                  <div>
                    <label htmlFor={`title-${alternative.id}`} className="block text-sm font-medium leading-6 text-gray-900">
                      Respuesta
                    </label>
                    <input
                      type="text"
                      name={`title-${alternative.id}`}
                      id={`title-${alternative.id}`}
                      disabled={isLoadingUpdate}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
                      value={alternative.value}
                      onChange={(evt) =>
                        setAlternatives((alternatives) =>
                          alternatives.map((_alternative) =>
                            _alternative.id === alternative.id ? { ...alternative, value: evt.target.value } : _alternative,
                          ),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor={`hint-${alternative.id}`} className="block text-sm font-medium leading-6 text-gray-900">
                      Ayuda
                    </label>
                    <input
                      type="text"
                      name={`hint-${alternative.id}`}
                      id={`hint-${alternative.id}`}
                      disabled={isLoadingUpdate || alternative.isCorrect}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
                      value={alternative.isCorrect ? "" : alternative.hint ?? ""}
                      onChange={(evt) =>
                        setAlternatives((alternatives) =>
                          alternatives.map((_alternative) =>
                            _alternative.id === alternative.id ? { ...alternative, hint: evt.target.value } : _alternative,
                          ),
                        )
                      }
                    />
                  </div>
                  <Switch.Group as="div" className="flex items-center">
                    <Switch
                      checked={alternative.isCorrect}
                      disabled={isLoadingUpdate}
                      onChange={(value) =>
                        setAlternatives((alternatives) =>
                          alternatives.map((_alternative) =>
                            _alternative.id === alternative.id ? { ...alternative, isCorrect: value } : _alternative,
                          ),
                        )
                      }
                      className={classNames(
                        alternative.isCorrect ? "bg-indigo-600" : "bg-gray-200",
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={classNames(
                          alternative.isCorrect ? "translate-x-5" : "translate-x-0",
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        )}
                      />
                    </Switch>
                    <Switch.Label as="span" className="ml-3 text-sm">
                      <span className="font-medium text-gray-900">¿Correcta?</span>
                    </Switch.Label>
                  </Switch.Group>
                  <button
                    disabled={isLoadingUpdate}
                    className="max-w-min rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:bg-gray-100"
                    onClick={() => setAlternatives((alternatives) => alternatives.filter(({ id }) => id !== alternative.id))}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button
            disabled={isLoadingUpdate}
            className="max-w-min rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:bg-gray-100"
            onClick={() => handleUpdate()}
          >
            Actualizar
          </button>
        </div>
      </section>
    </div>
  );
};

export default AlternativeQuestionPage;

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerAuthSession(ctx);

  if (!session || session.user.role !== "teacher") {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: { session, id: ctx.query.id },
  };
};
