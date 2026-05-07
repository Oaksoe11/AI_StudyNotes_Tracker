import { CheckCircle2, CircleAlert, CircleDot, Loader2, ScanText, WandSparkles } from "lucide-react";

const statusConfig = {
  uploaded: {
    label: "Uploaded",
    className: "border-sky/35 bg-sky/12 text-sky",
    icon: CircleDot
  },
  extracting: {
    label: "Extracting",
    className: "border-mint/40 bg-mint/15 text-mint",
    icon: ScanText
  },
  generating: {
    label: "Generating",
    className: "border-berry/35 bg-berry/12 text-berry",
    icon: WandSparkles
  },
  completed: {
    label: "Completed",
    className: "border-emerald-400/35 bg-emerald-400/12 text-emerald-500 dark:text-emerald-300",
    icon: CheckCircle2
  },
  failed: {
    label: "Failed",
    className: "border-red-400/35 bg-red-400/12 text-red-500 dark:text-red-300",
    icon: CircleAlert
  }
};

export function StatusBadge({ status }: { status?: string }) {
  const config = statusConfig[(status ?? "uploaded") as keyof typeof statusConfig] ?? statusConfig.uploaded;
  const Icon = config.icon;
  const isActive = status === "extracting" || status === "generating";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {isActive ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
      {config.label}
    </span>
  );
}

