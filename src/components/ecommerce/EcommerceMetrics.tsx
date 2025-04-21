"use client";
import React, { useEffect, useState } from "react";
import { BoxIconLine, GroupIcon, UserIcon } from "@/icons"; // Add UserIcon import

export const EcommerceMetrics = () => {
  const [metrics, setMetrics] = useState({
    farmers: 0,
    schemes: 0,
    users: 0
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [farmersRes, schemesRes, usersRes] = await Promise.all([
          fetch('/api/farmers'),
          fetch('/api/schemescrud'),
          fetch('/api/users')
        ]);

        const [farmers, schemes, users] = await Promise.all([
          farmersRes.json(),
          schemesRes.json(),
          usersRes.json()
        ]);

        setMetrics({
          farmers: farmers.length,
          schemes: schemes.length,
          users: users.length
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchAllData();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 p-5">
      <MetricCard
        icon={<GroupIcon className="w-7 h-7 text-gray-600 dark:text-gray-200" />}
        label="Farmers"
        value={metrics.farmers}
      />

      <MetricCard
        icon={<BoxIconLine className="w-7 h-7 text-gray-600 dark:text-gray-200" />}
        label="Schemes"
        value={metrics.schemes}
      />

      <MetricCard
        icon={<UserIcon className="w-7 h-7 text-gray-600 dark:text-gray-200" />} // Add UserIcon component
        label="System Users"
        value={metrics.users}
      />
    </div>
  );
};

const MetricCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm transition-shadow">
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-lg dark:bg-gray-800">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {value}
        </h4>
      </div>
    </div>
  </div>
);
