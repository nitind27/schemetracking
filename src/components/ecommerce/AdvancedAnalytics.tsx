"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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

  // Scheme-wise beneficiary distribution
  const schemeDistributionData = useMemo(() => {
    const schemeMap = new Map<string, number>();
    
    farmers.forEach((farmer) => {
      if (farmer.schemes && Array.isArray(farmer.schemes)) {
        farmer.schemes.forEach((scheme) => {
          const schemeName = scheme.scheme_name || "Unknown";
          schemeMap.set(schemeName, (schemeMap.get(schemeName) || 0) + 1);
        });
      }
    });

    return Array.from(schemeMap.entries())
      .map(([name, count]) => ({ name, value: count }))
      .slice(0, 6) // Top 6 schemes
      .sort((a, b) => b.value - a.value);
  }, [farmers]);

  // Monthly survey progress (mock data - in real app, calculate from actual dates)
  const monthlyProgressData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((month) => ({
      month,
      surveys: Math.floor(Math.random() * 200) + 50, // Mock data
    }));
  }, []);

  // Document availability donut chart data
  const documentAvailabilityData = useMemo(() => {
    const withDocs = farmers.filter((f) => {
      const record = f.farmer_record?.split("|") || [];
      return record.length > 10 && record[10]?.trim() !== "";
    }).length;
    const withoutDocs = farmers.length - withDocs;
    
    return [
      { name: "With Documents", value: withDocs },
      { name: "Without Documents", value: withoutDocs },
    ];
  }, [farmers]);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

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
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheme-wise Beneficiary Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Scheme-wise Beneficiary Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={schemeDistributionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly Survey Progress */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Monthly Survey Progress
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

      {/* Document Availability Donut Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Document Availability Status
        </h3>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={documentAvailabilityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {documentAvailabilityData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default AdvancedAnalytics;

