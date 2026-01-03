"use client";

import React, { useEffect, useState } from "react";
import { Proposal } from "./proposals";
import { Modal } from "@/components/ui/modal";
import { FaFileAlt, FaClock, FaCheckCircle } from "react-icons/fa";
import Loader from "@/common/Loader";

interface Section32DashboardProps {
  proposals: Proposal[];
}

export const Section32Dashboard: React.FC<Section32DashboardProps> = ({ proposals: initialProposals }) => {
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals || []);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, []);

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

  // Calculate counts based on work_status
  const getProposalCounts = () => {
    const total = proposals.length;
    const pending = proposals.filter(p => 
      !p.work_status || 
      p.work_status === 'Pending' || 
      p.work_status === 'pending' ||
      p.status === 'Pending'
    ).length;
    const ongoing = proposals.filter(p => 
      p.work_status === 'Ongoing' || 
      p.work_status === 'ongoing' ||
      p.work_status === 'In Progress' ||
      p.work_status === 'in_progress'
    ).length;
    const completed = proposals.filter(p => 
      p.work_status === 'Completed' || 
      p.work_status === 'completed' ||
      p.work_status === 'Done' ||
      p.status === 'Completed'
    ).length;

    return { total, pending, ongoing, completed };
  };

  const counts = getProposalCounts();

  const handleCardClick = (filter: string) => {
    setSelectedFilter(filter);
    let filtered: Proposal[] = [];

    switch (filter) {
      case 'total':
        filtered = proposals;
        break;
      case 'pending':
        filtered = proposals.filter(p => 
          !p.work_status || 
          p.work_status === 'Pending' || 
          p.work_status === 'pending' ||
          p.status === 'Pending'
        );
        break;
      case 'ongoing':
        filtered = proposals.filter(p => 
          p.work_status === 'Ongoing' || 
          p.work_status === 'ongoing' ||
          p.work_status === 'In Progress' ||
          p.work_status === 'in_progress'
        );
        break;
      case 'completed':
        filtered = proposals.filter(p => 
          p.work_status === 'Completed' || 
          p.work_status === 'completed' ||
          p.work_status === 'Done' ||
          p.status === 'Completed'
        );
        break;
      default:
        filtered = proposals;
    }

    setFilteredProposals(filtered);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'ongoing':
      case 'in progress':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return <Loader />;
  }

  const metricsConfig = [
    {
      icon: <FaFileAlt className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
      label: "Total Proposal",
      value: counts.total,
      filter: 'total',
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      textColor: "text-white"
    },
    {
      icon: <FaClock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />,
      label: "Total Pending Proposal",
      value: counts.pending,
      filter: 'pending',
      bgColor: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      textColor: "text-white"
    },
    {
      icon: <FaClock className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
      label: "Total Ongoing Proposal",
      value: counts.ongoing,
      filter: 'ongoing',
      bgColor: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      textColor: "text-white"
    },
    {
      icon: <FaCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />,
      label: "Total Completed Proposal",
      value: counts.completed,
      filter: 'completed',
      bgColor: "bg-gradient-to-br from-green-500 to-green-600",
      textColor: "text-white"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Section 3(2) Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of all proposals and their status
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricsConfig.map((metric, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(metric.filter)}
            className={`${metric.bgColor} rounded-xl p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl ${metric.textColor}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 rounded-lg p-3">
                {metric.icon}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium opacity-90">
                {metric.label}
              </p>
              <p className="text-3xl font-bold">
                {metric.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Proposal List Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFilter(null);
        }}
        className="max-w-4xl"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            {selectedFilter === 'total' ? 'All' : selectedFilter ? selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1) : 'All'} Proposals
          </h2>
          <div className="max-h-[70vh] overflow-y-auto">
            {filteredProposals.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No proposals found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProposals.map((proposal, index) => (
                  <div
                    key={proposal.proposal_id || index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-800 dark:text-white">
                            Proposal #{proposal.proposal_id}
                          </h3>
                          {proposal.work_status && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.work_status)}`}>
                              {proposal.work_status}
                            </span>
                          )}
                        </div>
                        {proposal.village_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span className="font-medium">Village:</span> {proposal.village_name}
                          </p>
                        )}
                        {proposal.taluka_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span className="font-medium">Taluka:</span> {proposal.taluka_name}
                          </p>
                        )}
                        {proposal.gp_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span className="font-medium">Gram Panchayat:</span> {proposal.gp_name}
                          </p>
                        )}
                        {proposal.beneficiaries && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span className="font-medium">Beneficiaries:</span> {proposal.beneficiaries}
                          </p>
                        )}
                        {proposal.number_of_tree && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span className="font-medium">Number of Trees:</span> {proposal.number_of_tree}
                          </p>
                        )}
                        {proposal.land_details && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span className="font-medium">Land Details:</span> {proposal.land_details}
                          </p>
                        )}
                        {proposal.remarks && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span className="font-medium">Remarks:</span> {proposal.remarks}
                          </p>
                        )}
                        {proposal.user_name && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Created By:</span> {proposal.user_name}
                          </p>
                        )}
                      </div>
                    </div>
                    {proposal.pdf && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <a
                          href={proposal.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                        >
                          <FaFileAlt className="w-4 h-4" />
                          View PDF
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

