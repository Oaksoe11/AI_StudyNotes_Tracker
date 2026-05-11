"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { apiDelete, friendlyErrorMessage } from "@/lib/api";

type DeleteButtonProps = {
  endpoint: string;
  label: string;
  confirmMessage: string;
  redirectTo?: string;
  onDeleted?: () => void;
};

export function DeleteButton({ endpoint, label, confirmMessage, redirectTo, onDeleted }: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);

    try {
      await apiDelete(endpoint);
      // Student note:
      // This event keeps shared UI, like the left sidebar, in sync after a delete.
      window.dispatchEvent(new CustomEvent("study-notes:data-changed", { detail: { endpoint } }));
      // Student note:
      // When a parent list gives us onDeleted, it can remove the card instantly.
      onDeleted?.();
      if (redirectTo) {
        router.push(redirectTo);
      }
      if (!onDeleted) {
        router.refresh();
      }
    } catch (error) {
      setIsDeleting(false);
      window.alert(friendlyErrorMessage(error));
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
