"use client";

import React, { useState } from "react";

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
const TodaySurveyComponent: React.FC<DashboardTabsWrapperProps> = ({ metrics, farmersData }) => {

  const [showTalukaList, setShowTalukaList] = useState(false);
  const [selectedTalukaData, setSelectedTalukaData] = useState<TalukaSurveyData | null>(null);
  const [isTalukaDetailModalOpen, setIsTalukaDetailModalOpen] = useState(false);
  // Default to current date (yyyy-MM-dd for input[type="date"])
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));

  // Filter surveys by selected date
  const getSurveysByDate = (dateStr: string) => {

    // Get user information from sessionStorage for filtering
    const userCategoryId = sessionStorage.getItem('category_id');
    const userTalukaId = sessionStorage.getItem('taluka_id');

    // Define allowed taluka IDs for category_id 4 and 8
    const allowedTalukaIdsCategory4 = ['1', '2', '3'];
    const allowedTalukaIdsCategory8 = ['4', '5', '7'];

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

      // If user is category_id = 4, only show surveys from talukas 1, 2, 3
      if (userCategoryId === '4') {
        return allowedTalukaIdsCategory4.includes(String(farmer.taluka_id));
      }

      // If user is category_id = 8, only show surveys from talukas 4, 5, 7
      if (userCategoryId === '8') {
        return allowedTalukaIdsCategory8.includes(String(farmer.taluka_id));
      }

      // For all other users, show all surveys
      return true;
    });
  };

  const filteredSurveys = getSurveysByDate(selectedDate);
  const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");
  // const todaySurveyCount = filteredSurveys.length;

  // Group today's surveys by taluka
  const getTalukaWiseSurveys = (): TalukaSurveyData[] => {
    const talukaMap = new Map();

    // Get user information from sessionStorage
    const userCategoryId = sessionStorage.getItem('category_id');
    const userTalukaId = sessionStorage.getItem('taluka_id');

    // Define allowed taluka IDs for category_id 4 and 8
    const allowedTalukaIdsCategory4 = ['1', '2', '3'];
    const allowedTalukaIdsCategory8 = ['4', '5', '7'];

    // Filter talukas based on user category
    let talukasToShow = farmersData.taluka;
    
    if (userCategoryId === '37' && userTalukaId) {
      // If user is PESA Coordinator (category_id = 37), only show their assigned taluka
      talukasToShow = farmersData.taluka.filter(taluka => taluka.taluka_id.toString() === userTalukaId);
    } else if (userCategoryId === '4') {
      // If user is category_id = 4, only show talukas 1, 2, 3
      talukasToShow = farmersData.taluka.filter(taluka => allowedTalukaIdsCategory4.includes(taluka.taluka_id.toString()));
    } else if (userCategoryId === '8') {
      // If user is category_id = 8, only show talukas 4, 5, 7
      talukasToShow = farmersData.taluka.filter(taluka => allowedTalukaIdsCategory8.includes(taluka.taluka_id.toString()));
    }

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
    filteredSurveys.forEach(farmer => {
      const talukaId = farmer.taluka_id?.toString() || '';
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

  return (
    <div className="w-full">
      {/* One card: date picker + label + count + up/down arrow */}
      <div className="w-full mb-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowTalukaList(!showTalukaList)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setShowTalukaList(!showTalukaList)}
          className="w-full bg-white hover:bg-gray-50 text-black font-semibold py-3 sm:py-4 px-4 sm:px-6 rounded-lg shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 ease-in-out transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            {/* Date picker - click opens native picker, does not toggle expand */}
          {/* Date picker - click opens native picker, does not toggle expand */}
<input
  type="date"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
  onClick={(e) => {
    e.stopPropagation(); // पैरेंट के टॉगल को रोकता है
    e.currentTarget.showPicker(); // नेटिव डेट पिकर को फोर्स करता है
  }}
  max={format(new Date(), "yyyy-MM-dd")}
  className="flex-shrink-0 w-[130px] sm:w-[140px] px-2 py-1.5 sm:px-3 sm:py-2 rounded-md border-2 border-gray-200 bg-white text-gray-800 text-xs sm:text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none cursor-pointer"
  title="तारीख निवडा"
/>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 min-w-0">
              <span className="text-sm sm:text-base font-medium text-gray-700 truncate">
                {isToday ? (
                  <>
                    <span className="hidden sm:inline">आजचे सर्वेक्षण: </span>
                    <span className="sm:hidden">आजचे सर्वेक्षण: </span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">तारखेनुसार सर्वेक्षण: </span>
                    <span className="sm:hidden">तारखेनुसार: </span>
                  </>
                )}
              </span>
              <span className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-blue-600 text-white whitespace-nowrap">
                {filteredSurveys.length}
              </span>
            </div>
          </div>
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 transition-all duration-300 ease-in-out transform flex-shrink-0 ${showTalukaList ? "rotate-180" : "rotate-0"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Taluka List - Expandable */}
        <div 
          className={`mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden transition-all duration-500 ease-in-out ${
            showTalukaList 
              ? 'max-h-[1000px] opacity-100 transform translate-y-0' 
              : 'max-h-0 opacity-0 transform -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold mb-3 text-gray-800">
              <span className="hidden sm:inline">तालुका नुसार सर्वेक्षण (Taluka-wise Surveys)</span>
              <span className="sm:hidden">तालुका नुसार</span>
            </h3>
            <div className="max-h-96 overflow-y-auto">
              {talukaWiseSurveys.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <p className="text-base sm:text-lg">कोणतेही तालुका सापडले नाहीत</p>
                  <p className="text-xs sm:text-sm mt-2">No talukas found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                {talukaWiseSurveys.map((talukaData, index) => (
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
                    style={{
                      transitionDelay: showTalukaList ? `${index * 50}ms` : '0ms',
                      opacity: showTalukaList ? 1 : 0,
                      transform: showTalukaList
                        ? 'translateY(0) scale(1)'
                        : 'translateY(20px) scale(0.95)',
                    }}
                    className={`p-2 sm:p-3 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                      talukaData.count > 0
                        ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 hover:shadow-lg cursor-pointer'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                  >
                    {/* INLINE FLEX CENTER */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 md:gap-3">
                      <h4 className="font-semibold text-gray-900 text-xs sm:text-sm text-center truncate w-full">
                        {talukaData.taluka_name || 'N/A'}
                      </h4>
              
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap ${
                          talukaData.count > 0
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {talukaData.count || 0}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              
              )}
            </div>
          </div>
        </div>
      </div>

   
      {/* Individual Taluka Detail Modal */}
      <Modal
        isOpen={isTalukaDetailModalOpen}
        onClose={() => setIsTalukaDetailModalOpen(false)}
        className="max-w-[95vw] sm:max-w-3xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-2 sm:mx-4"
      >
        <div className="p-3 sm:p-4 md:p-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6 text-gray-800 dark:text-white break-words">
            {selectedTalukaData?.taluka_name} - <span className="hidden sm:inline">सर्वेक्षण तपशील</span><span className="sm:hidden">तपशील</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 break-words">
            {selectedTalukaData?.taluka_name} - Survey Details ({selectedTalukaData?.count} surveys)
          </p>

          <div className="max-h-[50vh] sm:max-h-[60vh] md:max-h-[400px] overflow-y-auto overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
            {selectedTalukaData && selectedTalukaData.surveys.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 min-w-full">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="bg-blue-50 dark:bg-gray-700 sticky top-0 whitespace-nowrap">
                      <tr>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs">#</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs">नाव</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs hidden sm:table-cell">Farmer ID</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs hidden md:table-cell">आदिवासी</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs">गाव</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs hidden lg:table-cell">गट क्रमांक</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs hidden xl:table-cell">वनक्षेत्र</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs hidden xl:table-cell">निवास सेटी</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs hidden lg:table-cell">आधार</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs hidden xl:table-cell">संपर्क</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs hidden xl:table-cell">ईमेल</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs hidden md:table-cell">किसान ID</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs hidden lg:table-cell">लिंग</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs hidden xl:table-cell">अपडेट</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs hidden xl:table-cell">योजना</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTalukaData.surveys.map((farmer, index) => {
                        // Parse farmer_record string
                        const farmerRecord = farmer.farmer_record ? farmer.farmer_record.split('|') : [];
                        
                        // Function to mask Aadhaar number (first 8 digits as *, last 4 digits as numbers)
                        const maskAadhaar = (aadhaar: string): string => {
                          if (!aadhaar || aadhaar.trim() === '' || aadhaar === 'N/A') {
                            return 'N/A';
                          }
                          const cleaned = aadhaar.trim().replace(/\s+/g, '');
                          if (cleaned.length !== 12 || !/^\d+$/.test(cleaned)) {
                            return aadhaar; // Return original if not 12 digits
                          }
                          return '*'.repeat(8) + cleaned.slice(-4);
                        };

                        return (
                          <tr
                            key={farmer.farmer_id}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors whitespace-nowrap"
                          >
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-900 dark:text-white font-medium">{index + 1}</td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-900 dark:text-white font-medium max-w-[120px] sm:max-w-none truncate">
                              {(farmerRecord.length > 0 ? farmerRecord[0] : '').trim() || 'N/A'}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                              {(farmerRecord.length > 15 ? farmerRecord[15] : '').trim() || farmer.farmer_id || 'N/A'}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                              {(farmerRecord.length > 1 ? farmerRecord[1] : '').trim() || 'N/A'}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 max-w-[100px] sm:max-w-none truncate">
                              {(() => {
                                const village = farmersData.villages.find(v => v.village_id.toString() === farmer.village_id);
                                return village ? village.marathi_name : 'N/A';
                              })()}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                              {(farmerRecord.length > 2 ? farmerRecord[2] : '').trim() || 'N/A'}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 hidden xl:table-cell">
                              {(farmerRecord.length > 3 ? farmerRecord[3] : '').trim() || 'N/A'}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 hidden xl:table-cell">
                              {(farmerRecord.length > 4 ? farmerRecord[4] : '').trim() || 'N/A'}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                              {maskAadhaar((farmerRecord.length > 5 ? farmerRecord[5] : '').trim() || 'N/A')}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 hidden xl:table-cell">
                              {(farmerRecord.length > 6 ? farmerRecord[6] : '').trim() || 'N/A'}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 hidden xl:table-cell max-w-[150px] truncate">
                              {(farmerRecord.length > 7 ? farmerRecord[7] : '').trim() || 'N/A'}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                              {(farmerRecord.length > 8 ? farmerRecord[8] : '').trim() || 'N/A'}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                              {(farmerRecord.length > 10 ? farmerRecord[10] : '').trim() || 'N/A'}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs max-w-[100px] xl:max-w-xs truncate hidden xl:table-cell" title={(farmerRecord.length > 17 ? farmerRecord[17] : '').trim() || ''}>
                              {(farmerRecord.length > 17 ? farmerRecord[17] : '').trim() || 'N/A'}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs max-w-[100px] xl:max-w-xs truncate hidden xl:table-cell" title={(farmerRecord.length > 14 ? farmerRecord[14] : '').trim() || ''}>
                              {(farmerRecord.length > 14 ? farmerRecord[14] : '').trim() || 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <p className="text-lg sm:text-xl font-medium">कोणतेही सर्वेक्षण सापडले नाहीत</p>
                <p className="text-xs sm:text-sm mt-2">No surveys found</p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4 sm:mt-6">
            <button
              onClick={() => setIsTalukaDetailModalOpen(false)}
              className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 w-full sm:w-auto"
            >
              <span className="hidden sm:inline">बंद करा (Close)</span>
              <span className="sm:hidden">बंद करा</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TodaySurveyComponent;

