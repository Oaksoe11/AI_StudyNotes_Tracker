"use client";

import { useState } from "react";
import { WandSparkles } from "lucide-react";

import { generateNotes, Tone } from "@/lib/api";

const tones: { value: Tone; label: string }[] = [
  { value: "concise", label: "Concise" },
  { value: "detailed", label: "Detailed" },
  { value: "exam_prep", label: "Exam prep" },
  { value: "beginner", label: "Beginner" }
];

export function ToneSelect({ documentId }: { documentId: string }) {
  const [tone, setTone] = useState<Tone>("concise");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleGenerate() {
    setStatus("loading");

    try {
      await generateNotes(documentId, tone);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
      <label className="flex-1 text-sm font-medium">
        Note tone
        <select
          value={tone}
          onChange={(event) => setTone(event.target.value as Tone)}
          className="mt-2 min-h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
        >
          {tones.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={status === "loading"}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        <WandSparkles size={16} />
        {status === "loading" ? "Generating" : "Generate notes"}
      </button>
      {status === "done" ? <p className="self-center text-sm text-emerald-700">Notes generated</p> : null}
      {status === "error" ? <p className="self-center text-sm text-red-700">Generation failed</p> : null}
    </div>
  );
}

