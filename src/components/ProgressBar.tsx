import { useMemo, type FunctionComponent } from "react";

export interface ProgressBarProps {
  currentStep: number;
  steps: number;
}

const ProgressBar: FunctionComponent<ProgressBarProps> = ({
  currentStep,
  steps,
}) => {
  const completedPercentage = useMemo(() => {
    const percentage = (currentStep / steps) * 100;
    return `${percentage}%`;
  }, [steps, currentStep]);

  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="flex w-full">
        <label className="block">
          Pregunta {currentStep} de {steps}.
        </label>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-300">
        <div
          className={`h-2 rounded-full bg-green-500 transition-[width] ${
            completedPercentage === "100%" ? "" : "rounded-r-none"
          }`}
          style={{ width: completedPercentage }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
