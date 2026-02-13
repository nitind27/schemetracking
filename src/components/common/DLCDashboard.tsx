"use client";

import React, { useState, useEffect } from "react";
import Loader from "@/common/Loader";
import { Modal } from "@/components/ui/modal";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import NotificationsList from "./NotificationsList";

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

interface Notification {
  id?: number;
  title: string;
  description: string;
  link?: string;
  pdf_file?: string;
  created_at?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
    },
  },
};

export default function DLCDashboard() {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsProposal, setDetailsProposal] = useState<Proposal | null>(null);
  const [actionType, setActionType] = useState<'sanction' | 'sendback' | null>(null);
  const [reason, setReason] = useState('');
  const [notification, setNotification] = useState<Notification>({
    title: '',
    description: '',
    link: '',
    pdf_file: ''
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchDLCProposals();
  }, []);

  const fetchDLCProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dlc-dashboard');
      if (response.ok) {
        const data = await response.json();
        setProposals(data.proposals);
      }
    } catch (error) {
      console.error('Error fetching DLC proposals:', error);
      toast.error('Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleProposalAction = async (proposal: Proposal, action: 'sanction' | 'sendback') => {
    setSelectedProposal(proposal);
    setActionType(action);
    setIsModalOpen(true);
    setReason('');
  };

  const handleViewDetails = (proposal: Proposal) => {
    setDetailsProposal(proposal);
    setIsDetailsModalOpen(true);
  };

  const getStatusBadge = (proposal: Proposal) => {
    const status = proposal.work_status?.toLowerCase()?.trim() || '';
    let bgColor = 'bg-gray-100 text-gray-800';
    let text = proposal.work_status || 'Not Started';

    if (status === 'complete' || status === 'completed' || proposal.remarks?.includes('DLC Sanctioned')) {
      bgColor = 'bg-green-100 text-green-800';
      text = 'Sanctioned';
    } else if (status === 'correction needed' || proposal.remarks?.includes('DLC Send Back')) {
      bgColor = 'bg-orange-100 text-orange-800';
      text = 'Sent Back';
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
    } else if (!status || status === 'not started yet' || status === 'not started' || status === 'pending') {
      bgColor = 'bg-gray-100 text-gray-800';
      text = 'Pending';
    }

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bgColor}`}>
        {text}
      </span>
    );
  };

  const submitProposalAction = async () => {
    if (!selectedProposal || !actionType) return;

    try {
      const response = await fetch('/api/dlc-dashboard/action', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposal_id: selectedProposal.proposal_id,
          action: actionType,
          reason: reason,
          user_id: sessionStorage.getItem('user_id')
        }),
      });

      if (response.ok) {
        toast.success(`Proposal ${actionType === 'sanction' ? 'sanctioned' : 'sent back'} successfully`);
        setIsModalOpen(false);
        fetchDLCProposals();
      } else {
        toast.error('Failed to update proposal');
      }
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast.error('Failed to update proposal');
    }
  };

  const uploadNotification = async () => {
    // Validation
    if (!notification.title.trim()) {
      toast.error('Please enter a notification title');
      return;
    }

    if (!notification.description.trim()) {
      toast.error('Please enter a notification description');
      return;
    }

    // Validate file size if PDF is uploaded (max 10MB)
    if (uploadedFile && uploadedFile.size > 10 * 1024 * 1024) {
      toast.error('PDF file size must be less than 10MB');
      return;
    }

    // Validate file type
    if (uploadedFile && uploadedFile.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', notification.title.trim());
      formData.append('description', notification.description.trim());
      formData.append('link', notification.link?.trim() || '');
      
      // Get user_id from sessionStorage for tracking
      const userId = sessionStorage.getItem('user_id');
      if (userId) {
        formData.append('user_id', userId);
      }
      
      if (uploadedFile) {
        formData.append('pdf_file', uploadedFile);
      }

      const response = await fetch('/api/dlc-dashboard/notification', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Notification uploaded successfully');
        setIsNotificationModalOpen(false);
        setNotification({ title: '', description: '', link: '', pdf_file: '' });
        setUploadedFile(null);
        
        // Refresh notifications list by triggering a custom event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('refreshNotifications'));
        }
      } else {
        toast.error(result.error || 'Failed to upload notification');
      }
    } catch (error) {
      console.error('Error uploading notification:', error);
      toast.error('Failed to upload notification. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const exportPendencyReport = () => {
    try {
      // Check if proposals exist
      if (!proposals || proposals.length === 0) {
        toast.error('No proposals available to export');
        return;
      }

      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      // Header
      doc.setFontSize(16);
      doc.text('DLC Pendency Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${currentDate}`, 20, 30);
      doc.text(`Total Pending Proposals: ${proposals.length}`, 20, 40);
      
      // Prepare table data with proper type conversion
      const headers = ['Proposal ID', 'Category', 'Village', 'Submitted By', 'Days Pending'];
      const rows = proposals.map(p => [
        String(p.proposal_id || 'N/A'),
        String(p.proposal_category_name || 'N/A'),
        String(p.village_name || 'N/A'),
        String(p.user_name || 'N/A'),
        String(p.days_pending || 0)
      ]);
      
      // Use autoTable function directly
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 50,
        styles: { 
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        margin: { top: 50 }
      });
      
      // Save PDF with sanitized filename
      const sanitizedDate = currentDate.replace(/\//g, '-');
      doc.save(`DLC_Pendency_Report_${sanitizedDate}.pdf`);
      toast.success('Pendency report exported successfully');
    } catch (error) {
      console.error('Error exporting pendency report:', error);
      toast.error('Failed to export pendency report. Please try again.');
    }
  };

  // Calculate status-wise statistics
  const stats = {
    total: proposals.length,
    pending: proposals.filter(p => {
      const s = p.work_status?.toLowerCase()?.trim() || '';
      return !s || s === 'not started yet' || s === 'not started' || s === 'submitted' || s === 'pending';
    }).length,
    underReview: proposals.filter(p => (p.work_status?.toLowerCase()?.trim() || '') === 'under review').length,
    rejected: proposals.filter(p => (p.work_status?.toLowerCase()?.trim() || '') === 'rejected').length,
    pendingAtPO: proposals.filter(p => (p.work_status?.toLowerCase()?.trim() || '') === 'pending at po').length,
    pendingAtDLC: proposals.filter(p => (p.work_status?.toLowerCase()?.trim() || '') === 'pending at dlc').length,
    correctionNeeded: proposals.filter(p => (p.work_status?.toLowerCase()?.trim() || '') === 'correction needed').length,
    completed: proposals.filter(p => (p.work_status?.toLowerCase()?.trim() || '') === 'completed').length,
    forwarded: proposals.filter(p => {
      const s = p.work_status?.toLowerCase()?.trim() || '';
      return s === 'forwarded';
    }).length,
    averagePendingDays: proposals.length > 0 ? Math.round(proposals.reduce((sum, p) => sum + (p.days_pending || 0), 0) / proposals.length) : 0,
    overdue: proposals.filter(p => (p.days_pending || 0) > 30).length
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              District Level Committee (DLC) Dashboard
            </h1>
            <p className="text-gray-600">
              Review and approve proposals forwarded by RFO/DFO
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportPendencyReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Export Pendency Report
            </button>
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Upload Notification
            </button>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
              <p className="text-sm text-gray-600">Pending at PO</p>
              <p className="text-2xl font-bold text-indigo-600">{stats.pendingAtPO}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Forwarded</p>
              <p className="text-2xl font-bold text-blue-600">{stats.forwarded}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue ({'>'}30 days)</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Proposals Table */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Proposals for Review</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proposal ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Village
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Pending
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      View Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {proposals.map((proposal) => (
                    <tr key={proposal.proposal_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {proposal.proposal_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {proposal.proposal_category_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {proposal.village_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {proposal.user_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (proposal.days_pending || 0) > 30 ? 'bg-red-100 text-red-800' :
                          (proposal.days_pending || 0) > 15 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {proposal.days_pending || 0} days
                        </span>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {(() => {
                          const status = proposal.work_status?.toLowerCase()?.trim() || '';
                          const isSanctioned = status === 'complete' || status === 'completed' || proposal.remarks?.includes('DLC Sanctioned');
                          const isSentBack = status === 'correction needed' || proposal.remarks?.includes('DLC Send Back');
                          
                          return (
                            <>
                              <button
                                onClick={() => handleProposalAction(proposal, 'sanction')}
                                disabled={isSanctioned || isSentBack}
                                className={`px-3 py-1 rounded transition-colors ${
                                  isSanctioned || isSentBack
                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                              >
                                {isSanctioned ? 'Sanctioned' : 'Sanction'}
                              </button>
                              <button
                                onClick={() => handleProposalAction(proposal, 'sendback')}
                                disabled={isSanctioned || isSentBack}
                                className={`px-3 py-1 rounded transition-colors ${
                                  isSanctioned || isSentBack
                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                              >
                                {isSentBack ? 'Sent Back' : 'Send Back'}
                              </button>
                            </>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Notifications Panel */}
        <div className="lg:col-span-1">
          <NotificationsList />
        </div>
      </motion.div>

      {/* Action Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {actionType === 'sanction' ? 'Sanction Proposal' : 'Send Back Proposal'}
          </h3>
          
          {selectedProposal && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p><strong>Proposal ID:</strong> {selectedProposal.proposal_id}</p>
              <p><strong>Village:</strong> {selectedProposal.village_name}</p>
              <p><strong>Category:</strong> {selectedProposal.proposal_category_name}</p>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {actionType === 'sanction' ? 'Approval Notes' : 'Reason for Sending Back'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder={actionType === 'sanction' ? 'Enter approval notes...' : 'Enter reason for sending back...'}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submitProposalAction}
              className={`px-4 py-2 text-white rounded-lg ${
                actionType === 'sanction' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              disabled={!reason.trim()}
            >
              {actionType === 'sanction' ? 'Sanction' : 'Send Back'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Notification Upload Modal */}
      <Modal 
        isOpen={isNotificationModalOpen} 
        onClose={() => {
          setIsNotificationModalOpen(false);
          // Reset form when closing
          setNotification({ title: '', description: '', link: '', pdf_file: '' });
          setUploadedFile(null);
          setIsUploading(false);
        }}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Upload Notification</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={notification.title}
                onChange={(e) => setNotification({...notification, title: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter notification title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={notification.description}
                onChange={(e) => setNotification({...notification, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Enter notification description"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link (Optional)</label>
              <input
                type="url"
                value={notification.link}
                onChange={(e) => setNotification({...notification, link: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter notification link"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PDF Upload (Optional)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {uploadedFile && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-700">{uploadedFile.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setIsNotificationModalOpen(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={uploadNotification}
              className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 ${
                isUploading || !notification.title.trim() || !notification.description.trim()
                  ? 'opacity-75 cursor-not-allowed'
                  : ''
              }`}
              disabled={isUploading || !notification.title.trim() || !notification.description.trim()}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload Notification'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Proposal Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)}>
        <div className="relative w-full max-w-5xl mx-auto my-8 max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Proposal Details</h3>
            <button
              onClick={() => setIsDetailsModalOpen(false)}
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
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
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
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
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
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
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
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Submitted By
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User Name</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{detailsProposal.user_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User Category ID</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{detailsProposal.user_category_id || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {detailsProposal.remarks && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 p-6 rounded-lg border border-red-200 dark:border-red-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Remarks
                  </h4>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                      {detailsProposal.remarks}
                    </p>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Timeline
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</p>
                    <p className="text-base text-gray-900 dark:text-white mt-1">
                      {detailsProposal.created_at ? new Date(detailsProposal.created_at).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="text-base text-gray-900 dark:text-white mt-1">
                      {detailsProposal.updated_at ? new Date(detailsProposal.updated_at).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* PDF Link */}
              {detailsProposal.pdf && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-indigo-200 dark:border-indigo-700">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Documents
                  </h4>
                  <a
                    href={detailsProposal.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
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
              onClick={() => setIsDetailsModalOpen(false)}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors font-medium shadow-sm hover:shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}