"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,

  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FarmdersType } from "@/components/farmersdata/farmers";
import { Taluka } from "@/components/Taluka/Taluka";
import { Schemesdatas } from "@/components/schemesdata/schemes";

interface AdvancedAnalyticsProps {
  farmers: FarmdersType[];
  talukas: Taluka[];
  schemes: Schemesdatas[];
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  farmers,
  talukas,
  // schemes,
}) => {
  // Taluka-wise comparison data
  const talukaComparisonData = useMemo(() => {
    return talukas.map((taluka) => {
      const talukaFarmers = farmers.filter(
        (f) => String(f.taluka_id) === String(taluka.taluka_id)
      );
      const completed = talukaFarmers.filter(
        (f) => f.update_record && f.update_record.trim() !== ""
      ).length;
      const total = talukaFarmers.length;
      return {
        name: taluka.name,
        completed,
        pending: total - completed,
        total,
      };
    });
  }, [farmers, talukas]);


  // Monthly survey progress - LAST 6 MONTHS
  const monthlyProgressData = useMemo(() => {
    // Get current date
    const now = new Date();
    
    // Generate last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        monthLabel: date.toLocaleString('default', { month: 'short', year: '2-digit' })
      });
    }

    // Count surveys per month
    return months.map(({ monthKey, monthLabel }) => {
      const surveysInMonth = farmers.filter((farmer) => {
        // Check if farmer has update_record
        if (!farmer.update_record || farmer.update_record.trim() === "") {
          return false;
        }

        // Parse update_record: format is "VoiceRecord/2025-10-29/346|Info/2025-11-05/346|..."
        const records = farmer.update_record.split("|");
        
        // Get the second record (index 1) which contains the date
        if (records.length < 2) {
          return false;
        }

        const secondRecord = records[1]; // e.g., "Info/2025-11-05/346"
        const parts = secondRecord.split("/");
        
        if (parts.length < 2) {
          return false;
        }

        const dateString = parts[1]; // e.g., "2025-11-05"
        
        // Parse the date
        const farmerDate = new Date(dateString);
        
        if (isNaN(farmerDate.getTime())) {
          return false;
        }

        // Compare year-month
        const farmerMonthKey = `${farmerDate.getFullYear()}-${String(farmerDate.getMonth() + 1).padStart(2, '0')}`;
        return farmerMonthKey === monthKey;
      }).length;

      return {
        month: monthLabel,
        surveys: surveysInMonth,
      };
    });
  }, [farmers]);



  // const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  return (
    <div className="space-y-6">
      {/* Taluka-wise Comparison Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Taluka-wise Survey Progress Comparison
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={talukaComparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" fill="#10B981" name="Completed" />
            <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
            <Bar dataKey="total" fill="#3B82F6" name="Total" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Monthly Survey Progress - Last 6 Months */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Last 6 Months Survey Progress
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="surveys"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Surveys Completed"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>


    </div>
  );
};

export default AdvancedAnalytics;