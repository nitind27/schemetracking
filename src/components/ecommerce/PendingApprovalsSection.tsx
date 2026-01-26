"use client";

import React from "react";
import { motion } from "framer-motion";

interface PendingApproval {
  id: string;
  type: string;
  title: string;
  submittedBy: string;
  submittedDate: string;
  priority: "high" | "medium" | "low";
}

const PendingApprovalsSection: React.FC = () => {
  // Mock data - in real app, this would come from API
  const approvals: PendingApproval[] = [
    {
      id: "1",
      type: "Proposal",
      title: "CFR Management Plan - Navapur Taluka",
      submittedBy: "Rajesh Kumar",
      submittedDate: "2024-01-15",
      priority: "high",
    },
    {
      id: "2",
      type: "Document",
      title: "Survey Report - Akkalkuwa",
      submittedBy: "Priya Sharma",
      submittedDate: "2024-01-14",
      priority: "medium",
    },
    {
      id: "3",
      type: "Verification",
      title: "Aadhaar Verification Batch #45",
      submittedBy: "Amit Patel",
      submittedDate: "2024-01-13",
      priority: "high",
    },
    {
      id: "4",
      type: "Proposal",
      title: "Scheme Application - Dhadgaon",
      submittedBy: "Sunita Devi",
      submittedDate: "2024-01-12",
      priority: "low",
    },
  ];

  const getPriorityStyles = (priority: PendingApproval["priority"]) => {
    switch (priority) {
      case "high":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          border: "border-red-300",
        };
      case "medium":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          border: "border-yellow-300",
        };
      case "low":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          border: "border-blue-300",
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-50 p-2 rounded-lg">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Pending Approvals</h3>
            <p className="text-sm text-gray-500">Awaiting your review</p>
          </div>
        </div>
        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
          {approvals.length}
        </span>
      </div>

      <div className="space-y-3">
        {approvals.map((approval, index) => {
          const priorityStyles = getPriorityStyles(approval.priority);
          return (
            <motion.div
              key={approval.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.3 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${priorityStyles.bg} ${priorityStyles.text} ${priorityStyles.border} border`}>
                      {approval.type}
                    </span>
                    <span className={`text-xs font-medium ${priorityStyles.text}`}>
                      {approval.priority.toUpperCase()} Priority
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{approval.title}</h4>
                  <p className="text-sm text-gray-600">Submitted by: {approval.submittedBy}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Review →
                </button>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Submitted on {formatDate(approval.submittedDate)}
                </span>
                <span className="text-xs text-gray-500">
                  {Math.floor((Date.now() - new Date(approval.submittedDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PendingApprovalsSection;

