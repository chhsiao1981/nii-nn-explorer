import { useEffect, useMemo, useState } from "react";

const WINDOW_SCROLLBAR_SIZE = 20;

export default () => {
  const [widthAndHeight, setWidthAndHeight] = useState(() => [
    window.innerWidth,
    window.innerHeight,
  ]);

  const handler = useMemo(() => {
    if (
      Math.abs(window.innerWidth - widthAndHeight[0]) < WINDOW_SCROLLBAR_SIZE &&
      Math.abs(window.innerHeight - widthAndHeight[1]) < WINDOW_SCROLLBAR_SIZE
    ) {
      return;
    }

    setWidthAndHeight([window.innerWidth, window.innerHeight]);
  }, [widthAndHeight[0], widthAndHeight[1]]);

  useEffect(() => {
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [handler]);

  return widthAndHeight;
};
