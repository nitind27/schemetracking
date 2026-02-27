"use client";

import React, { useState, useEffect, useMemo } from "react";
import Loader from "@/common/Loader";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
// import { Modal } from "@/components/ui/modal";
import { 
  FiFileText, 
  FiClock, 
  FiXCircle, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiDownload,
  // FiTrendingUp,
  FiMapPin,
  FiCalendar,
  FiX,
  FiBarChart2,
  // FiUsers
} from "react-icons/fi";
// import { HiOfficeBuilding } from "react-icons/hi";

interface Proposal {
  proposal_id: number;
  proposal_category_id: number;
  proposal_category_name: string;
  work_status: string;
  forward_to: string;
  user_category_id: number;
  user_category_name?: string;
  user_name: string;
  taluka_name: string;
  gp_name: string;
  village_name: string;
  beneficiaries: string;
  number_of_tree: number;
  land_details: string;
  remarks: string;
  pdf: string;
  created_at: string;
  updated_at: string;
  days_pending?: number;
  months_pending?: number;
}

interface DCStats {
  totalProposals: number;
  pendingForAcceptAtRFODFO: number; // Pending for Accept at RFO/DFO
  rejectedByRFODFO: number; // Rejected by RFO/DFO
  pendingAtRFODFO: number; // Pending at RFO/DFO (Under Review)
  pendingAtPO: number; // Pending at PO
  pendingAtDLC: number; // Pending at DLC
  dlcCompleted: number; // DLC Completed
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: {
      duration: 0.3,
    }
  }
};

// const numberVariants = {
//   hidden: { opacity: 0, scale: 0.5 },
//   visible: {
//     opacity: 1,
//     scale: 1,
//     transition: {
//       duration: 0.5,
//       type: "spring" as const,
//       stiffness: 100
//     }
//   }
// };

