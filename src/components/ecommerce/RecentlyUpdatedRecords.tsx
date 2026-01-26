"use client";

import React from "react";
import { motion } from "framer-motion";
import { FarmdersType } from "@/components/farmersdata/farmers";

interface RecentlyUpdatedRecordsProps {
  farmers: FarmdersType[];
}

const RecentlyUpdatedRecords: React.FC<RecentlyUpdatedRecordsProps> = ({ farmers }) => {
  // Get recently updated farmers (those with update_record)
  const recentlyUpdated = farmers
    .filter((f) => f.update_record && f.update_record.trim() !== "")
    .slice(0, 5); // Show top 5

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  };

  const getFarmerName = (farmer: FarmdersType) => {
    if (farmer.farmer_record) {
      const record = farmer.farmer_record.split("|");
      return record[0]?.trim() || farmer.name || "N/A";
    }
    return farmer.name || "N/A";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recently Updated Records</h3>
            <p className="text-sm text-gray-500">Latest survey updates</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {recentlyUpdated.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No recent updates</p>
          </div>
        ) : (
          recentlyUpdated.map((farmer, index) => (
            <motion.div
              key={farmer.farmer_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.4, duration: 0.3 }}
              className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-green-100 p-2 rounded-lg">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{getFarmerName(farmer)}</p>
                  <p className="text-xs text-gray-500">Farmer ID: {farmer.farmer_id || "N/A"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-600">Updated</p>
                <p className="text-xs text-gray-500">
                  {farmer.update_record
                    ? formatDate(farmer.update_record.split("|")[0] || "")
                    : "Recently"}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default RecentlyUpdatedRecords;

