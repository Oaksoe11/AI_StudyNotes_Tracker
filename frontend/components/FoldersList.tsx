"use client";

import Link from "next/link";
import { FolderOpen } from "lucide-react";

import { DeleteButton } from "@/components/DeleteButton";

type Folder = {
  id: string;
  name: string;
  created_at?: string;
};

type FoldersListProps = {
  folders: Folder[];
  onDeleted?: (folderId: string) => void;
};

export function FoldersList({ folders, onDeleted }: FoldersListProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {folders.map((folder) => (
        <div key={folder.id} className="rounded-md border border-line bg-card p-4 shadow-sm transition hover:border-coral">
          <Link href={`/folders/${folder.id}`} className="block">
            <FolderOpen className="mb-4 text-coral" size={22} />
            <h2 className="font-semibold">{folder.name}</h2>
            <p className="mt-1 text-sm text-muted">Open folder</p>
          </Link>
          <div className="mt-4">
            <DeleteButton
              endpoint={`/folders/${folder.id}`}
              label="Delete"
              confirmMessage={`Delete folder "${folder.name}" and its documents/notes?`}
              onDeleted={() => {
                // Student note:
                // Delete succeeded, so remove this card without making the whole page reload.
                onDeleted?.(folder.id);
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
