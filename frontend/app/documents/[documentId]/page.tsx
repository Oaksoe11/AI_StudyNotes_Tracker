import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { AutoRefresh } from "@/components/AutoRefresh";
import { DeleteButton } from "@/components/DeleteButton";
import { DocumentProgress } from "@/components/DocumentProgress";
import { ExtractButton } from "@/components/ExtractButton";
import { GenerateQuizButton } from "@/components/GenerateQuizButton";
import { StatusBadge } from "@/components/StatusBadge";
import { ToneSelect } from "@/components/ToneSelect";
import { serverApiGet } from "@/lib/server-api";

type DocumentDetail = {
  document: {
    id: string;
    title?: string;
    file_name: string;
    status: string;
    page_count: number;
    failure_reason?: string | null;
    selected_tone?: string;
  };
  slides?: { id: string; page_number: number; extracted_text?: string; text?: string; image_url?: string }[];
  pages: { id: string; page_number: number; extracted_text?: string; text?: string; image_url?: string }[];
  notes: { id: string; title: string }[];
};

export default async function DocumentDetailPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  let data: DocumentDetail;

  try {
    data = await serverApiGet<DocumentDetail>(`/documents/${documentId}`);
  } catch {
    data = {
      document: { id: documentId, file_name: "Document", status: "uploaded", page_count: 0 },
      pages: [],
      notes: []
    };
  }
  const pageCount = data.pages.length || data.document.page_count || 0;
  const hasExtractedSlides = pageCount > 0;
  const hasNotes = data.notes.length > 0;
  const isProcessing =
    data.document.status === "extracting" ||
    data.document.status === "generating" ||
    (data.document.status === "uploaded" && !hasExtractedSlides);

  return (
    <div className="space-y-6">
      <AutoRefresh enabled={isProcessing} />
      <Link href="/documents" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-coral">
        <ArrowLeft size={16} />
        Back to documents
      </Link>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-mint">
            <FileText size={20} />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">{data.document.title || data.document.file_name}</h1>
            <div className="mt-1"><StatusBadge status={data.document.status} /></div>
          </div>
        </div>
        <DeleteButton
          endpoint={`/documents/${data.document.id}`}
          label="Delete document"
          confirmMessage={`Delete document "${data.document.title || data.document.file_name}"?`}
          redirectTo="/documents"
        />
      </div>

      {data.document.failure_reason ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {data.document.failure_reason}
        </div>
      ) : null}

      <DocumentProgress status={data.document.status} pageCount={pageCount} noteCount={data.notes.length} />

      <section className="space-y-4 rounded-md border border-line bg-card p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Next step</h2>
          <p className="mt-1 text-sm text-muted">
            {hasNotes
              ? "Your notes are ready. Open them below, or generate another version with a different tone."
              : hasExtractedSlides
                ? "Slide text is ready. Choose a tone and generate your notes."
                : "Extract the PDF first. This saves slide text and small preview images for note generation."}
          </p>
        </div>
        {hasExtractedSlides ? <ToneSelect documentId={data.document.id} /> : <ExtractButton documentId={data.document.id} />}
        {hasExtractedSlides ? <GenerateQuizButton documentId={data.document.id} label="Practice this lecture" /> : null}
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Slides extracted" value={pageCount} />
        <Metric label="Notes" value={data.notes.length} />
        <Metric label="Status" value={data.document.status} />
      </div>

      <section className="space-y-3 rounded-md border border-line bg-card shadow-sm p-4">
        <h2 className="font-semibold">Slide preview</h2>
        {data.pages.length ? (
          data.pages.slice(0, 8).map((page) => (
            <div key={page.id} className="rounded-md border border-line p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">Slide {page.page_number}</h3>
                {page.image_url ? <span className="text-xs text-muted">Image saved</span> : null}
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{page.extracted_text || page.text || "No extractable text"}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">Extract the PDF to save slide text and images.</p>
        )}
      </section>

      <section className="space-y-3 rounded-md border border-line bg-card shadow-sm p-4">
        <h2 className="font-semibold">Generated notes</h2>
        {data.notes.map((note) => (
          <Link key={note.id} href={`/notes/${note.id}`} className="block rounded-md border border-line p-3 hover:border-coral">
            {note.title}
          </Link>
        ))}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-line bg-card shadow-sm p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
