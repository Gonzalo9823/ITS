import type { NextPage } from "next";
import Navbar from "~/components/Navbar";
import Subject from "~/components/Subject";
import { getServerAuthSession } from "../server/auth";
import { type GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { Fragment } from "react";

const DashboardPage: NextPage = () => {
  const { data: session } = useSession();
  const { isLoading, data } = api.subject.getMany.useQuery();

  if (isLoading || !data) return <h1>Loading...</h1>;

  return (
    <div className="space-y-5 px-20 py-4">
      <Navbar user={{ name: session?.user.name ?? "", role: session?.user.role ?? "student" }} />
      <section className="space-y-5">
        <h1 className="text-xl font-bold">Path de Estudio</h1>
        <div className="grid grid-cols-12 gap-x-10 gap-y-28">
          {data.map(({ id, completed, subject, canView }) => (
            <Fragment key={id}>
              <div className="col-span-1 flex items-center justify-center">
                <ArrowRightIcon />
              </div>
              <Subject completed={completed} canView={canView} {...subject} />
            </Fragment>
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
