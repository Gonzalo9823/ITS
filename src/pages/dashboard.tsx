import type { NextPage } from "next";
import Navbar from "~/components/Navbar";
import Subject from "~/components/Subject";
import { getServerAuthSession } from "../server/auth";
import { type GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";

const DashboardPage: NextPage = () => {
  const { data: session } = useSession();
  const { isLoading, data } = api.subject.get.useQuery();

  if (isLoading || !data) return <h1>Loading...</h1>;

  return (
    <div className="space-y-5 px-20 py-4">
      <Navbar user={{ name: session?.user.name ?? "", role: session?.user.role ?? "student" }} />
      <section className="space-y-5">
        <h1 className="text-xl font-bold">Path de Estudio</h1>
        <div className="grid grid-cols-4 gap-10">
          {data.map(({ id, completed, subject }) => (
            <Subject key={id} completed={completed} {...subject} />
          ))}
        </div>
      </section>
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
    props: { session },
  };
};
