"use client";
import React from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { basicdetailsofvillagetype, presentworktype } from "./Cfrtype/futurework";

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface Props {
  serverData: presentworktype[];
  basicVillageData: basicdetailsofvillagetype[];
}

const WorkTypePieCharts: React.FC<Props> = ({ serverData, basicVillageData }) => {
  // Add error handling and data validation
  if (!serverData || !Array.isArray(serverData) || serverData.length === 0) {
    return (
      <>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm h-[360px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>No work data available</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm h-[360px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>No work data available</p>
          </div>
        </div>
      </>
    );
  }

  // Calculate total CFR area from basicVillageData with proper validation
  const totalCfrArea = (basicVillageData && Array.isArray(basicVillageData) && basicVillageData.length > 0)
    ? basicVillageData.reduce((sum, village) => {
        const area = parseFloat(village.total_cfr_area) || 0;
        return sum + area;
      }, 0)
    : 0;

  // Filter serverData by type and calculate total areas with validation
  const nrmData = serverData.filter(item => item.type === "NRM" && item.total_area);
  const plantationData = serverData.filter(item => item.type === "Plantation" && item.total_area);

  const nrmTotalArea = nrmData.reduce((sum, work) => {
    const area = parseFloat(work.total_area) || 0;
    return sum + area;
  }, 0);

  const plantationTotalArea = plantationData.reduce((sum, work) => {
    const area = parseFloat(work.total_area) || 0;
    return sum + area;
  }, 0);

  // Calculate percentages with proper validation
  const nrmPercentage = totalCfrArea > 0 ? (nrmTotalArea / totalCfrArea) * 100 : 0;
  const plantationPercentage = totalCfrArea > 0 ? (plantationTotalArea / totalCfrArea) * 100 : 0;

  // Professional color scheme based on percentage ranges
  const getWorkAreaColor = (percentage: number) => {
    if (percentage < 10) return "#F44336"; // Red
    if (percentage <= 50) return "#FFEB3B"; // Yellow
    if (percentage <= 80) return "#FF9800"; // Orange
    return "#4CAF50"; // Green
  };

  const getStatus = (percentage: number) => {
    if (percentage < 10) return "Low Coverage";
    if (percentage <= 50) return "Medium Coverage";
    if (percentage <= 80) return "High Coverage";
    return "Very High Coverage";
  };

  const getStatusColor = (percentage: number) => {
    if (percentage < 10) return "#F44336";
    if (percentage <= 50) return "#FFEB3B";
    if (percentage <= 80) return "#FF9800";
    return "#4CAF50";
  };

  // Chart data with validation
  const nrmSeries = totalCfrArea > 0 ? [nrmTotalArea, totalCfrArea - nrmTotalArea] : [nrmTotalArea, 0];
  const nrmLabels = ["NRM Work Area", "Remaining CFR Area"];
  const nrmColors = [getWorkAreaColor(nrmPercentage), "#F5F5F5"];

  const plantationSeries = totalCfrArea > 0 ? [plantationTotalArea, totalCfrArea - plantationTotalArea] : [plantationTotalArea, 0];
  const plantationLabels = ["Plantation Work Area", "Remaining CFR Area"];
  const plantationColors = [getWorkAreaColor(plantationPercentage), "#F5F5F5"];

  const chartOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 400,
      toolbar: {
        show: false,
      },
    },
    colors: ["#465FFF", "#F5F5F5"],
    labels: [],
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
        return val + "%";
      },
      style: {
        fontSize: "0px",
        fontWeight: "bold",
        colors: ["#FFFFFF", "#666666"],
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
          return val.toFixed(2) + " hectares";
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
              showAlways: false,
              label: "Coverage",
              fontSize: "12px",
              fontWeight: "bold",
              color: "#666666",
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0) > 0 
                  ? ((w.globals.seriesTotals[0] / w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1) + "%"
                  : "0%";
              },
            },
          },
        },
      },
    },
  };

  return (
    <>
      {/* NRM Donut Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm h-[400px] flex flex-col">
          <div className="mb-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">NRM Work</h3>
              <div 
                className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto"
                style={{ 
                  backgroundColor: getStatusColor(nrmPercentage) + '20',
                  color: getStatusColor(nrmPercentage)
                }}
              >
                <span className="font-medium whitespace-nowrap" style={{ color: getStatusColor(nrmPercentage) }}>
                  {getStatus(nrmPercentage)} ({nrmPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            
            {/* Area Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="text-gray-600">
                <span className="font-medium">Total CFR Area:</span>
                <span className="font-bold ml-1 text-gray-900">{totalCfrArea.toFixed(2)} hectares</span>
              </div>
              <div className="text-gray-600">
                <span className="font-medium">NRM Work Area:</span>
                <span className="font-bold ml-1 text-gray-900">{nrmTotalArea.toFixed(2)} hectares</span>
              </div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="flex-1 flex items-center justify-center">
            <ReactApexChart
              options={{
                ...chartOptions,
                labels: nrmLabels,
                colors: nrmColors,
                plotOptions: {
                  ...chartOptions.plotOptions,
                  pie: {
                    ...chartOptions.plotOptions?.pie,
                    donut: {
                      ...chartOptions.plotOptions?.pie?.donut,
                      labels: {
                        ...chartOptions.plotOptions?.pie?.donut?.labels,
                        total: {
                          ...chartOptions.plotOptions?.pie?.donut?.labels?.total,
                          label: "NRM Coverage",
                          formatter: function () {
                            return nrmPercentage.toFixed(1) + "%";
                          },
                        },
                      },
                    },
                  },
                },
              }}
              series={nrmSeries}
              type="donut"
              height={220}
            />
          </div>
        </div>

      {/* Plantation Donut Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm h-[400px] flex flex-col">
          <div className="mb-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Plantation Work</h3>
              <div 
                className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto"
                style={{ 
                  backgroundColor: getStatusColor(plantationPercentage) + '20',
                  color: getStatusColor(plantationPercentage)
                }}
              >
                <span className="font-medium whitespace-nowrap" style={{ color: getStatusColor(plantationPercentage) }}>
                  {getStatus(plantationPercentage)} ({plantationPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            
            {/* Area Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="text-gray-600">
                <span className="font-medium">Total CFR Area:</span>
                <span className="font-bold ml-1 text-gray-900">{totalCfrArea.toFixed(2)} hectares</span>
              </div>
              <div className="text-gray-600">
                <span className="font-medium">Plantation Work Area:</span>
                <span className="font-bold ml-1 text-gray-900">{plantationTotalArea.toFixed(2)} hectares</span>
              </div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="flex-1 flex items-center justify-center">
            <ReactApexChart
              options={{
                ...chartOptions,
                labels: plantationLabels,
                colors: plantationColors,
                plotOptions: {
                  ...chartOptions.plotOptions,
                  pie: {
                    ...chartOptions.plotOptions?.pie,
                    donut: {
                      ...chartOptions.plotOptions?.pie?.donut,
                      labels: {
                        ...chartOptions.plotOptions?.pie?.donut?.labels,
                        total: {
                          ...chartOptions.plotOptions?.pie?.donut?.labels?.total,
                          label: "Plantation Work",
                          formatter: function () {
                            return plantationPercentage.toFixed(1) + "%";
                          },
                        },
                      },
                    },
                  },
                },
              }}
              series={plantationSeries}
              type="donut"
              height={220}
            />
          </div>
        </div>
    </>
  );
};

export default WorkTypePieCharts;