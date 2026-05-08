import { CheckCircle2, CircleDot, Loader2 } from "lucide-react";

type DocumentProgressProps = {
  status: string;
  pageCount: number;
  noteCount: number;
};

const steps = [
  { key: "uploaded", label: "Uploaded" },
  { key: "extracted", label: "Extracted" },
  { key: "generated", label: "Notes generated" },
  { key: "reviewed", label: "Review note" }
];

export function DocumentProgress({ status, pageCount, noteCount }: DocumentProgressProps) {
  const activeStep = getActiveStep(status, pageCount, noteCount);

  return (
    <section className="rounded-md border border-line bg-card p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => {
          const isDone = index < activeStep;
          const isActive = index === activeStep;
          const Icon = isActive && (status === "extracting" || status === "generating") ? Loader2 : isDone ? CheckCircle2 : CircleDot;

          return (
            <div key={step.key} className="flex items-center gap-3 rounded-md border border-line bg-paper/45 p-3">
              <span
                className={`grid size-8 place-items-center rounded-md border ${
                  isDone
                    ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-600 dark:text-emerald-300"
                    : isActive
                      ? "border-coral/45 bg-coral/12 text-coral"
                      : "border-line text-muted"
                }`}
              >
                <Icon size={16} className={Icon === Loader2 ? "animate-spin" : ""} />
              </span>
              <div>
                <p className="text-sm font-medium">{step.label}</p>
                <p className="text-xs text-muted">{isDone ? "Done" : isActive ? "Current" : "Waiting"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getActiveStep(status: string, pageCount: number, noteCount: number) {
  if (noteCount > 0 || status === "completed") {
    return 3;
  }

  if (status === "generating") {
    return 2;
  }

  if (pageCount > 0) {
    return 2;
  }

  if (status === "extracting") {
    return 1;
  }

  return 0;
}
