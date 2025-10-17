"use client";

import React, { useState, useMemo, useEffect } from 'react';
import TabView from "@/components/common/TabView";
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

interface IFRDashboardTabsProps {
  farmers: FarmdersType[];
  villages: Village[];
  talukas: Taluka[];
  schemes: Schemesdatas[];
  documents: Documents[];
  farmersData: AllFarmersData;
}

const IFRDashboardTabs: React.FC<IFRDashboardTabsProps> = ({
  farmers,
  villages,
  talukas,
  schemes,
  documents,
  farmersData
}) => {
  const [mounted, setMounted] = useState(false);

  // Fix hydration by ensuring component is mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate statistics for Taluka Wise Survey
  const talukaSurveyData = useMemo(() => {
    return talukas.map(taluka => {
      const farmersInTaluka = farmers.filter(f => f.taluka_id === taluka.taluka_id.toString());
      const villagesInTaluka = villages.filter(v => v.taluka_id === taluka.taluka_id.toString()); // Fixed: use === instead of ==
      const farmersWithAadhaar = farmersInTaluka.filter(f => f.aadhaar_no && f.aadhaar_no.trim() !== '');
      const farmersWithDocuments = farmersInTaluka.filter(f => f.documents && f.documents.trim() !== '');
      
      return {
        ...taluka,
        totalFarmers: farmersInTaluka.length,
        totalVillages: villagesInTaluka.length,
        farmersWithAadhaar: farmersWithAadhaar.length,
        farmersWithDocuments: farmersWithDocuments.length,
        aadhaarPercentage: farmersInTaluka.length > 0 ? Math.round((farmersWithAadhaar.length / farmersInTaluka.length) * 100) : 0,
        documentPercentage: farmersInTaluka.length > 0 ? Math.round((farmersWithDocuments.length / farmersInTaluka.length) * 100) : 0
      };
    });
  }, [talukas, farmers, villages]);

  // Calculate Aadhaar Status data
  const aadhaarStatusData = useMemo(() => {
    return talukas.map(taluka => {
      const farmersInTaluka = farmers.filter(f => f.taluka_id === taluka.taluka_id.toString());
      const withAadhaar = farmersInTaluka.filter(f => f.aadhaar_no && f.aadhaar_no.trim() !== '').length;
      const withoutAadhaar = farmersInTaluka.length - withAadhaar;
      
      return {
        taluka: taluka.name,
        total: farmersInTaluka.length,
        withAadhaar,
        withoutAadhaar,
        taluka_id: taluka.taluka_id
      };
    });
  }, [talukas, farmers]);

  // Calculate document availability data
  const documentAvailabilityData = useMemo(() => {
    return documents.map(doc => {
      const farmersWithDoc = farmers.filter(farmer => {
        if (!farmer.documents) return false;
        const docMap = parseFarmerDocuments(farmer.documents);
        return docMap[String(doc.id)] && docMap[String(doc.id)].available === 'Yes';
      });
      
      return {
        document: doc.document_name,
        has: farmersWithDoc.length,
        not: farmers.length - farmersWithDoc.length,
        id: doc.id
      };
    });
  }, [documents, farmers]);

  // Parse farmer documents helper function
  const parseFarmerDocuments = (docString: string | undefined): Record<string, { check: string, updation: string, available: string }> => {
    const result: Record<string, { check: string, updation: string, available: string }> = {};
    if (!docString) return result;
    docString.split('|').forEach(segment => {
      const [id, status] = segment.split('--');
      if (!id || !status) return;
      const [updation, check, available] = status.split('-');
      if (check && updation && available) {
        result[id.trim()] = {
          updation: updation.trim(),
          available: available.trim(),
          check: check.trim(),
        };
      }
    });
    return result;
  };

  // Calculate scheme wise data
  const schemeWiseData = useMemo(() => {
    const schemeMap = new Map();
    
    farmers.forEach(farmer => {
      if (farmer.schemes) {
        farmer.schemes.split(',').forEach(schemeId => {
          const id = schemeId.trim();
          if (id) {
            schemeMap.set(id, (schemeMap.get(id) || 0) + 1);
          }
        });
      }
    });

    return Array.from(schemeMap.entries()).map(([schemeId, count]) => {
      const scheme = schemes.find(s => s.scheme_id.toString() === schemeId);
      return {
        schemeName: scheme?.scheme_name || `Scheme ${schemeId}`,
        count: count as number,
        schemeId: schemeId
      };
    });
  }, [farmers, schemes]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "taluka-survey",
      label: "Taluka Wise Survey",
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Taluka Wise Survey Data</h3>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800">Total Talukas</h4>
                <p className="text-2xl font-bold text-blue-600">{talukas.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800">Total Farmers</h4>
                <p className="text-2xl font-bold text-green-600">{farmers.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-800">Total Villages</h4>
                <p className="text-2xl font-bold text-purple-600">{villages.length}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-800">Total Schemes</h4>
                <p className="text-2xl font-bold text-orange-600">{schemes.length}</p>
              </div>
            </div>

            {/* Taluka Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800">Taluka Details</h4>
                {talukaSurveyData.map((taluka) => (
                  <div key={taluka.taluka_id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-medium text-gray-800">{taluka.name}</h5>
                        <p className="text-sm text-gray-600">Taluka ID: {taluka.taluka_id}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {taluka.totalFarmers} Farmers
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Villages:</span>
                        <span className="font-medium">{taluka.totalVillages}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Aadhaar Coverage:</span>
                        <span className="font-medium">{taluka.aadhaarPercentage}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Document Coverage:</span>
                        <span className="font-medium">{taluka.documentPercentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Map View */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">District Map</h4>
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
        </div>
      )
    },
    {
      id: "aadhaar-status",
      label: "Aadhaar Status of IFR Beneficiaries Across Talukas",
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Aadhaar Status of IFR Beneficiaries Across Talukas</h3>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800">With Aadhaar</h4>
                <p className="text-2xl font-bold text-green-600">
                  {farmers.filter(f => f.aadhaar_no && f.aadhaar_no.trim() !== '').length}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-800">Without Aadhaar</h4>
                <p className="text-2xl font-bold text-red-600">
                  {farmers.filter(f => !f.aadhaar_no || f.aadhaar_no.trim() === '').length}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800">Total Farmers</h4>
                <p className="text-2xl font-bold text-blue-600">{farmers.length}</p>
              </div>
            </div>

            {/* Chart Component */}
            <div className="mb-6">
              <GraphData farmersData={farmersData} />
            </div>

            {/* Detailed Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taluka</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Farmers</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">With Aadhaar</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Without Aadhaar</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {aadhaarStatusData.map((item) => (
                    <tr key={item.taluka_id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.taluka}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.total}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">{item.withAadhaar}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">{item.withoutAadhaar}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.total > 0 ? Math.round((item.withAadhaar / item.total) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "documents-availability",
      label: "Availability of each documents for IFR holders",
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Availability of Documents for IFR Holders</h3>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800">Total Documents</h4>
                <p className="text-2xl font-bold text-blue-600">{documents.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800">Active Documents</h4>
                <p className="text-2xl font-bold text-green-600">
                  {documents.filter(d => d.status === 'active').length}
                </p>
              </div>
            </div>

            {/* Chart Component */}
            <div className="mb-6">
              <Showschemstable farmersData={farmersData} />
            </div>

            {/* Document Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentAvailabilityData.map((doc) => (
                <div key={doc.id} className="bg-gray-50 p-4 rounded-lg border">
                  <h5 className="font-medium text-gray-800 mb-3">{doc.document}</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Available:</span>
                      <span className="font-medium">{doc.has}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Not Available:</span>
                      <span className="font-medium">{doc.not}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${farmers.length > 0 ? (doc.has / farmers.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {farmers.length > 0 ? Math.round((doc.has / farmers.length) * 100) : 0}% coverage
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: "scheme-wise",
      label: "Scheme wise IFR holders",
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Scheme Wise IFR Holders</h3>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800">Total Schemes</h4>
                <p className="text-2xl font-bold text-blue-600">{schemes.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800">Active Schemes</h4>
                <p className="text-2xl font-bold text-green-600">
                  {schemes.filter(s => s.status === 'active').length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-800">Total Beneficiaries</h4>
                <p className="text-2xl font-bold text-purple-600">{farmers.length}</p>
              </div>
            </div>

            {/* Chart Component */}
            <div className="mb-6">
              <SchemesBarChart farmersData={farmersData} />
            </div>

            {/* Scheme Details */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheme Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beneficiaries</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schemeWiseData.map((scheme) => (
                    <tr key={scheme.schemeId}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{scheme.schemeName}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{scheme.count}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {farmers.length > 0 ? Math.round((scheme.count / farmers.length) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "general-info",
      label: "General Information",
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">General Information</h3>
            
            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-4">IFR Holders</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Total:</strong> {farmers.length}</p>
                  <p><strong>With Aadhaar:</strong> {farmers.filter(f => f.aadhaar_no && f.aadhaar_no.trim() !== '').length}</p>
                  <p><strong>With Documents:</strong> {farmers.filter(f => f.documents && f.documents.trim() !== '').length}</p>
                </div>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-4">Schemes</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Total:</strong> {schemes.length}</p>
                  <p><strong>Active:</strong> {schemes.filter(s => s.status === 'active').length}</p>
                  <p><strong>Inactive:</strong> {schemes.filter(s => s.status === 'inactive').length}</p>
                </div>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-4">Geographic Data</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Talukas:</strong> {talukas.length}</p>
                  <p><strong>Villages:</strong> {villages.length}</p>
                  <p><strong>Avg Villages/Taluka:</strong> {talukas.length > 0 ? Math.round(villages.length / talukas.length) : 0}</p>
                </div>
              </div>
              
              <div className="bg-orange-50 p-6 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-4">Documents</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Total:</strong> {documents.length}</p>
                  <p><strong>Active:</strong> {documents.filter(d => d.status === 'active').length}</p>
                  <p><strong>Inactive:</strong> {documents.filter(d => d.status === 'inactive').length}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity & System Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-4">System Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Data Synchronization</span>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium">
                      {mounted ? new Date().toLocaleDateString() : 'Loading...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database Status</span>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Connected
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-4">Coverage Statistics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Aadhaar Coverage</span>
                    <span className="text-sm font-medium">
                      {farmers.length > 0 ? Math.round((farmers.filter(f => f.aadhaar_no && f.aadhaar_no.trim() !== '').length / farmers.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Document Coverage</span>
                    <span className="text-sm font-medium">
                      {farmers.length > 0 ? Math.round((farmers.filter(f => f.documents && f.documents.trim() !== '').length / farmers.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Scheme Participation</span>
                    <span className="text-sm font-medium">
                      {farmers.length > 0 ? Math.round((farmers.filter(f => f.schemes && f.schemes.trim() !== '').length / farmers.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-full">
      <TabView tabs={tabs} defaultTab="taluka-survey" />
    </div>
  );
};

export default IFRDashboardTabs;