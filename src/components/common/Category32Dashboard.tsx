"use client";

import React, { useState, useEffect } from "react";
import Loader from "@/common/Loader";
import { Modal } from "@/components/ui/modal";
import { motion } from "framer-motion";

interface Proposal {
  proposal_id?: number;
  proposal_category_id?: number;
  work_status?: string;
  forward_to?: string;
  user_category_id?: number;
  user_name?: string;
  taluka_name?: string;
  gp_name?: string;
  village_name?: string;
  beneficiaries?: string;
  number_of_tree?: number;
  land_details?: string;
  remarks?: string;
  pdf?: string;
  created_at?: string;
  updated_at?: string;
}

interface DashboardStats {
  totalApplications: number;
  pending: number;
  nocProcessing: number;
  completed: number;
  jaminApplications: number;
  kulkaydaApplications: number;
  gavthanApplications: number;
  clerkLevel: number;
  tahsildar: number;
  nocDepts: number;
  sdmLevel: number;
}

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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Category32Dashboard() {
  const [loading, setLoading] = useState(true);
  // const [setProposalsData] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pending: 0,
    nocProcessing: 0,
    completed: 0,
    jaminApplications: 0,
    kulkaydaApplications: 0,
    gavthanApplications: 0,
    clerkLevel: 0,
    tahsildar: 0,
    nocDepts: 0,
    sdmLevel: 0,
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<RecentApplication | null>(null);

  useEffect(() => {
    fetchProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/proposals");
      if (response.ok) {
        const data = await response.json();
        // setProposalsData(data);
        calculateStats(data);
        generateRecentApplications(data);
      }
    } catch (error) {
      console.error("Error fetching proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (proposals: Proposal[]) => {
    const total = proposals.length;
    const pending = proposals.filter(
      (p) =>
        !p.work_status ||
        p.work_status === "" ||
        p.work_status === "Not started Yet" ||
        p.work_status === "Pending" ||
        p.work_status === "Under Review"
    ).length;
    
    const nocProcessing = proposals.filter(
      (p) =>
        p.work_status === "NOC Pending" ||
        p.work_status === "Under Review" ||
        p.forward_to?.toLowerCase().includes("noc")
    ).length;
    
    const completed = proposals.filter(
      (p) =>
        p.work_status === "Completed" ||
        p.work_status === "Accepted" ||
        p.work_status === "pending at DLC"
    ).length;

    // Application types based on proposal_category_id or other criteria
    const jaminApplications = proposals.filter(
      (p) => p.proposal_category_id === 1 || p.land_details?.toLowerCase().includes("jamin")
    ).length;
    
    const kulkaydaApplications = proposals.filter(
      (p) => p.proposal_category_id === 2 || p.land_details?.toLowerCase().includes("kulkayda")
    ).length;
    
    const gavthanApplications = proposals.filter(
      (p) => p.proposal_category_id === 3 || p.land_details?.toLowerCase().includes("gavthan")
    ).length;

    // Pendency by level
    const clerkLevel = proposals.filter(
      (p) => p.forward_to?.toLowerCase().includes("clerk") || (!p.forward_to && !p.work_status)
    ).length;
    
    const tahsildar = proposals.filter(
      (p) => p.forward_to?.toLowerCase().includes("tahsildar") || p.work_status === "Pending"
    ).length;
    
    const nocDepts = proposals.filter(
      (p) => p.work_status === "NOC Pending" || p.forward_to?.toLowerCase().includes("noc")
    ).length;
    
    const sdmLevel = proposals.filter(
      (p) => p.forward_to?.toLowerCase().includes("sdm") || p.work_status === "pending at DLC"
    ).length;

    setStats({
      totalApplications: total,
      pending,
      nocProcessing,
      completed,
      jaminApplications,
      kulkaydaApplications,
      gavthanApplications,
      clerkLevel,
      tahsildar,
      nocDepts,
      sdmLevel,
    });
  };

  const generateRecentApplications = (proposals: Proposal[]) => {
    // Get last 7 days applications
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recent = proposals
      .filter((p) => {
        if (!p.created_at) return false;
        const createdDate = new Date(p.created_at);
        return createdDate >= sevenDaysAgo;
      })
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 50)
      .map((p, index) => {
        const getApplicationType = () => {
          if (p.proposal_category_id === 1 || p.land_details?.toLowerCase().includes("jamin")) {
            return "Jamin (Class 2)";
          }
          if (p.proposal_category_id === 2 || p.land_details?.toLowerCase().includes("kulkayda")) {
            return "Kulkayda (Tribal)";
          }
          if (p.proposal_category_id === 3 || p.land_details?.toLowerCase().includes("gavthan")) {
            return "Gavthan";
          }
          return "Jamin (Juni Shart)";
        };

        const getStatus = () => {
          if (!p.work_status || p.work_status === "" || p.work_status === "Not started Yet") {
            return "Pending";
          }
          if (p.work_status === "NOC Pending" || p.forward_to?.toLowerCase().includes("noc")) {
            return "NOC Pending";
          }
          if (p.work_status === "Rejected") {
            return "Rejected";
          }
          if (p.work_status === "Completed" || p.work_status === "Accepted" || p.work_status === "pending at DLC") {
            return "Approved";
          }
          return "Pending";
        };

        const getLevel = () => {
          if (p.forward_to?.toLowerCase().includes("sdm") || p.work_status === "pending at DLC") {
            return "SDM";
          }
          if (p.forward_to?.toLowerCase().includes("tahsildar")) {
            return "Tahsildar";
          }
          if (p.forward_to?.toLowerCase().includes("revenue") || p.forward_to?.toLowerCase().includes("noc")) {
            return "Revenue Dept";
          }
          return "Clerk";
        };

        const getDaysPending = () => {
          if (!p.created_at) return 0;
          const createdDate = new Date(p.created_at);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - createdDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
        };

        return {
          id: p.proposal_id || index + 1,
          appId: `LA-${String(p.proposal_id || index + 1).padStart(5, "0")}`,
          applicant: p.user_name || p.beneficiaries || "Unknown",
          type: getApplicationType(),
          status: getStatus(),
          level: getLevel(),
          daysPending: getDaysPending(),
        };
      });

    setRecentApplications(recent);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
      case "NOC Pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300";
    }
  };

  const getDaysPendingColor = (days: number) => {
    if (days === 0) return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    if (days <= 5) return "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300";
    if (days <= 10) return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
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
    return <Loader />;
  }

  return (
    <motion.div
      className="w-full bg-gray-50 dark:bg-gray-900 min-h-screen p-4 md:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top Navigation Bar */}
      <motion.div
        className="mb-6 flex items-center justify-between"
        variants={itemVariants}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Collector Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold">
              U
            </div>
            <span className="font-medium">User</span>
          </div>
        </div>
      </motion.div>

      {/* Main Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 mb-6">
        {/* User Info Card */}
        <motion.div
          className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-1">User</h2>
          <p className="text-sm text-purple-100">District Collector</p>
        </motion.div>

        {/* Metric Cards */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {stats.totalApplications.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Applications</div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">
            {stats.pending.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            {stats.nocProcessing.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">NOC Processing</div>
        </motion.div>

        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            {stats.completed.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
        </motion.div>
      </div>

      {/* Application Type Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
        <motion.div
          className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold mb-2">{stats.jaminApplications.toLocaleString()}</div>
          <div className="text-lg font-medium mb-1">Jamin Applications</div>
          <div className="text-sm text-purple-100">
            {stats.totalApplications > 0
              ? Math.round((stats.jaminApplications / stats.totalApplications) * 100)
              : 0}% of total
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold mb-2">{stats.kulkaydaApplications.toLocaleString()}</div>
          <div className="text-lg font-medium mb-1">Kulkayda Applications</div>
          <div className="text-sm text-green-100">
            {stats.totalApplications > 0
              ? Math.round((stats.kulkaydaApplications / stats.totalApplications) * 100)
              : 0}% of total
          </div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-lg"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
          </div>
          <div className="text-4xl font-bold mb-2">{stats.gavthanApplications.toLocaleString()}</div>
          <div className="text-lg font-medium mb-1">Gavthan Applications</div>
          <div className="text-sm text-orange-100">
            {stats.totalApplications > 0
              ? Math.round((stats.gavthanApplications / stats.totalApplications) * 100)
              : 0}% of total
          </div>
        </motion.div>
      </div>

      {/* Pendency by Level Section */}
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 mb-6"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Pendency by Level</h3>
          <button
            onClick={fetchProposals}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
              {stats.clerkLevel.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Clerk Level (3x)</div>
          </motion.div>
          <motion.div
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
              {stats.tahsildar.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tahsildar (2x)</div>
          </motion.div>
          <motion.div
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
              {stats.nocDepts.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">NOC Depts</div>
          </motion.div>
          <motion.div
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
              {stats.sdmLevel.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">SDM Level</div>
          </motion.div>
        </div>
      </motion.div>

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
