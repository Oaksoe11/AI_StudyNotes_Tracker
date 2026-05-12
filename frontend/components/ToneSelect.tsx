"use client";

import { useState } from "react";
import { WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { friendlyErrorMessage, generateNotes, Tone } from "@/lib/api";

const tones: { value: Tone; label: string }[] = [
  { value: "concise", label: "Quick study notes" },
  { value: "detailed", label: "Full lecture notes" },
  { value: "exam_prep", label: "Exam prep" },
  { value: "beginner", label: "Explain like I'm new" }
];

export function ToneSelect({ documentId, disabled = false }: { documentId: string; disabled?: boolean }) {
  const router = useRouter();
  const [tone, setTone] = useState<Tone>("concise");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleGenerate() {
    setStatus("loading");
    setError("");

    try {
      const response = await generateNotes(documentId, tone);
      setStatus("done");
      router.push(`/notes/${response.note_id}`);
    } catch (error) {
      setError(friendlyErrorMessage(error));
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-card shadow-sm p-4 sm:flex-row sm:items-end">
      <label className="flex-1 text-sm font-medium">
        Note tone
        <select
          value={tone}
          onChange={(event) => setTone(event.target.value as Tone)}
          className="mt-2 min-h-11 w-full rounded-md border border-line px-3 text-sm"
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
        disabled={status === "loading" || disabled}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-medium text-white shadow-sm transition hover:bg-berry disabled:opacity-60"
      >
        <WandSparkles size={16} />
        {status === "loading" ? "Generating" : "Generate notes"}
      </button>
      {status === "loading" ? (
        <p className="self-center text-sm text-muted">
          AI generation can take up to a couple minutes. Keep this page open.
        </p>
      ) : null}
      {status === "done" ? <p className="self-center text-sm text-emerald-700">Opening note...</p> : null}
      {status === "error" ? <p className="self-center text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
