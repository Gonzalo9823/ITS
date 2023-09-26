import type { GetServerSideProps, NextPage } from "next";
import { useSession } from "next-auth/react";
import Navbar from "~/components/Navbar";
import Subject from "~/components/Subject";
import { getServerAuthSession } from "~/server/auth";
import { api } from "~/utils/api";

const TeacherPage: NextPage = () => {
  const { data: session } = useSession();

  const { isLoading: isLoadingUsers, data: users } = api.teacher.getUsers.useQuery();
  const { isLoading: isLoadingSubjects, data: subjects } = api.subject.get.useQuery();

  if (isLoadingUsers || isLoadingSubjects) return <h1>Loading...</h1>;

  return (
    <div className="space-y-5 px-20 py-4">
      <Navbar user={{ name: session?.user.name ?? "", role: session?.user.role ?? "student" }} />
      <section className="space-y-5">
        <h1 className="text-xl font-bold">Alumnos</h1>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Nombre
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Mail
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Puntaje
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Materias
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {(users ?? []).map((user) => (
                <tr key={user.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{user.name}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.points}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <ul>
                      {user.subjects.map((subject) => (
                        <li key={subject.id}>
                          &#8226; {subject.subject.spanishName}:{" "}
                          <span className={subject.completed ? "text-green-500" : "text-red-500"}>
                            {subject.completed ? "Completado" : "No Completado"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="space-y-5">
        <h1 className="text-xl font-bold">Materias</h1>
        <div className="grid grid-cols-4 gap-10">
          {(subjects ?? []).map(({ id, completed, subject }) => (
            <Subject key={id} completed={completed} {...subject} isTeacher />
          ))}
        </div>
      </section>
    </div>
  );
};

export default TeacherPage;

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
    props: { session },
  };
};
