import { Fragment } from "react";
import type { NextPage } from "next";
import Navbar from "~/components/Navbar";
import { type GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { getServerAuthSession } from "~/server/auth";
import { api } from "~/utils/api";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(" ");
};

const SubjectPage: NextPage<{
  subject:
    | "electric_charges"
    | "coulombs_force_law"
    | "electric_field_of_point_charges"
    | "field_lines_and_equipotential_surfaces"
    | "electric_dipole";
}> = ({ subject }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { isLoading, data: questions } = api.teacher.getSubjectQuestions.useQuery({ subject });

  if (isLoading) return <h1>Loading...</h1>;

  return (
    <div className="space-y-5 px-20 py-4">
      <Navbar user={{ name: session?.user.name ?? "", role: session?.user.role ?? "student" }} />
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Preguntas</h1>
          <div className="space-x-4">
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-100">
                  Agregar
                  <ChevronDownIcon className="-mr-1 h-5 w-5 text-white" aria-hidden="true" />
                </Menu.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href={`/teacher/question/alternative/new/${subject}`}
                          className={classNames(active ? "bg-gray-100 text-gray-900" : "text-gray-700", "block px-4 py-2 text-sm")}
                        >
                          Pregunta de Alternativas
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href={`/teacher/question/complex/new/${subject}`}
                          className={classNames(active ? "bg-gray-100 text-gray-900" : "text-gray-700", "block px-4 py-2 text-sm")}
                        >
                          Pregunta de Desarrollo
                        </Link>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
            <button
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-100"
              onClick={() => router.back()}
            >
              Volver
            </button>
          </div>
        </div>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Título
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Dificultad
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Tipo
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {(questions ?? []).map((question) => (
                <tr key={`${question.type}-${question.id}`}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{question.title}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{question.dificulty}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{question.type === "complex" ? "Desarrollo" : "Alternativa"}</td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Link href={`/teacher/question/${question.type}/${question.id}`} className="text-indigo-600 hover:text-indigo-900">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SubjectPage;

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
