"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { apiDelete } from "@/lib/api";

type DeleteButtonProps = {
  endpoint: string;
  label: string;
  confirmMessage: string;
  redirectTo?: string;
};

export function DeleteButton({ endpoint, label, confirmMessage, redirectTo }: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);

    try {
      await apiDelete(endpoint);
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch {
      setIsDeleting(false);
      window.alert("Delete failed. Try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-red-400/40 px-3 text-sm font-medium text-red-600 transition hover:bg-red-500 hover:text-white disabled:opacity-60 dark:text-red-300"
    >
      <Trash2 size={15} />
      {isDeleting ? "Deleting" : label}
    </button>
  );
}
