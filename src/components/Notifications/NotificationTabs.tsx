"use client";

import React, { useMemo, useState } from "react";
import TabView from "@/components/common/TabView";
import { Modal } from "@/components/ui/modal";
import Notificationtab from "../common/Notificationtab";

type PdfItem = {
  id: string | number;
  title: string;
  url: string;
  date?: string | Date;
};

type NotificationTabsProps = {
  news?: PdfItem[];
  rti?: PdfItem[];
  defaultTab?: "news" | "rti";
};

function formatDate(d?: string | Date) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString();
}

function PdfRow({
  item,
  onView,
}: {
  item: PdfItem;
  onView: (item: PdfItem) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/40">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-1 h-9 w-9 flex items-center justify-center rounded bg-red-50 text-red-600 ring-1 ring-red-100">
          <svg width="18" height="18" viewBox="0 0 24 24" className="fill-current">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 2v4h4" />
            <path d="M8 13h8v2H8zm0 4h8v2H8z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{item.title}</p>
          {item.date && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(item.date)}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          onClick={() => onView(item)}
        >
          View
        </button>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
          download
        >
          Download
        </a>
      </div>
    </li>
  );
}

function PdfList({
  items,
  onView,
}: {
  items: PdfItem[];
  onView: (item: PdfItem) => void;
}) {
  if (!items.length) {
    return (
      <div className="w-full rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-sm text-gray-500 dark:text-gray-400">
        No documents.
      </div>
    );
  }
  return (
    <ul className="w-full divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {items.map((it) => (
        <PdfRow key={it.id} item={it} onView={onView} />
      ))}
    </ul>
  );
}

const mockNews: PdfItem[] = [
  { id: 1, title: "12-06-2015 DL Convergence Committee", url: "/pdf/12-06-2015 DL Convergence Committee.pdf", date: new Date() },
  { id: 2, title: "CFR Management Plan-Maharashtra Government GR-6 July 2017-Based on the ATREE-TISS  CFR Management Plan ", url: "/pdf/CFR Management Plan-Maharashtra Government GR-6 July 2017-Based on the ATREE-TISS  CFR Management Plan Te.pdf", date: new Date(Date.now() - 86400000) },
  { id: 3, title: "CFRMC Formation Order-Maharashtra Government-24th June 2015", url: "/pdf/CFRMC Formation Order-Maharashtra Government-24th June 2015.pdf", date: new Date(Date.now() - 86400000) },
];

const mockRti: PdfItem[] = [
  { id: 3, title: "Five Percent to Gram Sabha- Maharashtra Tribal Sub-Plan Grant Order", url: "/pdf/Five Percent to Gram Sabha- Maharashtra Tribal Sub-Plan Grant Order.pdf", date: new Date(Date.now() - 3 * 86400000) },
  { id: 4, title: "MGNREGA 202111301649324316", url: "/pdf/MGNREGA 202111301649324316.pdf", date: new Date(Date.now() - 10 * 86400000) },
];

export default function NotificationTabs({
  news,
  rti,
  defaultTab = "news",
}: NotificationTabsProps) {
  const newsDocs = useMemo(() => news ?? mockNews, [news]);
  const rtiDocs = useMemo(() => rti ?? mockRti, [rti]);

  const [openPdf, setOpenPdf] = useState<PdfItem | null>(null);

  const tabs = [
    {
      id: "news",
      label: `News Notification (${newsDocs.length})`,
      content: <PdfList items={newsDocs} onView={setOpenPdf} />,
    },
    {
      id: "rti",
      label: `RTI Information (${rtiDocs.length})`,
      content: <PdfList items={rtiDocs} onView={setOpenPdf} />,
    },
  ];

  return (
    <div className="w-full bg-white p-5">
      <Notificationtab tabs={tabs} defaultTab={defaultTab} />

      <Modal
        isOpen={!!openPdf}
        onClose={() => setOpenPdf(null)}
        isFullscreen={true}
        className="bg-white"
      >
        <div className="flex flex-col h-screen w-screen">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="font-semibold text-gray-800 dark:text-gray-100 truncate pr-4">
              {openPdf?.title}
            </div>
        
          </div>
          <div className="flex-1 bg-gray-50">
            {openPdf?.url && (
              <iframe
                src={`${openPdf.url}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full"
                title={openPdf.title}
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}