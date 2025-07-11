import React from 'react'
import Mapsvg from '../svg/Mapsvg'
import { Documents } from '../Documentsdata/documents'
import { FarmdersType } from '../farmersdata/farmers'
import { Schemesdatas } from '../schemesdata/schemes'
import { Taluka } from '../Taluka/Taluka'
import { Village } from '../Village/village'
import Talukawiseserve from '../svg/Talukawiseserve'

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
  const talukaCounts: TalukaCounts = {}

  datataluka.forEach(taluka => {
    const talukaFarmers = data.filter(
      d => String(d.taluka_id) === String(taluka.taluka_id)
    )
    const total = talukaFarmers.length
    const filledFarmers = talukaFarmers.filter(
      d => d.update_record && d.update_record.trim() !== ''
    )
    const filledCount = filledFarmers.length
    const filledPercent = total > 0 ? (filledCount / total) * 100 : 0

    let color: 'red' | 'orange' | 'green'
    if (filledPercent < 50) color = 'red'
    else if (filledPercent <= 80) color = 'orange'
    else color = 'green'

    talukaCounts[taluka.name] = {
      total,
      filledCount,
      names: filledFarmers.map(d => d.name),
      color,
      saturation: Math.round(filledPercent * 100) / 100,
    }
  })

  const mapProps: Record<string, { color: string; total: number; filledCount: number; percentage: number; }> = {}
  Object.entries(talukaCounts).forEach(([marathiName, info]) => {
    const propName = talukaPropMap[marathiName]
    if (propName) {
      mapProps[propName] = {
        color: info.color,
        total: info.total,
        filledCount: info.filledCount,
        percentage: info.total > 0 ? Math.round((info.filledCount / info.total) * 100) : 0,
      }
    }
  })

  return (
    <div className="flex flex-col md:flex-row bg-white mt-5">
      <div className="w-full md:w-1/2">
        <Talukawiseserve
          talukaCounts={talukaCounts}
          datataluka={datataluka}
          datavillage={datavillage}
          farmers={data}
        />
      </div>
      <div className="w-full md:w-1/2 overflow-scroll">
        <Mapsvg {...mapProps} />
      </div>
    </div>

  )
}

export default DistrictMap
