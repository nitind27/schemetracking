"use client";
import React, { useState } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { basicdetailsofvillagetype, presentworktype } from "./Cfrtype/futurework";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Props {
  serverData: presentworktype[];
  basicVillageData: basicdetailsofvillagetype[];
}

const WorkTypePieCharts: React.FC<Props> = ({ serverData, basicVillageData }) => {
  const [activeTab, setActiveTab] = useState<"NRM" | "Plantation">("NRM");

  if (!serverData || !Array.isArray(serverData) || serverData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm h-[400px] flex items-center justify-center">
        <div className="text-center text-gray-500"><p>No work data available</p></div>
      </div>
    );
  }

  const totalCfrArea =
    basicVillageData && Array.isArray(basicVillageData) && basicVillageData.length > 0
      ? basicVillageData.reduce((sum, v) => sum + (parseFloat(v.total_cfr_area) || 0), 0)
      : 0;

  const nrmTotalArea = serverData
    .filter((i) => i.type === "NRM" && i.total_area)
    .reduce((sum, w) => sum + (parseFloat(w.total_area) || 0), 0);

  const plantationTotalArea = serverData
    .filter((i) => i.type === "Plantation" && i.total_area)
    .reduce((sum, w) => sum + (parseFloat(w.total_area) || 0), 0);

  const nrmPercentage = totalCfrArea > 0 ? (nrmTotalArea / totalCfrArea) * 100 : 0;
  const plantationPercentage = totalCfrArea > 0 ? (plantationTotalArea / totalCfrArea) * 100 : 0;

  const getColor = (pct: number) => {
    if (pct < 10) return "#F44336";
    if (pct <= 50) return "#FFEB3B";
    if (pct <= 80) return "#FF9800";
    return "#4CAF50";
  };

  const getStatus = (pct: number) => {
    if (pct < 10) return "Low Coverage";
    if (pct <= 50) return "Medium Coverage";
    if (pct <= 80) return "High Coverage";
    return "Very High Coverage";
  };

  const isNRM = activeTab === "NRM";
  const area = isNRM ? nrmTotalArea : plantationTotalArea;
  const pct = isNRM ? nrmPercentage : plantationPercentage;
  const label = isNRM ? "NRM Work Area" : "Plantation Work Area";
  const coverageLabel = isNRM ? "NRM Coverage" : "Plantation Coverage";
  const series = totalCfrArea > 0 ? [area, totalCfrArea - area] : [area, 0];
  const labels = [label, "Remaining CFR Area"];
  const colors = [getColor(pct), "#F5F5F5"];

  const chartOptions: ApexOptions = {
    chart: { fontFamily: "Outfit, sans-serif", type: "donut", toolbar: { show: false } },
    colors,
    labels,
    legend: {
      show: true, position: "bottom", horizontalAlign: "center",
      fontFamily: "Outfit", fontSize: "12px", fontWeight: 500,
      labels: { colors: "#333333" },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: string) => parseFloat(val).toFixed(2) + "%",
      style: { fontSize: "0px", fontWeight: "bold", colors: ["#FFFFFF", "#666666"] },
    },
    tooltip: {
      enabled: true, theme: "light",
      style: { fontSize: "12px", fontFamily: "Outfit" },
      y: { formatter: (val: number) => val.toFixed(2) + " hectares" },
    },
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: { show: true, fontSize: "14px", fontWeight: "bold", color: "#333333", offsetY: -10 },
            value: {
              show: true, fontSize: "20px", fontWeight: "bold", color: "#333333", offsetY: 10,
              formatter: (val: string) => val + "%",
            },
            total: {
              show: true, showAlways: true, label: coverageLabel,
              fontSize: "12px", fontWeight: "bold", color: "#666666",
              formatter: () => pct.toFixed(1) + "%",
            },
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm h-[400px] flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 flex-shrink-0">
        {(["NRM", "Plantation"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px ${
              activeTab === tab
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "NRM" ? "NRM Work" : "Plantation Work"}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 flex-shrink-0">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900">{isNRM ? "NRM Work" : "Plantation Work"}</h3>
        <div
          className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto"
          style={{ backgroundColor: getColor(pct) + "20", color: getColor(pct) }}
        >
          {getStatus(pct)} ({pct.toFixed(1)}%)
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-2 flex-shrink-0">
        <div className="text-gray-600">
          <span className="font-medium">Total CFR Area:</span>
          <span className="font-bold ml-1 text-gray-900">{totalCfrArea.toFixed(2)} ha</span>
        </div>
        <div className="text-gray-600">
          <span className="font-medium">{label}:</span>
          <span className="font-bold ml-1 text-gray-900">{area.toFixed(2)} ha</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-center justify-center">
        <ReactApexChart options={chartOptions} series={series} type="donut" height={200} />
      </div>
    </div>
  );
};

export default WorkTypePieCharts;
