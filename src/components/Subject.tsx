import { useRouter } from "next/router";
import type { FunctionComponent } from "react";

interface SubjectInterface {
  id: number;
  spanishName: string;
  image: string;
  completed: boolean;
  name: string;
  isTeacher?: boolean;
}

const Subject: FunctionComponent<SubjectInterface> = ({ spanishName, image, name, isTeacher }) => {
  const router = useRouter();

  const handleOnClick = async () => {
    if (isTeacher) {
      await router.push(`/teacher/subject/${name}`);
      return;
    }

    await router.push("/quiz", { pathname: "/quiz", query: { subject: name } });
  };

  return (
    <div
      className="relative col-span-1 flex h-60 cursor-pointer items-center justify-center rounded-lg border border-gray-400 bg-contain bg-center bg-no-repeat bg-blend-overlay"
      style={{
        backgroundImage: `URL(${image}), linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4))`,
      }}
      onClick={handleOnClick}
    >
      <h1 className="text-center text-xl font-bold text-white">{spanishName}</h1>
      {/* <div className="absolute inset-0 m-auto h-5 w-5 bg-red-50" /> */}
    </div>
  );
};

export default Subject;
