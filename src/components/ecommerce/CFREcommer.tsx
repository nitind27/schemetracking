"use client";

import React, { useEffect, useState } from "react";
// import { BoxIconLine, GroupIcon, UserIcon } from "@/icons";
// import { FarmdersType } from "../farmersdata/farmers";
// import { Schemesdatas } from "../schemesdata/schemes";
// import { UserData } from "../usersdata/Userdata";
import TabView from "@/components/common/TabView";
import Basicvillageofabout from "@/components/Cfr/Basicvillageofabout";
import Presetntwork from "@/components/ecommerce/Presetntwork";
import Futurecommer from "@/components/ecommerce/Futurecommer";
import {
  basicdetailsofvillagetype,
  presentworktype,
  Futureworktype,
} from "@/components/ecommerce/Cfrtype/futurework";

// interface Metrics {
//   farmers: FarmdersType[];
//   schemes: Schemesdatas[];
//   users: UserData[];
// }

export const CFREcommer = () => {
  // const [filters, setFilters] = useState({
  //   talukaId: null as string | null,
  //   villageId: null as string | null,
  //   categoryName: null as string | null
  // });

  const [basicLoading, setBasicLoading] = useState(true);
  const [presentLoading, setPresentLoading] = useState(true);
  const [futureLoading, setFutureLoading] = useState(true);

  const [basicData, setBasicData] = useState<basicdetailsofvillagetype[]>([]);
  const [presentData, setPresentData] = useState<presentworktype[]>([]);
  const [futureData, setFutureData] = useState<Futureworktype[]>([]);

  const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   setFilters({
  //     talukaId: sessionStorage.getItem('taluka_id'),
  //     villageId: sessionStorage.getItem('village_id'),
  //     categoryName: sessionStorage.getItem('category_id')
  //   });
  // }, []);

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL;
        const [basicRes, presentRes, futureRes] = await Promise.all([
          fetch(`${base}/api/basicdetailsofvillage`, { cache: 'no-store' }),
          fetch(`${base}/api/presentwork`, { cache: 'no-store' }),
          fetch(`${base}/api/futurework`, { cache: 'no-store' }),
        ]);

        const [basicJson, presentJson, futureJson] = await Promise.all([
          basicRes.json(),
          presentRes.json(),
          futureRes.json(),
        ]);

        if (!mounted) return;
        setBasicData(Array.isArray(basicJson) ? basicJson : []);
        setPresentData(Array.isArray(presentJson) ? presentJson : []);
        setFutureData(Array.isArray(futureJson) ? futureJson : []);
      } catch {
        if (!mounted) return;
        setError("Failed to load CFR data.");
      } finally {
        if (!mounted) return;
        setBasicLoading(false);
        setPresentLoading(false);
        setFutureLoading(false);
      }
    }
    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  const tabs = [
    {
      id: "basic",
      label: "गावाविषयी प्राथमिक माहिती",
      content: basicLoading
        ? <div>Loading...</div>
        : error
        ? <div className="text-red-500">{error}</div>
        : <Basicvillageofabout serverData={basicData} />
    },
    {
      id: "present",
      label: "CFR क्षेत्रातील झालेल्या / सुरू असलेल्या कामांची माहिती",
      content: presentLoading
        ? <div>Loading...</div>
        : error
        ? <div className="text-red-500">{error}</div>
        : <Presetntwork serverData={presentData} />
    },
    {
      id: "future",
      label: "CFR क्षेत्रातील प्रस्तावित कामांची माहिती",
      content: futureLoading
        ? <div>Loading...</div>
        : error
        ? <div className="text-red-500">{error}</div>
        : <Futurecommer serverData={futureData} />
    },
  ];

  return (
    <div className="space-y-4">
     
      <TabView tabs={tabs} defaultTab="basic" />
    </div>
  );
};