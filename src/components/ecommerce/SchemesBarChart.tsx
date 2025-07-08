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

// --- Type Definitions (update import paths as needed) ---
import { FarmdersType } from "../farmersdata/farmers";
import { Schemesdatas } from "../schemesdata/schemes";
import { Taluka } from "../Taluka/Taluka";

interface AllFarmersData {
  schemes: Schemesdatas[];
  farmers: FarmdersType[];
  taluka: Taluka[];
}

type SchemeBarData = {
  schemeName: string;
  schemeId: number;
  Applied: number;
  NotApplied: number;
  Benefited: number;
};

const STATUS_LABELS = [
  { value: "Applied", label: "Applied", color: "#8884d8" },
  { value: "NotApplied", label: "Not Benefited", color: "#ffc658" },
  { value: "Benefited", label: "Benefited", color: "#82ca9d" },
];
const PAGE_SIZE = 50;

function getLatestSchemeStatuses(schemesString: string | undefined) {
  if (!schemesString) return {};
  const entries = schemesString.split("|");
  const schemeStatusMap: Record<string, string> = {};

  entries.forEach((entry) => {
    const parts = entry.split("-");
    if (parts.length < 2) return;

    const schemeIdMatch = parts[0].trim();
    const schemeId = schemeIdMatch;
    const lastPart = parts[parts.length - 1].trim().toLowerCase();

    let status = "";
    if (lastPart === "benefit received") {
      status = "Benefited";
    } else if (
      lastPart === "applyed" ||
      lastPart === "applied"
    ) {
      status = "Applied";
    } else {
      status = "NotApplied";
    }

    schemeStatusMap[schemeId] = status;
  });

  return schemeStatusMap;
}

function getSchemeStats(
  farmers: FarmdersType[],
  schemes: Schemesdatas[]
): SchemeBarData[] {
  const stats: Record<number, SchemeBarData> = {};
  schemes.forEach((scheme) => {
    stats[scheme.scheme_id] = {
      schemeName: scheme.scheme_name,
      schemeId: scheme.scheme_id,
      Applied: 0,
      NotApplied: 0,
      Benefited: 0,
    };
  });

  farmers.forEach((farmer) => {
    const statuses = getLatestSchemeStatuses(farmer.schemes);
    schemes.forEach((scheme) => {
      const status = statuses[String(scheme.scheme_id)];
      if (!status || status === "NotApplied") {
        stats[scheme.scheme_id].NotApplied += 1;
      } else if (status === "Applied") {
        stats[scheme.scheme_id].Applied += 1;
      } else if (status === "Benefited") {
        stats[scheme.scheme_id].Benefited += 1;
      }
    });
  });

  return Object.values(stats);
}

