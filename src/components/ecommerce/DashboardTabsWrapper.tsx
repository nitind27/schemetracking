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

interface DashboardTabsWrapperProps {
  metrics: Metrics;
  farmersData: AllFarmersData;
}

const DashboardTabsWrapper: React.FC<DashboardTabsWrapperProps> = ({ metrics, farmersData }) => {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isTodaySurveyModalOpen, setIsTodaySurveyModalOpen] = useState(false);
  const [selectedTaluka, setSelectedTaluka] = useState<string>('');

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

  // Filter surveys by selected taluka
  const filteredTodaySurveys = selectedTaluka
    ? todaySurveys.filter(farmer => farmer.taluka_id === selectedTaluka)
    : todaySurveys;

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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span className="text-lg">Today&apos;s Surveys: {todaySurveyCount}</span>
        </button>
      </div>

      <TabView tabs={tabs} defaultTab="main-dashboard" />

      {/* Today's Survey Modal */}
      <Modal
        isOpen={isTodaySurveyModalOpen}
        onClose={() => setIsTodaySurveyModalOpen(false)}
        className="max-w-4xl"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            Today&apos;s Surveys ({filteredTodaySurveys.length}{selectedTaluka ? ` - Filtered` : ''})
          </h2>

          {/* Taluka Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              तालुका निवडा (Select Taluka):
            </label>
            <select
              value={selectedTaluka}
              onChange={(e) => setSelectedTaluka(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {talukaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredTodaySurveys.length > 0 ? (
              <div className="space-y-3">
                {filteredTodaySurveys.map((farmer, index) => (
                  <div key={farmer.farmer_id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                            #{index + 1}
                          </span>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {farmer.name || 'N/A'}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <div><strong>Village:</strong> {farmersData.villages.find(v => v.village_id === Number(farmer.village_id))?.name || 'N/A'}</div>
                          <div><strong>Taluka:</strong> {farmersData.taluka.find(t => t.taluka_id === Number(farmer.taluka_id))?.name || 'N/A'}</div>
                          <div><strong>Aadhaar:</strong> {farmer.aadhaar_no || 'N/A'}</div>
                          <div><strong>Contact:</strong> {farmer.contact_no || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <p className="text-lg">
                  {selectedTaluka ? 'या तालुक्यात आज कोणतेही सर्वेक्षण सापडले नाहीत' : 'आज कोणतेही सर्वेक्षण सापडले नाहीत'}
                </p>
                <p className="text-sm mt-2">
                  {selectedTaluka ? 'No surveys found for today in selected taluka' : 'No surveys found for today'}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setIsTodaySurveyModalOpen(false)}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardTabsWrapper;

