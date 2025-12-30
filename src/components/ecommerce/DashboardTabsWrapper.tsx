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
  const [isTodaySurveyModalOpen, setIsTodaySurveyModalOpen] = useState(false);

  useEffect(() => {
    const category_id = sessionStorage.getItem('category_id');
    setCategoryId(category_id);
  }, []);

  // Filter today's surveys
  const getTodaySurveys = () => {
    const today = new Date();
    const dateStr = format(today, 'yyyy-MM-dd');

    return metrics.farmers.filter(farmer => {
      if (!farmer.update_record) return false;

      // Split the update_record by pipe and check each segment
      return farmer.update_record.split('|').some(segment => {
        // Extract the date part from each segment
        const datePart = segment.split('/')[1];
        return datePart === dateStr;
      });
    });
  };

  const todaySurveys = getTodaySurveys();
  const todaySurveyCount = todaySurveys.length;

  // Group today's surveys by taluka
  const getTalukaWiseSurveys = (): TalukaSurveyData[] => {
    const talukaMap = new Map();

    // Initialize all talukas with count 0
    farmersData.taluka.forEach(taluka => {
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


  // Create taluka options for dropdown
  const talukaOptions = [
    { label: 'सर्व तालुका (All Talukas)', value: '' },
    ...farmersData.taluka.map(taluka => ({
      label: taluka.name,
      value: taluka.taluka_id.toString()
    }))
  ];

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
          onClick={() => setIsTodaySurveyModalOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-colors duration-200"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="text-lg font-bold">आजचे सर्वेक्षण: {todaySurveyCount}</span>
            </div>

            {/* Taluka-wise breakdown */}
            <div className="w-full max-h-20 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                {talukaWiseSurveys.map((talukaData) => (
                  <div
                    key={talukaData.taluka_id}
                    className={`px-2 py-1 rounded text-xs font-medium text-center ${
                      talukaData.count > 0
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-400 text-gray-200'
                    }`}
                    title={`${talukaData.taluka_name}: ${talukaData.count} surveys`}
                  >
                    {talukaData.taluka_name}: {talukaData.count}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs opacity-90 mt-1">
              तालुका नुसार सर्वेक्षण संख्या | Taluka-wise Survey Count
            </div>
          </div>
        </button>
      </div>

      <TabView tabs={tabs} defaultTab="main-dashboard" />

      {/* Today's Survey Modal */}
      <Modal
        isOpen={isTodaySurveyModalOpen}
        onClose={() => setIsTodaySurveyModalOpen(false)}
        className="max-w-6xl"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
            आजचे सर्वेक्षण - तालुका नुसार ({todaySurveyCount})
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Today&apos;s Surveys - Taluka-wise Breakdown
          </p>

          <div className="max-h-96 overflow-y-auto">
            {talukaWiseSurveys.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {talukaWiseSurveys.map((talukaData) => (
                  <div
                    key={talukaData.taluka_id}
                    className={`bg-white dark:bg-gray-800 p-4 rounded-lg border-2 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                      talukaData.count > 0
                        ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {talukaData.taluka_name}
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        talukaData.count > 0
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {talukaData.count}
                      </div>
                    </div>

                    {talukaData.count > 0 ? (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>{talukaData.count} सर्वेक्षण पूर्ण</span>
                          </div>
                          <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                            {talukaData.count} surveys completed
                          </div>
                        </div>

                        {/* Show top 3 farmer names if any */}
                        {talukaData.surveys.slice(0, 3).map((farmer, idx) => (
                          <div key={farmer.farmer_id} className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            • {farmer.name || 'N/A'}
                          </div>
                        ))}
                        {talukaData.count > 3 && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            आणि {talukaData.count - 3} अधिक... (and {talukaData.count - 3} more...)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 dark:text-gray-500">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span>आज कोणतेही सर्वेक्षण नाही</span>
                        </div>
                        <div className="text-xs mt-1">No surveys today</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <p className="text-xl font-medium">आज कोणतेही सर्वेक्षण सापडले नाहीत</p>
                <p className="text-sm mt-2">No surveys found for today</p>
              </div>
            )}
          </div>

          {/* Summary Statistics */}
          <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">सारांश (Summary)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {talukaWiseSurveys.filter(t => t.count > 0).length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">सक्रिय तालुका</div>
                <div className="text-xs text-gray-500">Active Talukas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {todaySurveyCount}
                </div>
                <div className="text-gray-600 dark:text-gray-400">एकूण सर्वेक्षण</div>
                <div className="text-xs text-gray-500">Total Surveys</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {talukaWiseSurveys.length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">एकूण तालुका</div>
                <div className="text-xs text-gray-500">Total Talukas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {Math.round((talukaWiseSurveys.filter(t => t.count > 0).length / talukaWiseSurveys.length) * 100)}%
                </div>
                <div className="text-gray-600 dark:text-gray-400">कवरेज</div>
                <div className="text-xs text-gray-500">Coverage</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setIsTodaySurveyModalOpen(false)}
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

