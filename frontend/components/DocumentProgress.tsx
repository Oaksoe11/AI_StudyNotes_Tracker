"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleDot, Loader2 } from "lucide-react";

import { apiGet } from "@/lib/api";

type DocumentProgressProps = {
  documentId?: string;
  status: string;
  pageCount: number;
  noteCount: number;
  // These optional fields come from the backend while extraction is running.
  processingStep?: string | null;
  processingCurrent?: number | null;
  processingTotal?: number | null;
};

type StatusSnapshot = {
  status: string;
  page_count: number;
  note_count: number;
  failure_reason?: string | null;
  processing_step?: string | null;
  processing_current?: number | null;
  processing_total?: number | null;
};

const steps = [
  { key: "uploaded", label: "Uploaded" },
  { key: "extracted", label: "Extracted" },
  { key: "generated", label: "Notes generated" },
  { key: "reviewed", label: "Review note" }
];

export function DocumentProgress({
  documentId,
  status,
  pageCount,
  noteCount,
  processingStep,
  processingCurrent,
  processingTotal
}: DocumentProgressProps) {
  const router = useRouter();
  // Student note:
  // Start with the server-rendered values so the page appears immediately.
  const [snapshot, setSnapshot] = useState<StatusSnapshot>({
    status,
    page_count: pageCount,
    note_count: noteCount,
    processing_step: processingStep,
    processing_current: processingCurrent,
    processing_total: processingTotal
  });
  const activeStep = getActiveStep(snapshot.status, snapshot.page_count, snapshot.note_count);
  // This turns raw progress numbers into a sentence students can understand.
  const progressText = getProgressText(
    snapshot.status,
    snapshot.processing_step,
    snapshot.processing_current,
    snapshot.processing_total
  );

  useEffect(() => {
    setSnapshot({
      status,
      page_count: pageCount,
      note_count: noteCount,
      processing_step: processingStep,
      processing_current: processingCurrent,
      processing_total: processingTotal
    });
  }, [noteCount, pageCount, processingCurrent, processingStep, processingTotal, status]);

  useEffect(() => {
    if (!documentId || !isLiveStatus(snapshot.status, snapshot.page_count)) {
      return;
    }

    const timer = window.setInterval(async () => {
      if (document.hidden) {
        return;
      }

      try {
        const nextSnapshot = await apiGet<StatusSnapshot>(`/documents/${documentId}/status`);
        setSnapshot(nextSnapshot);

        // Student note:
        // Refresh the page only when processing finishes, so new buttons/notes appear.
        if (!isLiveStatus(nextSnapshot.status, nextSnapshot.page_count)) {
          router.refresh();
        }
      } catch {
        // If one status check fails, keep the current UI and try again on the next tick.
      }
    }, 1200);

    return () => window.clearInterval(timer);
  }, [documentId, router, snapshot.page_count, snapshot.status]);

  return (
    <section className="rounded-md border border-line bg-card p-4 shadow-sm">
      {progressText ? (
        <div className="mb-4 rounded-md border border-coral/25 bg-coral/10 px-3 py-2 text-sm text-coral">
          {progressText}
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => {
          const isDone = index < activeStep;
          const isActive = index === activeStep;
          const Icon = isActive && (snapshot.status === "extracting" || snapshot.status === "generating") ? Loader2 : isDone ? CheckCircle2 : CircleDot;

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

function getProgressText(
  status: string,
  step?: string | null,
  current?: number | null,
  total?: number | null
) {
  // If the backend knows the current and total slide count, show exact progress.
  if (status === "extracting" && current && total) {
    const label = step || "Extracting slides";
    return `${label}: slide ${current} of ${total}`;
  }

  // When extraction just started, the backend may not know the total yet.
  if (status === "extracting") {
    return step || "Preparing to extract slides...";
  }

  // Note generation is not page-by-page yet, but users still need status feedback.
  if (status === "generating") {
    return step || "Generating notes with AI...";
  }

  return "";
}

function isLiveStatus(status: string, pageCount: number) {
  // Student note:
  // Right after upload, the row can briefly say "uploaded" before the background task flips to "extracting".
  return status === "extracting" || status === "generating" || (status === "uploaded" && pageCount === 0);
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
