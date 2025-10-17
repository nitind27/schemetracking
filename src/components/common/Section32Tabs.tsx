"use client";

import React, { useState } from 'react';
import GraphData from "@/components/ecommerce/GraphData";
import SchemesBarChart from "@/components/ecommerce/SchemesBarChart";
import Showschemstable from "@/components/ecommerce/Showschemstable";
import DistrictMap from "@/components/ecommerce/DistrictMap";
import { FarmdersType } from "@/components/farmersdata/farmers";
import { Schemesdatas } from "@/components/schemesdata/schemes";
import { Taluka } from "@/components/Taluka/Taluka";
import { Village } from "@/components/Village/village";
import { Documents } from "@/components/Documentsdata/documents";

interface AllFarmersData {
  users: any[];
  schemes: any[];
  farmers: FarmdersType[];
  schemescrud: any[];
  schemessubcategory: any[];
  yearmaster: any[];
  documents: Documents[];
  taluka: Taluka[];
  villages: Village[];
}

interface Section32TabsProps {
  farmers: FarmdersType[];
  villages: Village[];
  talukas: Taluka[];
  schemes: Schemesdatas[];
  documents: Documents[];
  farmersData: AllFarmersData;
}

const Section32Tabs: React.FC<Section32TabsProps> = ({
  farmers,
  villages,
  talukas,
  schemes,
  documents,
  farmersData
}) => {
  const [activeSecondaryTab, setActiveSecondaryTab] = useState('taluka-survey');

  const secondaryTabs = [
    {
      id: 'taluka-survey',
      label: 'Taluka Wise Survey',
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Taluka Wise Survey By default open</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left side - List view */}
            <div className="space-y-4">
              {talukas.map((taluka) => {
                const farmersInTaluka = farmers.filter(f => f.taluka_id === taluka.taluka_id);
                const totalVillages = villages.filter(v => v.taluka_id === taluka.taluka_id).length;
                const completedVillages = farmersInTaluka.length;
                const percentage = totalVillages > 0 ? Math.round((completedVillages / totalVillages) * 100) : 0;
                
                return (
                  <div key={taluka.taluka_id} className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{taluka.name}</h4>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {completedVillages}/{totalVillages} ({percentage}%)
                          </p>
                        </div>
                      </div>
                      <button className="bg-red-500 text-white px-4 py-2 rounded text-sm">
                        Villages
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Right side - Map view */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-4">District Map</h4>
              <DistrictMap
                data={farmers}
                datavillage={villages}
                datataluka={talukas}
                dataschems={schemes}
                documents={documents}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'aadhaar-status',
      label: 'Aadhaar Status',
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Aadhaar Status of IFR Beneficiaries</h3>
          <GraphData farmersData={farmersData} />
        </div>
      )
    },
    {
      id: 'documents-availability',
      label: 'Availability of documents',
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Document Availability for IFR Holders</h3>
          <Showschemstable farmersData={farmersData} />
        </div>
      )
    },
    {
      id: 'scheme-wise',
      label: 'Scheme wise IFR holders',
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Scheme Wise IFR Holders</h3>
          <SchemesBarChart farmersData={farmersData} />
        </div>
      )
    },
    {
      id: 'general-info',
      label: 'General Information',
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">General Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="font-semibold text-gray-800 mb-4">System Overview</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Total IFR Holders:</strong> {farmers.length}</p>
                <p><strong>Total Schemes:</strong> {schemes.length}</p>
                <p><strong>Total Villages:</strong> {villages.length}</p>
                <p><strong>Total Talukas:</strong> {talukas.length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="font-semibold text-gray-800 mb-4">Document Status</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Total Documents:</strong> {documents.length}</p>
                <p><strong>Available Documents:</strong> {documents.filter(d => d.status === 'active').length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h4 className="font-semibold text-gray-800 mb-4">Recent Activity</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>System last updated: {new Date().toLocaleDateString()}</p>
                <p>Data synchronization: Active</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-full">
      {/* Section 3(2) Label */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Section 3(2)</h2>
      </div>
      
      {/* Secondary Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {secondaryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSecondaryTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeSecondaryTab === tab.id
                ? 'bg-white text-black border-2 border-gray-300 shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Secondary Tab Content */}
      <div className="w-full">
        {secondaryTabs.find(tab => tab.id === activeSecondaryTab)?.content}
      </div>
    </div>
  );
};

export default Section32Tabs;
