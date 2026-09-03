"use client";

import React, { useState, useEffect, useMemo } from 'react'
import Mapsvg from '../svg/Mapsvg'
import { Documents } from '../Documentsdata/documents'
import { FarmdersType } from '../farmersdata/farmers'
import { Schemesdatas } from '../schemesdata/schemes'
import { Taluka } from '../Taluka/Taluka'
import { Village } from '../Village/village'
import Talukawiseserve from '../svg/Talukawiseserve'
import { isSurveyedFarmer } from '../farmersdata/parseFarmerDocuments'

interface FarmersdataProps {
  data: FarmdersType[]
  datavillage: Village[]
  datataluka: Taluka[]
  dataschems: Schemesdatas[]
  documents: Documents[]
}

type TalukaCount = {
  total: number
  filledCount: number
  names: (string | null)[]
  color: 'red' | 'orange' | 'green'
  saturation: number
}

type TalukaCounts = Record<string, TalukaCount>

const talukaPropMap: Record<string, string> = {
  'नंदुरबार': 'nandurbar',
  'नवापूर': 'navapur',
  'शहादा': 'shahade',
  'तळोदा': 'taloda',
  'अक्कलकुवा': 'akkalkuva',
  'अक्राणी': 'akrani',
  'धडगाव': 'dhadgaon',
}

const DistrictMap: React.FC<FarmersdataProps> = ({
  data,
  datataluka,
  datavillage
}) => {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [userTalukaId, setUserTalukaId] = useState<string | null>(null);

  useEffect(() => {
    setCategoryId(sessionStorage.getItem('category_id'));
    setUserTalukaId(sessionStorage.getItem('taluka_id'));
  }, []);

  const isPESACoordinator = categoryId === "37";

  const filteredTalukas = useMemo(
    () =>
      isPESACoordinator && userTalukaId
        ? datataluka.filter(t => String(t.taluka_id) === String(userTalukaId))
        : datataluka,
    [datataluka, isPESACoordinator, userTalukaId]
  );

  const filteredData = useMemo(
    () =>
      isPESACoordinator && userTalukaId
        ? data.filter(d => String(d.taluka_id) === String(userTalukaId))
        : data,
    [data, isPESACoordinator, userTalukaId]
  );

  const { talukaCounts, mapProps } = useMemo(() => {
    const counts: TalukaCounts = {};
    const buckets = new Map<number, { total: number; filled: FarmdersType[]; name: string }>();

    filteredTalukas.forEach((taluka) => {
      buckets.set(Number(taluka.taluka_id), { total: 0, filled: [], name: taluka.name });
    });

    for (let i = 0; i < filteredData.length; i++) {
      const farmer = filteredData[i];
      const bucket = buckets.get(Number(farmer.taluka_id));
      if (!bucket) continue;
      bucket.total += 1;
      if (isSurveyedFarmer(farmer)) bucket.filled.push(farmer);
    }

    buckets.forEach((bucket) => {
      const total = bucket.total;
      const filledCount = bucket.filled.length;
      const filledPercent = total > 0 ? (filledCount / total) * 100 : 0;
      let color: 'red' | 'orange' | 'green';
      if (filledPercent < 50) color = 'red';
      else if (filledPercent <= 80) color = 'orange';
      else color = 'green';

      counts[bucket.name] = {
        total,
        filledCount,
        names: bucket.filled.map(d => d.name),
        color,
        saturation: Math.round(filledPercent * 100) / 100,
      };
    });

    const props: Record<string, { color: string; total: number; filledCount: number; percentage: number; }> = {};
    Object.entries(counts).forEach(([marathiName, info]) => {
      const propName = talukaPropMap[marathiName];
      if (propName) {
        props[propName] = {
          color: info.color,
          total: info.total,
          filledCount: info.filledCount,
          percentage: info.total > 0 ? Math.round((info.filledCount / info.total) * 100) : 0,
        };
      }
    });

    return { talukaCounts: counts, mapProps: props };
  }, [filteredTalukas, filteredData]);

  return (
    <div className="flex flex-col md:flex-row bg-white mt-3">
      <div className="w-full md:w-1/2">
        <Talukawiseserve
          talukaCounts={talukaCounts}
          datataluka={filteredTalukas}
          datavillage={datavillage}
          farmers={filteredData}
        />
      </div>
      <div className="w-full md:w-1/2 overflow-scroll">
        <Mapsvg {...mapProps} />
      </div>
    </div>
  )
}

export default DistrictMap
