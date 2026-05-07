"use client";

import { useState } from "react";
import { ScanText } from "lucide-react";

import { extractDocument } from "@/lib/api";

export function ExtractButton({ documentId }: { documentId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleExtract() {
    setStatus("loading");

    try {
      await extractDocument(documentId);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={handleExtract}
        disabled={status === "loading"}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        <ScanText size={16} />
        {status === "loading" ? "Extracting" : "Extract PDF"}
      </button>
      {status === "done" ? <p className="text-sm text-emerald-700">Slide text and images extracted</p> : null}
      {status === "error" ? <p className="text-sm text-red-700">Extraction failed</p> : null}
    </div>
  );
}
