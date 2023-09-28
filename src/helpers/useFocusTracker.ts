import { useState, useEffect } from "react";

export const useFocusTime = () => {
  const [startTime] = useState(Date.now());
  const [totalTimeOnScreen, setTotalTimeOnScreen] = useState(Date.now());
  const [bluredAt, setBluredAt] = useState<number>();

  useEffect(() => {
    const updateFocusTime = () => {
      if (document.hidden) {
        setBluredAt(Date.now());
      } else {
        if (bluredAt) {
          const totalTimeBlured = Date.now() - bluredAt;
          setTotalTimeOnScreen((totalTime) => totalTime - totalTimeBlured);
          setBluredAt(undefined);
        }
      }
    };

    document.addEventListener("visibilitychange", updateFocusTime);

    return () => {
      document.removeEventListener("visibilitychange", updateFocusTime);
    };
  }, []);

  return () => ({
    startTime,
    totalTimeOnScreen: Date.now() - totalTimeOnScreen,
  });
};
