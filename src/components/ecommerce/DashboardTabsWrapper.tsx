"use client";

import React, { useState, useEffect } from "react";
import TabView from "@/components/common/TabView";
import { Suspense } from "react";
import Loader from "@/common/Loader";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import DashboardTalukatabview from "@/components/ecommerce/DashboardTalukatabview";
import { CFREcommer } from "@/components/ecommerce/CFREcommer";
import Section32Tabs from "@/components/common/Section32Tabs";
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
import { Modal } from "@/components/ui/modal";
import { format } from 'date-fns';

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

interface TalukaSurveyData {
  taluka_id: number;
  taluka_name: string;
  count: number;
  surveys: FarmdersType[];
}

interface DashboardTabsWrapperProps {
  metrics: Metrics;
  farmersData: AllFarmersData;
}

const DashboardTabsWrapper: React.FC<DashboardTabsWrapperProps> = ({ metrics, farmersData }) => {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [showTalukaList, setShowTalukaList] = useState(false);
  const [selectedTalukaData, setSelectedTalukaData] = useState<TalukaSurveyData | null>(null);
  const [isTalukaDetailModalOpen, setIsTalukaDetailModalOpen] = useState(false);

  useEffect(() => {
    const category_id = sessionStorage.getItem('category_id');
    setCategoryId(category_id);
  }, []);

  // Filter today's surveys
  const getTodaySurveys = () => {
    const today = new Date();
    const dateStr = format(today, 'yyyy-MM-dd');

    // Get user information from sessionStorage for filtering
    const userCategoryId = sessionStorage.getItem('category_id');
    const userTalukaId = sessionStorage.getItem('taluka_id');

    return metrics.farmers.filter(farmer => {
      if (!farmer.update_record) return false;

      // Split the update_record by pipe and check each segment
      const hasTodaySurvey = farmer.update_record.split('|').some(segment => {
        // Extract the date part from each segment
        const datePart = segment.split('/')[1];
        return datePart === dateStr;
      });

      if (!hasTodaySurvey) return false;

      // If user is PESA Coordinator (category_id = 37), only show surveys from their assigned taluka
      if (userCategoryId === '37' && userTalukaId) {
        return farmer.taluka_id === userTalukaId;
      }

      // For all other users, show all surveys
      return true;
    });
  };

  const todaySurveys = getTodaySurveys();
  const todaySurveyCount = todaySurveys.length;

  // Group today's surveys by taluka
  const getTalukaWiseSurveys = (): TalukaSurveyData[] => {
    const talukaMap = new Map();

    // Get user information from sessionStorage
    const userCategoryId = sessionStorage.getItem('category_id');
    const userTalukaId = sessionStorage.getItem('taluka_id');

    // If user is PESA Coordinator (category_id = 37), only show their assigned taluka
    // Otherwise, show all talukas
    const talukasToShow = userCategoryId === '37' && userTalukaId
      ? farmersData.taluka.filter(taluka => taluka.taluka_id.toString() === userTalukaId)
      : farmersData.taluka;

    // Initialize talukas with count 0
    talukasToShow.forEach(taluka => {
      talukaMap.set(taluka.taluka_id.toString(), {
        taluka_id: taluka.taluka_id,
        taluka_name: taluka.name,
        count: 0,
        surveys: []
      });
    });

    // Count surveys for each taluka
    todaySurveys.forEach(farmer => {
      const talukaId = farmer.taluka_id;
      if (talukaMap.has(talukaId)) {
        const talukaData = talukaMap.get(talukaId);
        talukaData.count += 1;
        talukaData.surveys.push(farmer);
      }
    });

    // Convert to array and sort by count (descending)
    return Array.from(talukaMap.values()).sort((a, b) => b.count - a.count);
  };

  const talukaWiseSurveys: TalukaSurveyData[] = getTalukaWiseSurveys();



  // Main Dashboard Content Component
  const MainDashboardContent = () => (
    <div className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-2 xl:col-span-7">
        <Suspense fallback={<Loader />}>
          <EcommerceMetrics metrics={metrics} />
          <DashboardTalukatabview farmersData={farmersData} />
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

  // For PESA Coordinator (category_id = 37), show only Main Dashboard
  const isPESACoordinator = categoryId === "37";

  const allTabs = [
    {
      id: "main-dashboard",
      label: "IFR Dashboard",
      content: <MainDashboardContent />
    },
    {
      id: "cfr-dashboard", 
      label: "CFR Dashboard",
      content: <CFRDashboardContent />
    },
    {
      id: "notification",
      label: "Section 3(2)",
      content: <div className="grid grid-cols-6 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
        <Section32Tabs />
        </div>
      </div>
    }
  ];

  // Filter tabs for PESA Coordinator - show only main dashboard
  const tabs = isPESACoordinator 
    ? allTabs.filter(tab => tab.id === "main-dashboard")
    : allTabs;

  return (
    <div className="w-full">
      {/* Today's Survey Count Button */}
      <div className="w-full mb-4">
        <button
          onClick={() => setShowTalukaList(!showTalukaList)}
          className="w-full bg-white hover:bg-gray-50 text-black font-semibold py-4 px-6 rounded-lg shadow-lg border-2 border-gray-200 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="text-lg font-bold">आजचे सर्वेक्षण: {todaySurveyCount}</span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${showTalukaList ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Taluka List - Expandable */}
        {showTalukaList && (
          <div className="mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">तालुका नुसार सर्वेक्षण (Taluka-wise Surveys)</h3>
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {talukaWiseSurveys.map((talukaData) => (
                  <button
                    key={talukaData.taluka_id}
                    onClick={() => {
                      if (talukaData.count > 0) {
                        setSelectedTalukaData(talukaData);
                        setIsTalukaDetailModalOpen(true);
                        setShowTalukaList(false);
                      }
                    }}
                    disabled={talukaData.count === 0}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      talukaData.count > 0
                        ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 hover:shadow-md cursor-pointer'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 text-base">
                        {talukaData.taluka_name}
                      </h4>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        talukaData.count > 0
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {talukaData.count}
                      </div>
                    </div>
                    {talukaData.count > 0 && (
                      <p className="text-xs text-gray-600 mt-2">
                        क्लिक करा तपशील पहाण्यासाठी (Click to view details)
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <TabView tabs={tabs} defaultTab="main-dashboard" />

      {/* Individual Taluka Detail Modal */}
      <Modal
        isOpen={isTalukaDetailModalOpen}
        onClose={() => setIsTalukaDetailModalOpen(false)}
        className="max-w-7xl"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
            {selectedTalukaData?.taluka_name} - सर्वेक्षण तपशील
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {selectedTalukaData?.taluka_name} - Survey Details ({selectedTalukaData?.count} surveys)
          </p>

          <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
            {selectedTalukaData && selectedTalukaData.surveys.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm text-left">
                  <thead className="bg-blue-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">#</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">नाव (Name)</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">Farmer ID</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">आदिवासी</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">गाव</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">गट क्रमांक</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">वनक्षेत्र</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">निवास सेटी</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">आधार क्रमांक</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">संपर्क क्रमांक</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">ईमेल</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">किसान ID</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">लिंग</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">अपडेट रेकॉर्ड</th>
                      <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">योजना</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTalukaData.surveys.map((farmer, index) => {
                      // Parse farmer_record string
                      const farmerRecord = farmer.farmer_record ? farmer.farmer_record.split('|') : [];

                      return (
                        <tr
                          key={farmer.farmer_id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{index + 1}</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                            {(farmerRecord.length > 0 ? farmerRecord[0] : '').trim() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {(farmerRecord.length > 15 ? farmerRecord[15] : '').trim() || farmer.farmer_id || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {(farmerRecord.length > 1 ? farmerRecord[1] : '').trim() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {(farmerRecord.length > 13 ? farmerRecord[13] : '').trim() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {(farmerRecord.length > 2 ? farmerRecord[2] : '').trim() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {(farmerRecord.length > 3 ? farmerRecord[3] : '').trim() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {(farmerRecord.length > 4 ? farmerRecord[4] : '').trim() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {(farmerRecord.length > 5 ? farmerRecord[5] : '').trim() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {(farmerRecord.length > 6 ? farmerRecord[6] : '').trim() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {(farmerRecord.length > 7 ? farmerRecord[7] : '').trim() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {(farmerRecord.length > 8 ? farmerRecord[8] : '').trim() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {(farmerRecord.length > 10 ? farmerRecord[10] : '').trim() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs max-w-xs truncate" title={(farmerRecord.length > 17 ? farmerRecord[17] : '').trim() || ''}>
                            {(farmerRecord.length > 17 ? farmerRecord[17] : '').trim() || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs max-w-xs truncate" title={(farmerRecord.length > 14 ? farmerRecord[14] : '').trim() || ''}>
                            {(farmerRecord.length > 14 ? farmerRecord[14] : '').trim() || 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <p className="text-xl font-medium">कोणतेही सर्वेक्षण सापडले नाहीत</p>
                <p className="text-sm mt-2">No surveys found</p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setIsTalukaDetailModalOpen(false)}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              बंद करा (Close)
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardTabsWrapper;

