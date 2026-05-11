import { CircleAlert } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { FoldersWorkspace } from "@/components/FoldersWorkspace";
import { serverApiGet, serverFriendlyErrorMessage } from "@/lib/server-api";

type Folder = { id: string; name: string; created_at?: string };

export default async function FoldersPage() {
  let folders: Folder[] = [];
  let error = "";

  try {
    folders = await serverApiGet<Folder[]>("/folders");
  } catch (caughtError) {
    folders = [];
    error = serverFriendlyErrorMessage(caughtError);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Folders</h1>
        <p className="mt-2 text-muted">Manage course folders and open their lecture materials.</p>
      </div>
      {error ? (
        <EmptyState icon={<CircleAlert size={20} />} title="Could not load folders" description={error} />
      ) : (
        <FoldersWorkspace folders={folders} />
      )}
    </div>
  );
}
