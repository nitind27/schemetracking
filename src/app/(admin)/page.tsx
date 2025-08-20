// app/ecommerce/page.tsx
import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import Showschemstable from "@/components/ecommerce/Showschemstable";
import { Suspense } from "react";
import Loader from "@/common/Loader";
import GraphData from "@/components/ecommerce/GraphData";
import SchemesBarChart from "@/components/ecommerce/SchemesBarChart";
import { Documents } from "@/components/Documentsdata/documents";
import { FarmdersType } from "@/components/farmersdata/farmers";
import { Schemesdatas } from "@/components/schemesdata/schemes";
import { Taluka } from "@/components/Taluka/Taluka";
import { Village } from "@/components/Village/village";
import DistrictMap from "@/components/ecommerce/DistrictMap";
import { CFREcommer } from "@/components/ecommerce/CFREcommer";
import TabView from "@/components/common/TabView";

export const metadata: Metadata = {
  title: "Scheme Monitoring & Tracking System",
  description: "Scheme Monitoring & Tracking System",
};

async function fetchMetrics() {

  try {
    const [farmersRes, schemesRes, usersRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/farmers`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemescrud`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, { cache: 'no-store' })
    ]);

    const [farmers, schemes, users] = await Promise.all([
      farmersRes.json(),
      schemesRes.json(),
      usersRes.json()
    ]);

    return {
      farmers,
      schemes,
      users
    };
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return {
      farmers: [],
      schemes: [],
      users: []
    };
  }
}

async function fetchFarmersData() {

  try {
    // 1. Add yearmaster fetch here (6 fetches total)
    const [usersRes, schemesRes, farmersRes, schemescrudRes, schemessubcategoryRes, yearmasterRes, documentsRes, talukaRes, villagesRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usercategorycrud`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemescrud`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/farmers`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemescategory`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemessubcategory`), // Assuming this is correct
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/yearmaster`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/villages`),
    ]);

    // 2. Keep 6 elements here to match
    const [users, schemes, farmers, schemescrud, schemessubcategory, yearmaster, documents, taluka, villages] = await Promise.all([
      usersRes.json(),
      schemesRes.json(),
      farmersRes.json(),
      schemescrudRes.json(),
      schemessubcategoryRes.json(),
      yearmasterRes.json(),
      documentsRes.json(),
      talukaRes.json(),
      villagesRes.json()
    ]);

    return { users, schemes, farmers, schemescrud, schemessubcategory, yearmaster, documents, taluka, villages };
  } catch (error) {
    console.error('Error fetching farmers data:', error);
    return {
      users: [],
      schemes: [],
      farmers: [],
      schemescrud: [],
      schemessubcategory: [],
      yearmaster: [], // Added missing array
      documents: [], // Added missing array
      taluka: [], // Added missing array
      villages: [], // Added missing array
    };
  }
}

async function getData(): Promise<{
  farmers: FarmdersType[];
  villages: Village[];
  talukas: Taluka[];
  schemes: Schemesdatas[];
  documents: Documents[];
}> {
  const [farmersRes, villagesRes, talukaRes, schemesRes, documentsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/farmernewapi`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/villages`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemescrud`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`, { cache: 'no-store' }),
  ]);

  const [farmers, villages, talukas, schemes, documents] = await Promise.all([
    farmersRes.json(),
    villagesRes.json(),
    talukaRes.json(),
    schemesRes.json(),
    documentsRes.json(),
  ]);

  return { farmers, villages, talukas, schemes, documents };
}

export default async function Ecommerce() {
  const metrics = await fetchMetrics();
  const farmersData = await fetchFarmersData();
  const { farmers, villages, talukas, schemes, documents } = await getData();

  // Main Dashboard Content Component
  const MainDashboardContent = () => (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-0 xl:col-span-7">
        <Suspense fallback={<Loader />}>
          <EcommerceMetrics metrics={metrics} />
          <DistrictMap
            data={farmers}
            datavillage={villages}
            datataluka={talukas}
            dataschems={schemes}
            documents={documents}
          />
          <GraphData farmersData={farmersData} />
          <SchemesBarChart farmersData={farmersData} />
          <Showschemstable farmersData={farmersData} />
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

  const tabs = [
    {
      id: "main-dashboard",
      label: "IFR Dashboard",
      content: <MainDashboardContent />
    },
    {
      id: "cfr-dashboard", 
      label: "CFR Dashboard",
      content: <CFRDashboardContent />
    }
  ];

  return (
    <div className="w-full">
      <TabView tabs={tabs} defaultTab="main-dashboard" />
    </div>
  );
}
