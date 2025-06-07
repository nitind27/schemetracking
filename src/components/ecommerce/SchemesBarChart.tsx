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
    Cell,
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
    { value: "NotApplied", label: "Not Applied", color: "#ffc658" },
    { value: "Benefited", label: "Benefited", color: "#82ca9d" },
];
const PAGE_SIZE = 50;

// Helper: Get latest status per scheme ID from a farmer's schemes string
function getLatestSchemeStatuses(schemesString: string | undefined) {
    if (!schemesString) return {};
    const entries = schemesString.split("|");
    const schemeStatusMap: Record<string, string> = {};

    entries.forEach(entry => {
        const idMatch = entry.match(/^(\d+)/);
        if (!idMatch) return;
        const schemeId = idMatch[1];
        const parts = entry.split("-");
        let lastStatus = "";
        for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i].trim().toLowerCase();
            if (part === "applyed" || part === "benefit received") {
                lastStatus = part;
                break;
            }
        }
        if (lastStatus) {
            schemeStatusMap[schemeId] =
                lastStatus === "applyed"
                    ? "Applied"
                    : "Benefited";
        }
    });

    return schemeStatusMap;
}

function getSchemeStats(
    farmers: FarmdersType[],
    schemes: Schemesdatas[]
): SchemeBarData[] {
    const stats: Record<number, SchemeBarData> = {};
    schemes.forEach(scheme => {
        stats[scheme.scheme_id] = {
            schemeName: scheme.scheme_name,
            schemeId: scheme.scheme_id,
            Applied: 0,
            NotApplied: 0,
            Benefited: 0
        };
    });

    farmers.forEach(farmer => {
        const statuses = getLatestSchemeStatuses(farmer.schemes);
        schemes.forEach(scheme => {
            const status = statuses[scheme.scheme_id];
            if (!status) {
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

const SchemeStatusBarChart = ({ farmersData }: { farmersData: AllFarmersData }) => {
    const { farmers, schemes, taluka } = farmersData;

    const chartData = useMemo(
        () => getSchemeStats(farmers, schemes),
        [farmers, schemes]
    );

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedScheme, setSelectedScheme] = useState<SchemeBarData | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<"Applied" | "NotApplied" | "Benefited">("Applied");
    const [page, setPage] = useState(1);

    // On bar click
    const handleBarClick = (scheme: SchemeBarData, status: "Applied" | "NotApplied" | "Benefited") => {
        setSelectedScheme(scheme);
        setSelectedStatus(status);
        setModalOpen(true);
        setPage(1);
    };

    // Filtered farmers for modal
    const filteredFarmers = useMemo(() => {
        if (!selectedScheme) return [];
        const schemeId = selectedScheme.schemeId;
        return farmers.filter(farmer => {
            const statuses = getLatestSchemeStatuses(farmer.schemes);
            const status = statuses[schemeId];
            if (selectedStatus === "NotApplied") {
                return !status;
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

    // Pagination logic
    const totalPages = Math.ceil(filteredFarmers.length / PAGE_SIZE);
    const paginatedFarmers = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredFarmers.slice(start, start + PAGE_SIZE);
    }, [filteredFarmers, page]);

    // Excel Export (current page only)
    const handleDownload = () => {
        if (!paginatedFarmers.length) return;
        const data = paginatedFarmers.map(farmer => ({
            FarmerId: farmer.farmer_id || farmer.farmer_id || "",
            Name: farmer.name || farmer.name || "",
            Aadhaar: farmer.aadhaar_no || "",
            Taluka:
                taluka.find((t) => t.taluka_id === Number(farmer.taluka_id))?.name || "",
            SchemeStatus: selectedStatus
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Farmers");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        saveAs(
            new Blob([excelBuffer], { type: "application/octet-stream" }),
            `Farmers_${selectedScheme?.schemeName}_${selectedStatus}_Page${page}.xlsx`
        );
    };

    return (
        <>
            <div className="w-full max-w-6xl mx-auto">
                {/* Aadhaar Chart */}
                <div className="bg-white p-6 rounded-xl shadow-lg w-full">
                    <div className="">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0 ">
                            Scheme wise IFR holders
                        </h2>
                        <div style={{ width: "100%", height: 400 }}>
                            <ResponsiveContainer>
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="schemeName"
                                        angle={-40}
                                        textAnchor="end"
                                        interval={0}
                                        fontSize={6}
                                        height={80}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <g>
                                        <text x={10} y={10} fontSize={12} fontWeight="bold">Click bar to view details</text>
                                    </g>
                                    {STATUS_LABELS.map((status) => (
                                        <Bar
                                            key={status.value}
                                            dataKey={status.value}
                                            stackId="a"
                                            fill={status.color}
                                            onClick={(data) => handleBarClick(data, status.value as "Applied" | "NotApplied" | "Benefited")}

                                        >
                                            {chartData.map((idx) => (
                                                <Cell cursor="pointer" key={`cell-${status.value}-${idx}`} />
                                            ))}
                                        </Bar>
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && selectedScheme && (
                <div
                    className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-start p-4 z-[99999]"
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl relative ml-[25%]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-2xl"
                            onClick={() => setModalOpen(false)}
                        >
                            &times;
                        </button>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                            <h3 className="text-xl font-bold mb-2 md:mb-0">
                                Farmers for Scheme:{" "}
                                <span className="text-blue-600">{selectedScheme.schemeName}</span>
                            </h3>
                            <div className="flex gap-2 flex-wrap">
                                <select
                                    value={selectedStatus}
                                    onChange={e => {
                                        setSelectedStatus(e.target.value as "Applied" | "NotApplied" | "Benefited");
                                        setPage(1);
                                    }}

                                    className="border rounded px-2 py-1"
                                >
                                    {STATUS_LABELS.map((s) => (
                                        <option value={s.value} key={s.value}>
                                            {s.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                    onClick={handleDownload}
                                >
                                    Download Excel
                                </button>
                            </div>
                        </div>
                        <div className="overflow-auto max-h-[60vh]">
                            <table className="min-w-full border text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border px-2 py-1">#</th>
                                        <th className="border px-2 py-1">Farmer ID</th>
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
                                            <tr key={farmer.farmer_id || farmer.farmer_id}>
                                                <td className="border px-2 py-1">
                                                    {(page - 1) * PAGE_SIZE + idx + 1}
                                                </td>
                                                <td className="border px-2 py-1">{farmer.farmer_id || farmer.farmer_id}</td>
                                                <td className="border px-2 py-1">{farmer.name || farmer.name || ""}</td>
                                                <td className="border px-2 py-1">{farmer.aadhaar_no || ""}</td>
                                                <td className="border px-2 py-1">
                                                    {taluka.find((t) => t.taluka_id === Number(farmer.taluka_id))
                                                        ?.name || ""}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Controls */}
                        <div className="flex justify-between items-center mt-4">
                            <span>
                                Showing {(page - 1) * PAGE_SIZE + 1}-
                                {Math.min(page * PAGE_SIZE, filteredFarmers.length)} of{" "}
                                {filteredFarmers.length}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    className="px-3 py-1 border rounded disabled:opacity-50"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Prev
                                </button>
                                <span>
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    className="px-3 py-1 border rounded disabled:opacity-50"
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
