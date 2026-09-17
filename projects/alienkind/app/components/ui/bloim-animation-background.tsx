"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import UnicornScene from "unicornstudio-react";

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

export const Component = () => {
  const { width, height } = useWindowSize();

  /* The scene fetches its own runtime and project data from unicorn.studio, so
     it only draws once it is on a real origin. Nothing renders until the
     window size is known, which also keeps it out of the server render. */
  if (!width || !height) return null;

  return (
    <div className={cn("flex flex-col items-center")}>
      <UnicornScene production={true} projectId="9tVO0xGS8DIar1DF4Sqc" width={width} height={height} />
    </div>
  );
};
