"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FaFileAlt, FaClock, FaUser, FaMapMarkerAlt } from "react-icons/fa";
import Loader from "@/common/Loader";

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
  days_pending: number;
}

interface ForwardedProposalsDashboardProps {
  userId: string;
  categoryId: string;
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

export const ForwardedProposalsDashboard: React.FC<ForwardedProposalsDashboardProps> = ({
  userId,
  categoryId
}) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForwardedProposals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/proposals/user-dashboard?user_id=${userId}&category_id=${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setProposals(data);
      }
    } catch (error) {
      console.error('Error fetching forwarded proposals:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, categoryId]);

  useEffect(() => {
    fetchForwardedProposals();
  }, [fetchForwardedProposals]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending at dlc':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'correction needed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'under review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (daysPending: number) => {
    if (daysPending > 30) return 'text-red-600';
    if (daysPending > 15) return 'text-orange-600';
    if (daysPending > 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Forwarded Proposals
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {proposals.length} proposal{proposals.length !== 1 ? "s" : ""} forwarded to you
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-12">
          <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No forwarded proposals
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You don&apos;t have any proposals forwarded to you at the moment.
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {proposals.map((proposal) => (
            <motion.div
              key={proposal.proposal_id}
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <FaFileAlt className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      #{proposal.proposal_id}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(proposal.work_status)}`}>
                    {proposal.work_status || 'Pending'}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {proposal.proposal_category_name}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <FaMapMarkerAlt className="h-4 w-4" />
                    <span>{proposal.village_name}, {proposal.taluka_name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <FaUser className="h-4 w-4" />
                    <span>Created by: {proposal.user_name}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <FaClock className="h-4 w-4" />
                    <span className={getPriorityColor(proposal.days_pending)}>
                      {proposal.days_pending} days pending
                    </span>
                  </div>
                </div>

                {proposal.beneficiaries && (
                  <div className="mt-3 text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">Beneficiaries: </span>
                    <span className="text-gray-600 dark:text-gray-400">{proposal.beneficiaries}</span>
                  </div>
                )}

                {proposal.number_of_tree && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">Trees: </span>
                    <span className="text-gray-600 dark:text-gray-400">{proposal.number_of_tree}</span>
                  </div>
                )}

                {proposal.remarks && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Latest Remarks:
                    </span>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {proposal.remarks}
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Created: {new Date(proposal.created_at).toLocaleDateString()}</span>
                    <span>Updated: {new Date(proposal.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};