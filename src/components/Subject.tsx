import { useRouter } from "next/router";
import type { FunctionComponent } from "react";

interface SubjectInterface {
  id: number;
  name: string;
  image: string;
  completed: boolean;
  subject:
    | "coulombs_force_law"
    | "electric_dipole"
    | "electric_field_of_point_charges"
    | "electrical_charges"
    | "field_lines_and_equipotential_surfaces";
}

const Subject: FunctionComponent<SubjectInterface> = ({ name, image, subject }) => {
  const router = useRouter();

  return (
    <div
      className="col-span-1 flex h-60 cursor-pointer items-center justify-center rounded-lg border border-gray-400 bg-contain bg-center bg-no-repeat bg-blend-overlay"
      style={{
        backgroundImage: `URL(${image}), linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4))`,
      }}
      onClick={() => router.push("/quiz", { pathname: "/quiz", query: { subject } })}
    >
      <h1 className="text-center text-xl font-bold text-white">{name}</h1>
    </div>
  );
};

export default Subject;
