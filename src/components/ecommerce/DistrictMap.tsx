import React from 'react'
import Mapsvg from '../svg/Mapsvg'
import { Documents } from '../Documentsdata/documents'
import { FarmdersType } from '../farmersdata/farmers'
import { Schemesdatas } from '../schemesdata/schemes'
import { Taluka } from '../Taluka/Taluka'
import { Village } from '../Village/village'

interface FarmersdataProps {
  data: FarmdersType[]
  datavillage: Village[]
  datataluka: Taluka[]
  dataschems: Schemesdatas[]
  documents: Documents[]
}

type TalukaCount = {
  total: number
  filledCount: number // ✅ Add this line
  names: (string | null)[]
  color: 'red' | 'orange' | 'green'
  saturation: number
}

type TalukaCounts = Record<string, TalukaCount>

// Map Marathi taluka names to English prop names
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
}) => {
  // 1. Prepare taluka-wise data
  const talukaCounts: TalukaCounts = {}

  datataluka.forEach(taluka => {
    // Sabhi farmers jo is taluka me hain
    const talukaFarmers = data.filter(
      d => String(d.taluka_id) === String(taluka.taluka_id)
    );
    const total = talukaFarmers.length;

    // Jo filled hain (empty nahi hain)
    const filledFarmers = talukaFarmers.filter(
      d => d.update_record && d.update_record.trim() !== ''
    );
    const filledCount = filledFarmers.length;

    // Filled percentage
    const filledPercent = total > 0 ? (filledCount / total) * 100 : 0;

    let color: 'red' | 'orange' | 'green';
    if (filledPercent < 50) color = 'red';
    else if (filledPercent <= 80) color = 'orange';
    else color = 'green';

    talukaCounts[taluka.name] = {
      total,
      filledCount,
      names: filledFarmers.map(d => d.name),
      color,
      saturation: Math.round(filledPercent * 100) / 100,
    };
  });


  const mapProps: Record<string, { color: string; total: number; filledCount: number }> = {}
  Object.entries(talukaCounts).forEach(([marathiName, info]) => {
    const propName = talukaPropMap[marathiName]
    if (propName) {
      mapProps[propName] = {
        color: info.color,
        total: info.total,
        filledCount: info.filledCount,
      }
    }
  })


  return (
    <div className="flex justify-center items-center h-screen border border-2">
      <Mapsvg {...mapProps} />
    </div>

  )
}

export default DistrictMap
