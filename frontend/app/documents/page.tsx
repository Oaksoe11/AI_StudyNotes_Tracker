import { CircleAlert, FileText } from "lucide-react";

import { AutoRefresh } from "@/components/AutoRefresh";
import { DocumentsList } from "@/components/DocumentsList";
import { EmptyState } from "@/components/EmptyState";
import { serverApiGet, serverFriendlyErrorMessage } from "@/lib/server-api";

type Document = {
  id: string;
  title?: string;
  file_name: string;
  status: string;
  created_at?: string;
};

export default async function DocumentsPage() {
  let documents: Document[] = [];
  let error = "";

  try {
    documents = await serverApiGet<Document[]>("/documents");
  } catch (caughtError) {
    documents = [];
    error = serverFriendlyErrorMessage(caughtError);
  }
  const hasProcessingDocuments = documents.some((document) => document.status === "extracting" || document.status === "generating");

  return (
    <div className="space-y-6">
      <AutoRefresh enabled={hasProcessingDocuments} />
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Documents</h1>
        <p className="mt-2 text-muted">Uploaded PDFs and their processing states.</p>
      </div>

      {error ? (
        <EmptyState icon={<CircleAlert size={20} />} title="Could not load documents" description={error} />
      ) : documents.length ? (
        <DocumentsList documents={documents} />
      ) : (
        <EmptyState icon={<FileText size={20} />} title="No documents" description="Upload a PDF inside a folder to see it here." />
      )}
    </div>
  );
}
