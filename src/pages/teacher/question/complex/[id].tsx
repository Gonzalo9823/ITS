import type { NextPage } from "next";
import Navbar from "~/components/Navbar";
import { type GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { getServerAuthSession } from "~/server/auth";
import { Children, useRef, useState } from "react";
import { api } from "~/utils/api";
import { useRouter } from "next/router";

const ComplexQuestionPage: NextPage<{ id: string }> = ({ id }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const hasData = useRef<boolean>(false);

  const { isLoading: isLoadingUpdate, mutateAsync: updateQuestion, error, isSuccess } = api.teacher.updateComplexQuestion.useMutation();
  const { isLoading: isLoadingDelete, mutateAsync: deleteQuestion } = api.teacher.deleteComplexQuestion.useMutation();

  const isLoadingMutation = isLoadingUpdate || isLoadingDelete;

  const { isLoading, data: question } = api.teacher.getComplexQuestion.useQuery(
    { id: parseInt(id) },
    {
      onSuccess: ({ title, subtitle, dificulty, svg, variables, codeToSolveEquation }) => {
        if (!hasData.current) {
          setTitle(title);
          setSubtitle(subtitle ?? "");
          setDificulty(`${dificulty}`);
          setSvg(svg);
          setVariables(variables);
          setCodeToSolveEquation(codeToSolveEquation);
          hasData.current = true;
        }
      },
    },
  );

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [dificulty, setDificulty] = useState("");
  const [svg, setSvg] = useState("");
  const [variables, setVariables] = useState<
    {
      id: number;
      varname: string;
      min: number | null;
      max: number | null;
      prefix: string | null;
      suffix: string | null;
      complexQuestionId: number;
    }[]
  >([]);
  const [codeToSolveEquation, setCodeToSolveEquation] = useState("");

  const handleUpdate = async () => {
    try {
      await updateQuestion({
        id: parseInt(id),
        title,
        subtitle,
        dificulty: parseInt(dificulty),
        svg,
        variables,
        codeToSolveEquation,
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
              {Children.toArray(
                Object.values(error.data.zodError.fieldErrors).flatMap(
                  (errors) => errors?.map((error) => <li className="text-white">&#8226; {error}</li>),
                ),
              )}
            </ul>
          </div>
        ) : null}
        {isSuccess ? (
          <div className="rounded-md bg-green-500 p-6">
            <h1 className="font-bold text-white">¡Actualizada!</h1>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Pregunta de Compleja</h1>
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
                disabled={isLoadingMutation}
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
                disabled={isLoadingMutation}
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
                disabled={isLoadingMutation}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
                value={dificulty}
                onChange={(evt) => setDificulty(evt.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="svg" className="block text-sm font-medium leading-6 text-gray-900">
              SVG
            </label>
            <div className="flex h-96 w-full space-x-10">
              <textarea
                name="svg"
                id="svg"
                disabled={isLoadingMutation}
                className="block w-1/2 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
                value={svg}
                onChange={(evt) => setSvg(evt.target.value)}
              />
              <div className="flex w-1/2 items-center justify-center rounded-md border border-gray-300">
                <div className="w-60" dangerouslySetInnerHTML={{ __html: svg }} />
              </div>
            </div>
          </div>

          <div className="pt-10">
            <div className="flex items-center justify-between">
              <h1 className="block text-sm font-medium leading-6 text-gray-900">Variables ({variables.length})</h1>
              <button
                disabled={isLoadingMutation}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-100"
                onClick={() =>
                  setVariables((variables) => [
                    {
                      id: new Date().getTime(),
                      varname: "",
                      min: null,
                      max: null,
                      prefix: "",
                      suffix: "",
                      complexQuestionId: 0,
                    },
                    ...variables,
                  ])
                }
              >
                Agregar
              </button>
            </div>
            <div className="space-y-4">
              {variables.map((variable) => (
                <div key={variable.id} className="mt-2 flex flex-col space-y-4 rounded-md border border-gray-300 p-4">
                  <div>
                    <label htmlFor={`title-${variable.id}`} className="block text-sm font-medium leading-6 text-gray-900">
                      Nombre
                    </label>
                    <input
                      type="text"
                      name={`title-${variable.id}`}
                      id={`title-${variable.id}`}
                      disabled={isLoadingMutation}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
                      value={variable.varname}
                      onChange={(evt) =>
                        setVariables((variables) =>
                          variables.map((_variable) => (_variable.id === variable.id ? { ...variable, varname: evt.target.value } : _variable)),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor={`hint-${variable.id}`} className="block text-sm font-medium leading-6 text-gray-900">
                      Mínimo
                    </label>
                    <input
                      type="number"
                      name={`hint-${variable.id}`}
                      id={`hint-${variable.id}`}
                      disabled={isLoadingMutation}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
                      value={variable.min ?? ""}
                      onChange={(evt) =>
                        setVariables((variables) =>
                          variables.map((_variable) =>
                            _variable.id === variable.id
                              ? { ...variable, min: Number.isNaN(parseInt(evt.target.value)) ? null : parseInt(evt.target.value) }
                              : _variable,
                          ),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor={`max-${variable.id}`} className="block text-sm font-medium leading-6 text-gray-900">
                      Máximo
                    </label>
                    <input
                      type="number"
                      name={`max-${variable.id}`}
                      id={`max-${variable.id}`}
                      disabled={isLoadingMutation}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
                      value={variable.max ?? ""}
                      onChange={(evt) =>
                        setVariables((variables) =>
                          variables.map((_variable) =>
                            _variable.id === variable.id
                              ? { ...variable, max: Number.isNaN(parseInt(evt.target.value)) ? null : parseInt(evt.target.value) }
                              : _variable,
                          ),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor={`prefix-${variable.id}`} className="block text-sm font-medium leading-6 text-gray-900">
                      Prefijo
                    </label>
                    <input
                      type="text"
                      name={`prefix-${variable.id}`}
                      id={`prefix-${variable.id}`}
                      disabled={isLoadingMutation}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
                      value={variable.prefix ?? ""}
                      onChange={(evt) =>
                        setVariables((variables) =>
                          variables.map((_variable) => (_variable.id === variable.id ? { ...variable, prefix: evt.target.value } : _variable)),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor={`suffix-${variable.id}`} className="block text-sm font-medium leading-6 text-gray-900">
                      Sufijo
                    </label>
                    <input
                      type="text"
                      name={`suffix-${variable.id}`}
                      id={`suffix-${variable.id}`}
                      disabled={isLoadingMutation}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
                      value={variable.suffix ?? ""}
                      onChange={(evt) =>
                        setVariables((variables) =>
                          variables.map((_variable) => (_variable.id === variable.id ? { ...variable, suffix: evt.target.value } : _variable)),
                        )
                      }
                    />
                  </div>
                  <button
                    disabled={isLoadingMutation}
                    className="max-w-min rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:bg-gray-100"
                    onClick={() => setVariables((variables) => variables.filter(({ id }) => id !== variable.id))}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="code_solver" className="block text-sm font-medium leading-6 text-gray-900">
              Código para resolver problema
            </label>
            <textarea
              name="code_solver"
              id="code_solver"
              disabled={isLoadingMutation}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
              value={codeToSolveEquation}
              onChange={(evt) => setCodeToSolveEquation(evt.target.value)}
              rows={10}
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-10">
          <button
            disabled={isLoadingMutation}
            className="max-w-min rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:bg-gray-100"
            onClick={async () => {
              try {
                await deleteQuestion({ id: parseInt(id) });
                await router.push(`/teacher/subject/${question.subject}`);
              } catch (err) {
                // err
              }
            }}
          >
            Eliminar
          </button>
          <button
            disabled={isLoadingMutation}
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

export default ComplexQuestionPage;

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
