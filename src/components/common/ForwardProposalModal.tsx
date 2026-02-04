"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { toast } from "react-hot-toast";

interface User {
  user_id: string | number;
  name: string;
  user_category_id: number;
  user_category_name: string;
}

interface ForwardProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: number;
  currentUserCategory: string;
  onForwardSuccess: () => void;
}

export const ForwardProposalModal: React.FC<ForwardProposalModalProps> = ({
  isOpen,
  onClose,
  proposalId,
  currentUserCategory,
  onForwardSuccess
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, currentUserCategory]);

  const fetchUsers = async () => {
    try {
      setFetchingUsers(true);
      const response = await fetch(`/api/users/forward-list?category_id=${currentUserCategory}`);
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleForward = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user to forward to');
      return;
    }

    try {
      setLoading(true);
      
      const selectedUser = users.find(u => u.user_id.toString() === selectedUserId);
      let newStatus = 'Under Review';
      let action = 'forward_to_user';
      
      // Determine status based on target user category
      if (selectedUser?.user_category_id === 35) {
        // Forwarding to DLC
        newStatus = 'pending at DLC';
        action = 'forward_to_dlc';
      } else if (selectedUser?.user_category_id === 36) {
        // Forwarding to Agency
        newStatus = 'Correction needed';
        action = 'send_back_to_agency';
      }

      const response = await fetch('/api/proposals/updatestatus', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposal_id: proposalId,
          work_status: newStatus,
          forward_to: selectedUserId,
          action: action,
          reason: `Forwarded to ${selectedUser?.name} (${selectedUser?.user_category_name})`
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Proposal forwarded to ${selectedUser?.name} successfully`);
        onForwardSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to forward proposal');
      }
    } catch (error) {
      console.error('Error forwarding proposal:', error);
      toast.error('Error forwarding proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUserId('');
    onClose();
  };

  // Group users by category for better display
  const groupedUsers = users.reduce((acc, user) => {
    const categoryName = user.user_category_name || 'Unknown';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Forward Proposal
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose a user to forward this proposal to for further review.
          </p>
        </div>

        {fetchingUsers ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(groupedUsers).length === 0 ? (
              <p className="text-center text-gray-500 py-4">No users available for forwarding</p>
            ) : (
              Object.entries(groupedUsers).map(([categoryName, categoryUsers]) => (
                <div key={categoryName} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    {categoryName}
                  </h4>
                  <div className="space-y-2">
                    {categoryUsers.map((user) => (
                      <label
                        key={user.user_id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                      >
                        <input
                          type="radio"
                          name="selectedUser"
                          value={user.user_id}
                          checked={selectedUserId === user.user_id.toString()}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {user.user_id}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={!selectedUserId || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Forwarding...</span>
              </div>
            ) : (
              'Forward Proposal'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};