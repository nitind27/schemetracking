"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { FarmdersType } from "../farmersdata/farmers";
import { UserCategory } from "../usercategory/userCategory";
import { Schemesdatas } from "../schemesdata/schemes";
import { Schemecategorytype } from "../Schemecategory/Schemecategory";
import { Schemesubcategorytype } from "../Schemesubcategory/Schemesubcategory";
import { Scheme_year } from "../Yearmaster/yearmaster";
import { Documents } from "../Documentsdata/documents";
import { Taluka } from "../Taluka/Taluka";
import { Village } from "../Village/village";

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
};

const GraphData = ({ farmersData }: { farmersData: AllFarmersData }) => {
  const { taluka, farmers } = farmersData;

  const chartData: ChartData[] = taluka.map((t) => {
    const farmersInTaluka = farmers.filter(f => f.taluka_id?.toString() === t.taluka_id.toString());

    const total = farmersInTaluka.length;
    const withAadhaar = farmersInTaluka.filter(f => f.aadhaar_no && f.aadhaar_no.trim() !== "").length;
    const withoutAadhaar = total - withAadhaar;

    return {
      taluka: t.name, // Use taluka_name for label
      total,
      withAadhaar,
      withoutAadhaar,
    };
  });
  const maxValue = Math.max(...chartData.map((item) => item.total));
  const ticks = [];
  for (let i = 1000; i <= maxValue + 1000; i += 1000) {
    ticks.push(i);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0 ">
          IFR Holders With and Without Aadhaar by Taluka
        </h2>

        {/* Overall summary card */}
        <div className="bg-white p-4 rounded-lg shadow-md w-full md:w-auto">
          <div className="text-sm text-gray-700 space-y-2">

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#6366f1] rounded-sm" />
              <p>Total IFR: <strong>{farmers.length}</strong></p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#10b981] rounded-sm" />
              <p>With Aadhaar:{" "}
                <strong>
                  {farmers.filter(f => f.aadhaar_no && f.aadhaar_no.trim() !== "").length}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#f87171] rounded-sm" />
              <p>Without Aadhaar:{" "}
                <strong>
                  {farmers.filter(f => !f.aadhaar_no || f.aadhaar_no.trim() === "").length}
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Bar chart */}
      <div className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 24, right: 24, left: 16, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="taluka"
              angle={-35}
              textAnchor="end"
              interval={0}
              height={80}
              tick={{ fill: "#4b5563" }}
            />
            <YAxis
              tick={{ fill: "#4b5563" }}
              domain={[1000, 'auto']}
              ticks={ticks}
            />
            <YAxis
              tick={{ fill: "#4b5563" }}
              domain={[1000, 'auto']}
              tickFormatter={(value) => `${value}`}
              ticks={[1000, 2000, 3000, 4000, 5000]} // Adjust based on your max value
            />

            <Tooltip />
            <Bar dataKey="total" fill="#6366f1" name="Total IFR" />
            <Bar dataKey="withAadhaar" fill="#10b981" name="With Aadhaar" />
            <Bar dataKey="withoutAadhaar" fill="#f87171" name="Without Aadhaar" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Taluka-wise summary cards */}
      {/* <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chartData.map((item, index) => (
          <div key={index} className="border p-4 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-700 mb-2">{item.taluka}</h3>
            <p className="text-sm text-gray-600">
              Total IFR: <strong>{item.total}</strong>
            </p>
            <p className="text-sm text-green-600">
              With Aadhaar: <strong>{item.withAadhaar}</strong>
            </p>
            <p className="text-sm text-red-600">
              Without Aadhaar: <strong>{item.withoutAadhaar}</strong>
            </p>
          </div>
        ))}
      </div> */}
    </div>
  );

};

export default GraphData;
