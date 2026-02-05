"use client";

import React, { useState, useEffect } from "react";
import Loader from "@/common/Loader";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  // pendingAtRFODFO: number;
  rejectedByRFODFO: number;
  pendingAtRFODFO: number;
  pendingAtDLC: number;
  dlcCompleted: number;
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

export default function DCDashboard() {
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<DCStats>({
    totalProposals: 0,
    pendingAtRFODFO: 0,
    rejectedByRFODFO: 0,
    // pendingAtRFODFO: 0,
    pendingAtDLC: 0,
    dlcCompleted: 0,
  });
  const [actionRequiredProposals, setActionRequiredProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    fetchDCData();
  }, []);

  const fetchDCData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dc-dashboard');
      if (response.ok) {
        const data = await response.json();
        setProposals(data.proposals);
        setStats(data.stats);
        setActionRequiredProposals(data.actionRequired);
      }
    } catch (error) {
      console.error('Error fetching DC data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
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
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          District Collector Dashboard
        </h1>
        <p className="text-gray-600">
          Comprehensive overview of proposal management and approvals
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Proposals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProposals}</p>
            </div>
            <button
              onClick={() => exportToPDF('Total Proposals', proposals)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending for Accept at RFO/DFO</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingAtRFODFO}</p>
            </div>
            <button
              onClick={() => exportToPDF('Pending at RFO/DFO', proposals.filter(p => p.work_status === 'Pending at RFO/DFO'))}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected by RFO/DFO</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejectedByRFODFO}</p>
            </div>
            <button
              onClick={() => exportToPDF('Rejected by RFO/DFO', proposals.filter(p => p.work_status === 'Rejected'))}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending at RFO/DFO</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingAtRFODFO}</p>
            </div>
            <button
              onClick={() => exportToPDF('Pending at RFO/DFO', proposals.filter(p => p.work_status === 'Under Review'))}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending at DLC</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingAtDLC}</p>
            </div>
            <button
              onClick={() => exportToPDF('Pending at DLC', proposals.filter(p => p.work_status === 'pending at DLC'))}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">DLC Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.dlcCompleted}</p>
            </div>
            <button
              onClick={() => exportToPDF('DLC Completed', proposals.filter(p => p.work_status === 'Completed'))}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Export PDF
            </button>
          </div>
        </div>
      </motion.div>

      {/* Action Required Section */}
      <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Action Required (Pending from more than 1 month)
          </h2>
          <button
            onClick={() => exportToPDF('Action Required', actionRequiredProposals)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export PDF
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proposal ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Village
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Months Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Pending
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {actionRequiredProposals.map((proposal) => (
                <tr key={proposal.proposal_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {proposal.proposal_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {proposal.village_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      proposal.work_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      proposal.work_status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {proposal.work_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {proposal.months_pending || 0} months
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {proposal.days_pending || 0} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}