export default function DCDashboard() {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<DCStats>({
    totalProposals: 0,
    pendingForAcceptAtRFODFO: 0,
    rejectedByRFODFO: 0,
    pendingAtRFODFO: 0,
    pendingAtPO: 0,
    pendingAtDLC: 0,
    dlcCompleted: 0,
  });
  const [actionRequiredProposals, setActionRequiredProposals] = useState<Proposal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalProposals, setModalProposals] = useState<Proposal[]>([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsProposal, setDetailsProposal] = useState<Proposal | null>(null);
  const [statusHistory, setStatusHistory] = useState<Array<{
    id: string;
    status: string;
    action: string;
    date: string;
    user_name?: string;
    remarks?: string;
    isCurrent: boolean;
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchDCData();
  }, []);

  // Refresh function
  const handleRefresh = () => {
    fetchDCData();
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setDetailsProposal(null);
    setStatusHistory([]);
    setLoadingHistory(false);
  };

  const handleViewDetails = async (proposal: Proposal) => {
    setDetailsProposal(proposal);
    setIsDetailsModalOpen(true);
    setLoadingHistory(true);
    
    // Fetch status history
    try {
      const response = await fetch(`/api/proposals/status-history?proposal_id=${proposal.proposal_id}`);
      const data = await response.json();
      if (data.success && data.timeline) {
        setStatusHistory(data.timeline);
      } else {
        // If no history, create basic timeline from proposal data
        const basicTimeline = [{
          id: 'created',
          status: proposal.work_status || 'pending',
          action: 'Proposal Created',
          date: proposal.created_at,
          isCurrent: true,
        }];
        if (proposal.updated_at && proposal.updated_at !== proposal.created_at) {
          basicTimeline.push({
            id: 'updated',
            status: proposal.work_status || 'pending',
            action: 'Status Updated',
            date: proposal.updated_at,
            isCurrent: true,
          });
        }
        setStatusHistory(basicTimeline);
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
      // Fallback to basic timeline
      const basicTimeline = [{
        id: 'created',
        status: proposal.work_status || 'pending',
        action: 'Proposal Created',
        date: proposal.created_at,
        isCurrent: true,
      }];
      if (proposal.updated_at && proposal.updated_at !== proposal.created_at) {
        basicTimeline.push({
          id: 'updated',
          status: proposal.work_status || 'pending',
          action: 'Status Updated',
          date: proposal.updated_at,
          isCurrent: true,
        });
      }
      setStatusHistory(basicTimeline);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusBadge = (proposal: Proposal) => {
    const status = proposal.work_status?.toLowerCase()?.trim() || '';
    let bgColor = 'bg-gray-100 text-gray-800';
    let text = proposal.work_status || 'Not Started';

    if (status === 'complete' || status === 'completed' || proposal.remarks?.includes('DLC Sanctioned')) {
      bgColor = 'bg-green-100 text-green-800';
      text = 'Completed';
    } else if (status === 'correction needed' || proposal.remarks?.includes('DLC Send Back')) {
      bgColor = 'bg-orange-100 text-orange-800';
      text = 'Correction Needed';
    } else if (status === 'pending at dlc') {
      bgColor = 'bg-purple-100 text-purple-800';
      text = 'Pending at DLC';
    } else if (status === 'under review') {
      bgColor = 'bg-yellow-100 text-yellow-800';
      text = 'Under Review';
    } else if (status === 'rejected') {
      bgColor = 'bg-red-100 text-red-800';
      text = 'Rejected';
    } else if (status === 'forwarded') {
      bgColor = 'bg-blue-100 text-blue-800';
      text = 'Forwarded';
    } else if (!status || status === 'not started yet' || status === 'not started' || status === 'pending' || status === '0') {
      bgColor = 'bg-gray-100 text-gray-800';
      text = 'Pending';
    }

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bgColor}`}>
        {text}
      </span>
    );
  };

  const fetchDCData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dc-dashboard');
      
      if (response.ok) {
        const data = await response.json();
        console.log('DC Dashboard Data:', {
          proposalsCount: data.proposals?.length || 0,
          stats: data.stats,
          actionRequiredCount: data.actionRequired?.length || 0,
          actionRequiredSample: data.actionRequired?.slice(0, 3) || []
        });
        
        const actionRequired = data.actionRequired || [];
        console.log('Action Required Details:', actionRequired.map((p: Proposal) => ({
          id: p.proposal_id,
          days_pending: p.days_pending,
          months_pending: p.months_pending,
          created_at: p.created_at,
          work_status: p.work_status
        })));
        
        const proposalsData = data.proposals || [];
        setProposals(proposalsData);
        
        // Use stats directly from API response - API calculates based on database work_status values
        // work_status is varchar(50) in database with values: 'pending', 'under review', 'correction needed', 'pending at dlc', 'rejected', 'forwarded'
        // API already handles proper normalization and counting
        if (data.stats) {
          setStats(data.stats);
        } else {
          // Fallback: Calculate stats if API doesn't provide them
          // Helper function to normalize work_status (same as API)
          const normalizeWorkStatus = (status: string | number | null | undefined): string => {
            if (status === null || status === undefined) return '';
            return String(status).trim().toLowerCase();
          };
          
          // Helper function to normalize user_category_id
          // const normalizeUserCategoryId = (categoryId: string | number | null | undefined): number | null => {
          //   if (categoryId === null || categoryId === undefined) return null;
          //   if (typeof categoryId === 'number') return categoryId;
          //   if (typeof categoryId === 'string') {
          //     const parsed = parseInt(categoryId, 10);
          //     return isNaN(parsed) ? null : parsed;
          //   }
          //   return null;
          // };
          
          const calculatedStats: DCStats = {
            totalProposals: proposalsData.length,
            // Pending for Accept at RFO/DFO: work_status = 0 (or '0' as string)
            pendingForAcceptAtRFODFO: proposalsData.filter((p: Proposal) => {
              const status = p.work_status;
              // Check for 0 (number) or '0' (string) - work_status is varchar(50) so could be either
              return (typeof status === 'number' && status === 0) || 
                     (typeof status === 'string' && status.trim() === '0') ||
                     normalizeWorkStatus(status) === '0';
            }).length,
            // Rejected by RFO/DFO: work_status = 'rejected'
            rejectedByRFODFO: proposalsData.filter((p: Proposal) => {
              const status = normalizeWorkStatus(p.work_status);
              return status === 'rejected';
            }).length,
            // Pending at RFO/DFO: work_status = 'under review'
            pendingAtRFODFO: proposalsData.filter((p: Proposal) => {
              const status = normalizeWorkStatus(p.work_status);
              return status === 'under review';
            }).length,
            // Pending at PO: work_status = 'pending at po'
            pendingAtPO: proposalsData.filter((p: Proposal) => {
              const status = normalizeWorkStatus(p.work_status);
              return status === 'pending at po';
            }).length,
            // Pending at DLC: work_status = 'pending at dlc'
            pendingAtDLC: proposalsData.filter((p: Proposal) => {
              const status = normalizeWorkStatus(p.work_status);
              return status === 'pending at dlc';
            }).length,
            // DLC Completed: work_status = 'forwarded' (or legacy: completed, complete, approved, sanctioned)
            dlcCompleted: proposalsData.filter((p: Proposal) => {
              const status = normalizeWorkStatus(p.work_status);
              return status === 'forwarded' ||
                     status === 'completed' ||
                     status === 'complete' ||
                     status === 'approved' ||
                     status === 'sanctioned';
            }).length
          };
          
          setStats(calculatedStats);
        }
        setActionRequiredProposals(actionRequired);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch DC data:', response.status, errorData);
        toast.error('Failed to fetch dashboard data');
        setProposals([]);
        setActionRequiredProposals([]);
      }
    } catch (error) {
      console.error('Error fetching DC data:', error);
      toast.error('Failed to fetch dashboard data');
      setProposals([]);
      setActionRequiredProposals([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to normalize work_status (same as API)
  // work_status is varchar(50) in database - must check exact string values
  const normalizeWorkStatus = (status: string | number | null | undefined): string => {
    if (status === null || status === undefined) return '';
    return String(status).trim().toLowerCase();
  };

  // Calculate chart data for proposals by category
  const chartData = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];

    // Group proposals by category
    const categoryMap = new Map<string, { complete: number; pending: number; total: number }>();

    proposals.forEach((proposal) => {
      const categoryName = proposal.proposal_category_name || 'Unknown';
      const status = normalizeWorkStatus(proposal.work_status);
      
      // Determine if completed
      const isCompleted = 
        status === 'forwarded' ||
        status === 'completed' ||
        status === 'complete' ||
        status === 'approved' ||
        status === 'sanctioned';

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { complete: 0, pending: 0, total: 0 });
      }

      const categoryData = categoryMap.get(categoryName)!;
      categoryData.total++;
      
      if (isCompleted) {
        categoryData.complete++;
      } else {
        categoryData.pending++;
      }
    });

    // Convert to array format for chart
    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        fullName: name,
        Complete: data.complete,
        Pending: data.pending,
        Total: data.total,
      }))
      .sort((a, b) => b.Total - a.Total); // Sort by total descending
  }, [proposals]);

  // Pie chart data for overall status
  const pieChartData = useMemo(() => {
    if (!proposals || proposals.length === 0) return [];

    let complete = 0;
    let pending = 0;

    proposals.forEach((proposal) => {
      const status = normalizeWorkStatus(proposal.work_status);
      const isCompleted = 
        status === 'forwarded' ||
        status === 'completed' ||
        status === 'complete' ||
        status === 'approved' ||
        status === 'sanctioned';

      if (isCompleted) {
        complete++;
      } else {
        pending++;
      }
    });

    return [
      { name: 'Completed', value: complete, color: '#10b981' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
    ];
  }, [proposals]);
  
  // Helper function to normalize user_category_id
  // const normalizeUserCategoryId = (categoryId: string | number | null | undefined): number | null => {
  //   if (categoryId === null || categoryId === undefined) return null;
  //   if (typeof categoryId === 'number') return categoryId;
  //   if (typeof categoryId === 'string') {
  //     const parsed = parseInt(categoryId, 10);
  //     return isNaN(parsed) ? null : parsed;
  //   }
  //   return null;
  // };

  // Function to get filtered proposals based on card type
  // Using exact database work_status values: 'pending', 'under review', 'correction needed', 'pending at dlc', 'rejected', 'forwarded'
  const getFilteredProposals = (cardType: string): Proposal[] => {
    switch (cardType) {
      case 'total':
        return proposals;
      case 'pendingForAccept':
        // Pending for Accept: work_status = 0 (or '0' as string)
        return proposals.filter(p => {
          const status = p.work_status;
          // Check for 0 (number) or '0' (string) - work_status is varchar(50) so could be either
          return (typeof status === 'number' && status === 0) || 
                 (typeof status === 'string' && status.trim() === '0') ||
                 normalizeWorkStatus(status) === '0';
        });
      case 'rejected':
        // Rejected: work_status = 'rejected'
        return proposals.filter(p => {
          const status = normalizeWorkStatus(p.work_status);
          return status === 'rejected';
        });
      case 'pendingAtRFODFO':
        // Pending (Under Review): work_status = 'under review'
        return proposals.filter(p => {
          const status = normalizeWorkStatus(p.work_status);
          return status === 'under review';
        });
      case 'pendingAtPO':
        // Pending at PO: work_status = 'pending at po'
        return proposals.filter(p => {
          const status = normalizeWorkStatus(p.work_status);
          return status === 'pending at po';
        });
      case 'pendingAtDLC':
        // DLC - Pending at DLC: work_status = 'pending at dlc'
        return proposals.filter(p => {
          const status = normalizeWorkStatus(p.work_status);
          return status === 'pending at dlc';
        });
      case 'dlcCompleted':
        // DLC Completed: work_status = 'forwarded' (or legacy: completed, complete, approved, sanctioned)
        return proposals.filter(p => {
          const status = normalizeWorkStatus(p.work_status);
          return status === 'forwarded' ||
                 status === 'completed' ||
                 status === 'complete' ||
                 status === 'approved' ||
                 status === 'sanctioned';
        });
      default:
        return [];
    }
  };

  // Handle card click to show modal
  const handleCardClick = (cardType: string, title: string) => {
    const filtered = getFilteredProposals(cardType);
    setModalProposals(filtered);
    setModalTitle(title);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setModalProposals([]);
    setModalTitle('');
  };

  const exportToPDF = (reportType: string, data: Proposal[]) => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    
    // Header
    doc.setFontSize(16);
    doc.text('District Collector Dashboard Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Report Type: ${reportType}`, 20, 30);
    doc.text(`Generated on: ${currentDate}`, 20, 40);
    
    // Table headers based on report type
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    
    switch (reportType) {
      case 'Total Proposals':
        headers = ['Proposal ID', 'Category', 'Village', 'Status', 'Created Date'];
        rows = data.map(p => [
          p.proposal_id,
          p.proposal_category_name,
          p.village_name,
          p.work_status,
          new Date(p.created_at).toLocaleDateString()
        ]);
        break;
      case 'Action Required':
        headers = ['Proposal ID', 'Village', 'Status', 'Days Pending', 'Months Pending'];
        rows = data.map(p => [
          p.proposal_id,
          p.village_name,
          p.work_status,
          p.days_pending || 0,
          p.months_pending || 0
        ]);
        break;
      default:
        headers = ['Proposal ID', 'Category', 'Status', 'Date'];
        rows = data.map(p => [
          p.proposal_id,
          p.proposal_category_name,
          p.work_status,
          new Date(p.created_at).toLocaleDateString()
        ]);
    }
    
    // Add table
    (doc as unknown as typeof jsPDF & { autoTable: (options: Record<string, unknown>) => void }).autoTable({
      head: [headers],
      body: rows,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // Save PDF
    doc.save(`DC_${reportType.replace(/\s+/g, '_')}_Report_${currentDate}.pdf`);
  };

  if (loading) {
    return <Loader />;
  }

  return (
<div className="container mx-auto min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 sm:px-6 lg:px-1">

      <motion.div
        className="space-y-8 p-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with Refresh Button */}
        <motion.div 
          variants={itemVariants}
          className="flex justify-between items-center mb-4"
        >
          <h1 className="text-3xl font-bold text-gray-800">District Collector Dashboard</h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Refresh Data"
          >
            <svg 
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </motion.div>
      
        {/* Enhanced Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
          {/* Total Proposals Card */}
          <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            onClick={() => handleCardClick('total', 'Total Proposals')}
            className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <FiFileText className="w-6 h-6 text-white" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => exportToPDF('Total Proposals', proposals)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Export PDF"
                >
                  <FiDownload className="w-4 h-4" />
                </motion.button>
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Total Proposals</p>
              <motion.p 
                className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5, type: "spring" as const, stiffness: 100 }}
              >
                {stats.totalProposals}
              </motion.p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          </motion.div>

          {/* Pending for Accept at RFO/DFO Card */}
          <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            onClick={() => handleCardClick('pendingForAccept', 'Pending for Accept at RFO/DFO')}
            className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-lg">
                  <FiClock className="w-6 h-6 text-white" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    exportToPDF('Pending for Accept at RFO/DFO', getFilteredProposals('pendingForAccept'));
                  }}
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                  title="Export PDF"
                >
                  <FiDownload className="w-4 h-4" />
                </motion.button>
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pending for Accept</p>
              <p className="text-xs text-gray-500 mb-2">at RFO/DFO</p>
              <motion.p 
                className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" as const, stiffness: 100 }}
              >
                {stats.pendingForAcceptAtRFODFO}
              </motion.p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-amber-500"></div>
          </motion.div>

          {/* Rejected by RFO/DFO Card */}
          <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            onClick={() => handleCardClick('rejected', 'Rejected by RFO/DFO')}
            className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                  <FiXCircle className="w-6 h-6 text-white" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    exportToPDF('Rejected by RFO/DFO', getFilteredProposals('rejected'));
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Export PDF"
                >
                  <FiDownload className="w-4 h-4" />
                </motion.button>
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Rejected</p>
              <p className="text-xs text-gray-500 mb-2">by RFO/DFO</p>
              <motion.p 
                className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5, type: "spring" as const, stiffness: 100 }}
              >
                {stats.rejectedByRFODFO}
              </motion.p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-500"></div>
          </motion.div>

          {/* Pending at RFO/DFO Card */}
          <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            onClick={() => handleCardClick('pendingAtRFODFO', 'Pending at RFO/DFO (Under Review)')}
            className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                  <FiAlertTriangle className="w-6 h-6 text-white" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    exportToPDF('Pending at RFO/DFO (Under Review)', getFilteredProposals('pendingAtRFODFO'));
                  }}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Export PDF"
                >
                  <FiDownload className="w-4 h-4" />
                </motion.button>
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pending</p>
              <p className="text-xs text-gray-500 mb-2">at RFO/DFO (Under Review)</p>
              <motion.p 
                className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5, type: "spring" as const, stiffness: 100 }}
              >
                {stats.pendingAtRFODFO}
              </motion.p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600"></div>
          </motion.div>

          {/* Pending at PO Card */}
          <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            onClick={() => handleCardClick('pendingAtPO', 'Pending at PO')}
            className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg">
                  <FiClock className="w-6 h-6 text-white" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    exportToPDF('Pending at PO', getFilteredProposals('pendingAtPO'));
                  }}
                  className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  title="Export PDF"
                >
                  <FiDownload className="w-4 h-4" />
                </motion.button>
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pending</p>
              <p className="text-xs text-gray-500 mb-2">at PO</p>
              <motion.p 
                className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5, type: "spring" as const, stiffness: 100 }}
              >
                {stats.pendingAtPO}
              </motion.p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
          </motion.div>

          {/* Pending at DLC Card */}
          <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            onClick={() => handleCardClick('pendingAtDLC', 'Pending at DLC')}
            className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                  <FiClock className="w-6 h-6 text-white" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    exportToPDF('Pending at DLC', getFilteredProposals('pendingAtDLC'));
                  }}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Export PDF"
                >
                  <FiDownload className="w-4 h-4" />
                </motion.button>
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pending</p>
              <p className="text-xs text-gray-500 mb-2">at DLC</p>
              <motion.p 
                className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5, type: "spring" as const, stiffness: 100 }}
              >
                {stats.pendingAtDLC}
              </motion.p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-violet-500"></div>
          </motion.div>

          {/* DLC Completed Card */}
          <motion.div
            variants={cardHoverVariants}
            initial="rest"
            whileHover="hover"
            onClick={() => handleCardClick('dlcCompleted', 'DLC Completed')}
            className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <FiCheckCircle className="w-6 h-6 text-white" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    exportToPDF('DLC Completed', getFilteredProposals('dlcCompleted'));
                  }}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Export PDF"
                >
                  <FiDownload className="w-4 h-4" />
                </motion.button>
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">DLC Completed</p>
              <motion.p 
                className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.5, type: "spring" as const, stiffness: 100 }}
              >
                {stats.dlcCompleted}
              </motion.p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
          </motion.div>
        </motion.div>

        {/* Proposal Type Wise Chart Section */}
        <motion.div 
          variants={itemVariants} 
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        >
          {/* Section Header */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <FiBarChart2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Proposal Analytics
                  </h2>
                  <p className="text-indigo-100 text-sm">
                    Proposal type wise status breakdown
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Content */}
          <div className="p-6">
            {chartData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart - Category Wise */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FiBarChart2 className="w-5 h-5 text-indigo-600" />
                    Proposals by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={chartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                        formatter={(value: number, name: string) => [value, name]}
                        labelFormatter={(label) => `Category: ${label}`}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                      />
                      <Bar 
                        dataKey="Complete" 
                        fill="#10b981" 
                        name="Completed"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar 
                        dataKey="Pending" 
                        fill="#f59e0b" 
                        name="Pending"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart - Overall Status */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                    Overall Status
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                        formatter={(value: number) => [value, 'Count']}
                      />
                      <Legend 
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Summary Stats */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Completed</span>
                      <span className="text-lg font-bold text-green-900 dark:text-green-200">
                        {pieChartData.find(d => d.name === 'Completed')?.value || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Pending</span>
                      <span className="text-lg font-bold text-amber-900 dark:text-amber-200">
                        {pieChartData.find(d => d.name === 'Pending')?.value || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total</span>
                      <span className="text-lg font-bold text-blue-900 dark:text-blue-200">
                        {proposals.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <FiBarChart2 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No chart data available</p>
                <p className="text-sm text-gray-400 mt-1">Proposals data is loading or not available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Action Required Section */}
        <motion.div 
          variants={itemVariants} 
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
        >
          {/* Section Header */}
          <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <FiAlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Action Required
                  </h2>
                  <p className="text-pink-100 text-sm">
                    Proposals pending from more than 1 month ({actionRequiredProposals.length} found)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-pink-100 bg-white/20 px-3 py-1 rounded">
                    Debug: {actionRequiredProposals.length} proposals
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => exportToPDF('Action Required', actionRequiredProposals)}
                  className="flex items-center gap-2 bg-white text-rose-600 px-5 py-3 rounded-xl font-semibold hover:bg-rose-50 transition-colors shadow-lg"
                >
                  <FiDownload className="w-5 h-5" />
                  Export PDF
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Enhanced Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FiFileText className="w-4 h-4" />
                      Proposal ID
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FiMapPin className="w-4 h-4" />
                      Proposal Type
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Taluka
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Gram Panchayat
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Village
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      Proposal Date
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4" />
                      Days Pending
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Pending At
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    View Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {actionRequiredProposals && actionRequiredProposals.length > 0 ? (
                  actionRequiredProposals.map((proposal, index) => {
                    // Calculate days and months pending if not available
                    let daysPending = Number(proposal.days_pending) || 0;
                    let monthsPending = Number(proposal.months_pending) || 0;
                    
                    if (daysPending === 0 && proposal.created_at) {
                      const createdDate = new Date(proposal.created_at);
                      const now = new Date();
                      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
                      daysPending = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      monthsPending = Math.floor(daysPending / 30);
                    }
                    
                    return (
                    <motion.tr 
                      key={proposal.proposal_id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 transition-all duration-200 group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            #{proposal.proposal_id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-700">
                          {proposal.proposal_category_name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {proposal.taluka_name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {proposal.gp_name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {proposal.village_name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {new Date(proposal.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">
                          <FiClock className="w-3 h-3" />
                          {(() => {
                            const remainingDays = daysPending % 30;
                            
                            if (monthsPending > 0) {
                              return `${monthsPending} Month${monthsPending > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} Day${remainingDays > 1 ? 's' : ''}` : ''}`;
                            } else if (daysPending > 0) {
                              return `${daysPending} Day${daysPending > 1 ? 's' : ''}`;
                            } else {
                              return '0 Days';
                            }
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {proposal.user_name && proposal.user_category_name ? (
                            <span className="inline-flex px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-100 text-blue-800">
                              {proposal.user_name} - {proposal.user_category_name}
                            </span>
                          ) : proposal.user_name ? (
                            <span className="inline-flex px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-100 text-blue-800">
                              {proposal.user_name}
                            </span>
                          ) : (
                            <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-lg ${
                              proposal.work_status === 'Pending' || proposal.work_status === 'Pending at RFO/DFO' ? 
                                'bg-yellow-100 text-yellow-800' :
                              proposal.work_status === 'Under Review' ? 
                                'bg-blue-100 text-blue-800' :
                              proposal.work_status === 'pending at DLC' ? 
                                'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                              {proposal.forward_to || proposal.work_status || 'N/A'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(proposal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(proposal)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </button>
                      </td>
                    </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-100 rounded-full">
                          <FiCheckCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No action required proposals</p>
                        <p className="text-sm text-gray-400">All proposals are up to date</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Modal for showing filtered proposals */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{modalTitle}</h2>
                  <p className="text-blue-100 mt-1">{modalProposals.length} proposal(s) found</p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => exportToPDF(modalTitle, modalProposals)}
                    className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    <FiDownload className="w-5 h-5" />
                    Export PDF
                  </motion.button>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {modalProposals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <FiFileText className="w-4 h-4" />
                              Proposal ID
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <FiMapPin className="w-4 h-4" />
                              Taluka
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            GP
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Village
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <FiCalendar className="w-4 h-4" />
                              Created Date
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            User
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {modalProposals.map((proposal, index) => (
                          <motion.tr
                            key={proposal.proposal_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-bold text-gray-900">
                                #{proposal.proposal_id}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-700">
                                {proposal.proposal_category_name || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">
                                {proposal.taluka_name || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">
                                {proposal.gp_name || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">
                                {proposal.village_name || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">
                                {new Date(proposal.created_at).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-lg ${
                                proposal.work_status?.toLowerCase() === 'rejected' ? 
                                  'bg-red-100 text-red-800' :
                                proposal.work_status?.toLowerCase() === 'pending at dlc' ? 
                                  'bg-purple-100 text-purple-800' :
                                proposal.work_status?.toLowerCase() === 'under review' ? 
                                  'bg-blue-100 text-blue-800' :
                                proposal.work_status?.toLowerCase() === 'completed' || 
                                proposal.work_status?.toLowerCase() === 'complete' ||
                                proposal.work_status?.toLowerCase() === 'approved' ||
                                proposal.work_status?.toLowerCase() === 'sanctioned' ? 
                                  'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                                {proposal.work_status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">
                                {proposal.user_name || 'N/A'}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <FiFileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No proposals found</p>
                    <p className="text-sm text-gray-400 mt-1">No data available for this category</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Proposal Details Modal - Custom Modal */}
      {isDetailsModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
          onClick={handleCloseDetailsModal}
        >
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            style={{ zIndex: 99998 }}
          />
          
          {/* Modal Content */}
          <div 
            className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
            style={{ zIndex: 99999 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Proposal Details</h3>
            <button
              onClick={handleCloseDetailsModal}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
            {detailsProposal && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FiFileText className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Proposal ID</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">#{detailsProposal.proposal_id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{detailsProposal.proposal_category_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                      <div className="mt-1">{getStatusBadge(detailsProposal)}</div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Days Pending</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{detailsProposal.days_pending || 0} days</p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-lg border border-green-200 dark:border-green-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FiMapPin className="w-5 h-5 text-green-600" />
                    Location Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taluka</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{detailsProposal.taluka_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Grampanchayat</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{detailsProposal.gp_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Village</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{detailsProposal.village_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Proposal Details */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FiFileText className="w-5 h-5 text-purple-600" />
                    Proposal Details
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Land Details</p>
                      <p className="text-base text-gray-900 dark:text-white mt-1">{detailsProposal.land_details || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Beneficiaries</p>
                      <p className="text-base text-gray-900 dark:text-white mt-1">{detailsProposal.beneficiaries || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Number of Trees</p>
                      <p className="text-base text-gray-900 dark:text-white mt-1">{detailsProposal.number_of_tree || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FiFileText className="w-5 h-5 text-orange-600" />
                    Submitted By
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User Name</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{detailsProposal.user_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User Category</p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{detailsProposal.user_category_name || detailsProposal.user_category_id || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {detailsProposal.remarks && (
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 p-6 rounded-lg border border-red-200 dark:border-red-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FiAlertTriangle className="w-5 h-5 text-red-600" />
                      Remarks
                    </h4>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                        {detailsProposal.remarks}
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <FiCalendar className="w-5 h-5 text-gray-600" />
                    Status Timeline
                  </h4>
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600 dark:text-gray-400">Loading timeline...</span>
                    </div>
                  ) : statusHistory.length > 0 ? (
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-green-400"></div>
                      
                      {/* Timeline Items */}
                      <div className="space-y-6 relative">
                        {statusHistory.map((item, index) => {
                          // Calculate time differences
                          const currentDate = new Date(item.date);
                          const nextItem = statusHistory[index + 1];
                          const nextDate = nextItem ? new Date(nextItem.date) : new Date(); // Use current date if it's the last item
                          // const now = new Date();
                          
                          // Calculate duration in this status (days)
                          const durationInStatus = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                          
                          // Calculate gap from previous status (if not first item)
                          const prevItem = index > 0 ? statusHistory[index - 1] : null;
                          const prevDate = prevItem ? new Date(prevItem.date) : null;
                          const gapFromPrevious = prevDate ? Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
                          
                          // Format duration text
                          const formatDuration = (days: number) => {
                            if (days === 0) return 'Same day';
                            if (days === 1) return '1 day';
                            if (days < 30) return `${days} days`;
                            const months = Math.floor(days / 30);
                            const remainingDays = days % 30;
                            if (remainingDays === 0) return `${months} month${months > 1 ? 's' : ''}`;
                            return `${months} month${months > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
                          };

                          // Determine icon and color based on action/status
                          const getIconAndColor = () => {
                            if (item.action === 'Proposal Created') {
                              return {
                                icon: (
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                ),
                                bgColor: 'bg-blue-500',
                              };
                            } else if (item.action.includes('Sanctioned') || item.status === 'complete' || item.status === 'completed') {
                              return {
                                icon: (
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ),
                                bgColor: 'bg-gradient-to-br from-green-500 to-emerald-600',
                              };
                            } else if (item.action.includes('Sent Back') || item.status === 'correction needed') {
                              return {
                                icon: (
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                ),
                                bgColor: 'bg-gradient-to-br from-orange-500 to-red-600',
                              };
                            } else if (item.action.includes('Rejected')) {
                              return {
                                icon: (
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                ),
                                bgColor: 'bg-gradient-to-br from-red-500 to-rose-600',
                              };
                            } else if (item.action.includes('Forwarded')) {
                              return {
                                icon: (
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                  </svg>
                                ),
                                bgColor: 'bg-gradient-to-br from-purple-500 to-indigo-600',
                              };
                            } else {
                              return {
                                icon: (
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ),
                                bgColor: 'bg-gradient-to-br from-purple-500 to-indigo-600',
                              };
                            }
                          };

                          const { icon, bgColor } = getIconAndColor();
                          
                          // Create a proposal object for status badge
                          const statusProposal: Proposal = {
                            ...detailsProposal!,
                            work_status: item.status,
                          };

                          return (
                            <div key={item.id} className="flex items-start gap-4 relative">
                              <div className={`flex-shrink-0 w-12 h-12 rounded-full ${bgColor} flex items-center justify-center shadow-lg z-10 ${item.isCurrent ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
                                {icon}
                              </div>
                              <div className={`flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg border ${item.isCurrent ? 'border-blue-300 dark:border-blue-600 shadow-md' : 'border-gray-200 dark:border-gray-700'} shadow-sm`}>
                                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {item.action !== 'Proposal Created' && (
                                      <div className="mt-1">{getStatusBadge(statusProposal)}</div>
                                    )}
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                      item.action === 'Proposal Created' 
                                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                        : item.isCurrent
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                    }`}>
                                      {item.action}
                                    </span>
                                    {item.isCurrent && (
                                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {new Date(item.date).toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                
                                {/* Time Information Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                                  {/* Gap from Previous Status */}
                                  {gapFromPrevious !== null && gapFromPrevious > 0 && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-0.5">Gap from Previous</p>
                                      <p className="text-xs font-bold text-amber-900 dark:text-amber-200">{formatDuration(gapFromPrevious)}</p>
                                    </div>
                                  )}
                                  
                                  {/* Duration in Status */}
                                  <div className={`border rounded-lg p-2 ${
                                    item.isCurrent 
                                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                                  }`}>
                                    <p className={`text-xs font-medium mb-0.5 ${
                                      item.isCurrent 
                                        ? 'text-blue-700 dark:text-blue-300' 
                                        : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                      {item.isCurrent ? 'Pending Since' : 'Duration in Status'}
                                    </p>
                                    <p className={`text-xs font-bold ${
                                      item.isCurrent 
                                        ? 'text-blue-900 dark:text-blue-200' 
                                        : 'text-gray-900 dark:text-gray-200'
                                    }`}>
                                      {formatDuration(durationInStatus)}
                                    </p>
                                  </div>
                                  
                                  {/* Next Update Date */}
                                  {nextItem && (
                                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2">
                                      <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-0.5">Next Update</p>
                                      <p className="text-xs font-bold text-purple-900 dark:text-purple-200">
                                        {new Date(nextItem.date).toLocaleDateString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </p>
                                    </div>
                                  )}
                                  {!nextItem && item.isCurrent && (
                                    <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Next Update</p>
                                      <p className="text-xs font-bold text-gray-900 dark:text-gray-200">Pending</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {item.action === 'Proposal Created' 
                                      ? 'Proposal was created and started'
                                      : `Status: ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}`
                                    }
                                  </p>
                                  {item.user_name && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      By: <span className="font-medium text-gray-700 dark:text-gray-300">{item.user_name}</span>
                                    </p>
                                  )}
                                  {item.remarks && (
                                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks:</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400 break-words">
                                        {item.remarks}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>No timeline data available</p>
                    </div>
                  )}
                </div>

                {/* PDF Link */}
                {detailsProposal.pdf && (
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-indigo-200 dark:border-indigo-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FiFileText className="w-5 h-5 text-indigo-600" />
                      Documents
                    </h4>
                    <a
                      href={detailsProposal.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <FiDownload className="w-5 h-5" />
                      View PDF Document
                    </a>
                  </div>
                )}
              </div>
            )}
            </div>

            {/* Footer - Fixed */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
            <button
              onClick={handleCloseDetailsModal}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors font-medium shadow-sm hover:shadow-md"
            >
              Close
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}