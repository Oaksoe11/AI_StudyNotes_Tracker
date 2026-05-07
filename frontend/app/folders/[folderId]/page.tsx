import Link from "next/link";
import { BookOpen, FileText, FolderOpen } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { PdfUpload } from "@/components/PdfUpload";
import { apiGet } from "@/lib/api";

type FolderDetail = {
  folder: { id: string; name: string };
  documents: { id: string; file_name: string; status: string }[];
  notes: { id: string; title: string; tone: string }[];
};

export default async function FolderDetailPage({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId } = await params;
  let data: FolderDetail;

  try {
    data = await apiGet<FolderDetail>(`/folders/${folderId}`);
  } catch {
    data = {
      folder: { id: folderId, name: folderId === "demo" ? "CMPT 300" : "Folder" },
      documents: [{ id: "demo", file_name: "Lecture 01.pdf", status: "uploaded" }],
      notes: [{ id: "demo", title: "Lecture 01 Notes", tone: "concise" }]
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-mint">
          <FolderOpen size={20} />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{data.folder.name}</h1>
          <p className="text-slate-600">Upload PDFs and review generated notes.</p>
        </div>
      </div>

      <PdfUpload folderId={data.folder.id} />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">PDFs</h2>
          {data.documents.length ? (
            data.documents.map((document) => (
              <Link key={document.id} href={`/documents/${document.id}`} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 hover:border-ink">
                <FileText size={18} className="text-coral" />
                <span className="flex-1">{document.file_name}</span>
                <span className="text-sm text-slate-500">{document.status}</span>
              </Link>
            ))
          ) : (
            <EmptyState icon={<FileText size={20} />} title="No PDFs" description="Upload a lecture PDF for this folder." />
          )}
        </div>
        <div className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Notes</h2>
          {data.notes.length ? (
            data.notes.map((note) => (
              <Link key={note.id} href={`/notes/${note.id}`} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 hover:border-ink">
                <BookOpen size={18} className="text-coral" />
                <span className="flex-1">{note.title}</span>
                <span className="text-sm text-slate-500">{note.tone}</span>
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

