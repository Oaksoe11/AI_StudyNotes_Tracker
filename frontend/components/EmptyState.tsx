import { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center rounded-md border border-dashed border-line bg-card/80 px-6 py-10 text-center shadow-sm">
      <div className="mb-4 grid size-12 place-items-center rounded-md border border-line bg-mint/70 text-ink">{icon}</div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
