"use client";

import Link from "next/link";
import { FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/StatusBadge";

type Document = {
  id: string;
  title?: string;
  file_name: string;
  status: string;
  created_at?: string;
};

export function DocumentsList({ documents }: { documents: Document[] }) {
  const [query, setQuery] = useState("");
  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return documents;
    }

    return documents.filter((document) =>
      `${document.title ?? ""} ${document.file_name} ${document.status}`.toLowerCase().includes(normalizedQuery)
    );
  }, [documents, query]);

  return (
    <div className="space-y-3">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search documents"
          className="min-h-11 w-full rounded-md border border-line bg-card pl-10 pr-3 text-sm outline-none transition focus:border-coral"
        />
      </label>

      {filteredDocuments.length ? (
        <div className="grid gap-3">
          {filteredDocuments.map((document) => (
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
        <p className="rounded-md border border-line bg-card p-4 text-sm text-muted">No documents match your search.</p>
      )}
    </div>
  );
}
