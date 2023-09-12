import type { Dispatch, SetStateAction, FunctionComponent } from "react";

interface MultipleAnswerQuestionProps {
  question: {
    answers: {
      checked: boolean;
      hint: string;
      isCorrect: boolean;
      id: number;
      isWrong: boolean;
      label: string;
      value: string | number;
    }[];
    description?: string;
    disabled?: boolean;
    id: number;
    title: string;
  };
  state?: [string, Dispatch<SetStateAction<string>>];
}

const MultipleAnswerQuestion: FunctionComponent<MultipleAnswerQuestionProps> = ({
  question: { answers, description, disabled, id, title },
  state,
}) => {
  return (
    <>
      <div>
        <h1 className="text-lg font-bold">{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      <div>
        <ul>
          {answers.map((answer) => (
            <li key={answer.id} className="flex flex-col">
              <div className="space-x-5">
                <input
                  type="radio"
                  name={`multiple_answer_question_${id}`}
                  id={`answer_${answer.id}`}
                  value={answer.value}
                  className={`${answer.isCorrect ? "accent-green-500 disabled:accent-green-500" : ""} ${
                    answer.isWrong ? "accent-red-500 disabled:accent-red-500" : ""
                  }`}
                  disabled={disabled}
                  checked={answer.checked}
                  onChange={(evt) => state![1](evt.currentTarget.value)}
                />
                <label
                  className={`${answer.isCorrect ? "text-green-500" : ""} ${answer.isWrong ? "text-red-500" : ""}`}
                  htmlFor={`answer_${answer.id}`}
                >
                  {answer.label}
                </label>
              </div>
              {answer.isWrong ? (
                <div className="m-2 rounded-xl bg-red-500 p-4 text-white">
                  <p>{answer.hint}</p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default MultipleAnswerQuestion;
