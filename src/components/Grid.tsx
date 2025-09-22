import type { ReactNode } from 'react';
import clsx from 'clsx';

export default function Grid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {children}
    </div>
  );
}
