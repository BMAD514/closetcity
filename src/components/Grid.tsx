import type { ReactNode } from "react";
import clsx from "clsx";

export default function Grid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-3", className)}>
      {children}
    </div>
  );
}
