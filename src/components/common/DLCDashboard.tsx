"use client";

import React, { useState, useEffect } from "react";
import Loader from "@/common/Loader";
import { Modal } from "@/components/ui/modal";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  const [actionType, setActionType] = useState<'sanction' | 'sendback' | null>(null);
  const [reason, setReason] = useState('');
  const [notification, setNotification] = useState<Notification>({
    title: '',
    description: '',
    link: '',
    pdf_file: ''
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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
    try {
      const formData = new FormData();
      formData.append('title', notification.title);
      formData.append('description', notification.description);
      formData.append('link', notification.link || '');
      if (uploadedFile) {
        formData.append('pdf_file', uploadedFile);
      }

      const response = await fetch('/api/dlc-dashboard/notification', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Notification uploaded successfully');
        setIsNotificationModalOpen(false);
        setNotification({ title: '', description: '', link: '', pdf_file: '' });
        setUploadedFile(null);
      } else {
        toast.error('Failed to upload notification');
      }
    } catch (error) {
      console.error('Error uploading notification:', error);
      toast.error('Failed to upload notification');
    }
  };

  const exportPendencyReport = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    
    // Header
    doc.setFontSize(16);
    doc.text('DLC Pendency Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${currentDate}`, 20, 30);
    doc.text(`Total Pending Proposals: ${proposals.length}`, 20, 40);
    
    // Table
    const headers = ['Proposal ID', 'Category', 'Village', 'Submitted By', 'Days Pending'];
    const rows = proposals.map(p => [
      p.proposal_id,
      p.proposal_category_name,
      p.village_name,
      p.user_name,
      p.days_pending || 0
    ]);
    
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    doc.save(`DLC_Pendency_Report_${currentDate}.pdf`);
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

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <h3 className="text-lg font-semibold text-gray-900">Pending Proposals</h3>
          <p className="text-3xl font-bold text-yellow-600">{proposals.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-900">Average Pending Days</h3>
          <p className="text-3xl font-bold text-blue-600">
            {proposals.length > 0 ? Math.round(proposals.reduce((sum, p) => sum + (p.days_pending || 0), 0) / proposals.length) : 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-gray-900">Overdue (>30 days)</h3>
          <p className="text-3xl font-bold text-red-600">
            {proposals.filter(p => (p.days_pending || 0) > 30).length}
          </p>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleProposalAction(proposal, 'sanction')}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                        >
                          Sanction
                        </button>
                        <button
                          onClick={() => handleProposalAction(proposal, 'sendback')}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                        >
                          Send Back
                        </button>
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
      <Modal isOpen={isNotificationModalOpen} onClose={() => setIsNotificationModalOpen(false)}>
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={!notification.title.trim() || !notification.description.trim()}
            >
              Upload Notification
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}