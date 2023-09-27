import type { NextPage } from "next";
import Navbar from "~/components/Navbar";
import { type GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { getServerAuthSession } from "~/server/auth";
import { Children, useState } from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";

const NewComplexQuestionPage: NextPage<{
  subject:
    | "electric_charges"
    | "coulombs_force_law"
    | "electric_field_of_point_charges"
    | "field_lines_and_equipotential_surfaces"
    | "electric_dipole";
}> = ({ subject }) => {
  const router = useRouter();
  const { data: session } = useSession();

  const { isLoading: isLoadingCreate, mutateAsync, error } = api.teacher.createComplexQuestion.useMutation();

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
                disabled={isLoadingCreate}
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
                disabled={isLoadingCreate}
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
                disabled={isLoadingCreate}
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
                disabled={isLoadingCreate}
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
                disabled={isLoadingCreate}
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
                      disabled={isLoadingCreate}
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
                      disabled={isLoadingCreate}
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
                      disabled={isLoadingCreate}
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
                      disabled={isLoadingCreate}
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
                      disabled={isLoadingCreate}
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
                    disabled={isLoadingCreate}
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
              disabled={isLoadingCreate}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-gray-100 sm:text-sm sm:leading-6"
              value={codeToSolveEquation}
              onChange={(evt) => setCodeToSolveEquation(evt.target.value)}
              rows={10}
            />
          </div>
        </div>
        <div className="flex items-center justify-end pt-10">
          <button
            disabled={isLoadingCreate}
            className="max-w-fit rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:bg-gray-100"
            onClick={async () => {
              try {
                const newQuestionId = await mutateAsync({
                  title,
                  subtitle,
                  dificulty: parseInt(dificulty),
                  subject,
                  svg,
                  codeToSolveEquation,
                  variables,
                });

                await router.push(`/teacher/question/complex/${newQuestionId}`);
              } catch (err) {
                // err
              }
            }}
          >
            Crear Pregunta
          </button>
        </div>
      </section>
    </div>
  );
};

export default NewComplexQuestionPage;

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
    props: { session, subject: ctx.query.subject },
  };
};
