"use client";

import React, { useEffect, useState } from "react";
import { BoxIconLine, GroupIcon, UserIcon } from "@/icons";
import Link from "next/link";
import PathHandler from "../common/PathHandler";
import { FarmdersType } from "../farmersdata/farmers";
import { Schemesdatas } from "../schemesdata/schemes";
import { UserData } from "../usersdata/Userdata";

interface Metrics {
  farmers: FarmdersType[];
  schemes: Schemesdatas[];
  users: UserData[];
}

export const EcommerceMetrics = ({ metrics }: { metrics: Metrics }) => {
  const [filters, setFilters] = useState({
    talukaId: null as string | null,
    villageId: null as string | null,
    categoryName: null as string | null
  });

  useEffect(() => {
    setFilters({
      talukaId: sessionStorage.getItem('taluka_id'),
      villageId: sessionStorage.getItem('village_id'),
      categoryName: sessionStorage.getItem('category_id')
    });
  }, []);

  const filteredFarmers = metrics?.farmers?.filter(f =>
    f.taluka_id === filters.talukaId &&
    f.village_id === filters.villageId
  ) || [];
  const filteredFarmersbdo = metrics?.farmers.filter(f =>
    f.taluka_id === filters.talukaId
  ) || [];
  const filteredFarmersvanaksetra = metrics?.farmers.filter(f =>
    f.vanksetra != ""
  ) || [];
  const counts = {

    farmers: filters.categoryName === "1" || filters.categoryName === "8" || filters.categoryName === "4" || filters.categoryName === "32"
      ? metrics?.farmers.length ?? 0
      :
      filters.categoryName === "33" ?
        filteredFarmersbdo.length
        :
        filteredFarmers.length,
    schemes: metrics?.schemes.length ?? 0,
    users: metrics?.users.length ?? 0,
    vanakshetra: filters.categoryName === "1" || filters.categoryName === "8" || filters.categoryName === "4" || filters.categoryName === "32"
      ? metrics?.farmers.length ?? 0 : filteredFarmersvanaksetra.length
  };


  const metricsConfig = [
    {
      icon: <GroupIcon className="w-7 h-7 text-gray-600 dark:text-gray-200" />,
      label: "IFR holders",
      value: counts.farmers,
      href: filters.categoryName === "33" ? "/ifrholderwisevillages" : "/farmerspage",
      show: true
    },
    {
      icon: <BoxIconLine className="w-7 h-7 text-gray-600 dark:text-gray-200" />,
      label: "Schemes",
      value: counts.schemes,
      href: "/schemespage",
      show: true
    },
    {
      icon: <UserIcon className="w-7 h-7 text-gray-600 dark:text-gray-200" />,
      label: "System Users",
      value: counts.users,
      href: "/users",
      show: filters.categoryName === "1" || filters.categoryName === "8" || filters.categoryName === "32" || filters.categoryName === "4"
    },
    {
      icon: <UserIcon className="w-7 h-7 text-gray-600 dark:text-gray-200" />,
      label: "Vanksetra",
      value: `${counts.vanakshetra} / ${counts.vanakshetra}`,
      href: "/users",
      show:
        filters.categoryName === "1" ||
        filters.categoryName === "8" ||
        filters.categoryName === "32" ||
        filters.categoryName === "4"
    }

  ];

  return (
    <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${filters.categoryName === "1" || filters.categoryName === "8" || filters.categoryName === "32" || filters.categoryName === "4" ? "sm:grid-cols-3" : "sm:grid-cols-2"
      }`}>
      {metricsConfig.map((metric, index) => metric.show && (
        <>{
          filters.categoryName != "32" &&
          <MetricCard key={index} {...metric} />
        }
        </>
      ))}
    </div>
  );
};

const MetricCard = ({ icon, label, value, href }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  href: string

}
) => (
  <>
    {
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
    }

  </>
);
