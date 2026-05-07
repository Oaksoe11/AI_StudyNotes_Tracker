"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function FolderForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        throw new Error("Unable to create folder");
      }

      setName("");
      setStatus("saved");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-md border border-line bg-card shadow-sm p-4 sm:flex-row">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Course folder name"
        className="min-h-11 flex-1 rounded-md border border-line px-3 text-sm outline-none focus:border-coral"
        required
      />
      <button
        type="submit"
        disabled={status === "saving"}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-coral px-4 text-sm font-medium text-white shadow-sm transition hover:bg-berry disabled:opacity-60"
      >
        <Plus size={16} />
        {status === "saving" ? "Creating" : "Create"}
      </button>
      {status === "saved" ? <p className="self-center text-sm text-emerald-700">Folder created</p> : null}
      {status === "error" ? <p className="self-center text-sm text-red-700">Could not create folder</p> : null}
    </form>
  );
}
