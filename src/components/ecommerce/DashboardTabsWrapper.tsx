"use client";

import React, { useState, useEffect, useCallback } from "react";
import TabView from "@/components/common/TabView";
import { Suspense } from "react";
import Loader from "@/common/Loader";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import DashboardTalukatabview from "@/components/ecommerce/DashboardTalukatabview";
import { CFREcommer } from "@/components/ecommerce/CFREcommer";
import Section32Tabs from "@/components/common/Section32Tabs";
import Category32Dashboard from "@/components/common/Category32Dashboard";
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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion } from 'framer-motion';
import DistrictSummaryRibbon from './DistrictSummaryRibbon';
import EnhancedKPICards from './EnhancedKPICards';
import AdvancedAnalytics from './AdvancedAnalytics';
import AlertsSection from './AlertsSection';
import PendingApprovalsSection from './PendingApprovalsSection';
import RecentlyUpdatedRecords from './RecentlyUpdatedRecords';
import PerformanceScorecard from './PerformanceScorecard';

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

interface Proposal {
  proposal_id?: number;
  proposal_category_id?: number;
  land_details?: string;
  taluka_id?: number;
  taluka_name?: string;
  village_id?: number;
  village_name?: string;
  gp_name?: string;
  user_name?: string;
  beneficiaries?: string;
  number_of_tree?: number | string;
  work_status?: string;
  forward_to?: string;
  user_category_id?: number;
  remarks?: string;
  pdf?: string;
  supporting_map_doc?: string;
  created_at?: string;
  updated_at?: string;
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

      // If user_category_id = 4, only show surveys from talukas 1, 2, 3
      if (userCategoryId === '4') {
        const allowedTalukaIds = ['1', '2', '3'];
        return allowedTalukaIds.includes(String(farmer.taluka_id));
      }

