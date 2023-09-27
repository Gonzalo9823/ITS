import { useRouter } from "next/router";
import type { FunctionComponent } from "react";
import { CheckIcon, LockClosedIcon, EyeIcon } from "@heroicons/react/20/solid";

interface SubjectInterface {
  id: number;
  spanishName: string;
  image: string;
  completed: boolean;
  name: string;
  canView?: boolean;
  isTeacher?: boolean;
}

const Subject: FunctionComponent<SubjectInterface> = ({ spanishName, image, name, isTeacher, completed, canView }) => {
  const router = useRouter();

  const handleOnClick = async () => {
    if (isTeacher) {
      await router.push(`/teacher/subject/${name}`);
      return;
    }

    if (!canView) return;
    await router.push("/subject");
  };

  return (
    <div
      className={`relative flex h-60 items-center justify-center rounded-lg border border-gray-400 bg-contain bg-center bg-no-repeat bg-blend-overlay ${
        canView ?? isTeacher ? "cursor-pointer" : ""
      } ${isTeacher ? "col-span-1" : "col-span-3"}`}
      style={{
        backgroundImage: `URL(${image}), linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4))`,
      }}
      onClick={handleOnClick}
    >
      <h1 className="text-center text-xl font-bold text-white">{spanishName}</h1>
      {isTeacher !== true && completed ? (
        <div className="absolute bottom-2 right-2 h-14 w-14">
          <CheckIcon className="text-green-500" />
        </div>
      ) : null}

      {isTeacher !== true && canView === false ? (
        <div className="absolute bottom-2 right-2 h-14 w-14">
          <LockClosedIcon className="text-yellow-500" />
        </div>
      ) : null}

      {isTeacher !== true && canView === true && completed === false ? (
        <div className="absolute bottom-2 right-2 h-14 w-14">
          <EyeIcon className="text-blue-500" />
        </div>
      ) : null}
    </div>
  );
};

export default Subject;
