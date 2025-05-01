// app/ecommerce/page.tsx
import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";

import Showschemstable from "@/components/ecommerce/Showschemstable";
import { Suspense } from "react";
import Loader from "@/common/Loader";
// import { DownloadButtons } from "@/components/ecommerce/DownloadButtons";

export const metadata: Metadata = {
  title: "Scheme Monitoring & Tracking System",
  description:
    "Scheme Monitoring & Tracking System",
};

async function fetchMetrics() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const [farmersRes, schemesRes, usersRes] = await Promise.all([
      fetch(`${apiUrl}/api/farmers`),
      fetch(`${apiUrl}/api/schemescrud`),
      fetch(`${apiUrl}/api/users`)
    ]);

    const [farmers, schemes, users] = await Promise.all([
      farmersRes.json(),
      schemesRes.json(),
      usersRes.json()
    ]);

    return {
      farmers: farmers.length,
      schemes: schemes.length,
      users: users.length
    };
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return {
      farmers: 0,
      schemes: 0,
      users: 0
    };
  }
}

async function fetchFarmersData() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    // 1. Add yearmaster fetch here (6 fetches total)
    const [usersRes, schemesRes, farmersRes, schemescrudRes, schemessubcategoryRes, yearmasterRes, documentsRes, talukaRes, villagesRes] = await Promise.all([
      fetch(`${apiUrl}/api/usercategorycrud`),
      fetch(`${apiUrl}/api/schemescrud`),
      fetch(`${apiUrl}/api/farmers`),
      fetch(`${apiUrl}/api/schemescategory`),
      fetch(`${apiUrl}/api/schemessubcategory`), // Assuming this is correct
      fetch(`${apiUrl}/api/yearmaster`),
      fetch(`${apiUrl}/api/documents`),
      fetch(`${apiUrl}/api/taluka`),
      fetch(`${apiUrl}/api/villages`),
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

    return { users, schemes, farmers, schemescrud, schemessubcategory, yearmaster, documents,taluka,villages };
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


export default async function Ecommerce() {
  const metrics = await fetchMetrics();
  const farmersData = await fetchFarmersData();

  return (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7 p-5">
        {/* <Loader /> */}
        <Suspense fallback={<Loader />}>
        {/* <DownloadButtons /> */}
        
          <EcommerceMetrics metrics={metrics} />
          <Showschemstable farmersData={farmersData} />
        </Suspense>
      </div>
    </div>
  );
}
