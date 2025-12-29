"use client";

import React, { useState, useEffect } from "react";
import TabView from "@/components/common/TabView";
import { Suspense } from "react";
import Loader from "@/common/Loader";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import DashboardTalukatabview from "@/components/ecommerce/DashboardTalukatabview";
import { CFREcommer } from "@/components/ecommerce/CFREcommer";
import Section32Tabs from "@/components/common/Section32Tabs";
import { FarmdersType } from "@/components/farmersdata/farmers";
import { Schemesdatas } from "@/components/schemesdata/schemes";
import { UserData } from "@/components/usersdata/Userdata";
import { UserCategory } from "@/components/usercategory/userCategory";
import { Schemecategorytype } from "@/components/Schemecategory/Schemecategory";
import { Scheme_year } from "@/components/Yearmaster/yearmaster";
import { Documents } from "@/components/Documentsdata/documents";
import { Taluka } from "@/components/Taluka/Taluka";
import { Village } from "@/components/Village/village";
import { Schemesubcategorytype } from "@/components/Schemesubcategory/Schemesubcategory";

interface Metrics {
  farmers: FarmdersType[];
  schemes: Schemesdatas[];
  users: UserData[];
}

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

interface DashboardTabsWrapperProps {
  metrics: Metrics;
  farmersData: AllFarmersData;
}

const DashboardTabsWrapper: React.FC<DashboardTabsWrapperProps> = ({ metrics, farmersData }) => {
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    const category_id = sessionStorage.getItem('category_id');
    setCategoryId(category_id);
  }, []);

  // Main Dashboard Content Component
  const MainDashboardContent = () => (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-2 xl:col-span-7">
        <Suspense fallback={<Loader />}>
          <EcommerceMetrics metrics={metrics} />
          <DashboardTalukatabview farmersData={farmersData} />
        </Suspense>
      </div>
    </div>
  );

  // CFR Dashboard Content Component
  const CFRDashboardContent = () => (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <CFREcommer />
      </div>
    </div>
  );

  // For PESA Coordinator (category_id = 37), show only Main Dashboard
  const isPESACoordinator = categoryId === "37";

  const allTabs = [
    {
      id: "main-dashboard",
      label: "IFR Dashboard",
      content: <MainDashboardContent />
    },
    {
      id: "cfr-dashboard", 
      label: "CFR Dashboard",
      content: <CFRDashboardContent />
    },
    {
      id: "notification",
      label: "Section 3(2)",
      content: <div className="grid grid-cols-6 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
        <Section32Tabs />
        </div>
      </div>
    }
  ];

  // Filter tabs for PESA Coordinator - show only main dashboard
  const tabs = isPESACoordinator 
    ? allTabs.filter(tab => tab.id === "main-dashboard")
    : allTabs;

  return (
    <div className="w-full">
      <TabView tabs={tabs} defaultTab="main-dashboard" />
    </div>
  );
};

export default DashboardTabsWrapper;

