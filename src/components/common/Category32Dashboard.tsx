"use client";

import React, { useState } from "react";
import Loader from "@/common/Loader";
import { Modal } from "@/components/ui/modal";
import { motion } from "framer-motion";





interface RecentApplication {
  id: number;
  appId: string;
  applicant: string;
  type: string;
  status: string;
  level: string;
  daysPending: number;
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





export default function Category32Dashboard() {
  const [loading] = useState(true);

  const [recentApplications] = useState<RecentApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<RecentApplication | null>(null);



  const getStatusColor = (status: string) => {
    if (status.includes("Approved") || status.includes("मंजूर")) {
      return "bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/40 dark:to-green-800/40 dark:text-green-300 border border-green-300";
    }
    if (status.includes("Pending") || status.includes("प्रलंबित")) {
      return "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900/40 dark:to-yellow-800/40 dark:text-yellow-300 border border-yellow-300";
    }
    if (status.includes("NOC")) {
      return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300 border border-blue-300";
    }
    if (status.includes("Rejected") || status.includes("नाकारले")) {
      return "bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900/40 dark:to-red-800/40 dark:text-red-300 border border-red-300";
    }
    return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-900/40 dark:to-gray-800/40 dark:text-gray-300 border border-gray-300";
  };

  const getDaysPendingColor = (days: number) => {
    if (days === 0) return "bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/40 dark:to-green-800/40 dark:text-green-300 border border-green-300";
    if (days <= 5) return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-900/40 dark:to-gray-800/40 dark:text-gray-300 border border-gray-300";
    if (days <= 10) return "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 dark:from-orange-900/40 dark:to-orange-800/40 dark:text-orange-300 border border-orange-300";
    return "bg-gradient-to-r from-red-100 to-red-200 text-red-800 dark:from-red-900/40 dark:to-red-800/40 dark:text-red-300 border border-red-300";
  };

  const filteredApplications = recentApplications.filter((app) =>
    app.appId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const totalPages = Math.ceil(filteredApplications.length / entriesPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen p-4 md:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Top Navigation Bar */}
      <motion.div
        className="mb-8 relative"
        variants={itemVariants}
      >
    
      </motion.div>

  
      {/* Application Type Metrics Section */}
   

      {/* Recent Applications Table */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
        variants={itemVariants}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Recent Applications (Last 7 Days)
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                <option value={10}>Show 10 entries</option>
                <option value={25}>Show 25 entries</option>
                <option value={50}>Show 50 entries</option>
              </select>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  App ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                  Days Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No applications found
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((app, index) => (
                  <motion.tr
                    key={app.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white">
                      {(currentPage - 1) * entriesPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                      {app.appId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white">
                      {app.applicant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white">
                      {app.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-white">
                      {app.level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getDaysPendingColor(app.daysPending)}`}
                      >
                        {app.daysPending}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {app.status === "Approved" ? (
                        <button
                          className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Finalize
                        </button>
                      ) : app.status === "Pending" ? (
                        <button
                          className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-1"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          Review
                        </button>
                      ) : app.status === "NOC Pending" ? (
                        <button
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Monitor
                        </button>
                      ) : (
                        <button
                          className="px-3 py-1 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors flex items-center gap-1"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Details
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
            {Math.min(currentPage * entriesPerPage, filteredApplications.length)} of{" "}
            {filteredApplications.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? "bg-purple-600 text-white"
                      : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <Modal
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          className="max-w-2xl"
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Application Details
            </h2>
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">App ID:</span>{" "}
                <span className="text-gray-800 dark:text-white">{selectedApplication.appId}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Applicant:</span>{" "}
                <span className="text-gray-800 dark:text-white">{selectedApplication.applicant}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Type:</span>{" "}
                <span className="text-gray-800 dark:text-white">{selectedApplication.type}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Status:</span>{" "}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}
                >
                  {selectedApplication.status}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Level:</span>{" "}
                <span className="text-gray-800 dark:text-white">{selectedApplication.level}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Days Pending:</span>{" "}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getDaysPendingColor(selectedApplication.daysPending)}`}
                >
                  {selectedApplication.daysPending}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
}
