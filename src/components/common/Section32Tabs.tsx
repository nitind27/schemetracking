"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Loader from '@/common/Loader';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Proposal {
  proposal_id?: number;
  proposal_category_id?: number;
  pdf?: string;
  land_details?: string;
  number_of_tree?: number;
  beneficiaries?: string;
  supporting_map_doc?: string;
  remarks?: string;
  taluka_id?: number;
  gp_id?: number;
  village_id?: number;
  forward_to?: string;
  work_status?: string;
  work_status_record?: string;
  proposal_document_id?: number;
  user_id?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  // Joined fields
  taluka_name?: string;
  gp_name?: string;
  village_name?: string;
  user_name?: string;
}

export default function Section32Tabs() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewCheckboxes, setReviewCheckboxes] = useState({
    siteInspection: false,
    boundaryVerified: false,
    fraCompliance: false,
    treeCount: false
  });
  const [isForwarded, setIsForwarded] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [sendBackReason, setSendBackReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSendBackModal, setShowSendBackModal] = useState(false);
  const [showForwardConfirmModal, setShowForwardConfirmModal] = useState(false);

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
      toast.error('Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleStartReview = async (proposal: Proposal) => {
    // Open modal immediately
    setSelectedProposal({ ...proposal, work_status: 'Under Review' });
    setIsModalOpen(true);
    // Reset checkboxes
    setReviewCheckboxes({
      siteInspection: false,
      boundaryVerified: false,
      fraCompliance: false,
      treeCount: false
    });
    setIsForwarded(false);

    // Update status in background
    try {
      const response = await fetch('/api/proposals/updatestatus', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposal_id: proposal.proposal_id,
          work_status: 'Under Review'
        })
      });

      if (response.ok) {
        toast.success('Proposal status updated to Under Review');
        fetchProposals(); // Refresh the list
      } else {
        toast.error('Failed to update proposal status');
      }
    } catch (error) {
      console.error('Error updating proposal status:', error);
      toast.error('Failed to update proposal status');
    }
  };

  const handleOpenModal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setIsModalOpen(true);

    // Check if proposal has been forwarded
    if (proposal.work_status === 'pending at DLC') {
      setIsForwarded(true);
      // Uncheck all checkboxes when disabled (forwarded)
      setReviewCheckboxes({
        siteInspection: false,
        boundaryVerified: false,
        fraCompliance: false,
        treeCount: false
      });
    } else {
      setIsForwarded(false);
      // Reset checkboxes for new review
      setReviewCheckboxes({
        siteInspection: false,
        boundaryVerified: false,
        fraCompliance: false,
        treeCount: false
      });
    }
  };

  // Uncheck disabled checkboxes if they are checked (when isForwarded changes)
  useEffect(() => {
    if (isForwarded) {
      setReviewCheckboxes({
        siteInspection: false,
        boundaryVerified: false,
        fraCompliance: false,
        treeCount: false
      });
    }
  }, [isForwarded]);

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
        setRejectReason('');
        setIsModalOpen(false);
        await fetchProposals();
        router.refresh();
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
        setSendBackReason('');
        setIsModalOpen(false);
        await fetchProposals();
        router.refresh();
      } else {
        toast.error('Failed to send back proposal');
      }
    } catch (error) {
      console.error('Error sending back proposal:', error);
      toast.error('Failed to send back proposal');
    }
  };

  const handleForwardToDLC = () => {
    // Check if at least one checkbox is checked
    const hasAnyChecked = Object.values(reviewCheckboxes).some(v => v);
    if (!hasAnyChecked) {
      toast.error('Please complete at least one review criteria');
      return;
    }
    setShowForwardConfirmModal(true);
  };

  const handleConfirmForwardToDLC = async () => {
    if (!selectedProposal) return;

    try {
      const response = await fetch('/api/proposals/updatestatus', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposal_id: selectedProposal.proposal_id,
          work_status: 'pending at DLC',
          review_checkboxes: reviewCheckboxes
        })
      });

      if (response.ok) {
        toast.success('Proposal forwarded to DLC successfully');
        setShowForwardConfirmModal(false);
        setIsModalOpen(false);
        setIsForwarded(true);
        await fetchProposals();
        // Refresh the page to show updated list
        router.refresh();
      } else {
        toast.error('Failed to forward proposal to DLC');
      }
    } catch (error) {
      console.error('Error forwarding proposal:', error);
      toast.error('Failed to forward proposal to DLC');
    }
  };

  const getStatusDisplay = (proposal: Proposal) => {
    // If status is empty, null, or "Not started Yet", show Start button
    if (!proposal.work_status || proposal.work_status === 'Not started Yet' || proposal.work_status === '' || proposal.work_status === null) {
      return (
        <button
          onClick={() => handleStartReview(proposal)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start
        </button>
      );
    }
    // For other statuses, show status text that opens modal on click
    return (
      <span
        onClick={() => handleOpenModal(proposal)}
        className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${proposal.work_status === 'Under Review'
          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          : proposal.work_status === 'Rejected'
            ? 'bg-red-100 text-red-800 hover:bg-red-200'
            : proposal.work_status === 'Correction needed'
              ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
              : proposal.work_status === 'pending at DLC'
                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
      >
        {proposal.work_status}
      </span>
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        RFO / DFO Login - Section 3(2)
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-800 dark:text-white">
                Sr.
              </th>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-800 dark:text-white">
                Proposal Name
              </th>
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-left font-semibold text-gray-800 dark:text-white">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={3} className="border border-gray-300 dark:border-gray-700 px-4 py-8 text-center text-gray-500">
                  No proposals found
                </td>
              </tr>
            ) : (
              proposals.map((proposal, index) => (
                <tr key={proposal.proposal_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-800 dark:text-white">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-800 dark:text-white">
                    Proposal #{proposal.proposal_id} {proposal.land_details ? `- ${proposal.land_details.substring(0, 30)}...` : ''}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-3">
                    {getStatusDisplay(proposal)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Work Under Review Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProposal(null);
          setRejectReason('');
          setSendBackReason('');
        }}
        className="max-w-4xl"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Work Under Review
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side - Proposal Information (Larger) */}
            <div className="space-y-4 md:col-span-1">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Proposal information:
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-3">
                  {selectedProposal && (
                    <>
                      <p className="text-base text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Proposal ID:</span> #{selectedProposal.proposal_id}
                      </p>
                      {selectedProposal.land_details && (
                        <p className="text-base text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Land Details:</span> {selectedProposal.land_details}
                        </p>
                      )}
                      {selectedProposal.taluka_name && (
                        <p className="text-base text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Taluka:</span> {selectedProposal.taluka_name}
                        </p>
                      )}
                      {selectedProposal.village_name && (
                        <p className="text-base text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Village:</span> {selectedProposal.village_name}
                        </p>
                      )}
                      {selectedProposal.gp_name && (
                        <p className="text-base text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Gram Panchayat:</span> {selectedProposal.gp_name}
                        </p>
                      )}
                      {selectedProposal.beneficiaries && (
                        <p className="text-base text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Beneficiaries:</span> {selectedProposal.beneficiaries}
                        </p>
                      )}
                      {selectedProposal.number_of_tree && (
                        <p className="text-base text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Number of Trees:</span> {selectedProposal.number_of_tree}
                        </p>
                      )}
                      {selectedProposal.remarks && (
                        <p className="text-base text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Remarks:</span> {selectedProposal.remarks}
                        </p>
                      )}
                      {selectedProposal.user_name && (
                        <p className="text-base text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Created By:</span> {selectedProposal.user_name}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons - Side by Side */}
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={isForwarded}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Reject
                </button>
                <button
                  onClick={handleSendBack}
                  disabled={isForwarded}
                  className="flex-1 px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Send Back
                </button>

                <button
                  onClick={handleForwardToDLC}
                  disabled={isForwarded}
                  className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Forward Recommendation to DLC
                </button>

              </div>
            </div>

            {/* Right Side - Review Section (Larger) */}
            <div className="space-y-4 md:col-span-1">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Review!
              </h3>
              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={reviewCheckboxes.siteInspection}
                    onChange={(e) =>
                      setReviewCheckboxes({
                        ...reviewCheckboxes,
                        siteInspection: e.target.checked
                      })
                    }
                    disabled={isForwarded}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-base text-gray-700 dark:text-gray-300">
                    Site inspection Completed.
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={reviewCheckboxes.boundaryVerified}
                    onChange={(e) =>
                      setReviewCheckboxes({
                        ...reviewCheckboxes,
                        boundaryVerified: e.target.checked
                      })
                    }
                    disabled={isForwarded}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-base text-gray-700 dark:text-gray-300">
                    Boundary verified
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={reviewCheckboxes.fraCompliance}
                    onChange={(e) =>
                      setReviewCheckboxes({
                        ...reviewCheckboxes,
                        fraCompliance: e.target.checked
                      })
                    }
                    disabled={isForwarded}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-base text-gray-700 dark:text-gray-300">
                    Compliance with FRA Section 3(2) norms
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={reviewCheckboxes.treeCount}
                    onChange={(e) =>
                      setReviewCheckboxes({
                        ...reviewCheckboxes,
                        treeCount: e.target.checked
                      })
                    }
                    disabled={isForwarded}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-base text-gray-700 dark:text-gray-300">
                    Tree count and ecological impact noted.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Forward to DLC Button */}

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
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Reject Work
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Please provide a reason for rejection:
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejection..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white mb-4"
            rows={4}
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Send Back for Correction
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Please provide a reason for sending back:
          </p>
          <textarea
            value={sendBackReason}
            onChange={(e) => setSendBackReason(e.target.value)}
            placeholder="Enter reason for correction needed..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white mb-4"
            rows={4}
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowSendBackModal(false);
                setSendBackReason('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSendBack}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Confirm Send Back
            </button>
          </div>
        </div>
      </Modal>

      {/* Forward to DLC Confirmation Modal */}
      <Modal
        isOpen={showForwardConfirmModal}
        onClose={() => {
          setShowForwardConfirmModal(false);
        }}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Confirm Forward to DLC
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to forward this proposal to DLC? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowForwardConfirmModal(false);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmForwardToDLC}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Confirm Forward
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
