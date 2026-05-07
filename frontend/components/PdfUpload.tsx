"use client";

import { FormEvent, useState } from "react";
import { Upload } from "lucide-react";

import { Tone, uploadPdf } from "@/lib/api";

const tones: { value: Tone; label: string }[] = [
  { value: "concise", label: "Concise" },
  { value: "detailed", label: "Detailed" },
  { value: "exam_prep", label: "Exam prep" },
  { value: "beginner", label: "Beginner" }
];

export function PdfUpload({ folderId }: { folderId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [tone, setTone] = useState<Tone>("concise");
  const [status, setStatus] = useState<"idle" | "uploading" | "uploaded" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file || file.type !== "application/pdf") {
      setStatus("error");
      return;
    }

    setStatus("uploading");

    try {
      await uploadPdf(folderId, tone, file);
      setStatus("uploaded");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-slate-200 bg-white p-4">
      <label className="block text-sm font-medium">Lecture PDF</label>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={tone}
          onChange={(event) => setTone(event.target.value as Tone)}
          className="min-h-11 rounded-md border border-slate-300 px-3 text-sm"
        >
          {tones.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={status === "uploading"}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          <Upload size={16} />
          {status === "uploading" ? "Uploading" : "Upload"}
        </button>
      </div>
      {status === "uploaded" ? <p className="mt-3 text-sm text-emerald-700">Upload complete</p> : null}
      {status === "error" ? <p className="mt-3 text-sm text-red-700">Choose a valid PDF and try again.</p> : null}
    </form>
  );
}
