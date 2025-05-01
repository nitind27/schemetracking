"use client";

import React from "react";
import { BoxIconLine, GroupIcon, UserIcon } from "@/icons";
import Link from "next/link";
import PathHandler from "../common/PathHandler";

interface Metrics {
  farmers: number;
  schemes: number;
  users: number;
}

export const EcommerceMetrics = ({ metrics }: { metrics: Metrics }) => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      <MetricCard
        icon={<GroupIcon className="w-7 h-7 text-gray-600 dark:text-gray-200" />}
        label="IFR holders"
        value={metrics.farmers}
        href="/farmerspage"
      />
      <MetricCard
        icon={<BoxIconLine className="w-7 h-7 text-gray-600 dark:text-gray-200" />}
        label="Schemes"
        value={metrics.schemes}
        href="/schemespage"
      />
      <MetricCard
        icon={<UserIcon className="w-7 h-7 text-gray-600 dark:text-gray-200" />}
        label="System Users"
        value={metrics.users}
        href="/users"
      />
    </div>
  );
};
const MetricCard = ({ icon, label, value, href }: { icon: React.ReactNode, label: string, value: number, href: string }) => (
  <>


  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-sm transition-shadow">

    <Link href={href}>
      <PathHandler>
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
      </PathHandler>
    </Link>
  </div>
  </>
);
