"use client";

import React, { useState, useEffect, useCallback } from "react";
import TabView from "@/components/common/TabView";
import { Suspense } from "react";
import Loader from "@/common/Loader";
// import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
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
// import { format } from 'date-fns';
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
import { toast } from 'react-hot-toast';
// import { useRouter } from 'next/navigation';

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
  proposal_category_name?: string;
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
  // const [, setShowTalukaList] = useState(false);
  const [selectedTalukaData] = useState<TalukaSurveyData | null>(null);
  const [isTalukaDetailModalOpen, setIsTalukaDetailModalOpen] = useState(false);
  
  // Proposal modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  
  // Action states for accept/reject/send back
  const [rejectReason, setRejectReason] = useState('');
  const [sendBackReason, setSendBackReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSendBackModal, setShowSendBackModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [reviewCheckboxes, setReviewCheckboxes] = useState({
    siteInspection: false,
    boundaryVerified: false,
    fraCompliance: false,
    treeCount: false
  });

  useEffect(() => {
    const category_id = sessionStorage.getItem('category_id');
    setCategoryId(category_id);
  }, []);

  // Proposal action handlers
  const handleOpenModal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(true);
    // Reset states
    setRejectReason('');
    setSendBackReason('');
    setReviewCheckboxes({
      siteInspection: false,
      boundaryVerified: false,
      fraCompliance: false,
      treeCount: false
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProposal(null);
    setRejectReason('');
    setSendBackReason('');
    setShowRejectModal(false);
    setShowSendBackModal(false);
    setShowAcceptModal(false);
  };

  const handleAccept = () => {
    // Check if at least one checkbox is checked
    const hasAnyChecked = Object.values(reviewCheckboxes).some(v => v);
    if (!hasAnyChecked) {
      toast.error('Please complete at least one review criteria');
      return;
    }
    setShowAcceptModal(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedProposal) return;

    try {
      const response = await fetch('/api/proposals/updatestatus', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposal_id: selectedProposal.proposal_id,
          work_status: 'Accepted',
          review_checkboxes: reviewCheckboxes
        })
      });

      if (response.ok) {
        toast.success('Proposal accepted successfully');
        setShowAcceptModal(false);
        handleCloseModal();
        // Refresh page or refetch data
        window.location.reload();
      } else {
        toast.error('Failed to accept proposal');
      }
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error('Failed to accept proposal');
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    if (!selectedProposal) return;

    try {
      const response = await fetch('/api/proposals/updatestatus', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposal_id: selectedProposal.proposal_id,
          work_status: 'Rejected',
          reason: rejectReason
        })
      });

      if (response.ok) {
        toast.success('Proposal rejected successfully');
        setShowRejectModal(false);
        handleCloseModal();
        // Refresh page or refetch data
        window.location.reload();
      } else {
        toast.error('Failed to reject proposal');
      }
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error('Failed to reject proposal');
    }
  };

  const handleSendBack = () => {
    setShowSendBackModal(true);
  };

  const handleConfirmSendBack = async () => {
    if (!sendBackReason.trim()) {
      toast.error('Please provide a reason for sending back');
      return;
    }

    if (!selectedProposal) return;

    try {
      const response = await fetch('/api/proposals/updatestatus', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposal_id: selectedProposal.proposal_id,
          work_status: 'Correction needed',
          reason: sendBackReason
        })
      });

      if (response.ok) {
        toast.success('Proposal sent back for correction');
        setShowSendBackModal(false);
        handleCloseModal();
        // Refresh page or refetch data
        window.location.reload();
      } else {
        toast.error('Failed to send back proposal');
      }
    } catch (error) {
      console.error('Error sending back proposal:', error);
      toast.error('Failed to send back proposal');
    }
  };

  // Filter today's surveys
  // const getTodaySurveys = () => {
  //   const today = new Date();
  //   const dateStr = format(today, 'yyyy-MM-dd');

  //   // Get user information from sessionStorage for filtering
  //   const userCategoryId = sessionStorage.getItem('category_id');
  //   const userTalukaId = sessionStorage.getItem('taluka_id');

  //   return metrics.farmers.filter(farmer => {
  //     if (!farmer.update_record) return false;

  //     // Split the update_record by pipe and check each segment
  //     const hasTodaySurvey = farmer.update_record.split('|').some(segment => {
  //       // Extract the date part from each segment
  //       const datePart = segment.split('/')[1];
  //       return datePart === dateStr;
  //     });

  //     if (!hasTodaySurvey) return false;

  //     // If user is PESA Coordinator (category_id = 37), only show surveys from their assigned taluka
  //     if (userCategoryId === '37' && userTalukaId) {
  //       return farmer.taluka_id === userTalukaId;
  //     }

  //     // If user_category_id = 4, only show surveys from talukas 1, 2, 3
  //     if (userCategoryId === '4') {
  //       const allowedTalukaIds = ['1', '2', '3'];
  //       return allowedTalukaIds.includes(String(farmer.taluka_id));
  //     }

  //     // If user_category_id = 8, only show surveys from talukas 4, 5, 7
  //     if (userCategoryId === '8') {
  //       const allowedTalukaIds = ['4', '5', '7'];
  //       return allowedTalukaIds.includes(String(farmer.taluka_id));
  //     }

  //     // For all other users, show all surveys
  //     return true;
  //   });
  // };

  // const todaySurveys = getTodaySurveys();
  // const todaySurveyCount = todaySurveys.length; // Unused variable

  // Group today's surveys by taluka
  // const getTalukaWiseSurveys = (): TalukaSurveyData[] => {
  //   const talukaMap = new Map();

  //   // Get user information from sessionStorage
  //   const userCategoryId = sessionStorage.getItem('category_id');
  //   const userTalukaId = sessionStorage.getItem('taluka_id');

  //   // If user is PESA Coordinator (category_id = 37), only show their assigned taluka
  //   // If user_category_id = 4, only show talukas 1, 2, 3
  //   // If user_category_id = 8, only show talukas 4, 5, 7
  //   // Otherwise, show all talukas
  //   const allowedTalukaIdsCategory4 = ['1', '2', '3'];
  //   const allowedTalukaIdsCategory8 = ['4', '5', '7'];
  //   let talukasToShow = farmersData.taluka;
    
  //   if (userCategoryId === '37' && userTalukaId) {
  //     talukasToShow = farmersData.taluka.filter(taluka => taluka.taluka_id.toString() === userTalukaId);
  //   } else if (userCategoryId === '4') {
  //     talukasToShow = farmersData.taluka.filter(taluka => allowedTalukaIdsCategory4.includes(taluka.taluka_id.toString()));
  //   } else if (userCategoryId === '8') {
  //     talukasToShow = farmersData.taluka.filter(taluka => allowedTalukaIdsCategory8.includes(taluka.taluka_id.toString()));
  //   }

  //   // Initialize talukas with count 0
  //   talukasToShow.forEach(taluka => {
  //     talukaMap.set(taluka.taluka_id.toString(), {
  //       taluka_id: taluka.taluka_id,
  //       taluka_name: taluka.name,
  //       count: 0,
  //       surveys: []
  //     });
  //   });

  //   // Count surveys for each taluka
  //   todaySurveys.forEach(farmer => {
  //     const talukaId = farmer.taluka_id?.toString() || '';
  //     if (talukaMap.has(talukaId)) {
  //       const talukaData = talukaMap.get(talukaId);
  //       talukaData.count += 1;
  //       talukaData.surveys.push(farmer);
  //     }
  //   });

  //   // Convert to array and sort by count (descending)
  //   return Array.from(talukaMap.values()).sort((a, b) => b.count - a.count);
  // };

  // const talukaWiseSurveys: TalukaSurveyData[] = getTalukaWiseSurveys();

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

    const getCategoryName = (proposal: Proposal) => {
      if (proposal.proposal_category_name) {
        return proposal.proposal_category_name;
      }

      switch (proposal.proposal_category_id) {
        case 1:
          return 'Jamin (Class 2)';
        case 2:
          return 'Kulkayda (Tribal)';
        case 3:
          return 'Gavthan';
        default:
          return 'Other';
      }
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sr No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proposal ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taluka
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Village
                    </th>
                    
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                   
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProposals.map((proposal, index) => (
                    <tr
                      key={proposal.proposal_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        #{proposal.proposal_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {proposal.taluka_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {getCategoryName(proposal)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {proposal.village_name || 'N/A'}
                      </td>
                     
                      <td className="px-4 py-3 text-sm">
                        {getStatusBadge(proposal)}
                      </td>
                      
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2 items-start md:items-end">
                          {(!proposal.work_status || proposal.work_status === 'Not started Yet' || proposal.work_status === '') && (
                            <button className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm">
                              Start Review
                            </button>
                          )}
                        
                          <button
                            onClick={() => handleOpenModal(proposal)}
                            className="px-3 py-1 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-50 transition-all"
                          >
                            View Details
                          </button>
                          {(proposal.work_status === 'Under Review' || proposal.work_status === 'Correction needed') && (
                            <button className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all shadow-sm">
                              Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          className="max-w-6xl"
        >
          <div className="p-6 max-h-[80vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side - Proposal Information (2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                      {selectedProposal.proposal_category_name || 'Proposal Work Category'}
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

                      {selectedProposal.work_status && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Work Status</p>
                          <p className="text-base text-gray-900 dark:text-white">
                            {selectedProposal.work_status}
                          </p>
                        </div>
                      )}

                      {selectedProposal.forward_to && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Forward To</p>
                          <p className="text-base text-gray-900 dark:text-white">
                            {selectedProposal.forward_to}
                          </p>
                        </div>
                      )}

                      {selectedProposal.created_at && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</p>
                          <p className="text-base text-gray-900 dark:text-white">
                            {new Date(selectedProposal.created_at).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}

                      {selectedProposal.updated_at && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                          <p className="text-base text-gray-900 dark:text-white">
                            {new Date(selectedProposal.updated_at).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
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

                  {/* Documents Section */}
                  <div className="space-y-4">
                    {/* PDF Document */}
                    {selectedProposal.pdf && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <button
                          onClick={() => {
                            if (selectedProposal.pdf) {
                              let pdfUrl = selectedProposal.pdf;
                              
                              // Handle different PDF path formats
                              if (pdfUrl.startsWith('http')) {
                                // Already a full URL, use as is
                              } else if (pdfUrl.startsWith('/')) {
                                // Already starts with /, use as is
                              } else if (pdfUrl.startsWith('pdf/')) {
                                // Starts with pdf/, add leading slash
                                pdfUrl = `/${pdfUrl}`;
                              } else {
                                // Just filename, assume it's in public/pdf/
                                pdfUrl = `/pdf/${pdfUrl}`;
                              }
                              
                              console.log('Opening PDF URL:', pdfUrl); // Debug log
                              
                              // Open in new tab with proper handling
                              const newWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
                              
                              // Fallback if popup blocked
                              if (!newWindow) {
                                // Create a temporary link and click it
                                const link = document.createElement('a');
                                link.href = pdfUrl;
                                link.target = '_blank';
                                link.rel = 'noopener noreferrer';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            } else {
                              alert('PDF document not available');
                            }
                          }}
                          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors w-full"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          View PDF Document
                          <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Supporting Map Document */}
                    {selectedProposal.supporting_map_doc && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <button
                          onClick={() => {
                            if (selectedProposal.supporting_map_doc) {
                              let mapUrl = selectedProposal.supporting_map_doc;
                              
                              // Handle different map document path formats
                              if (mapUrl.startsWith('http')) {
                                // Already a full URL, use as is
                              } else if (mapUrl.startsWith('/')) {
                                // Already starts with /, use as is
                              } else if (mapUrl.startsWith('pdf/')) {
                                // Starts with pdf/, add leading slash
                                mapUrl = `/${mapUrl}`;
                              } else {
                                // Just filename, assume it's in public/pdf/
                                mapUrl = `/pdf/${mapUrl}`;
                              }
                              
                              console.log('Opening Map Document URL:', mapUrl); // Debug log
                              
                              // Open in new tab with proper handling
                              const newWindow = window.open(mapUrl, '_blank', 'noopener,noreferrer');
                              
                              // Fallback if popup blocked
                              if (!newWindow) {
                                // Create a temporary link and click it
                                const link = document.createElement('a');
                                link.href = mapUrl;
                                link.target = '_blank';
                                link.rel = 'noopener noreferrer';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            } else {
                              alert('Supporting map document not available');
                            }
                          }}
                          className="flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium transition-colors w-full"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          View Supporting Map Document
                          <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Review & Actions (1 column) */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Review Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Review Checklist
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={reviewCheckboxes.siteInspection}
                          onChange={(e) =>
                            setReviewCheckboxes({
                              ...reviewCheckboxes,
                              siteInspection: e.target.checked
                            })
                          }
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Site inspection completed
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={reviewCheckboxes.boundaryVerified}
                          onChange={(e) =>
                            setReviewCheckboxes({
                              ...reviewCheckboxes,
                              boundaryVerified: e.target.checked
                            })
                          }
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Boundary verification done
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={reviewCheckboxes.fraCompliance}
                          onChange={(e) =>
                            setReviewCheckboxes({
                              ...reviewCheckboxes,
                              fraCompliance: e.target.checked
                            })
                          }
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          FRA compliance verified
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={reviewCheckboxes.treeCount}
                          onChange={(e) =>
                            setReviewCheckboxes({
                              ...reviewCheckboxes,
                              treeCount: e.target.checked
                            })
                          }
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Tree count verified
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Actions</h4>
                    <div className="space-y-3">
                      <button
                        onClick={handleAccept}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Accept Proposal
                      </button>
                      <button
                        onClick={handleReject}
                        className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject Proposal
                      </button>
                      <button
                        onClick={handleSendBack}
                        className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Send Back for Correction
                      </button>
                    </div>
                  </div>

                  {/* Close Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleCloseModal}
                      className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Enhanced Proposal Action Modal */}
        {selectedProposal && (
          <>
            {/* Accept Confirmation Modal */}
            <Modal
              isOpen={showAcceptModal}
              onClose={() => setShowAcceptModal(false)}
              className="max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                  Accept Proposal
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
                  Are you sure you want to accept this proposal? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAcceptModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAccept}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Confirm Accept
                  </button>
                </div>
              </div>
            </Modal>

            {/* Reject Reason Modal */}
            <Modal
              isOpen={showRejectModal}
              onClose={() => {
                setShowRejectModal(false);
                setRejectReason('');
              }}
              className="max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                  Reject Proposal
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Please provide a reason for rejection:
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:text-white mb-4"
                  rows={4}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            </Modal>

            {/* Send Back Reason Modal */}
            <Modal
              isOpen={showSendBackModal}
              onClose={() => {
                setShowSendBackModal(false);
                setSendBackReason('');
              }}
              className="max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                  Send Back for Correction
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Please provide a reason for sending back:
                </p>
                <textarea
                  value={sendBackReason}
                  onChange={(e) => setSendBackReason(e.target.value)}
                  placeholder="Enter reason for sending back..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:text-white mb-4"
                  rows={4}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSendBackModal(false);
                      setSendBackReason('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSendBack}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Confirm Send Back
                  </button>
                </div>
              </div>
            </Modal>
          </>
        )}
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

  // Decide which tab should be selected by default.
  // Prefer "Section 3(2)" tab when available, otherwise fall back to the first tab.
  const defaultTabId =
    tabs.find(tab => tab.id === "notification")?.id ?? tabs[0]?.id ?? "main-dashboard";

  // When user is category_id = 24, we only show Section 3(2) dashboard content.
  // In that case, hide the TabView completely and render the content directly.
  const section32Tab = allTabs.find(tab => tab.id === "notification");

  return (
    <div className="w-full">
      {isSection32Only && section32Tab ? (
        <>{section32Tab.content}</>
      ) : (
        <TabView tabs={tabs} defaultTab={defaultTabId} />
      )}

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
                    {selectedTalukaData.surveys.map((farmer: FarmdersType, index: number) => {
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

