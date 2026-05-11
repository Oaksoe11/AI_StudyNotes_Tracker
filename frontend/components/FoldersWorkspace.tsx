"use client";

import { FolderOpen } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { FolderForm } from "@/components/FolderForm";
import { FoldersList } from "@/components/FoldersList";

type Folder = {
  id: string;
  name: string;
  created_at?: string;
};

type FoldersWorkspaceProps = {
  folders: Folder[];
};

export function FoldersWorkspace({ folders }: FoldersWorkspaceProps) {
  // Student note:
  // This parent owns the folder list so creating/deleting can update the page instantly.
  const [items, setItems] = useState(folders);

  return (
    <>
      <FolderForm
        onCreated={(folder) => {
          // New folders go at the top because the server also sorts newest first.
          setItems((current) => [folder, ...current]);
        }}
      />
      {items.length ? (
        <FoldersList
          folders={items}
          onDeleted={(folderId) => {
            setItems((current) => current.filter((folder) => folder.id !== folderId));
          }}
        />
      ) : (
        <EmptyState icon={<FolderOpen size={20} />} title="No folders" description="Create your first course folder." />
      )}
    </>
  );
}