const SchemeStatusBarChart = ({
  farmersData,
}: {
  farmersData: AllFarmersData;
}) => {
  const { farmers, schemes, taluka } = farmersData;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartData = useMemo(() => getSchemeStats(farmers, schemes), [farmers, schemes]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<SchemeBarData | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"Applied" | "NotApplied" | "Benefited">("Benefited");
  const [page, setPage] = useState(1);

  const handleBarClick = (
    scheme: SchemeBarData | undefined,
    status: "Applied" | "NotApplied" | "Benefited"
  ) => {
    console.log(status)
    if (scheme) {
      setSelectedScheme(scheme);
      setSelectedStatus("Benefited");
      setModalOpen(true);
      setPage(1);
    }
  };

  const filteredFarmers = useMemo(() => {
    if (!selectedScheme) return [];
    const schemeId = selectedScheme.schemeId;
    return farmers.filter((farmer) => {
      const statuses = getLatestSchemeStatuses(farmer.schemes);
      const status = statuses[String(schemeId)];
      if (selectedStatus === "NotApplied") {
        return !status || status === "NotApplied";
      }
      if (selectedStatus === "Applied") {
        return status === "Applied";
      }
      if (selectedStatus === "Benefited") {
        return status === "Benefited";
      }
      return false;
    });
  }, [selectedScheme, selectedStatus, farmers]);

  const totalPages = Math.ceil(filteredFarmers.length / PAGE_SIZE);
  const paginatedFarmers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredFarmers.slice(start, start + PAGE_SIZE);
  }, [filteredFarmers, page]);

  const handleDownload = () => {
    if (!paginatedFarmers.length) return;
    const data = paginatedFarmers.map((farmer) => ({
      FarmerId: farmer.farmer_id || "",
      Name: farmer.farmer_record?.split('|')[0] || "",
      Aadhaar: farmer.farmer_record?.split('|')[5] || "",
      Taluka: taluka.find((t) => t.taluka_id === Number(farmer.taluka_id))?.name || "",
      SchemeStatus: selectedStatus,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Farmers");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `Farmers_${selectedScheme?.schemeName}_${selectedStatus}.xlsx`
    );
  };

  return (
    <>
      <div className="w-full max-w-6xl mt-5">
        <div className="bg-white p-4 rounded-xl shadow-lg w-full overflow-x-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800">
              Scheme wise IFR holders
            </h2>
            <div className="bg-white p-3 rounded-lg shadow-md w-full md:w-auto min-w-[200px]">
              <div className="text-sm text-gray-700 space-y-2">
                {STATUS_LABELS.map((status) => (
                  <div key={status.value} className="flex items-center gap-2">
                    <span
                      className="w-4 h-4"
                      style={{ background: status.color, borderRadius: 4 }}
                    />
                    <p>{status.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[300px] md:h-[500px] w-full min-w-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: isMobile ? 8 : 24,
                  left: isMobile ? 8 : 16,
                  bottom: isMobile ? 50 : 60
                }}
                barSize={isMobile ? 20 : 40}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="schemeName"
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
                {STATUS_LABELS.map((status) => (
                  <Bar
                    key={status.value}
                    dataKey={status.value}
                    fill={status.color}
                    name={status.label}
                    onClick={(_data, index) => {
                      const scheme = chartData[index];
                      handleBarClick(
                        scheme,
                        status.value as "Applied" | "NotApplied" | "Benefited"
                      );
                    }}
                    cursor="pointer"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && selectedScheme && (
        <div
          className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-[99999] overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-4 md:p-6 w-full max-w-full md:max-w-4xl relative mx-2 my-4"
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
                IFR Holders for:{" "}
                <span className="text-blue-600">{selectedScheme.schemeName}</span>
              </h3>
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(
                      e.target.value as "Applied" | "NotApplied" | "Benefited"
                    );
                    setPage(1);
                  }}
                  className="border rounded px-2 py-1 w-full md:w-auto"
                >
                  {STATUS_LABELS.map((s) => (
                    <option value={s.value} key={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full md:w-auto"
                  onClick={handleDownload}
                >
                  Download Excel
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[60vh]">
              <table className="min-w-full border text-xs md:text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">#</th>
                    <th className="border px-2 py-1">Claim ID</th>
                    <th className="border px-2 py-1">Name</th>
                    <th className="border px-2 py-1">Aadhaar</th>
                    <th className="border px-2 py-1">Taluka</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFarmers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        No data found.
                      </td>
                    </tr>
                  ) : (
                    paginatedFarmers.map((farmer, idx) => (
                      <tr key={farmer.farmer_id || ""}>
                        <td className="border px-2 py-1">
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="border px-2 py-1">
                          {farmer.farmer_record?.split('|')[15] || ""}
                        </td>
                        <td className="border px-2 py-1">{farmer.farmer_record?.split('|')[0] || ""}</td>
                        <td className="border px-2 py-1">
                          {farmer.farmer_record?.split('|')[5] || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {taluka.find(
                            (t) => t.taluka_id === Number(farmer.taluka_id)
                          )?.name || ""}
                        </td>
                      </tr>
                    ))
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
      )}
    </>
  );
};

export default SchemeStatusBarChart;