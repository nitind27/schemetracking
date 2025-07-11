import React from 'react'

type TalukaCount = {
  total: number
  filledCount: number
  names: (string | null)[]
  color: 'red' | 'orange' | 'green'
  saturation: number
}

type TalukaCounts = Record<string, TalukaCount>

interface TalukawiseserveProps {
  talukaCounts: TalukaCounts
}

const colorClass = {
  red: 'bg-red-500',
  orange: 'bg-orange-400',
  green: 'bg-green-500',
}

const Talukawiseserve: React.FC<TalukawiseserveProps> = ({ talukaCounts }) => {
  return (
    <div className="p-5">
      <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-6">
        Taluka Wise Serve
      </h2>
      <div className="space-y-6">
        {Object.entries(talukaCounts).map(([talukaName, info]) => {
          const percent = info.total > 0 ? Math.round((info.filledCount / info.total) * 100) : 0
          return (
            <div key={talukaName} className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-700">{talukaName}</span>
                <span className="text-sm font-medium text-gray-600">
                  {info.filledCount}/{info.total} ({percent}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`${colorClass[info.color]} h-4 rounded-full`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Talukawiseserve
