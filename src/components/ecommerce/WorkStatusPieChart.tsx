"use client";
import React from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { presentworktype } from "./Cfrtype/futurework";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface Props {
  serverData: presentworktype[];
}

const WorkStatusPieChart: React.FC<Props> = ({ serverData }) => {
  // Count work statuses
  const completedCount = serverData.filter(item => item.work_status === "Completed").length;
  const inProgressCount = serverData.filter(item => item.work_status === "In Progress").length;
  const pendingCount = serverData.filter(item => item.work_status === "Pending").length;

  const totalCount = serverData.length;

  // Calculate percentages
  const completedPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const inProgressPercentage = totalCount > 0 ? (inProgressCount / totalCount) * 100 : 0;
  const pendingPercentage = totalCount > 0 ? (pendingCount / totalCount) * 100 : 0;

  // Chart data
  const series = [completedCount, inProgressCount, pendingCount];
  const labels = ["Completed", "In Progress", "Pending"];
  const colors = ["#4CAF50", "#FF9800", "#F44336"]; // Green, Orange, Red

  const chartOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 400,
      toolbar: {
        show: false,
      },
    },
    colors: colors,
    labels: labels,
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      fontFamily: "Outfit",
      fontSize: "12px",
      fontWeight: 500,
      labels: {
        colors: "#333333",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: string) {
        return parseFloat(val).toFixed(2) + "%";
      },
      style: {
        fontSize: "12px",
        fontWeight: "bold",
        colors: ["#FFFFFF"],
      },
    },
    tooltip: {
      enabled: true,
      theme: "light",
      style: {
        fontSize: "12px",
        fontFamily: "Outfit",
      },
      y: {
        formatter: function (val: number) {
          return val + " works";
        },
      },
    },
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              fontWeight: "bold",
              color: "#333333",
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: "bold",
              color: "#333333",
              offsetY: 10,
              formatter: function (val: string) {
                return val + "%";
              },
            },
            total: {
              show: true,
              showAlways: true,
              label: "Total Works",
              fontSize: "12px",
              fontWeight: "bold",
              color: "#666666",
              formatter: function () {
                return totalCount.toString();
              },
            },
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm h-[400px] flex flex-col">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Work Status</h3>
        </div>
        
        {/* Status Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Completed: <span className="font-semibold text-gray-900">{completedPercentage.toFixed(1)}%</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-600">In Progress: <span className="font-semibold text-gray-900">{inProgressPercentage.toFixed(1)}%</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Pending: <span className="font-semibold text-gray-900">{pendingPercentage.toFixed(1)}%</span></span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-center justify-center">
        <ReactApexChart
          options={chartOptions}
          series={series}
          type="donut"
          height={220}
        />
      </div>
    </div>
  );
};

export default WorkStatusPieChart;
