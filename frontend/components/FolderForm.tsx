"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { apiPost, friendlyErrorMessage } from "@/lib/api";

type Folder = {
  id: string;
  name: string;
  created_at?: string;
};

type FolderFormProps = {
  onCreated?: (folder: Folder) => void;
};

export function FolderForm({ onCreated }: FolderFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError("");

    try {
      const folder = await apiPost<Folder>("/folders", { name });
      // Student note:
      // If this form lives beside a folder list, update that list without a full page reload.
      onCreated?.(folder);
      setName("");
      setStatus("saved");
      if (!onCreated) {
        router.refresh();
      }
    } catch (error) {
      setError(friendlyErrorMessage(error));
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
      {status === "error" ? <p className="self-center text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
