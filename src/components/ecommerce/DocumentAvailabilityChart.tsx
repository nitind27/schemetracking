"use client";

import React, { useState, useMemo, useEffect, useTransition, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// --- Type Definitions ---
import { FarmdersType } from "../farmersdata/farmers";
import { UserCategory } from "../usercategory/userCategory";
import { Schemesdatas } from "../schemesdata/schemes";
import { Schemecategorytype } from "../Schemecategory/Schemecategory";
import { Scheme_year } from "../Yearmaster/yearmaster";
import { Documents } from "../Documentsdata/documents";
import { Taluka } from "../Taluka/Taluka";
import { Village } from "../Village/village";
import { Schemesubcategorytype } from "../Schemesubcategory/Schemesubcategory";
import {
  buildDocumentAvailabilityCounts,
  isDocumentAvailable,
  isSurveyedFarmer,
} from "../farmersdata/parseFarmerDocuments";

type ActivePayloadItem = {
  payload: {
    [key: string]: unknown;
  };
};

type CategoricalChartState = {
  activeTooltipIndex?: number;
  activeLabel?: string;
  activePayload?: ActivePayloadItem[];
  chartX?: number;
  chartY?: number;
};

interface AllFarmersData {
  users: UserCategory[];
  schemes: Schemesdatas[];
  farmers: FarmdersType[];
  schemescrud: Schemecategorytype[];
  schemessubcategory: Schemesubcategorytype[];
  yearmaster: Scheme_year[];
  documents: Documents[];
  taluka: Taluka[];
  villages: Village[];
}

type DocumentBar = {
  document: string;
  has: number;
  not: number;
  id: number;
};

const PAGE_SIZE = 50;
const PAGE_SIZE_FARMERS = 10;

const DocumentAvailabilityChart = ({ farmersData }: { farmersData: AllFarmersData }) => {
  const { taluka, farmers, documents, villages } = farmersData;

  const talukaId = sessionStorage.getItem('taluka_id');
  const userName = sessionStorage.getItem('userName');
  const categoryId = sessionStorage.getItem('category_id');
  const isPESACoordinator = categoryId === "37";

  const [activeSubTab, setActiveSubTab] = useState<"all" | "surveyed">("all");
  const [chartData, setChartData] = useState<DocumentBar[]>([]);
  const [isComputing, setIsComputing] = useState(true);
  const [, startTransition] = useTransition();

  const farmersdata = useMemo(
    () =>
      userName === "BDO" || isPESACoordinator
        ? farmers.filter((data) => data.taluka_id == talukaId)
        : farmers,
    [farmers, userName, isPESACoordinator, talukaId]
  );

  const villageNameById = useMemo(() => {
    const map = new Map<number, string>();
    villages.forEach((v) => map.set(Number(v.village_id), v.name || v.marathi_name || ""));
    return map;
  }, [villages]);

  const surveyedFarmers = useMemo(
    () => farmersdata.filter(isSurveyedFarmer),
    [farmersdata]
  );

  const farmersByTaluka = useMemo(() => {
    const map = new Map<number, FarmdersType[]>();
    for (let i = 0; i < farmersdata.length; i++) {
      const f = farmersdata[i];
      const tid = Number(f.taluka_id);
      let list = map.get(tid);
      if (!list) {
        list = [];
        map.set(tid, list);
      }
      list.push(f);
    }
    return map;
  }, [farmersdata]);

  const farmersByVillage = useMemo(() => {
    const map = new Map<string, FarmdersType[]>();
    for (let i = 0; i < farmersdata.length; i++) {
      const f = farmersdata[i];
      const key = `${Number(f.taluka_id)}:${Number(f.village_id)}`;
      let list = map.get(key);
      if (!list) {
        list = [];
        map.set(key, list);
      }
      list.push(f);
    }
    return map;
  }, [farmersdata]);

  // Compute ONLY the active sub-tab chart, after first paint (chunked so UI stays responsive)
  useEffect(() => {
    let cancelled = false;
    setIsComputing(true);
    const source = activeSubTab === "all" ? farmersdata : surveyedFarmers;
    const docs = documents || [];

    const run = async () => {
      await new Promise((r) => setTimeout(r, 0));
      if (cancelled) return;

      if (!docs.length) {
        setChartData([]);
        setIsComputing(false);
        return;
      }

      // For large lists, process in chunks and yield between them
      const CHUNK = 2500;
      if (source.length <= CHUNK) {
        const rows = buildDocumentAvailabilityCounts(source, docs);
        if (!cancelled) {
          setChartData(rows);
          setIsComputing(false);
        }
        return;
      }

      const n = docs.length;
      const has = new Int32Array(n);
      const not = new Int32Array(n);
      const idIndex = new Map<string, number>();
      for (let d = 0; d < n; d++) idIndex.set(String(docs[d].id), d);
      const seen = new Uint8Array(n);

      for (let offset = 0; offset < source.length; offset += CHUNK) {
        if (cancelled) return;
        const end = Math.min(offset + CHUNK, source.length);
        for (let i = offset; i < end; i++) {
          const docString = source[i].documents;
          seen.fill(0);
          if (typeof docString === "string" && docString.length > 0) {
            let start = 0;
            const len = docString.length;
            while (start < len) {
              let pipe = docString.indexOf("|", start);
              if (pipe < 0) pipe = len;
              const sep = docString.indexOf("--", start);
              if (sep > start && sep < pipe) {
                const idx = idIndex.get(docString.slice(start, sep).trim());
                if (idx !== undefined) {
                  const rest = docString.slice(sep + 2, pipe);
                  const p1 = rest.indexOf("-");
                  if (p1 >= 0) {
                    const p2 = rest.indexOf("-", p1 + 1);
                    if (p2 >= 0) {
                      const available = rest.slice(p1 + 1, p2).trim();
                      const notAvailable = rest.slice(p2 + 1).trim();
                      if (available === "Yes") {
                        has[idx]++;
                        seen[idx] = 1;
                      } else if (notAvailable === "Yes") {
                        not[idx]++;
                        seen[idx] = 2;
                      } else {
                        seen[idx] = 3;
                      }
                    }
                  }
                }
              }
              start = pipe + 1;
            }
          }
          for (let d = 0; d < n; d++) {
            if (seen[d] === 0) not[d]++;
          }
        }
        // Yield to keep UI responsive
        await new Promise((r) => setTimeout(r, 0));
      }

      if (cancelled) return;
      const rows: DocumentBar[] = new Array(n);
      for (let d = 0; d < n; d++) {
        rows[d] = {
          id: docs[d].id,
          document: docs[d].document_name,
          has: has[d],
          not: not[d],
        };
      }
      setChartData(rows);
      setIsComputing(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [activeSubTab, farmersdata, surveyedFarmers, documents]);

  // --- Modal State for Documents ---
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocId] = useState<number | null>(null);
  const [selectedDocName, setSelectedDocName] = useState<string>("");
  const [docFilter, setDocFilter] = useState<"all" | "has" | "not">("all");
  const [selectedDocDropdown, setSelectedDocDropdown] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredFarmers = useMemo(() => {
    const docId = selectedDocDropdown ?? selectedDocId;
    if (!docId || !modalOpen) return [];
    return farmersdata.filter((farmer) => {
      const hasAvailable = isDocumentAvailable(farmer, docId);
      if (docFilter === "has") return hasAvailable;
      if (docFilter === "not") return !hasAvailable;
      return true;
    });
  }, [farmersdata, docFilter, selectedDocDropdown, selectedDocId, modalOpen]);

  const paginatedModalFarmers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredFarmers.slice(start, start + PAGE_SIZE);
  }, [filteredFarmers, page]);

  const handleDocDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docId = parseInt(e.target.value, 10);
    setSelectedDocDropdown(docId);
    setSelectedDocName(documents.find((d) => d.id === docId)?.document_name || "");
    setDocFilter("all");
    setPage(1);
  };

  const handleDownload = () => {
    const docId = selectedDocDropdown ?? selectedDocId;
    if (!docId) return;
    const docName = documents.find((d) => d.id === docId)?.document_name || "Document";
    const farmersToExport = farmersdata.filter((farmer) => {
      const hasAvailable = isDocumentAvailable(farmer, docId);
      if (docFilter === "has") return hasAvailable;
      if (docFilter === "not") return !hasAvailable;
      return true;
    });
    const data = farmersToExport.map((farmer) => {
      const record = farmer.farmer_record?.split('|') || [];
      return {
        FarmerID: farmer.farmer_id,
        Name: record[0] || "",
        Aadhaar: record[5] || "",
        Village: villageNameById.get(Number(farmer.village_id)) || "",
        HasDocument: isDocumentAvailable(farmer, docId) ? "Yes" : "No",
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Farmers");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `${docName.replace(/\s+/g, "_")}_Farmers.xlsx`
    );
  };

  // --- Modal Component for Documents ---
  const Modal = () =>
    modalOpen ? (
      <div
        className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-99999 overflow-y-auto"
        onClick={() => setModalOpen(false)}
      >
        <div
          className="bg-white rounded-lg md:rounded-xl shadow-xl p-2 md:p-6 w-full max-w-full md:max-w-4xl relative mx-2 my-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-2xl"
            onClick={() => setModalOpen(false)}
          >
            &times;
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-0">
              IFR Holders for Document:{" "}
              <span className="text-blue-600">{selectedDocName}</span>
            </h3>
          </div>
          <div>
            <div className="flex flex-col md:flex-row gap-2 flex-wrap rounded p-2 items-center">
              <label className="text-sm md:text-base">Select Documents</label>

              <div className="card bg-gray-200 w-full md:w-auto">
                <select
                  value={selectedDocDropdown ?? ""}
                  onChange={handleDocDropdownChange}
                  className="border rounded px-2 py-1 w-full"
                >
                  {documents.map((doc) => (
                    <option value={doc.id} key={doc.id}>
                      {doc.document_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="card bg-gray-200 w-full md:w-auto">
                <select
                  value={docFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const value = e.target.value as "all" | "has" | "not";
                    setDocFilter(value);
                    setPage(1);
                  }}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="all">All</option>
                  <option value="has">उपलब्ध</option>
                  <option value="not">उपलब्ध नाही</option>
                </select>
              </div>

              <button
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full md:w-auto"
                onClick={handleDownload}
              >
                Download Excel
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full border text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">#</th>
                  <th className="border px-2 py-1">Claim ID</th>
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">Aadhaar</th>
                  <th className="border px-2 py-1">Village</th>
                  <th className="border px-2 py-1">Has Document</th>
                </tr>
              </thead>
              <tbody>
                {filteredFarmers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No data found.
                    </td>
                  </tr>
                ) : (
                  paginatedModalFarmers.map((farmer, idx) => {
                    const docId = selectedDocDropdown ?? selectedDocId;
                    const hasDoc = isDocumentAvailable(farmer, docId!);
                    const record = farmer.farmer_record?.split('|') || [];
                    return (
                      <tr key={farmer.farmer_id}>
                        <td className="border px-2 py-1">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="border px-2 py-1"> {record[15] || ""}</td>
                        <td className="border px-2 py-1">
                          {record[0] || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {record[5] || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {villageNameById.get(Number(farmer.village_id)) || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {hasDoc ? (
                            <span className="text-green-600 font-semibold">
                              Yes
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold">
                              No
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-2">
            <span className="text-sm">
              Showing {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, filteredFarmers.length)} of{" "}
              {filteredFarmers.length}
            </span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <span className="text-sm">
                Page {page} of {Math.ceil(filteredFarmers.length / PAGE_SIZE)}
              </span>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                onClick={() => setPage((p) => Math.min(Math.ceil(filteredFarmers.length / PAGE_SIZE), p + 1))}
                disabled={page === Math.ceil(filteredFarmers.length / PAGE_SIZE)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null;

  // --- New State for Drilldown ---
  const [drillLevel, setDrillLevel] = useState<"none" | "taluka" | "village" | "farmers">("none");
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [selectedTalukaId, setSelectedTalukaId] = useState<number | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState<number | null>(null);
  const [farmerDocFilter, setFarmerDocFilter] = useState<"all" | "has" | "not">("all");
  const [farmerPage, setFarmerPage] = useState(1);

  // --- Handlers ---
  const openTalukaModal = (docId: number) => {
    setSelectedDocumentId(docId);
    setDrillLevel("taluka");
  };
  const openVillageModal = (talukaId: number) => {
    setSelectedTalukaId(talukaId);
    setDrillLevel("village");
  };
  const openFarmersModal = (villageId: number, filter: "all" | "has" | "not" = "all") => {
    setSelectedVillageId(villageId);
    setFarmerDocFilter(filter);
    setDrillLevel("farmers");
  };
  const closeModal = () => {
    setDrillLevel("none");
    setSelectedDocumentId(null);
    setSelectedTalukaId(null);
    setSelectedVillageId(null);
  };

  // --- Sorting and Search State ---
  const [villageSearch, setVillageSearch] = useState("");
  const [farmerSearch, setFarmerSearch] = useState("");

  // --- Sorted and Filtered Progress ---
  const talukaProgress = useMemo(() => {
    if (!selectedDocumentId || drillLevel === "none") return [];
    return taluka
      .map((t) => {
        const talukaFarmers = farmersByTaluka.get(Number(t.taluka_id)) || [];
        let withDoc = 0;
        for (let i = 0; i < talukaFarmers.length; i++) {
          if (isDocumentAvailable(talukaFarmers[i], selectedDocumentId)) withDoc++;
        }
        const total = talukaFarmers.length;
        return {
          ...t,
          total,
          withDoc,
          percent: total ? (withDoc / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [selectedDocumentId, taluka, farmersByTaluka, drillLevel]);

  const villageProgress = useMemo(() => {
    if (!selectedDocumentId || !selectedTalukaId || (drillLevel !== "village" && drillLevel !== "farmers")) return [];
    const villagesInTaluka = villages.filter((v) => Number(v.taluka_id) === Number(selectedTalukaId));
    return villagesInTaluka
      .map((v) => {
        const villageFarmers = farmersByVillage.get(`${Number(selectedTalukaId)}:${Number(v.village_id)}`) || [];
        let withDoc = 0;
        for (let i = 0; i < villageFarmers.length; i++) {
          if (isDocumentAvailable(villageFarmers[i], selectedDocumentId)) withDoc++;
        }
        const total = villageFarmers.length;
        return {
          ...v,
          total,
          withDoc,
          percent: total ? (withDoc / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [selectedDocumentId, selectedTalukaId, villages, farmersByVillage, drillLevel]);

  const filteredVillageProgress = useMemo(() => {
    if (!villageSearch) return villageProgress;
    const q = villageSearch.toLowerCase();
    return villageProgress.filter((v) =>
      v.name.toLowerCase().includes(q) ||
      (v.marathi_name && v.marathi_name.toLowerCase().includes(q))
    );
  }, [villageProgress, villageSearch]);

  const farmersInVillage = useMemo(() => {
    if (!selectedDocumentId || !selectedVillageId || !selectedTalukaId || drillLevel !== "farmers") return [];
    return farmersByVillage.get(`${Number(selectedTalukaId)}:${Number(selectedVillageId)}`) || [];
  }, [selectedDocumentId, selectedVillageId, selectedTalukaId, farmersByVillage, drillLevel]);

  const filteredFarmersInVillage = useMemo(() => {
    if (!selectedDocumentId) return [];
    let filtered = farmersInVillage;
    if (farmerDocFilter === "has") {
      filtered = filtered.filter(f => isDocumentAvailable(f, selectedDocumentId!));
    } else if (farmerDocFilter === "not") {
      filtered = filtered.filter(f => !isDocumentAvailable(f, selectedDocumentId!));
    }
    if (farmerSearch) {
      filtered = filtered.filter(f =>
        (f.farmer_record?.split('|')[0] || "").toLowerCase().includes(farmerSearch.toLowerCase())
      );
    }
    return filtered;
  }, [farmersInVillage, farmerDocFilter, farmerSearch, selectedDocumentId]);

  const paginatedFarmers = useMemo(() => {
    const start = (farmerPage - 1) * PAGE_SIZE_FARMERS;
    return filteredFarmersInVillage.slice(start, start + PAGE_SIZE_FARMERS);
  }, [filteredFarmersInVillage, farmerPage]);
  const totalPagesFarmers = Math.ceil(filteredFarmersInVillage.length / PAGE_SIZE_FARMERS);

  const selectedDocumentName = useMemo(() => {
    return documents.find(d => d.id === selectedDocumentId)?.document_name || "";
  }, [documents, selectedDocumentId]);

  const handleDownloadFarmersExcel = () => {
    if (!selectedDocumentId) return;
    const docName = selectedDocumentName || "Document";
    const data = filteredFarmersInVillage.map(farmer => ({
      FarmerID: farmer.farmer_id,
      ClaimID: farmer.farmer_record?.split('|')[15] || "",
      Name: farmer.farmer_record?.split('|')[0] || "",
      Aadhaar: farmer.farmer_record?.split('|')[5] || "",
      Village: villages.find(v => Number(v.village_id) === Number(farmer.village_id))?.name || "",
      HasDocument: isDocumentAvailable(farmer, selectedDocumentId) ? "Yes" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Farmers");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `${docName.replace(/\s+/g, "_")}_Farmers.xlsx`
    );
  };

  // --- Drilldown Modals ---
  const handleCloseModal = () => {
    if (drillLevel === "village") {
      setDrillLevel("taluka");
    } else {
      setDrillLevel("none");
      setSelectedDocumentId(null);
      setSelectedTalukaId(null);
      setSelectedVillageId(null);
    }
  };

  // --- TalukaModal ---
  const TalukaModal = () => drillLevel === "taluka" && (
    <div className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50" onClick={handleCloseModal}>
      <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-2xl relative" onClick={e => e.stopPropagation()}>
        {/* Close Icon */}
        <button
          className="absolute top-2 right-3 text-2xl text-gray-500 hover:text-gray-900"
          onClick={handleCloseModal}
        >
          &times;
        </button>
        <h3 className="text-lg font-bold mb-4">Taluka wise document availability</h3>
        {talukaProgress.map(t => (
          <div key={t.taluka_id} className="mb-2">
            <div className="flex justify-between">
              <span>{t.name}</span>
              <span>{t.withDoc}/{t.total} ({t.percent.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-4 cursor-pointer" onClick={() => openVillageModal(t.taluka_id)}>
              <div className="bg-blue-500 h-4 rounded" style={{ width: `${t.percent}%` }} />
            </div>
          </div>
        ))}
        <button className="mt-4 px-4 py-2 bg-gray-300 rounded" onClick={closeModal}>Close</button>
      </div>
    </div>
  );

  // --- VillageModal ---
  const VillageModal = () => drillLevel === "village" && (
    <div className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50 " onClick={handleCloseModal}>
      <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-2xl relative h-96 overflow-scroll" onClick={e => e.stopPropagation()}>
        {/* Close Icon */}
        <button
          className="absolute top-2 right-3 text-2xl text-gray-500 hover:text-gray-900"
          onClick={handleCloseModal}
        >
          &times;
        </button>
        Village wise document availability of {taluka.find(t => Number(t.taluka_id) === Number(selectedTalukaId))?.name || 'Unknown Taluka'}
        <input
          type="text"
          placeholder="Search village..."
          className="mb-3 p-2 border rounded w-full"
          value={villageSearch}
          onChange={e => setVillageSearch(e.target.value)}
        />
        {filteredVillageProgress.map(v => (
          <div key={v.village_id} className="mb-2">
            <div className="flex justify-between">
              <span>{v.name} {v.marathi_name ? `(${v.marathi_name})` : ""}</span>
              <span>{v.withDoc}/{v.total} ({v.percent.toFixed(1)}%)</span>
            </div>
            <div
              className="w-full h-4 rounded cursor-pointer bg-gray-200"
              style={{
                width: "100%",
                position: "relative",
                overflow: "hidden"
              }}
              onClick={() => openFarmersModal(v.village_id, "all")}
            >
              <div
                style={{
                  backgroundColor: v.percent > 0 ? "#10b981" : "#f87171", // green if available, red if not
                  width: `${v.percent}%`,
                  height: "100%",
                  borderRadius: "inherit",
                  transition: "width 0.3s"
                }}
              />
            </div>
          </div>
        ))}
        <button className="mt-4 px-4 py-2 bg-gray-300 rounded" onClick={closeModal}>Back</button>
      </div>
    </div>
  );

  const FarmersModal = () => {
    if (drillLevel !== "farmers" || !selectedDocumentId) return null;
    return (
      <div className="fixed inset-0 bg-[#0303033f] z-9999 bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50" onClick={closeModal}>
        <div
          className="bg-white rounded-lg shadow-xl p-4 w-full max-w-2xl relative flex flex-col"
          style={{ maxHeight: '90vh', width: '100%', maxWidth: '600px' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close Icon */}
          <button
            className="absolute top-2 right-3 text-2xl text-gray-500 hover:text-gray-900"
            onClick={closeModal}
          >
            &times;
          </button>
          <h3 className="text-lg font-bold mb-2">Farmers in village</h3>
          <div className="mb-2 font-semibold">
            Document: <span className="text-blue-600">{selectedDocumentName}</span>
          </div>
          <div className="flex flex-col md:flex-row gap-2 mb-3">
            <input
              type="text"
              placeholder="Search farmer name..."
              className="p-2 border rounded w-full md:w-1/2"
              value={farmerSearch}
              onChange={e => setFarmerSearch(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full md:w-auto"
              onClick={handleDownloadFarmersExcel}
            >
              Download Excel
            </button>
          </div>
          <select
            className="mb-3 p-2 border rounded w-full"
            value={farmerDocFilter}
            onChange={e => {
              setFarmerDocFilter(e.target.value as "all" | "has" | "not");
              setFarmerPage(1); // reset to first page on filter change
            }}
          >
            <option value="all">All</option>
            <option value="has">Available</option>
            <option value="not">Not Available</option>
          </select>
          <div className="overflow-auto flex-1" style={{ maxHeight: '50vh' }}>
            <table className="min-w-full border text-xs md:text-sm table-fixed">
              <thead>
                <tr>
                  <th className="border px-2 py-1">#</th>
                  <th className="border px-2 py-1">Claim ID</th>
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">Aadhaar</th>
                  <th className="border px-2 py-1">Village</th>
                  <th className="border px-2 py-1">Has Document</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFarmers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">No data found.</td>
                  </tr>
                ) : (
                  paginatedFarmers.map((f, idx) => (
                    <tr key={f.farmer_id}>
                      <td className="border px-2 py-1">{(farmerPage - 1) * PAGE_SIZE_FARMERS + idx + 1}</td>
                      <td className="border px-2 py-1">{f.farmer_record?.split('|')[15] || ""}</td>
                      <td className="border px-2 py-1">{f.farmer_record?.split('|')[0]}</td>
                      <td className="border px-2 py-1">{f.farmer_record?.split('|')[5]}</td>
                      <td className="border px-2 py-1">{villages.find(v => Number(v.village_id) === Number(f.village_id))?.name || ""}</td>
                      <td className="border px-2 py-1">{isDocumentAvailable(f, selectedDocumentId) ? "Yes" : "No"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-2">
            <span className="text-sm">
              Showing {(farmerPage - 1) * PAGE_SIZE_FARMERS + 1}-
              {Math.min(farmerPage * PAGE_SIZE_FARMERS, filteredFarmersInVillage.length)} of{" "}
              {filteredFarmersInVillage.length}
            </span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                onClick={() => setFarmerPage((p) => Math.max(1, p - 1))}
                disabled={farmerPage === 1}
              >
                Prev
              </button>
              <span className="text-sm">
                Page {farmerPage} of {totalPagesFarmers}
              </span>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                onClick={() => setFarmerPage((p) => Math.min(totalPagesFarmers, p + 1))}
                disabled={farmerPage === totalPagesFarmers}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Update BarChart onClick for Document Chart ---
  const handleDocumentBarClick = useCallback((state: CategoricalChartState) => {
    if (
      state &&
      state.activeLabel &&
      state.activePayload &&
      state.activePayload.length > 0
    ) {
      const doc = chartData.find((d) => d.document === state.activeLabel);
      if (doc) openTalukaModal(doc.id);
    }
  }, [chartData]);

  const switchSubTab = (tab: "all" | "surveyed") => {
    if (tab === activeSubTab) return;
    startTransition(() => setActiveSubTab(tab));
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-4 mb-3">
        <button
          type="button"
          onClick={() => switchSubTab("all")}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            activeSubTab === "all"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          All IFR Holders
        </button>
        <button
          type="button"
          onClick={() => switchSubTab("surveyed")}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            activeSubTab === "surveyed"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white text-black hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          Surveyed IFR Holders
        </button>
      </div>

      <div className="bg-white p-2 md:p-4 rounded-xl shadow-lg w-full mt-3 overflow-x-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">
            {activeSubTab === "all"
              ? "Availability of each documents for IFR holders"
              : "Surveyed IFR Holders Document Availability Across Talukas"}
          </h2>
          <div className="bg-white p-3 rounded-lg shadow-md w-full md:w-auto min-w-[200px]">
            <div className="text-sm text-gray-700 space-y-2">
              {activeSubTab === "surveyed" && (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-[#6366f1] rounded-sm" />
                  <p>
                    Total Surveyed: <strong>{surveyedFarmers.length}</strong>
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#10b981] rounded-sm" />
                <p>Available</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#f87171] rounded-sm" />
                <p>Not Available</p>
              </div>
            </div>
          </div>
        </div>

        {isComputing ? (
          <div className="h-[500px] w-full flex items-center justify-center text-gray-500">
            Loading document availability…
          </div>
        ) : (
          <div className="h-[500px] md:h-[500px] w-full min-w-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 24,
                  right: isMobile ? 8 : 24,
                  left: isMobile ? 8 : 16,
                  bottom: isMobile ? 80 : 60,
                }}
                barSize={isMobile ? 20 : 40}
                onClick={handleDocumentBarClick}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="document"
                  angle={isMobile ? -45 : -35}
                  textAnchor="end"
                  interval={0}
                  height={isMobile ? 100 : 80}
                  tick={{ fill: "#4b5563", fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis tick={{ fill: "#4b5563", fontSize: isMobile ? 10 : 12 }} />
                <Tooltip />
                <Bar dataKey="has" fill="#10b981" name="उपलब्ध" />
                <Bar dataKey="not" fill="#f87171" name="उपलब्ध नाही" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <Modal />
        {TalukaModal()}
        {VillageModal()}
        {FarmersModal()}
      </div>
    </div>
  );
};

export default DocumentAvailabilityChart;
