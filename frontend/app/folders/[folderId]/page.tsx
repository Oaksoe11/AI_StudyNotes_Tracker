import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, FileText, FolderOpen } from "lucide-react";

import { DeleteButton } from "@/components/DeleteButton";
import { EmptyState } from "@/components/EmptyState";
import { PdfUpload } from "@/components/PdfUpload";
import { StatusBadge } from "@/components/StatusBadge";
import { serverApiGet } from "@/lib/server-api";

type FolderDetail = {
  folder: { id: string; name: string };
  documents: { id: string; title?: string; file_name: string; status: string }[];
  notes: { id: string; title: string; tone: string }[];
};

export default async function FolderDetailPage({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId } = await params;
  let data: FolderDetail;

  try {
    data = await serverApiGet<FolderDetail>(`/folders/${folderId}`);
  } catch {
    redirect("/folders");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-mint">
              <FolderOpen size={20} />
            </span>
            <div>
              <h1 className="text-3xl font-semibold tracking-normal">{data.folder.name}</h1>
              <p className="text-muted">Uploaded PDFs, generated notes, and processing progress.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PdfUpload folderId={data.folder.id} />
          <DeleteButton
            endpoint={`/folders/${data.folder.id}`}
            label="Delete folder"
            confirmMessage={`Delete folder "${data.folder.name}" and its documents/notes?`}
            redirectTo="/folders"
          />
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-md border border-line bg-card shadow-sm p-4">
          <h2 className="font-semibold">Uploaded PDFs</h2>
          {data.documents.length ? (
            data.documents.map((document) => (
              <div key={document.id} className="flex items-center gap-3 rounded-md border border-line p-3">
                <Link href={`/documents/${document.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:text-coral">
                  <FileText size={18} className="text-coral" />
                  <span className="min-w-0 flex-1 truncate">{document.title || document.file_name}</span>
                </Link>
                <StatusBadge status={document.status} />
                <DeleteButton
                  endpoint={`/documents/${document.id}`}
                  label="Delete"
                  confirmMessage={`Delete document "${document.title || document.file_name}"?`}
                />
              </div>
            ))
          ) : (
            <EmptyState icon={<FileText size={20} />} title="Empty folder" description="Upload a lecture PDF to start extracting slides and generating notes." />
          )}
        </div>
        <div className="space-y-3 rounded-md border border-line bg-card shadow-sm p-4">
          <h2 className="font-semibold">Notes</h2>
          {data.notes.length ? (
            data.notes.map((note) => (
              <Link key={note.id} href={`/notes/${note.id}`} className="flex items-center gap-3 rounded-md border border-line p-3 hover:border-coral">
                <BookOpen size={18} className="text-coral" />
                <span className="flex-1">{note.title}</span>
                <span className="text-sm text-muted">{note.tone}</span>
              </Link>
            ))
          ) : (
            <EmptyState icon={<BookOpen size={20} />} title="No notes" description="Generate notes from an extracted document." />
          )}
        </div>
      </section>
    </div>
  );
}
