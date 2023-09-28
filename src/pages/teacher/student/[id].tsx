import type { NextPage } from "next";
import Navbar from "~/components/Navbar";
import { type GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { getServerAuthSession } from "~/server/auth";
import { useRouter } from "next/router";
import { formatDate } from "~/helpers/date";

const StudentPage: NextPage<{ id: string }> = ({ id }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { isLoading, data } = api.teacher.getUser.useQuery({ id });

  if (isLoading || !data) return <h1>Loading...</h1>;

  return (
    <div className="space-y-5 px-20 py-4">
      <Navbar user={{ name: session?.user.name ?? "", role: session?.user.role ?? "student" }} />
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{data.name}</h1>
          <button
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-100"
            onClick={() => router.back()}
          >
            Volver
          </button>
        </div>
        <main className="">
          <div className="mx-auto max-w-2xl space-y-16 sm:space-y-20 lg:mx-0 lg:max-w-none">
            <div>
              <dl className="mt-6 space-y-6 divide-y divide-gray-100 text-sm leading-6">
                <div className="pt-6 sm:flex">
                  <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Mail</dt>
                  <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                    <div className="text-gray-900">{data.email}</div>
                  </dd>
                </div>
                <div className="pt-6 sm:flex">
                  <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Puntaje</dt>
                  <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                    <div className="text-gray-900">{data.points}</div>
                  </dd>
                </div>
                <div className="pt-6 sm:flex">
                  <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Posición en Ranking</dt>
                  <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                    <div className="text-gray-900">{data.userPosition}</div>
                  </dd>
                </div>
                <div className="pt-6 sm:flex">
                  <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Última Conexión</dt>
                  <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                    <div className="text-gray-900">{data.lastConnection ? formatDate(data.lastConnection) : ""}</div>
                  </dd>
                </div>
                <div className="pt-6 sm:flex">
                  <dt className="font-medium text-gray-900 sm:w-64 sm:flex-none sm:pr-6">Tiempo total de uso</dt>
                  <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
                    <div className="text-gray-900">{data.totalTimeFocused} segundos</div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </main>
        <section className="space-y-5 pt-5">
          <h1 className="text-xl font-bold">Materias</h1>
          <div className="space-y-5">
            {data.subjects?.map((subject) => (
              <div key={subject.id} className="flex flex-col space-y-4 rounded-md border border-gray-300 p-4">
                <h1 className="font-bold">
                  {subject.subject.spanishName} -{" "}
                  <span className={subject.completed ? "text-green-500" : "text-red-500"}>{subject.completed ? "Completada" : "No Completada"}</span>
                </h1>
                {subject.startedAt ? <p>Fecha de Inicio: {formatDate(subject.startedAt)}</p> : null}
                {subject.finishedAt ? <p>Fecha de Fín: {formatDate(subject.finishedAt)}</p> : null}
                {subject.totalFocusedTime ? <p>Segundos Conectados: {subject.totalFocusedTime}</p> : null}

                {subject.quiz ? (
                  <>
                    <h1 className="text-xl font-bold">Preguntas</h1>

                    <div className="space-y-5">
                      {subject.quiz?.questions.map((question) => (
                        <div key={question.id} className="flex flex-col space-y-4 rounded-md border border-gray-300 p-4">
                          <h1 className="font-bold">{question.question.title}</h1>
                          {question.skipped ? <p>Saltada</p> : null}
                          {question.answeredCorrectFirstTry ? <p>Correcta en Primer Intento</p> : null}
                          {!question.answeredCorrectFirstTry && question.answeredCorrectSecondTry ? <p>Correcta en Segundo Intento</p> : null}
                          {!question.answeredCorrectFirstTry &&
                          !question.answeredCorrectSecondTry &&
                          !question.skipped &&
                          (question.answeredFirstTry || question.answeredSecondTry) ? (
                            <p>Incorrecta</p>
                          ) : null}
                          {question.focusedTime ? <p>Segundos en Preguntas: {question.focusedTime}</p> : null}
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
};

export default StudentPage;

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
