"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import PathHandler from "@/components/common/PathHandler";
import { FarmdersType } from "@/components/farmersdata/farmers";

interface EnhancedKPICardsProps {
  farmers: FarmdersType[];
  schemesCount: number;
  usersCount: number;
}

interface KPICardData {
  label: string;
  value: number;
  percentage?: number;
  trend?: number; // percentage change (can be negative)
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  href: string;
}

const EnhancedKPICards: React.FC<EnhancedKPICardsProps> = ({
  farmers,
  schemesCount,
  usersCount,
}) => {
  // Calculate statistics
  const totalIFR = farmers.length;
  const completedSurveys = farmers.filter(
    (f) => f.update_record && f.update_record.trim() !== ""
  ).length;
  const pendingSurveys = totalIFR - completedSurveys;
  
  // Calculate Aadhaar linked percentage
  const aadhaarLinked = farmers.filter((f) => {
    const record = f.farmer_record?.split("|") || [];
    return record[5] && record[5].trim() !== "";
  }).length;
  const aadhaarLinkedPercent = totalIFR > 0 
    ? Math.round((aadhaarLinked / totalIFR) * 100) 
    : 0;
  
  // Calculate documents uploaded (assuming farmers with any document)
  const documentsUploaded = farmers.filter((f) => {
    // Check if farmer has any document-related data
    return f.farmer_record && f.farmer_record.split("|").length > 10;
  }).length;
  const documentsUploadedPercent = totalIFR > 0
    ? Math.round((documentsUploaded / totalIFR) * 100)
    : 0;

  const kpiCards: KPICardData[] = [
    {
      label: "Total IFR Holders",
      value: totalIFR,
      percentage: 100,
      trend: 2.5, // Example: 2.5% increase
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      href: "/farmerspage",
    },
    {
      label: "Completed Surveys",
      value: completedSurveys,
      percentage: totalIFR > 0 ? Math.round((completedSurveys / totalIFR) * 100) : 0,
      trend: 5.2,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      href: "/farmerspage",
    },
    {
      label: "Pending Surveys",
      value: pendingSurveys,
      percentage: totalIFR > 0 ? Math.round((pendingSurveys / totalIFR) * 100) : 0,
      trend: -3.1,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      href: "/farmerspage",
    },
    {
      label: "Aadhaar Linked",
      value: aadhaarLinked,
      percentage: aadhaarLinkedPercent,
      trend: 1.8,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      ),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      href: "/farmerspage",
    },
    {
      label: "Documents Uploaded",
      value: documentsUploaded,
      percentage: documentsUploadedPercent,
      trend: 4.5,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      href: "/farmerspage",
    },
  ];

  // Progress Ring Component
  const ProgressRing: React.FC<{ percentage: number; color: string; size?: number }> = ({
    percentage,
    color,
    size = 60,
  }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
            style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-bold ${color}`}>{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
      {kpiCards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="group"
        >
          <Link href={card.href}>
            <PathHandler>
              <div
                className={`bg-white rounded-xl border-2 ${card.borderColor} p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${card.bgColor} p-3 rounded-lg ${card.color}`}>
                    {card.icon}
                  </div>
                  {card.trend !== undefined && (
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold ${
                        card.trend >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {card.trend >= 0 ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      <span>{Math.abs(card.trend)}%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{card.label}</p>
                    <p className={`text-2xl font-bold ${card.color} mb-2`}>
                      {card.value.toLocaleString()}
                    </p>
                    {card.percentage !== undefined && (
                      <p className="text-xs text-gray-500">Progress: {card.percentage}%</p>
                    )}
                  </div>
                  {card.percentage !== undefined && (
                    <ProgressRing
                      percentage={card.percentage}
                      color={card.color}
                      size={70}
                    />
                  )}
                </div>
              </div>
            </PathHandler>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default EnhancedKPICards;

