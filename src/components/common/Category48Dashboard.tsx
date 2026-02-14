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
  FiMapPin,
  FiCalendar,
  FiX,
  FiSend,
  FiArrowLeft,
  FiEye,
  // FiUser,
  FiInfo,
} from "react-icons/fi";

interface Proposal {
  proposal_id: number;
  proposal_category_id: number;
  proposal_category_name: string;
  work_status: string;
  forward_to: string;
  user_category_id: number;
  user_name: string;
  taluka_id: number;
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

interface Category48Stats {
  totalProposals: number;
  pendingForAcceptAtRFODFO: number;
  rejectedByRFODFO: number;
  pendingAtRFODFO: number;
  pendingAtPO: number;
  pendingAtDLC: number;
  dlcCompleted: number;
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

export default function Category48Dashboard() {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<Category48Stats>({
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
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showSendBackModal, setShowSendBackModal] = useState(false);
  const [sendBackReason, setSendBackReason] = useState('');
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [dlcUsers, setDlcUsers] = useState<Array<{ user_id: number | string; name: string }>>([]);
  const [selectedDlcUser, setSelectedDlcUser] = useState<string>('');
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
  const [allUsers, setAllUsers] = useState<Array<{ user_id: number | string; name: string }>>([]);

  useEffect(() => {
    // Get category_id from sessionStorage
    const catId = sessionStorage.getItem('category_id');
    setCategoryId(catId);

    if (catId === '4' || catId === '8') {
      fetchDashboardData(catId);
      fetchDLCUsers();
      fetchAllUsers();
    } else {
      toast.error('Invalid category. This dashboard is for category 4 or 8 only.');
      setLoading(false);
    }
  }, []);

  const fetchAllUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const users = await response.json();

        console.log('Fetched all users:', users.length);
        // Map users to ensure we have user_id and name
        const mappedUsers = users.map((u: { user_id: number; name: string }) => ({
          user_id: u.user_id,
          name: u.name || 'Unknown User'
        }));
        setAllUsers(mappedUsers);
        console.log('Mapped users for lookup:', mappedUsers.length);
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  const getUserNameById = (userId: string | number | null | undefined): string => {
    if (!userId) return 'N/A';
    
    // Try to find user by converting both to string and number
    const userIdStr = String(userId).trim();
    const userIdNum = typeof userId === 'number' ? userId : parseInt(userIdStr, 10);
    
    const user = allUsers.find(u => {
      const uIdStr = String(u.user_id).trim();
      const uIdNum = typeof u.user_id === 'number' ? u.user_id : parseInt(uIdStr, 10);
      return uIdStr === userIdStr || uIdNum === userIdNum || 
             (isNaN(userIdNum) === false && isNaN(uIdNum) === false && uIdNum === userIdNum);
    });
    
    if (user && user.name) {
      return user.name;
    }
    
    // If user not found, log for debugging
    console.warn('User not found for ID:', userId, 'Available users:', allUsers.length);
    return 'Loading...';
  };

  const fetchDLCUsers = async () => {
    try {
      // Fetch all active users first
      const response = await fetch('/api/users/forward-list');
      if (response.ok) {
        const users = await response.json();
        console.log('All users fetched:', users.length);
        console.log('Users with category 35:', users.filter((u: { user_category_id: number }) => u.user_category_id === 35));
        
        // Filter for DLC users (category_id = 35)
        const dlcUsersList = users.filter((u: { user_category_id: number }) => u.user_category_id === 35);
        console.log('DLC users found:', dlcUsersList.length, dlcUsersList);
        
        if (dlcUsersList.length > 0) {
          setDlcUsers(dlcUsersList);
          setSelectedDlcUser(dlcUsersList[0].user_id.toString());
        } else {
          // If no DLC users found, try with category_id=24 which triggers DLC filter in API
          const response24 = await fetch('/api/users/forward-list?category_id=24');
          if (response24.ok) {
            const users24 = await response24.json();
            console.log('Users from category_id=24:', users24);
            if (users24.length > 0) {
              setDlcUsers(users24);
              setSelectedDlcUser(users24[0].user_id.toString());
            } else {
              console.warn('No DLC users found even with category_id=24');
              setDlcUsers([]);
            }
          }
        }
      } else {
        console.error('Failed to fetch users:', response.status);
        // Fallback: try with category_id=24
        const response24 = await fetch('/api/users/forward-list?category_id=24');
        if (response24.ok) {
          const users24 = await response24.json();
          if (users24.length > 0) {
            setDlcUsers(users24);
            setSelectedDlcUser(users24[0].user_id.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching DLC users:', error);
      toast.error('Failed to load DLC users. Please refresh the page.');
    }
  };

  // Refresh function
  const handleRefresh = () => {
    if (categoryId) {
      fetchDashboardData(categoryId);
    }
  };

  const fetchDashboardData = async (catId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/category-4-8-dashboard?category_id=${catId}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`Category ${catId} Dashboard Data:`, {
          proposalsCount: data.proposals?.length || 0,
          stats: data.stats,
          actionRequiredCount: data.actionRequired?.length || 0,
        });

        const actionRequired = data.actionRequired || [];
        const proposalsData = data.proposals || [];
        setProposals(proposalsData);

        // Always use stats from API if available
        if (data.stats && typeof data.stats === 'object') {
          const newStats: Category48Stats = {
            totalProposals: Number(data.stats.totalProposals) || 0,
            pendingForAcceptAtRFODFO: Number(data.stats.pendingForAcceptAtRFODFO) || 0,
            rejectedByRFODFO: Number(data.stats.rejectedByRFODFO) || 0,
            pendingAtRFODFO: Number(data.stats.pendingAtRFODFO) || 0,
            pendingAtPO: Number(data.stats.pendingAtPO) || 0,
            pendingAtDLC: Number(data.stats.pendingAtDLC) || 0,
            dlcCompleted: Number(data.stats.dlcCompleted) || 0,
          };
          console.log('Setting stats from API:', newStats);
          setStats(newStats);
        } else {
          // Fallback calculation
          const normalizeWorkStatus = (status: string | number | null | undefined): string => {
            if (status === null || status === undefined) return '';
            return String(status).trim().toLowerCase();
          };

          const calculatedStats: Category48Stats = {
            totalProposals: proposalsData.length,
            pendingForAcceptAtRFODFO: proposalsData.filter((p: Proposal) => {
              const status = p.work_status;
              return (typeof status === 'number' && status === 0) ||
                (typeof status === 'string' && status.trim() === '0') ||
                normalizeWorkStatus(status) === '0';
            }).length,
            rejectedByRFODFO: proposalsData.filter((p: Proposal) => {
              const status = normalizeWorkStatus(p.work_status);
              return status === 'rejected';
            }).length,
            pendingAtRFODFO: proposalsData.filter((p: Proposal) => {
              const status = normalizeWorkStatus(p.work_status);
              return status === 'under review';
            }).length,
            pendingAtPO: proposalsData.filter((p: Proposal) => {
              const status = normalizeWorkStatus(p.work_status);
              return status === 'pending at po';
            }).length,
            pendingAtDLC: proposalsData.filter((p: Proposal) => {
              const status = normalizeWorkStatus(p.work_status);
              return status === 'pending at dlc';
            }).length,
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
        console.error('Failed to fetch dashboard data:', response.status, errorData);
        toast.error('Failed to fetch dashboard data');
        setProposals([]);
        setActionRequiredProposals([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
      setProposals([]);
      setActionRequiredProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeWorkStatus = (status: string | number | null | undefined): string => {
    if (status === null || status === undefined) return '';
    return String(status).trim().toLowerCase();
  };

  const getFilteredProposals = (cardType: string): Proposal[] => {
    switch (cardType) {
      case 'total':
        return proposals;
      case 'pendingForAccept':
        return proposals.filter(p => {
          const status = p.work_status;
          return (typeof status === 'number' && status === 0) ||
            (typeof status === 'string' && status.trim() === '0') ||
            normalizeWorkStatus(status) === '0';
        });
      case 'rejected':
        return proposals.filter(p => {
          const status = normalizeWorkStatus(p.work_status);
          return status === 'rejected';
        });
      case 'pendingAtRFODFO':
        return proposals.filter(p => {
          const status = normalizeWorkStatus(p.work_status);
          return status === 'under review';
        });
      case 'pendingAtPO':
        return proposals.filter(p => {
          const status = normalizeWorkStatus(p.work_status);
          return status === 'pending at po';
        });
      case 'pendingAtDLC':
        return proposals.filter(p => {
          const status = normalizeWorkStatus(p.work_status);
          return status === 'pending at dlc';
        });
      case 'dlcCompleted':
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

  const handleCardClick = (cardType: string, title: string) => {
    const filtered = getFilteredProposals(cardType);
    setModalProposals(filtered);
    setModalTitle(title);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalProposals([]);
    setModalTitle('');
  };

  const handleForward = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowForwardModal(true);
  };

  const handleSendBack = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setSendBackReason('');
    setShowSendBackModal(true);
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
    } else if (status === 'correction needed' || proposal.remarks?.includes('DLC Send Back') || proposal.remarks?.includes('Send Back')) {
      bgColor = 'bg-orange-100 text-orange-800';
      text = 'Send Back to RFO/DFO';
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

  const handleConfirmForward = async () => {
    if (!selectedProposal || !selectedDlcUser) {
      toast.error('Please select a DLC user to forward to');
      return;
    }

    try {
      setIsLoadingAction(true);
      const response = await fetch('/api/proposals/updatestatus', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposal_id: selectedProposal.proposal_id,
          work_status: 'pending at dlc',
          forward_to: selectedDlcUser,
          action: 'forward_to_dlc',
          reason: `Forwarded to DLC (Category ${categoryId})`
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Proposal forwarded to DLC successfully');
        setShowForwardModal(false);
        setSelectedProposal(null);
        // Refresh dashboard data
        if (categoryId) {
          fetchDashboardData(categoryId);
        }
      } else {
        toast.error(result.error || 'Failed to forward proposal');
      }
    } catch (error) {
      console.error('Error forwarding proposal:', error);
      toast.error('Failed to forward proposal');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleConfirmSendBack = async () => {
    if (!selectedProposal) {
      return;
    }

    if (!sendBackReason.trim()) {
      toast.error('Please provide a reason for sending back');
      return;
    }

    try {
      setIsLoadingAction(true);

      // Find a user with category_id = 24
      const response = await fetch('/api/users/forward-list?category_id=4');
      let category24UserId = null;

      if (response.ok) {
        const users = await response.json();
        const category24User = users.find((u: { user_category_id: number }) => u.user_category_id === 24);
        if (category24User) {
          category24UserId = category24User.user_id.toString();
        }
      }

      const updateResponse = await fetch('/api/proposals/updatestatus', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposal_id: selectedProposal.proposal_id,
          work_status: 'correction needed',
          forward_to: category24UserId,
          action: 'send_back',
          reason: `Send Back from Category ${categoryId}: ${sendBackReason}`
        }),
      });

      const result = await updateResponse.json();

      if (updateResponse.ok) {
        toast.success('Proposal sent back successfully');
        setShowSendBackModal(false);
        setSelectedProposal(null);
        setSendBackReason('');
        // Refresh dashboard data
        if (categoryId) {
          fetchDashboardData(categoryId);
        }
      } else {
        toast.error(result.error || 'Failed to send back proposal');
      }
    } catch (error) {
      console.error('Error sending back proposal:', error);
      toast.error('Failed to send back proposal');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const exportToPDF = (reportType: string, data: Proposal[]) => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();

    doc.setFontSize(16);
    doc.text(`Section 3(2) Dashboard Report - Category ${categoryId}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Report Type: ${reportType}`, 20, 30);
    doc.text(`Generated on: ${currentDate}`, 20, 40);

    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    switch (reportType) {
      case 'Total Proposals':
        headers = ['Proposal ID', 'Category', 'Taluka', 'Village', 'Status', 'Created Date'];
        rows = data.map(p => [
          p.proposal_id,
          p.proposal_category_name,
          p.taluka_name,
          p.village_name,
          p.work_status,
          new Date(p.created_at).toLocaleDateString()
        ]);
        break;
      case 'Action Required':
        headers = ['Proposal ID', 'Taluka', 'Village', 'Status', 'Days Pending', 'Months Pending'];
        rows = data.map(p => [
          p.proposal_id,
          p.taluka_name,
          p.village_name,
          p.work_status,
          p.days_pending || 0,
          p.months_pending || 0
        ]);
        break;
      default:
        headers = ['Proposal ID', 'Category', 'Taluka', 'Status', 'Date'];
        rows = data.map(p => [
          p.proposal_id,
          p.proposal_category_name,
          p.taluka_name,
          p.work_status,
          new Date(p.created_at).toLocaleDateString()
        ]);
    }

    (doc as unknown as typeof jsPDF & { autoTable: (options: Record<string, unknown>) => void }).autoTable({
      head: [headers],
      body: rows,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`Category${categoryId}_${reportType.replace(/\s+/g, '_')}_Report_${currentDate}.pdf`);
  };

  if (loading) {
    return <Loader />;
  }

  const categoryName = categoryId === '4' ? 'Category 4' : categoryId === '8' ? 'Category 8' : 'Category';

  return (
    <div  className="grid grid-cols-6 gap-4 md:gap-6">
      <div className="col-span-12 space-y-2 xl:col-span-7">


        <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
          <motion.div
            className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 md:p-6 lg:p-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header with Refresh Button */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4"
            >
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Section 3(2) Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{categoryName} - All Proposals</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                title="Refresh Data"
              >
                <svg
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">{loading ? 'Loading...' : 'Refresh'}</span>
                <span className="sm:hidden">{loading ? 'Loading' : 'Refresh'}</span>
              </button>
            </motion.div>

            {/* Enhanced Stats Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {/* Total Proposals Card */}
              <motion.div
                variants={cardHoverVariants}
                initial="rest"
                whileHover="hover"
                onClick={() => handleCardClick('total', 'Total Proposals')}
                className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-4 sm:p-5 md:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                      <FiFileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToPDF('Total Proposals', proposals);
                      }}
                      className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Export PDF"
                    >
                      <FiDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Total Proposals</p>
                  <motion.p
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, type: "spring" as const, stiffness: 100 }}
                    key={stats.totalProposals}
                  >
                    {stats.totalProposals || 0}
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
                <div className="relative p-4 sm:p-5 md:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-lg">
                      <FiClock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToPDF('Pending for Accept at RFO/DFO', getFilteredProposals('pendingForAccept'));
                      }}
                      className="p-1.5 sm:p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Export PDF"
                    >
                      <FiDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Pending for Accept</p>
                  <p className="text-xs text-gray-500 mb-1 sm:mb-2">at RFO/DFO</p>
                  <motion.p
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: "spring" as const, stiffness: 100 }}
                    key={stats.pendingForAcceptAtRFODFO}
                  >
                    {stats.pendingForAcceptAtRFODFO || 0}
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
                <div className="relative p-4 sm:p-5 md:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                      <FiXCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToPDF('Rejected by RFO/DFO', getFilteredProposals('rejected'));
                      }}
                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Export PDF"
                    >
                      <FiDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Rejected</p>
                  <p className="text-xs text-gray-500 mb-1 sm:mb-2">by RFO/DFO</p>
                  <motion.p
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5, type: "spring" as const, stiffness: 100 }}
                    key={stats.rejectedByRFODFO}
                  >
                    {stats.rejectedByRFODFO || 0}
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
                <div className="relative p-4 sm:p-5 md:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                      <FiAlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToPDF('Pending at RFO/DFO (Under Review)', getFilteredProposals('pendingAtRFODFO'));
                      }}
                      className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Export PDF"
                    >
                      <FiDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Pending</p>
                  <p className="text-xs text-gray-500 mb-1 sm:mb-2">at RFO/DFO (Under Review)</p>
                  <motion.p
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.5, type: "spring" as const, stiffness: 100 }}
                    key={stats.pendingAtRFODFO}
                  >
                    {stats.pendingAtRFODFO || 0}
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
                <div className="relative p-4 sm:p-5 md:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg">
                      <FiClock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToPDF('Pending at PO', getFilteredProposals('pendingAtPO'));
                      }}
                      className="p-1.5 sm:p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Export PDF"
                    >
                      <FiDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Pending</p>
                  <p className="text-xs text-gray-500 mb-1 sm:mb-2">at PO</p>
                  <motion.p
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5, type: "spring" as const, stiffness: 100 }}
                    key={stats.pendingAtPO}
                  >
                    {stats.pendingAtPO || 0}
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
                <div className="relative p-4 sm:p-5 md:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                      <FiClock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToPDF('Pending at DLC', getFilteredProposals('pendingAtDLC'));
                      }}
                      className="p-1.5 sm:p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Export PDF"
                    >
                      <FiDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">Pending</p>
                  <p className="text-xs text-gray-500 mb-1 sm:mb-2">at DLC</p>
                  <motion.p
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.5, type: "spring" as const, stiffness: 100 }}
                    key={stats.pendingAtDLC}
                  >
                    {stats.pendingAtDLC || 0}
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
                <div className="relative p-4 sm:p-5 md:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                      <FiCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        exportToPDF('DLC Completed', getFilteredProposals('dlcCompleted'));
                      }}
                      className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Export PDF"
                    >
                      <FiDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.button>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-2 uppercase tracking-wide">DLC Completed</p>
                  <motion.p
                    className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, duration: 0.5, type: "spring" as const, stiffness: 100 }}
                    key={stats.dlcCompleted}
                  >
                    {stats.dlcCompleted || 0}
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
              <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-4 sm:p-5 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <FiAlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                        Action Required
                      </h2>
                      <p className="text-pink-100 text-xs sm:text-sm">
                        Proposals pending from more than 1 month ({actionRequiredProposals.length} found)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => exportToPDF('Action Required', actionRequiredProposals)}
                      className="flex items-center justify-center gap-2 bg-white text-rose-600 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 rounded-xl font-semibold hover:bg-rose-50 transition-colors shadow-lg text-sm sm:text-base w-full sm:w-auto"
                    >
                      <FiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Export PDF</span>
                      <span className="sm:hidden">Export</span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Enhanced Table */}
              <div className="overflow-x-auto -mx-2 sm:-mx-3 md:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <FiFileText className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Proposal ID</span>
                          <span className="sm:hidden">ID</span>
                        </div>
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <FiMapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                          Proposal Type
                        </div>
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Taluka
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        Gram Panchayat
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                        Village
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <FiCalendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          Proposal Date
                        </div>
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <FiClock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Days Pending</span>
                          <span className="sm:hidden">Days</span>
                        </div>
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                        Pending At
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {actionRequiredProposals && actionRequiredProposals.length > 0 ? (
                      actionRequiredProposals.map((proposal, index) => {
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
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  #{proposal.proposal_id}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                              <span className="text-xs sm:text-sm font-medium text-gray-700">
                                {proposal.proposal_category_name || 'N/A'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <span className="text-xs sm:text-sm text-gray-600">
                                {proposal.taluka_name || 'N/A'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                              <span className="text-xs sm:text-sm text-gray-600">
                                {proposal.gp_name || 'N/A'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                              <span className="text-xs sm:text-sm text-gray-600">
                                {proposal.village_name || 'N/A'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                              <span className="text-xs sm:text-sm text-gray-600">
                                {new Date(proposal.created_at).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-100 text-red-700 rounded-lg text-xs sm:text-sm font-semibold">
                                <FiClock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="hidden sm:inline">
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
                                <span className="sm:hidden">
                                  {monthsPending > 0 ? `${monthsPending}M` : `${daysPending}D`}
                                </span>
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                              {(() => {
                                const status = normalizeWorkStatus(proposal.work_status);
                                const isCorrectionNeeded = status === 'correction needed' || 
                                                          proposal.remarks?.includes('Send Back') ||
                                                          proposal.remarks?.includes('DLC Send Back');
                                
                                let displayText = '';
                                let badgeClass = 'bg-gray-100 text-gray-800';
                                
                                if (isCorrectionNeeded) {
                                  displayText = 'Send Back to RFO/DFO';
                                  badgeClass = 'bg-orange-100 text-orange-800';
                                } else if (proposal.forward_to) {
                                  // If forwarded, show forwarded user name
                                  const forwardedUserName = getUserNameById(proposal.forward_to);
                                  displayText = `Forwarded to: ${forwardedUserName}`;
                                  badgeClass = 'bg-blue-100 text-blue-800';
                                } else if (proposal.work_status === 'Pending' || proposal.work_status === 'Pending at RFO/DFO') {
                                  displayText = proposal.user_name || 'Pending at RFO/DFO';
                                  badgeClass = 'bg-yellow-100 text-yellow-800';
                                } else if (proposal.work_status === 'Under Review' || status === 'under review') {
                                  displayText = proposal.user_name || 'Under Review';
                                  badgeClass = 'bg-blue-100 text-blue-800';
                                } else if (proposal.work_status === 'pending at DLC' || status === 'pending at dlc') {
                                  displayText = proposal.forward_to ? `Forwarded to: ${getUserNameById(proposal.forward_to)}` : 'Pending at DLC';
                                  badgeClass = 'bg-purple-100 text-purple-800';
                                } else {
                                  displayText = proposal.user_name || proposal.work_status || 'N/A';
                                }
                                
                                return (
                                  <span className={`inline-flex px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-lg ${badgeClass}`}>
                                    {displayText}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
                                {(() => {
                                  const status = normalizeWorkStatus(proposal.work_status);
                                  const isCompleted = status === 'completed' || 
                                                      status === 'complete' || 
                                                      status === 'approved' || 
                                                      status === 'sanctioned' ||
                                                      status === 'forwarded';
                                  const isPendingAtDLC = status === 'pending at dlc';
                                  
                                  return (
                                    <>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleViewDetails(proposal)}
                                        className="px-2 sm:px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                                        title="View Details"
                                      >
                                        <FiEye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        <span className="hidden sm:inline">View</span>
                                        <span className="sm:hidden">View</span>
                                      </motion.button>
                                      <motion.button
                                        whileHover={!isCompleted && !isPendingAtDLC ? { scale: 1.05 } : {}}
                                        whileTap={!isCompleted && !isPendingAtDLC ? { scale: 0.95 } : {}}
                                        onClick={() => handleForward(proposal)}
                                        disabled={isLoadingAction || isPendingAtDLC || isCompleted}
                                        className="px-2 sm:px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                        title={isCompleted ? "Proposal is already completed" : isPendingAtDLC ? "Already forwarded to DLC" : "Forward to DLC"}
                                      >
                                        <FiSend className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        <span className="hidden sm:inline">Forward</span>
                                        <span className="sm:hidden">Fwd</span>
                                      </motion.button>
                                      <motion.button
                                        whileHover={!isCompleted ? { scale: 1.05 } : {}}
                                        whileTap={!isCompleted ? { scale: 0.95 } : {}}
                                        onClick={() => handleSendBack(proposal)}
                                        disabled={isLoadingAction || isCompleted}
                                        className="px-2 sm:px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                        title={isCompleted ? "Proposal is already completed" : "Send Back to Category 24"}
                                      >
                                        <FiArrowLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        <span className="hidden sm:inline">Send Back</span>
                                        <span className="sm:hidden">Back</span>
                                      </motion.button>
                                    </>
                                  );
                                })()}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
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
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
                >
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{modalTitle}</h2>
                      <p className="text-blue-100 mt-1 text-xs sm:text-sm">{modalProposals.length} proposal(s) found</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => exportToPDF(modalTitle, modalProposals)}
                        className="flex items-center justify-center gap-2 bg-white text-blue-600 px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm sm:text-base flex-1 sm:flex-initial"
                      >
                        <FiDownload className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Export PDF</span>
                        <span className="sm:hidden">Export</span>
                      </motion.button>
                      <button
                        onClick={handleCloseModal}
                        className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
                    {modalProposals.length > 0 ? (
                      <div className="overflow-x-auto -mx-3 sm:mx-0">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <FiFileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Proposal ID</span>
                                  <span className="sm:hidden">ID</span>
                                </div>
                              </th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                                Category
                              </th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <FiMapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Taluka
                                </div>
                              </th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                                GP
                              </th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                                Village
                              </th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <FiCalendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Created Date
                                </div>
                              </th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
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
                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  <span className="text-xs sm:text-sm font-bold text-gray-900">
                                    #{proposal.proposal_id}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                                  <span className="text-xs sm:text-sm text-gray-700">
                                    {proposal.proposal_category_name || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    {proposal.taluka_name || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    {proposal.gp_name || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    {proposal.village_name || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    {new Date(proposal.created_at).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                                  {(() => {
                                    const status = normalizeWorkStatus(proposal.work_status);
                                    const isCorrectionNeeded = status === 'correction needed' || 
                                                              proposal.remarks?.includes('Send Back') ||
                                                              proposal.remarks?.includes('DLC Send Back');
                                    
                                    let displayText = proposal.work_status || 'N/A';
                                    let badgeClass = 'bg-gray-100 text-gray-800';
                                    
                                    if (isCorrectionNeeded) {
                                      displayText = 'Send Back to RFO/DFO';
                                      badgeClass = 'bg-orange-100 text-orange-800';
                                    } else if (status === 'rejected') {
                                      badgeClass = 'bg-red-100 text-red-800';
                                    } else if (status === 'pending at dlc') {
                                      badgeClass = 'bg-purple-100 text-purple-800';
                                      displayText = 'Pending at DLC';
                                    } else if (status === 'under review') {
                                      badgeClass = 'bg-blue-100 text-blue-800';
                                      displayText = 'Under Review';
                                    } else if (status === 'completed' || status === 'complete' || status === 'approved' || status === 'sanctioned') {
                                      badgeClass = 'bg-green-100 text-green-800';
                                      displayText = 'Completed';
                                    }
                                    
                                    return (
                                      <span className={`inline-flex px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-lg ${badgeClass}`}>
                                        {displayText}
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                                  <span className="text-xs sm:text-sm text-gray-600">
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

            {/* Forward to DLC Modal */}
            {showForwardModal && selectedProposal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-5 md:p-6 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800">Forward to DLC</h3>
                    <button
                      onClick={() => {
                        setShowForwardModal(false);
                        setSelectedProposal(null);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      Proposal ID: <span className="font-semibold">#{selectedProposal.proposal_id}</span>
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                      Select DLC user to forward this proposal to:
                    </p>

                    {dlcUsers.length > 0 ? (
                      <select
                        value={selectedDlcUser}
                        onChange={(e) => setSelectedDlcUser(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {dlcUsers.map((user) => (
                          <option key={user.user_id} value={user.user_id.toString()}>
                            {user.name} (ID: {user.user_id})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-xs sm:text-sm text-red-700 font-semibold mb-2">No DLC users available</p>
                          <p className="text-xs text-red-600">
                            Please ensure there are active users with category ID 35 (DLC) in the system.
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            toast.loading('Refreshing DLC users...');
                            await fetchDLCUsers();
                            toast.dismiss();
                            if (dlcUsers.length > 0) {
                              toast.success('DLC users loaded successfully');
                            } else {
                              toast.error('No DLC users found. Please contact administrator.');
                            }
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh DLC Users
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        setShowForwardModal(false);
                        setSelectedProposal(null);
                      }}
                      disabled={isLoadingAction}
                      className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmForward}
                      disabled={isLoadingAction || !selectedDlcUser || dlcUsers.length === 0}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      {isLoadingAction ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span className="hidden sm:inline">Forwarding...</span>
                          <span className="sm:hidden">Forwarding</span>
                        </>
                      ) : (
                        <>
                          <FiSend className="w-4 h-4" />
                          <span className="hidden sm:inline">Forward to DLC</span>
                          <span className="sm:hidden">Forward</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Send Back Modal */}
            {showSendBackModal && selectedProposal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-5 md:p-6 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800">Send Back to Category 24</h3>
                    <button
                      onClick={() => {
                        setShowSendBackModal(false);
                        setSelectedProposal(null);
                        setSendBackReason('');
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      Proposal ID: <span className="font-semibold">#{selectedProposal.proposal_id}</span>
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      Please provide a reason for sending back:
                    </p>
                    <textarea
                      value={sendBackReason}
                      onChange={(e) => setSendBackReason(e.target.value)}
                      placeholder="Enter reason for sending back..."
                      rows={4}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                    <button
                      onClick={() => {
                        setShowSendBackModal(false);
                        setSelectedProposal(null);
                        setSendBackReason('');
                      }}
                      disabled={isLoadingAction}
                      className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmSendBack}
                      disabled={isLoadingAction || !sendBackReason.trim()}
                      className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      {isLoadingAction ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span className="hidden sm:inline">Sending Back...</span>
                          <span className="sm:hidden">Sending...</span>
                        </>
                      ) : (
                        <>
                          <FiArrowLeft className="w-4 h-4" />
                          Send Back
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Proposal Details Modal */}
            {isDetailsModalOpen && detailsProposal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                >
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-5 md:p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                        Proposal Details
                      </h2>
                      <p className="text-indigo-100 text-xs sm:text-sm">
                        ID: #{detailsProposal.proposal_id}
                      </p>
                    </div>
                    <button
                      onClick={handleCloseDetailsModal}
                      className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
                    {loadingHistory ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-gray-50 rounded-lg p-4 sm:p-5">
                          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiInfo className="w-5 h-5 text-indigo-600" />
                            Basic Information
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600 mb-1">Proposal ID</p>
                              <p className="text-sm sm:text-base font-semibold text-gray-900">#{detailsProposal.proposal_id}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600 mb-1">Category</p>
                              <p className="text-sm sm:text-base font-semibold text-gray-900">{detailsProposal.proposal_category_name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600 mb-1">Status</p>
                              <div>{getStatusBadge(detailsProposal)}</div>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600 mb-1">Created Date</p>
                              <p className="text-sm sm:text-base font-semibold text-gray-900">
                                {new Date(detailsProposal.created_at).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Location Information */}
                        <div className="bg-gray-50 rounded-lg p-4 sm:p-5">
                          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiMapPin className="w-5 h-5 text-indigo-600" />
                            Location Information
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600 mb-1">Taluka</p>
                              <p className="text-sm sm:text-base font-semibold text-gray-900">{detailsProposal.taluka_name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600 mb-1">Gram Panchayat</p>
                              <p className="text-sm sm:text-base font-semibold text-gray-900">{detailsProposal.gp_name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm text-gray-600 mb-1">Village</p>
                              <p className="text-sm sm:text-base font-semibold text-gray-900">{detailsProposal.village_name || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Proposal Details */}
                        <div className="bg-gray-50 rounded-lg p-4 sm:p-5">
                          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiFileText className="w-5 h-5 text-indigo-600" />
                            Proposal Details
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {detailsProposal.beneficiaries && (
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Beneficiaries</p>
                                <p className="text-sm sm:text-base font-semibold text-gray-900">{detailsProposal.beneficiaries}</p>
                              </div>
                            )}
                            {detailsProposal.number_of_tree && (
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Number of Trees</p>
                                <p className="text-sm sm:text-base font-semibold text-gray-900">{detailsProposal.number_of_tree}</p>
                              </div>
                            )}
                            {detailsProposal.land_details && (
                              <div className="sm:col-span-2">
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Land Details</p>
                                <p className="text-sm sm:text-base font-semibold text-gray-900">{detailsProposal.land_details}</p>
                              </div>
                            )}
                            {detailsProposal.remarks && (
                              <div className="sm:col-span-2">
                                <p className="text-xs sm:text-sm text-gray-600 mb-1">Remarks</p>
                                <p className="text-sm sm:text-base font-semibold text-gray-900">{detailsProposal.remarks}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Timeline */}
                        {statusHistory && statusHistory.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4 sm:p-5">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                              <FiClock className="w-5 h-5 text-indigo-600" />
                              Status Timeline
                            </h3>
                            <div className="space-y-4">
                              {statusHistory.map((item, index) => (
                                <div key={item.id || index} className="flex gap-4">
                                  <div className="flex flex-col items-center">
                                    <div className={`w-3 h-3 rounded-full ${item.isCurrent ? 'bg-indigo-600' : 'bg-gray-400'}`}></div>
                                    {index < statusHistory.length - 1 && (
                                      <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                                    )}
                                  </div>
                                  <div className="flex-1 pb-4">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-sm sm:text-base font-semibold text-gray-900">{item.action || 'Status Update'}</p>
                                      <p className="text-xs sm:text-sm text-gray-500">
                                        {new Date(item.date).toLocaleDateString('en-IN', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                    {item.status && (
                                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Status: <span className="font-semibold">{item.status}</span></p>
                                    )}
                                    {item.user_name && (
                                      <p className="text-xs sm:text-sm text-gray-600 mb-1">User: <span className="font-semibold">{item.user_name}</span></p>
                                    )}
                                    {item.remarks && (
                                      <p className="text-xs sm:text-sm text-gray-600">Remarks: {item.remarks}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

