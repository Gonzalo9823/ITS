import type { NextPage } from "next";
import Navbar from "~/components/Navbar";
import Subject from "~/components/Subject";
import { getServerAuthSession } from "../server/auth";
import { type GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import Link from "next/link";

const DashboardPage: NextPage = () => {
  const { data: session } = useSession();

  const subjects = [
    {
      id: 1,
      name: "Cargas Électricas",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUr8NqrgLg-GkoTBAThfCq0TneDftTTSce7cEOmvX65_UeMdGpiJ30OebRiF_CsK-ZYFs&usqp=CAU",
      completed: false,
      subject: "electrical_charges",
    },
    {
      id: 2,
      name: "Ley de Fuerzas de Coulomb",
      image: "https://s1.significados.com/foto/ejemplo.-ley-de-coulomb.png",
      completed: false,
      subject: "coulombs_force_law",
    },
    {
      id: 3,
      name: "Campo Électrico de Cargas Puntuales",
      image: "https://cdn.kastatic.org/ka-perseus-images/6db3d4851432e3cded684cd6748f779fea347f52.svg",
      completed: false,
      subject: "electric_field_of_point_charges",
    },
    {
      id: 4,
      name: "Líneas de Campo y Superficies Equipotenciales",
      image: "http://rsefalicante.umh.es/TemasCampoElectrico/equipotenciales2.PNG",
      completed: false,
      subject: "field_lines_and_equipotential_surfaces",
    },
    {
      id: 5,
      name: "Dipolo Eléctrico",
      image: "https://qph.cf2.quoracdn.net/main-qimg-b804daa95856ef187a9091d43113def1",
      completed: false,
      subject: "electric_dipole",
    },
  ] as const;

  return (
    <div className="space-y-5 px-20 py-4">
      <Navbar user={{ name: session?.user.name ?? "Usuario" }} />
      <section className="space-y-5">
        <h1 className="text-xl font-bold">DEMO</h1>
        <h1 className="font-bold">
          DISCLAIMER: SOLO SE PUEDE TENER UN QUIZ DE OPCIÓN MULTIPLE Y UN QUIZ DE DESARROLLO POR TEMA A LA VEZ POR LO QUE PARA COMENZAR UNO NUEVO
          DEBES HABER TERMINADO EL ANTERIOR.
        </h1>
        <div className="flex flex-col">
          <Link
            className="hover:underline"
            href={{
              pathname: "/quiz",
              query: {
                subject: "electrical_charges",
                amountOfQuestions: 3,
              },
            }}
          >
            &#8226; Tarea Modulo 1: Opción Multiple 3 Preguntas
          </Link>
          <Link
            className="hover:underline"
            href={{
              pathname: "/complex-quiz",
              query: {
                subject: "electrical_charges",
              },
            }}
          >
            &#8226; Tarea Modulo 1: Desarrollo
          </Link>
          <Link
            className="hover:underline"
            href={{
              pathname: "/quiz",
              query: {
                subject: "coulombs_force_law",
                amountOfQuestions: 4,
              },
            }}
          >
            &#8226; Tarea Modulo 2: Opción Multiple 4 Preguntas
          </Link>
          <Link
            className="hover:underline"
            href={{
              pathname: "/complex-quiz",
              query: {
                subject: "coulombs_force_law",
              },
            }}
          >
            &#8226; Tarea Modulo 2: Desarrollo
          </Link>
        </div>
      </section>
      {/* <section className="space-y-5"> */}
      {/*   <h1 className="text-xl font-bold">Path de Estudio</h1> */}
      {/*   <div className="grid grid-cols-4 gap-10"> */}
      {/*     {subjects.map((subject) => ( */}
      {/*       <Subject key={subject.id} {...subject} /> */}
      {/*     ))} */}
      {/*   </div> */}
      {/* </section> */}
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

  return {
    props: { session },
  };
};
