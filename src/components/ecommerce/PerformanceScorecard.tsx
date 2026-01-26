"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Taluka } from "@/components/Taluka/Taluka";
import { FarmdersType } from "@/components/farmersdata/farmers";

interface PerformanceScorecardProps {
  talukas: Taluka[];
  farmers: FarmdersType[];
}

const PerformanceScorecard: React.FC<PerformanceScorecardProps> = ({
  talukas,
  farmers,
}) => {
  const talukaPerformance = useMemo(() => {
    return talukas.map((taluka) => {
      const talukaFarmers = farmers.filter(
        (f) => String(f.taluka_id) === String(taluka.taluka_id)
      );
      const total = talukaFarmers.length;
      const completed = talukaFarmers.filter(
        (f) => f.update_record && f.update_record.trim() !== ""
      ).length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Calculate Aadhaar linked percentage
      const aadhaarLinked = talukaFarmers.filter((f) => {
        const record = f.farmer_record?.split("|") || [];
        return record[5] && record[5].trim() !== "";
      }).length;
      const aadhaarRate = total > 0 ? Math.round((aadhaarLinked / total) * 100) : 0;
      
      // Calculate document upload percentage
      const withDocs = talukaFarmers.filter((f) => {
        const record = f.farmer_record?.split("|") || [];
        return record.length > 10 && record[10]?.trim() !== "";
      }).length;
      const docRate = total > 0 ? Math.round((withDocs / total) * 100) : 0;
      
      // Overall score (average of all metrics)
      const overallScore = Math.round((completionRate + aadhaarRate + docRate) / 3);
      
      return {
        talukaName: taluka.name,
        total,
        completed,
        completionRate,
        aadhaarRate,
        docRate,
        overallScore,
      };
    }).sort((a, b) => b.overallScore - a.overallScore);
  }, [talukas, farmers]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-lg">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Performance Scorecard per Taluka</h3>
            <p className="text-sm text-gray-500">Overall performance metrics by taluka</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Taluka
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Total IFR
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Survey Completion
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Aadhaar Linked
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Documents
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Overall Score
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {talukaPerformance.map((perf, index) => (
              <motion.tr
                key={perf.talukaName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 + 0.5, duration: 0.3 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                  <div className="font-semibold text-gray-900">{perf.talukaName}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <span className="font-medium text-gray-900">{perf.total}</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold text-gray-900">{perf.completionRate}%</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${perf.completionRate}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold text-gray-900">{perf.aadhaarRate}%</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${perf.aadhaarRate}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold text-gray-900">{perf.docRate}%</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${perf.docRate}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg border-2 ${getScoreColor(perf.overallScore)}`}>
                    {perf.overallScore}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getScoreColor(perf.overallScore)}`}>
                    {getScoreBadge(perf.overallScore)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default PerformanceScorecard;

