import Link from "next/link";
import { FolderOpen } from "lucide-react";

import { DeleteButton } from "@/components/DeleteButton";
import { EmptyState } from "@/components/EmptyState";
import { FolderForm } from "@/components/FolderForm";
import { serverApiGet } from "@/lib/server-api";

type Folder = { id: string; name: string; created_at?: string };

export default async function FoldersPage() {
  let folders: Folder[] = [];

  try {
    folders = await serverApiGet<Folder[]>("/folders");
  } catch {
    folders = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Folders</h1>
        <p className="mt-2 text-muted">Manage course folders and open their lecture materials.</p>
      </div>
      <FolderForm />
      {folders.length ? (
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
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<FolderOpen size={20} />} title="No folders" description="Create your first course folder." />
      )}
    </div>
  );
}
