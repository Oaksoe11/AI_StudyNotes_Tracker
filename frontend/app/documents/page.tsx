import Link from "next/link";
import { FileText } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { serverApiGet } from "@/lib/server-api";

type Document = {
  id: string;
  title?: string;
  file_name: string;
  status: string;
  created_at?: string;
};

export default async function DocumentsPage() {
  let documents: Document[] = [];

  try {
    documents = await serverApiGet<Document[]>("/documents");
  } catch {
    documents = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Documents</h1>
        <p className="mt-2 text-muted">Uploaded PDFs and their processing states.</p>
      </div>

      {documents.length ? (
        <div className="grid gap-3">
          {documents.map((document) => (
            <Link
              key={document.id}
              href={`/documents/${document.id}`}
              className="flex items-center justify-between gap-4 rounded-md border border-line bg-card p-4 shadow-sm transition hover:border-coral"
            >
              <span className="flex min-w-0 items-center gap-3">
                <FileText size={18} className="text-coral" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{document.title || document.file_name}</span>
                  <span className="text-sm text-muted">{document.file_name}</span>
                </span>
              </span>
              <StatusBadge status={document.status} />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={<FileText size={20} />} title="No documents" description="Upload a PDF inside a folder to see it here." />
      )}
    </div>
  );
}
