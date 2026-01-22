"use client";

import { useState, useEffect, useRef } from "react";
// import { usePathname } from "next/navigation";
import DashboardTabsWrapper from "./DashboardTabsWrapper";
import Loader from "@/common/Loader";
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

// Module-level cache to persist data across component remounts
let cachedMetrics: Metrics | null = null;
let cachedFarmersData: AllFarmersData | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

export default function DashboardDataLoader() {
  // const pathname = usePathname();
  const hasMountedRef = useRef(false);
  const [metrics, setMetrics] = useState<Metrics | null>(cachedMetrics);
  const [farmersData, setFarmersData] = useState<AllFarmersData | null>(cachedFarmersData);
  const [loading, setLoading] = useState(!cachedMetrics || !cachedFarmersData);

  useEffect(() => {
    // If data is already cached, use it immediately (no reload needed)
    if (cachedMetrics && cachedFarmersData) {
      setMetrics(cachedMetrics);
      setFarmersData(cachedFarmersData);
      setLoading(false);
      hasMountedRef.current = true;
      return;
    }

    // Prevent multiple fetches if component remounts quickly
    if (hasMountedRef.current && cachedMetrics && cachedFarmersData) {
      return;
    }

    // If already loading, wait for the existing promise
    if (isLoading && loadPromise) {
      loadPromise.then(() => {
        setMetrics(cachedMetrics);
        setFarmersData(cachedFarmersData);
        setLoading(false);
      });
      return;
    }

    // Fetch data after component mounts (non-blocking)
    const fetchData = async () => {
      isLoading = true;
      try {
        // Fetch metrics and farmers data in parallel
        const [metricsResult, farmersDataResult] = await Promise.all([
          fetchMetrics(),
          fetchFarmersData()
        ]);

        // Cache the data
        cachedMetrics = metricsResult;
        cachedFarmersData = farmersDataResult;

        setMetrics(metricsResult);
        setFarmersData(farmersDataResult);
        hasMountedRef.current = true;
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set empty data on error
        const emptyMetrics = {
          farmers: [],
          schemes: [],
          users: []
        };
        const emptyFarmersData = {
          users: [],
          schemes: [],
          farmers: [],
          schemescrud: [],
          schemessubcategory: [],
          yearmaster: [],
          documents: [],
          taluka: [],
          villages: []
        };
        
        cachedMetrics = emptyMetrics;
        cachedFarmersData = emptyFarmersData;
        
        setMetrics(emptyMetrics);
        setFarmersData(emptyFarmersData);
        hasMountedRef.current = true;
      } finally {
        isLoading = false;
        loadPromise = null;
        setLoading(false);
      }
    };

    loadPromise = fetchData();
  }, []);

  if (loading || !metrics || !farmersData) {
    return <Loader />;
  }

  return <DashboardTabsWrapper metrics={metrics} farmersData={farmersData} />;
}

async function fetchMetrics(): Promise<Metrics> {
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

async function fetchFarmersData(): Promise<AllFarmersData> {
  try {
    const [usersRes, schemesRes, farmersRes, schemescrudRes, schemessubcategoryRes, yearmasterRes, documentsRes, talukaRes, villagesRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usercategorycrud`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemescrud`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/farmers`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemescategory`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schemessubcategory`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/yearmaster`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/documents`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/taluka`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/villages`),
    ]);

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
      yearmaster: [],
      documents: [],
      taluka: [],
      villages: [],
    };
  }
}

