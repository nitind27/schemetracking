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

// type ActivePayloadItem = {
//   payload: {
//     [key: string]: unknown;
//   };
// };

// type CategoricalChartState = {
//   activeTooltipIndex?: number;
//   activeLabel?: string;
//   activePayload?: ActivePayloadItem[];
//   chartX?: number;
//   chartY?: number;
// };

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

type SurveyChartData = {
  taluka: string;
  total: number;
  surveyed: number;
  yetToBeSurveyed: number;
  taluka_id: number;
};

type SurveyedAadhaarChartData = {
  taluka: string;
  totalSurveyed: number;
  surveyedWithAadhaar: number;
  surveyedWithoutAadhaar: number;
  taluka_id: number;
};

const PAGE_SIZE = 50;

const AadhaarStatusChart = ({ farmersData }: { farmersData: AllFarmersData }) => {
  const { taluka, farmers, villages } = farmersData;

  // --- Aadhaar Chart Data ---
  const talukaId = sessionStorage.getItem('taluka_id');
  const userName = sessionStorage.getItem('userName');
  const categoryId = sessionStorage.getItem('category_id');
  const isPESACoordinator = categoryId === "37";
  const farmersdata = (userName === "BDO" || isPESACoordinator) ? farmers.filter((data) => data.taluka_id == talukaId) : farmers;

  let chartData: ChartData[];

  if (userName === "BDO" || isPESACoordinator) {
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

  // --- Survey Chart Data (Now showing only surveyed farmers with Aadhaar status) ---
  let surveyChartData: SurveyChartData[];

  if (userName === "BDO") {
    surveyChartData = taluka
      .filter((data) => data.taluka_id == Number(talukaId))
      .map((t) => {
        const farmersInTaluka = farmers.filter(
          (f) => f.taluka_id?.toString() == talukaId
        );

        // Get only surveyed farmers
        const surveyedFarmers = farmersInTaluka.filter(
          (f) => f.update_record && f.update_record.trim() !== ""
        );

        const total = surveyedFarmers.length; // Total surveyed
        const surveyed = surveyedFarmers.filter(
          (f) => f.farmer_record?.split('|')[5] && f.farmer_record?.split('|')[5].trim() !== ""
        ).length; // With Aadhaar
        const yetToBeSurveyed = total - surveyed; // Without Aadhaar

        return {
          taluka: t.name,
          total,
          surveyed,
          yetToBeSurveyed,
          taluka_id: t.taluka_id,
        };
      });
  } else {
    surveyChartData = taluka.map((t) => {
      const farmersInTaluka = farmers.filter(
        (f) => f.taluka_id?.toString() === t.taluka_id.toString()
      );

      // Get only surveyed farmers
      const surveyedFarmers = farmersInTaluka.filter(
        (f) => f.update_record && f.update_record.trim() !== ""
      );

      const total = surveyedFarmers.length; // Total surveyed
      const surveyed = surveyedFarmers.filter(
        (f) => f.farmer_record?.split('|')[5] && f.farmer_record?.split('|')[5].trim() !== ""
      ).length; // With Aadhaar
      const yetToBeSurveyed = total - surveyed; // Without Aadhaar

      return {
        taluka: t.name,
        total,
        surveyed,
        yetToBeSurveyed,
        taluka_id: t.taluka_id,
      };
    });
  }

  const surveyMaxValue = Math.max(...surveyChartData.map((item) => item.total), 0);
  const surveyTicks = [];
  if (surveyMaxValue <= 1000) {
    // For smaller values, use 100 or 200 intervals starting from 0
    const interval = surveyMaxValue <= 500 ? 100 : 200;
    for (let i = 0; i <= surveyMaxValue + interval; i += interval) {
      surveyTicks.push(i);
    }
  } else {
    // For larger values, use 1000 intervals
    for (let i = 0; i <= surveyMaxValue + 1000; i += 1000) {
      surveyTicks.push(i);
    }
  }

  // --- Surveyed Farmers Aadhaar Status Chart Data ---
  let surveyedAadhaarChartData: SurveyedAadhaarChartData[];

  if (userName === "BDO") {
    surveyedAadhaarChartData = taluka
      .filter((data) => data.taluka_id == Number(talukaId))
      .map((t) => {
        const farmersInTaluka = farmers.filter(
          (f) => f.taluka_id?.toString() == talukaId
        );

        // Get only surveyed farmers
        const surveyedFarmers = farmersInTaluka.filter(
          (f) => f.update_record && f.update_record.trim() !== ""
        );

        const totalSurveyed = surveyedFarmers.length;
        const surveyedWithAadhaar = surveyedFarmers.filter(
          (f) => f.farmer_record?.split('|')[5] && f.farmer_record?.split('|')[5].trim() !== ""
        ).length;
        const surveyedWithoutAadhaar = totalSurveyed - surveyedWithAadhaar;

        return {
          taluka: t.name,
          totalSurveyed,
          surveyedWithAadhaar,
          surveyedWithoutAadhaar,
          taluka_id: t.taluka_id,
        };
      });
  } else {
    surveyedAadhaarChartData = taluka.map((t) => {
      const farmersInTaluka = farmers.filter(
        (f) => f.taluka_id?.toString() === t.taluka_id.toString()
      );

      // Get only surveyed farmers
      const surveyedFarmers = farmersInTaluka.filter(
        (f) => f.update_record && f.update_record.trim() !== ""
      );

      const totalSurveyed = surveyedFarmers.length;
      const surveyedWithAadhaar = surveyedFarmers.filter(
        (f) => f.farmer_record?.split('|')[5] && f.farmer_record?.split('|')[5].trim() !== ""
      ).length;
      const surveyedWithoutAadhaar = totalSurveyed - surveyedWithAadhaar;

      return {
        taluka: t.name,
        totalSurveyed,
        surveyedWithAadhaar,
        surveyedWithoutAadhaar,
        taluka_id: t.taluka_id,
      };
    });
  }

  const surveyedAadhaarMaxValue = Math.max(...surveyedAadhaarChartData.map((item) => item.totalSurveyed), 0);
  const surveyedAadhaarTicks = [];
  if (surveyedAadhaarMaxValue <= 1000) {
    const interval = surveyedAadhaarMaxValue <= 500 ? 100 : 200;
    for (let i = 0; i <= surveyedAadhaarMaxValue + interval; i += interval) {
      surveyedAadhaarTicks.push(i);
    }
  } else {
    for (let i = 0; i <= surveyedAadhaarMaxValue + 1000; i += 1000) {
      surveyedAadhaarTicks.push(i);
    }
  }

  // --- State for Survey Modal ---
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [surveyModalTalukaId, setSurveyModalTalukaId] = useState<number | null>(null);
  const [surveyModalTalukaName, setSurveyModalTalukaName] = useState<string>("");
  const [surveyFilter, setSurveyFilter] = useState<"all" | "surveyed" | "yetToBeSurveyed">("all");
  const [surveyPage, setSurveyPage] = useState(1);

  // --- State for Surveyed Aadhaar Modal ---
  const [surveyedAadhaarModalOpen, setSurveyedAadhaarModalOpen] = useState(false);
  const [surveyedAadhaarModalTalukaId, setSurveyedAadhaarModalTalukaId] = useState<number | null>(null);
  const [surveyedAadhaarModalTalukaName, setSurveyedAadhaarModalTalukaName] = useState<string>("");
  const [surveyedAadhaarFilter, setSurveyedAadhaarFilter] = useState<"all" | "with" | "without">("all");
  const [surveyedAadhaarPage, setSurveyedAadhaarPage] = useState(1);

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

  // --- Surveyed Aadhaar Modal Data (memoized) ---
  const surveyedAadhaarFilteredFarmers = useMemo(() => {
    if (!surveyedAadhaarModalTalukaId) return [];
    // First filter by taluka and surveyed status
    const talukaFarmers = farmers.filter(
      f => Number(f.taluka_id) === surveyedAadhaarModalTalukaId && 
      f.update_record && f.update_record.trim() !== ""
    );
    // Then filter by Aadhaar status
    if (surveyedAadhaarFilter === "with") {
      return talukaFarmers.filter(f => f.farmer_record?.split('|')[5] && f.farmer_record?.split('|')[5].trim() !== "");
    }
    if (surveyedAadhaarFilter === "without") {
      return talukaFarmers.filter(f => !f.farmer_record?.split('|')[5] || f.farmer_record?.split('|')[5].trim() === "");
    }
    return talukaFarmers;
  }, [farmers, surveyedAadhaarModalTalukaId, surveyedAadhaarFilter]);

  const surveyedAadhaarTotalPages = Math.ceil(surveyedAadhaarFilteredFarmers.length / PAGE_SIZE);
  const surveyedAadhaarPaginatedFarmers = useMemo(() => {
    const start = (surveyedAadhaarPage - 1) * PAGE_SIZE;
    return surveyedAadhaarFilteredFarmers.slice(start, start + PAGE_SIZE);
  }, [surveyedAadhaarFilteredFarmers, surveyedAadhaarPage]);

  // --- Survey Modal Data (memoized) ---
  const surveyFilteredFarmers = useMemo(() => {
    if (!surveyModalTalukaId) return [];
    const talukaFarmers = farmers.filter(f => Number(f.taluka_id) === surveyModalTalukaId);
    if (surveyFilter === "surveyed") {
      return talukaFarmers.filter(f => f.update_record && f.update_record.trim() !== "");
    }
    if (surveyFilter === "yetToBeSurveyed") {
      return talukaFarmers.filter(f => !f.update_record || f.update_record.trim() === "");
    }
    return talukaFarmers;
  }, [farmers, surveyModalTalukaId, surveyFilter]);

  const surveyTotalPages = Math.ceil(surveyFilteredFarmers.length / PAGE_SIZE);
  const surveyPaginatedFarmers = useMemo(() => {
    const start = (surveyPage - 1) * PAGE_SIZE;
    return surveyFilteredFarmers.slice(start, start + PAGE_SIZE);
  }, [surveyFilteredFarmers, surveyPage]);

  // --- Surveyed Aadhaar Modal Open Handler ---
  const openSurveyedAadhaarModal = (talukaId: number, talukaName: string) => {
    setSurveyedAadhaarModalTalukaId(talukaId);
    setSurveyedAadhaarModalTalukaName(talukaName);
    setSurveyedAadhaarFilter("all");
    setSurveyedAadhaarPage(1);
    setSurveyedAadhaarModalOpen(true);
  };

  // --- Surveyed Aadhaar Download Excel Handler ---
  const handleSurveyedAadhaarDownload = () => {
    if (!surveyedAadhaarModalTalukaId) return;
    const data = surveyedAadhaarFilteredFarmers.map((farmer) => ({
      FarmerID: farmer.farmer_id,
      Name: farmer.farmer_record?.split('|')[0] || "",
      ClaimID: farmer.farmer_record?.split('|')[15] || "",
      Aadhaar: farmer.farmer_record?.split('|')[5] || "",
      Village: villages.find((v) => v.village_id === Number(farmer.village_id))?.marathi_name || "",
      Taluka: surveyedAadhaarModalTalukaName,
      HasAadhaar: farmer.farmer_record?.split('|')[5] && farmer.farmer_record?.split('|')[5].trim() !== "" ? "Yes" : "No",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Surveyed Farmers");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `${surveyedAadhaarModalTalukaName.replace(/\s+/g, "_")}_Surveyed_Farmers_Aadhaar.xlsx`
    );
  };

  // --- Survey Modal Open Handler ---
  const openSurveyModal = (talukaId: number, talukaName: string) => {
    setSurveyModalTalukaId(talukaId);
    setSurveyModalTalukaName(talukaName);
    setSurveyFilter("all");
    setSurveyPage(1);
    setSurveyModalOpen(true);
  };

  // --- Survey Download Excel Handler ---
  const handleSurveyDownload = () => {
    if (!surveyModalTalukaId) return;
    const data = surveyFilteredFarmers.map((farmer) => ({
      FarmerID: farmer.farmer_id,
      Name: farmer.farmer_record?.split('|')[0] || "",
      ClaimID: farmer.farmer_record?.split('|')[15] || "",
      Village: villages.find((v) => v.village_id === Number(farmer.village_id))?.marathi_name || "",
      Taluka: surveyModalTalukaName,
      SurveyStatus: farmer.update_record && farmer.update_record.trim() !== "" ? "Surveyed" : "Yet to be Surveyed",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Farmers");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `${surveyModalTalukaName.replace(/\s+/g, "_")}_Farmers_Survey.xlsx`
    );
  };

  // --- Survey Modal Component ---
  const SurveyModal = () =>
    surveyModalOpen ? (
      <div
        className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-99999 overflow-y-auto"
        onClick={() => setSurveyModalOpen(false)}
      >
        <div
          className="bg-white rounded-lg md:rounded-xl shadow-xl p-2 md:p-6 w-full max-w-full md:max-w-4xl relative mx-2 my-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-2xl"
            onClick={() => setSurveyModalOpen(false)}
          >
            &times;
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-0">
              Taluka Wise Survey in {" "}
              <span className="text-blue-600 underline">{surveyModalTalukaName}</span>{" "}
              taluka
            </h3>
            <div className="flex flex-col md:flex-row gap-2 flex-wrap">
              <div className="card bg-gray-200 rounded w-full md:w-auto">
                <select
                  value={surveyFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const value = e.target.value as "all" | "surveyed" | "yetToBeSurveyed";
                    setSurveyFilter(value);
                    setSurveyPage(1);
                  }}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="all">All</option>
                  <option value="surveyed">Surveyed</option>
                  <option value="yetToBeSurveyed">Yet to be Surveyed</option>
                </select>
              </div>
              <button
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full md:w-auto mr-5"
                onClick={handleSurveyDownload}
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
                  <th className="border px-2 py-1">Village</th>
                  <th className="border px-2 py-1">Survey Status</th>
                </tr>
              </thead>
              <tbody>
                {surveyPaginatedFarmers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      No data found.
                    </td>
                  </tr>
                ) : (
                  surveyPaginatedFarmers.map((farmer, idx) => {
                    const isSurveyed = farmer.update_record && farmer.update_record.trim() !== "";
                    return (
                      <tr key={farmer.farmer_id}>
                        <td className="border px-2 py-1">
                          {(surveyPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="border px-2 py-1">
                          {farmer.farmer_record?.split('|')[15] || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {farmer.farmer_record?.split('|')[0] || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {villages.find((v) => v.village_id === Number(farmer.village_id))?.marathi_name || ""}
                        </td>
                        <td className="border px-2 py-1">
                          {isSurveyed ? (
                            <span className="text-green-600 font-semibold">
                              Surveyed
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold">
                              Yet to be Surveyed
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
              Showing {(surveyPage - 1) * PAGE_SIZE + 1}-
              {Math.min(surveyPage * PAGE_SIZE, surveyFilteredFarmers.length)} of{" "}
              {surveyFilteredFarmers.length}
            </span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                onClick={() => setSurveyPage((p) => Math.max(1, p - 1))}
                disabled={surveyPage === 1}
              >
                Prev
              </button>
              <span className="text-sm">
                Page {surveyPage} of {surveyTotalPages}
              </span>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                onClick={() => setSurveyPage((p) => Math.min(surveyTotalPages, p + 1))}
                disabled={surveyPage === surveyTotalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null;

  // --- Surveyed Aadhaar Modal Component ---
  const SurveyedAadhaarModal = () =>
    surveyedAadhaarModalOpen ? (
      <div
        className="fixed inset-0 bg-[#0303033f] bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-99999 overflow-y-auto"
        onClick={() => setSurveyedAadhaarModalOpen(false)}
      >
        <div
          className="bg-white rounded-lg md:rounded-xl shadow-xl p-2 md:p-6 w-full max-w-full md:max-w-4xl relative mx-2 my-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-2xl"
            onClick={() => setSurveyedAadhaarModalOpen(false)}
          >
            &times;
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-0">
              Surveyed IFR Holders Aadhaar Availability in {" "}
              <span className="text-blue-600 underline">{surveyedAadhaarModalTalukaName}</span>{" "}
              taluka
            </h3>
            <div className="flex flex-col md:flex-row gap-2 flex-wrap">
              <div className="card bg-gray-200 rounded w-full md:w-auto">
                <select
                  value={surveyedAadhaarFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const value = e.target.value as "all" | "with" | "without";
                    setSurveyedAadhaarFilter(value);
                    setSurveyedAadhaarPage(1);
                  }}
                  className="border rounded px-2 py-1 w-full"
                >
                  <option value="all">All</option>
                  <option value="with">With Aadhaar</option>
                  <option value="without">Without Aadhaar</option>
                </select>
              </div>
              <button
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full md:w-auto mr-5"
                onClick={handleSurveyedAadhaarDownload}
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
                  <th className="border px-2 py-1">Availability</th>
                </tr>
              </thead>
              <tbody>
                {surveyedAadhaarPaginatedFarmers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      No data found.
                    </td>
                  </tr>
                ) : (
                  surveyedAadhaarPaginatedFarmers.map((farmer, idx) => {
                    const hasAadhaar = farmer.farmer_record?.split('|')[5] && farmer.farmer_record?.split('|')[5].trim() !== "";
                    return (
                      <tr key={farmer.farmer_id}>
                        <td className="border px-2 py-1">
                          {(surveyedAadhaarPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="border px-2 py-1">
                          {farmer.farmer_record?.split('|')[15] || ""}
                        </td>
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
              Showing {(surveyedAadhaarPage - 1) * PAGE_SIZE + 1}-
              {Math.min(surveyedAadhaarPage * PAGE_SIZE, surveyedAadhaarFilteredFarmers.length)} of{" "}
              {surveyedAadhaarFilteredFarmers.length}
            </span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                onClick={() => setSurveyedAadhaarPage((p) => Math.max(1, p - 1))}
                disabled={surveyedAadhaarPage === 1}
              >
                Prev
              </button>
              <span className="text-sm">
                Page {surveyedAadhaarPage} of {surveyedAadhaarTotalPages}
              </span>
              <button
                className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                onClick={() => setSurveyedAadhaarPage((p) => Math.min(surveyedAadhaarTotalPages, p + 1))}
                disabled={surveyedAadhaarPage === surveyedAadhaarTotalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : null;

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
      Aadhaar: farmer.farmer_record?.split('|')[5] || "",
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
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 w-full md:w-auto mr-5"
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

  return (
    <div className="space-y-6">
      {/* Taluka Wise Survey Chart */}
      <div className="bg-white p-2 md:p-4 rounded-xl shadow-lg w-full overflow-x-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">
            Taluka Wise Survey
          </h2>
          {/* Overall summary card */}
          <div className="bg-white p-3 rounded-lg shadow-md w-full md:w-auto min-w-[200px]">
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#6366f1] rounded-sm" />
                <p>
                  Total Surveyed: <strong>
                    {
                      farmersdata.filter(
                        (f) => f.update_record && f.update_record.trim() !== ""
                      ).length
                    }
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#10b981] rounded-sm" />
                <p>
                  With Aadhaar:{" "}
                  <strong>
                    {
                      farmersdata.filter(
                        (f) => 
                          f.update_record && f.update_record.trim() !== "" &&
                          f.farmer_record?.split('|')[5] && f.farmer_record?.split('|')[5].trim() !== ""
                      ).length
                    }
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#f87171] rounded-sm" />
                <p>
                  Without Aadhaar:{" "}
                  <strong>
                    {
                      farmersdata.filter(
                        (f) => 
                          f.update_record && f.update_record.trim() !== "" &&
                          (!f.farmer_record?.split('|')[5] || f.farmer_record?.split('|')[5].trim() === "")
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
              data={surveyChartData}
              margin={{
                top: 24,
                right: isMobile ? 8 : 24,
                left: isMobile ? 8 : 16,
              }}
              barSize={isMobile ? 20 : 40}
              onClick={(state) => {
                if (state?.activeLabel && state?.activePayload?.length) {
                  const talukaItem = surveyChartData.find(d => d.taluka === state.activeLabel);
                  if (talukaItem) openSurveyModal(talukaItem.taluka_id, talukaItem.taluka);
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
                domain={[0, "auto"]}
                ticks={surveyTicks.length > 0 ? surveyTicks : undefined}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === "Total Surveyed") {
                    return [`${value} (Surveyed)`, "Total Surveyed"];
                  }
                  return [value, name];
                }}
              />
              <Bar
                dataKey="total"
                fill="#6366f1"
                name="Total Surveyed (Only Surveyed Farmers)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="surveyed"
                fill="#10b981"
                name="With Aadhaar (Out of Surveyed)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="yetToBeSurveyed"
                fill="#f87171"
                name="Without Aadhaar (Out of Surveyed)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <SurveyModal />
      </div>

      {/* Surveyed Farmers Aadhaar Status Chart */}
      <div className="bg-white p-2 md:p-4 rounded-xl shadow-lg w-full overflow-x-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">
            Surveyed IFR Holders Aadhaar Status Across Talukas
          </h2>
          {/* Overall summary card */}
          <div className="bg-white p-3 rounded-lg shadow-md w-full md:w-auto min-w-[200px]">
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#6366f1] rounded-sm" />
                <p>
                  Total Surveyed: <strong>
                    {
                      farmersdata.filter(
                        (f) => f.update_record && f.update_record.trim() !== ""
                      ).length
                    }
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#10b981] rounded-sm" />
                <p>
                  With Aadhaar:{" "}
                  <strong>
                    {
                      farmersdata.filter(
                        (f) => 
                          f.update_record && f.update_record.trim() !== "" &&
                          f.farmer_record?.split('|')[5] && f.farmer_record?.split('|')[5].trim() !== ""
                      ).length
                    }
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-[#f87171] rounded-sm" />
                <p>
                  Without Aadhaar:{" "}
                  <strong>
                    {
                      farmersdata.filter(
                        (f) => 
                          f.update_record && f.update_record.trim() !== "" &&
                          (!f.farmer_record?.split('|')[5] || f.farmer_record?.split('|')[5].trim() === "")
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
              data={surveyedAadhaarChartData}
              margin={{
                top: 24,
                right: isMobile ? 8 : 24,
                left: isMobile ? 8 : 16,
              }}
              barSize={isMobile ? 20 : 40}
              onClick={(state) => {
                if (state?.activeLabel && state?.activePayload?.length) {
                  const talukaItem = surveyedAadhaarChartData.find(d => d.taluka === state.activeLabel);
                  if (talukaItem) openSurveyedAadhaarModal(talukaItem.taluka_id, talukaItem.taluka);
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
                domain={[0, "auto"]}
                ticks={surveyedAadhaarTicks.length > 0 ? surveyedAadhaarTicks : undefined}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === "Total Surveyed") {
                    return [`${value} (Surveyed)`, "Total Surveyed"];
                  }
                  return [value, name];
                }}
              />
              <Bar
                dataKey="totalSurveyed"
                fill="#6366f1"
                name="Total Surveyed (Only Surveyed Farmers)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="surveyedWithAadhaar"
                fill="#10b981"
                name="With Aadhaar (Out of Surveyed)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="surveyedWithoutAadhaar"
                fill="#f87171"
                name="Without Aadhaar (Out of Surveyed)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <SurveyedAadhaarModal />
      </div>

      {/* Aadhaar Status Chart */}
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
      <AadhaarModal />
      </div>
    </div>
  );
};

export default AadhaarStatusChart;
