import type { GetServerSideProps } from "next";
import { getServerAuthSession } from "~/server/auth";

export default function Home() {
  return <></>;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerAuthSession(ctx);

  if (!session) {
    return {
      redirect: {
        destination: "/api/auth/signin",
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: session.user.role === "teacher" ? "/teacher" : "/dashboard",
      permanent: false,
    },
  };
};
