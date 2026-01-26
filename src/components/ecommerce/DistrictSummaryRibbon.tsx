"use client";

import React from "react";
import { motion } from "framer-motion";
import { FarmdersType } from "@/components/farmersdata/farmers";
import { Taluka } from "@/components/Taluka/Taluka";
import { Village } from "@/components/Village/village";

interface DistrictSummaryRibbonProps {
  farmers: FarmdersType[];
  talukas: Taluka[];
  villages: Village[];
}

const DistrictSummaryRibbon: React.FC<DistrictSummaryRibbonProps> = ({
  farmers,
  talukas,
  villages,
}) => {
  // Calculate statistics
  const totalTalukas = talukas.length;
  const totalVillages = villages.length;
  
  // Calculate survey completion
  const farmersWithSurvey = farmers.filter(
    (f) => f.update_record && f.update_record.trim() !== ""
  ).length;
  const surveyCompletion = farmers.length > 0 
    ? Math.round((farmersWithSurvey / farmers.length) * 100) 
    : 0;
  
  // Calculate pending cases (farmers without survey)
  const pendingCases = farmers.length - farmersWithSurvey;

  const stats = [
    {
      label: "Total Talukas",
      value: totalTalukas,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Total Villages",
      value: totalVillages,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Survey Completion",
      value: `${surveyCompletion}%`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      progress: surveyCompletion,
    },
    {
      label: "Pending Cases",
      value: pendingCases,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-lg"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">District Summary</h2>
              <p className="text-sm text-blue-100">Nandurbar District Overview</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20"
              >
                <div className={`${stat.bgColor} p-2 rounded-lg ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs text-blue-100 font-medium">{stat.label}</p>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Mobile View */}
        <div className="md:hidden mt-4 grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20"
            >
              <div className={`${stat.bgColor} p-1.5 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-blue-100 font-medium">{stat.label}</p>
                <p className="text-base font-bold text-white">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DistrictSummaryRibbon;

