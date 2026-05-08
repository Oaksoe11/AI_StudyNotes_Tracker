"use client";

import { FormEvent, useState } from "react";
import { FileUp, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Tone, uploadPdf } from "@/lib/api";

const tones: { value: Tone; label: string }[] = [
  { value: "concise", label: "Concise" },
  { value: "detailed", label: "Detailed" },
  { value: "exam_prep", label: "Exam prep" },
  { value: "beginner", label: "Beginner" }
];

export function PdfUpload({ folderId }: { folderId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [tone, setTone] = useState<Tone>("concise");
  const [status, setStatus] = useState<"idle" | "uploading" | "uploaded" | "error">("idle");
  const [isDragging, setIsDragging] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file || file.type !== "application/pdf") {
      setStatus("error");
      return;
    }

    setStatus("uploading");

    try {
      const response = await uploadPdf(folderId, tone, file);
      setFile(null);
      setStatus("idle");
      setIsOpen(false);
      router.refresh();
      router.push(`/documents/${response.document_id}`);
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-medium text-white shadow-sm transition hover:bg-berry"
      >
        <Upload size={16} />
        Upload PDF
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-md border border-line bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Upload lecture PDF</h2>
                <p className="mt-1 text-sm text-muted">Choose a tone now so the document is ready for generation later.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-9 place-items-center rounded-md border border-line hover:border-coral hover:text-coral"
                title="Close upload modal"
              >
                <X size={16} />
              </button>
            </div>

            <label
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                setFile(event.dataTransfer.files?.[0] ?? null);
              }}
              className={`mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-6 text-center transition ${
                isDragging ? "border-coral bg-coral/10" : "border-line bg-paper/60"
              }`}
            >
              <FileUp className="text-coral" size={28} />
              <span className="mt-3 font-medium">{file ? file.name : "Drop a PDF here or browse"}</span>
              <span className="mt-1 text-sm text-muted">PDF files only</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>

            <label className="mt-4 block text-sm font-medium">
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

            {status === "uploaded" ? <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">Upload complete</p> : null}
            {status === "error" ? <p className="mt-3 text-sm text-red-700 dark:text-red-300">Choose a valid PDF and try again.</p> : null}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-11 rounded-md border border-line px-4 text-sm font-medium hover:border-coral"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === "uploading"}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-medium text-white shadow-sm transition hover:bg-berry disabled:opacity-60"
              >
                <Upload size={16} />
                {status === "uploading" ? "Uploading" : "Upload"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
