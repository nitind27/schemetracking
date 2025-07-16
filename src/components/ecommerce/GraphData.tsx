"use client";

import React, { useState, useMemo, useEffect } from "react";
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

// --- Type Definitions (same as your imports) ---
import { FarmdersType } from "../farmersdata/farmers";
import { UserCategory } from "../usercategory/userCategory";
import { Schemesdatas } from "../schemesdata/schemes";
import { Schemecategorytype } from "../Schemecategory/Schemecategory";
// import { Schemesubcategorytype } from "../Schemesubcategory/Schemecategory";
import { Scheme_year } from "../Yearmaster/yearmaster";
import { Documents } from "../Documentsdata/documents";
import { Taluka } from "../Taluka/Taluka";
import { Village } from "../Village/village";
import { Schemesubcategorytype } from "../Schemesubcategory/Schemesubcategory";

type ActivePayloadItem = {
  payload: {
    [key: string]: unknown; // or your actual data type
  };
  // Add more fields if you use them
};

type CategoricalChartState = {
  activeTooltipIndex?: number;
  activeLabel?: string;
  activePayload?: ActivePayloadItem[];
  chartX?: number;
  chartY?: number;
  // ...other properties as needed
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

type ChartData = {
  taluka: string;
  total: number;
  withAadhaar: number;
  withoutAadhaar: number;
  taluka_id: number;
};

type DocumentBar = {
  document: string;
  has: number;
  not: number;
  id: number;
};

const PAGE_SIZE = 50;
const PAGE_SIZE_FARMERS = 10;

const parseFarmerDocuments = (docString: string | undefined): Record<string, { check: string, updation: string, available: string }> => {
  const result: Record<string, { check: string, updation: string, available: string }> = {};
  if (!docString) return result;
  docString.split('|').forEach(segment => {
    const [id, status] = segment.split('--');
    if (!id || !status) return;
    const [updation, check, available] = status.split('-');
    if (check && updation && available) {
      result[id.trim()] = {
        updation: updation.trim(),
        available: available.trim(),
        check: check.trim(),
      };
    }
  });
  return result;
};

const farmerHasAvailableDocument = (farmer: FarmdersType, docId: number) => {
  const docMap = parseFarmerDocuments(farmer.documents);
  return docMap[String(docId)] && docMap[String(docId)].available === 'Yes';
};

const GraphData = ({ farmersData }: { farmersData: AllFarmersData }) => {
  const { taluka, farmers, documents, villages } = farmersData;

  // --- Aadhaar Chart Data ---
  const talukaId = sessionStorage.getItem('taluka_id');
  const userName = sessionStorage.getItem('userName');
  const farmersdata = userName === "BDO" ? farmers.filter((data) => data.taluka_id == talukaId) : farmers;

  let chartData: ChartData[];

  if (userName === "BDO") {
    chartData = taluka
      .filter((data) => data.taluka_id == Number(talukaId))
      .map((t) => {
        const farmersInTaluka = farmers.filter(
          (f) => f.taluka_id?.toString() == talukaId
        );

        const total = farmersInTaluka.length;
        const withAadhaar = farmersInTaluka.filter(
          (f) => f.farmer_record?.split('|')[5] && f.farmer_record?.split('|')[5].trim() !== ""
        ).length;
        const withoutAadhaar = total - withAadhaar;

        return {
          taluka: t.name,
          total,
          withAadhaar,
          withoutAadhaar,
          taluka_id: t.taluka_id,
        };
      });
  } else {
    chartData = taluka.map((t) => {
      const farmersInTaluka = farmers.filter(
        (f) => f.taluka_id?.toString() === t.taluka_id.toString()
      );

      const total = farmersInTaluka.length;
      const withAadhaar = farmersInTaluka.filter(
        (f) => f.farmer_record?.split('|')[5] && f.farmer_record?.split('|')[5].trim() !== ""
      ).length;
      const withoutAadhaar = total - withAadhaar;

      return {
        taluka: t.name,
        total,
        withAadhaar,
        withoutAadhaar,
        taluka_id: t.taluka_id,
      };
    });
  }

  const maxValue = Math.max(...chartData.map((item) => item.total), 1000);
  const ticks = [];
  for (let i = 1000; i <= maxValue + 1000; i += 1000) {
    ticks.push(i);
  }

  const documentChartData: DocumentBar[] = documents?.map((doc) => {
    let hasCount = 0;
    let notCount = 0;

    farmers.forEach((farmer) => {
      const docMap = parseFarmerDocuments(farmer.documents);
      if (docMap[String(doc.id)] && docMap[String(doc.id)].available === 'Yes') {
        hasCount++;
      } else {
        notCount++;
      }
    });

    return {
      document: doc.document_name,
      has: hasCount,
      not: notCount,
      id: doc.id,
    };
  }) || [];

  // --- Modal State for Documents ---
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocId] = useState<number | null>(null);
  const [selectedDocName, setSelectedDocName] = useState<string>("");
  const [docFilter, setDocFilter] = useState<"all" | "has" | "not">("all");
  const [selectedDocDropdown, setSelectedDocDropdown] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  // --- Modal Data (memoized for performance) ---
  const filteredFarmers = useMemo(() => {
    const docId = selectedDocDropdown ?? selectedDocId;
    if (!docId) return [];
    return farmers.filter((farmer) => {
      const hasAvailable = farmerHasAvailableDocument(farmer, docId);
      if (docFilter === "has") return hasAvailable;
      if (docFilter === "not") return !hasAvailable;
      return true;
    });
  }, [farmers, docFilter, selectedDocDropdown, selectedDocId]);

  // Pagination logic for document modal
  const totalPages = Math.ceil(filteredFarmers.length / PAGE_SIZE);
  // const paginatedFarmers = useMemo(() => {
  //   const start = (page - 1) * PAGE_SIZE;
  //   return filteredFarmers.slice(start, start + PAGE_SIZE);
  // }, [filteredFarmers, page]);

  // --- Modal Open Handler for Documents ---
  // const openModal = (docId: number, docName: string) => {
  //   setSelectedDocId(docId);
  //   setSelectedDocName(docName);
  //   setSelectedDocDropdown(docId);
  //   setDocFilter("all");
  //   setPage(1);
  //   setModalOpen(true);
  // };

  // --- Document Dropdown Change Handler ---
  const handleDocDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docId = parseInt(e.target.value, 10);
    setSelectedDocDropdown(docId);
    setSelectedDocName(
      documents.find((d) => d.id === docId)?.document_name || ""
    );
    setDocFilter("all");
    setPage(1);
  };

  // --- Download Excel Handler for Documents ---
  const handleDownload = () => {
    const docId = selectedDocDropdown ?? selectedDocId;
    if (!docId) return;
    const docName =
      documents.find((d) => d.id === docId)?.document_name || "Document";

    const farmersToExport = farmers.filter((farmer) => {
      const hasAvailable = farmerHasAvailableDocument(farmer, docId);
      if (docFilter === "has") return hasAvailable;
      if (docFilter === "not") return !hasAvailable;
      return true;
    });

    const data = farmersToExport.map((farmer) => ({
      FarmerID: farmer.farmer_id,
      Name: farmer.farmer_record?.split('|')[0] || "",
      Aadhaar: farmer.farmer_record?.split('|')[5] || "",
      Village: villages.find((v) => v.village_id === Number(farmer.village_id))?.name || "",
      HasDocument: farmerHasAvailableDocument(farmer, docId) ? "Yes" : "No",
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
                  filteredFarmers.map((farmer, idx) => {
                    const docId = selectedDocDropdown ?? selectedDocId;
                    const hasDoc = farmerHasAvailableDocument(farmer, docId!);
                    return (
                      <tr key={farmer.farmer_id}>
                        <td className="border px-2 py-1">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="border px-2 py-1"> {farmer.farmer_record?.split('|')[15] || ""}</td>
                        <td className="border px-2 py-1">
                          {farmer.farmer_record?.split('|')[0] || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {farmer.farmer_record?.split('|')[5] || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {villages.find((v) => v.village_id === Number(farmer.village_id))?.name || ""}
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
                Page {page} of {totalPages}
              </span>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null;

  // --- State for Aadhaar Modal ---
  const [aadhaarModalOpen, setAadhaarModalOpen] = useState(false);
  const [aadhaarModalTalukaId, setAadhaarModalTalukaId] = useState<number | null>(null);
  const [aadhaarModalTalukaName, setAadhaarModalTalukaName] = useState<string>("");
  const [aadhaarFilter, setAadhaarFilter] = useState<"all" | "with" | "without">("all");
  const [aadhaarPage, setAadhaarPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Aadhaar Modal Data (memoized) ---
  const aadhaarFilteredFarmers = useMemo(() => {
    if (!aadhaarModalTalukaId) return [];
    const talukaFarmers = farmers.filter(f => Number(f.taluka_id) === aadhaarModalTalukaId);
    if (aadhaarFilter === "with") {
      return talukaFarmers.filter(f => f.farmer_record?.split('|')[5] && f.farmer_record?.split('|')[5].trim() !== "");
    }
    if (aadhaarFilter === "without") {
      return talukaFarmers.filter(f => !f.farmer_record?.split('|')[5] || f.farmer_record?.split('|')[5].trim() === "");
    }
    return talukaFarmers;
  }, [farmers, aadhaarModalTalukaId, aadhaarFilter]);

  const aadhaarTotalPages = Math.ceil(aadhaarFilteredFarmers.length / PAGE_SIZE);
  const aadhaarPaginatedFarmers = useMemo(() => {
    const start = (aadhaarPage - 1) * PAGE_SIZE;
    return aadhaarFilteredFarmers.slice(start, start + PAGE_SIZE);
  }, [aadhaarFilteredFarmers, aadhaarPage]);

  // --- Aadhaar Modal Open Handler ---
  const openAadhaarModal = (talukaId: number, talukaName: string) => {
    setAadhaarModalTalukaId(talukaId);
    setAadhaarModalTalukaName(talukaName);
    setAadhaarFilter("all");
    setAadhaarPage(1);
    setAadhaarModalOpen(true);
  };

  // --- Aadhaar Download Excel Handler ---
  const handleAadhaarDownload = () => {
    if (!aadhaarModalTalukaId) return;
    const data = aadhaarFilteredFarmers.map((farmer) => ({
      FarmerID: farmer.farmer_id,
      Name: farmer.farmer_record?.split('|')[0] || "",
      Aadhaar: farmer.farmer_record?.split('|')[5] || "" || "",
      Village: aadhaarModalTalukaName,
      HasAadhaar: farmer.farmer_record?.split('|')[5] && farmer.farmer_record?.split('|')[5].trim() !== "" ? "Yes" : "No",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Farmers");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `${aadhaarModalTalukaName.replace(/\s+/g, "_")}_Farmers_Aadhaar.xlsx`
    );
  };

  // --- Aadhaar Modal Component ---
  const AadhaarModal = () =>
    aadhaarModalOpen ? (
      <div
        className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-99999 overflow-y-auto"
        onClick={() => setAadhaarModalOpen(false)}
      >
        <div
          className="bg-white rounded-lg md:rounded-xl shadow-xl p-2 md:p-6 w-full max-w-full md:max-w-4xl relative mx-2 my-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-2xl"
            onClick={() => setAadhaarModalOpen(false)}
          >
            &times;
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-0">
              IFR Holders Adhaar Availabilty in {" "}
              <span className="text-blue-600 underline">{aadhaarModalTalukaName}</span>{" "}
              taluka
            </h3>
            <div className="flex flex-col md:flex-row gap-2 flex-wrap">
              <div className="card bg-gray-200 rounded w-full md:w-auto">
                <select
                  value={aadhaarFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const value = e.target.value as "all" | "with" | "without";
                    setAadhaarFilter(value);
                    setAadhaarPage(1);
                  }}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="all">All</option>
                  <option value="with">Available</option>
                  <option value="without">Not Availbale</option>
                </select>
              </div>
              <button
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full md:w-auto"
                onClick={handleAadhaarDownload}
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
                  <th className="border px-2 py-1">Availabilty</th>
                </tr>
              </thead>
              <tbody>
                {aadhaarPaginatedFarmers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No data found.
                    </td>
                  </tr>
                ) : (
                  aadhaarPaginatedFarmers.map((farmer, idx) => {
                    const hasAadhaar = farmer.farmer_record?.split('|')[5] && farmer.farmer_record?.split('|')[5].trim() !== "";
                    return (
                      <tr key={farmer.farmer_id}>
                        <td className="border px-2 py-1">
                          {(aadhaarPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="border px-2 py-1"> {farmer.farmer_record?.split('|')[15] || ""}</td>
                        <td className="border px-2 py-1">
                          {farmer.farmer_record?.split('|')[0] || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {farmer.farmer_record?.split('|')[5] || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {villages.find((v) => v.village_id === Number(farmer.village_id))?.marathi_name || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {hasAadhaar ? (
                            <span className="text-green-600 font-semibold">
                              Available
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold">
                              Not Available
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
              Showing {(aadhaarPage - 1) * PAGE_SIZE + 1}-
              {Math.min(aadhaarPage * PAGE_SIZE, aadhaarFilteredFarmers.length)} of{" "}
              {aadhaarFilteredFarmers.length}
            </span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                onClick={() => setAadhaarPage((p) => Math.max(1, p - 1))}
                disabled={aadhaarPage === 1}
              >
                Prev
              </button>
              <span className="text-sm">
                Page {aadhaarPage} of {aadhaarTotalPages}
              </span>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                onClick={() => setAadhaarPage((p) => Math.min(aadhaarTotalPages, p + 1))}
                disabled={aadhaarPage === aadhaarTotalPages}
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

  // useEffect(() => {
  //   setFarmerPage(1); // Reset to first page when filter/search changes
  // }, [farmerDocFilter, farmerSearch, farmersInVillage]);

  // useEffect(() => {
  //   if (farmerPage > totalPagesFarmers) setFarmerPage(1);
  //   // eslint-disable-next-line
  // }, [totalPagesFarmers]);

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
    if (!selectedDocumentId) return [];
    return taluka
      .map(t => {
        const talukaFarmers = farmers.filter(f => Number(f.taluka_id) === Number(t.taluka_id));
        const withDoc = talukaFarmers.filter(f => farmerHasAvailableDocument(f, selectedDocumentId)).length;
        return {
          ...t,
          total: talukaFarmers.length,
          withDoc,
          percent: talukaFarmers.length ? (withDoc / talukaFarmers.length) * 100 : 0,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [selectedDocumentId, taluka, farmers]);

  const villageProgress = useMemo(() => {
    if (!selectedDocumentId || !selectedTalukaId) return [];
    const villagesInTaluka = villages.filter(v => Number(v.taluka_id) === Number(selectedTalukaId));
    return villagesInTaluka
      .map(v => {
        const villageFarmers = farmers.filter(
          f => Number(f.village_id) === Number(v.village_id) && Number(f.taluka_id) === Number(selectedTalukaId)
        );
        const withDoc = villageFarmers.filter(f => farmerHasAvailableDocument(f, selectedDocumentId)).length;
        return {
          ...v,
          total: villageFarmers.length,
          withDoc,
          percent: villageFarmers.length ? (withDoc / villageFarmers.length) * 100 : 0,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [selectedDocumentId, selectedTalukaId, villages, farmers]);

  const filteredVillageProgress = useMemo(() => {
    if (!villageSearch) return villageProgress;
    return villageProgress.filter(v =>
      v.name.toLowerCase().includes(villageSearch.toLowerCase()) ||
      (v.marathi_name && v.marathi_name.toLowerCase().includes(villageSearch.toLowerCase()))
    );
  }, [villageProgress, villageSearch]);

  const farmersInVillage = useMemo(() => {
    if (!selectedDocumentId || !selectedVillageId || !selectedTalukaId) return [];
    return farmers.filter(
      f => Number(f.village_id) === Number(selectedVillageId) && Number(f.taluka_id) === Number(selectedTalukaId)
    );
  }, [selectedDocumentId, selectedVillageId, selectedTalukaId, farmers]);

  const filteredFarmersInVillage = useMemo(() => {
    if (!selectedDocumentId) return [];
    let filtered = farmersInVillage;
    if (farmerDocFilter === "has") {
      filtered = filtered.filter(f => farmerHasAvailableDocument(f, selectedDocumentId!));
    } else if (farmerDocFilter === "not") {
      filtered = filtered.filter(f => !farmerHasAvailableDocument(f, selectedDocumentId!));
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
      HasDocument: farmerHasAvailableDocument(farmer, selectedDocumentId) ? "Yes" : "No",
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
        <h3 className="text-lg font-bold mb-4">Village wise document availability</h3>
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
                      <td className="border px-2 py-1">{farmerHasAvailableDocument(f, selectedDocumentId) ? "Yes" : "No"}</td>
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
  const handleDocumentBarClick = (state: CategoricalChartState) => {
    if (
      state &&
      state.activeLabel &&
      state.activePayload &&
      state.activePayload.length > 0
    ) {
      const doc = documentChartData.find(
        (d) => d.document === state.activeLabel
      );
      if (doc) openTalukaModal(doc.id);
    }
  };

  // --- Render ---
  return (
    <div className="w-full  mt-5 ">
      {/* Aadhaar Chart */}
      <div className="bg-white p-2 md:p-4 rounded-xl shadow-lg w-full overflow-x-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">
            Aadhaar Status of IFR Beneficiaries Across Talukas
          </h2>
          {/* Overall summary card */}
          <div className="bg-white p-3 rounded-lg shadow-md w-full md:w-auto min-w-[200px]">
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#6366f1] rounded-sm" />
                <p>
                  Total IFR: <strong>{farmersdata.length}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#10b981] rounded-sm" />
                <p>
                  Available:{" "}
                  <strong>
                    {
                      farmersdata.filter(
                        (f) =>
                          f.farmer_record?.split('|')[5] && f.farmer_record?.split('|')[5].trim() !== ""
                      ).length
                    }
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#f87171] rounded-sm" />
                <p>
                  Not Availbale:{" "}
                  <strong>
                    {
                      farmersdata.filter(
                        (f) =>
                          !f.farmer_record?.split('|')[5] || f.farmer_record?.split('|')[5].trim() === ""
                      ).length
                    }
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Bar chart */}
        <div className="h-[500px] md:h-[500px] w-full min-w-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 24,
                right: isMobile ? 8 : 24,
                left: isMobile ? 8 : 16,
                // bottom: isMobile ? 80 : 60
              }}
              barSize={isMobile ? 20 : 40}
              onClick={(state) => {
                if (state?.activeLabel && state?.activePayload?.length) {
                  const talukaItem = chartData.find(d => d.taluka === state.activeLabel);
                  if (talukaItem) openAadhaarModal(talukaItem.taluka_id, talukaItem.taluka);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="taluka"
                angle={isMobile ? -45 : -35}
                textAnchor="end"
                interval={0}
                height={isMobile ? 100 : 80}
                tick={{ fill: "#4b5563", fontSize: isMobile ? 10 : 12 }}
              />
              <YAxis
                tick={{ fill: "#4b5563", fontSize: isMobile ? 10 : 12 }}
                domain={[1000, "auto"]}
                ticks={ticks}
              />
              <Tooltip />
              <Bar
                dataKey="total"
                fill="#6366f1"
                name="Total IFR"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="withAadhaar"
                fill="#10b981"
                name="Available"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="withoutAadhaar"
                fill="#f87171"
                name="Not Available"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Documents Chart */}
      <div className="bg-white p-2 md:p-4 rounded-xl shadow-lg w-full mt-6 md:mt-10 overflow-x-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">
            Availability of each documents for IFR holders
          </h2>
          {/* Overall summary card */}
          <div className="bg-white p-3 rounded-lg shadow-md w-full md:w-auto min-w-[200px]">
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#10b981] rounded-sm" />
                <p>
                  Available
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#f87171] rounded-sm" />
                <p>
                  Not Available
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="h-[500px] md:h-[500px] w-full min-w-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={documentChartData}
              margin={{
                top: 24,
                right: isMobile ? 8 : 24,
                left: isMobile ? 8 : 16,
                bottom: isMobile ? 80 : 60
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
              <YAxis 
                tick={{ fill: "#4b5563", fontSize: isMobile ? 10 : 12 }}
              />
              <Tooltip />
              <Bar dataKey="has" fill="#10b981" name="उपलब्ध" />
              <Bar dataKey="not" fill="#f87171" name="उपलब्ध नाही" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <AadhaarModal />
      <Modal />
      {TalukaModal()}
      {VillageModal()}
      {FarmersModal()}
    </div>
  );
};

export default GraphData;