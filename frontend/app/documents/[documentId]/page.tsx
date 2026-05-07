import Link from "next/link";
import { FileText } from "lucide-react";

import { ToneSelect } from "@/components/ToneSelect";
import { apiGet } from "@/lib/api";

type DocumentDetail = {
  document: { id: string; file_name: string; status: string; page_count: number };
  pages: { id: string; page_number: number; text: string }[];
  notes: { id: string; title: string }[];
};

export default async function DocumentDetailPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  let data: DocumentDetail;

  try {
    data = await apiGet<DocumentDetail>(`/documents/${documentId}`);
  } catch {
    data = {
      document: { id: documentId, file_name: "Lecture 01.pdf", status: "uploaded", page_count: 0 },
      pages: [],
      notes: [{ id: "demo", title: "Lecture 01 Notes" }]
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-mint">
          <FileText size={20} />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">{data.document.file_name}</h1>
          <p className="text-slate-600">Status: {data.document.status}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Extracted pages" value={data.pages.length || data.document.page_count} />
        <Metric label="Generated notes" value={data.notes.length} />
        <Metric label="Processing state" value={data.document.status} />
      </div>

      <ToneSelect documentId={data.document.id} />

      <section className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Generated notes</h2>
        {data.notes.map((note) => (
          <Link key={note.id} href={`/notes/${note.id}`} className="block rounded-md border border-slate-200 p-3 hover:border-ink">
            {note.title}
          </Link>
        ))}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

