import Link from "next/link";
import { ReactNode } from "react";

type ActionCardProps = {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
};

export function ActionCard({ href, icon, title, description }: ActionCardProps) {
  return (
    <Link
      href={href}
      className="group soft-card rounded-md p-4 transition hover:-translate-y-0.5 hover:border-coral"
    >
      <div className="mb-4 grid size-10 place-items-center rounded-md border border-line bg-mint/70 text-ink transition group-hover:border-coral group-hover:bg-coral group-hover:text-white">
        {icon}
      </div>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </Link>
  );
}
