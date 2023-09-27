import type { NextPage } from "next";
import Navbar from "~/components/Navbar";
import { type GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { getServerAuthSession } from "~/server/auth";
import { useRouter } from "next/router";
import { CheckIcon } from "@heroicons/react/20/solid";

const DashboardPage: NextPage<{
  subject:
    | "electric_charges"
    | "coulombs_force_law"
    | "electric_field_of_point_charges"
    | "field_lines_and_equipotential_surfaces"
    | "electric_dipole";
}> = ({ subject }) => {
  const router = useRouter();
  const { data: session } = useSession();

  const { isLoading, data, refetch } = api.subject.get.useQuery({ subject });
  const { isLoading: isLoadingComplete, mutateAsync: completeContent } = api.subject.completeContent.useMutation();

  if (isLoading || !data) return <h1>Loading...</h1>;

  return (
    <div className="space-y-5 px-20 py-4">
      <Navbar user={{ name: session?.user.name ?? "", role: session?.user.role ?? "student" }} />
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">{data.subject.spanishName}</h1>
            {data.completed ? <CheckIcon className="h-10 w-10 text-green-500" /> : null}
          </div>
          {data.completed ? (
            <button
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-100"
              onClick={() => router.push("/dashboard")}
            >
              Volver
            </button>
          ) : null}
        </div>

        <section className="space-y-10">
          {data.contents.map((content) => (
            <section key={content.id} className="space-y-5">
              <h1 className="text-xl font-bold">{content.title}</h1>
              <p>{content.text}</p>
              {content.svg ? <div className="w-80" dangerouslySetInnerHTML={{ __html: content.svg }} /> : null}
            </section>
          ))}
        </section>
      </section>
      {!data.completed && (
        <div className="flex items-center justify-end pt-10">
          <button
            disabled={isLoadingComplete}
            className="max-w-fit rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:bg-gray-100"
            onClick={async () => {
              try {
                const completed = await completeContent({
                  contentId: data.contents[0]!.id,
                });

                if (completed) {
                  await router.push("/dashboard");
                } else {
                  await refetch();
                }
              } catch (err) {
                // err
              }
            }}
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

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

  if (session.user.role === "teacher") {
    return {
      redirect: {
        destination: "/teacher",
        permanent: false,
      },
    };
  }

  return {
    props: { session, subject: ctx.query.subject },
  };
};
