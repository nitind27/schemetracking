"use client";

import React, { useState, useEffect } from "react";

interface DebugData {
  debug_info: {
    total_active_proposals: number;
    proposals_pending_at_dlc: number;
    proposals_forwarded_to_dlc_users: number;
  };
  all_proposals: any[];
  dlc_proposals: any[];
  forwarded_to_dlc: any[];
}

export const ProposalDebugger: React.FC = () => {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug-proposals');
      if (response.ok) {
        const data = await response.json();
        setDebugData(data);
      }
    } catch (error) {
      console.error('Error fetching debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  if (loading) return <div>Loading debug data...</div>;
  if (!debugData) return <div>No debug data available</div>;

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Proposal Debug Information</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold">Total Active Proposals</h3>
          <p className="text-2xl text-blue-600">{debugData.debug_info.total_active_proposals}</p>
        </div>
        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold">Pending at DLC</h3>
          <p className="text-2xl text-green-600">{debugData.debug_info.proposals_pending_at_dlc}</p>
        </div>
        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold">Forwarded to DLC Users</h3>
          <p className="text-2xl text-purple-600">{debugData.debug_info.proposals_forwarded_to_dlc_users}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold mb-2">Recent Proposals (Last 20)</h3>
          <div className="max-h-60 overflow-y-auto">
            {debugData.all_proposals.map((proposal) => (
              <div key={proposal.proposal_id} className="border-b py-2 text-sm">
                <div><strong>ID:</strong> {proposal.proposal_id}</div>
                <div><strong>Status:</strong> {proposal.work_status || 'NULL'}</div>
                <div><strong>Forward To:</strong> {proposal.forward_to || 'NULL'}</div>
                <div><strong>Updated:</strong> {new Date(proposal.updated_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded">
          <h3 className="font-semibold mb-2">DLC Proposals</h3>
          <div className="max-h-60 overflow-y-auto">
            {debugData.dlc_proposals.length === 0 ? (
              <p className="text-red-500">No proposals found with status "pending at DLC"</p>
            ) : (
              debugData.dlc_proposals.map((proposal) => (
                <div key={proposal.proposal_id} className="border-b py-2 text-sm">
                  <div><strong>ID:</strong> {proposal.proposal_id}</div>
                  <div><strong>Status:</strong> {proposal.work_status}</div>
                  <div><strong>Forward To:</strong> {proposal.forward_to}</div>
                  <div><strong>Updated:</strong> {new Date(proposal.updated_at).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded">
        <h3 className="font-semibold mb-2">Proposals Forwarded to DLC Users (Category 35)</h3>
        <div className="max-h-60 overflow-y-auto">
          {debugData.forwarded_to_dlc.length === 0 ? (
            <p className="text-red-500">No proposals forwarded to category_id = 35 users</p>
          ) : (
            debugData.forwarded_to_dlc.map((proposal) => (
              <div key={proposal.proposal_id} className="border-b py-2 text-sm">
                <div><strong>ID:</strong> {proposal.proposal_id}</div>
                <div><strong>Status:</strong> {proposal.work_status}</div>
                <div><strong>Forward To:</strong> {proposal.forward_to} ({proposal.forward_to_user_name})</div>
                <div><strong>Target Category:</strong> {proposal.forward_to_category}</div>
                <div><strong>Updated:</strong> {new Date(proposal.updated_at).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <button 
        onClick={fetchDebugData}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refresh Debug Data
      </button>
    </div>
  );
};