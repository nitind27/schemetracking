"use client";

import React, { useState, useMemo } from "react";
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
import { FarmdersType } from "../farmersdata/farmers";
import { Schemesdatas } from "../schemesdata/schemes";
import { Taluka } from "../Taluka/Taluka";
import { Village } from "../Village/village";

interface AllFarmersData {
  schemes: Schemesdatas[];
  farmers: FarmdersType[];
  taluka: Taluka[];
  villages: Village[];
}

type SchemeBarData = {
  schemeName: string;
  schemeId: number;
  Applied: number;
  NotApplied: number;
  Benefited: number;
  benefitedPercent?: number; // <-- add this
};

const STATUS_LABELS = [
  { value: "Applied", label: "Applied", color: "#3b82f6" },        // Blue
  { value: "Benefited", label: "Benefited", color: "#22c55e" },    // Green
  { value: "NotApplied", label: "Not Benefited", color: "#facc15" } // Yellow
];
const PAGE_SIZE = 50;

function getLatestSchemeStatuses(schemesString: string | undefined) {
  if (!schemesString) return {};
  const entries = schemesString.split("|");
  const schemeStatusMap: Record<string, string> = {};
  entries.forEach((entry) => {
    const parts = entry.split("-");
    if (parts.length < 2) return;
    const schemeId = parts[0].trim();
    const lastPart = parts[parts.length - 1].trim().toLowerCase();
    let status = "";
    if (lastPart === "benefit received") status = "Benefited";
    else if (lastPart === "applyed" || lastPart === "applied") status = "Applied";
    else status = "NotApplied";
    schemeStatusMap[schemeId] = status;
  });
  return schemeStatusMap;
}

function getSchemeStats(farmers: FarmdersType[], schemes: Schemesdatas[]): SchemeBarData[] {
  const stats: Record<number, SchemeBarData & { total: number }> = {};
  schemes.forEach((scheme) => {
    stats[scheme.scheme_id] = {
      schemeName: scheme.scheme_name,
      schemeId: scheme.scheme_id,
      Applied: 0,
      NotApplied: 0,
      Benefited: 0,
      total: 0,
    };
  });
  farmers.forEach((farmer) => {
    const statuses = getLatestSchemeStatuses(farmer.schemes);
    schemes.forEach((scheme) => {
      const status = statuses[String(scheme.scheme_id)];
      stats[scheme.scheme_id].total += 1;
      if (!status || status === "NotApplied") stats[scheme.scheme_id].NotApplied += 1;
      else if (status === "Applied") stats[scheme.scheme_id].Applied += 1;
      else if (status === "Benefited") stats[scheme.scheme_id].Benefited += 1;
    });
  });
  // Add benefitedPercent and sort
  return Object.values(stats).map(s => ({
    ...s,
    benefitedPercent: s.total ? (s.Benefited / s.total) * 100 : 0,
  }));
}

