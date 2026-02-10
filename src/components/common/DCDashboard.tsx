"use client";

import React, { useState, useEffect } from "react";
import Loader from "@/common/Loader";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
    pendingAtDLC: 0,
    dlcCompleted: 0,
  });
  const [actionRequiredProposals, setActionRequiredProposals] = useState<Proposal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalProposals, setModalProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    fetchDCData();
  }, []);

  // Refresh function
  const handleRefresh = () => {
    fetchDCData();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
                transition={{ delay: 0.5, duration: 0.5, type: "spring" as const, stiffness: 100 }}
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
                transition={{ delay: 0.6, duration: 0.5, type: "spring" as const, stiffness: 100 }}
              >
                {stats.dlcCompleted}
              </motion.p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
          </motion.div>
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
                      </td>
                    </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
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
    </div>
  );
}