      // If user_category_id = 8, only show surveys from talukas 4, 5, 7
      if (userCategoryId === '8') {
        const allowedTalukaIds = ['4', '5', '7'];
        return allowedTalukaIds.includes(String(farmer.taluka_id));
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
    // If user_category_id = 4, only show talukas 1, 2, 3
    // If user_category_id = 8, only show talukas 4, 5, 7
    // Otherwise, show all talukas
    const allowedTalukaIdsCategory4 = ['1', '2', '3'];
    const allowedTalukaIdsCategory8 = ['4', '5', '7'];
    let talukasToShow = farmersData.taluka;
    
    if (userCategoryId === '37' && userTalukaId) {
      talukasToShow = farmersData.taluka.filter(taluka => taluka.taluka_id.toString() === userTalukaId);
    } else if (userCategoryId === '4') {
      talukasToShow = farmersData.taluka.filter(taluka => allowedTalukaIdsCategory4.includes(taluka.taluka_id.toString()));
    } else if (userCategoryId === '8') {
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
    todaySurveys.forEach(farmer => {
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

  // Death IFR Holder Dashboard Component
  const DeathIFRHolderDashboard = ({ farmersData }: { farmersData: AllFarmersData }) => {
    const [filteredFarmers, setFilteredFarmers] = useState<FarmdersType[]>([]);
    const [selectedTaluka, setSelectedTaluka] = useState<string>('all');
    const [selectedVillage, setSelectedVillage] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(true);

    // Get user category for filtering
    const userCategoryId = sessionStorage.getItem('category_id');
    const allowedTalukaIdsCategory4 = ['1', '2', '3'];
    const allowedTalukaIdsCategory8 = ['4', '5', '7'];

    const applyFilters = useCallback(() => {
      let filtered = farmersData.farmers.filter(farmer => {
        // Check if farmer_record[20] exists and equals "होय"
        const farmerRecord = farmer.farmer_record ? farmer.farmer_record.split('|') : [];
        const deathIFRHolder = farmerRecord.length > 20 ? farmerRecord[20]?.trim() : '';
        if (deathIFRHolder !== 'होय') return false;

        // If user_category_id = 4, only show farmers from talukas 1, 2, 3
        if (userCategoryId === '4') {
          return allowedTalukaIdsCategory4.includes(String(farmer.taluka_id));
        }

        // If user_category_id = 8, only show farmers from talukas 4, 5, 7
        if (userCategoryId === '8') {
          return allowedTalukaIdsCategory8.includes(String(farmer.taluka_id));
        }

        return true;
      });

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(farmer => {
          const farmerRecord = farmer.farmer_record ? farmer.farmer_record.split('|') : [];
          return (
            (farmerRecord.length > 0 ? farmerRecord[0] : '').toLowerCase().includes(query) ||
            farmer.name?.toLowerCase().includes(query) ||
            farmer.farmer_id?.toString().includes(query)
          );
        });
      }

      // Taluka filter
      if (selectedTaluka !== 'all') {
        filtered = filtered.filter(farmer => farmer.taluka_id === selectedTaluka);
      }

      // Village filter
      if (selectedVillage !== 'all') {
        filtered = filtered.filter(farmer => farmer.village_id === selectedVillage);
      }

      setFilteredFarmers(filtered);
    }, [farmersData.farmers, searchQuery, selectedTaluka, selectedVillage, userCategoryId]);

    useEffect(() => {
      applyFilters();
    }, [applyFilters]);

    // Get unique talukas, villages, and gram panchayats for filters
    const uniqueTalukas = Array.from(new Set(
      farmersData.farmers
        .filter(farmer => {
          const farmerRecord = farmer.farmer_record ? farmer.farmer_record.split('|') : [];
          const isDeathIFRHolder = farmerRecord.length > 20 && farmerRecord[20]?.trim() === 'होय';
          // If user_category_id = 4, only include talukas 1, 2, 3
          if (userCategoryId === '4') {
            return isDeathIFRHolder && allowedTalukaIdsCategory4.includes(String(farmer.taluka_id));
          }
          // If user_category_id = 8, only include talukas 4, 5, 7
          if (userCategoryId === '8') {
            return isDeathIFRHolder && allowedTalukaIdsCategory8.includes(String(farmer.taluka_id));
          }
          return isDeathIFRHolder;
        })
        .map(farmer => ({ id: farmer.taluka_id, name: farmersData.taluka.find(t => t.taluka_id.toString() === farmer.taluka_id)?.name }))
        .filter(t => t.id && t.name)
    )).map((t, i, arr) => arr.findIndex(x => x.id === t.id) === i ? t : null)
      .filter(Boolean) as { id: string; name: string }[];

    const uniqueVillages = Array.from(new Set(
      farmersData.farmers
        .filter(farmer => {
          const farmerRecord = farmer.farmer_record ? farmer.farmer_record.split('|') : [];
          return farmerRecord.length > 20 && farmerRecord[20]?.trim() === 'होय' &&
                 (selectedTaluka === 'all' || farmer.taluka_id === selectedTaluka);
        })
        .map(farmer => ({ id: farmer.village_id, name: farmersData.villages.find(v => v.village_id.toString() === farmer.village_id)?.marathi_name }))
        .filter(v => v.id && v.name)
    )).map((v, i, arr) => arr.findIndex(x => x.id === v.id) === i ? v : null)
      .filter(Boolean) as { id: string; name: string }[];


    // Export to Excel function
    const exportToExcel = () => {
      const excelData = filteredFarmers.map((farmer, index) => {
        const farmerRecord = farmer.farmer_record ? farmer.farmer_record.split('|') : [];
        const taluka = farmersData.taluka.find(t => t.taluka_id.toString() === farmer.taluka_id);
        const village = farmersData.villages.find(v => v.village_id.toString() === farmer.village_id);

        return {
          'Sr No': index + 1,
          'नाव (Name)': (farmerRecord.length > 0 ? farmerRecord[0] : '').trim() || farmer.name || 'N/A',
          'Farmer ID': farmer.farmer_id || 'N/A',
          'Taluka': taluka?.name || 'N/A',
          'Village': village?.marathi_name || 'N/A',
          'Contact': (farmerRecord.length > 6 ? farmerRecord[6] : '').trim() || 'N/A',
          // 'Death Date': (farmerRecord.length > 18 ? farmerRecord[18] : '').trim() || 'N/A',
          'IFR Status': (farmerRecord.length > 20 ? farmerRecord[20] : '').trim() || 'N/A',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 8 },   // Sr No
        { wch: 30 },  // नाव (Name)
        { wch: 12 },  // Farmer ID
        { wch: 20 },  // Taluka
        { wch: 20 },  // Village
        { wch: 15 },  // Contact
        // { wch: 15 },  // Death Date
        { wch: 12 },  // IFR Status
      ];  
      worksheet['!cols'] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Death_IFR_Holders');

      // Generate filename with current date
      const fileName = `Death_IFR_Holders_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    };

    // Export to PDF function
    const exportToPDF = async () => {
      try {
        // Create a temporary table element for html2canvas
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.width = '1200px'; // Fixed width for consistent scaling
        tempDiv.style.backgroundColor = 'white';

        // Create table HTML with the data
        const tableHTML = `
          <div style="padding: 20px; font-family: Arial, sans-serif; background: white; width: 100%; box-sizing: border-box;">
            <h2 style="color: #dc2626; margin-bottom: 20px; text-align: center; font-size: 18px;">Death IFR Holder Records</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed;">
              <thead>
                <tr style="background-color: #dc2626; color: white;">
                  <th style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold; width: 50px;">Sr No</th>
                  <th style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold; width: 150px;">नाव (Name)</th>
                  <th style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold; width: 80px;">Farmer ID</th>
                  <th style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold; width: 100px;">Taluka</th>
                  <th style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold; width: 100px;">Village</th>
                  <th style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold; width: 100px;">Contact</th>
          
                  <th style="border: 1px solid #ccc; padding: 6px; text-align: center; font-weight: bold; width: 80px;">IFR Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredFarmers.map((farmer, index) => {
                  const farmerRecord = farmer.farmer_record ? farmer.farmer_record.split('|') : [];
                  const taluka = farmersData.taluka.find(t => t.taluka_id.toString() === farmer.taluka_id);
                  const village = farmersData.villages.find(v => v.village_id.toString() === farmer.village_id);

                  return `
                    <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                      <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-size: 10px;">${index + 1}</td>
                      <td style="border: 1px solid #ccc; padding: 4px; font-size: 10px; word-wrap: break-word;">${(farmerRecord.length > 0 ? farmerRecord[0] : '').trim() || farmer.name || 'N/A'}</td>
                      <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-size: 10px;">${farmer.farmer_id || 'N/A'}</td>
                      <td style="border: 1px solid #ccc; padding: 4px; font-size: 10px; word-wrap: break-word;">${taluka?.name || 'N/A'}</td>
                      <td style="border: 1px solid #ccc; padding: 4px; font-size: 10px; word-wrap: break-word;">${village?.marathi_name || 'N/A'}</td>
                      <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-size: 10px;">${(farmerRecord.length > 6 ? farmerRecord[6] : '').trim() || 'N/A'}</td>
                  
                      <td style="border: 1px solid #ccc; padding: 4px; text-align: center; font-size: 10px; font-weight: bold;">${(farmerRecord.length > 20 ? farmerRecord[20] : '').trim() || 'N/A'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <div style="margin-top: 15px; text-align: center; font-size: 9px; color: #666; border-top: 1px solid #ccc; padding-top: 10px;">
              <strong>Total Records: ${filteredFarmers.length}</strong> |
              Generated on: ${new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        `;

        tempDiv.innerHTML = tableHTML;
        document.body.appendChild(tempDiv);

        // Wait for fonts to load
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use html2canvas to capture the table with optimized settings
        const canvas = await html2canvas(tempDiv, {
          scale: 1.5, // Balanced quality and size
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 1200, // Fixed width
          height: tempDiv.offsetHeight,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 1200,
          windowHeight: tempDiv.offsetHeight
        });

        // Remove temporary element
        document.body.removeChild(tempDiv);

        // Create PDF from canvas with proper scaling
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF('landscape', 'mm', 'a4');

        // Calculate dimensions to fit A4 landscape properly
        const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm

        // Calculate scaling to fit the content properly
        const imgAspectRatio = canvas.width / canvas.height;
        const pdfAspectRatio = pdfWidth / pdfHeight;

        let imgWidth, imgHeight, imgX, imgY;

        if (imgAspectRatio > pdfAspectRatio) {
          // Image is wider relative to PDF
          imgWidth = pdfWidth - 20; // Leave 10mm margin on each side
          imgHeight = imgWidth / imgAspectRatio;
          imgX = 10;
          imgY = (pdfHeight - imgHeight) / 2;
        } else {
          // Image is taller relative to PDF
          imgHeight = pdfHeight - 20; // Leave 10mm margin on top/bottom
          imgWidth = imgHeight * imgAspectRatio;
          imgX = (pdfWidth - imgWidth) / 2;
          imgY = 10;
        }

        // Ensure minimum size and add the image
        const minWidth = Math.min(imgWidth, pdfWidth - 20);
        const minHeight = Math.min(imgHeight, pdfHeight - 20);

        pdf.addImage(imgData, 'PNG', imgX, imgY, minWidth, minHeight, '', 'FAST');

        // Generate filename with current date
        const fileName = `Death_IFR_Holders_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

      } catch (error) {
        console.error('PDF export failed:', error);
        // Fallback to basic PDF if html2canvas fails
        const doc = new jsPDF('landscape');
        doc.setFontSize(16);
        doc.text('Death IFR Holder Records', 14, 18);
        doc.setFontSize(12);
        doc.text(`Export failed. Total Records: ${filteredFarmers.length}`, 14, 30);
        doc.text('Please use Excel export for complete data.', 14, 40);

        const fileName = `Death_IFR_Holders_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
      }
    };

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Death IFR Holder Records
          </h2>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
              Total Records: {filteredFarmers.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToExcel}
                disabled={filteredFarmers.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Excel
              </button>
              <button
                onClick={() => exportToPDF()}
                disabled={filteredFarmers.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                PDF
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Filters
                <span className="ml-2 px-3 py-1 bg-red-600 text-white text-sm font-semibold rounded-full">
                  {filteredFarmers.length}
                </span>
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <svg className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            <div className={`transition-all duration-300 ease-in-out ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Filter */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search farmers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    />
                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Taluka Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Taluka</label>
                  <select
                    value={selectedTaluka}
                    onChange={(e) => {
                      setSelectedTaluka(e.target.value);
                      setSelectedVillage('all');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  >
                    <option value="all">All Talukas</option>
                    {uniqueTalukas.map((taluka) => (
                      <option key={taluka.id} value={taluka.id}>
                        {taluka.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Village Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Village</label>
                  <select
                    value={selectedVillage}
                    onChange={(e) => setSelectedVillage(e.target.value)}
                    disabled={selectedTaluka === 'all'}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                      selectedTaluka === 'all' ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="all">All Villages</option>
                    {uniqueVillages.map((village) => (
                      <option key={village.id} value={village.id}>
                        {village.name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Clear Filters Button */}
              {(searchQuery || selectedTaluka !== 'all' || selectedVillage !== 'all') && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTaluka('all');
                      setSelectedVillage('all');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto h-full">
            {filteredFarmers.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg font-medium">No Death IFR holder records found</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or check data</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-sm text-left table-fixed">
                <thead className="bg-red-50 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 w-16">#</th>
                    <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 min-w-48">नाव (Name)</th>
                    <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 w-24">Farmer ID</th>
                    <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 min-w-32">Taluka</th>
                    <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 min-w-32">Village</th>
                    <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 w-32">Contact</th>
        
                    <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 w-32">IFR Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFarmers.map((farmer, index) => {
                    const farmerRecord = farmer.farmer_record ? farmer.farmer_record.split('|') : [];
                    const taluka = farmersData.taluka.find(t => t.taluka_id.toString() === farmer.taluka_id);
                    const village = farmersData.villages.find(v => v.village_id.toString() === farmer.village_id);

                    return (
                      <tr
                        key={farmer.farmer_id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium text-center">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                          {(farmerRecord.length > 0 ? farmerRecord[0] : '').trim() || farmer.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-center">
                          {farmer.farmer_id || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {taluka?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {village?.marathi_name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {(farmerRecord.length > 6 ? farmerRecord[6] : '').trim() || 'N/A'}
                        </td>
                      
                          <td className="px-4 py-3 text-red-600 dark:text-red-400 font-semibold text-center">
                            {(farmerRecord.length > 20 ? farmerRecord[20] : '').trim() || 'N/A'}
                          </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Proposal Management Dashboard Component for category_id = 24
  const ProposalManagementDashboard = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTaluka, setSelectedTaluka] = useState<string>('all');
    const [selectedVillage, setSelectedVillage] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(true);
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
      fetchProposals();
    }, []);

    const applyFilters = () => {
      let filtered = [...proposals];

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
          p.proposal_id?.toString().includes(query) ||
          p.land_details?.toLowerCase().includes(query) ||
          p.taluka_name?.toLowerCase().includes(query) ||
          p.village_name?.toLowerCase().includes(query) ||
          p.user_name?.toLowerCase().includes(query) ||
          p.beneficiaries?.toLowerCase().includes(query)
        );
      }

      // Taluka filter
      if (selectedTaluka !== 'all') {
        filtered = filtered.filter(p => p.taluka_id?.toString() === selectedTaluka);
      }

      // Village filter
      if (selectedVillage !== 'all') {
        filtered = filtered.filter(p => p.village_id?.toString() === selectedVillage);
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'pending') {
          filtered = filtered.filter(p => !p.work_status || p.work_status === 'Not started Yet' || p.work_status === '');
        } else {
          filtered = filtered.filter(p => p.work_status === selectedStatus);
        }
      }

      setFilteredProposals(filtered);
    };

    useEffect(() => {
      applyFilters();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [proposals, searchQuery, selectedTaluka, selectedVillage, selectedStatus]);

    const fetchProposals = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/proposals');
        if (response.ok) {
          const data = await response.json();
          setProposals(data);
        }
      } catch (error) {
        console.error('Error fetching proposals:', error);
      } finally {
        setLoading(false);
      }
    };

    // Get unique talukas and villages for filters
    const uniqueTalukas = Array.from(new Set(proposals.map(p => ({ id: p.taluka_id, name: p.taluka_name })).filter(t => t.id && t.name)))
      .map((t, i, arr) => arr.findIndex(x => x.id === t.id) === i ? t : null)
      .filter(Boolean) as { id: number; name: string }[];

    const uniqueVillages = Array.from(new Set(proposals.map(p => ({ id: p.village_id, name: p.village_name })).filter(v => v.id && v.name)))
      .map((v, i, arr) => arr.findIndex(x => x.id === v.id) === i ? v : null)
      .filter(Boolean) as { id: number; name: string }[];

    const handleOpenModal = (proposal: Proposal) => {
      setSelectedProposal(proposal);
      setIsModalOpen(true);
    };

    const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedProposal(null);
    };

    const getStatusBadge = (proposal: Proposal) => {
      const status = proposal.work_status;
      let bgColor = 'bg-gray-100 text-gray-800';
      let text = 'Not Started';

      if (status === 'Under Review') {
        bgColor = 'bg-yellow-100 text-yellow-800';
        text = 'Under Review';
      } else if (status === 'Rejected') {
        bgColor = 'bg-red-100 text-red-800';
        text = 'Rejected';
      } else if (status === 'Correction needed') {
        bgColor = 'bg-orange-100 text-orange-800';
        text = 'Correction Needed';
      } else if (status === 'pending at DLC') {
        bgColor = 'bg-purple-100 text-purple-800';
        text = 'Pending at DLC';
      }

      return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${bgColor}`}>
          {text}
        </span>
      );
    };

    const stats = {
      total: proposals.length,
      pending: proposals.filter(p => !p.work_status || p.work_status === 'Not started Yet' || p.work_status === '').length,
      underReview: proposals.filter(p => p.work_status === 'Under Review').length,
      rejected: proposals.filter(p => p.work_status === 'Rejected').length,
      pendingAtDLC: proposals.filter(p => p.work_status === 'pending at DLC').length,
      correctionNeeded: proposals.filter(p => p.work_status === 'Correction needed').length
    };

    if (loading) {
      return <Loader />;
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Proposal Management Dashboard
          </h2>
          <button
            onClick={fetchProposals}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Proposals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.underReview}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending at DLC</p>
                <p className="text-2xl font-bold text-purple-600">{stats.pendingAtDLC}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Correction Needed</p>
                <p className="text-2xl font-bold text-orange-600">{stats.correctionNeeded}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Proposals List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header with Filters Toggle */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Proposals List
                <span className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                  {filteredProposals.length}
                </span>
              </h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <svg className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            {/* Filters Section */}
            <div className={`transition-all duration-300 ease-in-out ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Filter */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search proposals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Taluka Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Taluka</label>
                  <select
                    value={selectedTaluka}
                    onChange={(e) => {
                      setSelectedTaluka(e.target.value);
                      setSelectedVillage('all'); // Reset village when taluka changes
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="all">All Talukas</option>
                    {uniqueTalukas.map((taluka) => (
                      <option key={taluka.id} value={taluka.id.toString()}>
                        {taluka.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Village Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Village</label>
                  <select
                    value={selectedVillage}
                    onChange={(e) => setSelectedVillage(e.target.value)}
                    disabled={selectedTaluka === 'all'}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      selectedTaluka === 'all' ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="all">All Villages</option>
                    {uniqueVillages
                      .filter(v => selectedTaluka === 'all' || proposals.find(p => p.village_id === v.id && p.taluka_id?.toString() === selectedTaluka))
                      .map((village) => (
                        <option key={village.id} value={village.id.toString()}>
                          {village.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending Review</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Correction needed">Correction Needed</option>
                    <option value="pending at DLC">Pending at DLC</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || selectedTaluka !== 'all' || selectedVillage !== 'all' || selectedStatus !== 'all') && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTaluka('all');
                      setSelectedVillage('all');
                      setSelectedStatus('all');
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Proposals Table */}
          <div className="overflow-x-auto">
            {filteredProposals.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg font-medium">No proposals found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredProposals.map((proposal, index) => (
                  <div
                    key={proposal.proposal_id}
                    className="p-6 hover:bg-gray-50 transition-all duration-300 ease-out transform hover:scale-[1.01] hover:shadow-sm"
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Proposal ID & Status */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">Proposal ID</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-900">#{proposal.proposal_id}</span>
                            {getStatusBadge(proposal)}
                          </div>
                        </div>

                        {/* Location Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Location
                          </div>
                          <div className="text-sm text-gray-700">
                            {proposal.taluka_name && (
                              <p className="font-medium">{proposal.taluka_name}</p>
                            )}
                            {proposal.village_name && (
                              <p className="text-gray-600">{proposal.village_name}</p>
                            )}
                            {!proposal.taluka_name && !proposal.village_name && (
                              <p className="text-gray-400">N/A</p>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Details
                          </div>
                          <div className="text-sm text-gray-700 space-y-1">
                            {proposal.number_of_tree && (
                              <p><span className="font-medium">Trees:</span> {proposal.number_of_tree}</p>
                            )}
                            {proposal.beneficiaries && (
                              <p><span className="font-medium">Beneficiaries:</span> {proposal.beneficiaries}</p>
                            )}
                            {proposal.user_name && (
                              <p><span className="font-medium">Created by:</span> {proposal.user_name}</p>
                            )}
                          </div>
                        </div>

                        {/* Land Details */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Land Details
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {proposal.land_details || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 items-end">
                        {(!proposal.work_status || proposal.work_status === 'Not started Yet' || proposal.work_status === '') && (
                          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 shadow-sm">
                            Start Review
                          </button>
                        )}
                        {(proposal.work_status === 'Under Review' || proposal.work_status === 'Correction needed') && (
                          <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 active:scale-95 shadow-sm">
                            Review
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenModal(proposal)}
                          className="px-4 py-2 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-all"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add CSS Animation */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `
        }} />

        {/* Proposal Details Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          className="max-w-4xl"
        >
          <div className="p-6 h-[550px] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Proposal Details
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedProposal && (
              <div className="space-y-6">
                {/* Proposal Information */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    Proposal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Proposal ID</p>
                      <p className="text-base text-gray-900 dark:text-white font-semibold">
                        #{selectedProposal.proposal_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                      <div className="mt-1">
                        {getStatusBadge(selectedProposal)}
                      </div>
                    </div>

                    {selectedProposal.land_details && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Land Details</p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {selectedProposal.land_details}
                        </p>
                      </div>
                    )}

                    {selectedProposal.taluka_name && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taluka</p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {selectedProposal.taluka_name}
                        </p>
                      </div>
                    )}

                    {selectedProposal.village_name && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Village</p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {selectedProposal.village_name}
                        </p>
                      </div>
                    )}

                    {selectedProposal.gp_name && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gram Panchayat</p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {selectedProposal.gp_name}
                        </p>
                      </div>
                    )}

                    {selectedProposal.number_of_tree && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Number of Trees</p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {selectedProposal.number_of_tree}
                        </p>
                      </div>
                    )}

                    {selectedProposal.beneficiaries && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Beneficiaries</p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {selectedProposal.beneficiaries}
                        </p>
                      </div>
                    )}