const SchemeStatusBarChart = ({
  farmersData,
}: {
  farmersData: AllFarmersData;
}) => {
  const { farmers, schemes, taluka, villages } = farmersData;
  const [modalLevel, setModalLevel] = useState<"none" | "scheme" | "taluka" | "village">("none");
  const [selectedScheme, setSelectedScheme] = useState<Schemesdatas | null>(null);
  const [selectedTaluka, setSelectedTaluka] = useState<Taluka | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"Benefited" | "NotApplied" | "Applied">("Benefited");
  const [page, setPage] = useState(1);

  // Chart Data
  const chartData = useMemo(() => {
    const stats = getSchemeStats(farmers, schemes);
    // Sort descending by benefitedPercent
    return stats.sort((a, b) => b.benefitedPercent! - a.benefitedPercent!);
  }, [farmers, schemes]);

  // Taluka-wise stats for selected scheme and status
  const talukaStats = useMemo(() => {
    if (!selectedScheme) return [];
    return taluka
      .map((t) => {
        const farmersInTaluka = farmers.filter((f) => Number(f.taluka_id) === t.taluka_id);
        let count = 0;
        farmersInTaluka.forEach((farmer) => {
          const statuses = getLatestSchemeStatuses(farmer.schemes);
          const status = statuses[String(selectedScheme.scheme_id)];
          if (selectedStatus === "NotApplied") {
            if (!status || status === "NotApplied") count++;
          } else {
            if (status === selectedStatus) count++;
          }
        });
        return {
          ...t,
          count,
          total: farmersInTaluka.length,
          percent: farmersInTaluka.length ? (count / farmersInTaluka.length) * 100 : 0,
        };
      })
      .sort((a, b) => b.percent - a.percent); // <-- sort descending
  }, [selectedScheme, selectedStatus, farmers, taluka]);

  // Village-wise stats for selected taluka+scheme+status
  const villageStats = useMemo(() => {
    if (!selectedScheme || !selectedTaluka) return [];
    const villagesInTaluka = villages.filter((v) => Number(v.taluka_id) === selectedTaluka.taluka_id);
    return villagesInTaluka
      .map((v) => {
        const farmersInVillage = farmers.filter((f) => Number(f.village_id) === v.village_id);
        let count = 0;
        farmersInVillage.forEach((farmer) => {
          const statuses = getLatestSchemeStatuses(farmer.schemes);
          const status = statuses[String(selectedScheme.scheme_id)];
          if (selectedStatus === "NotApplied") {
            if (!status || status === "NotApplied") count++;
          } else {
            if (status === selectedStatus) count++;
          }
        });
        return {
          ...v,
          count,
          total: farmersInVillage.length,
          percent: farmersInVillage.length ? (count / farmersInVillage.length) * 100 : 0,
        };
      })
      .sort((a, b) => b.percent - a.percent); // <-- sort descending
  }, [selectedScheme, selectedTaluka, selectedStatus, farmers, villages]);

  // Beneficiaries list for selected village+scheme+status
  const filteredFarmers = useMemo(() => {
    if (!selectedScheme || !selectedVillage) return [];
    return farmers.filter((f) => {
      if (Number(f.village_id) !== selectedVillage.village_id) return false;
      const statuses = getLatestSchemeStatuses(f.schemes);
      const status = statuses[String(selectedScheme.scheme_id)];
      if (selectedStatus === "NotApplied") return !status || status === "NotApplied";
      return status === selectedStatus;
    });
  }, [selectedScheme, selectedVillage, selectedStatus, farmers]);

  const totalPages = Math.ceil(filteredFarmers.length / PAGE_SIZE);
  const paginatedFarmers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredFarmers.slice(start, start + PAGE_SIZE);
  }, [filteredFarmers, page]);

  // Download Excel
  const handleDownload = () => {
    if (!paginatedFarmers.length) return;
    const data = paginatedFarmers.map((farmer) => ({
      FarmerId: farmer.farmer_id || "",
      Name: farmer.farmer_record?.split('|')[0] || "",
      Aadhaar: farmer.farmer_record?.split('|')[5] || "",
      Taluka: taluka.find((t) => t.taluka_id === Number(farmer.taluka_id))?.name || "",
      Village: villages.find((v) => v.village_id === Number(farmer.village_id))?.name || "",
      SchemeStatus: selectedStatus,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Farmers");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `Farmers_${selectedScheme?.scheme_name}_${selectedVillage?.name}_${selectedStatus}.xlsx`
    );
  };

  const handleDownloadTaluka = () => {
    if (!talukaStats.length) return;
    const data = talukaStats.map((t) => ({
      Taluka: t.name,
      Count: t.count,
      Total: t.total,
      Percent: t.percent.toFixed(1) + "%",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Taluka Summary");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `TalukaSummary_${selectedScheme?.scheme_name}_${selectedStatus}.xlsx`
    );
  };

  const handleDownloadVillage = () => {
    if (!villageStats.length) return;
    const data = villageStats.map((v) => ({
      Village: v.name,
      Count: v.count,
      Total: v.total,
      Percent: v.percent.toFixed(1) + "%",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Village Summary");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `VillageSummary_${selectedScheme?.scheme_name}_${selectedTaluka?.name}_${selectedStatus}.xlsx`
    );
  };

  // UI
  const selectedStatusColor = STATUS_LABELS.find(s => s.value === selectedStatus)?.color || "#22c55e";

  return (
    <>
      {/* Main Bar Chart */}
      <div className="w-full mt-5">
        <div className="bg-white p-4 rounded-xl shadow-lg w-full overflow-x-auto">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4">
            Scheme wise IFR holders
          </h2>
          <div className="h-[300px] md:h-[500px] w-full min-w-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 24, left: 16, bottom: 60 }}
                barCategoryGap="5%"
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="schemeName"
                  interval={0}
                  height={80}
                  tick={{ fill: "#4b5563", fontSize: 12 }}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: "#4b5563", fontSize: 12 }} />
                <Tooltip />
                {/* Benefited */}
                <Bar
                  dataKey="Benefited"
                  fill="#22c55e"
                  name="Benefited"
                  onClick={(_data, idx) => {
                    setSelectedScheme(schemes[idx]);
                    setSelectedStatus("Benefited");
                    setModalLevel("scheme");
                  }}
                  cursor="pointer"
                  barSize={48}
                />
                {/* Not Benefited */}
                <Bar
                  dataKey="NotApplied"
                  fill="#facc15"
                  name="Not Benefited"
                  onClick={(_data, idx) => {
                    setSelectedScheme(schemes[idx]);
                    setSelectedStatus("NotApplied");
                    setModalLevel("scheme");
                  }}
                  cursor="pointer"
                  barSize={48}
                />
                {/* Applied */}
                <Bar
                  dataKey="Applied"
                  fill="#3b82f6"
                  name="Applied"
                  onClick={(_data, idx) => {
                    setSelectedScheme(schemes[idx]);
                    setSelectedStatus("Applied");
                    setModalLevel("scheme");
                  }}
                  cursor="pointer"
                  barSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modal: Taluka-wise Progress */}
      {modalLevel === "scheme" && selectedScheme && (
        <Modal onClose={() => setModalLevel("none")} size="md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <h3 className="text-lg font-bold">
              {selectedScheme.scheme_name} - Taluka wise
            </h3>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value as "Benefited" | "NotApplied" | "Applied")}
                className="border rounded px-2 py-1"
              >
                {STATUS_LABELS.map(s => (
                  <option value={s.value} key={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mr-2"
                onClick={handleDownloadTaluka}
              >
                Download Excel
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {talukaStats.map((t) => (
              <div key={t.taluka_id} className="mb-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-gray-600">
                    {t.count} / {t.total} ({t.percent.toFixed(1)}%)
                  </span>
                </div>
                <div
                  className="bg-gray-200 rounded h-4 cursor-pointer w-full"
                  onClick={() => {
                    setSelectedTaluka(t);
                    setModalLevel("taluka");
                  }}
                >
                  <div
                    className="h-4 rounded"
                    style={{ width: `${t.percent}%`, background: selectedStatusColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Modal: Village-wise Progress */}
      {modalLevel === "taluka" && selectedTaluka && (
        <Modal onClose={() => setModalLevel("scheme")} size="md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <h3 className="text-lg font-bold">
              {selectedScheme?.scheme_name} - {selectedTaluka.name} - Village wise
            </h3>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value as "Benefited" | "NotApplied" | "Applied")}
                className="border rounded px-2 py-1"
              >
                {STATUS_LABELS.map(s => (
                  <option value={s.value} key={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mr-2"
                onClick={handleDownloadVillage}
              >
                Download Excel
              </button>
            </div>
          </div>
          <div className="space-y-4 h-96 overflow-scroll">
            {villageStats.map((v) => (
              <div key={v.village_id} className="mb-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{v.name}</span>
                  <span className="text-xs text-gray-600">
                    {v.count} / {v.total} ({v.percent.toFixed(1)}%)
                  </span>
                </div>
                <div
                  className="bg-gray-200 rounded h-4 cursor-pointer w-full"
                  onClick={() => {
                    setSelectedVillage(v);
                    setModalLevel("village");
                    setPage(1);
                  }}
                >
                  <div
                    className="h-4 rounded"
                    style={{ width: `${v.percent}%`, background: selectedStatusColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Modal: Village Beneficiaries List */}
      {modalLevel === "village" && selectedVillage && (
        <Modal onClose={() => setModalLevel("taluka")} size="xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <h3 className="text-lg font-bold">
              {selectedScheme?.scheme_name} - {selectedTaluka?.name} - {selectedVillage.name}
            </h3>
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value as "Benefited" | "NotApplied" | "Applied")}
                className="border rounded px-2 py-1"
              >
                {STATUS_LABELS.map(s => (
                  <option value={s.value} key={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mr-5"
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
                  <th className="border px-2 py-1">Village</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFarmers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No data found.
                    </td>
                  </tr>
                ) : (
                  paginatedFarmers.map((farmer, idx) => (
                    <tr key={farmer.farmer_id || ""}>
                      <td className="border px-2 py-1">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td className="border px-2 py-1">{farmer.farmer_record?.split('|')[15] || ""}</td>
                      <td className="border px-2 py-1">{farmer.farmer_record?.split('|')[0] || ""}</td>
                      <td className="border px-2 py-1">{farmer.farmer_record?.split('|')[5] || ""}</td>
                      <td className="border px-2 py-1">{selectedTaluka?.name || ""}</td>
                      <td className="border px-2 py-1">{selectedVillage?.name || ""}</td>
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
              {Math.min(page * PAGE_SIZE, filteredFarmers.length)} of {filteredFarmers.length}
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
        </Modal>
      )}
    </>
  );
};

// --- Modal Component ---
function Modal({
  children,
  onClose,
  size = "md",
}: {
  children: React.ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "xl";
}) {
  const sizeClass =
    size === "sm"
      ? "md:max-w-md"
      : size === "xl"
      ? "md:max-w-4xl"
      : "md:max-w-xl";
  return (
    <div
      className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-[99999] overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-xl p-4 md:p-6 w-full max-w-full ${sizeClass} relative mx-2 my-4 pt-12`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-2xl z-10"
          onClick={onClose}
          style={{ lineHeight: 1 }}
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}

export default SchemeStatusBarChart;