                    {selectedProposal.user_name && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {selectedProposal.user_name}
                        </p>
                      </div>
                    )}

                    {selectedProposal.created_at && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {new Date(selectedProposal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {selectedProposal.remarks && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Remarks</p>
                        <p className="text-base text-gray-900 dark:text-white">
                          {selectedProposal.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF Document */}
                {selectedProposal.pdf && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <a
                      href={selectedProposal.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      View PDF Document
                    </a>
                  </div>
                )}

                {/* Supporting Map Document */}
                {selectedProposal.supporting_map_doc && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <a
                      href={selectedProposal.supporting_map_doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      View Supporting Map Document
                    </a>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    );
  };

  // Main Dashboard Content Component
  const MainDashboardContent = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-6"
    >
      {/* District Summary Ribbon */}
      <DistrictSummaryRibbon
        farmers={farmersData.farmers}
        talukas={farmersData.taluka}
        villages={farmersData.villages}
      />

      {/* Enhanced KPI Cards */}
      <EnhancedKPICards
        farmers={farmersData.farmers}
        schemesCount={metrics.schemes.length}
        usersCount={metrics.users.length}
      />

      {/* Alerts and Pending Approvals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsSection />
        <PendingApprovalsSection />
      </div>

      {/* Recently Updated Records */}
      <RecentlyUpdatedRecords farmers={farmersData.farmers} />

      {/* Advanced Analytics */}
      <AdvancedAnalytics
        farmers={farmersData.farmers}
        talukas={farmersData.taluka}
        schemes={farmersData.schemes}
      />

      {/* Performance Scorecard */}
      <PerformanceScorecard
        talukas={farmersData.taluka}
        farmers={farmersData.farmers}
      />

      {/* Original Dashboard Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="grid grid-cols-6 gap-4 md:gap-6"
      >
        <div className="col-span-12 space-y-2 xl:col-span-7">
          <Suspense fallback={<Loader />}>
            <DashboardTalukatabview farmersData={farmersData} />
          </Suspense>
        </div>
      </motion.div>
    </motion.div>
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

  // For user_category_id = 24, show only Section 3(2)
  const isSection32Only = categoryId === "24";
  
  // For user_category_id = 32, show Category32Dashboard in Section 3(2)
  const isCategory32 = categoryId === "32";
  
  // For user_category_id = 4, show Category32Dashboard in Section 3(2) (similar to category 32)
  const isCategory4 = categoryId === "4";
  
  // For user_category_id = 8, show Category32Dashboard in Section 3(2) (similar to category 32)
  const isCategory8 = categoryId === "8";

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
        {isSection32Only ? <ProposalManagementDashboard /> : (isCategory32 || isCategory4 || isCategory8) ? <Category32Dashboard /> : <Section32Tabs />}
        </div>
      </div>
    },
    {
      id: "death-ifr-holder",
      label: "Death IFR holder",
      content: (
        <div className="flex flex-col h-full">
          <DeathIFRHolderDashboard farmersData={farmersData} />
        </div>
      )
    }
  ];

  // Filter tabs based on user category
  const tabs = isPESACoordinator
    ? allTabs.filter(tab => tab.id === "main-dashboard")
    : isSection32Only
      ? allTabs.filter(tab => tab.id === "notification")
      : allTabs;

  return (
    <div className="w-full">
      {/* Today's Survey Count Button */}
      <div className="w-full mb-4">
        <button
          onClick={() => setShowTalukaList(!showTalukaList)}
          className="w-full bg-white hover:bg-gray-50 text-black font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 ease-in-out transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg 
                className="w-6 h-6 text-blue-600 transition-all duration-300 transform hover:scale-110 hover:rotate-12" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="text-lg font-bold">
                आजचे सर्वेक्षण: 
                <span className="ml-2 inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-extrabold animate-pulse">
                  {todaySurveyCount}
                </span>
              </span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-600 transition-all duration-300 ease-in-out transform ${showTalukaList ? 'rotate-180' : 'rotate-0'} hover:scale-125`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Taluka List - Expandable */}
        <div 
          className={`mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden transition-all duration-500 ease-in-out ${
            showTalukaList 
              ? 'max-h-[1000px] opacity-100 transform translate-y-0' 
              : 'max-h-0 opacity-0 transform -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              तालुका नुसार सर्वेक्षण (Taluka-wise Surveys)
            </h3>
            <div className="max-h-96 overflow-y-auto">
              {talukaWiseSurveys.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">कोणतेही तालुका सापडले नाहीत</p>
                  <p className="text-sm mt-2">No talukas found</p>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                      transform: showTalukaList ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)'
                    }}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 text-left transform hover:scale-105 active:scale-95 ${
                      talukaData.count > 0
                        ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 hover:shadow-lg cursor-pointer'
                        : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 text-base flex-1 text-left">
                        {talukaData.taluka_name || 'N/A'}
                      </h4>
                      <div className={`ml-3 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ${
                        talukaData.count > 0
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {talukaData.count || 0}
                      </div>
                    </div>
                    {talukaData.count > 0 && (
                      <p className="text-xs text-gray-600 mt-2 text-left">
                        क्लिक करा तपशील पहाण्यासाठी (Click to view details)
                      </p>
                    )}
                  </button>
                ))}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TabView tabs={tabs} defaultTab={categoryId === "24" ? "notification" : "main-dashboard"} />

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
                  <thead className="bg-blue-50 dark:bg-gray-700 sticky top-0 whitespace-nowrap">
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
                            {(() => {
                              const village = farmersData.villages.find(v => v.village_id.toString() === farmer.village_id);
                              return village ? village.marathi_name : 'N/A';
                            })()}
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
                            {maskAadhaar((farmerRecord.length > 5 ? farmerRecord[5] : '').trim() || 'N/A')}
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

